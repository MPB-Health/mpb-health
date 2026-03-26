import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CommissionSchedule,
  CommissionScheduleCreateInput,
  CommissionScheduleUpdateInput,
  CommissionRecord,
  CommissionRecordCreateInput,
  CommissionRecordUpdateInput,
  CommissionPayout,
  CommissionPayoutCreateInput,
  CommissionFilters,
  CommissionSummary,
} from './commissionTypes';

export class CommissionService {
  constructor(private supabase: SupabaseClient) {}

  // ── Schedules ────────────────────────────────────────────────────

  async getSchedules(activeOnly = true): Promise<CommissionSchedule[]> {
    try {
      let query = this.supabase
        .from('commission_schedules')
        .select('*')
        .order('effective_from', { ascending: false });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Failed to get commission schedules:', error);
        return [];
      }
      return data as CommissionSchedule[];
    } catch (error) {
      console.error('Get schedules error:', error);
      return [];
    }
  }

  async createSchedule(
    input: CommissionScheduleCreateInput
  ): Promise<{ success: boolean; schedule?: CommissionSchedule; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('commission_schedules')
        .insert({
          name: input.name,
          plan_id: input.plan_id || null,
          carrier_id: input.carrier_id || null,
          advisor_tier: input.advisor_tier || null,
          rate_type: input.rate_type,
          rate_value: input.rate_value,
          effective_from: input.effective_from,
          effective_to: input.effective_to || null,
          notes: input.notes || null,
        })
        .select('*')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, schedule: data as CommissionSchedule };
    } catch (error) {
      console.error('Create schedule error:', error);
      return { success: false, error: 'Failed to create schedule' };
    }
  }

  async updateSchedule(
    id: string,
    updates: CommissionScheduleUpdateInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('commission_schedules')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      console.error('Update schedule error:', error);
      return { success: false, error: 'Failed to update schedule' };
    }
  }

  // ── Records ──────────────────────────────────────────────────────

  async getRecords(
    filters: CommissionFilters = {},
    limit = 50,
    offset = 0
  ): Promise<{ records: CommissionRecord[]; total: number }> {
    try {
      let query = this.supabase
        .from('commission_records')
        .select('*', { count: 'exact' });

      if (filters.advisor_id) query = query.eq('advisor_id', filters.advisor_id);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.plan_type) query = query.eq('plan_type', filters.plan_type);
      if (filters.carrier_id) query = query.eq('carrier_id', filters.carrier_id);
      if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
      if (filters.dateTo) query = query.lte('created_at', filters.dateTo);

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Failed to get commission records:', error);
        return { records: [], total: 0 };
      }
      return { records: data as CommissionRecord[], total: count || 0 };
    } catch (error) {
      console.error('Get records error:', error);
      return { records: [], total: 0 };
    }
  }

  async createRecord(
    input: CommissionRecordCreateInput
  ): Promise<{ success: boolean; record?: CommissionRecord; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('commission_records')
        .insert({
          advisor_id: input.advisor_id,
          schedule_id: input.schedule_id || null,
          lead_id: input.lead_id || null,
          contact_id: input.contact_id || null,
          carrier_id: input.carrier_id || null,
          plan_type: input.plan_type || null,
          premium_amount: input.premium_amount ?? null,
          subsidy_amount: input.subsidy_amount ?? null,
          member_responsibility: input.member_responsibility ?? null,
          commission_rate: input.commission_rate ?? null,
          commission_amount: input.commission_amount,
          period_start: input.period_start || null,
          period_end: input.period_end || null,
          notes: input.notes || null,
        })
        .select('*')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, record: data as CommissionRecord };
    } catch (error) {
      console.error('Create record error:', error);
      return { success: false, error: 'Failed to create commission record' };
    }
  }

  async updateRecord(
    id: string,
    updates: CommissionRecordUpdateInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('commission_records')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      console.error('Update record error:', error);
      return { success: false, error: 'Failed to update commission record' };
    }
  }

  async getSummary(filters: CommissionFilters = {}): Promise<CommissionSummary> {
    const empty: CommissionSummary = {
      total_earned: 0,
      total_pending: 0,
      total_paid: 0,
      total_clawed_back: 0,
      record_count: 0,
      avg_commission: 0,
    };

    try {
      let query = this.supabase
        .from('commission_records')
        .select('commission_amount, status');

      if (filters.advisor_id) query = query.eq('advisor_id', filters.advisor_id);
      if (filters.plan_type) query = query.eq('plan_type', filters.plan_type);
      if (filters.carrier_id) query = query.eq('carrier_id', filters.carrier_id);
      if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
      if (filters.dateTo) query = query.lte('created_at', filters.dateTo);

      const { data, error } = await query;
      if (error || !data?.length) return empty;

      let totalEarned = 0, totalPending = 0, totalPaid = 0, totalClawedBack = 0;
      for (const r of data) {
        const amt = Number(r.commission_amount) || 0;
        switch (r.status) {
          case 'earned':
          case 'approved':
            totalEarned += amt;
            break;
          case 'pending':
            totalPending += amt;
            break;
          case 'paid':
            totalPaid += amt;
            break;
          case 'clawed_back':
            totalClawedBack += amt;
            break;
        }
      }

      const totalAll = data.reduce((s, r) => s + (Number(r.commission_amount) || 0), 0);

      return {
        total_earned: totalEarned,
        total_pending: totalPending,
        total_paid: totalPaid,
        total_clawed_back: totalClawedBack,
        record_count: data.length,
        avg_commission: data.length > 0 ? Math.round((totalAll / data.length) * 100) / 100 : 0,
      };
    } catch (error) {
      console.error('Get summary error:', error);
      return empty;
    }
  }

  // ── Payouts ──────────────────────────────────────────────────────

  async getPayouts(
    advisorId?: string,
    limit = 20,
    offset = 0
  ): Promise<{ payouts: CommissionPayout[]; total: number }> {
    try {
      let query = this.supabase
        .from('commission_payouts')
        .select('*', { count: 'exact' });

      if (advisorId) query = query.eq('advisor_id', advisorId);

      const { data, error, count } = await query
        .order('payout_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Failed to get payouts:', error);
        return { payouts: [], total: 0 };
      }
      return { payouts: data as CommissionPayout[], total: count || 0 };
    } catch (error) {
      console.error('Get payouts error:', error);
      return { payouts: [], total: 0 };
    }
  }

  async createPayout(
    input: CommissionPayoutCreateInput
  ): Promise<{ success: boolean; payout?: CommissionPayout; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('commission_payouts')
        .insert({
          advisor_id: input.advisor_id,
          total_amount: input.total_amount,
          record_count: input.record_count,
          payout_date: input.payout_date,
          payment_method: input.payment_method || null,
          reference_number: input.reference_number || null,
          notes: input.notes || null,
        })
        .select('*')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, payout: data as CommissionPayout };
    } catch (error) {
      console.error('Create payout error:', error);
      return { success: false, error: 'Failed to create payout' };
    }
  }
}

export function createCommissionService(supabase: SupabaseClient): CommissionService {
  return new CommissionService(supabase);
}
