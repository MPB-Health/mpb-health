import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  RoundRobinConfig,
  RoundRobinConfigInput,
  RoundRobinAuditEntry,
  AssignmentResult,
  PoolMember,
} from './types';

export class RoundRobinService {
  constructor(
    private supabase: SupabaseClient,
    private orgId: string
  ) {}

  async getConfig(): Promise<RoundRobinConfig | null> {
    const { data, error } = await this.supabase
      .from('crm_round_robin_config')
      .select('*')
      .eq('org_id', this.orgId)
      .maybeSingle();

    if (error) {
      console.error('Failed to get round-robin config:', error);
      return null;
    }
    return data as RoundRobinConfig | null;
  }

  async upsertConfig(input: RoundRobinConfigInput): Promise<RoundRobinConfig | null> {
    const { data: existing } = await this.supabase
      .from('crm_round_robin_config')
      .select('id')
      .eq('org_id', this.orgId)
      .maybeSingle();

    const { data: { user } } = await this.supabase.auth.getUser();

    if (existing) {
      const { data, error } = await this.supabase
        .from('crm_round_robin_config')
        .update({ ...input, updated_by: user?.id })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update round-robin config:', error);
        return null;
      }
      return data as RoundRobinConfig;
    }

    const { data, error } = await this.supabase
      .from('crm_round_robin_config')
      .insert({
        org_id: this.orgId,
        ...input,
        updated_by: user?.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create round-robin config:', error);
      return null;
    }
    return data as RoundRobinConfig;
  }

  async assignNext(leadId: string): Promise<AssignmentResult | null> {
    const config = await this.getConfig();
    if (!config || !config.is_active || config.pool_members.length === 0) {
      return null;
    }

    const activeMembers = config.pool_members.filter(
      (m: PoolMember) => m.is_active && !m.is_paused
    );
    if (activeMembers.length === 0) return null;

    let assignee: PoolMember | null = null;
    let newPosition = config.current_position;
    let wasSkip = false;

    if (config.tie_breaking_rule === 'random') {
      const idx = Math.floor(Math.random() * activeMembers.length);
      assignee = activeMembers[idx];
      newPosition = config.pool_members.findIndex(
        (m: PoolMember) => m.user_id === assignee!.user_id
      );
    } else if (config.tie_breaking_rule === 'least_leads') {
      const counts = await this.getLeadCountsForMembers(
        activeMembers.map((m: PoolMember) => m.user_id)
      );
      let minCount = Infinity;
      for (const member of activeMembers) {
        const count = counts[member.user_id] || 0;
        if (count < minCount) {
          minCount = count;
          assignee = member;
        }
      }
      if (assignee) {
        newPosition = config.pool_members.findIndex(
          (m: PoolMember) => m.user_id === assignee!.user_id
        );
      }
    } else {
      const allMembers = config.pool_members;
      let attempts = 0;
      let pos = config.current_position;

      while (attempts < allMembers.length) {
        pos = (pos + 1) % allMembers.length;
        const candidate = allMembers[pos];
        if (candidate.is_active && !candidate.is_paused) {
          assignee = candidate;
          newPosition = pos;
          break;
        }
        wasSkip = true;
        attempts++;
      }
    }

    if (!assignee) return null;

    await this.supabase
      .from('crm_round_robin_config')
      .update({ current_position: newPosition })
      .eq('id', config.id);

    await this.supabase
      .from('lead_submissions')
      .update({ assigned_to: assignee.user_id })
      .eq('id', leadId);

    await this.supabase.from('crm_round_robin_audit').insert({
      org_id: this.orgId,
      lead_id: leadId,
      assigned_to: assignee.user_id,
      position_at_assignment: newPosition,
      was_skip: wasSkip,
    });

    return {
      assigned_to: assignee.user_id,
      was_skip: wasSkip,
      position: newPosition,
    };
  }

  async overrideAssignment(
    leadId: string,
    assignToUserId: string,
    overrideByUserId: string
  ): Promise<boolean> {
    const { error: updateError } = await this.supabase
      .from('lead_submissions')
      .update({ assigned_to: assignToUserId })
      .eq('id', leadId);

    if (updateError) {
      console.error('Failed to override assignment:', updateError);
      return false;
    }

    await this.supabase.from('crm_round_robin_audit').insert({
      org_id: this.orgId,
      lead_id: leadId,
      assigned_to: assignToUserId,
      position_at_assignment: -1,
      was_skip: false,
      override_by: overrideByUserId,
    });

    return true;
  }

  async getAuditLog(
    limit = 50,
    offset = 0
  ): Promise<{ entries: RoundRobinAuditEntry[]; total: number }> {
    const { data, error, count } = await this.supabase
      .from('crm_round_robin_audit')
      .select('*', { count: 'exact' })
      .eq('org_id', this.orgId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to get audit log:', error);
      return { entries: [], total: 0 };
    }

    return { entries: data as RoundRobinAuditEntry[], total: count || 0 };
  }

  private async getLeadCountsForMembers(
    userIds: string[]
  ): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const uid of userIds) {
      const { count } = await this.supabase
        .from('lead_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_to', uid)
        .eq('org_id', this.orgId);
      counts[uid] = count || 0;
    }
    return counts;
  }
}

export function createRoundRobinService(
  supabase: SupabaseClient,
  orgId: string
): RoundRobinService {
  return new RoundRobinService(supabase, orgId);
}
