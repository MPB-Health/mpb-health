import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Phone,
  Mail,
  Calendar,
  FileText,
  MessageSquare,
  Clock,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useOrg } from '../contexts/OrgContext';
import { useAuth } from '../contexts/AuthContext';
import { useCRM } from '../contexts/CRMContext';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ActionItem {
  id: string;
  type: 'call' | 'email' | 'follow_up' | 'meeting' | 'review' | 'close';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  leadId: string;
  leadName: string;
  leadScore: number;
  pipelineStage: string;
  daysInStage: number;
  daysSinceContact: number;
  premiumAmount: number;
  reason: string;
  estimatedImpact: 'high' | 'medium' | 'low';
  dueBy?: string;
  urgencyScore: number;
}

interface NextBestActionQueueProps {
  maxItems?: number;
  compact?: boolean;
  onActionComplete?: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AUTO_REFRESH_MS = 120_000;
const CLOSED_STAGES = ['won', 'lost', 'closed'];
const PRIORITY_ORDER: Record<ActionItem['priority'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysBetween(from: string | null | undefined, to: Date): number {
  if (!from) return 999;
  return Math.floor((to.getTime() - new Date(from).getTime()) / 86_400_000);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / 86_400_000);

  if (diffDays < -1) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === -1) return 'yesterday';
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  if (diffDays <= 7) return `in ${diffDays}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function inferTaskType(title: string): ActionItem['type'] {
  const t = title.toLowerCase();
  if (t.includes('call') || t.includes('phone') || t.includes('dial')) return 'call';
  if (t.includes('email') || t.includes('send') || t.includes('mail')) return 'email';
  if (t.includes('meet') || t.includes('schedul') || t.includes('appointment')) return 'meeting';
  if (t.includes('review') || t.includes('check') || t.includes('audit')) return 'review';
  if (t.includes('close') || t.includes('finalize') || t.includes('sign')) return 'close';
  return 'follow_up';
}

function taskPriorityToActionPriority(
  taskPriority: string | undefined,
  isOverdue: boolean,
): ActionItem['priority'] {
  if (isOverdue) return 'critical';
  switch (taskPriority) {
    case 'urgent': return 'critical';
    case 'high': return 'high';
    case 'medium': return 'medium';
    default: return 'low';
  }
}

function getActionTypeIcon(type: ActionItem['type']) {
  switch (type) {
    case 'call': return Phone;
    case 'email': return Mail;
    case 'meeting': return Calendar;
    case 'review': return FileText;
    case 'close': return Target;
    case 'follow_up':
    default: return MessageSquare;
  }
}

function getActionTypeLabel(type: ActionItem['type']): string {
  switch (type) {
    case 'call': return 'Call Now';
    case 'email': return 'Send Email';
    case 'meeting': return 'Schedule Meeting';
    case 'review': return 'Review Deal';
    case 'close': return 'Close It';
    case 'follow_up':
    default: return 'Follow Up';
  }
}

function getActionIconColor(type: ActionItem['type']): { bg: string; text: string } {
  switch (type) {
    case 'call': return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' };
    case 'email': return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' };
    case 'meeting': return { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' };
    case 'review': return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' };
    case 'close': return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' };
    case 'follow_up':
    default: return { bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-600 dark:text-sky-400' };
  }
}

function getPriorityBar(priority: ActionItem['priority']): string {
  switch (priority) {
    case 'critical': return 'bg-red-500';
    case 'high': return 'bg-amber-500';
    case 'medium': return 'bg-blue-500';
    case 'low':
    default: return 'bg-gray-400 dark:bg-gray-600';
  }
}

function getPriorityLabel(priority: ActionItem['priority']): { text: string; cls: string } | null {
  switch (priority) {
    case 'critical': return { text: 'Critical', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
    case 'high': return { text: 'High', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
    default: return null;
  }
}

function getImpactBadge(impact: ActionItem['estimatedImpact']): { text: string; cls: string } {
  switch (impact) {
    case 'high': return { text: 'High Impact', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
    case 'medium': return { text: 'Med Impact', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
    case 'low':
    default: return { text: 'Low Impact', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' };
  }
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

interface LeadRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  lead_score: number;
  pipeline_stage: string;
  assigned_to?: string | null;
  stage_changed_at?: string | null;
  last_contacted_at?: string | null;
  premium_amount?: number | null;
}

interface TaskRow {
  id: string;
  lead_id: string;
  title: string;
  description?: string;
  due_date: string;
  priority?: string;
  completed: boolean;
  lead_submissions?: LeadRow | null;
}

async function fetchTaskActions(
  orgId: string,
  userId: string,
): Promise<ActionItem[]> {
  const { data, error } = await supabase
    .from('lead_tasks')
    .select(`
      id, lead_id, title, description, due_date, priority, completed,
      lead_submissions!lead_tasks_lead_id_fkey (
        id, first_name, last_name, email, phone,
        lead_score, pipeline_stage, stage_changed_at,
        last_contacted_at, premium_amount
      )
    `)
    .eq('org_id', orgId)
    .eq('assigned_to', userId)
    .eq('completed', false)
    .order('due_date', { ascending: true })
    .limit(50);

  if (error || !data) return [];

  const now = new Date();
  return (data as unknown as TaskRow[])
    .filter((t) => t.lead_submissions)
    .map((task) => {
      const lead = task.lead_submissions!;
      const isOverdue = new Date(task.due_date) < now;
      const daysStage = daysBetween(lead.stage_changed_at, now);
      const daysContact = daysBetween(lead.last_contacted_at, now);
      const type = inferTaskType(task.title);
      const priority = taskPriorityToActionPriority(task.priority, isOverdue);

      let urgency = 0;
      if (isOverdue) urgency += 35;
      if (lead.lead_score >= 80) urgency += 20;
      if (lead.premium_amount) urgency += Math.min(Math.floor((lead.premium_amount / 1000) * 10), 50);

      return {
        id: `task-${task.id}`,
        type,
        priority,
        title: task.title,
        description: task.description || (isOverdue ? `Overdue by ${daysBetween(task.due_date, now)}d` : `Due ${formatRelativeDate(task.due_date)}`),
        leadId: lead.id,
        leadName: `${lead.first_name} ${lead.last_name}`.trim(),
        leadScore: lead.lead_score ?? 0,
        pipelineStage: lead.pipeline_stage,
        daysInStage: daysStage,
        daysSinceContact: daysContact,
        premiumAmount: lead.premium_amount ?? 0,
        reason: isOverdue
          ? `Task overdue — ${lead.first_name} is waiting on this action`
          : `Scheduled task due ${formatRelativeDate(task.due_date)}`,
        estimatedImpact: priority === 'critical' || priority === 'high' ? 'high' : 'medium',
        dueBy: task.due_date,
        urgencyScore: urgency,
      } satisfies ActionItem;
    });
}

async function fetchLeadActions(
  orgId: string,
  userId: string,
): Promise<ActionItem[]> {
  const { data, error } = await supabase
    .from('lead_submissions')
    .select('id, first_name, last_name, email, phone, lead_score, pipeline_stage, assigned_to, stage_changed_at, last_contacted_at, premium_amount')
    .eq('org_id', orgId)
    .not('pipeline_stage', 'in', `(${CLOSED_STAGES.join(',')})`)
    .or(`assigned_to.eq.${userId},assigned_to.is.null`)
    .order('lead_score', { ascending: false })
    .limit(100);

  if (error || !data) return [];

  const now = new Date();

  return (data as LeadRow[]).map((lead) => {
    const daysStage = daysBetween(lead.stage_changed_at, now);
    const daysContact = daysBetween(lead.last_contacted_at, now);
    const premium = lead.premium_amount ?? 0;

    // ---- Urgency scoring ----
    let urgency = 0;
    if (lead.lead_score >= 80) urgency += 30;
    else if (lead.lead_score >= 60) urgency += 20;

    if (daysStage > 10) urgency += 40;
    else if (daysStage > 5) urgency += 25;

    if (daysContact > 7) urgency += 30;
    else if (daysContact > 3) urgency += 15;

    urgency += Math.min(Math.floor((premium / 1000) * 10), 50);

    if (lead.pipeline_stage === 'proposal' || lead.pipeline_stage === 'negotiation') urgency += 20;

    // ---- Determine action type ----
    let type: ActionItem['type'] = 'follow_up';
    if (daysContact > 7 && lead.phone) type = 'call';
    else if (daysContact > 3 && lead.email) type = 'email';
    else if (lead.pipeline_stage === 'proposal') type = 'close';
    else if (lead.lead_score >= 80 && lead.pipeline_stage === 'qualified') type = 'meeting';

    // ---- Priority ----
    let priority: ActionItem['priority'] = 'low';
    if (urgency >= 80) priority = 'critical';
    else if (urgency >= 55) priority = 'high';
    else if (urgency >= 30) priority = 'medium';

    // ---- Estimated impact ----
    let estimatedImpact: ActionItem['estimatedImpact'] = 'low';
    if (lead.lead_score >= 70 || premium >= 3000) estimatedImpact = 'high';
    else if (lead.lead_score >= 50 || premium >= 1000) estimatedImpact = 'medium';

    // ---- Generate reason ----
    const reasons: string[] = [];
    if (lead.lead_score >= 80) reasons.push('hot lead (score ' + lead.lead_score + ')');
    if (daysStage > 10) reasons.push(`stale in stage for ${daysStage}d`);
    else if (daysStage > 5) reasons.push(`${daysStage}d in current stage`);
    if (daysContact > 7) reasons.push(`no contact in ${daysContact}d`);
    else if (daysContact > 3) reasons.push(`last touched ${daysContact}d ago`);
    if (premium >= 2000) reasons.push(formatCurrency(premium) + ' premium');
    if (lead.pipeline_stage === 'proposal' || lead.pipeline_stage === 'negotiation') {
      reasons.push('near finish line');
    }
    const reason = reasons.length > 0
      ? reasons.slice(0, 3).join(' · ')
      : 'Routine follow-up recommended';

    // ---- Title ----
    const name = `${lead.first_name} ${lead.last_name}`.trim();
    let title: string;
    switch (type) {
      case 'call': title = `Call ${lead.first_name} — re-engage`; break;
      case 'email': title = `Email ${lead.first_name} — check in`; break;
      case 'meeting': title = `Schedule meeting with ${lead.first_name}`; break;
      case 'close': title = `Push ${lead.first_name}'s deal to close`; break;
      case 'review': title = `Review ${lead.first_name}'s deal`; break;
      default: title = `Follow up with ${lead.first_name}`;
    }

    // ---- Description ----
    const stagePretty = lead.pipeline_stage.charAt(0).toUpperCase() + lead.pipeline_stage.slice(1);
    const description = `${stagePretty} stage · Score ${lead.lead_score}` +
      (premium > 0 ? ` · ${formatCurrency(premium)}` : '');

    return {
      id: `lead-${lead.id}`,
      type,
      priority,
      title,
      description,
      leadId: lead.id,
      leadName: name,
      leadScore: lead.lead_score ?? 0,
      pipelineStage: lead.pipeline_stage,
      daysInStage: daysStage,
      daysSinceContact: daysContact,
      premiumAmount: premium,
      reason,
      estimatedImpact,
      urgencyScore: urgency,
    } satisfies ActionItem;
  });
}

