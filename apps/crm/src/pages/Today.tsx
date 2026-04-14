import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  AlertTriangle,
  UserPlus,
  Calendar,
  Mail,
  Target,
  Clock,
  ChevronRight,
  Star,
  Loader2,
  ArrowUpRight,
  Phone,
  DollarSign,
  Zap,
  TrendingUp,
  Sun,
  Sunrise,
} from 'lucide-react';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import type { LeadTask, Lead, CalendarEvent } from '@mpbhealth/crm-core';

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
  return { text: 'Good evening', icon: Star };
}

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

export default function Today() {
  const { supabase, taskService, leadService, calendarService } = useCRM();
  const { activeOrgId } = useOrg();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<TodaySummary | null>(null);
  const [todayTasks, setTodayTasks] = useState<LeadTask[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<LeadTask[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadToday = useCallback(async () => {
    if (!activeOrgId) return;
    setLoading(true);
    try {
      const [summaryResult, todayResult, overdueResult, leadsResult, eventsResult] =
        await Promise.all([
          supabase.rpc('crm_today_summary', { p_org_id: activeOrgId }),
          taskService.getTasksDueToday(),
          taskService.getOverdueTasks(),
          leadService.getLeads({}, 8, 0),
          calendarService.getUpcomingEvents(5),
        ]);

      if (summaryResult.data) setSummary(summaryResult.data as TodaySummary);
      setTodayTasks(todayResult.slice(0, 5));
      setOverdueTasks(overdueResult.slice(0, 5));
      setRecentLeads(leadsResult.leads.slice(0, 6));
      setUpcomingEvents(eventsResult.slice(0, 4));
    } catch (err) {
      console.error('Failed to load today summary:', err);
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, supabase, taskService, leadService, calendarService]);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  const greeting = useMemo(() => getGreeting(), []);
  const GreetingIcon = greeting.icon;

  const handleCompleteTask = async (taskId: string) => {
    await taskService.completeTask(taskId);
    setTodayTasks((prev) => prev.filter((t) => t.id !== taskId));
    setOverdueTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (summary) {
      setSummary({
        ...summary,
        tasks_due_today: Math.max(0, summary.tasks_due_today - 1),
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-th-accent-500 mx-auto mb-3" />
          <p className="text-sm text-th-text-tertiary">Loading your day...</p>
        </div>
      </div>
    );
  }

  const urgentCount = (summary?.tasks_overdue ?? 0) + (summary?.unread_emails ?? 0);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Hero greeting */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-th-accent-400 to-th-accent-600 flex items-center justify-center shadow-lg shadow-th-accent-500/20">
            <GreetingIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-th-text-primary">{greeting.text}</h1>
            <p className="text-sm text-th-text-tertiary mt-0.5">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
              {urgentCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
                  <Zap className="w-3 h-3" />
                  {urgentCount} item{urgentCount !== 1 ? 's' : ''} need attention
                </span>
              )}
            </p>
          </div>
        </div>
        <Link
          to="/dashboard"
          className="text-sm text-th-accent-600 hover:text-th-accent-700 flex items-center gap-1"
        >
          Full Dashboard <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* KPI strip */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard
            label="Tasks Due"
            value={summary.tasks_due_today}
            icon={CheckSquare}
            color="blue"
            onClick={() => navigate('/tasks')}
          />
          <KPICard
            label="Overdue"
            value={summary.tasks_overdue}
            icon={AlertTriangle}
            color={summary.tasks_overdue > 0 ? 'red' : 'green'}
            onClick={() => navigate('/tasks')}
          />
          <KPICard
            label="New Leads Today"
            value={summary.new_leads_today}
            icon={UserPlus}
            color="emerald"
            subtitle={`${summary.new_leads_this_week} this week`}
            onClick={() => navigate('/leads')}
          />
          <KPICard
            label="Pipeline Value"
            value={`$${(summary.open_deals_value / 1000).toFixed(0)}k`}
            icon={DollarSign}
            color="violet"
            onClick={() => navigate('/deals')}
          />
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overdue tasks — urgent */}
          {overdueTasks.length > 0 && (
            <section>
              <SectionHeader
                icon={AlertTriangle}
                title="Overdue"
                count={overdueTasks.length}
                color="text-red-600"
                bgColor="bg-red-100"
                linkTo="/tasks"
              />
              <div className="space-y-2 mt-3">
                {overdueTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isOverdue
                    onComplete={() => handleCompleteTask(task.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Today's tasks */}
          <section>
            <SectionHeader
              icon={CheckSquare}
              title="Due Today"
              count={todayTasks.length}
              color="text-blue-600"
              bgColor="bg-blue-100"
              linkTo="/tasks"
            />
            {todayTasks.length > 0 ? (
              <div className="space-y-2 mt-3">
                {todayTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={() => handleCompleteTask(task.id)}
                  />
                ))}
              </div>
            ) : (
              <EmptyBlock icon={CheckSquare} message="No tasks due today" />
            )}
          </section>

          {/* Recent leads */}
          <section>
            <SectionHeader
              icon={UserPlus}
              title="Recent Leads"
              count={recentLeads.length}
              color="text-emerald-600"
              bgColor="bg-emerald-100"
              linkTo="/leads"
            />
            {recentLeads.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {recentLeads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} />
                ))}
              </div>
            ) : (
              <EmptyBlock icon={UserPlus} message="No recent leads" />
            )}
          </section>
        </div>

        {/* Right column: Calendar + Activity */}
        <div className="space-y-6">
          {/* Upcoming events */}
          <section>
            <SectionHeader
              icon={Calendar}
              title="Upcoming"
              count={upcomingEvents.length}
              color="text-violet-600"
              bgColor="bg-violet-100"
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

          {/* Quick actions */}
          <section>
            <h3 className="text-sm font-semibold text-th-text-primary mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <QuickActionButton
                icon={UserPlus}
                label="New Lead"
                onClick={() => navigate('/leads?action=create')}
              />
              <QuickActionButton
                icon={Phone}
                label="Log Call"
                onClick={() => navigate('/leads?action=log-call')}
              />
              <QuickActionButton
                icon={Mail}
                label="Send Email"
                onClick={() => navigate('/inbox')}
              />
              <QuickActionButton
                icon={Target}
                label="Pipeline"
                onClick={() => navigate('/pipeline')}
              />
            </div>
          </section>

          {/* Stats summary */}
          {summary && (
            <section className="bg-surface-primary rounded-2xl border border-th-border p-5">
              <h3 className="text-sm font-semibold text-th-text-primary mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-th-accent-500" />
                This Week
              </h3>
              <div className="space-y-3">
                <StatRow label="New leads" value={summary.new_leads_this_week} />
                <StatRow label="Upcoming events" value={summary.upcoming_events} />
                <StatRow label="Unread emails" value={summary.unread_emails} />
                <StatRow label="Focus items" value={summary.focus_items} />
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function KPICard({
  label,
  value,
  icon: Icon,
  color,
  subtitle,
  onClick,
}: {
  label: string;
  value: number | string;
  icon: typeof CheckSquare;
  color: string;
  subtitle?: string;
  onClick?: () => void;
}) {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-200 dark:border-blue-500/20' },
    red: { bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-600', border: 'border-red-200 dark:border-red-500/20' },
    green: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-200 dark:border-emerald-500/20' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-200 dark:border-emerald-500/20' },
    violet: { bg: 'bg-violet-50 dark:bg-violet-500/10', text: 'text-violet-600', border: 'border-violet-200 dark:border-violet-500/20' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <button
      onClick={onClick}
      className={`${c.bg} border ${c.border} rounded-2xl p-4 text-left hover:shadow-md transition-all group`}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-5 h-5 ${c.text}`} />
        <ChevronRight className="w-4 h-4 text-th-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="text-2xl font-bold text-th-text-primary">{value}</p>
      <p className="text-xs text-th-text-tertiary mt-0.5">{label}</p>
      {subtitle && <p className="text-xs text-th-text-tertiary mt-0.5">{subtitle}</p>}
    </button>
  );
}

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

function TaskCard({
  task,
  isOverdue,
  onComplete,
}: {
  task: LeadTask;
  isOverdue?: boolean;
  onComplete: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
        isOverdue
          ? 'border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5'
          : 'border-th-border bg-surface-primary hover:bg-surface-secondary'
      }`}
    >
      <button
        onClick={onComplete}
        className="w-5 h-5 rounded-full border-2 border-th-text-tertiary hover:border-th-accent-500 hover:bg-th-accent-500/10 transition-colors flex-shrink-0"
        aria-label={`Complete task: ${task.title}`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-th-text-primary truncate">{task.title}</p>
        {task.due_date && (
          <p className={`text-xs mt-0.5 ${isOverdue ? 'text-red-600 font-medium' : 'text-th-text-tertiary'}`}>
            <Clock className="w-3 h-3 inline mr-1" />
            {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        )}
      </div>
      {task.priority && (
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            task.priority === 'high'
              ? 'bg-red-100 text-red-700'
              : task.priority === 'medium'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-gray-100 text-gray-600'
          }`}
        >
          {task.priority}
        </span>
      )}
    </div>
  );
}

function LeadCard({ lead }: { lead: Lead }) {
  const planLabel =
    lead.plan_type === 'healthshare' ? 'HS' : lead.plan_type === 'traditional_insurance' ? 'TI' : null;

  return (
    <Link
      to={`/leads/${lead.id}`}
      className="flex items-center gap-3 p-3 rounded-xl border border-th-border bg-surface-primary hover:bg-surface-secondary hover:shadow-sm transition-all group"
    >
      <div className="w-10 h-10 rounded-xl bg-th-accent-100 flex items-center justify-center flex-shrink-0">
        <span className="text-th-accent-700 font-semibold text-sm">
          {(lead.first_name || '?').charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-th-text-primary truncate">
          {lead.first_name} {lead.last_name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {planLabel && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                planLabel === 'HS'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {planLabel}
            </span>
          )}
          <span className="text-xs text-th-text-tertiary">{formatTimeAgo(lead.created_at)}</span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-th-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

function EventCard({ event }: { event: CalendarEvent }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-th-border bg-surface-primary">
      <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center flex-shrink-0">
        <Calendar className="w-4 h-4 text-violet-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-th-text-primary truncate">{event.title}</p>
        <p className="text-xs text-th-text-tertiary mt-0.5">
          {formatEventTime(event.start_time)}
          {event.location && <span className="ml-2">· {event.location}</span>}
        </p>
      </div>
    </div>
  );
}

function QuickActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof UserPlus;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 p-3 rounded-xl border border-th-border bg-surface-primary hover:bg-surface-secondary hover:shadow-sm transition-all text-left"
    >
      <Icon className="w-4 h-4 text-th-accent-500" />
      <span className="text-sm font-medium text-th-text-primary">{label}</span>
    </button>
  );
}

function EmptyBlock({ icon: Icon, message }: { icon: typeof CheckSquare; message: string }) {
  return (
    <div className="flex items-center gap-3 p-4 mt-3 rounded-xl border border-dashed border-th-border">
      <Icon className="w-5 h-5 text-th-text-tertiary opacity-40" />
      <p className="text-sm text-th-text-tertiary">{message}</p>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-th-text-secondary">{label}</span>
      <span className="text-sm font-semibold text-th-text-primary">{value}</span>
    </div>
  );
}
