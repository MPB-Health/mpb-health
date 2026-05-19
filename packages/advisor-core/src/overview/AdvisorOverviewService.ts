import { supabase } from '@mpbhealth/database';
import { advisorLeadService } from '../leads/advisorLeadService';
import { ticketService } from '../support/TicketService';

export interface AdvisorMemberBookStats {
  totalMembers: number;
  activeMembers: number;
  pendingMembers: number;
  suspendedMembers: number;
  cancelledMembers: number;
  newEnrollmentsThisMonth: number;
}

export interface AdvisorCommissionStats {
  pendingAmount: number;
  earnedAmount: number;
  paidAmount: number;
  paidThisMonth: number;
  recordCount: number;
  lastPayoutAmount: number | null;
  lastPayoutDate: string | null;
}

export interface AdvisorSubagent {
  agentId: string;
  displayName: string;
  email: string | null;
  isActive: boolean;
  memberCount: number;
}

export interface AdvisorTreeStats {
  directSubagents: number;
  totalAgentsInTree: number;
  activeAgentsInTree: number;
  teamMembers: number;
  teamActiveMembers: number;
  teamEnrollmentsThisMonth: number;
  treeDepth: number;
  subagents: AdvisorSubagent[];
}

export interface AdvisorOverviewContext {
  userId: string;
  agentId: string | null;
  orgId: string | null;
}

export type OverviewDataStatus = 'live' | 'coming_soon';

/** Set true when commission reporting is verified for the advisor portal. */
export const ADVISOR_DASHBOARD_COMMISSIONS_LIVE = false;

/** Set true when agent-tree / downline metrics are verified for the advisor portal. */
export const ADVISOR_DASHBOARD_TREE_LIVE = false;

export interface AdvisorOverviewSnapshot {
  members: AdvisorMemberBookStats;
  assignedLeads: number;
  openTickets: number;
  commissions: AdvisorCommissionStats | null;
  commissionsStatus: OverviewDataStatus;
  tree: AdvisorTreeStats | null;
  treeStatus: OverviewDataStatus;
}

type MemberRow = {
  membership_status: string | null;
  enrollment_date: string | null;
};

type AdvisorRow = {
  agent_id: string | null;
  parent_id: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  is_active: boolean | null;
  status: string | null;
};

type CommissionRow = {
  commission_amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
};

const EMPTY_COMMISSIONS: AdvisorCommissionStats = {
  pendingAmount: 0,
  earnedAmount: 0,
  paidAmount: 0,
  paidThisMonth: 0,
  recordCount: 0,
  lastPayoutAmount: null,
  lastPayoutDate: null,
};

const EMPTY_TREE: AdvisorTreeStats = {
  directSubagents: 0,
  totalAgentsInTree: 0,
  activeAgentsInTree: 0,
  teamMembers: 0,
  teamActiveMembers: 0,
  teamEnrollmentsThisMonth: 0,
  treeDepth: 0,
  subagents: [],
};

