import { supabase } from './supabase';

// ============================================================================
// Types
// ============================================================================

export interface SlackMessage {
  text?: string;
  blocks?: SlackBlock[];
  attachments?: SlackAttachment[];
  channel?: string;
  username?: string;
  icon_emoji?: string;
  icon_url?: string;
  unfurl_links?: boolean;
  unfurl_media?: boolean;
}

export interface SlackBlock {
  type: string;
  text?: {
    type: 'plain_text' | 'mrkdwn';
    text: string;
    emoji?: boolean;
  };
  elements?: Array<{
    type: string;
    text?: { type: string; text: string; emoji?: boolean };
    value?: string;
    url?: string;
    action_id?: string;
    style?: 'primary' | 'danger';
  }>;
  accessory?: {
    type: string;
    text?: { type: string; text: string };
    value?: string;
    url?: string;
    action_id?: string;
  };
  fields?: Array<{ type: string; text: string }>;
  image_url?: string;
  alt_text?: string;
}

export interface SlackAttachment {
  color?: string;
  fallback?: string;
  title?: string;
  title_link?: string;
  text?: string;
  fields?: Array<{
    title: string;
    value: string;
    short?: boolean;
  }>;
  footer?: string;
  footer_icon?: string;
  ts?: number;
}

export interface LeadSlackData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  priority: string;
  pipeline_stage: string;
  source_cta?: string;
  household_size?: number;
  ai_score?: number;
  created_at: string;
}

// ============================================================================
// Slack Notification Service
// ============================================================================

class SlackNotificationService {
  private defaultWebhookUrl: string | null = null;
  private baseUrl: string;

  constructor() {
    this.baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://mpb.health';
  }

  // --------------------------------------------------------------------------
  // Configuration
  // --------------------------------------------------------------------------

