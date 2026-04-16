import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { differenceInCalendarDays } from 'date-fns';
import toast from 'react-hot-toast';
import {
  Plus, BarChart3, Sparkles, Users, Eye, Megaphone, FileText,
  Zap, Shield, TrendingDown, Target, Clock, DollarSign,
} from 'lucide-react';
import { useCRMService } from '../contexts/CRMServiceContext';
import { useOrg } from '../contexts/OrgContext';
import { crmQueryKeys } from '../query/crmQueryKeys';
import { GradientHeader } from '@mpbhealth/ui';
import { HelpBanner } from '../components/help';
import type { CadenceStep } from '@mpbhealth/crm-core';
import {
  ReactivationAnalyticsModal,
  AIReengagementScorer,
  BulkReactivationModal,
  CadencePreviewModal,
  WinBackCampaignModal,
  ReengagementScriptModal,
  AutoReactivationRulesModal,
  CompetitivePitchModal,
  LeadDecayInsightsModal,
  ReactivationCohortModal,
  ContactTimelineModal,
  ReactivationForecastModal,
} from '../components/reactivation';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface StaleLeadRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  pipeline_stage: string | null;
  last_contacted_at: string | null;
}

const CLOSED_STAGES = '(won,converted,closed_won)';

export default function Reactivation() {
  const { supabase, cadenceService } = useCRMService();
  const { activeOrgId } = useOrg();
  const queryClient = useQueryClient();

  const [minDaysInactive, setMinDaysInactive] = useState(90);
  const [stageFilter, setStageFilter] = useState<string>('all');

  // Modal state
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAIScorer, setShowAIScorer] = useState(false);
  const [showBulkEnroll, setShowBulkEnroll] = useState(false);
  const [showCadencePreview, setShowCadencePreview] = useState(false);
  const [showWinBack, setShowWinBack] = useState(false);
  const [showScripts, setShowScripts] = useState(false);
  const [showAutoRules, setShowAutoRules] = useState(false);
  const [showCompetitivePitch, setShowCompetitivePitch] = useState(false);
  const [showDecayInsights, setShowDecayInsights] = useState(false);
  const [showCohorts, setShowCohorts] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showForecast, setShowForecast] = useState(false);
  const [timelineLeadId, setTimelineLeadId] = useState<string>('');
  const [timelineLeadName, setTimelineLeadName] = useState<string>('');

  const stageKey = stageFilter;

  const { data: cadences = [] } = useQuery({
    queryKey: crmQueryKeys.cadences(activeOrgId),
    queryFn: () => cadenceService.getCadences(),
    enabled: !!activeOrgId,
  });

  const reactivationCadence = useMemo(
    () => cadences.find((x) => x.is_active && x.name.toLowerCase().includes('reactivation')) ?? null,
    [cadences],
  );
  const reactivationCadenceId = reactivationCadence?.id ?? null;

  const DEFAULT_REACTIVATION_STEPS: CadenceStep[] = [
    { delay_hours: 0, action_type: 'email', description: 'Re-engagement email — check in and offer help' },
    { delay_hours: 48, action_type: 'call', description: 'Follow-up call — personal touch' },
    { delay_hours: 120, action_type: 'email', description: 'Value-add email — share a relevant resource' },
    { delay_hours: 240, action_type: 'call', description: 'Second call attempt' },
    { delay_hours: 336, action_type: 'email', description: 'Final reactivation email — last chance offer' },
  ];

  const createCadenceMutation = useMutation({
    mutationFn: () =>
      cadenceService.createCadence({
        name: 'Reactivation',
        steps: DEFAULT_REACTIVATION_STEPS,
        is_default: !cadences.some((c) => c.is_default),
        is_active: true,
      }),
    onSuccess: (result) => {
      if (result) {
        toast.success('Reactivation cadence created');
        queryClient.invalidateQueries({ queryKey: crmQueryKeys.cadences(activeOrgId) });
      } else {
        toast.error('Failed to create cadence — check permissions');
      }
    },
    onError: () => toast.error('Failed to create cadence'),
  });

  const { data: staleLeads = [], isLoading } = useQuery({
    queryKey: crmQueryKeys.reactivationStaleLeads(activeOrgId, minDaysInactive, stageKey),
    enabled: !!activeOrgId,
    queryFn: async (): Promise<StaleLeadRow[]> => {
      let q = supabase
        .from('lead_submissions')
        .select('id, first_name, last_name, email, pipeline_stage, last_contacted_at')
        .eq('org_id', activeOrgId!)
        .not('pipeline_stage', 'in', CLOSED_STAGES)
        .order('last_contacted_at', { ascending: true, nullsFirst: true })
        .limit(800);

      if (stageFilter !== 'all') {
        q = q.eq('pipeline_stage', stageFilter);
      }

      const { data, error } = await q;
      if (error || !data) {
        console.error('Reactivation leads query failed:', error);
        return [];
      }

      const now = Date.now();
      const minMs = minDaysInactive * 86_400_000;

      return (data as unknown as StaleLeadRow[]).filter((row) => {
        if (!row.last_contacted_at) return true;
        return now - new Date(row.last_contacted_at).getTime() >= minMs;
      });
    },
  });

  const enrollMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const cadenceId = reactivationCadenceId ?? undefined;
      const state = await cadenceService.enrollLead(leadId, cadenceId);
      return { state, usedCadenceId: cadenceId };
    },
    onSuccess: ({ state }, leadId) => {
      queryClient.invalidateQueries({
        queryKey: crmQueryKeys.reactivationStaleLeads(activeOrgId, minDaysInactive, stageKey),
      });
      if (leadId) {
        queryClient.invalidateQueries({ queryKey: crmQueryKeys.leadCadenceState(activeOrgId, leadId) });
      }
      if (state) toast.success('Enrolled in reactivation cadence');
      else
        toast.error(
          reactivationCadenceId || cadences.some((c) => c.is_default)
            ? 'Could not enroll (check cadence steps and permissions)'
            : 'Set up an active cadence named “Reactivation” or mark a default cadence'
        );
    },
    onError: () => toast.error('Enrollment failed'),
  });

  const displayName = (row: StaleLeadRow) =>
    [row.first_name, row.last_name].filter(Boolean).join(' ') || row.email || 'Lead';

  const daysSinceContact = (row: StaleLeadRow) => {
    if (!row.last_contacted_at) return null;
    return differenceInCalendarDays(new Date(), new Date(row.last_contacted_at));
  };

  const openTimeline = useCallback((row: StaleLeadRow) => {
    setTimelineLeadId(row.id);
    setTimelineLeadName(displayName(row));
    setShowTimeline(true);
  }, []);

  const TOOLBAR_ACTIONS = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'text-blue-500', action: () => setShowAnalytics(true) },
    { id: 'ai-score', label: 'AI Score', icon: Sparkles, color: 'text-violet-500', action: () => setShowAIScorer(true) },
    { id: 'bulk-enroll', label: 'Bulk Enroll', icon: Users, color: 'text-green-500', action: () => setShowBulkEnroll(true) },
    { id: 'cadence', label: 'Cadence', icon: Eye, color: 'text-cyan-500', action: () => setShowCadencePreview(true) },
    { id: 'win-back', label: 'Win-Back', icon: Megaphone, color: 'text-orange-500', action: () => setShowWinBack(true) },
    { id: 'scripts', label: 'Scripts', icon: FileText, color: 'text-amber-500', action: () => setShowScripts(true) },
    { id: 'auto-rules', label: 'Auto Rules', icon: Zap, color: 'text-yellow-500', action: () => setShowAutoRules(true) },
    { id: 'pitch', label: 'Pitch', icon: Shield, color: 'text-red-500', action: () => setShowCompetitivePitch(true) },
    { id: 'decay', label: 'Decay', icon: TrendingDown, color: 'text-rose-500', action: () => setShowDecayInsights(true) },
    { id: 'cohorts', label: 'Cohorts', icon: Target, color: 'text-emerald-500', action: () => setShowCohorts(true) },
    { id: 'forecast', label: 'Forecast', icon: DollarSign, color: 'text-green-500', action: () => setShowForecast(true) },
  ];

  return (
    <div className="space-y-6">
      <GradientHeader
        title="Reactivation pipeline"
        subtitle="Open leads with no recent contact — enroll into a follow-up cadence to bring them back."
      />
      <HelpBanner pageKey="reactivation" title="Welcome to Lead Reactivation" tip="Re-engage leads that have gone cold. Filter by last activity date, plan interest, or source to find leads worth reaching out to again during AEP, OEP, or SEP windows." />

      {/* Power Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-th-border bg-surface-primary p-2">
        {TOOLBAR_ACTIONS.map((a) => (
          <button key={a.id} onClick={a.action}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-th-text-secondary hover:text-th-text-primary hover:bg-surface-tertiary/80 transition-colors">
            <a.icon className={cn('w-3.5 h-3.5', a.color)} />
            <span className="hidden sm:inline">{a.label}</span>
          </button>
        ))}
      </div>

      {!reactivationCadenceId && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3 text-sm text-amber-900 dark:text-amber-100 flex items-center justify-between gap-4">
          <span>
            No active reactivation cadence found. Enrollment will fall back to the org default cadence
            if one exists, or you can create one now with a 5-step follow-up sequence.
          </span>
          <button
            type="button"
            disabled={createCadenceMutation.isPending}
            onClick={() => createCadenceMutation.mutate()}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-60"
          >
            <Plus className="w-3.5 h-3.5" />
            {createCadenceMutation.isPending ? 'Creating…' : 'Create Reactivation Cadence'}
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-th-border bg-surface-primary p-4">
        <label className="text-sm text-th-text-secondary flex items-center gap-2">
          Min. days inactive
          <select
            value={minDaysInactive}
            onChange={(e) => setMinDaysInactive(Number(e.target.value))}
            className="rounded-lg border border-th-border bg-surface-primary px-2 py-1.5 text-sm text-th-text-primary focus:outline-none focus:ring-1 focus:ring-th-accent-500"
          >
            {[30, 60, 90, 120, 180].map((d) => (
              <option key={d} value={d}>
                {d}+ days
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-th-text-secondary flex items-center gap-2">
          Pipeline stage
          <input
            list="reactivation-stages"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value || 'all')}
            placeholder="all"
            className="rounded-lg border border-th-border bg-surface-primary px-2 py-1.5 text-sm text-th-text-primary w-44"
          />
          <datalist id="reactivation-stages">
            <option value="all" />
            <option value="new" />
            <option value="contacted" />
            <option value="qualified" />
            <option value="proposal" />
            <option value="negotiation" />
          </datalist>
        </label>
      </div>

      <div className="rounded-xl border border-th-border bg-surface-primary overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-th-accent-600 border-t-transparent" />
          </div>
        ) : staleLeads.length === 0 ? (
          <p className="py-12 text-center text-sm text-th-text-tertiary">
            No stale leads match these filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-th-border bg-th-accent-50/40 dark:bg-th-accent-900/10">
                  <th className="text-left px-4 py-3 font-medium text-th-text-secondary">Lead</th>
                  <th className="text-left px-4 py-3 font-medium text-th-text-secondary">Stage</th>
                  <th className="text-left px-4 py-3 font-medium text-th-text-secondary">
                    Last contacted
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-th-text-secondary">Action</th>
                </tr>
              </thead>
              <tbody>
                {staleLeads.map((row) => {
                  const days = daysSinceContact(row);
                  return (
                    <tr key={row.id} className="border-b border-th-border last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          to={`/leads/${row.id}`}
                          className="font-medium text-th-accent-600 hover:underline"
                        >
                          {displayName(row)}
                        </Link>
                        {row.email && (
                          <p className="text-xs text-th-text-tertiary mt-0.5">{row.email}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-th-text-secondary">
                        {row.pipeline_stage || '—'}
                      </td>
                      <td className="px-4 py-3 text-th-text-secondary">
                        {row.last_contacted_at
                          ? `${new Date(row.last_contacted_at).toLocaleDateString()} (${days}d ago)`
                          : 'Never'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => openTimeline(row)}
                            className="rounded-lg border border-th-border px-2.5 py-1.5 text-xs font-medium text-th-text-secondary hover:bg-surface-secondary transition-colors"
                          >
                            <Clock className="w-3 h-3 inline mr-1" />Timeline
                          </button>
                          <button
                            type="button"
                            disabled={enrollMutation.isPending}
                            onClick={() => enrollMutation.mutate(row.id)}
                            className="rounded-lg bg-th-accent-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-th-accent-700 disabled:opacity-60"
                          >
                            Enroll
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* ---- Reactivation Power Modals ---- */}
      <ReactivationAnalyticsModal open={showAnalytics} onClose={() => setShowAnalytics(false)} staleLeadCount={staleLeads.length} />
      <AIReengagementScorer
        open={showAIScorer}
        onClose={() => setShowAIScorer(false)}
        onEnrollLead={(leadId) => { enrollMutation.mutate(leadId); setShowAIScorer(false); }}
      />
      <BulkReactivationModal
        open={showBulkEnroll}
        onClose={() => setShowBulkEnroll(false)}
        leads={staleLeads.map((r) => ({
          id: r.id,
          name: displayName(r),
          email: r.email,
          stage: r.pipeline_stage,
          daysSinceContact: daysSinceContact(r),
        }))}
        onBulkEnroll={async (leadIds) => {
          let count = 0;
          for (const id of leadIds) {
            try { await cadenceService.enrollLead(id, reactivationCadenceId ?? undefined); count++; } catch { /* skip */ }
          }
          queryClient.invalidateQueries({ queryKey: crmQueryKeys.reactivationStaleLeads(activeOrgId, minDaysInactive, stageKey) });
          toast.success(`Enrolled ${count} leads`);
          return count;
        }}
      />
      <CadencePreviewModal
        open={showCadencePreview}
        onClose={() => setShowCadencePreview(false)}
        cadenceName={reactivationCadence?.name || 'Reactivation'}
      />
      <WinBackCampaignModal open={showWinBack} onClose={() => setShowWinBack(false)} totalStaleLeads={staleLeads.length} />
      <ReengagementScriptModal open={showScripts} onClose={() => setShowScripts(false)} />
      <AutoReactivationRulesModal open={showAutoRules} onClose={() => setShowAutoRules(false)} />
      <CompetitivePitchModal open={showCompetitivePitch} onClose={() => setShowCompetitivePitch(false)} />
      <LeadDecayInsightsModal open={showDecayInsights} onClose={() => setShowDecayInsights(false)} />
      <ReactivationCohortModal open={showCohorts} onClose={() => setShowCohorts(false)} />
      <ContactTimelineModal
        open={showTimeline}
        onClose={() => setShowTimeline(false)}
        leadName={timelineLeadName}
        leadId={timelineLeadId}
      />
      <ReactivationForecastModal open={showForecast} onClose={() => setShowForecast(false)} staleLeadCount={staleLeads.length} />
    </div>
  );
}
