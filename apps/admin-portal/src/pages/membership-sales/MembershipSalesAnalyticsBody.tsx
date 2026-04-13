import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Users, Calendar, AlertCircle,
  BarChart3, Activity, DollarSign, CheckCircle,
  Clock, ArrowUpRight, ArrowDownRight, Filter, RefreshCw, Package,
  Trophy, UserCheck, UserX, Download, Target, Zap, Brain, Shield,
  Award, AlertTriangle, Search, Info, X
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO, differenceInDays, startOfDay, subDays } from 'date-fns';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell } from 'recharts';
import { membershipAnalyticsSupabase, paginateSelect } from '@/lib/membershipAnalyticsClient';
import toast from 'react-hot-toast';
import {
  buildUnifiedPrimaryForSnapshot,
  primaryActiveInactiveAsOfCutoff,
  primaryCancellationsInCalendarYear,
  primarySalesByMemberCreatedYear,
} from '@/utils/membershipAnalytics/primaryMembershipStats';
import { computeYearToDatePredictionVsActual } from '@/utils/membershipAnalytics/predictionV23Historical';

interface ChurnData {
  month: string;
  monthKey: string;
  sales: number;
  activations: number;
  cancellations: number;
  netChange: number;
}

interface ReasonStats {
  reason: string;
  count: number;
  percentage: number;
}

interface MonthlyMetrics {
  month: string;
  monthKey: string;
  activeMembers: number;
  inactiveMembers: number;
  totalMembers: number;
  activationRate: number;
}

interface FutureProjection {
  month: string;
  scheduledActivations: number;
  scheduledInactivations: number;
  projectedActive: number;
  projectedInactive: number;
  projectedTotal: number;
}

