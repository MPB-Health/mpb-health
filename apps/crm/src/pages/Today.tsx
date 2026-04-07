import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  UserPlus,
  Calendar,
  Mail,
  Target,
  Clock,
  ChevronRight,
  ChevronDown,
  Star,
  ArrowUpRight,
  Phone,
  DollarSign,
  Zap,
  TrendingUp,
  Sun,
  Sunrise,
  Moon,
  Flame,
  ListTodo,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Trophy,
  MapPin,
} from 'lucide-react';
import { SkeletonMetric, SkeletonCard } from '@mpbhealth/ui';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import { useAuth } from '../contexts/AuthContext';
import { useCelebration } from '../components/CelebrationSystem';
import { useGamification } from '../hooks/useGamification';
import { DashboardContainer } from '../components/dashboard/DashboardContainer';
import type {
  LeadTask,
  Lead,
  CalendarEvent,
  PipelineStage,
} from '@mpbhealth/crm-core';

// ============================================================================
// Helpers
// ============================================================================

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatEventTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getGreeting(): { text: string; icon: typeof Sun } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good morning', icon: Sunrise };
  if (hour < 17) return { text: 'Good afternoon', icon: Sun };
  return { text: 'Good evening', icon: Moon };
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
}

// ============================================================================
// Streak logic
// ============================================================================

interface StreakData {
  count: number;
  lastActiveDate: string;
}

function getStreak(): StreakData {
  try {
    const raw = localStorage.getItem('crm-streak-data');
    if (!raw) return { count: 1, lastActiveDate: new Date().toISOString().split('T')[0] };
    const data: StreakData = JSON.parse(raw);
    const today = new Date().toISOString().split('T')[0];
    const lastDate = new Date(data.lastActiveDate);

    if (data.lastActiveDate === today) {
      return data;
    }
    if (isYesterday(lastDate)) {
      const updated = { count: data.count + 1, lastActiveDate: today };
      localStorage.setItem('crm-streak-data', JSON.stringify(updated));
      return updated;
    }
    const reset = { count: 1, lastActiveDate: today };
    localStorage.setItem('crm-streak-data', JSON.stringify(reset));
    return reset;
  } catch {
    const fresh = { count: 1, lastActiveDate: new Date().toISOString().split('T')[0] };
    localStorage.setItem('crm-streak-data', JSON.stringify(fresh));
    return fresh;
  }
}

function getStreakColor(count: number): string {
  if (count >= 7) return 'text-amber-500';
  if (count >= 3) return 'text-orange-500';
  return 'text-th-text-tertiary';
}

function getStreakBg(count: number): string {
  if (count >= 7) return 'bg-amber-500/10';
  if (count >= 3) return 'bg-orange-500/10';
  return 'bg-surface-tertiary';
}

// ============================================================================
// Animated count-up hook
// ============================================================================

