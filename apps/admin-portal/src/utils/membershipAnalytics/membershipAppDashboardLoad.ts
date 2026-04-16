import type { SupabaseClient } from '@supabase/supabase-js';
import {
  endOfMonth,
  startOfMonth,
  subMonths,
  parseISO,
  isWithinInterval,
} from 'date-fns';
import {
  computeNextMonthPredictionV23,
  type NextMonthPredictionV23,
} from './nextMonthPredictionV23';

const PAGE_SIZE = 1000;

export type MembershipAppDashboardStats = {
  totalMembers: number;
  primaryMembers: number;
  primaryMembersVsLastMonth: number;
  dependentMembers: number;
  registeredUsers: number;
  registeredUsersCancelled: number;
  registeredUsersCancelledEffective: number;
  primaryUsers: number;
  dependentUsers: number;
  plansSold: number;
  activePlans: number;
  inactivePlans: number;
  currentlyActive: number;
  currentlyActiveVsLastMonth: number;
  lastMonthActive: number;
  lastMonthExpiring: number;
  lastMonthActivatingNext: number;
  lastMonthFutureActive: number;
  expiringThisMonth: number;
  activatedThisMonthIncluded: number;
  activatingNextMonth: number;
  futureActive: number;
  currentlyInactive: number;
  futureInactive: number;
  scheduledToExpireFutureMonths: number;
  enrolledThisMonth: number;
  activatedThisMonth: number;
  inactivatedThisMonth: number;
  notRegisteredPrimary: number;
  notRegisteredDependents: number;
};

export type MembershipAppDashboardPayload = {
  stats: MembershipAppDashboardStats;
  allMembersData: any[];
  nextMonthPrediction: NextMonthPredictionV23 | null;
};

async function fetchAllFromView(client: SupabaseClient, columns: string) {
  let allData: any[] = [];
  let from = 0;
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await client
      .from('sales_analytics_view')
      .select(columns)
      .range(from, from + PAGE_SIZE - 1);
    if (error) {
      console.error('[MembershipAppDashboard] View fetch error:', error);
      break;
    }
    if (data && data.length > 0) {
      allData = [...allData, ...data];
      from += PAGE_SIZE;
      hasMore = data.length === PAGE_SIZE;
    } else {
      hasMore = false;
    }
  }
  return allData;
}

async function fetchAllMemberIds(client: SupabaseClient) {
  const allIds = new Set<string>();
  const inactiveIds = new Set<string>();

  const fetchTable = async (table: 'members' | 'users') => {
    let from = 0;
    let hasMore = true;
    while (hasMore) {
      const { data, error } = await client
        .from(table)
        .select('member_id, inactive_date')
        .range(from, from + PAGE_SIZE - 1);
      if (error) {
        console.error(`[MembershipAppDashboard] ${table} fetch error:`, error);
        break;
      }
      if (data && data.length > 0) {
        data.forEach((m: any) => {
          allIds.add(m.member_id);
          if (m.inactive_date) inactiveIds.add(m.member_id);
        });
        from += PAGE_SIZE;
        hasMore = data.length === PAGE_SIZE;
      } else {
        hasMore = false;
      }
    }
  };

  await fetchTable('members');
  await fetchTable('users');
  inactiveIds.forEach((id) => allIds.delete(id));
  return allIds.size;
}

async function fetchActiveDependentCount(client: SupabaseClient, todayStr: string) {
  const ids = new Set<string>();

  const fetchFrom = async (table: 'members' | 'users') => {
    let from = 0;
    let hasMore = true;
    while (hasMore) {
      const { data, error } = await client
        .from(table)
        .select('member_id, active_date')
        .eq('is_primary', false)
        .eq('is_active', true)
        .range(from, from + PAGE_SIZE - 1);
      if (error) break;
      if (data && data.length > 0) {
        data.forEach((m: any) => {
          const started = !m.active_date || String(m.active_date).split('T')[0] <= todayStr;
          if (started) ids.add(m.member_id);
        });
        from += PAGE_SIZE;
        hasMore = data.length === PAGE_SIZE;
      } else {
        hasMore = false;
      }
    }
  };

  await fetchFrom('users');
  await fetchFrom('members');
  return ids.size;
}

