import { supabase } from './supabase';

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
  }
}

export const securityEventService = new SecurityEventService();
