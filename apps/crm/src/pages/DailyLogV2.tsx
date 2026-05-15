import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Loader2,
  Mail,
  Linkedin,
  Briefcase,
  Activity,
  Sparkles,
  Trophy,
  AlertTriangle,
  Plus,
  Lock,
  XCircle,
  Layers,
  Users,
  Pencil,
  Trash2,
  ShieldAlert,
  Filter,
  Search,
  MessageSquare,
  Target,
  ShieldCheck,
} from 'lucide-react';
import { GradientHeader } from '@mpbhealth/ui';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useOrg } from '../contexts/OrgContext';
import { formatTimeAgo } from '@mpbhealth/crm-core';
import { useOrgReps } from '../hooks/useOrgReps';
import { ManualEntryModal, type ManualEntrySection } from '../components/dailyLog/ManualEntryModal';
import { AdminCorrectionModal } from '../components/dailyLog/AdminCorrectionModal';
import { SpecialProjectsBreakdown } from '../components/dailyLog/SpecialProjectsBreakdown';
import { CallBreakdownPanel } from '../components/dailyLog/CallBreakdownPanel';

// ----------------------------------------------------------------------------
// CRM rebuild Phase 4 / Section 8 / Section 11 / Section 12
// ----------------------------------------------------------------------------
// Daily Log v2 — accordion-based, auto-capture page that replaces the
// localStorage version. Event rows come from `crm_daily_log_events` (real-
// time via Supabase Realtime). Special Projects + manual rep notes are the
// only manual write paths; everything else is fed by triggers on
// crm_activities + crm_email_log + crm_lead_quote_history.
//
// Scope here intentionally focuses on the "Today" rep view + Performance
// Lag panel. The admin filter view (rep / date-range / source) is a
// follow-up using the same queries with a few extra params; that's marked
// in the comments below.

type Section =
  | 'lead_communication'
  | 'linkedin_activity'
  | 'pipeline'
  | 'deals_closed'
  | 'activities'
  | 'content_creation'
  | 'special_projects';

interface DailyLogEvent {
  id: string;
  org_id: string;
  user_id: string;
  log_date: string;
  source: string;
  source_id: string | null;
  section: Section;
  activity_type: string;
  activity_subtype: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  manual: boolean;
  occurred_at: string;
  created_at: string;
  // Round 12 — Section 15 capture + searchable backend.
  prospect_name?: string | null;
  company_name?: string | null;
  linked_record_type?: 'lead' | 'contact' | 'recruit' | 'account' | null;
  linked_record_id?: string | null;
}

interface ConversationGoalRow {
  conversation_count: number;
  target: number;
  is_special_projects_day: boolean;
  is_exempt: boolean;
}

interface CorroborationRow {
  id: string;
  effective_corroborated: boolean;
}

interface PerformanceAlert {
  id: string;
  user_id: string;
  window_start: string;
  window_end: string;
  rep_count: number;
  team_avg: number;
  top_performer_count: number;
  fired_at: string;
  quiet_until: string;
}

// Section 11 / Round 6 — accordion section list. Order is fixed by spec
// (top to bottom): Lead Communication → LinkedIn Activity → Pipeline →
// Deals Closed → Activities → Content Creation → Special Projects.
// Descriptions track the spec verbatim so reps see exactly the bucket
// definitions in the document.
const SECTIONS: { key: Section; label: string; icon: typeof Mail; description: string }[] = [
  {
    key: 'lead_communication',
    label: 'Lead Communication',
    icon: Mail,
    description: 'Calls, Texts, Emails, Cancellation Calls.',
  },
  {
    key: 'linkedin_activity',
    label: 'LinkedIn Activity',
    icon: Linkedin,
    description:
      'Connection requests sent, messages sent, replies, profile views (per Section 2 LinkedIn subsection statuses).',
  },
  {
    key: 'pipeline',
    label: 'Pipeline',
    icon: Briefcase,
    description:
      'Stage advances, manual stage overrides, "Mark as Lost," transfers between subsections.',
  },
  {
    key: 'deals_closed',
    label: 'Deals Closed',
    icon: Trophy,
    description: 'Leads moved into Won — Enrolled for the day.',
  },
  {
    key: 'activities',
    label: 'Activities',
    icon: Activity,
    description: 'Rep actions not captured by the other sections (catch-all bucket).',
  },
  {
    key: 'content_creation',
    label: 'Content Creation',
    icon: Sparkles,
    description:
      'Content the rep drafted or published — emails / templates created, LinkedIn posts, etc.',
  },
  {
    key: 'special_projects',
    label: 'Special Projects',
    icon: ClipboardList,
    description: 'Non-pipeline work with time capture (manual entry).',
  },
];

