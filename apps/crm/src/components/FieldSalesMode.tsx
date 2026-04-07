import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  Target,
  Zap,
  ChevronRight,
  ChevronLeft,
  Home,
  BarChart3,
  CheckSquare,
  User,
  Plus,
  X,
  Flame,
  Trophy,
  Smartphone,
  Clock,
  SkipForward,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useOrg } from '../contexts/OrgContext';
import { useAuth } from '../contexts/AuthContext';
import { useCRM } from '../contexts/CRMContext';
import { useGamification } from '../hooks/useGamification';
import type { Lead } from '@mpbhealth/crm-core';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FieldAction {
  id: string;
  type: 'call' | 'email' | 'follow_up' | 'meeting' | 'review' | 'close';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  leadId: string;
  leadName: string;
  leadPhone?: string;
  leadEmail?: string;
  leadScore: number;
  pipelineStage: string;
  urgencyScore: number;
  premiumAmount: number;
  daysInStage: number;
  daysSinceContact: number;
  snoozedUntil?: number;
}

type BottomTab = 'queue' | 'pipeline' | 'tasks' | 'profile';

const PRIORITY_ORDER: Record<FieldAction['priority'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const CLOSED_STAGES = ['won', 'lost', 'closed'];
const SNOOZE_DURATION_MS = 30 * 60 * 1000; // 30 min
const FIELD_MODE_KEY = 'mpb_field_sales_mode';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysBetween(from: string | null | undefined, to: Date): number {
  if (!from) return 999;
  return Math.floor((to.getTime() - new Date(from).getTime()) / 86_400_000);
}

function getActionIcon(type: FieldAction['type']) {
  switch (type) {
    case 'call': return Phone;
    case 'email': return Mail;
    case 'meeting': return Calendar;
    case 'review': return FileText;
    case 'close': return Target;
    default: return MessageSquare;
  }
}

function getActionLabel(type: FieldAction['type']): string {
  switch (type) {
    case 'call': return 'Call Now';
    case 'email': return 'Send Draft';
    case 'meeting': return 'Schedule';
    case 'review': return 'Review';
    case 'close': return 'Close Deal';
    default: return 'Follow Up';
  }
}

function getActionColor(type: FieldAction['type']): { bg: string; text: string; ring: string } {
  switch (type) {
    case 'call': return { bg: 'bg-green-500', text: 'text-white', ring: 'ring-green-500/30' };
    case 'email': return { bg: 'bg-blue-500', text: 'text-white', ring: 'ring-blue-500/30' };
    case 'meeting': return { bg: 'bg-purple-500', text: 'text-white', ring: 'ring-purple-500/30' };
    case 'close': return { bg: 'bg-emerald-500', text: 'text-white', ring: 'ring-emerald-500/30' };
    default: return { bg: 'bg-sky-500', text: 'text-white', ring: 'ring-sky-500/30' };
  }
}

function getStageBadgeColor(stage: string): string {
  switch (stage) {
    case 'new': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'contacted': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    case 'qualified': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'proposal': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'negotiation': return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400';
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  }
}

// ---------------------------------------------------------------------------
// Data fetching — mirrors NextBestActions scoring
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
  due_date: string;
  priority?: string;
  completed: boolean;
  lead_submissions?: LeadRow | null;
}

function inferActionType(title: string): FieldAction['type'] {
  const t = title.toLowerCase();
  if (t.includes('call') || t.includes('phone') || t.includes('dial')) return 'call';
  if (t.includes('email') || t.includes('send') || t.includes('mail')) return 'email';
  if (t.includes('meet') || t.includes('schedul') || t.includes('appointment')) return 'meeting';
  if (t.includes('review') || t.includes('check') || t.includes('audit')) return 'review';
  if (t.includes('close') || t.includes('finalize') || t.includes('sign')) return 'close';
  return 'follow_up';
}