export function MembershipSalesAnalyticsBody() {
  // Parent `MembershipSalesAnalyticsPanel` only mounts this when configured.
  const supabase = membershipAnalyticsSupabase!;
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [advisors, setAdvisors] = useState<any[]>([]);
  const [contextLoading, setContextLoading] = useState(true);

  const refetch = useCallback(async () => {
    setContextLoading(true);
    try {
      const [u, m, a] = await Promise.all([
        paginateSelect(supabase, 'users', '*'),
        paginateSelect(supabase, 'members', '*'),
        paginateSelect(supabase, 'advisors', 'agent_id, first_name, last_name'),
      ]);
      setUsers(u);
      setMembers(m);
      setAdvisors(a);
    } catch (e) {
      console.error('[MembershipSalesAnalytics] context refetch', e);
    } finally {
      setContextLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const loading = contextLoading;
  const [timeRange, setTimeRange] = useState<'6' | '12' | '24' | 'all'>('6');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'executive' | 'overview' | 'sales' | 'contest' | 'predictive' | 'inactive' | 'inhouse'>('predictive');

  useEffect(() => {
    const tab = searchParams.get('tab');
    const valid = ['executive', 'overview', 'sales', 'contest', 'predictive', 'inactive', 'inhouse'];
    if (tab && valid.includes(tab)) setActiveTab(tab as any);
  }, [searchParams]);
  const [viewMode, setViewMode] = useState<'charts' | 'data'>('charts');

  const [inactiveMonthFilter, setInactiveMonthFilter] = useState<string>('current');

  const [agentSearchQuery, setAgentSearchQuery] = useState<string>('');
  const [agentMonthFilter, setAgentMonthFilter] = useState<string>('current'); // 'current', 'YYYY-MM', or 'all'

  // Inhouse Advisors state
  const [inhouseStats, setInhouseStats] = useState<any[]>([]);
  const [inhouseLoading, setInhouseLoading] = useState(false);
  const [inhouseTimeFilter, setInhouseTimeFilter] = useState<string>('30_days');
  const [inhouseCustomStartDate, setInhouseCustomStartDate] = useState('');
  const [inhouseCustomEndDate, setInhouseCustomEndDate] = useState('');
  const [currentMonthTotal, setCurrentMonthTotal] = useState<number>(0);

  // Inactive filters
  const [inactiveReasonFilter, setInactiveReasonFilter] = useState<string>('all');
  const [inactiveProductFilter, setInactiveProductFilter] = useState<string>('all');
  const [inactiveAdvisorFilter, setInactiveAdvisorFilter] = useState<string>('all');

  // Executive tab: info popover for calculation methodology
  const [execInfoPopup, setExecInfoPopup] = useState<'health' | 'growth' | 'metrics' | 'agents' | 'yearend' | null>(null);

  // Reset inactive filters when month changes
  useEffect(() => {
    setInactiveReasonFilter('all');
    setInactiveProductFilter('all');
    setInactiveAdvisorFilter('all');
  }, [inactiveMonthFilter]);

  // Close exec info popover when switching away from executive tab
  useEffect(() => {
    if (activeTab !== 'executive') setExecInfoPopup(null);
  }, [activeTab]);

  // Close exec info popover when clicking outside
  useEffect(() => {
    if (!execInfoPopup) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-exec-info]') && !target.closest('[data-exec-info-popover]')) {
        setExecInfoPopup(null);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [execInfoPopup]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 500);
  };

  // Fetch deduplicated data from database view for 100% accuracy
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [pastInactives, setPastInactives] = useState<any[]>([]);
  // Predictive tab only: users + members + past_inactives (no view)
  const [predictivePrimaryMembers, setPredictivePrimaryMembers] = useState<any[]>([]);
  const [totalMembersWithDependents, setTotalMembersWithDependents] = useState<number>(0);
  const [viewLoading, setViewLoading] = useState(true);
  const [predictiveRefreshKey, setPredictiveRefreshKey] = useState(0);

  useEffect(() => {
    const fetchFromView = async () => {
      try {
        setViewLoading(true);

        // Fetch past_inactives for historical churn (members not in users/members)
        const fetchPastInactives = async () => {
          const PAGE_SIZE = 1000;
          let allRecords: any[] = [];
          let from = 0;
          let hasMore = true;
          while (hasMore) {
            const { data, error } = await supabase
              .from('past_inactives')
              .select('member_id, inactive_date, inactive_reason, active_date, member_created_date, agent_id')
              .range(from, from + PAGE_SIZE - 1);
            if (error) {
              console.error('[Analytics] Error fetching past_inactives:', error);
              break;
            }
            if (data?.length) {
              allRecords = [...allRecords, ...data];
              from += PAGE_SIZE;
              hasMore = data.length === PAGE_SIZE;
            } else hasMore = false;
          }
          return allRecords;
        };

        // Fetch all member_ids (including dependents) for total count
        const fetchAllMemberIds = async () => {
          const PAGE_SIZE = 1000;
          const allMemberIds = new Set<string>();

          // Fetch from members table
          let from = 0;
          let hasMore = true;
          while (hasMore) {
            const { data, error } = await supabase
              .from('members')
              .select('member_id')
              .range(from, from + PAGE_SIZE - 1);

            if (error) {
              console.error(`[Analytics] Error fetching members:`, error);
              break;
            }

            if (data && data.length > 0) {
              data.forEach(m => allMemberIds.add(m.member_id));
              from += PAGE_SIZE;
              hasMore = data.length === PAGE_SIZE;
            } else {
              hasMore = false;
            }
          }

          // Fetch from users table
          from = 0;
          hasMore = true;
          while (hasMore) {
            const { data, error } = await supabase
              .from('users')
              .select('member_id')
              .range(from, from + PAGE_SIZE - 1);

            if (error) {
              console.error(`[Analytics] Error fetching users:`, error);
              break;
            }

            if (data && data.length > 0) {
              data.forEach(u => allMemberIds.add(u.member_id));
              from += PAGE_SIZE;
              hasMore = data.length === PAGE_SIZE;
            } else {
              hasMore = false;
            }
          }

          return allMemberIds.size;
        };

        // Fetch all primary members records from the view with pagination
        const fetchPrimaryMembers = async () => {
          const PAGE_SIZE = 1000;
          let allRecords: any[] = [];
          let from = 0;
          let hasMore = true;

          while (hasMore) {
            const { data, error } = await supabase
              .from('sales_analytics_view')
              .select('*')
              .range(from, from + PAGE_SIZE - 1);

            if (error) {
              console.error('[Analytics] Error fetching from view:', error);
              break;
            }

            if (data && data.length > 0) {
              allRecords = [...allRecords, ...data];
              from += PAGE_SIZE;
              hasMore = data.length === PAGE_SIZE;
            } else {
              hasMore = false;
            }
          }

          return allRecords;
        };

        // Predictive tab: users + members directly (no view)
        const fetchPredictivePrimaryMembers = async () => {
          const COLS = 'member_id, created_date, active_date, inactive_date, inactive_reason, is_active, is_primary, agent_id, first_name, last_name, dob';
          let usersData: any[] = [];
          let from = 0;
          let hasMore = true;
          while (hasMore) {
            const { data, error } = await supabase.from('users').select(COLS).eq('is_primary', true).range(from, from + 999);
            if (error) break;
            if (data?.length) { usersData = [...usersData, ...data]; from += 1000; hasMore = data.length === 1000; } else hasMore = false;
          }
          const userIds = new Set(usersData.map((r: any) => r.member_id));
          let membersData: any[] = [];
          from = 0;
          hasMore = true;
          while (hasMore) {
            const { data, error } = await supabase.from('members').select(COLS).eq('is_primary', true).range(from, from + 999);
            if (error) break;
            if (data?.length) {
              const filtered = data.filter((r: any) => !userIds.has(r.member_id));
              membersData = [...membersData, ...filtered];
              from += 1000;
              hasMore = data.length === 1000;
            } else hasMore = false;
          }
          return [...usersData, ...membersData];
        };

        // Fetch all in parallel
        const [totalCount, primaryRecords, pastInactivesData, predictiveMembers] = await Promise.all([
          fetchAllMemberIds(),
          fetchPrimaryMembers(),
          fetchPastInactives(),
          fetchPredictivePrimaryMembers()
        ]);

        setTotalMembersWithDependents(totalCount);
        setAllMembers(primaryRecords);
        setPastInactives(pastInactivesData);
        setPredictivePrimaryMembers(predictiveMembers);
      } catch (error) {
        console.error('[Analytics] Failed to fetch from view:', error);
      } finally {
        setViewLoading(false);
      }
    };

    fetchFromView();
  }, [users, members, predictiveRefreshKey]);

  // Inhouse Advisors constants
  const INHOUSE_ADVISORS = [
    {
      id: 'sales_agent',
      agentIds: ['637674', '782709'],
      color: '#3A96DD'
    },
    {
      id: 'agent_2',
      agentIds: ['759696', '763508'],
      color: '#A4CC43'
    },
    {
      id: 'agent_779564',
      agentIds: ['779564', '627618'],
      color: '#F59E0B'
    }
  ];

  // Inhouse Advisors functions
  const getInhouseTimeFilters = () => {
    const now = new Date();
    return [
      { label: 'Last 30 Days', value: '30_days', startDate: subDays(now, 30), endDate: now },
      { label: 'Last 60 Days', value: '60_days', startDate: subDays(now, 60), endDate: now },
      { label: 'Last 90 Days', value: '90_days', startDate: subDays(now, 90), endDate: now },
      { label: 'Last 6 Months', value: '6_months', startDate: subMonths(now, 6), endDate: now },
      { label: 'Last 12 Months', value: '12_months', startDate: subMonths(now, 12), endDate: now },
      { label: 'All Time', value: 'all_time', startDate: new Date(2020, 0, 1), endDate: now },
      { label: 'Custom Range', value: 'custom', startDate: now, endDate: now }
    ];
  };

  const getInhouseDateRange = () => {
    const filters = getInhouseTimeFilters();
    const selectedFilter = filters.find(f => f.value === inhouseTimeFilter);

    if (inhouseTimeFilter === 'custom' && inhouseCustomStartDate && inhouseCustomEndDate) {
      return {
        startDate: new Date(inhouseCustomStartDate),
        endDate: new Date(inhouseCustomEndDate)
      };
    }

    return {
      startDate: selectedFilter?.startDate || subDays(new Date(), 30),
      endDate: selectedFilter?.endDate || new Date()
    };
  };

  const fetchAllRecordsForInhouse = async (agentIds: string[]) => {
    const PAGE_SIZE = 1000;
    let allData: any[] = [];

    for (const agentId of agentIds) {
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('sales_analytics_view')
          .select('*')
          .eq('agent_id', agentId)
          .range(from, from + PAGE_SIZE - 1);

        if (error) {
          console.error(`Error fetching from sales_analytics_view for agent ${agentId}:`, error);
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
    }

    return allData;
  };

  const fetchInhouseAdvisorPerformance = async () => {
    try {
      setInhouseLoading(true);
      const { startDate, endDate } = getInhouseDateRange();

      const { data: advisorsData, error: advisorsError } = await supabase
        .from('advisors')
        .select('agent_id, first_name, last_name')
        .in('agent_id', ['637674', '782709', '759696', '763508', '779564', '627618']);

      if (advisorsError) {
        console.error('Error fetching advisors:', advisorsError);
      }

      const advisorInfoMap = new Map<string, { firstName: string; lastName: string }>();
      advisorsData?.forEach((advisor: any) => {
        advisorInfoMap.set(advisor.agent_id, {
          firstName: advisor.first_name || '',
          lastName: advisor.last_name || ''
        });
      });

      const advisorStatsPromises = INHOUSE_ADVISORS.map(async (advisor) => {
        const deduplicatedData = await fetchAllRecordsForInhouse(advisor.agentIds);

        const firstAdvisorInfo = advisorInfoMap.get(advisor.agentIds[0]);
        const firstName = firstAdvisorInfo?.firstName || 'Unknown';
        const lastName = firstAdvisorInfo?.lastName || 'Advisor';

        const primaryMembersOnly = deduplicatedData;
        const todayStart = startOfDay(new Date());

        const totalMembers = primaryMembersOnly.length;
        const activeMembers = primaryMembersOnly.filter((m: any) => {
          // Count as currently active if: is_active = true AND (no active_date OR active_date <= today)
          if (!m.is_active) return false;
          if (!m.active_date) return true;
          try {
            return startOfDay(parseISO(m.active_date)) <= todayStart;
          } catch (e) {
            return false;
          }
        }).length;
        const inactiveMembers = totalMembers - activeMembers;

        const newEnrollments = primaryMembersOnly.filter((m: any) => {
          if (!m.active_date && !m.created_date) return false;
          try {
            const date = parseISO(m.active_date || m.created_date);
            return isWithinInterval(date, { start: startDate, end: endDate });
          } catch (e) {
            return false;
          }
        }).length;

        const churnedMembers = primaryMembersOnly.filter((m: any) => {
          if (!m.inactive_date) return false;
          try {
            const date = parseISO(m.inactive_date);
            return isWithinInterval(date, { start: startDate, end: endDate });
          } catch (e) {
            return false;
          }
        }).length;

        const salesByCreatedDate = primaryMembersOnly.filter((m: any) => {
          if (!m.created_date) return false;
          try {
            const date = parseISO(m.created_date);
            return isWithinInterval(date, { start: startDate, end: endDate });
          } catch (e) {
            return false;
          }
        }).length;

        const retentionRate = totalMembers > 0
          ? ((activeMembers / totalMembers) * 100).toFixed(1)
          : 0;

        return {
          advisorId: advisor.id,
          firstName,
          lastName,
          agentIds: advisor.agentIds,
          totalMembers,
          activeMembers,
          inactiveMembers,
          retentionRate: parseFloat(retentionRate.toString()),
          newEnrollments,
          churnedMembers,
          salesByCreatedDate,
          color: advisor.color
        };
      });

      const advisorStats = await Promise.all(advisorStatsPromises);
      setInhouseStats(advisorStats);

      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const allAgentIds = INHOUSE_ADVISORS.flatMap(advisor => advisor.agentIds);
      const allDeduplicatedData = await fetchAllRecordsForInhouse(allAgentIds);

      const monthTotal = allDeduplicatedData.filter((m: any) => {
        if (!m.created_date) return false;
        try {
          const date = parseISO(m.created_date);
          return isWithinInterval(date, { start: monthStart, end: monthEnd });
        } catch (e) {
          return false;
        }
      }).length;

      setCurrentMonthTotal(monthTotal);
    } catch (error) {
      console.error('Error fetching inhouse advisor performance:', error);
    } finally {
      setInhouseLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'inhouse') {
      fetchInhouseAdvisorPerformance();
    }
  }, [activeTab, inhouseTimeFilter, inhouseCustomStartDate, inhouseCustomEndDate]);

  const monthsToShow = timeRange === 'all' ? 36 : parseInt(timeRange);

  const churnAnalysis = useMemo((): ChurnData[] => {
    const monthsData: { [key: string]: ChurnData } = {};

    for (let i = monthsToShow - 1; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthKey = format(monthDate, 'yyyy-MM');
      const monthLabel = format(monthDate, 'MMM yyyy');

      monthsData[monthKey] = {
        month: monthLabel,
        monthKey,
        sales: 0,
        activations: 0,
        cancellations: 0,
        netChange: 0,
      };
    }

    allMembers.forEach(member => {
      // Sales = created_date (plan sold)
      if (member.created_date && member.is_primary) {
        try {
          const createdDate = parseISO(member.created_date);
          const monthKey = format(createdDate, 'yyyy-MM');
          if (monthsData[monthKey]) {
            monthsData[monthKey].sales++;
          }
        } catch (e) {
          console.error('Invalid created_date:', member.created_date);
        }
      }

      // Activations = active_date (when plan becomes active / money collection starts)
      if (member.active_date) {
        try {
          const activeDate = parseISO(member.active_date);
          const monthKey = format(activeDate, 'yyyy-MM');
          if (monthsData[monthKey]) {
            monthsData[monthKey].activations++;
          }
        } catch (e) {
          console.error('Invalid active_date:', member.active_date);
        }
      }

      // Cancellations = inactive_date
      if (member.inactive_date) {
        try {
          const inactiveDate = parseISO(member.inactive_date);
          const monthKey = format(inactiveDate, 'yyyy-MM');

          if (monthsData[monthKey]) {
            monthsData[monthKey].cancellations++;
          }
        } catch (e) {
          console.error('Invalid inactive_date:', member.inactive_date);
        }
      }
    });

    // Add historical cancellations from past_inactives (members not in users/members)
    pastInactives.forEach((pi: { inactive_date: string }) => {
      if (!pi.inactive_date) return;
      try {
        const inactiveDate = parseISO(pi.inactive_date);
        const monthKey = format(inactiveDate, 'yyyy-MM');
        if (monthsData[monthKey]) monthsData[monthKey].cancellations++;
      } catch (e) { /* skip */ }
    });

    const result = Object.values(monthsData).map(data => ({
      ...data,
      netChange: data.activations - data.cancellations,
    }));

    return result;
  }, [allMembers, pastInactives, monthsToShow]);

  // Extended churn (60 months) for prediction — uses past_inactives for past years beyond users/members
  const churnForPrediction = useMemo((): ChurnData[] => {
    const PREDICTION_MONTHS = 60;
    const monthsData: { [key: string]: ChurnData } = {};
    for (let i = PREDICTION_MONTHS - 1; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthKey = format(monthDate, 'yyyy-MM');
      monthsData[monthKey] = {
        month: format(monthDate, 'MMM yyyy'),
        monthKey,
        sales: 0,
        activations: 0,
        cancellations: 0,
        netChange: 0,
      };
    }
    predictivePrimaryMembers.forEach(member => {
      if (member.inactive_date) {
        try {
          const monthKey = format(parseISO(member.inactive_date), 'yyyy-MM');
          if (monthsData[monthKey]) monthsData[monthKey].cancellations++;
        } catch (e) { /* skip */ }
      }
    });
    pastInactives.forEach((pi: { inactive_date: string }) => {
      if (!pi.inactive_date) return;
      try {
        const monthKey = format(parseISO(pi.inactive_date), 'yyyy-MM');
        if (monthsData[monthKey]) monthsData[monthKey].cancellations++;
      } catch (e) { /* skip */ }
    });
    return Object.values(monthsData).map(d => ({ ...d, netChange: d.activations - d.cancellations }));
  }, [predictivePrimaryMembers, pastInactives]);

  const inactiveReasonStats = useMemo((): ReasonStats[] => {
    const reasonCounts: { [key: string]: number } = {};
    let totalInactive = 0;

    allMembers.forEach(member => {
      if (member.inactive_reason && member.inactive_reason.trim() !== '') {
        totalInactive++;
        const reason = member.inactive_reason.trim();
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
      }
    });

    return Object.entries(reasonCounts)
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: totalInactive > 0 ? (count / totalInactive) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [allMembers]);

  const monthlyMetrics = useMemo((): MonthlyMetrics[] => {
    const unified = buildUnifiedPrimaryForSnapshot(allMembers, pastInactives);
    const metricsData: MonthlyMetrics[] = [];
    const today = new Date();

    for (let i = monthsToShow - 1; i >= 0; i--) {
      const monthDate = subMonths(today, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      if (monthStart > today) continue;

      const cutoffDate = monthEnd > today ? today : monthEnd;
      const { active: activeCount, inactive: inactiveCount } = primaryActiveInactiveAsOfCutoff(
        unified,
        cutoffDate
      );

      const total = activeCount + inactiveCount;
      metricsData.push({
        month: format(monthDate, 'MMM yyyy'),
        monthKey: format(monthDate, 'yyyy-MM'),
        activeMembers: activeCount,
        inactiveMembers: inactiveCount,
        totalMembers: total,
        activationRate: total > 0 ? (activeCount / total) * 100 : 0,
      });
    }

    return metricsData;
  }, [allMembers, pastInactives, monthsToShow]);

  const futureProjections = useMemo((): FutureProjection[] => {
    const projections: FutureProjection[] = [];
    const today = new Date();

    // Get current active/inactive counts as baseline
    let currentActive = 0;
    let currentInactive = 0;

    allMembers.forEach(member => {
      try {
        const activatedByNow = member.active_date && parseISO(member.active_date) <= today;
        if (!activatedByNow) return;

        const stillActiveNow = !member.inactive_date || parseISO(member.inactive_date) > today;
        if (stillActiveNow) {
          currentActive++;
        } else {
          currentInactive++;
        }
      } catch (e) {
        console.error('Error processing member in future projections:', member.member_id, e);
      }
    });

    // Project next 6 months
    for (let i = 1; i <= 6; i++) {
      const monthDate = subMonths(today, -i); // Add months
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      let scheduledActivations = 0;
      let scheduledInactivations = 0;

      allMembers.forEach(member => {
        try {
          // Count activations scheduled in this future month
          if (member.active_date) {
            const activeDate = parseISO(member.active_date);
            if (activeDate >= monthStart && activeDate <= monthEnd) {
              scheduledActivations++;
            }
          }

          // Count inactivations scheduled in this future month
          if (member.inactive_date) {
            const inactiveDate = parseISO(member.inactive_date);
            if (inactiveDate >= monthStart && inactiveDate <= monthEnd) {
              scheduledInactivations++;
            }
          }
        } catch (e) {
          console.error('Error processing member future activations:', member.member_id, e);
        }
      });

      // Calculate projected totals
      currentActive += scheduledActivations - scheduledInactivations;
      currentInactive += scheduledInactivations;

      projections.push({
        month: format(monthDate, 'MMM yyyy'),
        scheduledActivations,
        scheduledInactivations,
        projectedActive: currentActive,
        projectedInactive: currentInactive,
        projectedTotal: currentActive + currentInactive,
      });
    }

    return projections;
  }, [allMembers]);

  const productStats = useMemo(() => {
    const productCounts: { [key: string]: { count: number; label: string } } = {};

    allMembers.forEach(member => {
      if (member.is_primary && member.product_id && member.product_id.trim() !== '') {
        const key = member.product_id.trim();
        if (!productCounts[key]) {
          productCounts[key] = {
            count: 0,
            label: member.product_label?.trim() || member.product_id.trim(),
          };
        }
        productCounts[key].count++;
      }
    });

    const sortedProducts = Object.entries(productCounts)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count);

    return {
      topProduct: sortedProducts[0] || { id: 'N/A', label: 'N/A', count: 0 },
      allProducts: sortedProducts,
    };
  }, [allMembers]);

  const currentStats = useMemo(() => {
    const total = allMembers.length;
    const todayStart = startOfDay(new Date());

    // Count as currently active if: is_active = true AND (no active_date OR active_date <= today)
    const currentlyActive = allMembers.filter(member => {
      try {
        if (!member.is_active) return false;

        // Active and started (or no active_date means started)
        if (!member.active_date) return true;
        const activeDate = startOfDay(parseISO(member.active_date));
        return activeDate <= todayStart;
      } catch (e) {
        return false;
      }
    }).length;

    const lastMonth = churnAnalysis[churnAnalysis.length - 2] || { sales: 0, activations: 0, cancellations: 0, netChange: 0 };
    const thisMonth = churnAnalysis[churnAnalysis.length - 1] || { sales: 0, activations: 0, cancellations: 0, netChange: 0 };

    const currentQuarterMonths = churnAnalysis.slice(-3);
    const netChangeThisQuarter = currentQuarterMonths.reduce((sum, m) => sum + m.netChange, 0);

    const currentMonthStart = startOfMonth(new Date());
    const currentMonthEnd = endOfMonth(new Date());

    const inactiveThisMonth = allMembers.filter(member => {
      if (!member.inactive_date) return false;
      try {
        const inactiveDate = parseISO(member.inactive_date);
        return isWithinInterval(inactiveDate, { start: currentMonthStart, end: currentMonthEnd });
      } catch (e) {
        return false;
      }
    }).length;

    const totalInactiveAllTime = allMembers.filter(member => member.is_active === false).length;

    // Count members scheduled to activate in the future
    const futureActiveCount = allMembers.filter(member => {
      if (!member.is_active) return false;
      if (!member.active_date) return false;
      try {
        const activeDate = startOfDay(parseISO(member.active_date));
        return activeDate > todayStart;
      } catch (e) {
        return false;
      }
    }).length;

    // Total active plans = currently active + scheduled to activate
    const projectedTotalActive = currentlyActive + futureActiveCount;

    const churnRate = currentlyActive > 0 && thisMonth?.cancellations ? (thisMonth.cancellations / currentlyActive) * 100 : 0;
    const growthRate = lastMonth?.activations > 0
      ? ((thisMonth.activations - lastMonth.activations) / lastMonth.activations) * 100
      : thisMonth?.activations > 0 ? 100 : 0;

    // Avg Lifetime: users + members + past_inactives (exclude past_inactives already in allMembers to avoid double-count)
    const memberIdsWithLifetime = new Set<string>();
    let lifetimeSum = 0;
    let lifetimeCount = 0;
    allMembers.forEach(m => {
      if (!m.active_date || !m.inactive_date) return;
      try {
        const days = differenceInDays(parseISO(m.inactive_date), parseISO(m.active_date));
        if (days > 0) {
          lifetimeSum += days;
          lifetimeCount++;
          memberIdsWithLifetime.add(m.member_id);
        }
      } catch (e) {
        console.error('Error calculating lifetime for member:', m.member_id);
      }
    });
    pastInactives.forEach((pi: { member_id: string; active_date?: string; inactive_date?: string }) => {
      if (!pi.active_date || !pi.inactive_date) return;
      if (memberIdsWithLifetime.has(pi.member_id)) return; // already counted from allMembers
      try {
        const days = differenceInDays(parseISO(pi.inactive_date), parseISO(pi.active_date));
        if (days > 0) {
          lifetimeSum += days;
          lifetimeCount++;
        }
      } catch (e) {
        /* skip invalid dates */
      }
    });
    const avgLifetime = lifetimeCount > 0 ? lifetimeSum / lifetimeCount : 0;

    return {
      activeMembers: currentlyActive,
      inactiveMembers: inactiveThisMonth,
      totalInactiveAllTime,
      totalMembers: total,
      retentionRate: total > 0 ? (currentlyActive / total) * 100 : 0,
      churnRate,
      growthRate,
      avgLifetimeDays: Math.round(avgLifetime),
      salesThisMonth: thisMonth.sales ?? 0,
      newThisMonth: thisMonth.activations,
      cancelledThisMonth: thisMonth.cancellations,
      netChangeThisMonth: thisMonth.netChange,
      netChangeThisQuarter,
      futureActiveCount,
      projectedTotalActive,
    };
  }, [allMembers, churnAnalysis, pastInactives]);

  /** CEO year-end / YTD: live primaries (view) + historical past_inactives; same snapshot rules as Monthly Metrics. */
  const yearEndPrimarySnapshot = useMemo(() => {
    const unified = buildUnifiedPrimaryForSnapshot(allMembers, pastInactives);
    const today = new Date();
    const cy = today.getFullYear();
    const years = [cy - 1, cy];

    return years.map(year => {
      const isCurrentYear = year === cy;
      const cutoffDate = isCurrentYear
        ? today
        : endOfMonth(new Date(year, 11, 1));
      const { active, inactive } = primaryActiveInactiveAsOfCutoff(unified, cutoffDate);
      return {
        year,
        isCurrentYear,
        activePrimaryEnd: active,
        inactivePrimaryEnd: inactive,
        cancellationsInYear: primaryCancellationsInCalendarYear(unified, year),
        salesByCreatedDate: primarySalesByMemberCreatedYear(allMembers, pastInactives, year),
        asOfLabel: isCurrentYear ? format(today, 'MMM d, yyyy') : `Dec 31, ${year}`,
      };
    });
  }, [allMembers, pastInactives]);

  const [primaryMembershipExporting, setPrimaryMembershipExporting] = useState(false);

  const exportPrimaryMembershipExcel = async () => {
    if (viewLoading) {
      toast.error('Wait for analytics data to finish loading.');
      return;
    }
    if (!allMembers.length && !pastInactives.length) {
      toast.error('No primary membership data to export.');
      return;
    }
    setPrimaryMembershipExporting(true);
    try {
      const { downloadPrimaryMembershipExcel } = await import('@/utils/membershipAnalytics/primaryMembershipExcelExport');
      const { data: salesData, error } = await supabase.rpc('get_sales_metrics', { months_back: 36 });
      if (error) throw error;
      await downloadPrimaryMembershipExcel({
        allMembers,
        pastInactives,
        yearSnapshots: yearEndPrimarySnapshot,
        salesMonthly: (salesData || []).map((row: any) => ({
          month_key: String(row.month_key ?? ''),
          month_label: String(row.month_label ?? ''),
          sales_count: Number(row.sales_count ?? 0),
          pre_cancellations: Number(row.pre_cancellations ?? 0),
        })),
      });
      toast.success('Excel report downloaded.');
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : 'Export failed.';
      toast.error(msg);
    } finally {
      setPrimaryMembershipExporting(false);
    }
  };

  const topCancellationReasons = inactiveReasonStats.slice(0, 5);

  // Sales Analytics - Fetch from database function for 100% accuracy
  const [salesAnalytics, setSalesAnalytics] = useState<any>({
    monthlyData: [],
    currentMonthSales: 0,
    lastMonthSales: 0,
    salesGrowth: 0,
    totalSales: 0,
    topAgents: [],
    totalAgents: 0,
    topProducts: [],
    totalPreCancellations: 0,
    currentMonthPreCancellations: 0,
    lastMonthPreCancellations: 0,
    lastWeek: null as null | {
      week_label: string;
      week_start_date: string;
      week_end_date: string;
      plans_sold: number;
      cancellations_in_week: number;
      net_plans_sold_minus_view_cancellations: number;
    },
  });

  // Generate available months from sales data
  const availableMonths = useMemo(() => {
    if (allMembers.length === 0) return [];

    const monthsSet = new Set<string>();
    allMembers.forEach(member => {
      if (member.created_date && member.is_primary === true) {
        try {
          const monthKey = format(parseISO(member.created_date), 'yyyy-MM');
          monthsSet.add(monthKey);
        } catch (e) {
          // Invalid date
        }
      }
    });

    // Sort months in descending order (newest first)
    return Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
  }, [allMembers]);

  useEffect(() => {
    const fetchSalesMetrics = async () => {
      try {
        const [{ data: salesData, error: salesError }, { data: lastWeekRows, error: lastWeekError }] =
          await Promise.all([
            supabase.rpc('get_sales_metrics', { months_back: monthsToShow }),
            supabase.rpc('get_last_week_metrics'),
          ]);

        if (salesError) {
          console.error('[Sales Analytics] Error fetching sales metrics:', salesError);
          return;
        }

        if (lastWeekError) {
          console.error('[Sales Analytics] Error fetching last week metrics:', lastWeekError);
        }
        const lastWeekRow = !lastWeekError && lastWeekRows?.[0] ? lastWeekRows[0] : null;
        const lastWeek = lastWeekRow
          ? {
              week_label: String(lastWeekRow.week_label ?? ''),
              week_start_date: String(lastWeekRow.week_start_date ?? ''),
              week_end_date: String(lastWeekRow.week_end_date ?? ''),
              plans_sold: Number(lastWeekRow.plans_sold ?? 0),
              cancellations_in_week: Number(lastWeekRow.cancellations_in_week ?? 0),
              net_plans_sold_minus_view_cancellations: Number(
                lastWeekRow.net_plans_sold_minus_view_cancellations ?? 0
              ),
            }
          : null;

        // Build monthly data array
        const monthlyData = salesData.map((row: any) => ({
          month: row.month_label,
          sales: row.sales_count,
          preCancellations: row.pre_cancellations
        }));

        // Get current and last month
        const currentMonthKey = format(new Date(), 'yyyy-MM');
        const lastMonthKey = format(subMonths(new Date(), 1), 'yyyy-MM');

        const currentMonth = salesData.find((row: any) => row.month_key === currentMonthKey);
        const lastMonth = salesData.find((row: any) => row.month_key === lastMonthKey);

        const currentMonthSales = currentMonth?.sales_count || 0;
        const lastMonthSales = lastMonth?.sales_count || 0;
        const currentMonthPreCancellations = currentMonth?.pre_cancellations || 0;
        const lastMonthPreCancellations = lastMonth?.pre_cancellations || 0;

        const salesGrowth = lastMonthSales > 0
          ? ((currentMonthSales - lastMonthSales) / lastMonthSales) * 100
          : 0;

        const totalSales = salesData.reduce((sum: number, row: any) => sum + row.sales_count, 0);
        const totalPreCancellations = salesData.reduce((sum: number, row: any) => sum + row.pre_cancellations, 0);

        // Fetch top agents from database function for live data
        const monthFilterParam = agentMonthFilter === 'current' ? 'current' :
                                  agentMonthFilter === 'all' ? 'all' :
                                  agentMonthFilter;

        const { data: topAgentsData, error: topAgentsError } = await supabase
          .rpc('get_top_sales_agents', {
            month_filter: monthFilterParam,
            limit_count: 50
          });

        if (topAgentsError) {
          console.error('[Sales Analytics] Error fetching top agents:', topAgentsError);
        }

        const topAgents = (topAgentsData || []).map((agent: any) => ({
          agent_id: agent.agent_id,
          agent_name: agent.agent_name,
          count: Number(agent.count),
          preCancelled: Number(agent.pre_cancelled),
          netSales: Number(agent.net_sales)
        }));

        // Calculate product stats from allMembers for current month
        const productSalesThisMonth: { [key: string]: { count: number; product_id: string; product_label: string; product_benefit: string } } = {};

        allMembers.forEach(member => {
          if (!member.created_date || member.is_primary !== true) return;

          try {
            const createdDate = parseISO(member.created_date);
            const monthKey = format(createdDate, 'yyyy-MM');

            // Track product sales for current month only
            if (monthKey === currentMonthKey && member.product_id) {
              if (!productSalesThisMonth[member.product_id]) {
                productSalesThisMonth[member.product_id] = {
                  count: 0,
                  product_id: member.product_id,
                  product_label: member.product_label || 'Unknown Product',
                  product_benefit: member.product_benefit || ''
                };
              }
              productSalesThisMonth[member.product_id].count++;
            }
          } catch (e) {
            console.error('[Sales Analytics] Invalid created_date:', member.created_date, e);
          }
        });

        // Sort products by sales count
        const topProducts = Object.values(productSalesThisMonth)
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);

        setSalesAnalytics({
          monthlyData,
          currentMonthSales,
          lastMonthSales,
          salesGrowth,
          totalSales,
          topAgents,
          totalAgents: topAgents.length,
          topProducts,
          totalPreCancellations,
          currentMonthPreCancellations,
          lastMonthPreCancellations,
          lastWeek,
        });
      } catch (error) {
        console.error('[Sales Analytics] Error:', error);
      }
    };

    if (allMembers.length > 0) {
      fetchSalesMetrics();
    }
  }, [allMembers, monthsToShow, agentMonthFilter]);

  const exportAgentMembers = async (agentId: string, agentName: string) => {
    try {
      const fetchFromTable = async (tableName: string) => {
        const allRecords: any[] = [];
        let from = 0;
        const batchSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const query = supabase
            .from(tableName)
            .select('*')
            .eq('agent_id', agentId)
            .eq('is_primary', true)
            .range(from, from + batchSize - 1);

          const { data, error } = await query;
          if (error) throw error;

          if (data && data.length > 0) {
            allRecords.push(...data);
            from += batchSize;
            hasMore = data.length === batchSize;
          } else {
            hasMore = false;
          }
        }

        return allRecords;
      };

      const [membersData, usersData] = await Promise.all([
        fetchFromTable('members'),
        fetchFromTable('users')
      ]);

      const allMembers = [...membersData, ...usersData];

      if (allMembers.length === 0) {
        alert('No members found for this agent.');
        return;
      }

      const headers = [
        'Member ID',
        'First Name',
        'Last Name',
        'Email',
        'Phone',
        'Product ID',
        'Product Label',
        'Active Date',
        'Inactive Date',
        'Is Active',
        'Status'
      ];

      const csvRows = [headers.join(',')];

      allMembers.forEach(member => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const hasValidInactiveDate = member.inactive_date &&
          parseISO(member.inactive_date) > parseISO(member.active_date);
        const stillActive = !member.inactive_date ||
          !hasValidInactiveDate ||
          parseISO(member.inactive_date) > today;

        const status = member.is_active && stillActive ? 'Active' : 'Inactive';

        const row = [
          member.member_id || '',
          (member.first_name || '').replace(/,/g, ''),
          (member.last_name || '').replace(/,/g, ''),
          member.email || '',
          member.phone || '',
          member.product_id || '',
          (member.product_label || '').replace(/,/g, ''),
          member.active_date || '',
          member.inactive_date || '',
          member.is_active ? 'Yes' : 'No',
          status
        ];

        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `agent_${agentId}_${agentName.replace(/\s+/g, '_')}_members_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting agent members:', error);
      alert('Error exporting data. Please try again.');
    }
  };

  const exportInactiveMembersThisMonth = () => {
    try {
      const now = new Date();
      let monthStart: Date, monthEnd: Date, monthLabel: string;
      if (inactiveMonthFilter === 'current') {
        monthStart = startOfMonth(now);
        monthEnd = endOfMonth(now);
        monthLabel = format(now, 'MMMM_yyyy');
      } else {
        const filterDate = parseISO(inactiveMonthFilter + '-01');
        monthStart = startOfMonth(filterDate);
        monthEnd = endOfMonth(filterDate);
        monthLabel = format(filterDate, 'MMMM_yyyy');
      }

      const inactives = allMembers.filter(member => {
        if (!member.inactive_date) return false;
        try {
          const d = parseISO(member.inactive_date);
          return d >= monthStart && d <= monthEnd;
        } catch {
          return false;
        }
      });

      if (inactives.length === 0) {
        alert('No inactive members for this month.');
        return;
      }

      const headers = ['Member ID', 'First Name', 'Last Name', 'Inactive Date', 'Reason'];
      const csvRows = [headers.map(h => `"${h}"`).join(',')];

      inactives.forEach(member => {
        const row = [
          (member.member_id || '').replace(/"/g, '""'),
          (member.first_name || '').replace(/"/g, '""'),
          (member.last_name || '').replace(/"/g, '""'),
          member.inactive_date ? format(parseISO(member.inactive_date), 'yyyy-MM-dd') : '',
          (member.inactive_reason || 'No reason provided').replace(/"/g, '""')
        ];
        csvRows.push(row.map(c => `"${c}"`).join(','));
      });

      const csvContent = '\uFEFF' + csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `cancellations_${monthLabel}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting inactive members:', error);
      alert('Error exporting data. Please try again.');
    }
  };

  const getTrophyColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-500';
      case 2: return 'text-gray-400';
      case 3: return 'text-orange-600';
      default: return 'text-gray-300';
    }
  };

  const allMembersForContest = useMemo(() => {
    return [...members, ...users];
  }, [members, users]);

  const filteredAgentPerformance = useMemo(() => {
    const filteredMembers = [...allMembersForContest];
    const todayStart = startOfDay(new Date());

    // Helper to get unified agent ID for inhouse advisors with multiple IDs
    const getUnifiedAgentId = (agentId: string): string => {
      const inhouseAdvisor = INHOUSE_ADVISORS.find(advisor => advisor.agentIds.includes(agentId));
      return inhouseAdvisor ? inhouseAdvisor.agentIds[0] : agentId;
    };

    const agentMap = new Map<string, {
      agent_id: string;
      agent_name: string;
      total: number;
      active: number;
      inactive: number;
    }>();

    filteredMembers.forEach(member => {
      if (!member.agent_id || !member.is_primary) return;

      // Use unified ID for agents with multiple IDs
      const unifiedAgentId = getUnifiedAgentId(member.agent_id);

      if (!agentMap.has(unifiedAgentId)) {
        // Look up advisor info using the unified ID
        const advisor = advisors.find(a => a.agent_id === unifiedAgentId);
        const agentName = advisor
          ? `${advisor.first_name} ${advisor.last_name}`
          : unifiedAgentId;

        agentMap.set(unifiedAgentId, {
          agent_id: unifiedAgentId,
          agent_name: agentName,
          total: 0,
          active: 0,
          inactive: 0
        });
      }

      const agentData = agentMap.get(unifiedAgentId)!;
      agentData.total += 1;

      // Count as currently active if: is_active = true AND (no active_date OR active_date <= today)
      const isCurrentlyActive = member.is_active && (!member.active_date || startOfDay(parseISO(member.active_date)) <= todayStart);

      if (isCurrentlyActive) {
        agentData.active += 1;
      } else {
        agentData.inactive += 1;
      }
    });

    let performanceList = Array.from(agentMap.values())
      .map(agent => ({
        agent_id: agent.agent_id,
        agent_name: agent.agent_name,
        total_members: agent.total,
        active_members: agent.active,
        inactive_members: agent.inactive
      }))
      .sort((a, b) => b.total_members - a.total_members)
      .map((agent, index) => ({
        ...agent,
        rank: index + 1
      }));

    if (agentSearchQuery.trim()) {
      const query = agentSearchQuery.toLowerCase();
      performanceList = performanceList.filter(agent =>
        agent.agent_name.toLowerCase().includes(query) ||
        agent.agent_id.toLowerCase().includes(query)
      );
    }

    return performanceList;
  }, [allMembersForContest, advisors, agentSearchQuery]);

  const contestTotalStats = useMemo(() => {
    return filteredAgentPerformance.reduce(
      (acc, agent) => ({
        total: acc.total + agent.total_members,
        active: acc.active + agent.active_members,
        inactive: acc.inactive + agent.inactive_members
      }),
      { total: 0, active: 0, inactive: 0 }
    );
  }, [filteredAgentPerformance]);

  // EXECUTIVE DASHBOARD - Growth Rate Analysis
  const growthMetrics = useMemo(() => {
    const last12Months = churnAnalysis.slice(-12);
    const last6Months = churnAnalysis.slice(-6);
    const last3Months = churnAnalysis.slice(-3);

    const calculateGrowthRate = (data: ChurnData[]) => {
      if (data.length < 2) return 0;
      const totalGrowth = data.reduce((sum, d) => sum + d.netChange, 0);
      const avgBase = data.reduce((sum, d) => sum + d.activations, 0) / data.length;
      return avgBase > 0 ? (totalGrowth / avgBase) * 100 : 0;
    };

    return {
      annual: calculateGrowthRate(last12Months),
      sixMonth: calculateGrowthRate(last6Months),
      quarterly: calculateGrowthRate(last3Months),
      momentum: calculateGrowthRate(last3Months) - calculateGrowthRate(last6Months)
    };
  }, [churnAnalysis]);

  // EXECUTIVE DASHBOARD - Health Score
  const businessHealthScore = useMemo(() => {
    const retentionScore = Math.min(100, currentStats.retentionRate);
    const growthScore = Math.min(100, Math.max(0, 50 + growthMetrics.quarterly * 2));
    const churnScore = Math.max(0, 100 - (currentStats.churnRate * 10));
    const lifetimeScore = Math.min(100, (currentStats.avgLifetimeDays / 365) * 20);

    const overallScore = (retentionScore * 0.35 + growthScore * 0.25 + churnScore * 0.25 + lifetimeScore * 0.15);

    return {
      overall: Math.round(overallScore),
      retention: Math.round(retentionScore),
      growth: Math.round(growthScore),
      churn: Math.round(churnScore),
      lifetime: Math.round(lifetimeScore),
      trend: growthMetrics.momentum > 0 ? 'improving' : growthMetrics.momentum < -2 ? 'declining' : 'stable'
    };
  }, [currentStats, growthMetrics]);

  // PREDICTIVE ANALYTICS - Churn Prediction
  const churnRiskAnalysis = useMemo(() => {
    const activeMembers = allMembers.filter(m => m.is_active);
    const today = new Date();

    const atRisk = activeMembers.filter(member => {
      if (!member.active_date) return false;
      try {
        const activeDate = parseISO(member.active_date);
        const daysActive = differenceInDays(today, activeDate);
        const avgLifetime = currentStats.avgLifetimeDays;

        // At risk if they're past 80% of average lifetime
        return daysActive > (avgLifetime * 0.8);
      } catch (e) {
        return false;
      }
    });

    const productMap = atRisk.reduce((map, member) => {
      const key = member.product_label || member.product_id;
      map.set(key, (map.get(key) || 0) + 1);
      return map;
    }, new Map<string, number>());

    return {
      totalAtRisk: atRisk.length,
      percentage: activeMembers.length > 0 ? (atRisk.length / activeMembers.length) * 100 : 0,
      byProduct: (Array.from(productMap.entries()) as [string, number][])
        .map(([product, count]) => ({ product, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    };
  }, [allMembers, currentStats]);

  // PREDICTIVE ANALYTICS - Forecasting
  const forecastAnalysis = useMemo(() => {
    const historicalData = churnAnalysis.slice(-12);
    if (historicalData.length < 6) return null;

    // Simple linear regression for trend
    const calculateTrend = (data: number[]) => {
      const n = data.length;
      const sumX = data.reduce((sum, _, i) => sum + i, 0);
      const sumY = data.reduce((sum, val) => sum + val, 0);
      const sumXY = data.reduce((sum, val, i) => sum + (i * val), 0);
      const sumXX = data.reduce((sum, _, i) => sum + (i * i), 0);

      const denominator = n * sumXX - sumX * sumX;
      if (denominator === 0) return { slope: 0, intercept: n > 0 ? sumY / n : 0 };
      const slope = (n * sumXY - sumX * sumY) / denominator;
      const intercept = (sumY - slope * sumX) / n;

      return { slope, intercept };
    };

    const activations = historicalData.map(d => d.activations);
    const cancellations = historicalData.map(d => d.cancellations);

    const activationTrend = calculateTrend(activations);
    const cancellationTrend = calculateTrend(cancellations);

    // Forecast next 3 months
    const forecast = [];
    for (let i = 1; i <= 3; i++) {
      const forecastMonth = format(subMonths(new Date(), -i), 'MMM yyyy');
      const predictedActivations = Math.max(0, Math.round(activationTrend.intercept + activationTrend.slope * (historicalData.length + i)));
      const predictedCancellations = Math.max(0, Math.round(cancellationTrend.intercept + cancellationTrend.slope * (historicalData.length + i)));

      forecast.push({
        month: forecastMonth,
        predictedActivations,
        predictedCancellations,
        predictedNet: predictedActivations - predictedCancellations,
        confidence: Math.max(60, 95 - (i * 10))
      });
    }

    return {
      forecast,
      trend: activationTrend.slope > cancellationTrend.slope ? 'positive' : 'negative',
      reliability: historicalData.length >= 12 ? 'high' : 'moderate'
    };
  }, [churnAnalysis]);

  // Average cancellations this year = avg cancellations per month (uses churnForPrediction for full year)
  const avgCancellationsThisYear = useMemo(() => {
    const thisYear = new Date().getFullYear();
    const thisYearMonths = churnForPrediction.filter(d => {
      const [y] = d.monthKey.split('-').map(Number);
      return y === thisYear;
    });
    if (thisYearMonths.length === 0) return null;
    const sum = thisYearMonths.reduce((s, d) => s + d.cancellations, 0);
    return sum / thisYearMonths.length;
  }, [churnForPrediction]);

  // Transaction declined rate — Predictive tab: users + members + past_inactives
  const transactionDeclinedPrediction = useMemo(() => {
    const isTransactionDeclined = (reason: string) => {
      const r = (reason || '').toLowerCase();
      return (r.includes('transaction') && r.includes('declined')) ||
        (r.includes('payment') && r.includes('declined')) ||
        (r.includes('card') && r.includes('declined')) ||
        r.includes('bank declined');
    };
    const thisYear = new Date().getFullYear();
    const cutoff12 = subMonths(new Date(), 12);
    let totalThisYear = 0, countThisYear = 0;
    let totalLast12 = 0, countLast12 = 0;

    predictivePrimaryMembers.forEach(member => {
      if (!member.inactive_date) return;
      try {
        const inactiveDate = parseISO(member.inactive_date);
        const declined = isTransactionDeclined((member.inactive_reason || '').trim());
        if (inactiveDate.getFullYear() === thisYear) {
          totalThisYear++;
          if (declined) countThisYear++;
        }
        if (inactiveDate >= cutoff12) {
          totalLast12++;
          if (declined) countLast12++;
        }
      } catch (e) { /* skip */ }
    });

    pastInactives.forEach((pi: { inactive_date: string; inactive_reason?: string }) => {
      if (!pi.inactive_date) return;
      try {
        const inactiveDate = parseISO(pi.inactive_date);
        const declined = isTransactionDeclined((pi.inactive_reason || '').trim());
        if (inactiveDate.getFullYear() === thisYear) {
          totalThisYear++;
          if (declined) countThisYear++;
        }
        if (inactiveDate >= cutoff12) {
          totalLast12++;
          if (declined) countLast12++;
        }
      } catch (e) { /* skip */ }
    });

    const rate = totalThisYear > 0 ? countThisYear / totalThisYear : (totalLast12 > 0 ? countLast12 / totalLast12 : 0);
    return { rate, totalCancelled: totalThisYear, transactionDeclinedCount: countThisYear };
  }, [predictivePrimaryMembers, pastInactives]);

  // Predicted age-out (65) cancellations next month — cancellation happens the MONTH BEFORE birthday
  // So for April cancellations, find people who turn 65 in MAY (month after next month)
  const predictedAgeOutNextMonth = useMemo(() => {
    const nextMonth = subMonths(new Date(), -1); // e.g. April
    const birthdayMonth = subMonths(new Date(), -2); // month AFTER next month, e.g. May — they turn 65 in May, cancelled in April
    const targetYear = birthdayMonth.getFullYear();
    const targetMonth = birthdayMonth.getMonth() + 1; // 1-12
    const birthYear = targetYear - 65;

    return predictivePrimaryMembers.filter(member => {
      if (!member.is_primary || !member.dob) return false;
      if (!member.is_active) return false; // already inactive — don't count
      try {
        const dobStr = String(member.dob);
        const match = dobStr.match(/^(\d{4})-(\d{2})/);
        if (!match) return false;
        const dobYear = parseInt(match[1], 10);
        const dobMonth = parseInt(match[2], 10); // 1-12
        return dobYear === birthYear && dobMonth === targetMonth;
      } catch (e) {
        return false;
      }
    }).map(m => ({
      member_id: m.member_id,
      first_name: m.first_name || '',
      last_name: m.last_name || '',
      dob: m.dob,
      agent_id: m.agent_id,
    }));
  }, [predictivePrimaryMembers]);

  // Scheduled activations next month = actual count from active_date (no estimation)
  const scheduledActivationsNextMonth = useMemo(() => {
    const nextMonthStart = startOfMonth(subMonths(new Date(), -1));
    const nextMonthEnd = endOfMonth(subMonths(new Date(), -1));
    return predictivePrimaryMembers.filter(member => {
      if (!member.active_date) return false;
      try {
        const activeDate = parseISO(member.active_date);
        return isWithinInterval(activeDate, { start: nextMonthStart, end: nextMonthEnd });
      } catch (e) {
        return false;
      }
    }).length;
  }, [predictivePrimaryMembers]);

  // Next month prediction: V2.3 Median of 3 (Seasonal Naive + Recency + Blend) — matches generatePredictionReport
  const nextMonthPrediction = useMemo(() => {
    const fullChurn = churnForPrediction;
    const historicalData = fullChurn.slice(-12);
    if (historicalData.length < 3) return null;

    const activationsNextMonth = scheduledActivationsNextMonth;
    const nextMonthDate = subMonths(new Date(), -1);
    const nextMonthNum = nextMonthDate.getMonth() + 1; // 1-12

    // Age-out per month (members turning 65 in month AFTER cancellation)
    const getAgeOutForMonthKey = (monthKey: string): number => {
      const [y, m] = monthKey.split('-').map(Number);
      const nextMonthYear = m === 12 ? y + 1 : y;
      const nextMonthMonth = m === 12 ? 1 : m + 1;
      const birthYear = nextMonthYear - 65;
      return predictivePrimaryMembers.filter(member => {
        if (!member.dob || !member.is_primary) return false;
        try {
          const s = String(member.dob);
          const match = s.match(/^(\d{4})-(\d{2})/);
          return match && parseInt(match[1], 10) === birthYear && parseInt(match[2], 10) === nextMonthMonth;
        } catch { return false; }
      }).length;
    };

    const behavioralByMonth: Record<string, number> = {};
    fullChurn.forEach(d => {
      const ageOut = getAgeOutForMonthKey(d.monthKey);
      behavioralByMonth[d.monthKey] = Math.max(0, d.cancellations - ageOut);
    });

    const byMonthNum: Record<number, number[]> = {};
    fullChurn.forEach(d => {
      const [, m] = d.monthKey.split('-').map(Number);
      if (!byMonthNum[m]) byMonthNum[m] = [];
      byMonthNum[m].push(d.cancellations);
    });
    const overallAvg = fullChurn.reduce((s, d) => s + d.cancellations, 0) / fullChurn.length || 1;
    const seasonalIndex: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) {
      const vals = byMonthNum[m] || [];
      const monthAvg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 1;
      seasonalIndex[m] = overallAvg > 0 ? monthAvg / overallAvg : 1;
    }
    const idx = seasonalIndex[nextMonthNum] ?? 1;

    const LAMBDA = 0.5;
    const recencyWeights = [0.35, 0.25, 0.18, 0.12, 0.07, 0.03];
    const enrollmentBoostByMonth: Record<number, number> = {
      1: 1.32, 2: 1.16, 10: 1.35, 11: 1.55, 12: 1.45,
    };
    const enrollmentMonths = [1, 2, 10, 11, 12];
    const seasonalDampenerByMonth: Record<number, number> = { 3: 0.55, 6: 0.92, 9: 0.78 }; // Mar 0.55: post-OEP; Apr: recency exclusion only
    const enrollmentBoost = enrollmentBoostByMonth[nextMonthNum] ?? 1;
    const seasonalDampener = seasonalDampenerByMonth[nextMonthNum] ?? 1;
    const isEnrollmentMonth = enrollmentBoost > 1;

    const avgAllMonths = historicalData.reduce((s, d) => s + d.cancellations, 0) / historicalData.length;
    const isPostOEPRecency = nextMonthNum === 3 || nextMonthNum === 4;
    const last18Months = fullChurn.slice(-18);
    const recencyMonths = isPostOEPRecency
      ? last18Months.filter(d => !enrollmentMonths.includes(parseInt(d.monthKey.split('-')[1], 10))).slice(-6)
      : historicalData.slice(-6);
    const last6Months = recencyMonths.length >= 2 ? recencyMonths : historicalData.slice(-6);
    const last24 = fullChurn.slice(-24).map(d => d.cancellations);
    const sorted = [...last24].sort((a, b) => a - b);
    const cap95 = sorted.length > 0 ? sorted[Math.max(0, Math.min(Math.ceil(0.95 * sorted.length) - 1, sorted.length - 1))] : 9999;
    const last6Capped = last6Months.map(d => Math.min(d.cancellations, cap95));
    const weights = recencyWeights.slice(0, last6Capped.length);
    const weightSum = weights.reduce((a, b) => a + b, 0);
    const avgLast6Months = last6Capped.length > 0 && weightSum > 0
      ? last6Capped.reduce((s, c, i) => s + c * weights[i], 0) / weightSum
      : avgAllMonths;

    const recencyOrFallback = avgLast6Months > 0 ? avgLast6Months : (avgCancellationsThisYear ?? avgAllMonths);
    const damp = seasonalDampener;

    // Same month from past years (behavioral only)
    let sameMonthWeightedSum = 0, sameMonthWeightTotal = 0, sameMoYears = 0;
    for (let y = 1; y <= 5; y++) {
      const key = `${nextMonthDate.getFullYear() - y}-${String(nextMonthNum).padStart(2, '0')}`;
      const val = behavioralByMonth[key] ?? 0;
      if (val > 0) {
        const w = Math.exp(-LAMBDA * y);
        sameMonthWeightedSum += val * w;
        sameMonthWeightTotal += w;
        sameMoYears++;
      }
    }
    const sameMonthLastYear = sameMonthWeightTotal > 0 ? sameMonthWeightedSum / sameMonthWeightTotal : null;

    // Growth factor
    const prior6Months = fullChurn.slice(-12, -6);
    const avgPrior6 = prior6Months.length > 0 ? prior6Months.reduce((s, d) => s + d.cancellations, 0) / prior6Months.length : avgLast6Months;
    const growthFactor = avgPrior6 > 0 ? Math.max(0.95, Math.min(1.05, avgLast6Months / avgPrior6)) : 1;

    // Trend
    const last3 = fullChurn.slice(-3).reduce((s, d) => s + d.cancellations, 0) / 3;
    const prior3 = fullChurn.slice(-6, -3).reduce((s, d) => s + d.cancellations, 0) / 3;
    const momentum = Math.max(-0.25, Math.min(0.25, prior3 > 0 ? (last3 - prior3) / prior3 : 0));
    const trendFactor = 1 + 0.4 * momentum;

    // March & April: dampen only recency (same-month already reflects post-OEP level)
    const recencyForBlend = isPostOEPRecency && damp < 1 ? recencyOrFallback * damp : recencyOrFallback;
    const blendDamp = isPostOEPRecency && damp < 1 ? 1 : seasonalDampener;

    // Blend (V2.2)
    let predictedBehavioral: number;
    if (sameMoYears >= 2 && sameMonthLastYear != null && sameMonthLastYear > 0) {
      predictedBehavioral = sameMonthLastYear * 0.6 + recencyForBlend * 0.4;
    } else if (sameMoYears === 1 && sameMonthLastYear != null && sameMonthLastYear > 0) {
      predictedBehavioral = sameMonthLastYear * 0.7 + recencyForBlend * 0.3;
    } else {
      predictedBehavioral = recencyForBlend * 0.8 + (overallAvg * idx) * 0.2;
    }
    predictedBehavioral *= enrollmentBoost * blendDamp * growthFactor * trendFactor;

    // Method 1: Seasonal Naive — Mar/Apr: no dampener (same-month already reflects post-OEP)
    const seasonalNaiveVal = (sameMonthWeightTotal > 0 ? sameMonthWeightedSum / sameMonthWeightTotal : recencyOrFallback) * enrollmentBoost * (isPostOEPRecency && damp < 1 ? 1 : seasonalDampener);

    // Method 2: Recency only — Mar/Apr: dampen (recency from non-enrollment months still needs adjustment)
    const recencyOnlyVal = avgLast6Months * enrollmentBoost * seasonalDampener;

    // Median of 3 (research-backed for limited data)
    const medianOf3 = (a: number, b: number, c: number) => {
      const s = [a, b, c].sort((x, y) => x - y);
      return s[1];
    };
    const ageOutCount = predictedAgeOutNextMonth.length;
    const expectedCancellationsBase = ageOutCount + Math.round(medianOf3(seasonalNaiveVal, recencyOnlyVal, predictedBehavioral));

    const predictedNetBase = activationsNextMonth - expectedCancellationsBase;
    const isWinning = predictedNetBase >= 0;
    const nextMonthLabel = format(subMonths(new Date(), -1), 'MMM yyyy');

    // Scenarios (V2.1): use mean(actuals) for variance; cap band at ±25% of base
    const thisYearCancellations = (fullChurn.filter(d => d.monthKey.startsWith(String(new Date().getFullYear())))).map(d => d.cancellations);
    const meanActuals = thisYearCancellations.length >= 2
      ? thisYearCancellations.reduce((a, b) => a + b, 0) / thisYearCancellations.length
      : expectedCancellationsBase;
    let cancelStd = thisYearCancellations.length >= 2
      ? Math.sqrt(thisYearCancellations.reduce((s, n) => s + Math.pow(n - meanActuals, 2), 0) / thisYearCancellations.length)
      : (last24.length >= 2 ? Math.sqrt(last24.reduce((s, n) => s + Math.pow(n - last24.reduce((a, b) => a + b, 0) / last24.length, 2), 0) / last24.length) : 8);
    const bandWidth = Math.min(1.28 * cancelStd, expectedCancellationsBase * 0.25);
    const predictedNetBest = activationsNextMonth - Math.max(ageOutCount, expectedCancellationsBase - bandWidth);
    const predictedNetWorst = activationsNextMonth - (expectedCancellationsBase + bandWidth);

    const historicalNets = historicalData.map(d => d.netChange);
    const avgNet12 = historicalNets.reduce((a, b) => a + b, 0) / historicalNets.length;
    const netVariance = historicalNets.reduce((s, n) => s + Math.pow(n - avgNet12, 2), 0) / historicalNets.length;
    const netStdDev = Math.sqrt(netVariance);
    const confidencePct = Math.min(95, Math.max(60, 85 - Math.round(netStdDev / 2)));

    const avgCancel = avgCancellationsThisYear ?? historicalData.reduce((s, d) => s + d.cancellations, 0) / historicalData.length;

    const boostPct = Math.round((enrollmentBoost - 1) * 100);
    const dampenerPct = seasonalDampener < 1 ? Math.round((1 - seasonalDampener) * 100) : 0;
    let baseDesc = isEnrollmentMonth
      ? (sameMonthLastYear != null ? `60% same mo (${sameMoYears}y) + 40% recency + ${boostPct}%` : `80% recency + 20% seasonal + ${boostPct}%`)
      : sameMonthLastYear != null
        ? `60% same mo (${sameMoYears}y) + 40% recency`
        : `80% recency + 20% seasonal (${(idx * 100).toFixed(0)}%)`;
    if (dampenerPct > 0) baseDesc += `, −${dampenerPct}% seasonal`;
    const trendPct = Math.round((trendFactor - 1) * 100);
    const sourceLabel = `Median of 3 (V2.3): ${trendFactor !== 1 ? `${baseDesc}, trend ${trendPct >= 0 ? '+' : ''}${trendPct}%` : baseDesc}`;

    const predictedCancellationsRounded = expectedCancellationsBase;
    const nonAgeOut = Math.max(0, predictedCancellationsRounded - ageOutCount);
    const predictedTransactionDeclined = Math.round(nonAgeOut * transactionDeclinedPrediction.rate);
    const otherCount = Math.max(0, nonAgeOut - predictedTransactionDeclined);

    return {
      nextMonthLabel,
      isEnrollmentMonth,
      scheduledActivationsNextMonth: activationsNextMonth,
      predictedCancellations: predictedCancellationsRounded,
      predictedBreakdown: {
        ageOut: ageOutCount,
        transactionDeclined: predictedTransactionDeclined,
        other: Math.round(otherCount),
      },
      transactionDeclinedRatePct: (transactionDeclinedPrediction.rate * 100).toFixed(1),
      transactionDeclinedThisYear: transactionDeclinedPrediction.transactionDeclinedCount,
      totalCancelledThisYear: transactionDeclinedPrediction.totalCancelled,
      sourceLabel,
      avgCancellationsForComparison: Math.round(avgCancel),
      predictedNetNextMonth: Math.round(predictedNetBase),
      isWinning,
      scenarios: {
        best: Math.round(predictedNetBest),
        base: Math.round(predictedNetBase),
        worst: Math.round(predictedNetWorst),
      },
      confidencePct,
      message: isWinning
        ? `${activationsNextMonth} scheduled activations vs ${predictedCancellationsRounded} predicted cancellations — on track to gain members.`
        : `${activationsNextMonth} scheduled activations vs ${predictedCancellationsRounded} predicted cancellations — need more scheduled plans to offset churn.`,
    };
  }, [churnForPrediction, scheduledActivationsNextMonth, avgCancellationsThisYear, transactionDeclinedPrediction, predictedAgeOutNextMonth, predictivePrimaryMembers]);

  /** Completed months this calendar year: V2.3 predicted vs actual cancellations (same math as CEO report). */
  const predictionYtdBacktest = useMemo(() => {
    const now = new Date();
    return computeYearToDatePredictionVsActual(
      now.getFullYear(),
      now,
      churnForPrediction.map((d) => ({ monthKey: d.monthKey, cancellations: d.cancellations })),
      predictivePrimaryMembers,
    );
  }, [churnForPrediction, predictivePrimaryMembers]);

  const predictionYtdSummary = useMemo(() => {
    const rows = predictionYtdBacktest;
    if (rows.length === 0) return null;
    const withActual = rows.filter((r) => r.actual > 0);
    const mape =
      withActual.length > 0
        ? withActual.reduce((s, r) => s + Math.abs((r.pctError ?? 0)), 0) / withActual.length
        : 0;
    const within20 = withActual.filter((r) => r.within20).length;
    const sumAct = rows.reduce((s, r) => s + r.actual, 0);
    const sumPred = rows.reduce((s, r) => s + r.predicted, 0);
    return { mape, within20, totalMonths: withActual.length, sumAct, sumPred };
  }, [predictionYtdBacktest]);

  // AGENT PERFORMANCE MATRIX
  const agentPerformanceMatrix = useMemo(() => {
    const calculatePerformanceScore = (agent: any) => {
      const retentionScore = agent.totalMembers > 0 ? (agent.activeMembers / agent.totalMembers) * 40 : 0;
      const volumeScore = Math.min(30, agent.totalMembers * 0.5);
      const recentScore = Math.min(20, agent.recentSales * 2);
      const lifetimeScore = Math.min(10, (agent.avgLifetime / 365) * 5);

      return Math.round(retentionScore + volumeScore + recentScore + lifetimeScore);
    };

    const agentMetrics = new Map<string, {
      agentId: string;
      agentName: string;
      totalMembers: number;
      activeMembers: number;
      avgLifetime: number;
      recentSales: number;
      retentionRate: number;
    }>();

    const threeMonthsAgo = subMonths(new Date(), 3);

    allMembers.forEach(member => {
      if (!member.agent_id) return;

      const advisor = advisors.find(a => a.agent_id === member.agent_id);
      const agentName = advisor ? `${advisor.first_name} ${advisor.last_name}` : member.agent_id;

      if (!agentMetrics.has(member.agent_id)) {
        agentMetrics.set(member.agent_id, {
          agentId: member.agent_id,
          agentName,
          totalMembers: 0,
          activeMembers: 0,
          avgLifetime: 0,
          recentSales: 0,
          retentionRate: 0
        });
      }

      const metrics = agentMetrics.get(member.agent_id)!;
      metrics.totalMembers++;

      if (member.is_active) {
        metrics.activeMembers++;
      }

      if (member.created_date && parseISO(member.created_date) >= threeMonthsAgo) {
        metrics.recentSales++;
      }

      if (member.active_date && member.inactive_date) {
        try {
          const lifetime = differenceInDays(parseISO(member.inactive_date), parseISO(member.active_date));
          metrics.avgLifetime += lifetime;
        } catch (e) {
          // Skip invalid dates
        }
      }
    });

    return Array.from(agentMetrics.values())
      .map(agent => ({
        ...agent,
        avgLifetime: agent.totalMembers > 0 ? Math.round(agent.avgLifetime / agent.totalMembers) : 0,
        retentionRate: agent.totalMembers > 0 ? (agent.activeMembers / agent.totalMembers) * 100 : 0,
        performanceScore: calculatePerformanceScore(agent)
      }))
      .sort((a, b) => b.performanceScore - a.performanceScore);
  }, [allMembers, advisors]);

  return (
    <div className="min-h-screen bg-[#F1F0F0]">
      <div className="px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-end gap-2 mb-4 flex-wrap">
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading || viewLoading}
            aria-label="Refresh data"
            className="px-4 py-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            <option value="6">Last 6 Months</option>
            <option value="12">Last 12 Months</option>
            <option value="24">Last 24 Months</option>
            <option value="all">All Time</option>
          </select>
        </div>

        {/* ── Mobile Tab Dropdown ── */}
        <div className="mb-5 lg:hidden">
          <select
            id="tab-select"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as any)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0A4E8E]/20"
          >
            <option value="executive">Executive Dashboard</option>
            <option value="overview">Overview &amp; Metrics</option>
            <option value="sales">Sales Analytics</option>
            <option value="inhouse">Inhouse Advisors</option>
            <option value="contest">Agent Analysis</option>
            <option value="predictive">Predictive Analytics</option>
            <option value="inactive">Inactive Analysis</option>
          </select>
        </div>

        {/* ── Desktop Tab Navigation ── */}
        <div className="mb-6 hidden lg:block">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
            <div className="grid grid-cols-7 gap-1.5">
              {([
                { id: 'executive', label: 'Executive', icon: Target },
                { id: 'overview',  label: 'Overview',  icon: BarChart3 },
                { id: 'sales',     label: 'Sales',     icon: DollarSign },
                { id: 'inhouse',   label: 'Advisors',  icon: Award },
                { id: 'contest',   label: 'Agents',    icon: Trophy },
                { id: 'predictive',label: 'Predictive',icon: Brain },
                { id: 'inactive',  label: 'Inactive',  icon: UserX },
              ] as const).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === id
                      ? 'bg-[#0A4E8E] text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {activeTab === 'executive' && (
          <>
            {/* Info popover for calculation methodology */}
            {execInfoPopup && (
              <div
                data-exec-info-popover
                className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 sm:pt-32"
                aria-modal="true"
                role="dialog"
              >
                <div
                  className="absolute inset-0 bg-black/30"
                  onClick={() => setExecInfoPopup(null)}
                  aria-hidden="true"
                />
                <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-200 p-5 sm:p-6 max-h-[80vh] overflow-y-auto">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <h3 className="text-base font-bold text-gray-900">
                      {execInfoPopup === 'health' && 'Business Health Score'}
                      {execInfoPopup === 'growth' && 'Growth Momentum Analysis'}
                      {execInfoPopup === 'metrics' && 'Key Executive Metrics'}
                      {execInfoPopup === 'agents' && 'Agent Performance Matrix'}
                      {execInfoPopup === 'yearend' && 'Year-end primary membership (methodology)'}
                    </h3>
                    <button
                      onClick={() => setExecInfoPopup(null)}
                      className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="text-sm text-gray-600 space-y-3">
                    {execInfoPopup === 'health' && (
                      <>
                        <p><strong>Overall:</strong> Weighted average of 4 components (35% retention, 25% growth, 25% churn control, 15% lifetime).</p>
                        <p><strong>Retention:</strong> min(100, active members ÷ total members × 100).</p>
                        <p><strong>Growth:</strong> min(100, max(0, 50 + quarterly growth rate × 2)).</p>
                        <p><strong>Churn Control:</strong> max(0, 100 − this month cancellations ÷ active × 10).</p>
                        <p><strong>Lifetime Value:</strong> min(100, avg lifetime days ÷ 365 × 20).</p>
                        <p><strong>Trend:</strong> Improving if momentum &gt; 0; Declining if momentum &lt; −2; otherwise Stable.</p>
                      </>
                    )}
                    {execInfoPopup === 'growth' && (
                      <>
                        <p><strong>Growth rate formula:</strong> (total net change ÷ avg activations) × 100 over the period.</p>
                        <p><strong>Net change:</strong> Activations − cancellations per month. Activations = active_date; cancellations = inactive_date.</p>
                        <p><strong>Quarterly (3mo):</strong> Last 3 months.</p>
                        <p><strong>Semi-Annual (6mo):</strong> Last 6 months.</p>
                        <p><strong>Annual (12mo):</strong> Last 12 months.</p>
                        <p><strong>Momentum:</strong> Quarterly rate − 6‑month rate. Positive = accelerating; negative = decelerating; between 0 and −2 = stable.</p>
                      </>
                    )}
                    {execInfoPopup === 'metrics' && (
                      <>
                        <p><strong>QTD Growth Rate:</strong> (sum of net change over 3 months) ÷ (avg activations) × 100.</p>
                        <p><strong>Current Active:</strong> is_active = true and (no active_date or active_date ≤ today).</p>
                        <p><strong>Retention Rate:</strong> Active members ÷ total members × 100.</p>
                        <p><strong>At-Risk:</strong> Active members past 80% of average lifetime. Avg lifetime from users + members + past_inactives.</p>
                        <p><strong>Avg Lifetime:</strong> inactive_date − active_date for completed memberships; includes past_inactives.</p>
                        <p><strong>Plans Sold This Month:</strong> created_date in current month (from database).</p>
                      </>
                    )}
                    {execInfoPopup === 'agents' && (
                      <>
                        <p><strong>Score:</strong> 40% retention + 30% volume + 20% recent sales + 10% lifetime.</p>
                        <p><strong>Retention:</strong> Active ÷ total × 100.</p>
                        <p><strong>Last 3mo Sales:</strong> Members with created_date in last 3 months.</p>
                        <p><strong>Avg Lifetime:</strong> Completed memberships only (active_date and inactive_date). Active members excluded.</p>
                      </>
                    )}
                    {execInfoPopup === 'yearend' && (
                      <>
                        <p><strong>Population:</strong> Primary members only. <code className="text-xs bg-gray-100 px-1 rounded">sales_analytics_view</code> (deduped users + members, users win on duplicate IDs) plus <code className="text-xs bg-gray-100 px-1 rounded">past_inactives</code> rows whose <code className="text-xs bg-gray-100 px-1 rounded">member_id</code> is not in that live set — so archived churn is included without double-counting.</p>
                        <p><strong>Active / inactive snapshot:</strong> Same logic as the Overview &quot;Monthly Metrics&quot; chart in this app. A primary is <em>active</em> on the cutoff if they have started (<code className="text-xs bg-gray-100 px-1 rounded">active_date</code> ≤ cutoff, or no <code className="text-xs bg-gray-100 px-1 rounded">active_date</code> and <code className="text-xs bg-gray-100 px-1 rounded">is_active</code>), and either has no <code className="text-xs bg-gray-100 px-1 rounded">inactive_date</code> or inactive &gt; cutoff. <em>Inactive</em> on the cutoff means started and <code className="text-xs bg-gray-100 px-1 rounded">inactive_date</code> ≤ cutoff (invalid rows where inactive ≤ active are excluded).</p>
                        <p><strong>Cutoff:</strong> Completed years use end of day Dec 31. The current row uses <em>today</em> (year-to-date position).</p>
                        <p><strong>Cancellations (year):</strong> Count of primaries whose <code className="text-xs bg-gray-100 px-1 rounded">inactive_date</code> falls in that calendar year on the unified list.</p>
                        <p><strong>Sales (year):</strong> Live primaries with <code className="text-xs bg-gray-100 px-1 rounded">created_date</code> in that year <em>plus</em> <code className="text-xs bg-gray-100 px-1 rounded">past_inactives</code> rows whose <code className="text-xs bg-gray-100 px-1 rounded">member_id</code> is not in the live view and whose <code className="text-xs bg-gray-100 px-1 rounded">member_created_date</code> falls in that year (same member is not double-counted).</p>
                        <p><strong>Accuracy:</strong> Depends on correct dates and flags in the database and on <code className="text-xs bg-gray-100 px-1 rounded">past_inactives</code> staying in sync with historical exports.</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Business Health Score Hero */}
            <div className="mb-6 relative overflow-hidden rounded-2xl shadow-md">
              <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0A4E8E 0%, #0CC0DF 100%)' }}>
                <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '20px 20px' }} aria-hidden="true" />
                <div className="relative z-10 p-5 sm:p-7 lg:p-9">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm flex-shrink-0">
                        <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                      </div>
                      <div className="flex items-start gap-2">
                        <div>
                          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Business Health Score</h2>
                          <p className="text-white/70 text-xs sm:text-sm mt-0.5">Composite: 35% retention, 25% growth, 25% churn control, 15% lifetime</p>
                        </div>
                        <button
                          data-exec-info
                          onClick={(e) => { e.stopPropagation(); setExecInfoPopup(execInfoPopup === 'health' ? null : 'health'); }}
                          className="p-1.5 rounded-lg text-white/70 hover:bg-white/20 hover:text-white transition-colors flex-shrink-0 mt-0.5"
                          aria-label="How is this calculated?"
                        >
                          <Info className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-2">{businessHealthScore.overall}</div>
                      <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs sm:text-sm ${
                        businessHealthScore.trend === 'improving' ? 'bg-green-500/20 text-green-100' :
                        businessHealthScore.trend === 'declining' ? 'bg-red-500/20 text-red-100' :
                        'bg-yellow-500/20 text-yellow-100'
                      }`}>
                        {businessHealthScore.trend === 'improving' ? <TrendingUp className="h-3.5 w-3.5 mr-1.5" /> :
                         businessHealthScore.trend === 'declining' ? <TrendingDown className="h-3.5 w-3.5 mr-1.5" /> :
                         <Activity className="h-3.5 w-3.5 mr-1.5" />}
                        <span className="font-bold capitalize">{businessHealthScore.trend}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
                    {[
                      { label: 'Retention',     score: businessHealthScore.retention, barColor: 'bg-green-400',  Icon: CheckCircle,   iconColor: 'text-green-300' },
                      { label: 'Growth',        score: businessHealthScore.growth,    barColor: 'bg-[#A4CC43]',  Icon: TrendingUp,    iconColor: 'text-[#A4CC43]' },
                      { label: 'Churn Control', score: businessHealthScore.churn,     barColor: 'bg-amber-400',  Icon: Shield,        iconColor: 'text-amber-300' },
                      { label: 'Lifetime Value',score: businessHealthScore.lifetime,  barColor: 'bg-purple-400', Icon: Clock,         iconColor: 'text-purple-300' },
                    ].map(({ label, score, barColor, Icon, iconColor }) => (
                      <div key={label} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white/70 text-[10px] sm:text-xs font-semibold uppercase tracking-wider">{label}</span>
                          <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${iconColor}`} />
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-white">{score}</div>
                        <div className="w-full bg-white/20 rounded-full h-1.5 mt-2">
                          <div className={`${barColor} h-1.5 rounded-full`} style={{ width: `${score}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Key Executive Metrics */}
            <div className="mb-4 flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Key Executive Metrics</h3>
              <button
                data-exec-info
                onClick={(e) => { e.stopPropagation(); setExecInfoPopup(execInfoPopup === 'metrics' ? null : 'metrics'); }}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                aria-label="How are these calculated?"
              >
                <Info className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5 mb-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5" style={{ borderTop: '3px solid #0A4E8E' }}>
                <div className="flex items-center justify-between mb-3">
                  <Target className="h-9 w-9 text-[#0A4E8E] opacity-15" />
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${growthMetrics.quarterly >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {growthMetrics.quarterly >= 0 ? '+' : ''}{growthMetrics.quarterly.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs font-semibold text-gray-500 mb-1">QTD Growth Rate</div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{currentStats.netChangeThisQuarter > 0 ? '+' : ''}{currentStats.netChangeThisQuarter}</div>
                <div className="text-[10px] text-gray-400 mt-1.5">Net new members this quarter</div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5" style={{ borderTop: '3px solid #A4CC43' }}>
                <div className="flex items-center justify-between mb-3">
                  <Users className="h-9 w-9 text-[#A4CC43] opacity-30" />
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">{currentStats.retentionRate.toFixed(1)}%</span>
                </div>
                <div className="text-xs font-semibold text-gray-500 mb-1">Current Active Members</div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{currentStats.activeMembers.toLocaleString()}</div>
                <div className="text-[10px] text-gray-400 mt-1.5">Active as of {format(new Date(), 'MMM d, yyyy')}</div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5" style={{ borderTop: '3px solid #F59E0B' }}>
                <div className="flex items-center justify-between mb-3">
                  <AlertTriangle className="h-9 w-9 text-amber-500 opacity-20" />
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${churnRiskAnalysis.percentage < 10 ? 'bg-green-100 text-green-700' : churnRiskAnalysis.percentage < 20 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                    {churnRiskAnalysis.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs font-semibold text-gray-500 mb-1">At-Risk Members</div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{churnRiskAnalysis.totalAtRisk}</div>
                <div className="text-[10px] text-gray-400 mt-1.5">Active members past 80% of avg lifetime. Avg lifetime from users + members + past_inactives</div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5" style={{ borderTop: '3px solid #7C3AED' }}>
                <div className="flex items-center justify-between mb-3">
                  <DollarSign className="h-9 w-9 text-purple-500 opacity-20" />
                  <Award className="h-5 w-5 text-purple-500" />
                </div>
                <div className="text-xs font-semibold text-gray-500 mb-1">Avg Lifetime</div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{currentStats.avgLifetimeDays}d</div>
                <div className="text-[10px] text-gray-400 mt-1.5">{(currentStats.avgLifetimeDays / 365).toFixed(1)} years · users + members + past_inactives</div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5" style={{ borderTop: '3px solid #0CC0DF' }}>
                <div className="flex items-center justify-between mb-3">
                  <Package className="h-9 w-9 text-[#0CC0DF] opacity-20" />
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">{salesAnalytics.monthlyData?.length ? salesAnalytics.currentMonthSales : currentStats.salesThisMonth}</span>
                </div>
                <div className="text-xs font-semibold text-gray-500 mb-1">Plans Sold This Month</div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{salesAnalytics.monthlyData?.length ? salesAnalytics.currentMonthSales : currentStats.salesThisMonth}</div>
                <div className="text-[10px] text-gray-400 mt-1.5">By created_date (DB) · typically activate next month</div>
              </div>
            </div>

            {/* Year-end / YTD primary snapshot (CEO) */}
            <div className="mb-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="h-4 w-1 rounded-full bg-[#0A4E8E]" />
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Primary membership by year</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Live view + past_inactives · same snapshot rules as monthly metrics</p>
                    </div>
                    <button
                      type="button"
                      data-exec-info
                      onClick={(e) => { e.stopPropagation(); setExecInfoPopup(execInfoPopup === 'yearend' ? null : 'yearend'); }}
                      className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors self-start sm:self-center"
                      aria-label="How are these calculated?"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => void exportPrimaryMembershipExcel()}
                    disabled={viewLoading || primaryMembershipExporting || (!allMembers.length && !pastInactives.length)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#0A4E8E] text-white shadow-sm hover:bg-[#083d6f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Download className="h-4 w-4 shrink-0" />
                    {primaryMembershipExporting ? 'Building…' : 'Download Excel report'}
                  </button>
                </div>
                <div className="overflow-x-auto -mx-2 sm:mx-0">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 border-y border-gray-100">
                      <tr>
                        <th className="px-3 sm:px-4 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Year</th>
                        <th className="px-3 sm:px-4 py-2.5 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">As of</th>
                        <th className="px-3 sm:px-4 py-2.5 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">Active primary</th>
                        <th className="px-3 sm:px-4 py-2.5 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">Inactive primary</th>
                        <th className="px-3 sm:px-4 py-2.5 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">Sales <span className="font-normal normal-case text-gray-400">(created_date)</span></th>
                        <th className="px-3 sm:px-4 py-2.5 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">Cancellations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {viewLoading ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500 text-xs">Loading unified primary data…</td>
                        </tr>
                      ) : (
                        yearEndPrimarySnapshot.map(row => (
                          <tr key={row.year} className="hover:bg-gray-50/80">
                            <td className="px-3 sm:px-4 py-3 font-bold text-gray-900">{row.year}{row.isCurrentYear ? ' (YTD)' : ''}</td>
                            <td className="px-3 sm:px-4 py-3 text-right text-gray-600 tabular-nums">{row.asOfLabel}</td>
                            <td className="px-3 sm:px-4 py-3 text-right font-semibold text-green-700 tabular-nums">{row.activePrimaryEnd.toLocaleString()}</td>
                            <td className="px-3 sm:px-4 py-3 text-right font-semibold text-gray-700 tabular-nums">{row.inactivePrimaryEnd.toLocaleString()}</td>
                            <td className="px-3 sm:px-4 py-3 text-right font-semibold text-[#0A4E8E] tabular-nums">{row.salesByCreatedDate.toLocaleString()}</td>
                            <td className="px-3 sm:px-4 py-3 text-right font-semibold text-amber-700 tabular-nums">{row.cancellationsInYear.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Growth Momentum */}
            <div className="mb-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-4 w-1 rounded-full bg-[#0A4E8E]" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Growth Momentum Analysis</h3>
                  <button
                    data-exec-info
                    onClick={(e) => { e.stopPropagation(); setExecInfoPopup(execInfoPopup === 'growth' ? null : 'growth'); }}
                    className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    aria-label="How is this calculated?"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mb-5 ml-3">Multi-period growth rate comparison</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {[
                    { label: 'Quarterly (3mo)',   rate: growthMetrics.quarterly, bg: 'from-blue-50 to-blue-100',   textColor: 'text-blue-700' },
                    { label: 'Semi-Annual (6mo)', rate: growthMetrics.sixMonth,  bg: 'from-purple-50 to-purple-100', textColor: 'text-purple-700' },
                    { label: 'Annual (12mo)',     rate: growthMetrics.annual,    bg: 'from-amber-50 to-amber-100',  textColor: 'text-amber-700' },
                  ].map(({ label, rate, bg, textColor }) => (
                    <div key={label} className={`text-center p-4 sm:p-6 bg-gradient-to-br ${bg} rounded-xl`}>
                      <div className={`text-[10px] font-bold ${textColor} mb-2 uppercase tracking-wider`}>{label}</div>
                      <div className={`text-3xl sm:text-4xl font-bold mb-1 ${rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {rate >= 0 ? '+' : ''}{rate.toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-gray-500">Growth rate</div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Zap className={`h-5 w-5 ${growthMetrics.momentum > 0 ? 'text-green-600' : 'text-red-600'}`} />
                    <div className="flex-1">
                      <div className="text-sm font-bold text-gray-900">Momentum: {growthMetrics.momentum > 0 ? 'Accelerating' : growthMetrics.momentum < -2 ? 'Decelerating' : 'Stable'}</div>
                      <div className="text-xs text-gray-500">{Math.abs(growthMetrics.momentum).toFixed(2)}% change in growth velocity</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Agent Performance Matrix */}
            <div className="mb-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-4 w-1 rounded-full bg-[#A4CC43]" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Top Agent Performance Matrix</h3>
                  <button
                    data-exec-info
                    onClick={(e) => { e.stopPropagation(); setExecInfoPopup(execInfoPopup === 'agents' ? null : 'agents'); }}
                    className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    aria-label="How is this calculated?"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mb-5 ml-3">Multi-dimensional performance scoring. Avg Lifetime: completed memberships only.</p>
                <div className="overflow-x-auto -mx-2 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          {['Rank','Agent','Score','Total','Active','Retention','Last 3mo Sales','Avg Lifetime'].map((h, i) => (
                            <th key={h} className={`px-3 sm:px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-left ${i === 3 ? 'hidden md:table-cell' : ''} ${i >= 5 ? 'hidden lg:table-cell' : ''} ${i === 7 ? 'hidden xl:table-cell' : ''}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {agentPerformanceMatrix.slice(0, 10).map((agent, idx) => (
                          <tr key={agent.agentId} className="hover:bg-gray-50 transition-colors">
                            <td className="px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-bold text-gray-900">#{idx + 1}</td>
                            <td className="px-3 sm:px-4 py-2.5">
                              <div className="text-xs sm:text-sm font-semibold text-gray-900 truncate max-w-[120px] sm:max-w-none">{agent.agentName}</div>
                              <div className="text-[10px] text-gray-400 truncate">{agent.agentId}</div>
                            </td>
                            <td className="px-3 sm:px-4 py-2.5 text-center">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${agent.performanceScore >= 80 ? 'bg-green-100 text-green-800' : agent.performanceScore >= 60 ? 'bg-blue-100 text-blue-800' : agent.performanceScore >= 40 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>{agent.performanceScore}</span>
                            </td>
                            <td className="px-3 sm:px-4 py-2.5 text-center text-xs sm:text-sm font-semibold text-gray-900 hidden md:table-cell">{agent.totalMembers}</td>
                            <td className="px-3 sm:px-4 py-2.5 text-center text-xs sm:text-sm font-semibold text-green-600">{agent.activeMembers}</td>
                            <td className="px-3 sm:px-4 py-2.5 text-center text-xs sm:text-sm font-bold text-gray-900 hidden lg:table-cell">{agent.retentionRate.toFixed(1)}%</td>
                            <td className="px-3 sm:px-4 py-2.5 text-center text-xs sm:text-sm font-semibold text-[#0A4E8E] hidden lg:table-cell">{agent.recentSales}</td>
                            <td className="px-3 sm:px-4 py-2.5 text-center text-xs sm:text-sm font-semibold text-purple-600 hidden xl:table-cell">{agent.avgLifetime}d</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'overview' && (
          <>
            {/* Charts / Data toggle */}
            <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 mb-6">
              {(['charts', 'data'] as const).map((mode) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${viewMode === mode ? 'bg-[#0A4E8E] text-white' : 'text-gray-500 hover:text-gray-700'}`}>
                  {mode === 'charts' ? <BarChart3 className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                  <span>{mode === 'charts' ? 'Charts' : 'Data'}</span>
                </button>
              ))}
            </div>

            {/* Hero: Total Active Plans */}
            <div className="mb-7">
              <div className="relative rounded-2xl overflow-hidden shadow-md" style={{ background: 'linear-gradient(135deg, #0A4E8E 0%, #0CC0DF 100%)' }}>
                <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '20px 20px' }} aria-hidden="true" />
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-7 sm:p-9">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                        <Users className="h-7 w-7 sm:h-9 sm:w-9 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white">Total Active Plans</h2>
                        <p className="text-white/70 text-sm mt-0.5">Primary members currently active + scheduled</p>
                      </div>
                    </div>
                    <p className="text-5xl sm:text-6xl font-bold tracking-tight text-white mt-4">{currentStats.projectedTotalActive.toLocaleString()}</p>
                    <p className="text-base text-white/70 mt-1">{currentStats.activeMembers.toLocaleString()} active + {currentStats.futureActiveCount.toLocaleString()} scheduled</p>
                  </div>
                  <div className="flex sm:flex-col gap-3">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-5 min-w-[130px] border border-white/20">
                      <p className="text-xs text-white/70 mb-1 font-medium">Active Now</p>
                      <p className="text-2xl sm:text-3xl font-bold text-white">{currentStats.activeMembers.toLocaleString()}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-5 min-w-[130px] border border-white/20">
                      <p className="text-xs text-white/70 mb-1 font-medium">This Month</p>
                      <div className="flex items-center gap-1.5">
                        {currentStats.netChangeThisMonth >= 0 ? <ArrowUpRight className="h-5 w-5 text-white" /> : <ArrowDownRight className="h-5 w-5 text-white" />}
                        <p className={`text-2xl sm:text-3xl font-bold ${currentStats.netChangeThisMonth >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                          {currentStats.netChangeThisMonth > 0 ? '+' : ''}{currentStats.netChangeThisMonth}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="mb-7">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5" style={{ borderTop: '3px solid #A4CC43' }}>
                  <div className="flex items-center justify-between mb-3">
                    <CheckCircle className="h-8 w-8 text-green-500 opacity-20" />
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">Active</span>
                  </div>
                  <div className="text-xs font-semibold text-gray-500 mb-1">Currently Active</div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900">{currentStats.activeMembers.toLocaleString()}</div>
                  <div className="text-[10px] text-gray-400 mt-1.5">{currentStats.futureActiveCount.toLocaleString()} scheduled to activate</div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5" style={{ borderTop: '3px solid #0A4E8E' }}>
                  <div className="flex items-center justify-between mb-3">
                    <TrendingUp className="h-8 w-8 text-[#0A4E8E] opacity-20" />
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${currentStats.netChangeThisMonth >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {currentStats.netChangeThisMonth > 0 ? '+' : ''}{currentStats.netChangeThisMonth}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-gray-500 mb-1">This Month</div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900">+{currentStats.newThisMonth} New</div>
                  <div className="text-[10px] text-gray-400 mt-1.5">{currentStats.cancelledThisMonth} cancelled</div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5" style={{ borderTop: '3px solid #F59E0B' }}>
                  <div className="flex items-center justify-between mb-3">
                    <Clock className="h-8 w-8 text-amber-500 opacity-20" />
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">{currentStats.churnRate.toFixed(1)}%</span>
                  </div>
                  <div className="text-xs font-semibold text-gray-500 mb-1">Avg. Lifetime</div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900">{currentStats.avgLifetimeDays}d</div>
                  <div className="text-[10px] text-gray-400 mt-1.5">{(currentStats.avgLifetimeDays / 365).toFixed(1)} years · users + members + past_inactives</div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5" style={{ borderTop: '3px solid #0CC0DF' }}>
                  {(() => {
                    const lastMonthData = monthlyMetrics[monthlyMetrics.length - 2];
                    const thisMonthData = monthlyMetrics[monthlyMetrics.length - 1];
                    const isGrowing = thisMonthData && lastMonthData && thisMonthData.activeMembers > lastMonthData.activeMembers;
                    const change = thisMonthData && lastMonthData ? thisMonthData.activeMembers - lastMonthData.activeMembers : 0;
                    return (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          {isGrowing ? <TrendingUp className="h-8 w-8 text-[#0CC0DF] opacity-20" /> : <TrendingDown className="h-8 w-8 text-[#0CC0DF] opacity-20" />}
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isGrowing ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{isGrowing ? 'Growing' : 'Declining'}</span>
                        </div>
                        <div className="text-xs font-semibold text-gray-500 mb-1">Monthly Trend</div>
                        <div className="text-2xl sm:text-3xl font-bold text-gray-900">{change > 0 ? `+${change}` : change}</div>
                        <div className="text-[10px] text-gray-400 mt-1.5">{change > 0 ? 'Gaining members' : change < 0 ? 'Losing members' : 'Stable'}</div>
                      </>
                    );
                  })()}
            </div>
          </div>
        </div>

            {/* Monthly Membership Growth */}
            <div className="mb-7">
              <div className="flex items-center gap-2 mb-5">
                <span className="h-4 w-1 rounded-full bg-[#A4CC43]" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Monthly Membership Growth</h2>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
                {viewMode === 'charts' ? (
                  <ResponsiveContainer width="100%" height={300} className="sm:h-[400px]">
                    <LineChart data={monthlyMetrics}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} stroke="#E5E7EB" />
                      <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} stroke="#E5E7EB" />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 8px 20px rgba(0,0,0,0.08)', padding: '12px' }} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                      <Line type="monotone" dataKey="activeMembers" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} name="Active Members" />
                      <Line type="monotone" dataKey="totalMembers" stroke="#0A4E8E" strokeWidth={3} dot={{ fill: '#0A4E8E', r: 4 }} name="Total Members" />
                      <Line type="monotone" dataKey="inactiveMembers" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#ef4444', r: 3 }} name="Inactive Members" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          {['Month','Active','Inactive','Total','Retention %','Trend'].map(h => (
                            <th key={h} className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase ${h === 'Month' ? 'text-left' : 'text-right'}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {monthlyMetrics.map((metric, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-sm font-semibold text-gray-800">{metric.month}</td>
                            <td className="px-4 py-3 text-sm font-bold text-green-600 text-right">{metric.activeMembers}</td>
                            <td className="px-4 py-3 text-sm font-bold text-red-600 text-right">{metric.inactiveMembers}</td>
                            <td className="px-4 py-3 text-sm font-bold text-[#0A4E8E] text-right">{metric.totalMembers}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-700 text-right">{metric.activationRate.toFixed(1)}%</td>
                            <td className="px-4 py-3"><div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden"><div className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full" style={{ width: `${metric.activationRate}%` }} /></div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Churn Analysis */}
            <div className="mb-7">
              <div className="flex items-center gap-2 mb-5">
                <span className="h-4 w-1 rounded-full bg-red-500" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Churn Analysis</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <BarChart3 className="h-5 w-5 text-[#0CC0DF]" />
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Member Activity Trends</h3>
                      <p className="text-xs text-gray-400">Activations vs Cancellations</p>
                    </div>
                  </div>
                  {viewMode === 'charts' ? (
                    <ResponsiveContainer width="100%" height={300} className="sm:h-[400px]">
                      <AreaChart data={churnAnalysis}>
                        <defs>
                          <linearGradient id="colorActivations" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/><stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                          </linearGradient>
                          <linearGradient id="colorCancellations" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} stroke="#E5E7EB" />
                        <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} stroke="#E5E7EB" />
                        <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 8px 20px rgba(0,0,0,0.08)', padding: '12px' }} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                        <Area type="monotone" dataKey="activations" stroke="#10b981" fillOpacity={1} fill="url(#colorActivations)" name="Activations" strokeWidth={2} />
                        <Area type="monotone" dataKey="cancellations" stroke="#ef4444" fillOpacity={1} fill="url(#colorCancellations)" name="Cancellations" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                      {churnAnalysis.map((data, idx) => {
                        const maxValue = Math.max(...churnAnalysis.map(d => Math.max(d.activations, d.cancellations)));
                        const activationWidth = maxValue > 0 ? (data.activations / maxValue) * 100 : 0;
                        const cancellationWidth = maxValue > 0 ? (data.cancellations / maxValue) * 100 : 0;
                        return (
                          <div key={idx} className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
                              <span>{data.month}</span>
                              <div className="flex items-center gap-4">
                                <span className="text-green-600">+{data.activations}</span>
                                <span className="text-red-600">-{data.cancellations}</span>
                                <span className={data.netChange >= 0 ? 'text-[#0A4E8E]' : 'text-red-600'}>{data.netChange > 0 ? '+' : ''}{data.netChange}</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2"><div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden"><div className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full" style={{ width: `${activationWidth}%` }} /></div><span className="text-[10px] text-gray-400 w-6">Act</span></div>
                              <div className="flex items-center gap-2"><div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden"><div className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full" style={{ width: `${cancellationWidth}%` }} /></div><span className="text-[10px] text-gray-400 w-6">Can</span></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Cancellation Reasons</h3>
                      <p className="text-xs text-gray-400">Top 5 reasons</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {topCancellationReasons.length > 0 ? topCancellationReasons.map((reason, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700 truncate flex-1 mr-2">{reason.reason}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-[#0A4E8E]">{reason.count}</span>
                            <span className="text-[10px] text-gray-400">({reason.percentage.toFixed(1)}%)</span>
                          </div>
                        </div>
                        <div className="bg-gray-100 rounded-full h-2 overflow-hidden"><div className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full" style={{ width: `${reason.percentage}%` }} /></div>
                      </div>
                    )) : (
                      <div className="text-center py-8"><AlertCircle className="h-10 w-10 text-gray-200 mx-auto mb-2" /><p className="text-sm text-gray-400">No cancellation data available</p></div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Top Products */}
            <div className="mb-7">
              <div className="flex items-center gap-2 mb-5">
                <span className="h-4 w-1 rounded-full bg-[#0CC0DF]" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Top Products</h2>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {productStats.allProducts.slice(0, 3).map((product, idx) => (
                    <div key={product.id} className={`rounded-xl p-4 border-2 ${idx === 0 ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300' : idx === 1 ? 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300' : 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-300'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${idx === 0 ? 'bg-blue-500 text-white' : idx === 1 ? 'bg-slate-500 text-white' : 'bg-amber-600 text-white'}`}>{idx === 0 ? '🥇 1st' : idx === 1 ? '🥈 2nd' : '🥉 3rd'}</span>
                        <span className={`text-2xl font-bold ${idx === 0 ? 'text-blue-600' : idx === 1 ? 'text-slate-600' : 'text-amber-600'}`}>{product.count}</span>
                      </div>
                      <h4 className="font-bold text-gray-800 mb-1 truncate">{product.label}</h4>
                      <p className="text-xs text-gray-400 truncate">ID: {product.id}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Future Projections */}
            <div className="mb-7">
              <div className="flex items-center gap-2 mb-5">
                <span className="h-4 w-1 rounded-full bg-violet-500" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Future Projections</h2>
              </div>
              {viewMode === 'charts' ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={futureProjections}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#E5E7EB" style={{ fontSize: '11px' }} tick={{ fill: '#9CA3AF' }} />
                      <YAxis stroke="#E5E7EB" style={{ fontSize: '11px' }} tick={{ fill: '#9CA3AF' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 8px 20px rgba(0,0,0,0.08)', padding: '12px' }} />
                      <Legend />
                      <Line type="monotone" dataKey="scheduledActivations" stroke="#10B981" strokeWidth={2} name="New Activations" dot={{ fill: '#10B981', r: 4 }} />
                      <Line type="monotone" dataKey="scheduledInactivations" stroke="#EF4444" strokeWidth={2} name="Scheduled Cancellations" dot={{ fill: '#EF4444', r: 4 }} />
                      <Line type="monotone" dataKey="projectedActive" stroke="#0A4E8E" strokeWidth={3} name="Projected Active" dot={{ fill: '#0A4E8E', r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-violet-50 border-b-2 border-violet-200">
                        <tr>
                          {['Month','New Activations','Cancellations','Net Change','Projected Active'].map((h, i) => (
                            <th key={h} className={`px-4 py-3 text-xs font-bold uppercase ${i === 0 ? 'text-left text-gray-700' : i === 1 ? 'text-right text-green-700' : i === 2 ? 'text-right text-red-700' : i === 3 ? 'text-right text-blue-700' : 'text-right text-[#0A4E8E]'}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {futureProjections.map((projection, idx) => {
                          const netChange = projection.scheduledActivations - projection.scheduledInactivations;
                          return (
                            <tr key={idx} className="hover:bg-violet-50 transition-colors">
                              <td className="px-4 py-3 text-sm font-semibold text-violet-700">{projection.month}</td>
                              <td className="px-4 py-3 text-sm font-bold text-green-600 text-right">{projection.scheduledActivations > 0 ? `+${projection.scheduledActivations}` : '0'}</td>
                              <td className="px-4 py-3 text-sm font-bold text-red-600 text-right">{projection.scheduledInactivations > 0 ? `-${projection.scheduledInactivations}` : '0'}</td>
                              <td className={`px-4 py-3 text-sm font-bold text-right ${netChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>{netChange > 0 ? `+${netChange}` : netChange}</td>
                              <td className="px-4 py-3 text-sm font-bold text-[#0A4E8E] text-right">{projection.projectedActive.toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'sales' && (
          <>
            {/* Charts / Data toggle */}
            <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 mb-6">
              {(['charts', 'data'] as const).map((mode) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${viewMode === mode ? 'bg-[#0A4E8E] text-white' : 'text-gray-500 hover:text-gray-700'}`}>
                  {mode === 'charts' ? <BarChart3 className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                  <span>{mode === 'charts' ? 'Charts View' : 'Data View'}</span>
                </button>
              ))}
            </div>

            {/* Last week (ISO week prior to current) — same source as get_last_week_metrics */}
            {salesAnalytics.lastWeek && (
              <div className="mb-6 rounded-xl border border-gray-200 bg-white/90 shadow-sm px-4 py-3 sm:px-5 sm:py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-[#0A4E8E]/10 text-[#0A4E8E] flex-shrink-0">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Weekly report</p>
                      <p className="text-sm font-semibold text-gray-900 truncate" title={salesAnalytics.lastWeek.week_label}>
                        {salesAnalytics.lastWeek.week_label}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Plans sold by created date (primaries, deduplicated)</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-end gap-5 sm:gap-8 pl-0 sm:pl-2">
                    <div>
                      <p className="text-2xl sm:text-3xl font-bold tabular-nums text-gray-900 leading-none">
                        {salesAnalytics.lastWeek.plans_sold.toLocaleString()}
                      </p>
                      <p className="text-[11px] font-semibold text-gray-500 mt-1">Sold last week</p>
                    </div>
                    {salesAnalytics.lastWeek.cancellations_in_week > 0 && (
                      <div>
                        <p className="text-lg font-bold tabular-nums text-red-600 leading-none">
                          −{salesAnalytics.lastWeek.cancellations_in_week.toLocaleString()}
                        </p>
                        <p className="text-[11px] font-semibold text-gray-500 mt-1">Cancels (inactive in week)</p>
                      </div>
                    )}
                    <div>
                      <p
                        className={`text-lg font-bold tabular-nums leading-none ${
                          salesAnalytics.lastWeek.net_plans_sold_minus_view_cancellations >= 0
                            ? 'text-emerald-600'
                            : 'text-red-600'
                        }`}
                      >
                        {salesAnalytics.lastWeek.net_plans_sold_minus_view_cancellations >= 0 ? '+' : ''}
                        {salesAnalytics.lastWeek.net_plans_sold_minus_view_cancellations.toLocaleString()}
                      </p>
                      <p className="text-[11px] font-semibold text-gray-500 mt-1">Net (sold − cancels)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sales Hero */}
            <div className="mb-7">
              <div className="relative rounded-2xl overflow-hidden shadow-md" style={{ background: 'linear-gradient(135deg, #A4CC43 0%, #6fa832 100%)' }}>
                <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '20px 20px' }} aria-hidden="true" />
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-7 sm:p-9 text-white">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                        <DollarSign className="h-7 w-7 sm:h-9 sm:w-9 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold">Total Sales</h2>
                        <p className="text-white/70 text-sm mt-0.5">{timeRange === '6' ? 'Last 6 Months' : timeRange === '12' ? 'Last 12 Months' : timeRange === '24' ? 'Last 24 Months' : 'All Time'}</p>
                      </div>
                    </div>
                    <p className="text-5xl sm:text-6xl font-bold tracking-tight mt-4">{salesAnalytics.totalSales.toLocaleString()}</p>
                    <p className="text-base text-white/70 mt-1">Plans Sold</p>
                  </div>
                  <div className="flex sm:flex-col gap-3">
                    <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 sm:p-5 min-w-[130px] border border-white/20">
                      <p className="text-xs text-white/70 mb-1">This Month</p>
                      <p className="text-2xl sm:text-3xl font-bold">{salesAnalytics.currentMonthSales}</p>
                    </div>
                    <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 sm:p-5 min-w-[130px] border border-white/20">
                      <p className="text-xs text-white/70 mb-1">Growth</p>
                      <div className="flex items-center gap-1">
                        {salesAnalytics.salesGrowth >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                        <p className="text-2xl sm:text-3xl font-bold">{Math.abs(salesAnalytics.salesGrowth).toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sales Metric Cards */}
            <div className="mb-7">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5" style={{ borderTop: '3px solid #A4CC43' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-[#A4CC43]/10 rounded-lg"><TrendingUp className="h-5 w-5 text-[#A4CC43]" /></div>
                    <div className={`flex items-center gap-1 text-xs font-semibold ${salesAnalytics.salesGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {salesAnalytics.salesGrowth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      <span>{Math.abs(salesAnalytics.salesGrowth).toFixed(1)}%</span>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{salesAnalytics.currentMonthSales}</p>
                  <p className="text-xs font-semibold text-gray-400">Current Month</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5" style={{ borderTop: '3px solid #0A4E8E' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-[#0A4E8E]/10 rounded-lg"><BarChart3 className="h-5 w-5 text-[#0A4E8E]" /></div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{salesAnalytics.lastMonthSales}</p>
                  <p className="text-xs font-semibold text-gray-400">Last Month</p>
                </div>
                <div className={`rounded-2xl shadow-sm p-5 text-white ${salesAnalytics.salesGrowth >= 0 ? 'bg-green-600' : 'bg-red-600'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-white/20 rounded-lg">{salesAnalytics.salesGrowth >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}</div>
                  </div>
                  <p className="text-3xl font-bold mb-1">{salesAnalytics.salesGrowth >= 0 ? '+' : ''}{salesAnalytics.salesGrowth.toFixed(1)}%</p>
                  <p className="text-xs font-semibold text-white/80">Growth Rate</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5" style={{ borderTop: '3px solid #F59E0B' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-amber-50 rounded-lg"><Users className="h-5 w-5 text-amber-600" /></div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{salesAnalytics.totalAgents}</p>
                  <p className="text-xs font-semibold text-gray-400">Active Agents</p>
                </div>
              </div>
            </div>

            {/* Monthly Chart + Top Products */}
            <div className="mb-7">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="h-4 w-1 rounded-full bg-[#A4CC43]" />
                    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Monthly Sales Performance</h2>
                  </div>
                  {viewMode === 'charts' ? (
                    <ResponsiveContainer width="100%" height={400} className="sm:h-[450px]">
                      <BarChart data={salesAnalytics.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} stroke="#E5E7EB" />
                        <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} stroke="#E5E7EB" />
                        <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 8px 20px rgba(0,0,0,0.08)', padding: '12px' }} cursor={{ fill: 'rgba(164,204,67,0.1)' }} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                        <Bar dataKey="sales" fill="#A4CC43" radius={[8, 8, 0, 0]} name="Plans Sold" />
                        <Bar dataKey="preCancellations" fill="#ef4444" radius={[8, 8, 0, 0]} name="Pre-Cancelled" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {salesAnalytics.monthlyData.map((data: any, idx: number) => {
                        const maxValue = Math.max(...salesAnalytics.monthlyData.map((d: any) => d.sales));
                        const salesBarWidth = maxValue > 0 ? (data.sales / maxValue) * 100 : 0;
                        const preCancelBarWidth = maxValue > 0 ? (data.preCancellations / maxValue) * 100 : 0;
                        const netSales = data.sales - data.preCancellations;
                        return (
                          <div key={idx} className="space-y-2 pb-3 border-b border-gray-100 last:border-0">
                            <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
                              <span className="min-w-[80px]">{data.month}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-emerald-600 font-bold">{data.sales} sold</span>
                                {data.preCancellations > 0 && <span className="text-red-600 font-bold">{data.preCancellations} pre-cancelled</span>}
                                <span className="text-[#0A4E8E] font-bold">{netSales} net</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2"><span className="text-[10px] text-gray-400 w-16">Sales:</span><div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full flex items-center justify-end pr-2" style={{ width: `${salesBarWidth}%` }}>{data.sales > 0 && salesBarWidth > 15 && <span className="text-[10px] font-bold text-white">{data.sales}</span>}</div></div></div>
                              {data.preCancellations > 0 && <div className="flex items-center gap-2"><span className="text-[10px] text-gray-400 w-16">Pre-Cancel:</span><div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden"><div className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full flex items-center justify-end pr-2" style={{ width: `${preCancelBarWidth}%` }}>{data.preCancellations > 0 && preCancelBarWidth > 15 && <span className="text-[10px] font-bold text-white">{data.preCancellations}</span>}</div></div></div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="lg:col-span-1 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="h-4 w-1 rounded-full bg-purple-500" />
                    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Top Products</h2>
                  </div>
                  <p className="text-[10px] text-gray-400 -mt-2 ml-3">{format(new Date(), 'MMMM yyyy')}</p>
                  {salesAnalytics.topProducts.length > 0 ? salesAnalytics.topProducts.map((product: any, idx: number) => (
                    <div key={product.product_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3 mb-2">
                        <div className={`flex items-center justify-center w-9 h-9 rounded-lg font-bold text-sm flex-shrink-0 ${idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white' : idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' : 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'}`}>#{idx + 1}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-gray-900 line-clamp-2 mb-1">{product.product_label}</h3>
                          <div className="flex items-center gap-1.5"><p className="text-xl font-bold text-purple-600">{product.count}</p><p className="text-xs text-gray-400">sales</p></div>
                        </div>
                      </div>
                      {product.product_benefit && <p className="text-xs text-gray-400 line-clamp-2 mb-2">{product.product_benefit}</p>}
                      <div className="pt-2 border-t border-gray-100"><p className="text-[10px] font-mono text-gray-400">ID: {product.product_id}</p></div>
                    </div>
                  )) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                      <Package className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-gray-400">No product sales</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Top Sales Agents */}
            <div className="mb-7">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-5">
                  <span className="h-4 w-1 rounded-full bg-[#0A4E8E]" />
                  <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Top Sales Agents</h2>
                </div>

                {/* Month Filter */}
                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Select Month</label>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setAgentMonthFilter('current')}
                      className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${agentMonthFilter === 'current' ? 'bg-[#0A4E8E] text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
                      This Month
                    </button>
                    {availableMonths.slice(0, 12).map((monthKey) => {
                      const monthDate = parseISO(`${monthKey}-01`);
                      return (
                        <button key={monthKey} onClick={() => setAgentMonthFilter(monthKey)}
                          className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${agentMonthFilter === monthKey ? 'bg-[#0A4E8E] text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
                          {format(monthDate, 'MMM yyyy')}
                        </button>
                      );
                    })}
                    <button onClick={() => setAgentMonthFilter('all')}
                      className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${agentMonthFilter === 'all' ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
                      All Time
                    </button>
                  </div>
                  {agentMonthFilter !== 'current' && agentMonthFilter !== 'all' && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600">
                        <span className="font-bold text-[#0A4E8E]">Showing:</span> Sales from{' '}
                        <span className="font-bold">{format(parseISO(`${agentMonthFilter}-01`), 'MMMM yyyy')}</span>
                      </p>
                    </div>
                  )}
                </div>

                {salesAnalytics.topAgents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {salesAnalytics.topAgents.map((agent: any, idx: number) => {
                      const netSales = agent.count - (agent.preCancelled || 0);
                      return (
                        <div key={agent.agent_id} className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className={`flex items-center justify-center w-9 h-9 rounded-lg font-bold text-sm flex-shrink-0 ${idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white' : idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' : idx === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' : 'bg-[#0A4E8E]/10 text-[#0A4E8E]'}`}>{idx + 1}</div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-emerald-600">{netSales}</p>
                              <p className="text-[10px] text-gray-400">net sales</p>
                            </div>
                          </div>
                          <div className="mb-3">
                            {agent.agent_name ? (<><p className="text-sm font-bold text-gray-900 truncate">{agent.agent_name}</p><p className="text-[10px] font-mono text-gray-400">ID: {agent.agent_id}</p></>) : (<p className="text-sm font-mono font-bold text-[#0A4E8E]">{agent.agent_id}</p>)}
                          </div>
                          <div className="flex items-center justify-between text-[10px] pt-2 border-t border-gray-200">
                            <div><span className="text-gray-400">Total: </span><span className="font-semibold text-gray-700">{agent.count}</span></div>
                            {(agent.preCancelled || 0) > 0 && <div><span className="text-gray-400">Cancelled: </span><span className="font-semibold text-red-600">{agent.preCancelled}</span></div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-14 w-14 text-gray-200 mx-auto mb-3" />
                    <p className="text-base font-semibold text-gray-400">No sales data available</p>
                    <p className="text-xs text-gray-300 mt-1">Agent performance will appear here</p>
                  </div>
                )}
              </div>
            </div>

            {/* Info notice */}
            <div className="bg-[#A4CC43]/10 border border-[#A4CC43]/30 rounded-2xl p-5 mb-6">
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-[#6fa832] mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-[#4a7020] mb-2">Sales Performance Tracking</h4>
                  <div className="text-xs text-[#5a8030] space-y-1">
                    <p><strong>Plans Sold:</strong> Tracked by the "Member Created Date" column — when the sale was completed</p>
                    <p><strong>Agent ID:</strong> Each sale is attributed to the agent specified in the member record</p>
                    <p><strong>Pre-cancelled:</strong> Sales where the member was created and cancelled in the same month</p>
                    <p><strong>Net Sales:</strong> Total sales minus pre-cancelled sales</p>
                    <p><strong>Rankings:</strong> Top agents are ranked by net sales during the selected time period</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'contest' && (
          <>
            {/* Search */}
            <div className="mb-5 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-[#0CC0DF]" />
                <h2 className="text-base font-bold text-gray-900">Search &amp; Filters</h2>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Search by agent name or ID..." value={agentSearchQuery}
                  onChange={(e) => setAgentSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4E8E]/20 focus:border-[#0A4E8E]" />
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5" style={{ borderTop: '3px solid #0A4E8E' }}>
                <div className="flex items-center justify-between">
                  <div><p className="text-xs font-semibold text-gray-500 mb-1">Total Members</p><p className="text-3xl font-bold text-gray-900">{totalMembersWithDependents.toLocaleString()}</p></div>
                  <Users className="h-9 w-9 text-[#0A4E8E] opacity-15" />
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5" style={{ borderTop: '3px solid #A4CC43' }}>
                <div className="flex items-center justify-between">
                  <div><p className="text-xs font-semibold text-gray-500 mb-1">Active Members</p><p className="text-3xl font-bold text-green-600">{contestTotalStats.active.toLocaleString()}</p></div>
                  <UserCheck className="h-9 w-9 text-green-600 opacity-15" />
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5" style={{ borderTop: '3px solid #ef4444' }}>
                <div className="flex items-center justify-between">
                  <div><p className="text-xs font-semibold text-gray-500 mb-1">Inactive Members</p><p className="text-3xl font-bold text-red-600">{contestTotalStats.inactive.toLocaleString()}</p></div>
                  <UserX className="h-9 w-9 text-red-600 opacity-15" />
                </div>
              </div>
            </div>

            {/* Agent Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-[#0CC0DF]" />
                    <h2 className="text-base font-bold text-gray-900">Agent Performance Data</h2>
                  </div>
                  <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{filteredAgentPerformance.length} agents</span>
                </div>
              </div>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#0A4E8E] border-t-transparent"></div>
                </div>
              ) : filteredAgentPerformance.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                  <p className="text-base font-semibold">No agents match your filters</p>
                  <p className="text-sm mt-1">Try adjusting your search term</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['Rank','Agent ID','Agent Name','Total Members','Active','Inactive','Retention %','Actions'].map(h => (
                          <th key={h} className={`px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider ${['Total Members','Active','Inactive','Retention %','Actions'].includes(h) ? 'text-center' : 'text-left'}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredAgentPerformance.map((agent) => {
                        const retentionRate = agent.total_members > 0 ? ((agent.active_members / agent.total_members) * 100).toFixed(1) : '0.0';
                        return (
                          <tr key={agent.agent_id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {agent.rank <= 3 && <Trophy className={`h-4 w-4 ${getTrophyColor(agent.rank)}`} />}
                                <span className="text-sm font-bold text-gray-900">#{agent.rank}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap"><span className="text-sm font-semibold text-[#0A4E8E]">{agent.agent_id}</span></td>
                            <td className="px-5 py-3.5 whitespace-nowrap"><span className="text-sm font-semibold text-gray-900">{agent.agent_name}</span></td>
                            <td className="px-5 py-3.5 whitespace-nowrap text-center"><span className="text-sm font-bold text-gray-900">{agent.total_members}</span></td>
                            <td className="px-5 py-3.5 whitespace-nowrap text-center"><span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">{agent.active_members}</span></td>
                            <td className="px-5 py-3.5 whitespace-nowrap text-center"><span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">{agent.inactive_members}</span></td>
                            <td className="px-5 py-3.5 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-20 bg-gray-200 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${parseFloat(retentionRate) >= 90 ? 'bg-green-600' : parseFloat(retentionRate) >= 75 ? 'bg-[#A4CC43]' : parseFloat(retentionRate) >= 50 ? 'bg-yellow-500' : 'bg-red-600'}`} style={{ width: `${retentionRate}%` }} /></div>
                                <span className="text-sm font-bold text-gray-900">{retentionRate}%</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap text-center">
                              <button onClick={() => exportAgentMembers(agent.agent_id, agent.agent_name)}
                                className="inline-flex items-center px-3 py-1.5 bg-[#0A4E8E] text-white text-xs font-semibold rounded-lg hover:bg-[#083d6f] transition-colors shadow-sm"
                                title="Export members to CSV">
                                <Download className="h-3.5 w-3.5 mr-1.5" />Export
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'predictive' && (
          <>
            {nextMonthPrediction ? (
              <div className="space-y-6">
                {/* Hero: Outcome */}
                <div className={`relative overflow-hidden rounded-2xl shadow-md ${
                  nextMonthPrediction.isWinning ? 'bg-gradient-to-br from-green-600 to-emerald-700' : 'bg-gradient-to-br from-amber-500 to-orange-600'
                }`}>
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                  <div className="relative z-10 p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                          <Brain className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl sm:text-2xl font-bold text-white">Next Month Prediction</h2>
                          <p className="text-white/80 text-sm mt-0.5 flex items-center gap-2">
                            {nextMonthPrediction.nextMonthLabel}
                            {nextMonthPrediction.isEnrollmentMonth && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-400/30 text-amber-100">
                                Enrollment month — higher cancellations expected
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-lg font-bold ${
                          nextMonthPrediction.isWinning ? 'bg-white/20 text-white' : 'bg-white/20 text-white'
                        }`}>
                          {nextMonthPrediction.isWinning ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                          {nextMonthPrediction.isWinning ? 'Winning' : 'Losing'}
                        </div>
                        <div className="text-3xl sm:text-4xl font-bold text-white mt-2">
                          {nextMonthPrediction.predictedNetNextMonth >= 0 ? '+' : ''}{nextMonthPrediction.predictedNetNextMonth}
                        </div>
                        <div className="text-white/80 text-sm">Predicted net change</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Break-even target */}
                <div className="bg-white rounded-2xl shadow-sm border-2 border-[#0A4E8E]/30 p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
                        <Target className="h-4 w-4 text-[#0A4E8E]" />
                        Break-even target
                      </h3>
                      <p className="text-sm text-gray-600">You need at least <strong className="text-[#0A4E8E]">{nextMonthPrediction.predictedCancellations}</strong> scheduled activations next month to break even.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#0A4E8E]">{nextMonthPrediction.predictedCancellations}</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">Need to activate</div>
                      </div>
                      <div className="text-gray-300">→</div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${nextMonthPrediction.scheduledActivationsNextMonth >= nextMonthPrediction.predictedCancellations ? 'text-green-600' : 'text-red-600'}`}>
                          {nextMonthPrediction.scheduledActivationsNextMonth}
                        </div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">Scheduled</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Refresh + Methodology */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <span className="h-4 w-1 rounded-full bg-[#0A4E8E]" />
                      Methodology
                    </h3>
                    <button
                      type="button"
                      onClick={() => setPredictiveRefreshKey(k => k + 1)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0A4E8E] hover:bg-[#0A4E8E]/10 rounded-lg transition-colors"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Refresh prediction
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="space-y-2">
                      <p><strong className="text-gray-800">Scheduled activations:</strong> Count of members with <code className="bg-gray-100 px-1 rounded">active_date</code> in next month — actual data, no estimation.</p>
                      <p><strong className="text-gray-800">Predicted cancellations (V2.3):</strong> {nextMonthPrediction.sourceLabel}. Median of Seasonal Naive + Recency + Blend for robustness.</p>
                      <p><strong className="text-gray-800">Data sources:</strong> users + members + past_inactives ({predictivePrimaryMembers.length.toLocaleString()} primary, {pastInactives.length.toLocaleString()} historical). Trend ±5% when last 3 vs prior 3 months differ by &gt;10%.</p>
                    </div>
                    <div className="space-y-2">
                      <p><strong className="text-gray-800">Breakdown:</strong> Age out (65) = certain; Transaction declined = rate from this year (members + past_inactives); Voluntary = remainder.</p>
                      <p><strong className="text-gray-800">Confidence:</strong> ~{nextMonthPrediction.confidencePct}% based on historical net variance.</p>
                    </div>
                  </div>
                </div>

                {/* Main metrics grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Scheduled Activations */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6" style={{ borderTop: '4px solid #10b981' }}>
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h3 className="text-sm font-bold text-gray-900">Scheduled Activations</h3>
                    </div>
                    <div className="text-4xl font-bold text-green-600 mb-1">{nextMonthPrediction.scheduledActivationsNextMonth}</div>
                    <p className="text-xs text-gray-500">Members with <code className="bg-gray-100 px-1 rounded">active_date</code> in {nextMonthPrediction.nextMonthLabel}</p>
                    <p className="text-xs text-gray-400 mt-2">Actual data from database — plans that will become active next month.</p>
                  </div>

                  {/* Predicted Cancellations */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6" style={{ borderTop: '4px solid #ef4444' }}>
                    <div className="flex items-center gap-2 mb-4">
                      <UserX className="h-5 w-5 text-red-600" />
                      <h3 className="text-sm font-bold text-gray-900">Predicted Cancellations</h3>
                    </div>
                    <div className="text-4xl font-bold text-red-600 mb-1">{nextMonthPrediction.predictedCancellations}</div>
                    <p className="text-xs text-gray-500 mb-3">{nextMonthPrediction.sourceLabel}</p>
                    {nextMonthPrediction.isEnrollmentMonth && (
                      <p className="text-xs text-amber-700 font-medium mb-2">Jan/Dec enrollment — expect higher cancellations</p>
                    )}
                    <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-amber-700 font-medium">Age out (65)</span>
                        <span className="font-bold">{nextMonthPrediction.predictedBreakdown.ageOut}</span>
                        <span className="text-gray-400">for sure</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-orange-600 font-medium">Transaction declined</span>
                        <span className="font-bold">{nextMonthPrediction.predictedBreakdown.transactionDeclined}</span>
                        <span className="text-gray-400">from avg ({nextMonthPrediction.transactionDeclinedRatePct}%)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Voluntary</span>
                        <span className="font-bold">{nextMonthPrediction.predictedBreakdown.other}</span>
                      </div>
                    </div>
                  </div>

                  {/* Scenarios & Net */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6" style={{ borderTop: '4px solid #0A4E8E' }}>
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="h-5 w-5 text-[#0A4E8E]" />
                      <h3 className="text-sm font-bold text-gray-900">Scenarios</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                        <span className="text-sm font-medium text-green-800">Best case</span>
                        <span className="text-xl font-bold text-green-600">{nextMonthPrediction.scenarios.best >= 0 ? '+' : ''}{nextMonthPrediction.scenarios.best}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                        <span className="text-sm font-medium text-gray-800">Base case</span>
                        <span className="text-xl font-bold text-gray-900">{nextMonthPrediction.scenarios.base >= 0 ? '+' : ''}{nextMonthPrediction.scenarios.base}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl">
                        <span className="text-sm font-medium text-red-800">Worst case</span>
                        <span className="text-xl font-bold text-red-600">{nextMonthPrediction.scenarios.worst >= 0 ? '+' : ''}{nextMonthPrediction.scenarios.worst}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-3">Based on ±variance of monthly cancellations this year.</p>
                  </div>
                </div>

                {/* YTD: predicted vs actual (completed months) */}
                {predictionYtdBacktest.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-[#0A4E8E]" />
                          {new Date().getFullYear()} — actual vs predicted cancellations
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Each completed month uses the same V2.3 median-of-3 model as the CEO report; predictions use only data before that month.
                        </p>
                      </div>
                      {predictionYtdSummary && (
                        <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                          <span className="rounded-lg bg-gray-50 px-2.5 py-1 border border-gray-100">
                            MAPE (abs. %): <strong className="text-gray-900">{predictionYtdSummary.mape.toFixed(1)}%</strong>
                          </span>
                          <span className="rounded-lg bg-gray-50 px-2.5 py-1 border border-gray-100">
                            Within ±20%: <strong className="text-gray-900">{predictionYtdSummary.within20}/{predictionYtdSummary.totalMonths}</strong>
                          </span>
                          <span className="rounded-lg bg-gray-50 px-2.5 py-1 border border-gray-100">
                            Σ actual <strong className="text-gray-900">{predictionYtdSummary.sumAct}</strong> · Σ pred{' '}
                            <strong className="text-gray-900">{predictionYtdSummary.sumPred}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="h-72 w-full mb-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={predictionYtdBacktest} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                          <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
                          <Tooltip
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                            formatter={(value: number, name: string, item) => {
                              const dk = item?.dataKey != null ? String(item.dataKey) : '';
                              return [
                                value,
                                dk === 'actual' ? 'Actual' : dk === 'predicted' ? 'Predicted (V2.3)' : name,
                              ];
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                          <Bar dataKey="actual" name="Actual" fill="#0A4E8E" radius={[4, 4, 0, 0]} maxBarSize={40} />
                          <Bar dataKey="predicted" name="Predicted (V2.3)" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-left text-[10px] uppercase tracking-wider text-gray-500">
                            <th className="px-3 py-2.5 font-semibold">Month</th>
                            <th className="px-3 py-2.5 font-semibold text-right">Actual</th>
                            <th className="px-3 py-2.5 font-semibold text-right">Predicted</th>
                            <th className="px-3 py-2.5 font-semibold text-right">Error</th>
                            <th className="px-3 py-2.5 font-semibold text-right">% err.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {predictionYtdBacktest.map((row) => (
                            <tr key={row.monthKey} className="hover:bg-gray-50/80">
                              <td className="px-3 py-2 font-medium text-gray-900">{row.monthLabel}</td>
                              <td className="px-3 py-2 text-right tabular-nums">{row.actual}</td>
                              <td className="px-3 py-2 text-right tabular-nums text-gray-700">{row.predicted}</td>
                              <td className={`px-3 py-2 text-right tabular-nums ${row.error > 0 ? 'text-amber-700' : row.error < 0 ? 'text-green-700' : 'text-gray-600'}`}>
                                {row.error > 0 ? '+' : ''}{row.error}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums text-gray-600">
                                {row.pctError != null ? `${row.pctError >= 0 ? '+' : ''}${row.pctError.toFixed(1)}%` : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Age-out list */}
                {predictedAgeOutNextMonth.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 bg-amber-50/50">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <h3 className="text-sm font-bold text-gray-900">Predicted Age-Out (65) — Cancelled in {nextMonthPrediction.nextMonthLabel}</h3>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Primary members who turn 65 in {format(subMonths(new Date(), -2), 'MMMM yyyy')} — cancelled the month before birthday. Excludes those already inactive.</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Member ID</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">DOB</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Agent</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {predictedAgeOutNextMonth.map((m) => (
                            <tr key={m.member_id} className="hover:bg-amber-50/30">
                              <td className="px-4 py-3 font-mono text-xs">{m.member_id}</td>
                              <td className="px-4 py-3 font-semibold">{m.first_name} {m.last_name}</td>
                              <td className="px-4 py-3 text-gray-600">{m.dob ? (() => { try { return format(parseISO(String(m.dob)), 'MMM d, yyyy'); } catch { return String(m.dob); } })() : '—'}</td>
                              <td className="px-4 py-3 text-gray-600">{m.agent_id || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="px-4 py-3 bg-amber-50 text-sm font-semibold text-amber-800 border-t border-amber-200">
                      {predictedAgeOutNextMonth.length} primary member{predictedAgeOutNextMonth.length !== 1 ? 's' : ''} turning 65 in {format(subMonths(new Date(), -2), 'MMMM')} (cancelled in {nextMonthPrediction.nextMonthLabel})
                    </div>
                  </div>
                )}

                {/* Transaction declined context */}
                <div className="bg-white rounded-2xl shadow-sm border border-orange-200 p-5 sm:p-6">
                  <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <span className="h-4 w-1 rounded-full bg-orange-500" />
                    Transaction Declined — Historical Context
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {nextMonthPrediction.totalCancelledThisYear > 0 ? (
                      <>This year, {nextMonthPrediction.transactionDeclinedThisYear} of {nextMonthPrediction.totalCancelledThisYear} cancellations had reason &quot;Transaction declined&quot; ({nextMonthPrediction.transactionDeclinedRatePct}%).
                      We apply this rate to predict {nextMonthPrediction.predictedBreakdown.transactionDeclined} transaction-declined cancellations next month.</>
                    ) : (
                      <>No cancellations this year yet. Transaction declined prediction uses historical rate.</>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">For comparison: avg cancellations/mo this year = {nextMonthPrediction.avgCancellationsForComparison} (includes open enrollment).</p>
                </div>

                {/* Summary message */}
                <div className={`rounded-xl p-4 ${nextMonthPrediction.isWinning ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                  <div className="flex items-start gap-3">
                    {nextMonthPrediction.isWinning ? <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" /> : <TrendingDown className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />}
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{nextMonthPrediction.message}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Not Enough Data</h3>
                <p className="text-sm text-gray-500">We need at least 3 months of historical data to generate predictions.</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'inactive' && (
          <>
            {/* Header row */}
            <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500 rounded-xl"><UserX className="h-5 w-5 text-white" /></div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Inactive Members Analysis</h2>
                  <p className="text-xs text-gray-400">Monthly breakdown and insights</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <select value={inactiveMonthFilter} onChange={(e) => setInactiveMonthFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0A4E8E]/20">
                  <option value="current">Current Month</option>
                  {Array.from({ length: 11 }, (_, i) => {
                    const monthDate = subMonths(new Date(), i + 1);
                    const value = format(monthDate, 'yyyy-MM');
                    const label = format(monthDate, 'MMMM yyyy');
                    return <option key={value} value={value}>{label}</option>;
                  })}
                </select>
                <button
                  onClick={exportInactiveMembersThisMonth}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A4E8E] text-white rounded-xl text-sm font-semibold hover:bg-[#083d6f] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A4E8E]/20"
                >
                  <Download className="h-4 w-4" />
                  Export Cancellations
                </button>
              </div>
            </div>

            {/* Last 6 Months mini-cards */}
            <div className="mb-5">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {(() => {
                  const months = Array.from({ length: 6 }, (_, i) => {
                    const monthDate = subMonths(new Date(), i);
                    return { date: monthDate, start: startOfMonth(monthDate), end: endOfMonth(monthDate), label: format(monthDate, 'MMM yyyy'), value: format(monthDate, 'yyyy-MM') };
                  }).reverse();
                  return months.map((month, idx) => {
                    const monthInactives = allMembers.filter(member => {
                      if (!member.inactive_date) return false;
                      try { const d = parseISO(member.inactive_date); return d >= month.start && d <= month.end; } catch { return false; }
                    });
                    const isSelected = inactiveMonthFilter === month.value;
                    return (
                      <button key={idx} onClick={() => setInactiveMonthFilter(month.value)}
                        className={`bg-white rounded-2xl p-3.5 text-left border-2 transition-all shadow-sm ${isSelected ? 'border-[#0A4E8E]' : 'border-gray-100 hover:border-[#0CC0DF]'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-semibold text-gray-400">{month.label}</span>
                          <div className={`p-1 rounded-lg ${monthInactives.length > 20 ? 'bg-red-100' : monthInactives.length > 10 ? 'bg-amber-100' : 'bg-green-100'}`}>
                            <UserX className={`h-2.5 w-2.5 ${monthInactives.length > 20 ? 'text-red-600' : monthInactives.length > 10 ? 'text-amber-600' : 'text-green-600'}`} />
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{monthInactives.length}</div>
                        <div className="text-[10px] text-gray-400">inactives</div>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Detailed Inactive List */}
            <div className="mb-5">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h3 className="text-base font-bold text-gray-900">{inactiveMonthFilter === 'current' ? 'Current Month' : format(parseISO(inactiveMonthFilter + '-01'), 'MMMM yyyy')} Inactives</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Complete list with reasons</p>
                </div>
                <div className="overflow-x-auto">
                  {(() => {
                    const now = new Date();
                    let monthStart: Date, monthEnd: Date;
                    if (inactiveMonthFilter === 'current') { monthStart = startOfMonth(now); monthEnd = endOfMonth(now); }
                    else { const filterDate = parseISO(inactiveMonthFilter + '-01'); monthStart = startOfMonth(filterDate); monthEnd = endOfMonth(filterDate); }

                    const inactivesThisMonth = allMembers
                      .filter(member => { if (!member.inactive_date) return false; try { const d = parseISO(member.inactive_date); return d >= monthStart && d <= monthEnd; } catch { return false; } })
                      .sort((a, b) => parseISO(b.inactive_date!).getTime() - parseISO(a.inactive_date!).getTime());

                    const uniqueReasons = Array.from(new Set(inactivesThisMonth.map(m => m.inactive_reason).filter(Boolean))).sort();
                    const uniqueProducts = Array.from(new Set(inactivesThisMonth.map(m => m.product_label).filter(Boolean))).sort();
                    const uniqueAdvisors = Array.from(new Set(inactivesThisMonth.map(m => { const a = advisors.find(x => x.agent_id === m.agent_id); return a ? `${a.first_name} ${a.last_name}` : null; }).filter((v): v is string => v !== null))).sort();

                    const filteredInactives = inactivesThisMonth.filter(member => {
                      if (inactiveReasonFilter !== 'all' && member.inactive_reason !== inactiveReasonFilter) return false;
                      if (inactiveProductFilter !== 'all' && member.product_label !== inactiveProductFilter) return false;
                      if (inactiveAdvisorFilter !== 'all') { const a = advisors.find(x => x.agent_id === member.agent_id); const name = a ? `${a.first_name} ${a.last_name}` : null; if (name !== inactiveAdvisorFilter) return false; }
                      return true;
                    });

                    if (inactivesThisMonth.length === 0) return (
                      <div className="p-12 text-center">
                        <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-gray-900 mb-1">No Inactives This Month</h3>
                        <p className="text-sm text-gray-400">Great job! No members became inactive.</p>
                      </div>
                    );

                    return (
                      <div>
                        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap items-center gap-3">
                          <span className="text-xs font-medium text-gray-500">Showing {filteredInactives.length} of {inactivesThisMonth.length} members</span>
                          {(inactiveReasonFilter !== 'all' || inactiveProductFilter !== 'all' || inactiveAdvisorFilter !== 'all') && (
                            <button onClick={() => { setInactiveReasonFilter('all'); setInactiveProductFilter('all'); setInactiveAdvisorFilter('all'); }}
                              className="text-xs px-3 py-1 bg-[#0A4E8E] text-white rounded-full hover:bg-[#083d6f] transition-colors">Clear Filters</button>
                          )}
                        </div>
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                              <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Member</th>
                              <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Inactive Date</th>
                              <th className="px-5 py-3.5 text-left">
                                <div className="flex flex-col gap-1.5">
                                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Reason</span>
                                  <select value={inactiveReasonFilter} onChange={(e) => setInactiveReasonFilter(e.target.value)} className="text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white text-gray-600 font-normal normal-case focus:outline-none">
                                    <option value="all">All Reasons</option>
                                    {uniqueReasons.map(r => <option key={r} value={r}>{r}</option>)}
                                  </select>
                                </div>
                              </th>
                              <th className="px-5 py-3.5 text-left">
                                <div className="flex flex-col gap-1.5">
                                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Product</span>
                                  <select value={inactiveProductFilter} onChange={(e) => setInactiveProductFilter(e.target.value)} className="text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white text-gray-600 font-normal normal-case focus:outline-none">
                                    <option value="all">All Products</option>
                                    {uniqueProducts.map(p => <option key={p} value={p}>{p}</option>)}
                                  </select>
                                </div>
                              </th>
                              <th className="px-5 py-3.5 text-left">
                                <div className="flex flex-col gap-1.5">
                                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Advisor</span>
                                  <select value={inactiveAdvisorFilter} onChange={(e) => setInactiveAdvisorFilter(e.target.value)} className="text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white text-gray-600 font-normal normal-case focus:outline-none">
                                    <option value="all">All Advisors</option>
                                    {uniqueAdvisors.map(a => <option key={a} value={a}>{a}</option>)}
                                  </select>
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {filteredInactives.length === 0 ? (
                              <tr><td colSpan={5} className="px-5 py-10 text-center">
                                <Filter className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                                <p className="text-sm text-gray-400">No members match the selected filters</p>
                                <button onClick={() => { setInactiveReasonFilter('all'); setInactiveProductFilter('all'); setInactiveAdvisorFilter('all'); }} className="mt-3 text-xs px-4 py-1.5 bg-[#0A4E8E] text-white rounded-lg hover:bg-[#083d6f]">Clear Filters</button>
                              </td></tr>
                            ) : filteredInactives.map((member, idx) => {
                              const inactiveDate = parseISO(member.inactive_date!);
                              const advisor = advisors.find(a => a.agent_id === member.agent_id);
                              return (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-3">
                                      <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0"><UserX className="h-4 w-4 text-red-600" /></div>
                                      <div><div className="text-sm font-semibold text-gray-900">{member.first_name} {member.last_name}</div><div className="text-xs text-gray-400">{member.member_id}</div></div>
                                    </div>
                                  </td>
                                  <td className="px-5 py-3.5"><div className="text-sm font-medium text-gray-900">{format(inactiveDate, 'MMM dd, yyyy')}</div><div className="text-xs text-gray-400">{differenceInDays(new Date(), inactiveDate)} days ago</div></td>
                                  <td className="px-5 py-3.5"><div className="text-sm text-gray-700 max-w-xs truncate">{member.inactive_reason || 'No reason provided'}</div></td>
                                  <td className="px-5 py-3.5"><div className="text-sm text-gray-700 max-w-xs truncate">{member.product_label || 'N/A'}</div></td>
                                  <td className="px-5 py-3.5"><div className="text-sm text-gray-700">{advisor ? `${advisor.first_name} ${advisor.last_name}` : 'N/A'}</div></td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Top Inactive Reasons */}
            <div className="mb-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-500 rounded-xl"><AlertCircle className="h-5 w-5 text-white" /></div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Top Inactive Reasons — {inactiveMonthFilter === 'current' ? 'Current Month' : format(parseISO(inactiveMonthFilter + '-01'), 'MMMM yyyy')}</h2>
                  <p className="text-xs text-gray-400">Most common cancellation reasons</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                {(() => {
                  const now = new Date();
                  let monthStart: Date, monthEnd: Date;
                  if (inactiveMonthFilter === 'current') { monthStart = startOfMonth(now); monthEnd = endOfMonth(now); }
                  else { const fd = parseISO(inactiveMonthFilter + '-01'); monthStart = startOfMonth(fd); monthEnd = endOfMonth(fd); }
                  const inactivesThisMonth = allMembers.filter(member => { if (!member.inactive_date) return false; try { const d = parseISO(member.inactive_date); return d >= monthStart && d <= monthEnd; } catch { return false; } });
                  const reasonCounts: { [key: string]: number } = {};
                  inactivesThisMonth.forEach(member => { const r = member.inactive_reason?.trim() || 'No reason provided'; reasonCounts[r] = (reasonCounts[r] || 0) + 1; });
                  const reasonStats = Object.entries(reasonCounts).map(([reason, count]) => ({ reason, count, percentage: (count / inactivesThisMonth.length) * 100 })).sort((a, b) => b.count - a.count);
                  if (reasonStats.length === 0) return (
                    <div className="text-center py-8 text-gray-400">
                      <CheckCircle className="h-10 w-10 text-green-300 mx-auto mb-2" />
                      <p className="text-sm">No inactive members this period</p>
                    </div>
                  );
                  return (
                    <div className="space-y-4">
                      {reasonStats.map((stat, idx) => (
                        <div key={idx} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${idx === 0 ? 'bg-red-100 text-red-600' : idx === 1 ? 'bg-orange-100 text-orange-600' : idx === 2 ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>{idx + 1}</div>
                              <div className="text-sm font-semibold text-gray-800">{stat.reason}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-gray-900">{stat.count} members</div>
                              <div className="text-xs text-gray-400">{stat.percentage.toFixed(1)}%</div>
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${idx === 0 ? 'bg-red-500' : idx === 1 ? 'bg-orange-500' : idx === 2 ? 'bg-amber-500' : 'bg-gray-400'}`} style={{ width: `${stat.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Advisor Retention */}
            <div className="mb-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg,#0A4E8E,#0CC0DF)' }}><Users className="h-5 w-5 text-white" /></div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Advisor Retention — {inactiveMonthFilter === 'current' ? 'Current Month' : format(parseISO(inactiveMonthFilter + '-01'), 'MMMM yyyy')}</h2>
                  <p className="text-xs text-gray-400">Which advisors had the most inactives</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {(() => {
                  const now = new Date();
                  let monthStart: Date, monthEnd: Date;
                  if (inactiveMonthFilter === 'current') { monthStart = startOfMonth(now); monthEnd = endOfMonth(now); }
                  else { const fd = parseISO(inactiveMonthFilter + '-01'); monthStart = startOfMonth(fd); monthEnd = endOfMonth(fd); }
                  const inactivesThisMonth = allMembers.filter(member => { if (!member.inactive_date) return false; try { const d = parseISO(member.inactive_date); return d >= monthStart && d <= monthEnd; } catch { return false; } });
                  const advisorStats = new Map<string, { name: string; inactiveCount: number; totalMembers: number }>();
                  advisors.forEach(advisor => { advisorStats.set(advisor.agent_id, { name: `${advisor.first_name} ${advisor.last_name}`, inactiveCount: inactivesThisMonth.filter(m => m.agent_id === advisor.agent_id).length, totalMembers: allMembers.filter(m => m.agent_id === advisor.agent_id).length }); });
                  const sortedAdvisors = Array.from(advisorStats.entries()).map(([id, data]) => ({ id, ...data })).sort((a, b) => b.inactiveCount - a.inactiveCount);
                  if (sortedAdvisors.length === 0) return <div className="p-8 text-center text-gray-400"><Users className="h-10 w-10 text-gray-200 mx-auto mb-2" /><p className="text-sm">No advisor data available</p></div>;
                  return (
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          {['Advisor','Inactives This Month','Total Members','Retention Rate'].map((h, i) => (
                            <th key={h} className={`px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider ${i === 0 ? 'text-left' : 'text-center'}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {sortedAdvisors.map((advisor, idx) => {
                          const retentionRate = advisor.totalMembers > 0 ? ((advisor.totalMembers - advisor.inactiveCount) / advisor.totalMembers) * 100 : 100;
                          return (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                              <td className="px-5 py-3.5"><div className="text-sm font-semibold text-gray-900">{advisor.name}</div></td>
                              <td className="px-5 py-3.5 text-center"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${advisor.inactiveCount > 10 ? 'bg-red-100 text-red-700' : advisor.inactiveCount > 5 ? 'bg-amber-100 text-amber-700' : advisor.inactiveCount > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{advisor.inactiveCount}</span></td>
                              <td className="px-5 py-3.5 text-center"><span className="text-sm font-medium text-gray-900">{advisor.totalMembers}</span></td>
                              <td className="px-5 py-3.5 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-20 bg-gray-200 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${retentionRate >= 95 ? 'bg-green-500' : retentionRate >= 90 ? 'bg-[#0CC0DF]' : retentionRate >= 85 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${retentionRate}%` }} /></div>
                                  <span className="text-sm font-bold text-gray-900">{retentionRate.toFixed(1)}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            </div>
          </>
        )}

        {activeTab === 'inhouse' && (
          <>
            {inhouseLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#A4CC43] border-t-transparent"></div>
                  <p className="mt-4 text-sm text-gray-500 font-medium">Loading inhouse advisor performance...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Time Period Filter */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="h-5 w-5 text-[#0CC0DF]" />
                    <h2 className="text-base font-bold text-gray-900">Time Period</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {getInhouseTimeFilters().map((filter) => (
                      <button key={filter.value} onClick={() => setInhouseTimeFilter(filter.value)}
                        className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${inhouseTimeFilter === filter.value ? 'bg-[#0A4E8E] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {filter.label}
                      </button>
                    ))}
                  </div>
                  {inhouseTimeFilter === 'custom' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-xl">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Start Date</label>
                        <input type="date" value={inhouseCustomStartDate} onChange={(e) => setInhouseCustomStartDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4E8E]/20 focus:border-[#0A4E8E]" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">End Date</label>
                        <input type="date" value={inhouseCustomEndDate} onChange={(e) => setInhouseCustomEndDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4E8E]/20 focus:border-[#0A4E8E]" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Current Month Sales hero */}
                <div className="relative rounded-2xl overflow-hidden shadow-md mb-5" style={{ background: 'linear-gradient(135deg, #0A4E8E 0%, #0CC0DF 100%)' }}>
                  <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '24px 24px' }} aria-hidden="true" />
                  <div className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-8 sm:py-7">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-5 w-5 text-[#A4CC43]" />
                        <h2 className="text-lg font-bold text-white">Current Month Sales</h2>
                      </div>
                      <p className="text-white/60 text-xs mb-4">Total primary members created in {format(new Date(), 'MMMM yyyy')}</p>
                      <div className="bg-white/10 rounded-xl px-6 py-4 border border-white/20 inline-block">
                        <p className="text-5xl font-bold text-white">{currentMonthTotal.toLocaleString()}</p>
                        <p className="text-white/80 text-sm mt-1 font-medium">New Primary Members</p>
                      </div>
                    </div>
                    <Target className="hidden lg:block h-24 w-24 text-white/15" />
                  </div>
                </div>

                {/* Advisor Cards */}
                <div className="mb-5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Advisor Overview</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {inhouseStats.map((stat: any) => (
                      <div key={stat.advisorId} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow" style={{ borderTop: `3px solid ${stat.color}` }}>
                        <div className="p-5">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-base font-bold text-gray-900">{stat.firstName} {stat.lastName}</h3>
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {stat.agentIds.map((agentId: string) => (
                                  <span key={agentId} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">ID: {agentId}</span>
                                ))}
                              </div>
                            </div>
                            <div className="p-2.5 rounded-xl flex-shrink-0 ml-3" style={{ background: `${stat.color}20` }}>
                              <Users className="h-5 w-5" style={{ color: stat.color }} />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="bg-gray-50 rounded-xl p-3.5">
                              <p className="text-xs text-gray-500 font-medium mb-1">Total Members</p>
                              <p className="text-3xl font-bold" style={{ color: stat.color }}>{stat.totalMembers.toLocaleString()}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                              <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                                <p className="text-[10px] text-gray-500 font-medium mb-1">Active</p>
                                <p className="text-xl font-bold text-green-600">{stat.activeMembers.toLocaleString()}</p>
                              </div>
                              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                <p className="text-[10px] text-gray-500 font-medium mb-1">Inactive</p>
                                <p className="text-xl font-bold text-gray-500">{stat.inactiveMembers.toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="bg-[#0A4E8E]/5 rounded-xl p-3.5 border border-[#0A4E8E]/10">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-bold text-gray-700">Retention Rate</p>
                                <TrendingUp className="h-4 w-4 text-[#0A4E8E]" />
                              </div>
                              <p className="text-2xl font-bold text-[#0A4E8E]">{stat.retentionRate}%</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                                <p className="text-[10px] text-gray-500 font-medium mb-1">New</p>
                                <p className="text-lg font-bold text-emerald-600">{stat.newEnrollments}</p>
                              </div>
                              <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                                <p className="text-[10px] text-gray-500 font-medium mb-1">Churned</p>
                                <p className="text-lg font-bold text-red-600">{stat.churnedMembers}</p>
                              </div>
                            </div>
                            <div className="bg-[#0CC0DF]/5 rounded-xl p-3.5 border border-[#0CC0DF]/20">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-bold text-gray-700">Sales (Created Date)</p>
                                <Target className="h-4 w-4 text-[#0CC0DF]" />
                              </div>
                              <p className="text-2xl font-bold text-[#0A4E8E]">{stat.salesByCreatedDate}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">Primary members created in period</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center gap-2 mb-5">
                      <Target className="h-5 w-5 text-[#0CC0DF]" />
                      <h3 className="text-base font-bold text-gray-900">Member Distribution</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={inhouseStats.map(stat => ({ name: `${stat.firstName} ${stat.lastName}`, value: stat.totalMembers, color: stat.color }))} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={100} dataKey="value">
                          {inhouseStats.map((stat: any, index: number) => <Cell key={`cell-${index}`} fill={stat.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center gap-2 mb-5">
                      <Activity className="h-5 w-5 text-[#A4CC43]" />
                      <h3 className="text-base font-bold text-gray-900">Active vs Inactive</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={inhouseStats.map(stat => ({ name: `${stat.firstName} ${stat.lastName}`, Active: stat.activeMembers, Inactive: stat.inactiveMembers }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} />
                        <Legend />
                        <Bar dataKey="Active" fill="#10b981" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="Inactive" fill="#9ca3af" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
                  <div className="flex items-center gap-2 mb-5">
                    <TrendingUp className="h-5 w-5 text-[#0CC0DF]" />
                    <h3 className="text-base font-bold text-gray-900">Enrollments vs Churn</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={inhouseStats.map(stat => ({ name: `${stat.firstName} ${stat.lastName}`, New: stat.newEnrollments, Churned: stat.churnedMembers }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} />
                      <Legend />
                      <Bar dataKey="New" fill="#059669" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Churned" fill="#dc2626" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center gap-2 mb-5">
                    <Target className="h-5 w-5 text-[#0A4E8E]" />
                    <h3 className="text-base font-bold text-gray-900">Sales by Created Date</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={inhouseStats.map(stat => ({ name: `${stat.firstName} ${stat.lastName}`, Sales: stat.salesByCreatedDate }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} />
                      <Legend />
                      <Bar dataKey="Sales" fill="#0A4E8E" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </>
        )}
      </div>
      </div>
    </div>
  );
}

