import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Mail,
  MailOpen,
  Clock,
  Calendar,
  Phone,
  DollarSign,
  TrendingUp,
  Users,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Download,
  RefreshCw,
  Activity,
  FileText,
  CheckSquare,
  MessageSquare,
  Trophy,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart,
} from 'recharts';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, differenceInMinutes, parseISO } from 'date-fns';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RepProfile {
  id: string;
  email: string;
  full_name: string;
}

interface EmailLogRow {
  id: string;
  direction: 'inbound' | 'outbound';
  sent_by: string;
  sent_at: string;
  status: string;
  open_count: number;
  click_count: number;
  thread_id?: string;
  lead_id?: string;
}

interface ActivityRow {
  id: string;
  activity_type: string;
  created_by: string;
  created_at: string;
  lead_id: string;
  description?: string;
  lead_name?: string;
}

interface CalendarEventRow {
  id: string;
  event_type: string;
  created_by: string;
  start_time: string;
  status: string;
}

interface DealRow {
  id: string;
  value: number;
  stage: string;
  updated_at: string;
  lead_id: string;
}

// KPI data
interface KPIData {
  emailsSent: number;
  emailsReceived: number;
  avgResponseMinutes: number;
  meetingsHeld: number;
  callsMade: number;
  pipelineValue: number;
}

// Leaderboard row
interface LeaderboardRow {
  repId: string;
  repName: string;
  emailsSent: number;
  emailsReceived: number;
  calls: number;
  meetings: number;
  tasksCompleted: number;
  activityScore: number;
}

// Response time per rep
interface RepResponseTime {
  repName: string;
  avgMinutes: number;
}

// Activity feed item
interface FeedItem {
  id: string;
  repName: string;
  activityType: string;
  description: string;
  time: string;
  leadName: string;
}

// ─── Preset ranges ───────────────────────────────────────────────────────────

type DatePreset = 'today' | 'this_week' | 'this_month' | 'this_quarter' | 'custom';

function getPresetRange(preset: DatePreset): { from: Date; to: Date } {
  const now = new Date();
  switch (preset) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) };
    case 'this_week':
      return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'this_month':
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case 'this_quarter':
      return { from: startOfQuarter(now), to: endOfQuarter(now) };
    case 'custom':
      return { from: subDays(now, 30), to: endOfDay(now) };
  }
}

const PRESET_LABELS: Record<DatePreset, string> = {
  today: 'Today',
  this_week: 'This Week',
  this_month: 'This Month',
  this_quarter: 'This Quarter',
  custom: 'Custom',
};

// ─── Chart Colors ────────────────────────────────────────────────────────────

const CHART_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#22C55E', '#EF4444', '#06B6D4'];

const ACTIVITY_COLORS: Record<string, string> = {
  email: '#3B82F6',
  call: '#10B981',
  meeting: '#8B5CF6',
  note: '#F59E0B',
  task: '#EC4899',
};

const ACTIVITY_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  call: Phone,
  meeting: Calendar,
  note: FileText,
  task: CheckSquare,
};

// ─── Tooltip style ───────────────────────────────────────────────────────────

