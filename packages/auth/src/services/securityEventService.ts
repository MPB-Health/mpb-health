import { supabase } from '@mpbhealth/database';

export type SecurityEventType =
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'mfa_enabled'
  | 'mfa_disabled'
  | 'mfa_verified'
  | 'mfa_failed'
  | 'password_changed'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | 'account_locked'
  | 'account_unlocked'
  | 'role_changed'
  | 'session_created'
  | 'session_expired'
  | 'session_revoked'
  | 'phi_accessed'
  | 'phi_modified'
  | 'phi_exported'
  | 'suspicious_activity'
  | 'security_violation'
  | 'admin_action';

export type SecurityEventSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityEvent {
  id?: string;
  user_id?: string;
  event_type: SecurityEventType;
  event_severity: SecurityEventSeverity;
  ip_address?: string;
  user_agent?: string;
  event_data?: Record<string, any>;
  timestamp?: Date;
}

export interface SecurityAlert {
  id: string;
  event: SecurityEvent;
  triggerReason: string;
  requiresAction: boolean;
}

class SecurityEventService {
  async logEvent(event: SecurityEvent): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('auth_security_events')
        .insert({
          user_id: event.user_id || user?.id,
          event_type: event.event_type,
          event_severity: event.event_severity,
          ip_address: event.ip_address,
          user_agent: event.user_agent,
          event_data: event.event_data || {},
        })
        .select()
        .single();

      if (error) {
        console.error('Error logging security event:', error);
        return null;
      }

      if (event.event_severity === 'critical' || event.event_severity === 'high') {
        await this.sendSecurityAlert(event);
      }