async function fetchNotRegisteredStats(
  client: SupabaseClient,
): Promise<{ primary: number; dependents: number }> {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 18);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const registeredSet = new Set<string>();
  let from = 0;
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await client
      .from('users')
      .select('member_id')
      .range(from, from + PAGE_SIZE - 1);
    if (error) break;
    if (data?.length) {
      data.forEach((r: any) => registeredSet.add(r.member_id));
      from += PAGE_SIZE;
      hasMore = data.length === PAGE_SIZE;
    } else hasMore = false;
  }

  let primary = 0;
  let dependents = 0;
  from = 0;
  hasMore = true;
  while (hasMore) {
    const { data, error } = await client
      .from('members')
      .select('member_id, is_primary, is_active, dob')
      .eq('is_active', true)
      .not('dob', 'is', null)
      .lte('dob', cutoffStr)
      .range(from, from + PAGE_SIZE - 1);
    if (error) break;
    if (data && data.length > 0) {
      data.forEach((m: any) => {
        if (registeredSet.has(m.member_id)) return;
        if (m.is_primary === true) primary++;
        else dependents++;
      });
      from += PAGE_SIZE;
      hasMore = data.length === PAGE_SIZE;
    } else {
      hasMore = false;
    }
  }
  return { primary, dependents };
}

async function fetchPastInactives(client: SupabaseClient) {
  let allRecords: any[] = [];
  let from = 0;
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await client
      .from('past_inactives')
      .select('member_id, inactive_date, inactive_reason, active_date, member_created_date, agent_id')
      .range(from, from + PAGE_SIZE - 1);
    if (error) {
      console.error('[MembershipAppDashboard] past_inactives:', error);
      break;
    }
    if (data?.length) {
      allRecords = [...allRecords, ...data];
      from += PAGE_SIZE;
      hasMore = data.length === PAGE_SIZE;
    } else hasMore = false;
  }
  return allRecords;
}

async function fetchPredictivePrimaryMembers(client: SupabaseClient) {
  const COLS =
    'member_id, created_date, active_date, inactive_date, inactive_reason, is_active, is_primary, agent_id, first_name, last_name, dob';
  let usersData: any[] = [];
  let from = 0;
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await client
      .from('users')
      .select(COLS)
      .eq('is_primary', true)
      .range(from, from + 999);
    if (error) break;
    if (data?.length) {
      usersData = [...usersData, ...data];
      from += 1000;
      hasMore = data.length === 1000;
    } else hasMore = false;
  }
  const userIds = new Set(usersData.map((r: any) => r.member_id));
  let membersData: any[] = [];
  from = 0;
  hasMore = true;
  while (hasMore) {
    const { data, error } = await client
      .from('members')
      .select(COLS)
      .eq('is_primary', true)
      .range(from, from + 999);
    if (error) break;
    if (data?.length) {
      const filtered = data.filter((r: any) => !userIds.has(r.member_id));
      membersData = [...membersData, ...filtered];
      from += 1000;
      hasMore = data.length === 1000;
    } else hasMore = false;
  }
  return [...usersData, ...membersData];
}