function useCountUp(target: number, durationMs = 1200): number {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const prevTarget = useRef(target);

  useEffect(() => {
    if (target === 0) {
      setDisplay(0);
      return;
    }

    const startVal = prevTarget.current !== target ? 0 : 0;
    prevTarget.current = target;
    startRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(startVal + (target - startVal) * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, durationMs]);

  return display;
}

// ============================================================================
// Today Summary type
// ============================================================================

interface TodaySummary {
  tasks_due_today: number;
  tasks_overdue: number;
  new_leads_today: number;
  new_leads_this_week: number;
  upcoming_events: number;
  unread_emails: number;
  focus_items: number;
  open_deals_value: number;
}

// ============================================================================
// Main component
// ============================================================================

export default function Today() {
  const {
    supabase,
    taskService,
    leadService,
    calendarService,
    activityService,
    pipelineStages,
    dashboardStats,
    recentLeads: crmRecentLeads,
    tasksDueToday: crmTasksDueToday,
    overdueTasks: crmOverdueTasks,
    recentActivities,
    calendarEvents: crmCalendarEvents,
    refreshDashboard,
    refreshTasks,
  } = useCRM();
  const { activeOrgId } = useOrg();
  const { user } = useAuth();
  const { celebrate } = useCelebration();
  const navigate = useNavigate();
  const {
    userXP,
    streakInfo,
    dailyProgress,
    nextLevelProgress,
    earnXP,
    isPerfectDay,
  } = useGamification();

  const [summary, setSummary] = useState<TodaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [completingTasks, setCompletingTasks] = useState<Set<string>>(new Set());
  const [widgetsOpen, setWidgetsOpen] = useState(false);

  const streak = useMemo(
    () => ({ count: streakInfo.days, lastDate: userXP?.last_active_date ?? '' }),
    [streakInfo, userXP],
  );

  // Derived data from CRM context
  const todayTasks = useMemo(() => crmTasksDueToday.slice(0, 8), [crmTasksDueToday]);
  const overdueTasks = useMemo(() => crmOverdueTasks.slice(0, 8), [crmOverdueTasks]);
  const hotLeads = useMemo(
    () =>
      [...crmRecentLeads]
        .sort((a, b) => (b.lead_score ?? 0) - (a.lead_score ?? 0))
        .slice(0, 6),
    [crmRecentLeads]
  );
  const upcomingEvents = useMemo(() => crmCalendarEvents.slice(0, 4), [crmCalendarEvents]);

  // Action queue: merge overdue + today, sorted by priority
  const actionQueue = useMemo(() => {
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    const merged = [
      ...overdueTasks.map((t) => ({ ...t, _isOverdue: true as const })),
      ...todayTasks.map((t) => ({ ...t, _isOverdue: false as const })),
    ];
    merged.sort((a, b) => {
      if (a._isOverdue !== b._isOverdue) return a._isOverdue ? -1 : 1;
      return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
    });
    return merged.slice(0, 8);
  }, [overdueTasks, todayTasks]);

  // KPI: Count today's calls and emails from activities
  const todayKPIs = useMemo(() => {
    const today = new Date();
    const todayActivities = recentActivities.filter((a) =>
      isSameDay(new Date(a.created_at), today)
    );
    const callsToday = todayActivities.filter((a) => a.activity_type === 'call').length;
    const emailsToday = todayActivities.filter((a) => a.activity_type === 'email').length;
    const pipelineValue = summary?.open_deals_value ?? 0;
    const conversionRate = dashboardStats?.conversion_rate ?? 0;

    return { callsToday, emailsToday, pipelineValue, conversionRate };
  }, [recentActivities, summary, dashboardStats]);

  // Load summary RPC
  const loadSummary = useCallback(async () => {
    if (!activeOrgId) return;
    setLoading(true);
    try {
      const { data } = await supabase.rpc('crm_today_summary', {
        p_org_id: activeOrgId,
      });
      if (data) setSummary(data as TodaySummary);
    } catch (err) {
      console.error('Failed to load today summary:', err);
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, supabase]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // Greeting
  const greeting = useMemo(() => getGreeting(), []);
  const GreetingIcon = greeting.icon;
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  // Pipeline stage lookup
  const stageMap = useMemo(() => {
    const map = new Map<string, PipelineStage>();
    for (const s of pipelineStages) map.set(s.name, s);
    return map;
  }, [pipelineStages]);

  // Complete task handler
  const handleCompleteTask = useCallback(
    async (taskId: string) => {
      setCompletingTasks((prev) => new Set(prev).add(taskId));
      try {
        await taskService.completeTask(taskId);
        celebrate('task_complete', 'Task crushed!');
        earnXP('task_completed', 'task', taskId, 'Completed a task from War Room');
        await refreshTasks();
      } catch (err) {
        console.error('Failed to complete task:', err);
      } finally {
        setCompletingTasks((prev) => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
      }
    },
    [taskService, celebrate, refreshTasks, earnXP]
  );

  const urgentCount = (summary?.tasks_overdue ?? 0) + (summary?.unread_emails ?? 0);
  const isLoading = loading && !summary;

  // ========================================================================
  // Loading skeleton
  // ========================================================================

  if (isLoading) {
    return (
      <div className="w-full px-6 py-8 space-y-8 animate-in fade-in duration-300">
        {/* Hero skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-surface-tertiary animate-pulse" />
            <div className="space-y-2">
              <div className="h-7 w-48 bg-surface-tertiary animate-pulse rounded-lg" />
              <div className="h-4 w-64 bg-surface-tertiary animate-pulse rounded" />
            </div>
          </div>
          <div className="h-9 w-28 bg-surface-tertiary animate-pulse rounded-lg" />
        </div>

        {/* KPI skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonMetric key={i} />
          ))}
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SkeletonCard lines={5} />
            <SkeletonCard lines={4} />
          </div>
          <div className="space-y-6">
            <SkeletonCard lines={4} />
            <SkeletonCard lines={3} />
          </div>
        </div>
      </div>
    );
  }

  // ========================================================================
  // Main render
  // ========================================================================

  return (
    <div className="w-full px-6 py-8 space-y-8">
      {/* ================================================================
          SECTION 1: Hero
          ================================================================ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-th-accent-500/10 via-th-accent-400/5 to-transparent border border-th-accent-500/10 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-th-accent-500/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-th-accent-400 to-th-accent-600 flex items-center justify-center shadow-lg shadow-th-accent-500/20 flex-shrink-0">
              <GreetingIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-th-text-primary">
                {greeting.text}, {firstName}
              </h1>
              <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1">
                <span className="text-sm text-th-text-tertiary">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>

                {/* Streak */}
                <span
                  className={`inline-flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full ${getStreakBg(streak.count)} ${getStreakColor(streak.count)}`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  {streak.count}-day streak
                </span>

                {/* Rank placeholder */}
                <span className="inline-flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  <Trophy className="w-3.5 h-3.5" />
                  #2 this week
                </span>

                {/* Urgent pill */}
                {urgentCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Zap className="w-3.5 h-3.5" />
                    {urgentCount} item{urgentCount !== 1 ? 's' : ''} need attention
                  </span>
                )}
              </div>
            </div>
          </div>

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-th-accent-600 hover:text-th-accent-700 bg-th-accent-500/10 hover:bg-th-accent-500/15 px-4 py-2 rounded-xl transition-all flex-shrink-0"
          >
            Widget Dashboard <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ================================================================
          SECTION 2: Animated KPI Strip
          ================================================================ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICardAnimated
          label="Calls Today"
          value={dailyProgress.calls.current || todayKPIs.callsToday}
          target={dailyProgress.calls.target}
          icon={Phone}
          accentColor="blue"
          trend={12}
          onClick={() => navigate('/leads')}
        />
        <KPICardAnimated
          label="Emails Sent"
          value={dailyProgress.emails.current || todayKPIs.emailsToday}
          target={dailyProgress.emails.target}
          icon={Mail}
          accentColor="emerald"
          trend={8}
          onClick={() => navigate('/inbox')}
        />
        <KPICardAnimated
          label="Pipeline Value"
          value={todayKPIs.pipelineValue}
          target={0}
          icon={DollarSign}
          accentColor="violet"
          isCurrency
          onClick={() => navigate('/deals')}
        />
        <KPICardAnimated
          label="Conversion Rate"
          value={todayKPIs.conversionRate}
          target={0}
          icon={TrendingUp}
          accentColor="amber"
          isPercent
          trend={5}
          onClick={() => navigate('/pipeline')}
        />
      </div>

      {/* XP Level Progress Bar */}
      {userXP && (
        <div className="bg-surface-secondary rounded-xl border border-th-border px-4 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-th-text-primary">Lv. {userXP.level} {userXP.level_name}</p>
              <p className="text-[10px] text-th-text-tertiary">{userXP.total_xp.toLocaleString()} XP</p>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-th-text-tertiary">Next: Lv. {nextLevelProgress.nextLevel}</span>
              <span className="text-[10px] font-medium text-th-text-secondary">{nextLevelProgress.progressPercent}%</span>
            </div>
            <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, nextLevelProgress.progressPercent)}%` }}
              />
            </div>
          </div>
          {isPerfectDay && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 shrink-0">
              <Star className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">Perfect Day</span>
            </div>
          )}
        </div>
      )}

      {/* ================================================================
          SECTION 3: Main Content Grid
          ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ---- Left Column (2/3) ---- */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hot Leads */}
          <section>
            <SectionHeader
              icon={Flame}
              title="Hot Leads"
              count={hotLeads.length}
              color="text-orange-600 dark:text-orange-400"
              bgColor="bg-orange-100 dark:bg-orange-500/10"
              linkTo="/leads"
            />
            {hotLeads.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {hotLeads.map((lead) => (
                  <HotLeadCard key={lead.id} lead={lead} stageMap={stageMap} />
                ))}
              </div>
            ) : (
              <EmptyBlock
                icon={UserPlus}
                message="No hot leads"
                actionLabel="Add your first lead"
                onAction={() => navigate('/leads?action=create')}
              />
            )}
          </section>

          {/* Action Queue */}
          <section>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
                  <ListTodo className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-sm font-semibold text-th-text-primary">Action Queue</h3>
                {actionQueue.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-surface-tertiary text-xs font-medium text-th-text-secondary">
                    {actionQueue.length}
                  </span>
                )}
              </div>
              <Link
                to="/tasks"
                className="text-xs text-th-accent-600 hover:text-th-accent-700 flex items-center gap-1"
              >
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {actionQueue.length > 0 ? (
              <div className="space-y-2 mt-3">
                {actionQueue.map((task) => (
                  <ActionQueueItem
                    key={task.id}
                    task={task}
                    isOverdue={task._isOverdue}
                    completing={completingTasks.has(task.id)}
                    onComplete={() => handleCompleteTask(task.id)}
                  />
                ))}
              </div>
            ) : (
              <EmptyBlock
                icon={CheckCircle2}
                message="All caught up!"
                variant="success"
              />
            )}
          </section>
        </div>

        {/* ---- Right Column (1/3) ---- */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <section>
            <SectionHeader
              icon={Calendar}
              title="Upcoming"
              count={upcomingEvents.length}
              color="text-violet-600 dark:text-violet-400"
              bgColor="bg-violet-100 dark:bg-violet-500/10"
              linkTo="/calendar"
            />
            {upcomingEvents.length > 0 ? (
              <div className="space-y-2 mt-3">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <EmptyBlock icon={Calendar} message="No upcoming events" />
            )}
          </section>

          {/* Quick Actions */}
          <section>
            <h3 className="text-sm font-semibold text-th-text-primary mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <QuickActionButton
                icon={UserPlus}
                label="New Lead"
                color="text-emerald-600 dark:text-emerald-400"
                bg="bg-emerald-500/10"
                onClick={() => navigate('/leads?action=create')}
              />
              <QuickActionButton
                icon={Phone}
                label="Log Call"
                color="text-blue-600 dark:text-blue-400"
                bg="bg-blue-500/10"
                onClick={() => navigate('/leads?action=log-call')}
              />
              <QuickActionButton
                icon={Mail}
                label="Send Email"
                color="text-violet-600 dark:text-violet-400"
                bg="bg-violet-500/10"
                onClick={() => navigate('/inbox')}
              />
              <QuickActionButton
                icon={Target}
                label="Pipeline"
                color="text-amber-600 dark:text-amber-400"
                bg="bg-amber-500/10"
                onClick={() => navigate('/pipeline')}
              />
            </div>
          </section>

          {/* Team Pulse / This Week */}
          {summary && (
            <section className="bg-surface-primary rounded-2xl border border-th-border p-5">
              <h3 className="text-sm font-semibold text-th-text-primary mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-th-accent-500" />
                This Week
              </h3>
              <div className="space-y-3">
                <StatRow
                  label="New leads"
                  value={summary.new_leads_this_week}
                  icon={UserPlus}
                />
                <StatRow
                  label="Upcoming events"
                  value={summary.upcoming_events}
                  icon={Calendar}
                />
                <StatRow
                  label="Unread emails"
                  value={summary.unread_emails}
                  icon={Mail}
                />
                <StatRow
                  label="Focus items"
                  value={summary.focus_items}
                  icon={Target}
                />
              </div>
            </section>
          )}
        </div>
      </div>

      {/* ================================================================
          SECTION 4: Collapsible Widget Dashboard
          ================================================================ */}
      <section className="border border-th-border rounded-2xl overflow-hidden">
        <button
          onClick={() => setWidgetsOpen((prev) => !prev)}
          className="w-full flex items-center justify-between px-6 py-4 bg-surface-primary hover:bg-surface-secondary transition-colors"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-th-text-primary">
            <Star className="w-4 h-4 text-th-accent-500" />
            Widgets
          </span>
          <ChevronDown
            className={`w-4 h-4 text-th-text-tertiary transition-transform duration-200 ${
              widgetsOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
        {widgetsOpen && (
          <div className="border-t border-th-border px-6 py-6">
            <DashboardContainer />
          </div>
        )}
      </section>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

// --- Animated KPI Card ---

const KPI_ACCENT_MAP: Record<string, { border: string; iconBg: string; iconText: string; ringColor: string }> = {
  blue: {
    border: 'border-l-blue-500',
    iconBg: 'bg-blue-50 dark:bg-blue-500/10',
    iconText: 'text-blue-600',
    ringColor: '#3B82F6',
  },
  emerald: {
    border: 'border-l-emerald-500',
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    iconText: 'text-emerald-600',
    ringColor: '#10B981',
  },
  violet: {
    border: 'border-l-violet-500',
    iconBg: 'bg-violet-50 dark:bg-violet-500/10',
    iconText: 'text-violet-600',
    ringColor: '#8B5CF6',
  },
  amber: {
    border: 'border-l-amber-500',
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    iconText: 'text-amber-600',
    ringColor: '#F59E0B',
  },
};

function KPICardAnimated({
  label,
  value,
  target,
  icon: Icon,
  accentColor,
  isCurrency,
  isPercent,
  trend,
  onClick,
}: {
  label: string;
  value: number;
  target: number;
  icon: typeof Phone;
  accentColor: string;
  isCurrency?: boolean;
  isPercent?: boolean;
  trend?: number;
  onClick?: () => void;
}) {
  const colors = KPI_ACCENT_MAP[accentColor] || KPI_ACCENT_MAP.blue;
  const animatedValue = useCountUp(isCurrency ? Math.round(value / 1000) : value);
  const progress = target > 0 ? Math.min((value / target) * 100, 100) : 0;

  let displayValue: string;
  if (isCurrency) {
    displayValue = `$${animatedValue.toLocaleString()}k`;
  } else if (isPercent) {
    displayValue = `${animatedValue}%`;
  } else {
    displayValue = String(animatedValue);
  }

  return (
    <button
      onClick={onClick}
      className={`relative bg-surface-primary border border-th-border border-l-4 ${colors.border} rounded-2xl p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group overflow-hidden`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`w-9 h-9 rounded-xl ${colors.iconBg} flex items-center justify-center`}>
          <Icon className={`w-4.5 h-4.5 ${colors.iconText}`} />
        </div>
        {trend !== undefined && trend !== 0 && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-medium ${
              trend > 0 ? 'text-emerald-600' : 'text-red-500'
            }`}
          >
            {trend > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-th-text-primary tabular-nums">{displayValue}</p>
      <p className="text-xs text-th-text-tertiary mt-0.5">{label}</p>

      {/* Progress bar */}
      {target > 0 && (
        <div className="mt-3">
          <div className="h-1.5 rounded-full bg-surface-tertiary overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${progress}%`,
                backgroundColor: colors.ringColor,
              }}
            />
          </div>
          <p className="text-[10px] text-th-text-tertiary mt-1">
            {Math.round(progress)}% of daily target
          </p>
        </div>
      )}

      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

// --- Section Header ---

function SectionHeader({
  icon: Icon,
  title,
  count,
  color,
  bgColor,
  linkTo,
}: {
  icon: typeof CheckSquare;
  title: string;
  count: number;
  color: string;
  bgColor: string;
  linkTo: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-xl ${bgColor} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <h3 className="text-sm font-semibold text-th-text-primary">{title}</h3>
        {count > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-surface-tertiary text-xs font-medium text-th-text-secondary">
            {count}
          </span>
        )}
      </div>
      <Link
        to={linkTo}
        className="text-xs text-th-accent-600 hover:text-th-accent-700 flex items-center gap-1"
      >
        View all <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

// --- Hot Lead Card ---

function HotLeadCard({
  lead,
  stageMap,
}: {
  lead: Lead;
  stageMap: Map<string, PipelineStage>;
}) {
  const planLabel =
    lead.plan_type === 'healthshare'
      ? 'HS'
      : lead.plan_type === 'traditional_insurance'
        ? 'TI'
        : null;

  const stage = stageMap.get(lead.pipeline_stage);
  const isGold = lead.lead_score > 80;
  const initials =
    (lead.first_name?.charAt(0) || '?').toUpperCase() +
    (lead.last_name?.charAt(0) || '').toUpperCase();

  const scoreColor =
    lead.lead_score >= 80
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
      : lead.lead_score >= 50
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
        : 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-300';

  return (
    <Link
      to={`/leads/${lead.id}`}
      className={`flex items-center gap-3 p-3 rounded-xl border bg-surface-primary hover:bg-surface-secondary hover:shadow-sm transition-all group ${
        isGold
          ? 'border-amber-300/60 dark:border-amber-500/30 shadow-[0_0_12px_-4px_rgba(251,191,36,0.25)]'
          : 'border-th-border'
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isGold
            ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white'
            : 'bg-th-accent-100 dark:bg-th-accent-500/10'
        }`}
      >
        <span
          className={`font-semibold text-sm ${
            isGold ? 'text-white' : 'text-th-accent-700 dark:text-th-accent-300'
          }`}
        >
          {initials}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-th-text-primary truncate">
          {lead.first_name} {lead.last_name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {planLabel && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                planLabel === 'HS'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
              }`}
            >
              {planLabel}
            </span>
          )}
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${scoreColor}`}>
            {lead.lead_score}
          </span>
          {stage && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-medium text-white"
              style={{ backgroundColor: stage.color }}
            >
              {stage.display_name}
            </span>
          )}
          <span className="text-xs text-th-text-tertiary">{formatTimeAgo(lead.created_at)}</span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-th-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </Link>
  );
}

// --- Action Queue Item ---

function ActionQueueItem({
  task,
  isOverdue,
  completing,
  onComplete,
}: {
  task: LeadTask;
  isOverdue: boolean;
  completing: boolean;
  onComplete: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
        isOverdue
          ? 'border-l-4 border-l-red-500 border-r-th-border border-t-th-border border-b-th-border bg-red-50/50 dark:bg-red-500/5'
          : 'border-th-border bg-surface-primary hover:bg-surface-secondary'
      } ${completing ? 'opacity-50 scale-[0.98]' : ''}`}
    >
      <button
        onClick={onComplete}
        disabled={completing}
        className="w-5 h-5 rounded-full border-2 border-th-text-tertiary hover:border-emerald-500 hover:bg-emerald-500/10 transition-colors flex-shrink-0 disabled:cursor-not-allowed"
        aria-label={`Complete task: ${task.title}`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-th-text-primary truncate">{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {task.due_date && (
            <span
              className={`text-xs flex items-center gap-1 ${
                isOverdue ? 'text-red-600 font-medium' : 'text-th-text-tertiary'
              }`}
            >
              <Clock className="w-3 h-3" />
              {new Date(task.due_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
          {task.lead_id && (
            <Link
              to={`/leads/${task.lead_id}`}
              className="text-xs text-th-accent-600 hover:underline truncate max-w-[120px]"
              onClick={(e) => e.stopPropagation()}
            >
              View lead
            </Link>
          )}
        </div>
      </div>
      {task.priority && (
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
            task.priority === 'high'
              ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
              : task.priority === 'medium'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-300'
          }`}
        >
          {task.priority}
        </span>
      )}
    </div>
  );
}

// --- Event Card ---

function EventCard({ event }: { event: CalendarEvent }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-th-border bg-surface-primary hover:bg-surface-secondary transition-colors">
      <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center flex-shrink-0">
        <Calendar className="w-4 h-4 text-violet-600 dark:text-violet-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-th-text-primary truncate">{event.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-th-text-tertiary">
            {formatEventTime(event.start_time)}
          </span>
          {event.location && (
            <span className="text-xs text-th-text-tertiary flex items-center gap-0.5 truncate">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              {event.location}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Quick Action Button ---

function QuickActionButton({
  icon: Icon,
  label,
  color,
  bg,
  onClick,
}: {
  icon: typeof UserPlus;
  label: string;
  color: string;
  bg: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 p-3 rounded-xl border border-th-border bg-surface-primary hover:bg-surface-secondary hover:shadow-sm hover:-translate-y-0.5 transition-all text-left group"
    >
      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <span className="text-sm font-medium text-th-text-primary">{label}</span>
    </button>
  );
}

// --- Stat Row ---

function StatRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof UserPlus;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-th-text-secondary flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-th-text-tertiary" />
        {label}
      </span>
      <span className="text-sm font-semibold text-th-text-primary tabular-nums">{value}</span>
    </div>
  );
}

// --- Empty Block ---

function EmptyBlock({
  icon: Icon,
  message,
  actionLabel,
  onAction,
  variant,
}: {
  icon: typeof CheckSquare;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'success';
}) {
  return (
    <div
      className={`flex flex-col items-center gap-2 p-6 mt-3 rounded-xl border border-dashed ${
        variant === 'success'
          ? 'border-emerald-300 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5'
          : 'border-th-border'
      }`}
    >
      <Icon
        className={`w-8 h-8 ${
          variant === 'success'
            ? 'text-emerald-500'
            : 'text-th-text-tertiary opacity-40'
        }`}
      />
      <p
        className={`text-sm ${
          variant === 'success' ? 'text-emerald-700 dark:text-emerald-300 font-medium' : 'text-th-text-tertiary'
        }`}
      >
        {message}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-1 text-sm font-medium text-th-accent-600 hover:text-th-accent-700 bg-th-accent-500/10 hover:bg-th-accent-500/15 px-4 py-1.5 rounded-lg transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
