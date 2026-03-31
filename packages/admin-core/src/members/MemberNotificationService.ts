import { supabase } from '@mpbhealth/database';

// ── Types ──────────────────────────────────────────────────────────

export type AccountEventType =
  | 'membership_status_change'
  | 'profile_update'
  | 'billing_update'
  | 'payment_status_change'
  | 'plan_change'
  | 'eligibility_change'
  | 'dependent_change'
  | 'document_update'
  | 'coverage_change'
  | 'claim_status_change'
  | 'advisor_assignment'
  | 'account_resolution'
  | 'contact_info_change'
  | 'general_update';

export type ActorDepartment =
  | 'billing'
  | 'operations'
  | 'member_services'
  | 'enrollment'
  | 'customer_support'
  | 'eligibility'
  | 'concierge'
  | 'administration';

export interface MemberAccountEvent {
  id: string;
  member_id: string;
  actor_user_id: string;
  actor_department: string;
  event_type: AccountEventType;
  entity_type: string | null;
  entity_id: string | null;
  payload_summary: Record<string, unknown>;
  changes: Record<string, unknown>;
  member_notification_id: string | null;
  should_notify_member: boolean;
  notification_generated: boolean;
  created_at: string;
}

export interface MemberNotificationAdmin {
  id: string;
  member_id: string;
  notification_type: string;
  title: string;
  message: string;
  priority: string;
  is_read: boolean;
  read_at: string | null;
  action_url: string | null;
  actor_department: string | null;
  category: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  source_event_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface NotificationRule {
  id: string;
  event_type: string;
  department: string;
  is_enabled: boolean;
  notification_type: string;
  title_template: string;
  message_template: string;
  priority: string;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAccountEventInput {
  member_id: string;
  actor_user_id: string;
  actor_department: ActorDepartment | string;
  event_type: AccountEventType;
  entity_type?: string;
  entity_id?: string;
  payload_summary?: Record<string, unknown>;
  changes?: Record<string, unknown>;
  should_notify_member?: boolean;
}

export interface AccountEventFilters {
  member_id?: string;
  actor_user_id?: string;
  actor_department?: string;
  event_type?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}

export interface NotificationFilters {
  member_id?: string;
  notification_type?: string;
  category?: string;
  is_read?: boolean;
  priority?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  by_category: Record<string, number>;
  by_department: Record<string, number>;
  recent_24h: number;
}

// ── Department labels ──────────────────────────────────────────────

const DEPARTMENT_LABELS: Record<string, string> = {
  billing: 'Billing Team',
  operations: 'Operations Team',
  member_services: 'Member Services Team',
  enrollment: 'Enrollment Team',
  customer_support: 'Customer Support Team',
  eligibility: 'Eligibility Team',
  concierge: 'Concierge Team',
  administration: 'Administration Team',
};

export function getDepartmentLabel(department: string): string {
  return DEPARTMENT_LABELS[department] || department.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) + ' Team';
}

export const DEPARTMENT_OPTIONS: { value: string; label: string }[] = Object.entries(DEPARTMENT_LABELS).map(
  ([value, label]) => ({ value, label })
);

export const EVENT_TYPE_LABELS: Record<AccountEventType, string> = {
  membership_status_change: 'Membership Status Change',
  profile_update: 'Profile Update',
  billing_update: 'Billing Update',
  payment_status_change: 'Payment Status Change',
  plan_change: 'Plan Change',
  eligibility_change: 'Eligibility Change',
  dependent_change: 'Dependent Change',
  document_update: 'Document Update',
  coverage_change: 'Coverage Change',
  claim_status_change: 'Claim Status Change',
  advisor_assignment: 'Advisor Assignment',
  account_resolution: 'Account Resolution',
  contact_info_change: 'Contact Info Change',
  general_update: 'General Update',
};

// ── Service ────────────────────────────────────────────────────────

export class MemberNotificationService {