      return data.id;
    } catch (error) {
      console.error('Failed to log security event:', error);
      return null;
    }
  }

  async logLoginSuccess(userId: string, ipAddress: string, userAgent: string): Promise<void> {
    await this.logEvent({
      user_id: userId,
      event_type: 'login_success',
      event_severity: 'low',
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  }

  async logLoginFailure(
    email: string,
    ipAddress: string,
    userAgent: string,
    reason: string
  ): Promise<void> {
    await this.logEvent({
      event_type: 'login_failure',
      event_severity: 'medium',
      ip_address: ipAddress,
      user_agent: userAgent,
      event_data: { email, reason },
    });
  }

  async logMFAEvent(
    userId: string,
    eventType: 'mfa_enabled' | 'mfa_disabled' | 'mfa_verified' | 'mfa_failed',
    method?: string
  ): Promise<void> {
    await this.logEvent({
      user_id: userId,
      event_type: eventType,
      event_severity: eventType === 'mfa_failed' ? 'high' : 'medium',
      event_data: { method },
    });
  }

  async logPasswordChange(userId: string, ipAddress: string): Promise<void> {
    await this.logEvent({
      user_id: userId,
      event_type: 'password_changed',
      event_severity: 'medium',
      ip_address: ipAddress,
    });
  }

  async logAccountLock(identifier: string, reason: string): Promise<void> {
    await this.logEvent({
      event_type: 'account_locked',
      event_severity: 'high',
      event_data: { identifier, reason },
    });
  }

  async logPHIAccess(
    userId: string,
    tableName: string,
    recordId: string,
    operation: string
  ): Promise<void> {
    await this.logEvent({
      user_id: userId,
      event_type: 'phi_accessed',
      event_severity: 'medium',
      event_data: { tableName, recordId, operation },
    });
  }

  async logSuspiciousActivity(
    userId: string | undefined,
    ipAddress: string,
    reason: string,
    details: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      user_id: userId,
      event_type: 'suspicious_activity',
      event_severity: 'high',
      ip_address: ipAddress,
      event_data: { reason, ...details },
    });
  }

  async getUserSecurityEvents(
    userId: string,
    limit: number = 50
  ): Promise<SecurityEvent[]> {
    try {
      const { data, error } = await supabase
        .from('auth_security_events')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user security events:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch user security events:', error);
      return [];
    }
  }

  async getRecentSecurityEvents(
    severity?: SecurityEventSeverity,
    limit: number = 100
  ): Promise<SecurityEvent[]> {
    try {
      let query = supabase
        .from('auth_security_events')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (severity) {
        query = query.eq('event_severity', severity);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching security events:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch security events:', error);
      return [];
    }
  }

  async detectAnomalies(userId: string): Promise<SecurityAlert[]> {
    try {
      const recentEvents = await this.getUserSecurityEvents(userId, 100);
      const alerts: SecurityAlert[] = [];

      const recentLogins = recentEvents.filter(e => e.event_type === 'login_success');
      if (recentLogins.length >= 2) {
        const locations = recentLogins
          .map(e => e.ip_address)
          .filter((ip, index, arr) => arr.indexOf(ip) === index);

        if (locations.length > 3) {
          alerts.push({
            id: crypto.randomUUID(),
            event: recentLogins[0],
            triggerReason: 'Multiple login locations detected',
            requiresAction: true,
          });
        }
      }

      const failedMFA = recentEvents.filter(
        e => e.event_type === 'mfa_failed' &&
        new Date(e.timestamp!).getTime() > Date.now() - 60 * 60 * 1000
      );

      if (failedMFA.length >= 3) {
        alerts.push({
          id: crypto.randomUUID(),
          event: failedMFA[0],
          triggerReason: 'Multiple MFA failures in short time period',
          requiresAction: true,
        });
      }

      const recentPHIAccess = recentEvents.filter(
        e => e.event_type === 'phi_accessed' &&
        new Date(e.timestamp!).getTime() > Date.now() - 60 * 60 * 1000
      );

      if (recentPHIAccess.length >= 20) {
        alerts.push({
          id: crypto.randomUUID(),
          event: recentPHIAccess[0],
          triggerReason: 'Unusual volume of PHI access detected',
          requiresAction: true,
        });
      }

      return alerts;
    } catch (error) {
      console.error('Failed to detect anomalies:', error);
      return [];
    }
  }

  async getSecurityMetrics(startDate: Date, endDate: Date): Promise<{
    totalEvents: number;
    eventsBySeverity: { [key: string]: number };
    eventsByType: { [key: string]: number };
    topUsers: { user_id: string; eventCount: number }[];
  }> {
    try {
      const { data, error } = await supabase
        .from('auth_security_events')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      if (error || !data) {
        console.error('Error fetching security metrics:', error);
        return {
          totalEvents: 0,
          eventsBySeverity: {},
          eventsByType: {},
          topUsers: [],
        };
      }

      const totalEvents = data.length;

      const eventsBySeverity = data.reduce((acc: { [key: string]: number }, event) => {
        acc[event.event_severity] = (acc[event.event_severity] || 0) + 1;
        return acc;
      }, {});

      const eventsByType = data.reduce((acc: { [key: string]: number }, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1;
        return acc;
      }, {});

      const userEvents = data
        .filter(e => e.user_id)
        .reduce((acc: { [key: string]: number }, event) => {
          acc[event.user_id!] = (acc[event.user_id!] || 0) + 1;
          return acc;
        }, {});

      const topUsers = Object.entries(userEvents)
        .map(([user_id, eventCount]) => ({ user_id, eventCount: eventCount as number }))
        .sort((a, b) => b.eventCount - a.eventCount)
        .slice(0, 10);

      return {
        totalEvents,
        eventsBySeverity,
        eventsByType,
        topUsers,
      };
    } catch (error) {
      console.error('Failed to get security metrics:', error);
      return {
        totalEvents: 0,
        eventsBySeverity: {},
        eventsByType: {},
        topUsers: [],
      };
    }
  }

  async verifyAuditLogIntegrity(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('auth_security_events')
        .select('id, event_type, timestamp, event_data, hash_chain')
        .order('timestamp', { ascending: true });

      if (error || !data || data.length === 0) {
        return true;
      }

      for (let i = 1; i < data.length; i++) {
        const previous = data[i - 1];
        const current = data[i];

        const expectedHash = await this.calculateHash(
          previous.hash_chain || '',
          current.id,
          current.event_type,
          current.timestamp,
          JSON.stringify(current.event_data)
        );

        if (expectedHash !== current.hash_chain) {
          console.error('Audit log integrity violation detected at event:', current.id);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to verify audit log integrity:', error);
      return false;
    }
  }

  private async calculateHash(...values: string[]): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(values.join(''));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    console.warn('SECURITY ALERT:', {
      severity: event.event_severity,
      type: event.event_type,
      userId: event.user_id,
      timestamp: new Date(),
      details: event.event_data,
    });

    // Send to configured webhooks
    await this.sendWebhookAlerts(event);
  }

  // ============================================================================
  // Webhook Alerting
  // ============================================================================

  /**
   * Get all configured webhooks
   */
  async getWebhooks(): Promise<SecurityAlertWebhook[]> {
    try {
      const { data, error } = await supabase
        .from('security_alert_webhooks')
        .select('*')
        .eq('enabled', true);

      if (error) {
        console.error('Error fetching webhooks:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
      return [];
    }
  }

  /**
   * Add a new webhook configuration
   */
  async addWebhook(webhook: Omit<SecurityAlertWebhook, 'id' | 'created_at'>): Promise<SecurityAlertWebhook | null> {
    try {
      const { data, error } = await supabase
        .from('security_alert_webhooks')
        .insert(webhook)
        .select()
        .single();

      if (error) {
        console.error('Error adding webhook:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to add webhook:', error);
      return null;
    }
  }

  /**
   * Update a webhook configuration
   */
  async updateWebhook(
    id: string,
    updates: Partial<Omit<SecurityAlertWebhook, 'id' | 'created_at'>>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('security_alert_webhooks')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating webhook:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to update webhook:', error);
      return false;
    }
  }

  /**
   * Delete a webhook configuration
   */
  async deleteWebhook(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('security_alert_webhooks')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting webhook:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      return false;
    }
  }

  /**
   * Send alerts to all configured webhooks
   */
  private async sendWebhookAlerts(event: SecurityEvent): Promise<void> {
    try {
      const webhooks = await this.getWebhooks();

      for (const webhook of webhooks) {
        // Check severity threshold
        if (!this.shouldAlertForSeverity(webhook.min_severity, event.event_severity)) {
          continue;
        }

        // Check event type filter if configured
        if (webhook.event_types && webhook.event_types.length > 0) {
          if (!webhook.event_types.includes(event.event_type)) {
            continue;
          }
        }

        // Apply rate limiting to prevent notification floods
        if (await this.isAlertRateLimited(webhook.id)) {
          continue;
        }

        // Send based on channel type
        try {
          switch (webhook.channel_type) {
            case 'slack':
              await this.sendSlackAlert(webhook, event);
              break;
            case 'webhook':
            default:
              await this.sendGenericWebhookAlert(webhook, event);
              break;
          }

          // Record successful alert
          await this.recordAlertSent(webhook.id, event);
        } catch (error) {
          console.error(`Failed to send alert to webhook ${webhook.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error sending webhook alerts:', error);
    }
  }

  /**
   * Check if a severity level should trigger an alert
   */
  private shouldAlertForSeverity(
    minSeverity: SecurityEventSeverity,
    eventSeverity: SecurityEventSeverity
  ): boolean {
    const severityLevels: SecurityEventSeverity[] = ['low', 'medium', 'high', 'critical'];
    const minIndex = severityLevels.indexOf(minSeverity);
    const eventIndex = severityLevels.indexOf(eventSeverity);
    return eventIndex >= minIndex;
  }

  /**
   * Check if alert is rate limited (prevent floods)
   */
  private async isAlertRateLimited(webhookId: string): Promise<boolean> {
    try {
      // Check for recent alerts (max 10 per minute per webhook)
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

      const { count, error } = await supabase
        .from('security_alert_log')
        .select('*', { count: 'exact', head: true })
        .eq('webhook_id', webhookId)
        .gte('sent_at', oneMinuteAgo);

      if (error) {
        return false; // Allow on error
      }

      return (count || 0) >= 10;
    } catch {
      return false;
    }
  }

  /**
   * Record a sent alert for rate limiting
   */
  private async recordAlertSent(webhookId: string, event: SecurityEvent): Promise<void> {
    try {
      await supabase.from('security_alert_log').insert({
        webhook_id: webhookId,
        event_type: event.event_type,
        event_severity: event.event_severity,
        sent_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error recording alert:', error);
    }
  }

  /**
   * Send alert to Slack webhook
   */
  private async sendSlackAlert(
    webhook: SecurityAlertWebhook,
    event: SecurityEvent
  ): Promise<void> {
    const severityEmoji: Record<SecurityEventSeverity, string> = {
      low: ':information_source:',
      medium: ':warning:',
      high: ':rotating_light:',
      critical: ':fire:',
    };

    const severityColor: Record<SecurityEventSeverity, string> = {
      low: '#36a64f',
      medium: '#ffc107',
      high: '#ff9800',
      critical: '#dc3545',
    };

    const payload = {
      attachments: [
        {
          color: severityColor[event.event_severity],
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: `${severityEmoji[event.event_severity]} Security Alert: ${event.event_type.replace(/_/g, ' ').toUpperCase()}`,
                emoji: true,
              },
            },
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*Severity:*\n${event.event_severity.toUpperCase()}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Event Type:*\n${event.event_type}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*User ID:*\n${event.user_id || 'N/A'}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*IP Address:*\n${event.ip_address || 'N/A'}`,
                },
              ],
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Details:*\n\`\`\`${JSON.stringify(event.event_data || {}, null, 2)}\`\`\``,
              },
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `MPB Health Security | ${new Date().toISOString()}`,
                },
              ],
            },
          ],
        },
      ],
    };

    await fetch(webhook.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  /**
   * Send alert to generic webhook
   */
  private async sendGenericWebhookAlert(
    webhook: SecurityAlertWebhook,
    event: SecurityEvent
  ): Promise<void> {
    const payload = {
      type: 'security_alert',
      event: {
        id: event.id,
        type: event.event_type,
        severity: event.event_severity,
        user_id: event.user_id,
        ip_address: event.ip_address,
        user_agent: event.user_agent,
        data: event.event_data,
        timestamp: event.timestamp || new Date().toISOString(),
      },
      source: 'mpbhealth',
      sent_at: new Date().toISOString(),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add custom headers if configured
    if (webhook.headers) {
      Object.assign(headers, webhook.headers);
    }

    await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  }

  // ============================================================================
  // Alert Rules
  // ============================================================================

  /**
   * Check for alert-triggering patterns
   * Called periodically or after certain events
   */
  async checkAlertRules(userId?: string): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];

    try {
      // Rule 1: Multiple MFA failures (5+ in 1 hour)
      const mfaAlerts = await this.checkMultipleMFAFailures(userId);
      alerts.push(...mfaAlerts);

      // Rule 2: Account lockout
      const lockoutAlerts = await this.checkAccountLockouts();
      alerts.push(...lockoutAlerts);

      // Rule 3: Unusual PHI access volume (20+ in 1 hour)
      if (userId) {
        const phiAlerts = await this.checkUnusualPHIAccess(userId);
        alerts.push(...phiAlerts);
      }

      // Rule 4: Multiple login failures from same IP
      const loginAlerts = await this.checkMultipleLoginFailures();
      alerts.push(...loginAlerts);

    } catch (error) {
      console.error('Error checking alert rules:', error);
    }

    return alerts;
  }

  private async checkMultipleMFAFailures(userId?: string): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    let query = supabase
      .from('auth_security_events')
      .select('*')
      .eq('event_type', 'mfa_failed')
      .gte('timestamp', oneHourAgo);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (!error && data && data.length >= 5) {
      alerts.push({
        id: crypto.randomUUID(),
        event: data[0],
        triggerReason: `${data.length} MFA failures in the past hour`,
        requiresAction: true,
      });
    }

    return alerts;
  }

  private async checkAccountLockouts(): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('auth_security_events')
      .select('*')
      .eq('event_type', 'account_locked')
      .gte('timestamp', oneHourAgo);

    if (!error && data) {
      for (const event of data) {
        alerts.push({
          id: crypto.randomUUID(),
          event,
          triggerReason: 'Account locked due to security policy',
          requiresAction: true,
        });
      }
    }

    return alerts;
  }

  private async checkUnusualPHIAccess(userId: string): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('auth_security_events')
      .select('*')
      .eq('user_id', userId)
      .eq('event_type', 'phi_accessed')
      .gte('timestamp', oneHourAgo);

    if (!error && data && data.length >= 20) {
      alerts.push({
        id: crypto.randomUUID(),
        event: data[0],
        triggerReason: `Unusual PHI access volume: ${data.length} records in the past hour`,
        requiresAction: true,
      });
    }

    return alerts;
  }

  private async checkMultipleLoginFailures(): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('auth_security_events')
      .select('*')
      .eq('event_type', 'login_failure')
      .gte('timestamp', fifteenMinutesAgo);

    if (!error && data) {
      // Group by IP address
      const byIP: Record<string, SecurityEvent[]> = {};
      for (const event of data) {
        const ip = event.ip_address || 'unknown';
        if (!byIP[ip]) {
          byIP[ip] = [];
        }
        byIP[ip].push(event);
      }

      // Alert if 10+ failures from same IP
      for (const [ip, events] of Object.entries(byIP)) {
        if (events.length >= 10) {
          alerts.push({
            id: crypto.randomUUID(),
            event: events[0],
            triggerReason: `${events.length} login failures from IP ${ip} in the past 15 minutes`,
            requiresAction: true,
          });
        }
      }
    }

    return alerts;
  }
}

// ============================================================================
// Types for Webhook Configuration
// ============================================================================

export interface SecurityAlertWebhook {
  id: string;
  name: string;
  url: string;
  channel_type: 'slack' | 'webhook';
  min_severity: SecurityEventSeverity;
  enabled: boolean;
  event_types?: SecurityEventType[];
  headers?: Record<string, string>;
  created_at?: string;
}

export const securityEventService = new SecurityEventService();