export async function loadMembershipAppDashboardData(
  client: SupabaseClient,
): Promise<MembershipAppDashboardPayload> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const cancelledEffectiveFilter = () =>
    client
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', false)
      .or(`inactive_date.is.null,inactive_date.lte.${todayStr}`);

  const monthEnd = endOfMonth(today);
  const currentMonthStart = startOfMonth(today);
  const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const nextMonthEnd = endOfMonth(nextMonthStart);

  const [
    totalMembersCount,
    allPrimaryData,
    usersResult,
    primaryUsersResult,
    dependentUsersResult,
    cancelledUsersResult,
    cancelledEffectiveResult,
    cancelledEffectivePrimaryResult,
    cancelledEffectiveDependentResult,
    activeDependentCount,
    notRegisteredStats,
    pastInactivesData,
    predictivePrimaryMembers,
  ] = await Promise.all([
    fetchAllMemberIds(client),
    fetchAllFromView(
      client,
      'member_id, is_active, is_primary, inactive_date, active_date, created_date, inactive_reason, dob',
    ),
    client.from('users').select('id', { count: 'exact', head: true }),
    client.from('users').select('id', { count: 'exact', head: true }).eq('is_primary', true),
    client.from('users').select('id', { count: 'exact', head: true }).eq('is_primary', false),
    client.from('users').select('id', { count: 'exact', head: true }).eq('is_active', false),
    cancelledEffectiveFilter(),
    cancelledEffectiveFilter().eq('is_primary', true),
    cancelledEffectiveFilter().eq('is_primary', false),
    fetchActiveDependentCount(client, todayStr),
    fetchNotRegisteredStats(client),
    fetchPastInactives(client),
    fetchPredictivePrimaryMembers(client),
  ]);

  const cancelledEffective =
    typeof cancelledEffectiveResult.count === 'number' ? cancelledEffectiveResult.count : 0;
  const cancelledEffectivePrimary =
    typeof cancelledEffectivePrimaryResult.count === 'number'
      ? cancelledEffectivePrimaryResult.count
      : 0;
  const cancelledEffectiveDependent =
    typeof cancelledEffectiveDependentResult.count === 'number'
      ? cancelledEffectiveDependentResult.count
      : 0;
  const registeredUsersGross = usersResult.count || 0;
  const primaryUsersGross = primaryUsersResult.count || 0;
  const dependentUsersGross = dependentUsersResult.count || 0;
  const registeredUsersNet = Math.max(0, registeredUsersGross - cancelledEffective);
  const primaryUsersNet = Math.max(0, primaryUsersGross - cancelledEffectivePrimary);
  const dependentUsersNet = Math.max(0, dependentUsersGross - cancelledEffectiveDependent);

  const now = new Date();
  const curYear = now.getUTCFullYear();
  const curMonth = now.getUTCMonth();
  const enrolledThisMonth = allPrimaryData.filter((r: any) => {
    if (!r.created_date) return false;
    try {
      const d = parseISO(r.created_date);
      return d.getUTCFullYear() === curYear && d.getUTCMonth() === curMonth;
    } catch {
      return false;
    }
  }).length;

  const monthEndStr = monthEnd.toISOString().split('T')[0];
  const lastMonthStart = startOfMonth(subMonths(today, 1));
  const lastMonthEnd = endOfMonth(subMonths(today, 1));
  let activePlansCount = 0;
  let inactivePlansCount = 0;
  let currentlyActiveCount = 0;
  let futureActiveCount = 0;
  let activeExpiringThisMonth = 0;
  let activatingNextMonthCount = 0;
  let currentlyInactiveCount = 0;
  let futureInactiveCount = 0;
  let scheduledToExpireFutureMonths = 0;
  let activatedThisMonth = 0;
  let inactivatedThisMonth = 0;
  let activatedThisMonthIncluded = 0;
  let activePrimary = 0;
  let lastMonthActivePrimary = 0;
  let lastMonthCurrentlyActiveCount = 0;
  let lastMonthExpiring = 0;
  let lastMonthActivatingNext = 0;
  let lastMonthFutureActive = 0;

  allPrimaryData.forEach((r: any) => {
    if (r.active_date) {
      try {
        const ad = parseISO(r.active_date);
        if (isWithinInterval(ad, { start: currentMonthStart, end: monthEnd })) activatedThisMonth++;
      } catch {
        /* skip */
      }
    }

    if (r.inactive_date) {
      try {
        const id = parseISO(r.inactive_date);
        if (isWithinInterval(id, { start: currentMonthStart, end: monthEnd })) inactivatedThisMonth++;
      } catch {
        /* skip */
      }
    }

    if (r.is_active === true) {
      activePlansCount++;
      const activeStarted = !r.active_date || r.active_date.split('T')[0] <= todayStr;

      if (activeStarted) {
        if (r.is_primary === true) activePrimary++;
        currentlyActiveCount++;
        if (r.active_date) {
          try {
            const ad = parseISO(r.active_date);
            if (isWithinInterval(ad, { start: currentMonthStart, end: monthEnd })) {
              const isExpiringThisMonth =
                r.inactive_date &&
                (() => {
                  try {
                    return isWithinInterval(parseISO(r.inactive_date), {
                      start: currentMonthStart,
                      end: monthEnd,
                    });
                  } catch {
                    return false;
                  }
                })();
              if (!isExpiringThisMonth) activatedThisMonthIncluded++;
            }
          } catch {
            /* skip */
          }
        }
        if (r.inactive_date) {
          try {
            const id = parseISO(r.inactive_date);
            if (isWithinInterval(id, { start: currentMonthStart, end: monthEnd })) {
              activeExpiringThisMonth++;
            }
          } catch {
            /* skip */
          }
        }
      } else {
        futureActiveCount++;
        if (r.active_date) {
          try {
            const ad = parseISO(r.active_date);
            if (isWithinInterval(ad, { start: nextMonthStart, end: nextMonthEnd })) {
              activatingNextMonthCount++;
            }
          } catch {
            /* skip */
          }
        }
      }

      if (r.inactive_date) {
        const idStr = r.inactive_date.split('T')[0];
        if (idStr > todayStr) {
          futureInactiveCount++;
          if (idStr > monthEndStr) scheduledToExpireFutureMonths++;
        }
      }
    } else {
      inactivePlansCount++;
      currentlyInactiveCount++;
    }

    try {
      const hadStartedByLastMonth = !r.active_date || parseISO(r.active_date) <= lastMonthEnd;
      const notCancelledByLastMonth = !r.inactive_date || parseISO(r.inactive_date) > lastMonthEnd;
      if (hadStartedByLastMonth && notCancelledByLastMonth) {
        lastMonthCurrentlyActiveCount++;
        if (r.is_primary === true) lastMonthActivePrimary++;
      }

      if (r.inactive_date) {
        const id = parseISO(r.inactive_date);
        if (isWithinInterval(id, { start: lastMonthStart, end: lastMonthEnd })) lastMonthExpiring++;
      }
      if (r.active_date) {
        const ad = parseISO(r.active_date);
        if (r.is_active && ad > nextMonthEnd) lastMonthFutureActive++;
      }
    } catch {
      /* skip */
    }
  });

  lastMonthActivatingNext = activatedThisMonth;
  const lastMonthActive = lastMonthCurrentlyActiveCount + lastMonthActivatingNext;
  const currentActive =
    currentlyActiveCount -
    activeExpiringThisMonth +
    (today.getDate() >= 20 ? activatingNextMonthCount : 0);
  const activeVsLastMonth = currentActive - lastMonthActive;

  const stats: MembershipAppDashboardStats = {
    totalMembers: totalMembersCount,
    primaryMembers: activePrimary,
    primaryMembersVsLastMonth: activePrimary - lastMonthActivePrimary,
    dependentMembers: activeDependentCount,
    registeredUsers: registeredUsersNet,
    registeredUsersCancelled: cancelledUsersResult.count || 0,
    registeredUsersCancelledEffective: cancelledEffective,
    primaryUsers: primaryUsersNet,
    dependentUsers: dependentUsersNet,
    plansSold: allPrimaryData.length,
    activePlans: activePlansCount,
    inactivePlans: inactivePlansCount,
    currentlyActive: currentActive,
    currentlyActiveVsLastMonth: activeVsLastMonth,
    lastMonthActive,
    lastMonthExpiring,
    lastMonthActivatingNext,
    lastMonthFutureActive,
    expiringThisMonth: activeExpiringThisMonth,
    activatedThisMonthIncluded,
    activatingNextMonth: activatingNextMonthCount,
    futureActive: Math.max(0, futureActiveCount - activatingNextMonthCount),
    currentlyInactive: currentlyInactiveCount,
    futureInactive: futureInactiveCount,
    scheduledToExpireFutureMonths,
    enrolledThisMonth,
    activatedThisMonth,
    inactivatedThisMonth,
    notRegisteredPrimary: notRegisteredStats.primary,
    notRegisteredDependents: notRegisteredStats.dependents,
  };

  const nextMonthPrediction = computeNextMonthPredictionV23(
    predictivePrimaryMembers,
    pastInactivesData,
  );

  return { stats, allMembersData: allPrimaryData, nextMonthPrediction };
}
