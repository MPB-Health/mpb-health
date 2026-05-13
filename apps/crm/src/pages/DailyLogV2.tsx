import { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import { GradientHeader } from '@mpbhealth/ui';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useOrg } from '../contexts/OrgContext';
import { formatTimeAgo } from '@mpbhealth/crm-core';

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

const SECTIONS: { key: Section; label: string; icon: typeof Mail; description: string }[] = [
  {
    key: 'lead_communication',
    label: 'Lead Communication',
    icon: Mail,
    description: 'Calls, emails, SMS, notes — auto-captured from CRM activity',
  },
  {
    key: 'linkedin_activity',
    label: 'LinkedIn Activity',
    icon: Linkedin,
    description: 'Connection requests, DMs, post engagement — auto-captured',
  },
  {
    key: 'pipeline',
    label: 'Pipeline',
    icon: Briefcase,
    description: 'Stage changes, meetings, proposals, demos',
  },
  {
    key: 'deals_closed',
    label: 'Deals Closed',
    icon: Trophy,
    description: 'Quote sent → Won — Enrolled transitions',
  },
  {
    key: 'activities',
    label: 'Activities',
    icon: Activity,
    description: 'Networking events, community outreach, referrals asked',
  },
  {
    key: 'content_creation',
    label: 'Content Creation',
    icon: Sparkles,
    description: 'Webinars, posts, social, content drafted',
  },
  {
    key: 'special_projects',
    label: 'Special Projects',
    icon: ClipboardList,
    description: 'Manual entries — projects outside the standard pipeline',
  },
];

export default function DailyLogV2() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { activeOrgId } = useOrg();

  const [openSections, setOpenSections] = useState<Record<Section, boolean>>({
    lead_communication: true,
    linkedin_activity: false,
    pipeline: true,
    deals_closed: false,
    activities: false,
    content_creation: false,
    special_projects: false,
  });

  // ── Today's events (Realtime subscription) ──────────────────────────────
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['dailyLogEvents', activeOrgId, user?.id, today],
    enabled: !!activeOrgId && !!user?.id,
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

  // Section 8: Realtime — refetch as soon as a new event lands.
  useEffect(() => {
    if (!activeOrgId || !user?.id) return;
    const channel = supabase
      .channel(`daily-log-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'crm_daily_log_events',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ['dailyLogEvents', activeOrgId, user.id, today],
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeOrgId, user?.id, today, queryClient]);

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

  const totalToday = events.length;

  const toggleSection = (key: Section) => {
    setOpenSections((s) => ({ ...s, [key]: !s[key] }));
  };

  // ── Special Projects manual entry ──────────────────────────────────────
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectMinutes, setProjectMinutes] = useState('');
  const [projectNotes, setProjectNotes] = useState('');
  const [savingProject, setSavingProject] = useState(false);

  const handleSaveProject = async () => {
    if (!activeOrgId || !user?.id) return;
    if (!projectName.trim()) {
      toast.error('Project name is required');
      return;
    }
    const minutes = parseInt(projectMinutes, 10);
    if (!Number.isFinite(minutes) || minutes < 0) {
      toast.error('Enter minutes (positive number)');
      return;
    }
    setSavingProject(true);
    const { error } = await supabase.from('crm_special_projects').insert({
      org_id: activeOrgId,
      user_id: user.id,
      log_date: today,
      project_name: projectName.trim(),
      time_minutes: minutes,
      notes: projectNotes.trim() || null,
    });
    setSavingProject(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Special project logged');
    setProjectName('');
    setProjectMinutes('');
    setProjectNotes('');
    setShowProjectForm(false);
    queryClient.invalidateQueries({
      queryKey: ['dailyLogEvents', activeOrgId, user.id, today],
    });
  };

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <GradientHeader
        title="Daily Log"
        subtitle="Auto-captured per Section 11. Manual entries are flagged."
        icon={<ClipboardList className="w-5 h-5" />}
        size="sm"
        actions={
          <div className="text-xs text-th-text-tertiary">
            <span className="font-semibold tabular-nums text-th-text-primary">{totalToday}</span>{' '}
            events today
          </div>
        }
      />

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
                  {key === 'special_projects' && (
                    <div className="p-4 border-b border-th-border-subtle">
                      {showProjectForm ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                          <input
                            type="text"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="Project name"
                            className="border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
                          />
                          <input
                            type="number"
                            min={0}
                            value={projectMinutes}
                            onChange={(e) => setProjectMinutes(e.target.value)}
                            placeholder="Minutes"
                            className="border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleSaveProject}
                              disabled={savingProject}
                              className="flex-1 px-3 py-2 text-xs font-medium text-white bg-th-accent-600 rounded-lg hover:bg-th-accent-700 disabled:opacity-50"
                            >
                              {savingProject ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowProjectForm(false)}
                              className="px-3 py-2 text-xs font-medium border border-th-border rounded-lg hover:bg-surface-secondary"
                            >
                              Cancel
                            </button>
                          </div>
                          <textarea
                            value={projectNotes}
                            onChange={(e) => setProjectNotes(e.target.value)}
                            placeholder="Notes (optional)"
                            rows={2}
                            className="sm:col-span-3 border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
                          />
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
                      {sectionEvents.map((e) => (
                        <li key={e.id} className="px-5 py-3 flex items-start gap-3">
                          <span className="mt-1 inline-block w-2 h-2 rounded-full bg-th-accent-500" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-th-text-primary truncate">
                                {e.description || prettyType(e.activity_type)}
                              </p>
                              {e.manual ? (
                                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                                  manual
                                </span>
                              ) : (
                                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 inline-flex items-center gap-0.5">
                                  <Lock className="w-2.5 h-2.5" /> auto
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-th-text-tertiary mt-0.5">
                              {prettyType(e.activity_type)} · {e.source} ·{' '}
                              {formatTimeAgo(e.occurred_at)}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function prettyType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