function monthStartDate(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function aggregateMemberRows(rows: MemberRow[]): AdvisorMemberBookStats {
  const monthStart = monthStartDate();
  const stats: AdvisorMemberBookStats = {
    totalMembers: rows.length,
    activeMembers: 0,
    pendingMembers: 0,
    suspendedMembers: 0,
    cancelledMembers: 0,
    newEnrollmentsThisMonth: 0,
  };

  for (const row of rows) {
    switch (row.membership_status) {
      case 'active':
        stats.activeMembers++;
        break;
      case 'pending':
        stats.pendingMembers++;
        break;
      case 'suspended':
        stats.suspendedMembers++;
        break;
      case 'cancelled':
        stats.cancelledMembers++;
        break;
      default:
        break;
    }

    if (row.enrollment_date) {
      const enrolledAt = new Date(row.enrollment_date);
      if (!Number.isNaN(enrolledAt.getTime()) && enrolledAt >= monthStart) {
        stats.newEnrollmentsThisMonth++;
      }
    }
  }

  return stats;
}

function aggregateCommissions(rows: CommissionRow[]): AdvisorCommissionStats {
  const monthStart = monthStartDate();
  const stats = { ...EMPTY_COMMISSIONS, recordCount: rows.length };

  for (const row of rows) {
    const amt = Number(row.commission_amount) || 0;
    switch (row.status) {
      case 'pending':
        stats.pendingAmount += amt;
        break;
      case 'earned':
      case 'approved':
        stats.earnedAmount += amt;
        break;
      case 'paid': {
        stats.paidAmount += amt;
        const paidAt = row.paid_at ? new Date(row.paid_at) : new Date(row.created_at);
        if (!Number.isNaN(paidAt.getTime()) && paidAt >= monthStart) {
          stats.paidThisMonth += amt;
        }
        break;
      }
      default:
        break;
    }
  }

  return stats;
}

export class AdvisorOverviewService {
  async getMemberBookStats(advisorUserId: string): Promise<AdvisorMemberBookStats> {
    const { data, error } = await supabase
      .from('member_profiles')
      .select('membership_status, enrollment_date')
      .eq('assigned_advisor_id', advisorUserId);

    if (error) throw error;
    return aggregateMemberRows((data ?? []) as MemberRow[]);
  }

  async getTeamMemberBookStats(advisorUserIds: string[]): Promise<AdvisorMemberBookStats> {
    if (advisorUserIds.length === 0) return aggregateMemberRows([]);

    const { data, error } = await supabase
      .from('member_profiles')
      .select('membership_status, enrollment_date')
      .in('assigned_advisor_id', advisorUserIds);

    if (error) throw error;
    return aggregateMemberRows((data ?? []) as MemberRow[]);
  }

  async collectDownlineAgentIds(rootAgentId: string): Promise<string[]> {
    const seen = new Set<string>([rootAgentId]);
    let frontier = [rootAgentId];

    while (frontier.length > 0) {
      const { data, error } = await supabase
        .from('advisors')
        .select('agent_id')
        .in('parent_id', frontier);

      if (error) {
        console.error('Error fetching downline advisors:', error);
        break;
      }

      const next = (data ?? [])
        .map((row) => row.agent_id)
        .filter((id): id is string => Boolean(id) && !seen.has(id));

      next.forEach((id) => seen.add(id));
      frontier = next;
    }

    return [...seen];
  }

  async mapAgentIdsToUserIds(agentIds: string[]): Promise<Map<string, string>> {
    if (agentIds.length === 0) return new Map();

    const { data, error } = await supabase
      .from('advisor_profiles')
      .select('user_id, agent_id')
      .in('agent_id', agentIds);

    if (error) {
      console.error('Error mapping agent IDs to users:', error);
      return new Map();
    }

    const map = new Map<string, string>();
    for (const row of data ?? []) {
      if (row.agent_id && row.user_id) {
        map.set(row.agent_id, row.user_id);
      }
    }
    return map;
  }

  async getDirectSubagents(agentId: string): Promise<AdvisorRow[]> {
    const { data, error } = await supabase
      .from('advisors')
      .select(
        'agent_id, parent_id, display_name, first_name, last_name, email, is_active, status',
      )
      .eq('parent_id', agentId)
      .order('display_name', { ascending: true });

    if (error) {
      console.error('Error fetching direct subagents:', error);
      return [];
    }

    return (data ?? []) as AdvisorRow[];
  }

  async getTreeStats(agentId: string, rootUserId: string): Promise<AdvisorTreeStats> {
    const allAgentIds = await this.collectDownlineAgentIds(agentId);
    const agentToUser = await this.mapAgentIdsToUserIds(allAgentIds);
    const teamUserIds = [...new Set([rootUserId, ...agentToUser.values()])];

    const [directRows, teamMembers, activeCountRes] = await Promise.all([
      this.getDirectSubagents(agentId),
      this.getTeamMemberBookStats(teamUserIds),
      supabase
        .from('advisors')
        .select('id', { count: 'exact', head: true })
        .in('agent_id', allAgentIds)
        .eq('is_active', true),
    ]);

    const directAgentIds = directRows
      .map((r) => r.agent_id)
      .filter((id): id is string => Boolean(id));

    let memberCountsByAgent = new Map<string, number>();
    if (directAgentIds.length > 0) {
      const directUserIds = directAgentIds
        .map((id) => agentToUser.get(id))
        .filter((id): id is string => Boolean(id));

      if (directUserIds.length > 0) {
        const { data: memberRows } = await supabase
          .from('member_profiles')
          .select('assigned_advisor_id')
          .in('assigned_advisor_id', directUserIds);

        for (const row of memberRows ?? []) {
          if (row.assigned_advisor_id) {
            memberCountsByAgent.set(
              row.assigned_advisor_id,
              (memberCountsByAgent.get(row.assigned_advisor_id) ?? 0) + 1,
            );
          }
        }
      }
    }

    const subagents: AdvisorSubagent[] = directRows
      .filter((row): row is AdvisorRow & { agent_id: string } => Boolean(row.agent_id))
      .map((row) => {
        const name =
          row.display_name?.trim() ||
          [row.first_name, row.last_name].filter(Boolean).join(' ').trim() ||
          row.agent_id!;
        const userId = agentToUser.get(row.agent_id!);
        return {
          agentId: row.agent_id!,
          displayName: name,
          email: row.email,
          isActive: Boolean(row.is_active) && (row.status?.includes('Active') ?? true),
          memberCount: userId ? (memberCountsByAgent.get(userId) ?? 0) : 0,
        };
      });

    const treeDepth = await this.computeTreeDepth(agentId);

    return {
      directSubagents: subagents.length,
      totalAgentsInTree: allAgentIds.length,
      activeAgentsInTree: activeCountRes.count ?? allAgentIds.length,
      teamMembers: teamMembers.totalMembers,
      teamActiveMembers: teamMembers.activeMembers,
      teamEnrollmentsThisMonth: teamMembers.newEnrollmentsThisMonth,
      treeDepth,
      subagents: subagents.slice(0, 8),
    };
  }

  private async computeTreeDepth(rootAgentId: string): Promise<number> {
    let depth = 0;
    let frontier = [rootAgentId];
    const seen = new Set<string>([rootAgentId]);

    while (frontier.length > 0) {
      const { data } = await supabase
        .from('advisors')
        .select('agent_id')
        .in('parent_id', frontier);

      const children = (data ?? [])
        .map((r) => r.agent_id)
        .filter((id): id is string => Boolean(id) && !seen.has(id));

      if (children.length === 0) break;
      children.forEach((id) => seen.add(id));
      depth++;
      frontier = children;
    }

    return depth;
  }

  async getCommissionStats(
    advisorUserIds: string[],
    orgId: string | null,
  ): Promise<AdvisorCommissionStats> {
    if (advisorUserIds.length === 0) return { ...EMPTY_COMMISSIONS };

    try {
      let recordsQuery = supabase
        .from('commission_records')
        .select('commission_amount, status, paid_at, created_at')
        .in('advisor_id', advisorUserIds);

      if (orgId) {
        recordsQuery = recordsQuery.eq('org_id', orgId);
      }

      let payoutsQuery = supabase
        .from('commission_payouts')
        .select('total_amount, payout_date')
        .in('advisor_id', advisorUserIds)
        .order('payout_date', { ascending: false })
        .limit(1);

      if (orgId) {
        payoutsQuery = payoutsQuery.eq('org_id', orgId);
      }

      const [recordsRes, payoutsRes] = await Promise.all([recordsQuery, payoutsQuery]);

      if (recordsRes.error) {
        console.error('Error fetching commission records:', recordsRes.error);
        return { ...EMPTY_COMMISSIONS };
      }

      const stats = aggregateCommissions((recordsRes.data ?? []) as CommissionRow[]);

      if (!payoutsRes.error && payoutsRes.data?.[0]) {
        stats.lastPayoutAmount = Number(payoutsRes.data[0].total_amount) || 0;
        stats.lastPayoutDate = payoutsRes.data[0].payout_date;
      }

      return stats;
    } catch (err) {
      console.error('Commission stats error:', err);
      return { ...EMPTY_COMMISSIONS };
    }
  }

  async getOverview(context: AdvisorOverviewContext): Promise<AdvisorOverviewSnapshot> {
    const { userId, agentId, orgId } = context;

    const commissionsStatus: OverviewDataStatus = ADVISOR_DASHBOARD_COMMISSIONS_LIVE
      ? 'live'
      : 'coming_soon';
    const treeStatus: OverviewDataStatus = ADVISOR_DASHBOARD_TREE_LIVE ? 'live' : 'coming_soon';

    let downlineUserIds = [userId];
    let tree: AdvisorTreeStats | null = null;

    if (treeStatus === 'live' && agentId) {
      const allAgentIds = await this.collectDownlineAgentIds(agentId);
      const agentToUser = await this.mapAgentIdsToUserIds(allAgentIds);
      downlineUserIds = [...new Set([userId, ...agentToUser.values()])];
      tree = await this.getTreeStats(agentId, userId).catch(() => ({ ...EMPTY_TREE }));
    }

    const commissionsPromise =
      commissionsStatus === 'live'
        ? this.getCommissionStats(downlineUserIds, orgId)
        : Promise.resolve(null);

    const [members, assignedLeads, ticketStats, commissions] = await Promise.all([
      this.getMemberBookStats(userId),
      advisorLeadService.getAssignedLeadCount(userId),
      ticketService.getTicketStats().catch(() => ({
        total: 0,
        new: 0,
        open: 0,
        pending: 0,
        resolved: 0,
        closed: 0,
      })),
      commissionsPromise,
    ]);

    return {
      members,
      assignedLeads,
      openTickets: ticketStats.open + ticketStats.pending + ticketStats.new,
      commissions,
      commissionsStatus,
      tree,
      treeStatus,
    };
  }
}

export const advisorOverviewService = new AdvisorOverviewService();
