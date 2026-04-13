import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ActivityTarget,
  ActivityTargetInput,
  TargetProgress,
  RepTargetSummary,
} from './types';
import { DEFAULT_MONTHLY_TARGETS } from './types';

export class TargetsService {
  constructor(
    private supabase: SupabaseClient,
    private orgId: string
  ) {}

  async getTargets(
    filters: { type?: string; repId?: string; periodStart?: string } = {}
  ): Promise<ActivityTarget[]> {
    let query = this.supabase
      .from('crm_activity_targets')
      .select('*')
      .eq('org_id', this.orgId);

    if (filters.type) query = query.eq('target_type', filters.type);
    if (filters.repId) query = query.eq('rep_id', filters.repId);
    if (filters.periodStart) query = query.eq('period_start', filters.periodStart);

    const { data, error } = await query.order('period_start', { ascending: false });
    if (error) {
      console.error('Failed to get targets:', error);
      return [];
    }
    return data as ActivityTarget[];
  }

  async getTarget(id: string): Promise<ActivityTarget | null> {
    const { data, error } = await this.supabase
      .from('crm_activity_targets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as ActivityTarget;
  }

  async createTarget(input: ActivityTargetInput): Promise<ActivityTarget | null> {
    const { data: { user } } = await this.supabase.auth.getUser();

    const { data, error } = await this.supabase
      .from('crm_activity_targets')
      .insert({
        org_id: this.orgId,
        ...input,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create target:', error);
      return null;
    }
    return data as ActivityTarget;
  }

  async updateTarget(
    id: string,
    input: Partial<ActivityTargetInput>
  ): Promise<ActivityTarget | null> {
    const { data, error } = await this.supabase
      .from('crm_activity_targets')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update target:', error);
      return null;
    }
    return data as ActivityTarget;
  }

  async deleteTarget(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('crm_activity_targets')
      .delete()
      .eq('id', id);
    return !error;
  }

  async getTargetProgress(
    repId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<TargetProgress[]> {
    const targets = await this.getTargets({
      type: 'monthly_rep',
      repId,
      periodStart,
    });

    const targetMap = targets.length > 0
      ? targets[0].targets
      : DEFAULT_MONTHLY_TARGETS;

    const { data: activities } = await this.supabase
      .from('lead_activities')
      .select('activity_type')
      .eq('created_by', repId)
      .gte('created_at', periodStart)
      .lte('created_at', periodEnd);

    const actuals: Record<string, number> = {};
    for (const a of activities || []) {
      actuals[a.activity_type] = (actuals[a.activity_type] || 0) + 1;
    }

    const now = new Date();
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    const totalDays = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 86400));
    const elapsedDays = Math.max(1, (now.getTime() - start.getTime()) / (1000 * 86400));
    const paceMultiplier = totalDays / elapsedDays;

    const progress: TargetProgress[] = [];
    for (const [actType, target] of Object.entries(targetMap)) {
      const actual = actuals[actType] || 0;
      const percentage = target > 0 ? Math.round((actual / target) * 100) : 0;
      const projectedTotal = actual * paceMultiplier;
      progress.push({
        activity_type: actType,
        target,
        actual,
        percentage,
        on_pace: projectedTotal >= target,
      });
    }

    return progress;
  }

  async getTeamTargetProgress(
    periodStart: string,
    periodEnd: string
  ): Promise<RepTargetSummary[]> {
    const { data: members } = await this.supabase
      .from('org_members')
      .select('user_id, users:auth_user_id(email, raw_user_meta_data)')
      .eq('org_id', this.orgId);

    if (!members) return [];

    const summaries: RepTargetSummary[] = [];
    for (const member of members) {
      const progress = await this.getTargetProgress(
        member.user_id,
        periodStart,
        periodEnd
      );

      const totalPct = progress.length > 0
        ? Math.round(progress.reduce((s, p) => s + p.percentage, 0) / progress.length)
        : 0;

      summaries.push({
        rep_id: member.user_id,
        rep_name: (member as any).users?.raw_user_meta_data?.full_name || (member as any).users?.email || 'Unknown',
        period: periodStart,
        progress,
        overall_percentage: totalPct,
      });
    }

    return summaries;
  }
}

export function createTargetsService(
  supabase: SupabaseClient,
  orgId: string
): TargetsService {
  return new TargetsService(supabase, orgId);
}