function mergeAndRank(
  taskActions: ActionItem[],
  leadActions: ActionItem[],
  limit: number,
): ActionItem[] {
  const seen = new Map<string, ActionItem>();

  for (const item of [...taskActions, ...leadActions]) {
    const existing = seen.get(item.leadId);
    if (!existing || PRIORITY_ORDER[item.priority] < PRIORITY_ORDER[existing.priority]) {
      seen.set(item.leadId, item);
    }
  }

  return Array.from(seen.values())
    .sort((a, b) => {
      const pDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (pDiff !== 0) return pDiff;
      return b.urgencyScore - a.urgencyScore;
    })
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function SkeletonCard({ compact }: { compact?: boolean }) {
  return (
    <div className={cn('flex items-start gap-3 animate-pulse', compact ? 'py-2' : 'p-4')}>
      <div className="w-1 self-stretch rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
      <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        {!compact && <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />}
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/5" />
      </div>
      <div className="w-20 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// NextBestActionQueue
// ---------------------------------------------------------------------------

export function NextBestActionQueue({
  maxItems = 10,
  compact = false,
  onActionComplete,
}: NextBestActionQueueProps) {
  const navigate = useNavigate();
  const { activeOrgId } = useOrg();
  const { user } = useAuth();
  const { pipelineStages } = useCRM();

  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadActions = useCallback(async (silent = false) => {
    if (!activeOrgId || !user?.id) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const [taskItems, leadItems] = await Promise.all([
        fetchTaskActions(activeOrgId, user.id),
        fetchLeadActions(activeOrgId, user.id),
      ]);
      setActions(mergeAndRank(taskItems, leadItems, 15));
    } catch (err) {
      console.error('[NextBestActions] Failed to load:', err);
      if (!silent) toast.error('Failed to load action queue');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeOrgId, user?.id]);

  useEffect(() => {
    loadActions();
  }, [loadActions]);

  useEffect(() => {
    intervalRef.current = setInterval(() => loadActions(true), AUTO_REFRESH_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadActions]);

  const handleRefresh = () => {
    loadActions(true);
  };

  const handleCTA = (item: ActionItem) => {
    navigate(`/leads/${item.leadId}`);
    onActionComplete?.();
  };

  const stageDisplayName = useCallback(
    (stageName: string) => {
      const stage = pipelineStages.find((s) => s.name === stageName);
      return stage?.display_name ?? stageName.charAt(0).toUpperCase() + stageName.slice(1);
    },
    [pipelineStages],
  );

  const displayed = actions.slice(0, maxItems);

  // ---- Loading ----
  if (loading) {
    return (
      <div className={cn(compact ? '' : 'bg-white dark:bg-gray-900 rounded-xl border border-th-border shadow-sm')}>
        {!compact && (
          <div className="px-5 py-4 border-b border-th-border">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          </div>
        )}
        <div className={cn(compact ? 'space-y-1' : 'divide-y divide-th-border')}>
          {Array.from({ length: Math.min(maxItems, 5) }).map((_, i) => (
            <SkeletonCard key={i} compact={compact} />
          ))}
        </div>
      </div>
    );
  }

  // ---- Empty ----
  if (displayed.length === 0) {
    return (
      <div className={cn(compact ? '' : 'bg-white dark:bg-gray-900 rounded-xl border border-th-border shadow-sm')}>
        {!compact && <Header count={0} refreshing={refreshing} onRefresh={handleRefresh} />}
        <div className="text-center py-10 px-4">
          <Sparkles className="h-10 w-10 mx-auto mb-3 text-amber-400" />
          <p className="font-semibold text-th-text-primary">All caught up!</p>
          <p className="text-sm text-th-text-secondary mt-1">
            No urgent actions right now.
          </p>
        </div>
      </div>
    );
  }

  // ---- Full mode ----
  if (!compact) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-th-border shadow-sm">
        <Header count={displayed.length} refreshing={refreshing} onRefresh={handleRefresh} />
        <div className="divide-y divide-th-border">
          {displayed.map((item) => (
            <FullActionCard
              key={item.id}
              item={item}
              stageName={stageDisplayName(item.pipelineStage)}
              onCTA={() => handleCTA(item)}
            />
          ))}
        </div>
      </div>
    );
  }

  // ---- Compact mode ----
  return (
    <div className="space-y-1">
      {displayed.map((item) => (
        <CompactActionCard
          key={item.id}
          item={item}
          onCTA={() => handleCTA(item)}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function Header({
  count,
  refreshing,
  onRefresh,
}: {
  count: number;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-th-border">
      <div className="flex items-center gap-2">
        <Target className="h-5 w-5 text-amber-500" />
        <h2 className="text-base font-semibold text-th-text-primary">
          Next Best Actions
        </h2>
        {count > 0 && (
          <span className="ml-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            {count}
          </span>
        )}
      </div>
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className={cn(
          'p-1.5 rounded-lg text-th-text-secondary hover:bg-surface-tertiary transition-colors',
          refreshing && 'animate-spin',
        )}
        aria-label="Refresh actions"
      >
        <Zap className="h-4 w-4" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Full Action Card
// ---------------------------------------------------------------------------

function FullActionCard({
  item,
  stageName,
  onCTA,
}: {
  item: ActionItem;
  stageName: string;
  onCTA: () => void;
}) {
  const Icon = getActionTypeIcon(item.type);
  const iconColor = getActionIconColor(item.type);
  const priorityBar = getPriorityBar(item.priority);
  const priorityLabel = getPriorityLabel(item.priority);
  const impact = getImpactBadge(item.estimatedImpact);

  return (
    <div className="flex items-stretch gap-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      {/* Priority bar */}
      <div className={cn('w-1 flex-shrink-0 rounded-l', priorityBar)} />

      <div className="flex items-start gap-3 flex-1 p-4">
        {/* Type icon */}
        <div className={cn('p-2 rounded-full flex-shrink-0', iconColor.bg)}>
          <Icon className={cn('h-4 w-4', iconColor.text)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-th-text-primary truncate">
              {item.title}
            </p>
            {priorityLabel && (
              <span className={cn('px-1.5 py-0.5 text-[10px] font-semibold rounded', priorityLabel.cls)}>
                {priorityLabel.text}
              </span>
            )}
          </div>

          <p className="text-xs text-th-text-secondary mt-0.5">
            {item.description}
          </p>

          {/* Lead link + badges */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Link
              to={`/leads/${item.leadId}`}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {item.leadName}
            </Link>
            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              {stageName}
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
              Score {item.leadScore}
            </span>
          </div>

          {/* Reason */}
          <p className="text-[11px] italic text-th-text-tertiary mt-1.5 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-400 flex-shrink-0" />
            {item.reason}
          </p>

          {/* Impact + due date */}
          <div className="flex items-center gap-2 mt-1.5">
            <span className={cn('px-1.5 py-0.5 text-[10px] font-medium rounded', impact.cls)}>
              {impact.text}
            </span>
            {item.dueBy && (
              <span className="flex items-center gap-1 text-[10px] text-th-text-secondary">
                <Clock className="h-3 w-3" />
                {formatRelativeDate(item.dueBy)}
              </span>
            )}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={(e) => { e.stopPropagation(); onCTA(); }}
          className={cn(
            'flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors',
            'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
          )}
        >
          {getActionTypeLabel(item.type)}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compact Action Card
// ---------------------------------------------------------------------------

function CompactActionCard({
  item,
  onCTA,
}: {
  item: ActionItem;
  onCTA: () => void;
}) {
  const Icon = getActionTypeIcon(item.type);
  const iconColor = getActionIconColor(item.type);
  const priorityBar = getPriorityBar(item.priority);

  return (
    <div
      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
      onClick={onCTA}
    >
      <div className={cn('w-0.5 self-stretch rounded-full flex-shrink-0', priorityBar)} />
      <div className={cn('p-1.5 rounded-full flex-shrink-0', iconColor.bg)}>
        <Icon className={cn('h-3.5 w-3.5', iconColor.text)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-th-text-primary truncate">
          {item.title}
        </p>
        <p className="text-[11px] text-th-text-secondary truncate">
          {item.leadName}
        </p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onCTA(); }}
        className={cn(
          'flex-shrink-0 px-2 py-1 rounded text-[10px] font-semibold transition-colors',
          'bg-blue-50 text-blue-600 hover:bg-blue-100',
          'dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40',
          'opacity-0 group-hover:opacity-100',
        )}
      >
        {getActionTypeLabel(item.type)}
      </button>
      <ChevronRight className="h-3.5 w-3.5 text-th-text-tertiary flex-shrink-0" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Widget variant — for dashboard widget registry
// ---------------------------------------------------------------------------

export function NextBestActionWidget() {
  return (
    <div>
      <NextBestActionQueue compact maxItems={5} />
      <div className="mt-3 pt-3 border-t border-th-border text-center">
        <Link
          to="/actions"
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          View All Actions
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default NextBestActionQueue;