const TOOLTIP_STYLE = {
  backgroundColor: '#1E293B',
  border: 'none',
  borderRadius: '8px',
  color: '#F8FAFC',
  fontSize: '12px',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getResponseColor(minutes: number): string {
  if (minutes < 60) return '#10B981';      // green
  if (minutes < 240) return '#F59E0B';     // amber
  return '#EF4444';                         // red
}

function getResponseLabel(minutes: number): string {
  if (minutes < 60) return 'Fast';
  if (minutes < 240) return 'Moderate';
  return 'Slow';
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  return `$${amount.toFixed(0)}`;
}

// ─── Sort helpers ────────────────────────────────────────────────────────────

type SortField = 'activityScore' | 'emailsSent' | 'emailsReceived' | 'calls' | 'meetings' | 'tasksCompleted' | 'repName';
type SortDir = 'asc' | 'desc';

// ═════════════════════════════════════════════════════════════════════════════
// Main Component
// ═════════════════════════════════════════════════════════════════════════════

export default function SalesActivityDashboard() {
  const { supabase } = useCRM();
  const { activeOrgId } = useOrg();

  // ─── State ──────────────────────────────────────────────────────────────

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [datePreset, setDatePreset] = useState<DatePreset>('this_month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);

  // Rep filter
  const [reps, setReps] = useState<RepProfile[]>([]);
  const [selectedRepId, setSelectedRepId] = useState<string>('all');
  const [showRepDropdown, setShowRepDropdown] = useState(false);

  // Raw data
  const [emailLogs, setEmailLogs] = useState<EmailLogRow[]>([]);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventRow[]>([]);
  const [deals, setDeals] = useState<DealRow[]>([]);

  // Leaderboard sort
  const [sortField, setSortField] = useState<SortField>('activityScore');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Activity feed filter
  const [feedFilter, setFeedFilter] = useState<string>('all');

  // Pie chart interaction
  const [selectedActivityType, setSelectedActivityType] = useState<string | null>(null);

  // ─── Date range ─────────────────────────────────────────────────────────

  const dateRange = useMemo(() => {
    if (datePreset === 'custom' && customFrom && customTo) {
      return { from: startOfDay(parseISO(customFrom)), to: endOfDay(parseISO(customTo)) };
    }
    return getPresetRange(datePreset);
  }, [datePreset, customFrom, customTo]);

  const fromISO = useMemo(() => dateRange.from.toISOString(), [dateRange]);
  const toISO = useMemo(() => dateRange.to.toISOString(), [dateRange]);

  // ─── Load reps ──────────────────────────────────────────────────────────

  const loadReps = useCallback(async () => {
    const { data } = await supabase
      .from('org_members')
      .select('user_id, users:user_id(id, email, raw_user_meta_data)')
      .eq('org_id', activeOrgId ?? '');

    if (data) {
      const repList: RepProfile[] = data.map((row: any) => ({
        id: row.user_id,
        email: (row.users as any)?.email ?? 'Unknown',
        full_name:
          (row.users as any)?.raw_user_meta_data?.full_name ??
          (row.users as any)?.email?.split('@')[0] ??
          'Unknown',
      }));
      setReps(repList);
    }
  }, [supabase, activeOrgId]);

  // ─── Load all data ─────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    if (!activeOrgId) return;

    try {
      // Fetch email logs
      const emailQuery = supabase
        .from('crm_email_log')
        .select('id, direction, sent_by, sent_at, status, open_count, click_count, thread_id, lead_id')
        .gte('sent_at', fromISO)
        .lte('sent_at', toISO)
        .order('sent_at', { ascending: false });

      // Fetch lead activities
      const activityQuery = supabase
        .from('lead_activities')
        .select('id, activity_type, created_by, created_at, lead_id, description')
        .gte('created_at', fromISO)
        .lte('created_at', toISO)
        .order('created_at', { ascending: false });

      // Fetch calendar events
      const calendarQuery = supabase
        .from('calendar_events')
        .select('id, event_type, created_by, start_time, status')
        .gte('start_time', fromISO)
        .lte('start_time', toISO)
        .order('start_time', { ascending: false });

      // Fetch deals with activity in period
      const dealQuery = supabase
        .from('deals')
        .select('id, value, stage, updated_at, lead_id')
        .gte('updated_at', fromISO)
        .lte('updated_at', toISO);

      const [emailRes, activityRes, calendarRes, dealRes] = await Promise.all([
        emailQuery,
        activityQuery,
        calendarQuery,
        dealQuery,
      ]);

      setEmailLogs((emailRes.data as EmailLogRow[]) ?? []);
      setActivities((activityRes.data as ActivityRow[]) ?? []);
      setCalendarEvents((calendarRes.data as CalendarEventRow[]) ?? []);
      setDeals((dealRes.data as DealRow[]) ?? []);
    } catch (err) {
      console.error('Failed to load sales activity data:', err);
      toast.error('Failed to load dashboard data');
    }
  }, [supabase, activeOrgId, fromISO, toISO]);

  // ─── Initial load ──────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setLoading(true);
      await Promise.all([loadReps(), loadData()]);
      if (!cancelled) setLoading(false);
    }
    init();
    return () => { cancelled = true; };
  }, [loadReps, loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  // ─── Filtered data ─────────────────────────────────────────────────────

  const filteredEmails = useMemo(() => {
    if (selectedRepId === 'all') return emailLogs;
    return emailLogs.filter((e) => e.sent_by === selectedRepId);
  }, [emailLogs, selectedRepId]);

  const filteredActivities = useMemo(() => {
    if (selectedRepId === 'all') return activities;
    return activities.filter((a) => a.created_by === selectedRepId);
  }, [activities, selectedRepId]);

  const filteredCalendarEvents = useMemo(() => {
    if (selectedRepId === 'all') return calendarEvents;
    return calendarEvents.filter((e) => e.created_by === selectedRepId);
  }, [calendarEvents, selectedRepId]);

  // ─── KPI Computation ───────────────────────────────────────────────────

  const kpis: KPIData = useMemo(() => {
    const emailsSent = filteredEmails.filter((e) => e.direction === 'outbound').length;
    const emailsReceived = filteredEmails.filter((e) => e.direction === 'inbound').length;

    // Avg response time: time between inbound email and next outbound on same thread
    const threadGroups: Record<string, EmailLogRow[]> = {};
    filteredEmails.forEach((e) => {
      if (e.thread_id) {
        if (!threadGroups[e.thread_id]) threadGroups[e.thread_id] = [];
        threadGroups[e.thread_id].push(e);
      }
    });

    let totalResponseTime = 0;
    let responseCount = 0;
    Object.values(threadGroups).forEach((threadEmails) => {
      const sorted = [...threadEmails].sort(
        (a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime(),
      );
      for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i].direction === 'inbound' && sorted[i + 1].direction === 'outbound') {
          const diff = differenceInMinutes(
            new Date(sorted[i + 1].sent_at),
            new Date(sorted[i].sent_at),
          );
          if (diff >= 0 && diff < 1440) {
            totalResponseTime += diff;
            responseCount++;
          }
        }
      }
    });

    const avgResponseMinutes = responseCount > 0 ? totalResponseTime / responseCount : 0;

    const meetingsHeld = filteredCalendarEvents.filter(
      (e) => e.event_type === 'meeting' && e.status !== 'cancelled',
    ).length;

    const callsMade = filteredActivities.filter((a) => a.activity_type === 'call').length;

    const pipelineValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);

    return { emailsSent, emailsReceived, avgResponseMinutes, meetingsHeld, callsMade, pipelineValue };
  }, [filteredEmails, filteredActivities, filteredCalendarEvents, deals]);

  // ─── Email Activity Chart (per day) ────────────────────────────────────

  const emailChartData = useMemo(() => {
    const dayMap: Record<string, Record<string, number>> = {};
    const openRateMap: Record<string, { opened: number; total: number }> = {};

    filteredEmails
      .filter((e) => e.direction === 'outbound')
      .forEach((e) => {
        const day = format(new Date(e.sent_at), 'MMM dd');
        const repName = reps.find((r) => r.id === e.sent_by)?.full_name ?? 'Unknown';

        if (!dayMap[day]) dayMap[day] = {};
        dayMap[day][repName] = (dayMap[day][repName] || 0) + 1;

        if (!openRateMap[day]) openRateMap[day] = { opened: 0, total: 0 };
        openRateMap[day].total += 1;
        if (e.open_count > 0) openRateMap[day].opened += 1;
      });

    // Sort by date
    const days = Object.keys(dayMap).sort(
      (a, b) => new Date(a + ' 2026').getTime() - new Date(b + ' 2026').getTime(),
    );

    const allRepNames = [...new Set(filteredEmails.filter((e) => e.direction === 'outbound').map((e) => reps.find((r) => r.id === e.sent_by)?.full_name ?? 'Unknown'))];

    return days.map((day) => {
      const entry: Record<string, any> = { day };
      allRepNames.forEach((name) => {
        entry[name] = dayMap[day]?.[name] || 0;
      });
      const or = openRateMap[day];
      entry.openRate = or && or.total > 0 ? Math.round((or.opened / or.total) * 100) : 0;
      return entry;
    });
  }, [filteredEmails, reps]);

  const emailChartRepNames = useMemo(() => {
    return [...new Set(filteredEmails.filter((e) => e.direction === 'outbound').map((e) => reps.find((r) => r.id === e.sent_by)?.full_name ?? 'Unknown'))];
  }, [filteredEmails, reps]);

  // ─── Activity Breakdown (Pie) ──────────────────────────────────────────

  const activityBreakdown = useMemo(() => {
    const counts: Record<string, number> = { email: 0, call: 0, meeting: 0, note: 0, task: 0 };

    filteredEmails.forEach(() => { counts.email += 1; });
    filteredActivities.forEach((a) => {
      const t = a.activity_type.toLowerCase();
      if (t in counts) counts[t] += 1;
      else counts.note += 1; // bucket unknown types into notes
    });
    filteredCalendarEvents.forEach((e) => {
      if (e.event_type === 'meeting') counts.meeting += 1;
    });

    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        key: name,
        color: ACTIVITY_COLORS[name] || '#6B7280',
      }));
  }, [filteredEmails, filteredActivities, filteredCalendarEvents]);

  // ─── Leaderboard ───────────────────────────────────────────────────────

  const leaderboard: LeaderboardRow[] = useMemo(() => {
    const repMap: Record<string, LeaderboardRow> = {};

    reps.forEach((r) => {
      repMap[r.id] = {
        repId: r.id,
        repName: r.full_name,
        emailsSent: 0,
        emailsReceived: 0,
        calls: 0,
        meetings: 0,
        tasksCompleted: 0,
        activityScore: 0,
      };
    });

    emailLogs.forEach((e) => {
      if (!repMap[e.sent_by]) return;
      if (e.direction === 'outbound') repMap[e.sent_by].emailsSent += 1;
      else repMap[e.sent_by].emailsReceived += 1;
    });

    activities.forEach((a) => {
      if (!repMap[a.created_by]) return;
      const t = a.activity_type.toLowerCase();
      if (t === 'call') repMap[a.created_by].calls += 1;
      else if (t === 'task') repMap[a.created_by].tasksCompleted += 1;
    });

    calendarEvents.forEach((e) => {
      if (!repMap[e.created_by]) return;
      if (e.event_type === 'meeting' && e.status !== 'cancelled') {
        repMap[e.created_by].meetings += 1;
      }
    });

    // Compute score: email sent 1pt, call 3pts, meeting 5pts, task 1pt
    Object.values(repMap).forEach((r) => {
      r.activityScore =
        r.emailsSent * 1 + r.calls * 3 + r.meetings * 5 + r.tasksCompleted * 1;
    });

    const rows = Object.values(repMap);
    rows.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    return rows;
  }, [reps, emailLogs, activities, calendarEvents, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  // ─── Response Time Analysis ────────────────────────────────────────────

  const responseTimeData: RepResponseTime[] = useMemo(() => {
    const repTimes: Record<string, { total: number; count: number }> = {};

    // Group emails by thread
    const threadGroups: Record<string, EmailLogRow[]> = {};
    emailLogs.forEach((e) => {
      if (e.thread_id) {
        if (!threadGroups[e.thread_id]) threadGroups[e.thread_id] = [];
        threadGroups[e.thread_id].push(e);
      }
    });

    Object.values(threadGroups).forEach((threadEmails) => {
      const sorted = [...threadEmails].sort(
        (a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime(),
      );
      for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i].direction === 'inbound' && sorted[i + 1].direction === 'outbound') {
          const repId = sorted[i + 1].sent_by;
          const diff = differenceInMinutes(
            new Date(sorted[i + 1].sent_at),
            new Date(sorted[i].sent_at),
          );
          if (diff >= 0 && diff < 1440) {
            if (!repTimes[repId]) repTimes[repId] = { total: 0, count: 0 };
            repTimes[repId].total += diff;
            repTimes[repId].count += 1;
          }
        }
      }
    });

    return reps
      .map((r) => ({
        repName: r.full_name,
        avgMinutes: repTimes[r.id] ? repTimes[r.id].total / repTimes[r.id].count : 0,
      }))
      .filter((r) => r.avgMinutes > 0)
      .sort((a, b) => a.avgMinutes - b.avgMinutes);
  }, [emailLogs, reps]);

  // Response by time of day
  const responseByHour = useMemo(() => {
    const hourBuckets: Record<string, { total: number; count: number }> = {};

    const threadGroups: Record<string, EmailLogRow[]> = {};
    emailLogs.forEach((e) => {
      if (e.thread_id) {
        if (!threadGroups[e.thread_id]) threadGroups[e.thread_id] = [];
        threadGroups[e.thread_id].push(e);
      }
    });

    Object.values(threadGroups).forEach((threadEmails) => {
      const sorted = [...threadEmails].sort(
        (a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime(),
      );
      for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i].direction === 'inbound' && sorted[i + 1].direction === 'outbound') {
          const hour = new Date(sorted[i + 1].sent_at).getHours();
          const label = `${hour.toString().padStart(2, '0')}:00`;
          const diff = differenceInMinutes(
            new Date(sorted[i + 1].sent_at),
            new Date(sorted[i].sent_at),
          );
          if (diff >= 0 && diff < 1440) {
            if (!hourBuckets[label]) hourBuckets[label] = { total: 0, count: 0 };
            hourBuckets[label].total += diff;
            hourBuckets[label].count += 1;
          }
        }
      }
    });

    return Object.entries(hourBuckets)
      .map(([hour, data]) => ({
        hour,
        avgMinutes: Math.round(data.total / data.count),
      }))
      .sort((a, b) => a.hour.localeCompare(b.hour));
  }, [emailLogs]);

  // ─── Activity Feed ─────────────────────────────────────────────────────

  const activityFeed: FeedItem[] = useMemo(() => {
    const items: FeedItem[] = [];

    // Emails
    filteredEmails.slice(0, 50).forEach((e) => {
      items.push({
        id: `email-${e.id}`,
        repName: reps.find((r) => r.id === e.sent_by)?.full_name ?? 'Unknown',
        activityType: 'email',
        description: `${e.direction === 'outbound' ? 'Sent' : 'Received'} email${e.status === 'opened' ? ' (opened)' : ''}`,
        time: e.sent_at,
        leadName: e.lead_id ? `Lead ${e.lead_id.slice(0, 8)}` : 'N/A',
      });
    });

    // Activities
    filteredActivities.slice(0, 50).forEach((a) => {
      items.push({
        id: `activity-${a.id}`,
        repName: reps.find((r) => r.id === a.created_by)?.full_name ?? 'Unknown',
        activityType: a.activity_type.toLowerCase(),
        description: a.description ?? `Logged ${a.activity_type}`,
        time: a.created_at,
        leadName: a.lead_name ?? (a.lead_id ? `Lead ${a.lead_id.slice(0, 8)}` : 'N/A'),
      });
    });

    // Calendar events
    filteredCalendarEvents.slice(0, 50).forEach((e) => {
      items.push({
        id: `cal-${e.id}`,
        repName: reps.find((r) => r.id === e.created_by)?.full_name ?? 'Unknown',
        activityType: 'meeting',
        description: `${e.event_type === 'meeting' ? 'Meeting' : e.event_type} - ${e.status}`,
        time: e.start_time,
        leadName: 'N/A',
      });
    });

    // Sort and limit
    items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    let filtered = items;
    if (feedFilter !== 'all') {
      filtered = items.filter((i) => i.activityType === feedFilter);
    }
    if (selectedActivityType) {
      filtered = filtered.filter((i) => i.activityType === selectedActivityType);
    }

    return filtered.slice(0, 20);
  }, [filteredEmails, filteredActivities, filteredCalendarEvents, reps, feedFilter, selectedActivityType]);

  // ─── Pipeline Impact ───────────────────────────────────────────────────

  const pipelineImpact = useMemo(() => {
    const stageMap: Record<string, { count: number; value: number }> = {};
    deals.forEach((d) => {
      if (!stageMap[d.stage]) stageMap[d.stage] = { count: 0, value: 0 };
      stageMap[d.stage].count += 1;
      stageMap[d.stage].value += d.value || 0;
    });

    return Object.entries(stageMap).map(([stage, data]) => ({
      stage: stage.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      deals: data.count,
      value: data.value,
    }));
  }, [deals]);

  // ─── Export ────────────────────────────────────────────────────────────

  const handleExport = () => {
    if (leaderboard.length === 0) {
      toast.error('No data to export');
      return;
    }
    const headers = ['Rank', 'Rep Name', 'Emails Sent', 'Emails Received', 'Calls', 'Meetings', 'Tasks', 'Score'];
    const rows = leaderboard.map((r, i) => [
      i + 1, r.repName, r.emailsSent, r.emailsReceived, r.calls, r.meetings, r.tasksCompleted, r.activityScore,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-activity-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  // ─── Render helpers ────────────────────────────────────────────────────

  const selectedRepName = selectedRepId === 'all'
    ? 'All Reps'
    : reps.find((r) => r.id === selectedRepId)?.full_name ?? 'Unknown';

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3" />
      : <ChevronDown className="w-3 h-3" />;
  };

  // ═══════════════════════════════════════════════════════════════════════
  // JSX
  // ═══════════════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-th-accent-600 mx-auto" />
          <p className="mt-4 text-sm text-th-text-tertiary">Loading sales activity data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Sales Activity Dashboard</h1>
          <p className="text-sm text-th-text-tertiary mt-1">
            Track team email, meeting, and calling activity
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date preset dropdown */}
          <div className="relative">
            <button
              onClick={() => { setShowPresetDropdown(!showPresetDropdown); setShowRepDropdown(false); }}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-surface-primary border border-th-border rounded-lg hover:bg-surface-secondary transition-colors text-th-text-primary"
            >
              <Calendar className="w-4 h-4 text-th-text-tertiary" />
              {PRESET_LABELS[datePreset]}
              <ChevronDown className="w-3.5 h-3.5 text-th-text-tertiary" />
            </button>
            {showPresetDropdown && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-surface-primary border border-th-border rounded-lg shadow-lg z-20 py-1">
                {(Object.keys(PRESET_LABELS) as DatePreset[]).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => { setDatePreset(preset); setShowPresetDropdown(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-secondary transition-colors ${
                      datePreset === preset ? 'text-th-accent-600 font-medium' : 'text-th-text-secondary'
                    }`}
                  >
                    {PRESET_LABELS[preset]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom date inputs */}
          {datePreset === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                aria-label="Start date"
                placeholder="Start date"
                className="px-2 py-1.5 text-sm bg-surface-primary border border-th-border rounded-lg text-th-text-primary"
              />
              <span className="text-th-text-tertiary text-sm">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                aria-label="End date"
                placeholder="End date"
                className="px-2 py-1.5 text-sm bg-surface-primary border border-th-border rounded-lg text-th-text-primary"
              />
            </div>
          )}

          {/* Rep filter dropdown */}
          <div className="relative">
            <button
              onClick={() => { setShowRepDropdown(!showRepDropdown); setShowPresetDropdown(false); }}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-surface-primary border border-th-border rounded-lg hover:bg-surface-secondary transition-colors text-th-text-primary"
            >
              <Users className="w-4 h-4 text-th-text-tertiary" />
              {selectedRepName}
              <ChevronDown className="w-3.5 h-3.5 text-th-text-tertiary" />
            </button>
            {showRepDropdown && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-surface-primary border border-th-border rounded-lg shadow-lg z-20 py-1 max-h-64 overflow-y-auto">
                <button
                  onClick={() => { setSelectedRepId('all'); setShowRepDropdown(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-secondary transition-colors ${
                    selectedRepId === 'all' ? 'text-th-accent-600 font-medium' : 'text-th-text-secondary'
                  }`}
                >
                  All Reps
                </button>
                {reps.map((rep) => (
                  <button
                    key={rep.id}
                    onClick={() => { setSelectedRepId(rep.id); setShowRepDropdown(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-secondary transition-colors ${
                      selectedRepId === rep.id ? 'text-th-accent-600 font-medium' : 'text-th-text-secondary'
                    }`}
                  >
                    {rep.full_name}
                    <span className="text-th-text-tertiary text-xs ml-1">({rep.email})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-th-text-tertiary hover:text-th-text-primary hover:bg-surface-secondary rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Export */}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-th-accent-600 text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Close dropdowns on outside click */}
      {(showPresetDropdown || showRepDropdown) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => { setShowPresetDropdown(false); setShowRepDropdown(false); }}
        />
      )}

      {/* ─── KPI Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          icon={<Mail className="w-5 h-5" />}
          iconColor="text-blue-500"
          iconBg="bg-blue-50"
          label="Emails Sent"
          value={kpis.emailsSent.toLocaleString()}
        />
        <KPICard
          icon={<MailOpen className="w-5 h-5" />}
          iconColor="text-blue-500"
          iconBg="bg-blue-50"
          label="Emails Received"
          value={kpis.emailsReceived.toLocaleString()}
        />
        <KPICard
          icon={<Clock className="w-5 h-5" />}
          iconColor="text-amber-500"
          iconBg="bg-amber-50"
          label="Avg Response Time"
          value={kpis.avgResponseMinutes > 0 ? formatDuration(kpis.avgResponseMinutes) : '—'}
        />
        <KPICard
          icon={<Calendar className="w-5 h-5" />}
          iconColor="text-blue-500"
          iconBg="bg-blue-50"
          label="Meetings Held"
          value={kpis.meetingsHeld.toLocaleString()}
        />
        <KPICard
          icon={<Phone className="w-5 h-5" />}
          iconColor="text-green-500"
          iconBg="bg-green-50"
          label="Calls Made"
          value={kpis.callsMade.toLocaleString()}
        />
        <KPICard
          icon={<DollarSign className="w-5 h-5" />}
          iconColor="text-green-500"
          iconBg="bg-green-50"
          label="Pipeline Influenced"
          value={formatCurrency(kpis.pipelineValue)}
        />
      </div>

      {/* ─── Email Activity Chart + Activity Breakdown ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email Activity Chart - 2 cols */}
        <div className="lg:col-span-2 bg-surface-primary rounded-xl border border-th-border p-6">
          <h2 className="text-lg font-semibold text-th-text-primary mb-1">Email Activity</h2>
          <p className="text-xs text-th-text-tertiary mb-4">
            Emails sent per day{selectedRepId === 'all' ? ', stacked by rep' : ''} with open rate trend
          </p>
          {emailChartData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={emailChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} domain={[0, 100]} unit="%" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  {selectedRepId === 'all' ? (
                    emailChartRepNames.map((name, idx) => (
                      <Bar
                        key={name}
                        yAxisId="left"
                        dataKey={name}
                        stackId="emails"
                        fill={CHART_COLORS[idx % CHART_COLORS.length]}
                        radius={idx === emailChartRepNames.length - 1 ? [2, 2, 0, 0] : [0, 0, 0, 0]}
                      />
                    ))
                  ) : (
                    <Bar
                      yAxisId="left"
                      dataKey={emailChartRepNames[0] || 'Unknown'}
                      fill="#3B82F6"
                      radius={[4, 4, 0, 0]}
                    />
                  )}
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="openRate"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    dot={{ fill: '#F59E0B', r: 3 }}
                    name="Open Rate %"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-th-text-tertiary text-sm">
              No email activity in this period
            </div>
          )}
        </div>

        {/* Activity Breakdown Pie - 1 col */}
        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <h2 className="text-lg font-semibold text-th-text-primary mb-1">Activity Breakdown</h2>
          <p className="text-xs text-th-text-tertiary mb-4">Click a segment to filter feed</p>
          {activityBreakdown.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activityBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    onClick={(_, idx) => {
                      const clicked = activityBreakdown[idx]?.key;
                      setSelectedActivityType((prev) => (prev === clicked ? null : clicked));
                    }}
                    style={{ cursor: 'pointer' }}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {activityBreakdown.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        opacity={selectedActivityType && selectedActivityType !== entry.key ? 0.3 : 1}
                        stroke={selectedActivityType === entry.key ? '#1E293B' : 'none'}
                        strokeWidth={selectedActivityType === entry.key ? 2 : 0}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-th-text-tertiary text-sm">
              No activity data available
            </div>
          )}
          {selectedActivityType && (
            <button
              onClick={() => setSelectedActivityType(null)}
              className="mt-2 text-xs text-th-accent-600 hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>
      </div>

      {/* ─── Team Leaderboard ──────────────────────────────────────────── */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-th-text-primary">Team Leaderboard</h2>
        </div>
        {leaderboard.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-th-border text-left">
                  <th className="py-2.5 pr-3 font-medium text-th-text-tertiary w-12">#</th>
                  <SortableHeader field="repName" label="Rep Name" onSort={handleSort} currentField={sortField} currentDir={sortDir} />
                  <SortableHeader field="emailsSent" label="Emails Sent" onSort={handleSort} currentField={sortField} currentDir={sortDir} align="right" />
                  <SortableHeader field="emailsReceived" label="Received" onSort={handleSort} currentField={sortField} currentDir={sortDir} align="right" />
                  <SortableHeader field="calls" label="Calls" onSort={handleSort} currentField={sortField} currentDir={sortDir} align="right" />
                  <SortableHeader field="meetings" label="Meetings" onSort={handleSort} currentField={sortField} currentDir={sortDir} align="right" />
                  <SortableHeader field="tasksCompleted" label="Tasks" onSort={handleSort} currentField={sortField} currentDir={sortDir} align="right" />
                  <SortableHeader field="activityScore" label="Score" onSort={handleSort} currentField={sortField} currentDir={sortDir} align="right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border-subtle">
                {leaderboard.map((row, idx) => {
                  const isTop = idx === 0 && row.activityScore > 0;
                  return (
                    <tr
                      key={row.repId}
                      className={`${isTop ? 'bg-amber-50/60' : ''} hover:bg-surface-secondary transition-colors`}
                    >
                      <td className="py-3 pr-3 font-medium text-th-text-tertiary">
                        {isTop ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                            1
                          </span>
                        ) : (
                          idx + 1
                        )}
                      </td>
                      <td className="py-3 pr-3 font-medium text-th-text-primary">
                        {row.repName}
                        {isTop && <span className="ml-2 text-xs text-amber-600 font-normal">Top Performer</span>}
                      </td>
                      <td className="py-3 pr-3 text-right text-th-text-secondary">{row.emailsSent}</td>
                      <td className="py-3 pr-3 text-right text-th-text-secondary">{row.emailsReceived}</td>
                      <td className="py-3 pr-3 text-right text-th-text-secondary">{row.calls}</td>
                      <td className="py-3 pr-3 text-right text-th-text-secondary">{row.meetings}</td>
                      <td className="py-3 pr-3 text-right text-th-text-secondary">{row.tasksCompleted}</td>
                      <td className="py-3 text-right font-semibold text-th-accent-600">{row.activityScore}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-th-text-tertiary text-center py-8">No team data available.</p>
        )}
      </div>

      {/* ─── Response Time Analysis ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Per-rep response times */}
        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <h2 className="text-lg font-semibold text-th-text-primary mb-1">Response Time by Rep</h2>
          <p className="text-xs text-th-text-tertiary mb-4">
            Average time to first response &mdash;{' '}
            <span className="text-green-600">&lt; 1hr</span>{' · '}
            <span className="text-amber-500">1–4hr</span>{' · '}
            <span className="text-red-500">&gt; 4hr</span>
          </p>
          {responseTimeData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={responseTimeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    tickFormatter={(v) => formatDuration(v)}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="repName"
                    type="category"
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    width={100}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value: number) => [formatDuration(value), 'Avg Response']}
                  />
                  <Bar dataKey="avgMinutes" radius={[0, 4, 4, 0]}>
                    {responseTimeData.map((entry, idx) => (
                      <Cell key={`rt-${idx}`} fill={getResponseColor(entry.avgMinutes)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-th-text-tertiary text-sm">
              No response time data available
            </div>
          )}
        </div>

        {/* Response by time of day */}
        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <h2 className="text-lg font-semibold text-th-text-primary mb-1">Response Time by Hour</h2>
          <p className="text-xs text-th-text-tertiary mb-4">When are responses fastest?</p>
          {responseByHour.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={responseByHour}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    tickLine={false}
                    tickFormatter={(v) => formatDuration(v)}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value: number) => [formatDuration(value), 'Avg Response']}
                    labelFormatter={(label) => `Hour: ${label}`}
                  />
                  <Bar dataKey="avgMinutes" radius={[4, 4, 0, 0]}>
                    {responseByHour.map((entry, idx) => (
                      <Cell key={`h-${idx}`} fill={getResponseColor(entry.avgMinutes)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-th-text-tertiary text-sm">
              No hourly response data available
            </div>
          )}
        </div>
      </div>

      {/* ─── Recent Activity Feed + Pipeline Impact ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Feed */}
        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-th-text-tertiary" />
              <h2 className="text-lg font-semibold text-th-text-primary">Recent Activity</h2>
            </div>
            <div className="flex items-center gap-1">
              {['all', 'email', 'call', 'meeting', 'note', 'task'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFeedFilter(type)}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    feedFilter === type
                      ? 'bg-th-accent-600 text-white'
                      : 'text-th-text-tertiary hover:bg-surface-secondary'
                  }`}
                >
                  {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {activityFeed.length > 0 ? (
            <div className="space-y-0 max-h-[420px] overflow-y-auto pr-1">
              {activityFeed.map((item, idx) => {
                const Icon = ACTIVITY_ICONS[item.activityType] || MessageSquare;
                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 py-3 ${idx > 0 ? 'border-t border-th-border-subtle' : ''}`}
                  >
                    <div
                      className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${ACTIVITY_COLORS[item.activityType] || '#6B7280'}15` }}
                    >
                      <Icon
                        className="w-4 h-4"
                        style={{ color: ACTIVITY_COLORS[item.activityType] || '#6B7280' }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-th-text-primary">
                        <span className="font-medium">{item.repName}</span>{' '}
                        <span className="text-th-text-secondary">{item.description}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-th-text-tertiary">
                          {format(new Date(item.time), 'MMM dd, h:mm a')}
                        </span>
                        {item.leadName !== 'N/A' && (
                          <>
                            <span className="text-xs text-th-text-tertiary">·</span>
                            <span className="text-xs text-th-accent-600">{item.leadName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-th-text-tertiary text-sm">
              No recent activity
            </div>
          )}
        </div>

        {/* Pipeline Impact */}
        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-th-text-tertiary" />
            <h2 className="text-lg font-semibold text-th-text-primary">Pipeline Impact</h2>
          </div>
          <p className="text-xs text-th-text-tertiary mb-4">
            Deal stage movements correlated with activity in this period
          </p>
          {pipelineImpact.length > 0 ? (
            <>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipelineImpact}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="stage" tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11, fill: '#6B7280' }}
                      tickLine={false}
                      tickFormatter={(v) => formatCurrency(v)}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value: number, name: string) => [
                        name === 'value' ? formatCurrency(value) : value,
                        name === 'value' ? 'Value' : 'Deals',
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar yAxisId="left" dataKey="deals" fill="#3B82F6" name="Deals" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="value" fill="#10B981" name="Value" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-surface-secondary rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-th-text-primary">
                    {pipelineImpact.reduce((s, d) => s + d.deals, 0)}
                  </p>
                  <p className="text-xs text-th-text-tertiary mt-0.5">Deals Progressed</p>
                </div>
                <div className="bg-surface-secondary rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(pipelineImpact.reduce((s, d) => s + d.value, 0))}
                  </p>
                  <p className="text-xs text-th-text-tertiary mt-0.5">Total Value</p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-th-text-tertiary text-sm">
              No pipeline activity in this period
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Sub-components
// ═════════════════════════════════════════════════════════════════════════════

function KPICard({
  icon,
  iconColor,
  iconBg,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-surface-primary rounded-xl border border-th-border p-4 flex flex-col">
      <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center ${iconColor} mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-th-text-primary">{value}</p>
      <p className="text-xs text-th-text-tertiary mt-1">{label}</p>
    </div>
  );
}

function SortableHeader({
  field,
  label,
  onSort,
  currentField,
  currentDir,
  align = 'left',
}: {
  field: SortField;
  label: string;
  onSort: (field: SortField) => void;
  currentField: SortField;
  currentDir: SortDir;
  align?: 'left' | 'right';
}) {
  const isActive = currentField === field;
  return (
    <th
      className={`py-2.5 pr-3 font-medium text-th-text-tertiary cursor-pointer hover:text-th-text-primary transition-colors select-none ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          currentDir === 'asc' ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-40" />
        )}
      </span>
    </th>
  );
}