  /**
   * Create an account event. The DB trigger will auto-generate a
   * member-facing notification if should_notify_member is true and
   * a matching rule exists.
   */
  async createAccountEvent(input: CreateAccountEventInput): Promise<MemberAccountEvent> {
    const { data, error } = await supabase
      .from('member_account_events')
      .insert({
        member_id: input.member_id,
        actor_user_id: input.actor_user_id,
        actor_department: input.actor_department,
        event_type: input.event_type,
        entity_type: input.entity_type || null,
        entity_id: input.entity_id || null,
        payload_summary: input.payload_summary || {},
        changes: input.changes || {},
        should_notify_member: input.should_notify_member ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getAccountEvents(filters?: AccountEventFilters): Promise<{ events: MemberAccountEvent[]; total: number }> {
    let query = supabase
      .from('member_account_events')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters?.member_id) query = query.eq('member_id', filters.member_id);
    if (filters?.actor_user_id) query = query.eq('actor_user_id', filters.actor_user_id);
    if (filters?.actor_department) query = query.eq('actor_department', filters.actor_department);
    if (filters?.event_type) query = query.eq('event_type', filters.event_type);
    if (filters?.from_date) query = query.gte('created_at', filters.from_date);
    if (filters?.to_date) query = query.lte('created_at', filters.to_date);

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;
    return { events: data || [], total: count || 0 };
  }

  async getMemberNotifications(filters?: NotificationFilters): Promise<{ notifications: MemberNotificationAdmin[]; total: number }> {
    let query = supabase
      .from('member_notifications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters?.member_id) query = query.eq('member_id', filters.member_id);
    if (filters?.notification_type) query = query.eq('notification_type', filters.notification_type);
    if (filters?.category) query = query.eq('category', filters.category);
    if (filters?.is_read !== undefined) query = query.eq('is_read', filters.is_read);
    if (filters?.priority) query = query.eq('priority', filters.priority);
    if (filters?.from_date) query = query.gte('created_at', filters.from_date);
    if (filters?.to_date) query = query.lte('created_at', filters.to_date);

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;
    return { notifications: data || [], total: count || 0 };
  }

  async getNotificationStats(memberId?: string): Promise<NotificationStats> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    let baseQuery = supabase.from('member_notifications').select('id, is_read, category, actor_department, created_at');
    if (memberId) baseQuery = baseQuery.eq('member_id', memberId);

    const { data, error } = await baseQuery;
    if (error) throw error;

    const notifications = data || [];
    const stats: NotificationStats = {
      total: notifications.length,
      unread: 0,
      by_category: {},
      by_department: {},
      recent_24h: 0,
    };

    for (const n of notifications) {
      if (!n.is_read) stats.unread++;
      if (n.category) stats.by_category[n.category] = (stats.by_category[n.category] || 0) + 1;
      if (n.actor_department) stats.by_department[n.actor_department] = (stats.by_department[n.actor_department] || 0) + 1;
      if (n.created_at >= yesterday) stats.recent_24h++;
    }

    return stats;
  }

  // ── Notification Rules ─────────────────────────────────────────

  async getRules(): Promise<NotificationRule[]> {
    const { data, error } = await supabase
      .from('member_notification_rules')
      .select('*')
      .order('event_type');

    if (error) throw error;
    return data || [];
  }

  async updateRule(ruleId: string, updates: Partial<Pick<NotificationRule, 'is_enabled' | 'title_template' | 'message_template' | 'priority'>>): Promise<NotificationRule> {
    const { data, error } = await supabase
      .from('member_notification_rules')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', ruleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createRule(rule: Omit<NotificationRule, 'id' | 'created_at' | 'updated_at'>): Promise<NotificationRule> {
    const { data, error } = await supabase
      .from('member_notification_rules')
      .insert(rule)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteRule(ruleId: string): Promise<void> {
    const { error } = await supabase
      .from('member_notification_rules')
      .delete()
      .eq('id', ruleId);

    if (error) throw error;
  }
}

export const memberNotificationService = new MemberNotificationService();
