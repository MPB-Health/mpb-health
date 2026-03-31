import { supabase } from '@mpbhealth/database';
import type { AccountEventType, ActorDepartment } from './MemberNotificationService';

export interface NotificationContext {
  actor_user_id: string;
  actor_department: ActorDepartment | string;
  event_type: AccountEventType;
  actor_email?: string;
  should_notify_member?: boolean;
}

export interface MemberProfile {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  email?: string;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  membership_number: string | null;
  membership_status: 'active' | 'pending' | 'suspended' | 'cancelled';
  membership_start_date: string | null;
  membership_end_date: string | null;
  plan_id: string | null;
  assigned_advisor_id: string | null;
  preferred_language: string;
  created_at: string;
  updated_at: string;
}

export interface MemberDependent {
  id: string;
  member_id: string;
  first_name: string;
  last_name: string;
  relationship: string;
  date_of_birth: string | null;
  is_covered: boolean;
  created_at: string;
}

export interface MemberClaim {
  id: string;
  member_id: string;
  claim_number: string;
  claim_type: string;
  status: string;
  provider_name: string | null;
  service_date: string | null;
  total_amount: number;
  approved_amount: number;
  paid_amount: number;
  submitted_date: string | null;
  created_at: string;
}

export interface MemberStats {
  total: number;
  active: number;
  pending: number;
  suspended: number;
  cancelled: number;
  new_this_month: number;
}

export interface MemberFilters {
  status?: string;
  search?: string;
  assigned_advisor_id?: string;
  limit?: number;
  offset?: number;
}

export class MemberService {
  async getMembers(filters?: MemberFilters): Promise<{ data: MemberProfile[]; count: number }> {
    let query = supabase
      .from('member_profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('membership_status', filters.status);
    }
    if (filters?.search) {
      query = query.or(
        `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,membership_number.ilike.%${filters.search}%`
      );
    }
    if (filters?.assigned_advisor_id) {
      query = query.eq('assigned_advisor_id', filters.assigned_advisor_id);
    }
    if (filters?.limit) {
      const offset = filters.offset || 0;
      query = query.range(offset, offset + filters.limit - 1);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data || [], count: count || 0 };
  }

  async getMember(memberId: string): Promise<MemberProfile | null> {
    const { data, error } = await supabase
      .from('member_profiles')
      .select('*')
      .eq('id', memberId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateMember(
    memberId: string,
    updates: Partial<Pick<MemberProfile, 'membership_status' | 'assigned_advisor_id' | 'phone' | 'preferred_language'>>,
    notificationCtx?: NotificationContext
  ): Promise<MemberProfile> {
    const oldData = notificationCtx
      ? await this.getMember(memberId)
      : null;

    const { data, error } = await supabase
      .from('member_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', memberId)
      .select()
      .single();

    if (error) throw error;

    if (notificationCtx) {
      const changes: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(updates)) {
        changes[key] = { old: oldData?.[key as keyof MemberProfile] ?? null, new: val };
      }

      try {
        await supabase.from('member_account_events').insert({
          member_id: memberId,
          actor_user_id: notificationCtx.actor_user_id,
          actor_department: notificationCtx.actor_department,
          event_type: notificationCtx.event_type,
          entity_type: 'member_profile',
          entity_id: memberId,
          changes,
          payload_summary: { actor_email: notificationCtx.actor_email },
          should_notify_member: notificationCtx.should_notify_member ?? true,
        });
      } catch (emitErr) {
        console.error('Failed to emit member account event (update succeeded):', emitErr);
      }
    }

    return data;
  }

  async getDependents(memberId: string): Promise<MemberDependent[]> {
    const { data, error } = await supabase
      .from('member_dependents')
      .select('id, member_id, first_name, last_name, relationship, date_of_birth, is_covered, created_at')
      .eq('member_id', memberId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getClaims(memberId: string): Promise<MemberClaim[]> {
    const { data, error } = await supabase
      .from('claims')
      .select('id, member_id, claim_number, claim_type, status, provider_name, service_date, total_amount, approved_amount, paid_amount, submitted_date, created_at')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  }

  async getStats(): Promise<MemberStats> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [total, active, pending, suspended, cancelled, newThisMonth] = await Promise.all([
      supabase.from('member_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('member_profiles').select('id', { count: 'exact', head: true }).eq('membership_status', 'active'),
      supabase.from('member_profiles').select('id', { count: 'exact', head: true }).eq('membership_status', 'pending'),
      supabase.from('member_profiles').select('id', { count: 'exact', head: true }).eq('membership_status', 'suspended'),
      supabase.from('member_profiles').select('id', { count: 'exact', head: true }).eq('membership_status', 'cancelled'),
      supabase.from('member_profiles').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
    ]);

    return {
      total: total.count || 0,
      active: active.count || 0,
      pending: pending.count || 0,
      suspended: suspended.count || 0,
      cancelled: cancelled.count || 0,
      new_this_month: newThisMonth.count || 0,
    };
  }
}

export const memberService = new MemberService();