  /**
   * Get user's Slack configuration
   */
  async getConfiguration(): Promise<{
    enabled: boolean;
    webhookUrl: string | null;
    channel: string | null;
    newLeads: boolean;
    hotLeads: boolean;
    dailySummary: boolean;
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        enabled: false,
        webhookUrl: null,
        channel: null,
        newLeads: true,
        hotLeads: true,
        dailySummary: false,
      };
    }

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('slack_enabled, slack_webhook_url, slack_channel, slack_new_leads, slack_hot_leads, slack_daily_summary')
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return {
        enabled: false,
        webhookUrl: null,
        channel: null,
        newLeads: true,
        hotLeads: true,
        dailySummary: false,
      };
    }

    return {
      enabled: data.slack_enabled,
      webhookUrl: data.slack_webhook_url,
      channel: data.slack_channel,
      newLeads: data.slack_new_leads,
      hotLeads: data.slack_hot_leads,
      dailySummary: data.slack_daily_summary,
    };
  }

  /**
   * Save Slack configuration
   */
  async saveConfiguration(config: {
    enabled: boolean;
    webhookUrl: string;
    channel?: string;
    newLeads?: boolean;
    hotLeads?: boolean;
    dailySummary?: boolean;
  }): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Validate webhook URL
    if (config.enabled && !this.isValidWebhookUrl(config.webhookUrl)) {
      return { success: false, error: 'Invalid Slack webhook URL' };
    }

    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        slack_enabled: config.enabled,
        slack_webhook_url: config.webhookUrl,
        slack_channel: config.channel || null,
        slack_new_leads: config.newLeads ?? true,
        slack_hot_leads: config.hotLeads ?? true,
        slack_daily_summary: config.dailySummary ?? false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Test Slack webhook connection
   */
  async testConnection(webhookUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.sendMessage(webhookUrl, {
        text: '🎉 MPB Health CRM connected successfully!',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*MPB Health CRM Integration*\n\n✅ Your Slack notifications are now set up! You\'ll receive alerts for new leads and important updates.',
            },
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: {
                  type: 'mrkdwn',
                  text: `Connected at ${new Date().toLocaleString()}`,
                },
              },
            ],
          },
        ],
      });

      return result;
    } catch (_error) {
      return { success: false, error: 'Failed to send test message' };
    }
  }

  // --------------------------------------------------------------------------
  // Core Messaging
  // --------------------------------------------------------------------------

  /**
   * Send a message to Slack
   */
  async sendMessage(
    webhookUrl: string,
    message: SlackMessage
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Slack API error:', text);
        return { success: false, error: text };
      }

      // Log the notification
      await this.logNotification('slack', message.text || 'Slack message sent', true);

      return { success: true };
    } catch (error) {
      console.error('Slack send error:', error);
      await this.logNotification('slack', 'Failed to send', false, String(error));
      return { success: false, error: String(error) };
    }
  }

  /**
   * Send message using user's configured webhook
   */
  async sendToConfiguredWebhook(message: SlackMessage): Promise<{ success: boolean; error?: string }> {
    const config = await this.getConfiguration();
    
    if (!config.enabled || !config.webhookUrl) {
      return { success: false, error: 'Slack not configured' };
    }

    return this.sendMessage(config.webhookUrl, message);
  }

  // --------------------------------------------------------------------------
  // Lead Notifications
  // --------------------------------------------------------------------------

  /**
   * Send new lead notification to Slack
   */
  async notifyNewLead(lead: LeadSlackData): Promise<{ success: boolean; error?: string }> {
    const config = await this.getConfiguration();
    
    if (!config.enabled || !config.webhookUrl) {
      return { success: false, error: 'Slack not configured' };
    }

    if (!config.newLeads) {
      return { success: false, error: 'New lead notifications disabled' };
    }

    const isHot = lead.priority === 'high' || lead.priority === 'urgent' || (lead.ai_score && lead.ai_score >= 70);
    
    if (isHot && !config.hotLeads) {
      // If hot lead notifications specifically disabled
    }

    const priorityEmoji = this.getPriorityEmoji(lead.priority);
    const priorityColor = this.getPriorityColor(lead.priority);

    const message: SlackMessage = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: isHot ? '🔥 Hot Lead Alert!' : '🎯 New Lead',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Name*\n${lead.first_name} ${lead.last_name}`,
            },
            {
              type: 'mrkdwn',
              text: `*Priority*\n${priorityEmoji} ${lead.priority.toUpperCase()}`,
            },
            {
              type: 'mrkdwn',
              text: `*Phone*\n<tel:${lead.phone}|${lead.phone}>`,
            },
            {
              type: 'mrkdwn',
              text: `*Email*\n<mailto:${lead.email}|${lead.email}>`,
            },
          ],
        },
      ],
      attachments: [
        {
          color: priorityColor,
          fields: [
            {
              title: 'Source',
              value: lead.source_cta || 'Website',
              short: true,
            },
            {
              title: 'Stage',
              value: lead.pipeline_stage,
              short: true,
            },
            ...(lead.household_size ? [{
              title: 'Household Size',
              value: String(lead.household_size),
              short: true,
            }] : []),
            ...(lead.ai_score ? [{
              title: 'AI Score',
              value: `${lead.ai_score}/100`,
              short: true,
            }] : []),
          ],
          footer: 'MPB Health CRM',
          footer_icon: `${this.baseUrl}/assets/mpb-logo.png`,
          ts: Math.floor(new Date(lead.created_at).getTime() / 1000),
        },
      ],
    };

    // Add action buttons
    message.blocks!.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '👤 View Lead',
            emoji: true,
          },
          url: `${this.baseUrl}/admin/crm/leads/${lead.id}`,
          action_id: 'view_lead',
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '📞 Call Now',
            emoji: true,
          },
          url: `tel:${lead.phone}`,
          action_id: 'call_lead',
          style: 'primary',
        },
      ],
    });

    return this.sendMessage(config.webhookUrl, message);
  }

  /**
   * Send task reminder to Slack
   */
  async notifyTaskDue(task: {
    id: string;
    title: string;
    lead_id: string;
    lead_name: string;
    due_date: string;
    is_overdue: boolean;
  }): Promise<{ success: boolean; error?: string }> {
    const config = await this.getConfiguration();
    
    if (!config.enabled || !config.webhookUrl) {
      return { success: false, error: 'Slack not configured' };
    }

    const emoji = task.is_overdue ? '⚠️' : '⏰';
    const color = task.is_overdue ? '#dc2626' : '#f59e0b';

    const message: SlackMessage = {
      text: `${emoji} Task ${task.is_overdue ? 'Overdue' : 'Due'}: ${task.title}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${emoji} *Task ${task.is_overdue ? 'Overdue' : 'Due Soon'}*\n\n*${task.title}*\n\nLead: ${task.lead_name}\nDue: ${new Date(task.due_date).toLocaleString()}`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Task',
                emoji: true,
              },
              url: `${this.baseUrl}/admin/crm/leads/${task.lead_id}`,
              action_id: 'view_task',
            },
          ],
        },
      ],
      attachments: [{ color }],
    };

    return this.sendMessage(config.webhookUrl, message);
  }

  /**
   * Send daily summary to Slack
   */
  async sendDailySummary(summary: {
    newLeads: number;
    hotLeads: number;
    tasksCompleted: number;
    tasksDue: number;
    conversions: number;
    topLead?: { name: string; score: number };
  }): Promise<{ success: boolean; error?: string }> {
    const config = await this.getConfiguration();
    
    if (!config.enabled || !config.webhookUrl || !config.dailySummary) {
      return { success: false, error: 'Daily summary not configured' };
    }

    const message: SlackMessage = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📊 Daily CRM Summary',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*New Leads*\n${summary.newLeads}`,
            },
            {
              type: 'mrkdwn',
              text: `*Hot Leads*\n🔥 ${summary.hotLeads}`,
            },
            {
              type: 'mrkdwn',
              text: `*Tasks Completed*\n✅ ${summary.tasksCompleted}`,
            },
            {
              type: 'mrkdwn',
              text: `*Tasks Due Today*\n⏰ ${summary.tasksDue}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Conversions*: ${summary.conversions} leads converted 🎉`,
          },
        },
      ],
    };

    if (summary.topLead) {
      message.blocks!.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*🌟 Top Lead*: ${summary.topLead.name} (Score: ${summary.topLead.score})`,
        },
      });
    }

    message.blocks!.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Open CRM Dashboard',
            emoji: true,
          },
          url: `${this.baseUrl}/admin/crm`,
          action_id: 'open_dashboard',
          style: 'primary',
        },
      ],
    });

    return this.sendMessage(config.webhookUrl, message);
  }

  // --------------------------------------------------------------------------
  // Utility Methods
  // --------------------------------------------------------------------------

  private isValidWebhookUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.hostname.includes('hooks.slack.com') || 
             parsed.hostname.includes('slack.com');
    } catch {
      return false;
    }
  }

  private getPriorityEmoji(priority: string): string {
    switch (priority) {
      case 'urgent': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      default: return '🟢';
    }
  }

  private getPriorityColor(priority: string): string {
    switch (priority) {
      case 'urgent': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#ca8a04';
      default: return '#16a34a';
    }
  }

  private async logNotification(
    channel: string,
    title: string,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('notification_log').insert({
      user_id: user?.id,
      channel,
      notification_type: 'slack_message',
      title,
      status: success ? 'sent' : 'failed',
      error_message: errorMessage,
      sent_at: success ? new Date().toISOString() : null,
    });
  }
}

export const slackNotificationService = new SlackNotificationService();