async function fetchFieldActions(orgId: string, userId: string): Promise<FieldAction[]> {
  const now = new Date();

  const [taskResult, leadResult] = await Promise.all([
    supabase
      .from('lead_tasks')
      .select(`
        id, lead_id, title, due_date, priority, completed,
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
      .limit(30),

    supabase
      .from('lead_submissions')
      .select('id, first_name, last_name, email, phone, lead_score, pipeline_stage, assigned_to, stage_changed_at, last_contacted_at, premium_amount')
      .eq('org_id', orgId)
      .not('pipeline_stage', 'in', `(${CLOSED_STAGES.join(',')})`)
      .or(`assigned_to.eq.${userId},assigned_to.is.null`)
      .order('lead_score', { ascending: false })
      .limit(60),
  ]);

  const taskActions: FieldAction[] = ((taskResult.data ?? []) as unknown as TaskRow[])
    .filter((t) => t.lead_submissions)
    .map((task) => {
      const lead = task.lead_submissions!;
      const isOverdue = new Date(task.due_date) < now;
      const daysStage = daysBetween(lead.stage_changed_at, now);
      const daysContact = daysBetween(lead.last_contacted_at, now);
      const premium = lead.premium_amount ?? 0;

      let urgency = 0;
      if (isOverdue) urgency += 35;
      if (lead.lead_score >= 80) urgency += 20;
      if (premium) urgency += Math.min(Math.floor((premium / 1000) * 10), 50);

      return {
        id: `task-${task.id}`,
        type: inferActionType(task.title),
        priority: (isOverdue ? 'critical' : task.priority === 'urgent' ? 'critical' : task.priority === 'high' ? 'high' : task.priority === 'medium' ? 'medium' : 'low') as FieldAction['priority'],
        title: task.title,
        leadId: lead.id,
        leadName: `${lead.first_name} ${lead.last_name}`.trim(),
        leadPhone: lead.phone || undefined,
        leadEmail: lead.email || undefined,
        leadScore: lead.lead_score ?? 0,
        pipelineStage: lead.pipeline_stage,
        urgencyScore: urgency,
        premiumAmount: premium,
        daysInStage: daysStage,
        daysSinceContact: daysContact,
      };
    });

  const leadActions: FieldAction[] = ((leadResult.data ?? []) as LeadRow[]).map((lead) => {
    const daysStage = daysBetween(lead.stage_changed_at, now);
    const daysContact = daysBetween(lead.last_contacted_at, now);
    const premium = lead.premium_amount ?? 0;

    let urgency = 0;
    if (lead.lead_score >= 80) urgency += 30;
    else if (lead.lead_score >= 60) urgency += 20;
    if (daysStage > 10) urgency += 40;
    else if (daysStage > 5) urgency += 25;
    if (daysContact > 7) urgency += 30;
    else if (daysContact > 3) urgency += 15;
    urgency += Math.min(Math.floor((premium / 1000) * 10), 50);
    if (lead.pipeline_stage === 'proposal' || lead.pipeline_stage === 'negotiation') urgency += 20;

    let type: FieldAction['type'] = 'follow_up';
    if (daysContact > 7 && lead.phone) type = 'call';
    else if (daysContact > 3 && lead.email) type = 'email';
    else if (lead.pipeline_stage === 'proposal') type = 'close';
    else if (lead.lead_score >= 80 && lead.pipeline_stage === 'qualified') type = 'meeting';

    let priority: FieldAction['priority'] = 'low';
    if (urgency >= 80) priority = 'critical';
    else if (urgency >= 55) priority = 'high';
    else if (urgency >= 30) priority = 'medium';

    return {
      id: `lead-${lead.id}`,
      type,
      priority,
      title: type === 'call' ? `Call ${lead.first_name}` : type === 'email' ? `Email ${lead.first_name}` : `Follow up with ${lead.first_name}`,
      leadId: lead.id,
      leadName: `${lead.first_name} ${lead.last_name}`.trim(),
      leadPhone: lead.phone || undefined,
      leadEmail: lead.email || undefined,
      leadScore: lead.lead_score ?? 0,
      pipelineStage: lead.pipeline_stage,
      urgencyScore: urgency,
      premiumAmount: premium,
      daysInStage: daysStage,
      daysSinceContact: daysContact,
    };
  });

  const seen = new Map<string, FieldAction>();
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
    .slice(0, 30);
}

// ---------------------------------------------------------------------------
// Swipeable Card
// ---------------------------------------------------------------------------

interface SwipeableCardProps {
  action: FieldAction;
  isActive: boolean;
  offset: number;
  onComplete: () => void;
  onSnooze: () => void;
  onPrimaryCTA: () => void;
  stageDisplayName: (stage: string) => string;
}

function SwipeableCard({
  action,
  isActive,
  offset,
  onComplete,
  onSnooze,
  onPrimaryCTA,
  stageDisplayName,
}: SwipeableCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);

  const SWIPE_THRESHOLD = 100;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = 0;
    setSwiping(true);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swiping) return;
    const diff = e.touches[0].clientX - startXRef.current;
    currentXRef.current = diff;
    setSwipeX(diff);
  }, [swiping]);

  const onTouchEnd = useCallback(() => {
    setSwiping(false);
    if (currentXRef.current > SWIPE_THRESHOLD) {
      onComplete();
    } else if (currentXRef.current < -SWIPE_THRESHOLD) {
      onSnooze();
    }
    setSwipeX(0);
  }, [onComplete, onSnooze]);

  const Icon = getActionIcon(action.type);
  const color = getActionColor(action.type);
  const stageName = stageDisplayName(action.pipelineStage);

  const opacity = isActive ? 1 : Math.max(0, 1 - Math.abs(offset) * 0.3);
  const scale = isActive ? 1 : Math.max(0.9, 1 - Math.abs(offset) * 0.05);
  const translateY = offset * 8;

  return (
    <div
      ref={cardRef}
      className={cn(
        'absolute inset-x-4 transition-all duration-300 ease-out select-none',
        !swiping && 'transition-transform',
      )}
      style={{
        transform: `translateX(${swipeX}px) translateY(${translateY}px) scale(${scale})`,
        opacity,
        zIndex: isActive ? 10 : 10 - Math.abs(offset),
        pointerEvents: isActive ? 'auto' : 'none',
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Swipe hint overlays */}
      {swipeX > 40 && (
        <div className="absolute inset-0 rounded-2xl bg-green-500/20 flex items-center justify-start pl-6 z-20 pointer-events-none">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-lg">
            <SkipForward className="h-6 w-6" /> Done
          </div>
        </div>
      )}
      {swipeX < -40 && (
        <div className="absolute inset-0 rounded-2xl bg-amber-500/20 flex items-center justify-end pr-6 z-20 pointer-events-none">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-lg">
            Snooze <Clock className="h-6 w-6" />
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-th-border shadow-lg overflow-hidden">
        {/* Priority strip */}
        <div className={cn(
          'h-1.5',
          action.priority === 'critical' && 'bg-red-500',
          action.priority === 'high' && 'bg-amber-500',
          action.priority === 'medium' && 'bg-blue-500',
          action.priority === 'low' && 'bg-gray-300 dark:bg-gray-700',
        )} />

        <div className="p-5">
          {/* Action type header */}
          <div className="flex items-center gap-3 mb-4">
            <div className={cn('p-3 rounded-xl ring-4', color.bg, color.text, color.ring)}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-th-text-primary truncate">{action.title}</p>
              <p className="text-sm text-th-text-secondary">{action.leadName}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-2xl font-black text-th-text-primary">{action.leadScore}</div>
              <div className="text-[10px] uppercase tracking-wider text-th-text-tertiary font-semibold">Score</div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-5">
            <span className={cn('px-2.5 py-1 text-xs font-semibold rounded-full', getStageBadgeColor(action.pipelineStage))}>
              {stageName}
            </span>
            {action.premiumAmount > 0 && (
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                ${action.premiumAmount.toLocaleString()}/mo
              </span>
            )}
            {action.daysSinceContact > 3 && (
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {action.daysSinceContact}d silent
              </span>
            )}
          </div>

          {/* CTA buttons */}
          <div className="flex gap-3">
            <button
              onClick={onPrimaryCTA}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base transition-colors min-h-[56px]',
                color.bg, color.text,
                'active:scale-95 transition-transform',
              )}
            >
              <Icon className="h-5 w-5" />
              {getActionLabel(action.type)}
            </button>
            <button
              onClick={onComplete}
              className={cn(
                'flex items-center justify-center gap-2 px-5 py-4 rounded-xl font-semibold text-sm transition-colors min-h-[56px]',
                'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
                'active:scale-95 transition-transform',
              )}
            >
              Skip
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Swipe hint */}
          <p className="text-center text-[11px] text-th-text-tertiary mt-3">
            Swipe right to complete · Swipe left to snooze
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FieldSalesMode — Main Component
// ---------------------------------------------------------------------------

interface FieldSalesModeProps {
  onExit: () => void;
}

export function FieldSalesMode({ onExit }: FieldSalesModeProps) {
  const navigate = useNavigate();
  const { activeOrgId } = useOrg();
  const { user } = useAuth();
  const { pipelineStages, activityService } = useCRM();
  const { earnXP, dailyProgress, streakInfo, userXP, nextLevelProgress } = useGamification();

  const [actions, setActions] = useState<FieldAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);
  const [activeTab, setActiveTab] = useState<BottomTab>('queue');

  // Load action queue
  const loadActions = useCallback(async () => {
    if (!activeOrgId || !user?.id) return;
    setLoading(true);
    try {
      const items = await fetchFieldActions(activeOrgId, user.id);
      const now = Date.now();
      setActions(items.filter((a) => !a.snoozedUntil || a.snoozedUntil < now));
    } catch (err) {
      console.error('[FieldSalesMode] Failed to load actions:', err);
      toast.error('Failed to load action queue');
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, user?.id]);

  useEffect(() => {
    loadActions();
  }, [loadActions]);

  const stageDisplayName = useCallback(
    (stageName: string) => {
      const stage = pipelineStages.find((s) => s.name === stageName);
      return stage?.display_name ?? stageName.charAt(0).toUpperCase() + stageName.slice(1);
    },
    [pipelineStages],
  );

  const handleComplete = useCallback((index: number) => {
    setCompletedToday((c) => c + 1);
    setActions((prev) => prev.filter((_, i) => i !== index));
    if (activeIndex >= actions.length - 1) {
      setActiveIndex(Math.max(0, actions.length - 2));
    }
    toast.success('Action completed!', { icon: '✅' });
  }, [activeIndex, actions.length]);

  const handleSnooze = useCallback((index: number) => {
    setActions((prev) =>
      prev.map((a, i) =>
        i === index ? { ...a, snoozedUntil: Date.now() + SNOOZE_DURATION_MS } : a,
      ).filter((a) => !a.snoozedUntil || a.snoozedUntil > Date.now()),
    );
    toast('Snoozed for 30 min', { icon: '⏰' });
  }, []);

  const handlePrimaryCTA = useCallback(async (action: FieldAction) => {
    switch (action.type) {
      case 'call':
        if (action.leadPhone) {
          window.open(`tel:${action.leadPhone}`, '_self');
          try {
            await activityService.logCall(action.leadId, 'Outbound call from Field Mode');
            await earnXP('call_logged', 'lead', action.leadId, `Called ${action.leadName}`);
            toast.success(`Call logged for ${action.leadName}`);
          } catch (err) {
            console.error('[FieldSalesMode] Failed to log call:', err);
          }
        } else {
          toast.error('No phone number available');
          navigate(`/leads/${action.leadId}`);
        }
        break;

      case 'email':
        navigate(`/leads/${action.leadId}?tab=email`);
        break;

      case 'meeting':
        navigate(`/leads/${action.leadId}?tab=calendar`);
        break;

      default:
        navigate(`/leads/${action.leadId}`);
        break;
    }
  }, [activityService, earnXP, navigate]);

  // Keyboard navigation for dev/testing
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && activeIndex < actions.length - 1) {
        setActiveIndex((i) => i + 1);
      } else if (e.key === 'ArrowLeft' && activeIndex > 0) {
        setActiveIndex((i) => i - 1);
      } else if (e.key === 'Escape') {
        onExit();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeIndex, actions.length, onExit]);

  const callCount = useMemo(() => actions.filter((a) => a.type === 'call').length, [actions]);
  const meetingCount = useMemo(() => actions.filter((a) => a.type === 'meeting').length, [actions]);

  // Tab content
  if (activeTab !== 'queue') {
    const links: Record<Exclude<BottomTab, 'queue'>, string> = {
      pipeline: '/pipeline',
      tasks: '/tasks',
      profile: '/settings/profile',
    };
    navigate(links[activeTab]);
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-950 flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-th-border px-4 py-3 flex items-center justify-between safe-area-top">
        <button
          onClick={onExit}
          className="p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Exit field mode"
        >
          <X className="h-5 w-5 text-th-text-secondary" />
        </button>
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-blue-500" />
          <span className="text-sm font-bold text-th-text-primary">MPB CRM</span>
        </div>
        <div className="flex items-center gap-1">
          <Link
            to="/leads/new"
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Add new lead"
          >
            <Plus className="h-5 w-5 text-th-text-secondary" />
          </Link>
          <button
            onClick={loadActions}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Refresh queue"
          >
            <Zap className="h-5 w-5 text-amber-500" />
          </button>
        </div>
      </header>

      {/* Today's Focus */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-th-border px-4 py-3">
        <p className="text-[10px] uppercase tracking-widest font-bold text-th-text-tertiary mb-2">Today's Focus</p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm">
            <Phone className="h-4 w-4 text-green-500" />
            <span className="font-semibold text-th-text-primary">{callCount}</span>
            <span className="text-th-text-tertiary">calls</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Calendar className="h-4 w-4 text-purple-500" />
            <span className="font-semibold text-th-text-primary">{meetingCount}</span>
            <span className="text-th-text-tertiary">meetings</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-sm">
            <span className="text-th-text-primary font-semibold">Streak: {streakInfo.days}</span>
            {streakInfo.days > 0 && <Flame className={cn('h-4 w-4', streakInfo.color === 'gold' ? 'text-yellow-500' : streakInfo.color === 'orange' ? 'text-orange-500' : 'text-gray-400')} />}
          </div>
        </div>
      </div>

      {/* Card stack */}
      <div className="flex-1 relative overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-pulse text-center">
              <Zap className="h-12 w-12 mx-auto mb-3 text-amber-400" />
              <p className="text-sm font-semibold text-th-text-secondary">Loading your queue…</p>
            </div>
          </div>
        ) : actions.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center px-8">
            <div className="text-center">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-amber-400" />
              <p className="text-xl font-bold text-th-text-primary mb-1">All caught up!</p>
              <p className="text-sm text-th-text-secondary mb-4">
                You completed {completedToday} actions today.
              </p>
              <button
                onClick={loadActions}
                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors active:scale-95"
              >
                Refresh Queue
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Card pagination dots */}
            <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5 z-20">
              {actions.slice(0, Math.min(actions.length, 10)).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === activeIndex ? 'w-6 bg-blue-500' : 'w-1.5 bg-gray-300 dark:bg-gray-700',
                  )}
                  aria-label={`Go to card ${i + 1}`}
                />
              ))}
              {actions.length > 10 && (
                <span className="text-[10px] text-th-text-tertiary self-center ml-1">+{actions.length - 10}</span>
              )}
            </div>

            {/* Cards */}
            <div className="absolute inset-0 top-8">
              {actions.map((action, index) => {
                const offset = index - activeIndex;
                if (Math.abs(offset) > 2) return null;
                return (
                  <SwipeableCard
                    key={action.id}
                    action={action}
                    isActive={offset === 0}
                    offset={offset}
                    onComplete={() => handleComplete(index)}
                    onSnooze={() => handleSnooze(index)}
                    onPrimaryCTA={() => handlePrimaryCTA(action)}
                    stageDisplayName={stageDisplayName}
                  />
                );
              })}
            </div>

            {/* Prev/Next tap zones */}
            {activeIndex > 0 && (
              <button
                onClick={() => setActiveIndex((i) => i - 1)}
                className="absolute left-0 top-8 bottom-0 w-12 z-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                aria-label="Previous card"
              >
                <ChevronLeft className="h-8 w-8 text-th-text-tertiary" />
              </button>
            )}
            {activeIndex < actions.length - 1 && (
              <button
                onClick={() => setActiveIndex((i) => i + 1)}
                className="absolute right-0 top-8 bottom-0 w-12 z-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                aria-label="Next card"
              >
                <ChevronRight className="h-8 w-8 text-th-text-tertiary" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Quick Stats */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-t border-th-border px-4 py-3">
        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <div className="text-xs text-th-text-tertiary">Calls</div>
            <div className="text-sm font-bold text-th-text-primary">
              {dailyProgress.calls.current}/{dailyProgress.calls.target}
            </div>
          </div>
          <div>
            <div className="text-xs text-th-text-tertiary">Emails</div>
            <div className="text-sm font-bold text-th-text-primary">
              {dailyProgress.emails.current}/{dailyProgress.emails.target}
            </div>
          </div>
          <div>
            <div className="text-xs text-th-text-tertiary">XP</div>
            <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
              +{userXP?.total_xp ?? 0}
            </div>
          </div>
          <div>
            <div className="text-xs text-th-text-tertiary">Level</div>
            <div className="text-sm font-bold text-amber-600 dark:text-amber-400">
              {userXP?.level ?? 1}
            </div>
          </div>
        </div>
        {/* XP progress bar */}
        <div className="mt-2 h-1 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${nextLevelProgress.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Bottom nav */}
      <nav className="flex-shrink-0 bg-white dark:bg-gray-900 border-t border-th-border safe-area-bottom">
        <div className="flex items-center justify-around py-2">
          {([
            { tab: 'queue' as const, icon: Home, label: 'Queue' },
            { tab: 'pipeline' as const, icon: BarChart3, label: 'Pipeline' },
            { tab: 'tasks' as const, icon: CheckSquare, label: 'Tasks' },
            { tab: 'profile' as const, icon: User, label: 'Profile' },
          ]).map(({ tab, icon: TabIcon, label }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors min-w-[64px]',
                activeTab === tab
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-th-text-tertiary hover:text-th-text-secondary',
              )}
            >
              <TabIcon className="h-5 w-5" />
              <span className="text-[10px] font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FieldSalesModeToggle
// ---------------------------------------------------------------------------

export function FieldSalesModeToggle() {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem(FIELD_MODE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [showOverlay, setShowOverlay] = useState(enabled);

  const toggle = useCallback(() => {
    const next = !enabled;
    setEnabled(next);
    setShowOverlay(next);
    try {
      localStorage.setItem(FIELD_MODE_KEY, String(next));
    } catch { /* noop */ }
  }, [enabled]);

  const handleExit = useCallback(() => {
    setEnabled(false);
    setShowOverlay(false);
    try {
      localStorage.setItem(FIELD_MODE_KEY, 'false');
    } catch { /* noop */ }
  }, []);

  return (
    <>
      {/* Toggle button — visible only on mobile */}
      <button
        onClick={toggle}
        className={cn(
          'md:hidden fixed bottom-20 right-4 z-40 p-3 rounded-full shadow-lg transition-all',
          enabled
            ? 'bg-blue-600 text-white ring-4 ring-blue-500/30'
            : 'bg-white dark:bg-gray-900 text-th-text-secondary border border-th-border',
          'active:scale-95',
        )}
        aria-label="Toggle field sales mode"
      >
        <Smartphone className="h-5 w-5" />
      </button>

      {/* Field Sales Mode overlay */}
      {showOverlay && <FieldSalesMode onExit={handleExit} />}
    </>
  );
}

export default FieldSalesMode;
