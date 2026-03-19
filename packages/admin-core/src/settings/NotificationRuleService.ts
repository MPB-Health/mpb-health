import { supabase } from '@mpbhealth/database';

export interface NotificationRule {
  id: string;
  user_id: string;
  email_enabled: boolean;
  email_new_leads: boolean;
  email_hot_leads: boolean;
  email_task_reminders: boolean;
  email_daily_digest: boolean;
  email_weekly_summary: boolean;
  push_enabled: boolean;
  push_new_leads: boolean;
  push_hot_leads: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationEventLog {
  id: string;
  user_id: string;
  event_type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationRuleStats {
  totalRules: number;
  emailEnabled: number;
  pushEnabled: number;
  recentEvents: number;
}

export type NotificationRuleUpdateInput = Partial<Pick<NotificationRule, 'email_enabled' | 'email_new_leads' | 'email_hot_leads' | 'email_task_reminders' | 'email_daily_digest' | 'email_weekly_summary' | 'push_enabled' | 'push_new_leads' | 'push_hot_leads'>>;

export class NotificationRuleService {
  async getAllRules(): Promise<NotificationRule[]> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as NotificationRule[];
  }

  async getRuleByUserId(userId: string): Promise<NotificationRule | null> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) return null;
    return data as NotificationRule;
  }

  async updateRule(id: string, input: NotificationRuleUpdateInput): Promise<NotificationRule> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as NotificationRule;
  }

  async getRecentEvents(limit = 50): Promise<NotificationEventLog[]> {
    const { data, error } = await supabase
      .from('notification_events')
      .select('id, user_id, event_type, title, body, is_read, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []) as NotificationEventLog[];
  }

  async getEventTypes(): Promise<string[]> {
    const { data, error } = await supabase
      .from('notification_events')
      .select('event_type')
      .limit(500);
    if (error) return [];
    return [...new Set((data || []).map((d: { event_type: string }) => d.event_type).filter(Boolean))];
  }

  async getStats(): Promise<NotificationRuleStats> {
    const rules = await this.getAllRules();
    const { count } = await supabase
      .from('notification_events')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    return {
      totalRules: rules.length,
      emailEnabled: rules.filter(r => r.email_enabled).length,
      pushEnabled: rules.filter(r => r.push_enabled).length,
      recentEvents: count || 0,
    };
  }
}

export const notificationRuleService = new NotificationRuleService();