export default function DailyLogV2() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { activeOrgId, orgRole } = useOrg();
  const [searchParams, setSearchParams] = useSearchParams();
  const isOrgAdmin = orgRole === 'admin' || orgRole === 'owner';

  // Section 9 / Round 5 — End-of-Day collapsed into Sales Daily Logs as
  // "multi mode": rep can backfill several entries in one EOD pass.
  const isMultiMode = searchParams.get('mode') === 'multi';

  // Section 8 (Round 4) — admin filter view. Activated via ?view=admin and
  // gated by org role. Reps stay on the per-rep "today" view by default.
  const isAdminView = isOrgAdmin && searchParams.get('view') === 'admin';

  // Admin filter state (rep, date range, source).
  const [adminRepFilter, setAdminRepFilter] = useState<string>('all'); // user_id or 'all'
  const [adminDateFrom, setAdminDateFrom] = useState<string>(() =>
    new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  );
  const [adminDateTo, setAdminDateTo] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [adminSourceFilter, setAdminSourceFilter] = useState<'all' | 'auto' | 'manual'>('all');
  // Round 12 — admin full-text search across the searchable backend.
  const [adminSearchQuery, setAdminSearchQuery] = useState<string>('');
  const [adminSectionFilter, setAdminSectionFilter] = useState<'all' | Section>('all');

  const { data: orgReps = [] } = useOrgReps();

  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [manualEntrySection, setManualEntrySection] = useState<ManualEntrySection | undefined>();
  const [correctingEvent, setCorrectingEvent] = useState<DailyLogEvent | null>(null);

  // Section 11 / Round 6 — accordion starts FULLY COLLAPSED on every
  // load per spec ("all sections collapsed by default"). The open/closed
  // state then persists per user across sessions in
  // `crm_rep_daily_log_entries.section_open_state` (jsonb) so a rep who
  // deliberately re-opens a section keeps it open through the day; the
  // next day still starts collapsed because that row is keyed by log_date.
  //
  // Round 9 — open-question #1: single-expand vs multi-expand. Default is
  // multi (matches the implementer assumption); admins can flip to
  // single via crm_daily_log_ui_config.accordion_mode and the toggle
  // logic below collapses peers when one section opens.
  const [openSections, setOpenSections] = useState<Record<Section, boolean>>({
    lead_communication: false,
    linkedin_activity: false,
    pipeline: false,
    deals_closed: false,
    activities: false,
    content_creation: false,
    special_projects: false,
  });

  const { data: dailyLogUiConfig } = useQuery({
    queryKey: ['dailyLogUiConfig', activeOrgId] as const,
    enabled: !!activeOrgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('crm_daily_log_ui_config')
        .select('accordion_mode, default_collapsed, spec_locked')
        .eq('org_id', activeOrgId!)
        .maybeSingle();
      return (data ?? { accordion_mode: 'multi', default_collapsed: true, spec_locked: true }) as {
        accordion_mode: 'single' | 'multi';
        default_collapsed: boolean;
        spec_locked: boolean;
      };
    },
    staleTime: 60_000,
  });
  // Section 12 / Round 6 Addendum lock: when spec_locked is true (default),
  // accordion is forced to multi-expand regardless of the column value so
  // rep behaviour always matches the spec.
  const accordionMode: 'single' | 'multi' = dailyLogUiConfig?.spec_locked
    ? 'multi'
    : (dailyLogUiConfig?.accordion_mode ?? 'multi');

  // ── Events query ────────────────────────────────────────────────────────
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Per-rep "today" view (used by reps + admins on the default view).
  const repQueryKey = ['dailyLogEvents', activeOrgId, user?.id, today] as const;
  const { data: repEvents = [], isLoading: repLoading } = useQuery({
    queryKey: repQueryKey,
    enabled: !!activeOrgId && !!user?.id && !isAdminView,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_daily_log_events')
        .select('*')
        .eq('org_id', activeOrgId!)
        .eq('user_id', user!.id)
        .eq('log_date', today)
        .order('occurred_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as DailyLogEvent[];
    },
    staleTime: 5_000,
  });

  // Admin filter view (Section 8 + Round 12 search): per-rep, date range,
  // auto-vs-manual + full-text search via crm_daily_log_search RPC.
  const adminQueryKey = [
    'dailyLogEventsAdmin',
    activeOrgId,
    adminRepFilter,
    adminDateFrom,
    adminDateTo,
    adminSourceFilter,
    adminSectionFilter,
    adminSearchQuery.trim(),
  ] as const;
  const { data: adminEvents = [], isLoading: adminLoading } = useQuery({
    queryKey: adminQueryKey,
    enabled: !!activeOrgId && isAdminView,
    queryFn: async () => {
      const trimmedQ = adminSearchQuery.trim();
      const useRpc =
        trimmedQ.length > 0 || adminSectionFilter !== 'all'; // RPC handles tsv + section filter cleanly
      if (useRpc) {
        const { data, error } = await supabase.rpc('crm_daily_log_search', {
          p_org_id: activeOrgId!,
          p_q: trimmedQ.length > 0 ? trimmedQ : null,
          p_from: adminDateFrom,
          p_to: adminDateTo,
          p_user_id: adminRepFilter !== 'all' ? adminRepFilter : null,
          p_section: adminSectionFilter !== 'all' ? adminSectionFilter : null,
          p_activity_type: null,
          p_source:
            adminSourceFilter === 'auto' ? 'auto' :
            adminSourceFilter === 'manual' ? 'manual' : null,
          p_linked_record_type: null,
          p_linked_record_id: null,
          p_limit: 500,
          p_offset: 0,
        });
        if (error) throw error;
        return (data ?? []) as DailyLogEvent[];
      }
      let q = supabase
        .from('crm_daily_log_events')
        .select('*')
        .eq('org_id', activeOrgId!)
        .gte('log_date', adminDateFrom)
        .lte('log_date', adminDateTo)
        .order('occurred_at', { ascending: false })
        .limit(500);
      if (adminRepFilter !== 'all') q = q.eq('user_id', adminRepFilter);
      if (adminSourceFilter !== 'all') {
        q = q.eq('manual', adminSourceFilter === 'manual');
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as DailyLogEvent[];
    },
    staleTime: 5_000,
  });

  // Round 12 — anti-fabrication corroboration view, scoped to the
  // current admin filter set so the badge can be shown next to a row.
  const { data: corroborationFlags = [] } = useQuery({
    queryKey: [
      'dailyLogCorroboration',
      activeOrgId,
      adminRepFilter,
      adminDateFrom,
      adminDateTo,
    ] as const,
    enabled: !!activeOrgId && isAdminView,
    queryFn: async () => {
      let q = supabase
        .from('crm_v_daily_log_corroboration')
        .select('id, effective_corroborated')
        .eq('org_id', activeOrgId!)
        .gte('log_date', adminDateFrom)
        .lte('log_date', adminDateTo)
        .eq('manual', true)
        .eq('effective_corroborated', false)
        .limit(500);
      if (adminRepFilter !== 'all') q = q.eq('user_id', adminRepFilter);
      const { data, error } = await q;
      if (error) {
        // View may not have been provisioned yet — degrade silently.
        console.warn('[DailyLogV2] corroboration view query failed', error.message);
        return [] as CorroborationRow[];
      }
      return (data ?? []) as CorroborationRow[];
    },
    staleTime: 30_000,
  });
  const uncorroboratedIds = useMemo(
    () => new Set(corroborationFlags.map((c) => c.id)),
    [corroborationFlags],
  );

  const events = isAdminView ? adminEvents : repEvents;
  const isLoading = isAdminView ? adminLoading : repLoading;

  // Section 8 — Realtime. In rep view we filter by user_id; in admin view we
  // listen to all org events and rely on the date-range query to redraw.
  useEffect(() => {
    if (!activeOrgId) return;
    const channelName = isAdminView
      ? `daily-log-admin-${activeOrgId}`
      : `daily-log-${user?.id ?? 'anon'}`;
    const filter = isAdminView ? undefined : user?.id ? `user_id=eq.${user.id}` : undefined;
    if (!isAdminView && !user?.id) return;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crm_daily_log_events',
          ...(filter ? { filter } : {}),
        },
        () => {
          // Invalidate both query shapes; whichever one is currently mounted
          // refetches. Cheap because react-query short-circuits idle keys.
          queryClient.invalidateQueries({ queryKey: ['dailyLogEvents'] });
          queryClient.invalidateQueries({ queryKey: ['dailyLogEventsAdmin'] });
          queryClient.invalidateQueries({ queryKey: ['leadsWorkedToday'] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeOrgId, user?.id, isAdminView, queryClient]);

  // ── "Leads worked today" derived count (rep view) ───────────────────────
  const { data: leadsWorked = 0 } = useQuery({
    queryKey: ['leadsWorkedToday', activeOrgId, user?.id, today],
    enabled: !!activeOrgId && !!user?.id && !isAdminView,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('crm_count_leads_worked', {
        p_org_id: activeOrgId,
        p_user_id: user!.id,
        p_date: today,
      });
      if (error) throw error;
      return (data as number) ?? 0;
    },
    staleTime: 10_000,
  });

  // Round 12 — daily conversation goal (25/day FT, scaled PT, SP day exempt).
  const { data: conversationGoal } = useQuery({
    queryKey: ['conversationGoal', activeOrgId, user?.id, today] as const,
    enabled: !!activeOrgId && !!user?.id && !isAdminView,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('crm_count_conversations', {
        p_org_id: activeOrgId,
        p_user_id: user!.id,
        p_date: today,
      });
      if (error) {
        console.warn('[DailyLogV2] conversation goal RPC failed', error.message);
        return null;
      }
      // Supabase rpc returns a single-row table; either an array or the row itself.
      const row = Array.isArray(data) ? data[0] : data;
      return (row as ConversationGoalRow | null) ?? null;
    },
    staleTime: 15_000,
  });

  // ── Latest performance lag alert (passive — surfaces existing alerts) ──
  const { data: latestAlert } = useQuery({
    queryKey: ['performanceAlertLatest', activeOrgId, user?.id],
    enabled: !!activeOrgId && !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('crm_performance_alert_log')
        .select('*')
        .eq('org_id', activeOrgId!)
        .eq('user_id', user!.id)
        .order('fired_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data as PerformanceAlert | null) ?? null;
    },
    staleTime: 60_000,
  });

  // ── Group events by section ────────────────────────────────────────────
  const eventsBySection = useMemo(() => {
    const map = new Map<Section, DailyLogEvent[]>();
    for (const s of SECTIONS) map.set(s.key, []);
    for (const e of events) {
      map.get(e.section as Section)?.push(e);
    }
    return map;
  }, [events]);

  // Section 11 — Cancellation Calls count separately. Reads the
  // `activity_subtype = 'cancellation'` flag set by the
  // crm_dl_emit_from_activity trigger.
  const cancellationCount = useMemo(
    () =>
      events.filter(
        (e) => e.activity_type === 'call' && e.activity_subtype === 'cancellation',
      ).length,
    [events],
  );

  const totalToday = events.length;

  const toggleSection = (key: Section) => {
    setOpenSections((s) => {
      let next: Record<Section, boolean>;
      if (accordionMode === 'single') {
        // One-section-at-a-time: opening a closed section collapses
        // every other section; toggling an open section just closes it.
        const willOpen = !s[key];
        next = SECTIONS.reduce((acc, sec) => {
          acc[sec.key] = sec.key === key ? willOpen : false;
          return acc;
        }, {} as Record<Section, boolean>);
      } else {
        next = { ...s, [key]: !s[key] };
      }
      void persistOpenState(next);
      return next;
    });
  };

  // Persist accordion state to crm_rep_daily_log_entries.section_open_state.
  async function persistOpenState(next: Record<Section, boolean>) {
    if (!activeOrgId || !user?.id) return;
    await supabase.from('crm_rep_daily_log_entries').upsert(
      {
        org_id: activeOrgId,
        user_id: user.id,
        log_date: today,
        section_open_state: next,
      },
      { onConflict: 'org_id,user_id,log_date' },
    );
  }

  // Hydrate open state on first load.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!activeOrgId || !user?.id) return;
      const { data } = await supabase
        .from('crm_rep_daily_log_entries')
        .select('section_open_state')
        .eq('org_id', activeOrgId)
        .eq('user_id', user.id)
        .eq('log_date', today)
        .maybeSingle();
      const stored = (data?.section_open_state ?? null) as Record<Section, boolean> | null;
      if (!cancelled && stored && typeof stored === 'object') {
        setOpenSections((s) => ({ ...s, ...stored }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeOrgId, user?.id, today]);

  // ── Manual row delete (own rows only) ─────────────────────────────────
  const deleteOwnManualEntry = async (eventId: string) => {
    if (!user?.id) return;
    if (!confirm('Delete this manual entry? This cannot be undone.')) return;
    const { error } = await supabase
      .from('crm_daily_log_events')
      .delete()
      .eq('id', eventId)
      .eq('user_id', user.id)
      .eq('manual', true);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Entry deleted');
    queryClient.invalidateQueries({ queryKey: repQueryKey });
  };

  // ── Special Projects manual entry ──────────────────────────────────────
  // Round 7 spec: project name (free text OR pick-list), time spent
  // (minutes OR HH:MM), optional notes. We support both time formats by
  // accepting any string and parsing it leniently.
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectTypeId, setProjectTypeId] = useState<string>('');
  const [projectName, setProjectName] = useState('');
  const [projectTime, setProjectTime] = useState('');
  const [projectNotes, setProjectNotes] = useState('');
  const [savingProject, setSavingProject] = useState(false);

  // Pick-list options for the active org. Empty list = admins haven't
  // seeded any types yet, so the form falls back to free-text only.
  const { data: projectTypes = [] } = useQuery({
    queryKey: ['specialProjectTypes', activeOrgId],
    enabled: !!activeOrgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_special_project_types')
        .select('id,name,description,sort_order')
        .eq('org_id', activeOrgId!)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as { id: string; name: string; description: string | null; sort_order: number }[];
    },
    staleTime: 60_000,
  });

  const handleSaveProject = async () => {
    if (!activeOrgId || !user?.id) return;
    const minutes = parseTimeToMinutes(projectTime);
    if (minutes === null || minutes <= 0) {
      toast.error('Enter time as minutes (e.g. 45) or HH:MM (e.g. 1:30)');
      return;
    }
    const trimmedName = projectName.trim();
    const pickedType = projectTypes.find((t) => t.id === projectTypeId);
    const finalName = pickedType?.name ?? trimmedName;
    if (!finalName) {
      toast.error('Pick a project type or enter a name');
      return;
    }
    // Section 12 / Round 6 Addendum lock — notes are a required field
    // on every Special Projects entry. The DB enforces this with a
    // CHECK constraint; we surface a friendlier client-side message.
    const trimmedNotes = projectNotes.trim();
    if (!trimmedNotes) {
      toast.error('Notes are required for Special Projects (per spec)');
      return;
    }
    setSavingProject(true);
    const { error } = await supabase.from('crm_special_projects').insert({
      org_id: activeOrgId,
      user_id: user.id,
      log_date: today,
      project_type_id: pickedType?.id ?? null,
      project_name: finalName,
      time_minutes: minutes,
      notes: trimmedNotes,
    });
    setSavingProject(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Special project logged');
    setProjectTypeId('');
    setProjectName('');
    setProjectTime('');
    setProjectNotes('');
    setShowProjectForm(false);
    queryClient.invalidateQueries({
      queryKey: ['dailyLogEvents', activeOrgId, user.id, today],
    });
  };

  // ── Render ────────────────────────────────────────────────────────────

  const headerTitle = isAdminView
    ? 'Daily Log — Admin View'
    : isMultiMode
      ? 'End of Day — Multi Entry'
      : 'Daily Log';
  const headerSubtitle = isAdminView
    ? 'Filter by rep, date range, and activity source. Use admin corrections sparingly — every change writes to crm_daily_log_corrections.'
    : isMultiMode
      ? 'Backfill multiple entries in one pass. Auto-captured rows are read-only; new manual rows land below.'
      : 'Auto-captured per Section 11. Manual entries are flagged.';

  const switchToAdminView = () => {
    const next = new URLSearchParams(searchParams);
    next.set('view', 'admin');
    setSearchParams(next, { replace: false });
  };
  const switchToRepView = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('view');
    setSearchParams(next, { replace: false });
  };

  return (
    <div className="space-y-6">
      <GradientHeader
        title={headerTitle}
        subtitle={headerSubtitle}
        icon={<ClipboardList className="w-5 h-5" />}
        size="sm"
        actions={
          <div className="flex items-center gap-3 text-xs text-th-text-tertiary">
            {!isAdminView && (
              <span className="inline-flex items-center gap-1 bg-th-accent-50 text-th-accent-700 px-2 py-1 rounded-full">
                <Users className="w-3 h-3" />
                <span className="font-semibold tabular-nums">{leadsWorked}</span> lead
                {leadsWorked === 1 ? '' : 's'} worked
              </span>
            )}
            {/* Round 12 — Daily conversation goal badge.
                Spec: 25/day full-time, scaled for part-time, exempt on
                Special Projects days. SP-day exemption shows the badge
                in slate ("exempt"); below-target shows amber; at/above
                shows emerald. */}
            {!isAdminView && conversationGoal && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${
                  conversationGoal.is_exempt
                    ? 'bg-slate-100 text-slate-700'
                    : conversationGoal.conversation_count >= conversationGoal.target
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                }`}
                title={
                  conversationGoal.is_exempt
                    ? conversationGoal.is_special_projects_day
                      ? 'Special Projects day — conversation goal is exempt'
                      : 'Conversation goal exempt for this rep'
                    : `Daily conversation goal: ${conversationGoal.target}`
                }
              >
                <Target className="w-3 h-3" />
                <span className="font-semibold tabular-nums">{conversationGoal.conversation_count}</span>
                {!conversationGoal.is_exempt && (
                  <>
                    /<span className="font-semibold tabular-nums">{conversationGoal.target}</span>{' '}
                    convos
                  </>
                )}
                {conversationGoal.is_exempt && <> convos · exempt</>}
              </span>
            )}
            {!isAdminView && cancellationCount > 0 && (
              <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full">
                <XCircle className="w-3 h-3" />
                <span className="font-semibold tabular-nums">{cancellationCount}</span> cancellation{' '}
                {cancellationCount === 1 ? 'call' : 'calls'}
              </span>
            )}
            <span>
              <span className="font-semibold tabular-nums text-th-text-primary">{totalToday}</span>{' '}
              events
              {isAdminView ? '' : ' today'}
            </span>
            {!isAdminView && (
              <button
                type="button"
                onClick={() => {
                  setManualEntrySection(undefined);
                  setManualEntryOpen(true);
                }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-th-accent-700 bg-th-accent-50 hover:bg-th-accent-100 border border-th-accent-200"
              >
                <Plus className="w-3 h-3" /> Log activity
              </button>
            )}
            {isOrgAdmin &&
              (isAdminView ? (
                <button
                  type="button"
                  onClick={switchToRepView}
                  className="px-2 py-1 rounded-md border border-th-border hover:bg-surface-secondary"
                >
                  My day
                </button>
              ) : (
                <button
                  type="button"
                  onClick={switchToAdminView}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-th-border hover:bg-surface-secondary"
                >
                  <Filter className="w-3 h-3" /> Admin view
                </button>
              ))}
          </div>
        }
      />

      {isAdminView && activeOrgId && (
        <>
          <CallBreakdownPanel
            orgId={activeOrgId}
            dateFrom={adminDateFrom}
            dateTo={adminDateTo}
            repFilter={adminRepFilter}
          />
          <SpecialProjectsBreakdown
            orgId={activeOrgId}
            dateFrom={adminDateFrom}
            dateTo={adminDateTo}
            repFilter={adminRepFilter}
          />
        </>
      )}

      {isAdminView && (
        <div className="bg-surface-primary border border-th-border rounded-2xl p-4 space-y-3">
          {/* Round 12 — searchable backend. Full-text query against prospect
              name, company name, notes, activity type. Powered by the
              `crm_daily_log_search` RPC + the generated tsvector on
              `crm_daily_log_events.search_tsv`. Spec example query:
              "every entry mentioning [name / company]". */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-th-text-tertiary mb-1">
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-th-text-tertiary">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="search"
                value={adminSearchQuery}
                onChange={(e) => setAdminSearchQuery(e.target.value)}
                placeholder='e.g. "Sarah Johnson", call no answer, or Acme Corp'
                className="w-full border border-th-border rounded-lg pl-10 pr-3 py-2 text-sm bg-surface-primary"
              />
            </div>
            {adminSearchQuery.trim().length > 0 && (
              <p className="text-[11px] text-th-text-tertiary mt-1">
                Full-text search across prospect, company, notes, and activity
                type. Combine with rep + date + section filters below.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-th-text-tertiary mb-1">
                Rep
              </label>
              <select
                value={adminRepFilter}
                onChange={(e) => setAdminRepFilter(e.target.value)}
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
              >
                <option value="all">All reps</option>
                {orgReps.map((r) => (
                  <option key={r.user_id} value={r.user_id}>
                    {r.display_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-th-text-tertiary mb-1">
                From
              </label>
              <input
                type="date"
                value={adminDateFrom}
                onChange={(e) => setAdminDateFrom(e.target.value)}
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-th-text-tertiary mb-1">
                To
              </label>
              <input
                type="date"
                value={adminDateTo}
                onChange={(e) => setAdminDateTo(e.target.value)}
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-th-text-tertiary mb-1">
                Section
              </label>
              <select
                value={adminSectionFilter}
                onChange={(e) => setAdminSectionFilter(e.target.value as 'all' | Section)}
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
              >
                <option value="all">All sections</option>
                {SECTIONS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-th-text-tertiary mb-1">
                Source
              </label>
              <select
                value={adminSourceFilter}
                onChange={(e) => setAdminSourceFilter(e.target.value as 'all' | 'auto' | 'manual')}
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
              >
                <option value="all">Auto + manual</option>
                <option value="auto">Auto-captured only</option>
                <option value="manual">Manual only</option>
              </select>
            </div>
          </div>

          {uncorroboratedIds.size > 0 && (
            <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              {uncorroboratedIds.size} manual conversation
              {uncorroboratedIds.size === 1 ? '' : 's'} in this view lack a
              same-day auto-captured touch — flagged for review (Round 12
              anti-fabrication).
            </div>
          )}
        </div>
      )}

      {isMultiMode && (
        <div className="bg-th-accent-50 border border-th-accent-200 rounded-2xl p-4 flex items-start gap-3">
          <Layers className="w-5 h-5 text-th-accent-600 mt-0.5 shrink-0" />
          <div className="text-sm text-th-accent-800">
            <p className="font-semibold">Multi-entry mode</p>
            <p className="mt-0.5 text-th-accent-700/90">
              Use this view at end-of-day to log activity that happened off-CRM. Auto-captured rows
              from calls, emails, and meetings already appear above each section — you only need to
              add what's missing.
            </p>
          </div>
        </div>
      )}

      {/* Performance Lag Alert (Section 12 / Round 6 payload). Shown only if
          a recent alert is still inside the quiet window. */}
      {latestAlert && new Date(latestAlert.quiet_until) > new Date() && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-amber-800">Performance Lag Alert</p>
            <p className="text-amber-700 mt-0.5">
              Your activity count over the last 5 business days is{' '}
              <strong>{latestAlert.rep_count}</strong>. Team average (excluding you):{' '}
              <strong>{Number(latestAlert.team_avg).toFixed(1)}</strong>. Top performer over the
              same window logged{' '}
              <strong>{latestAlert.top_performer_count}</strong>. Quiet period ends{' '}
              {formatTimeAgo(latestAlert.quiet_until)}.
            </p>
          </div>
        </div>
      )}

      {/* Section accordion */}
      <div className="space-y-3">
        {SECTIONS.map(({ key, label, icon: Icon, description }) => {
          const open = openSections[key];
          const sectionEvents = eventsBySection.get(key) ?? [];
          return (
            <div
              key={key}
              className="bg-surface-primary border border-th-border rounded-2xl overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleSection(key)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-secondary transition-colors"
                aria-expanded={open}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-th-accent-50 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-th-accent-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-th-text-primary">{label}</p>
                    <p className="text-xs text-th-text-tertiary mt-0.5">{description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium tabular-nums text-th-text-secondary bg-surface-secondary px-2 py-1 rounded-full">
                    {sectionEvents.length}
                  </span>
                  {open ? (
                    <ChevronUp className="w-4 h-4 text-th-text-secondary" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-th-text-secondary" />
                  )}
                </div>
              </button>
              {open && (
                <div className="border-t border-th-border-subtle">
                  {!isAdminView && key !== 'special_projects' && (
                    <div className="p-3 border-b border-th-border-subtle flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setManualEntrySection(key as ManualEntrySection);
                          setManualEntryOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-th-border rounded-lg hover:bg-surface-secondary text-th-text-secondary"
                      >
                        <Plus className="w-3 h-3" /> Log manual {label.toLowerCase()}
                      </button>
                    </div>
                  )}
                  {key === 'special_projects' && !isAdminView && (
                    <div className="p-4 border-b border-th-border-subtle">
                      {showProjectForm ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                          {projectTypes.length > 0 ? (
                            <select
                              value={projectTypeId}
                              onChange={(e) => {
                                setProjectTypeId(e.target.value);
                                if (e.target.value) setProjectName('');
                              }}
                              className="border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
                            >
                              <option value="">Custom — type name below</option>
                              {projectTypes.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="text-[11px] text-th-text-tertiary px-1 self-center">
                              No project types yet — type a name on the right.
                            </div>
                          )}
                          <input
                            type="text"
                            value={projectName}
                            onChange={(e) => {
                              setProjectName(e.target.value);
                              if (e.target.value) setProjectTypeId('');
                            }}
                            placeholder={projectTypeId ? '(using picked type)' : 'Project name (free text)'}
                            disabled={!!projectTypeId}
                            className="border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary disabled:bg-surface-secondary disabled:text-th-text-tertiary"
                          />
                          <input
                            type="text"
                            inputMode="numeric"
                            value={projectTime}
                            onChange={(e) => setProjectTime(e.target.value)}
                            placeholder="Time — minutes or HH:MM"
                            className="border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
                          />
                          <textarea
                            value={projectNotes}
                            onChange={(e) => setProjectNotes(e.target.value)}
                            placeholder="Notes (required) — what did you work on?"
                            rows={2}
                            required
                            className="sm:col-span-3 border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
                          />
                          <p className="sm:col-span-3 text-[11px] text-th-text-tertiary -mt-1">
                            All three fields — project name, time spent, and notes — are required
                            per Section 12 (Round 6 Addendum). Time feeds the per-rep and
                            per-project rollups in Reports.
                          </p>
                          <div className="sm:col-span-3 flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setShowProjectForm(false)}
                              className="px-3 py-2 text-xs font-medium border border-th-border rounded-lg hover:bg-surface-secondary"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveProject}
                              disabled={savingProject}
                              className="px-3 py-2 text-xs font-medium text-white bg-th-accent-600 rounded-lg hover:bg-th-accent-700 disabled:opacity-50"
                            >
                              {savingProject ? 'Saving…' : 'Save'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowProjectForm(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-th-border rounded-lg hover:bg-surface-secondary"
                        >
                          <Plus className="w-3 h-3" /> Log a special project
                        </button>
                      )}
                    </div>
                  )}
                  {isLoading ? (
                    <div className="p-6 text-center text-th-text-tertiary text-sm">
                      <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" /> Loading…
                    </div>
                  ) : sectionEvents.length === 0 ? (
                    <div className="p-6 text-center text-th-text-tertiary text-xs">
                      No events in this section today.
                    </div>
                  ) : (
                    <ul className="divide-y divide-th-border-subtle">
                      {sectionEvents.map((e) => {
                        const isCancellation = e.activity_subtype === 'cancellation';
                        const isMarkLost = e.activity_type === 'mark_lost';
                        const isStageChange = e.activity_type === 'stage_change';
                        const isSubsectionTransfer = e.activity_type === 'subsection_transfer';
                        const repName = isAdminView
                          ? orgReps.find((r) => r.user_id === e.user_id)?.display_name ??
                            e.user_id.slice(0, 8)
                          : null;
                        const meta = (e.metadata as Record<string, unknown> | null) ?? null;
                        const adminCorrected = meta?.admin_corrected === true;
                        const dotClass = isCancellation || isMarkLost
                          ? 'bg-red-500'
                          : isStageChange || isSubsectionTransfer
                            ? 'bg-blue-500'
                            : 'bg-th-accent-500';
                        return (
                          <li key={e.id} className="px-5 py-3 flex items-start gap-3 group">
                            <span className={`mt-1 inline-block w-2 h-2 rounded-full ${dotClass}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-medium text-th-text-primary truncate">
                                  {e.description || prettyType(e.activity_type)}
                                </p>
                                {isCancellation && (
                                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-50 text-red-700 inline-flex items-center gap-0.5">
                                    <XCircle className="w-2.5 h-2.5" /> cancellation
                                  </span>
                                )}
                                {isMarkLost && (
                                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-50 text-red-700 inline-flex items-center gap-0.5">
                                    <XCircle className="w-2.5 h-2.5" /> marked lost
                                  </span>
                                )}
                                {isStageChange && (
                                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                                    stage advance
                                  </span>
                                )}
                                {isSubsectionTransfer && (
                                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                                    transfer
                                  </span>
                                )}
                                {e.manual ? (
                                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                                    manual
                                  </span>
                                ) : (
                                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 inline-flex items-center gap-0.5">
                                    <Lock className="w-2.5 h-2.5" /> auto
                                  </span>
                                )}
                                {adminCorrected && (
                                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 inline-flex items-center gap-0.5">
                                    <ShieldAlert className="w-2.5 h-2.5" /> corrected
                                  </span>
                                )}
                                {/* Round 12 — admin sees the anti-fabrication
                                    flag when the conversation lacks a
                                    same-day auto-captured touch on the same
                                    lead. */}
                                {isAdminView && uncorroboratedIds.has(e.id) && (
                                  <span
                                    className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 inline-flex items-center gap-0.5"
                                    title="Manual conversation row with no same-day GoTo call / email / SMS / meeting touching this lead. Round 12 anti-fabrication flag."
                                  >
                                    <ShieldCheck className="w-2.5 h-2.5" /> uncorroborated
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-th-text-tertiary mt-0.5">
                                {prettyType(e.activity_type)} · {e.source} ·{' '}
                                {formatTimeAgo(e.occurred_at)}
                                {repName ? <> · {repName}</> : null}
                              </p>
                              {/* Round 12 — surface the typeahead-resolved
                                  prospect / company so admins can scan a
                                  long list quickly. */}
                              {(e.prospect_name || e.company_name) && (
                                <p className="text-[11px] text-th-text-secondary mt-0.5 inline-flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3 text-th-text-tertiary" />
                                  {e.prospect_name ?? e.company_name}
                                  {e.prospect_name && e.company_name ? (
                                    <span className="text-th-text-tertiary">
                                      {' '}· {e.company_name}
                                    </span>
                                  ) : null}
                                </p>
                              )}
                            </div>
                            {/* Per-row actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {/* Manual + own row → rep can delete */}
                              {!isAdminView && e.manual && e.user_id === user?.id && (
                                <button
                                  type="button"
                                  title="Delete manual entry"
                                  onClick={() => void deleteOwnManualEntry(e.id)}
                                  className="p-1 rounded hover:bg-surface-secondary text-th-text-tertiary hover:text-red-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {/* Admin: edit/delete any row with audit trail */}
                              {isOrgAdmin && (
                                <button
                                  type="button"
                                  title="Admin correct / delete"
                                  onClick={() => setCorrectingEvent(e)}
                                  className="p-1 rounded hover:bg-surface-secondary text-th-text-tertiary hover:text-th-accent-700"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ManualEntryModal
        open={manualEntryOpen}
        onClose={() => setManualEntryOpen(false)}
        defaultSection={manualEntrySection}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: repQueryKey });
          queryClient.invalidateQueries({
            queryKey: ['leadsWorkedToday', activeOrgId, user?.id, today],
          });
        }}
      />

      <AdminCorrectionModal
        event={correctingEvent}
        onClose={() => setCorrectingEvent(null)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: repQueryKey });
          queryClient.invalidateQueries({ queryKey: adminQueryKey });
        }}
      />
    </div>
  );
}

function prettyType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Round 7 spec: Special Projects time entry accepts minutes (e.g. "45")
// or HH:MM (e.g. "1:30"). Returns the integer minute count, or null when
// the value is unparseable / negative.
function parseTimeToMinutes(raw: string): number | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.includes(':')) {
    const [h, m] = trimmed.split(':').map((p) => p.trim());
    const hours = Number.parseInt(h, 10);
    const minutes = Number.parseInt(m, 10);
    if (!Number.isFinite(hours) || hours < 0) return null;
    if (!Number.isFinite(minutes) || minutes < 0 || minutes >= 60) return null;
    return hours * 60 + minutes;
  }
  const minutes = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(minutes) || minutes < 0) return null;
  return minutes;
}
