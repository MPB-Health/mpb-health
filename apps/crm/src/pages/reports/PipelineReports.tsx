import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BarChart3, AlertTriangle, Layers, Target, Loader2 } from 'lucide-react';
import { GradientHeader } from '@mpbhealth/ui';
import { supabase } from '../../lib/supabase';
import { useOrg } from '../../contexts/OrgContext';
import { formatTimeAgo } from '@mpbhealth/crm-core';

// ----------------------------------------------------------------------------
// CRM rebuild Phase 6 — Pipeline Reports skeleton
// ----------------------------------------------------------------------------
// One-stop page that surfaces every pipeline-shaped report listed in
// Section 2e + Section 3:
//
//   • Pipeline Movement (per-stage totals + 7-day deltas)
//   • Conversion by Source (win-rate per lead_source)
//   • Application Drop-off (per-week funnel inside Stage 5)
//   • Stalled-in-Stage alerts (per-stage SLA breaches)
//
// All four are SECURITY DEFINER views/RPCs gated by org membership, so
// the only thing the page needs to do is read them. No mutations here —
// stalled leads link straight into the lead profile so reps can act.

interface PipelineMovementRow {
  org_id: string;
  pipeline_stage: string;
  total: number;
  new_last_7d: number;
  advanced_last_7d: number;
  won_last_7d: number;
  lost_last_7d: number;
  nurtured_last_7d: number;
}

interface ConversionRow {
  org_id: string;
  lead_source: string;
  total: number;
  won: number;
  lost: number;
  nurtured: number;
  win_rate_pct: number | null;
}

interface AppDropoffRow {
  org_id: string;
  week_starting: string;
  app_in_progress: number;
  app_to_lost: number;
  app_to_won: number;
  app_to_nurture: number;
}

interface StalledRow {
  lead_id: string;
  pipeline_stage: string;
  stage_changed_at: string;
  hours_in_stage: number;
  sla_hours: number;
}

const STAGE_LABEL: Record<string, string> = {
  new: 'New',
  quoted: 'Quoted',
  working: 'Working',
  engaged: 'Engaged / Qualifying',
  application_in_progress: 'Application in Progress',
  won: 'Won — Enrolled',
  nurture: 'Nurture',
  lost: 'Lost',
};

const STAGE_ORDER = [
  'new',
  'quoted',
  'working',
  'engaged',
  'application_in_progress',
  'won',
  'nurture',
  'lost',
];

export default function PipelineReports() {
  const { activeOrgId } = useOrg();

  const { data: movement = [], isLoading: loadingMovement } = useQuery({
    queryKey: ['report.pipelineMovement', activeOrgId],
    enabled: !!activeOrgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_v_pipeline_movement')
        .select('*')
        .eq('org_id', activeOrgId!);
      if (error) throw error;
      return (data ?? []) as PipelineMovementRow[];
    },
    staleTime: 60_000,
  });

  const { data: conversion = [], isLoading: loadingConversion } = useQuery({
    queryKey: ['report.conversionBySource', activeOrgId],
    enabled: !!activeOrgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_v_conversion_by_source')
        .select('*')
        .eq('org_id', activeOrgId!)
        .order('total', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ConversionRow[];
    },
    staleTime: 60_000,
  });

  const { data: dropoff = [], isLoading: loadingDropoff } = useQuery({
    queryKey: ['report.applicationDropoff', activeOrgId],
    enabled: !!activeOrgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_v_application_dropoff')
        .select('*')
        .eq('org_id', activeOrgId!)
        .order('week_starting', { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data ?? []) as AppDropoffRow[];
    },
    staleTime: 60_000,
  });

  const { data: stalled = [], isLoading: loadingStalled } = useQuery({
    queryKey: ['report.stalledInStage', activeOrgId],
    enabled: !!activeOrgId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('crm_scan_stalled_in_stage', {
        p_org_id: activeOrgId!,
      });
      if (error) throw error;
      return (data ?? []) as StalledRow[];
    },
    staleTime: 60_000,
  });

  const movementSorted = useMemo(
    () =>
      [...movement].sort(
        (a, b) =>
          STAGE_ORDER.indexOf(a.pipeline_stage) - STAGE_ORDER.indexOf(b.pipeline_stage),
      ),
    [movement],
  );

  const totals = useMemo(() => {
    const t = { total: 0, new7: 0, advanced7: 0, won7: 0, lost7: 0, nurtured7: 0 };
    for (const r of movement) {
      t.total += r.total;
      t.new7 += r.new_last_7d;
      t.advanced7 += r.advanced_last_7d;
      t.won7 += r.won_last_7d;
      t.lost7 += r.lost_last_7d;
      t.nurtured7 += r.nurtured_last_7d;
    }
    return t;
  }, [movement]);

  const stalledByStage = useMemo(() => {
    const m = new Map<string, StalledRow[]>();
    for (const s of stalled) {
      if (!m.has(s.pipeline_stage)) m.set(s.pipeline_stage, []);
      m.get(s.pipeline_stage)!.push(s);
    }
    return m;
  }, [stalled]);

  return (
    <div className="space-y-6">
      <Link
        to="/reports"
        className="inline-flex items-center gap-1 text-xs text-th-text-tertiary hover:text-th-text-secondary"
      >
        <ArrowLeft className="w-3 h-3" /> Back to reports
      </Link>

      <GradientHeader
        title="Pipeline Reports"
        subtitle="Stage-to-stage conversion, source performance, application drop-off, and stalled-in-stage alerts."
        icon={<BarChart3 className="w-5 h-5" />}
        size="sm"
      />

      {/* Pipeline Movement */}
      <section className="bg-surface-primary rounded-2xl border border-th-border overflow-hidden">
        <header className="px-6 py-4 border-b border-th-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-th-accent-600" />
            <h2 className="text-sm font-semibold text-th-text-primary">Pipeline Movement</h2>
          </div>
          <span className="text-xs text-th-text-tertiary">7-day deltas</span>
        </header>
        {loadingMovement ? (
          <Loading />
        ) : movementSorted.length === 0 ? (
          <Empty label="No pipeline data yet." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-secondary text-th-text-tertiary text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-6 py-2.5">Stage</th>
                <th className="text-right px-6 py-2.5">Total</th>
                <th className="text-right px-6 py-2.5">New (7d)</th>
                <th className="text-right px-6 py-2.5">Advanced (7d)</th>
                <th className="text-right px-6 py-2.5">Won (7d)</th>
                <th className="text-right px-6 py-2.5">Lost (7d)</th>
                <th className="text-right px-6 py-2.5">Nurture (7d)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-th-border-subtle">
              {movementSorted.map((r) => (
                <tr key={r.pipeline_stage}>
                  <td className="px-6 py-2.5 font-medium">
                    {STAGE_LABEL[r.pipeline_stage] ?? r.pipeline_stage}
                  </td>
                  <td className="px-6 py-2.5 text-right tabular-nums">{r.total}</td>
                  <td className="px-6 py-2.5 text-right tabular-nums text-blue-600">
                    {r.new_last_7d}
                  </td>
                  <td className="px-6 py-2.5 text-right tabular-nums text-th-accent-700">
                    {r.advanced_last_7d}
                  </td>
                  <td className="px-6 py-2.5 text-right tabular-nums text-emerald-600">
                    {r.won_last_7d}
                  </td>
                  <td className="px-6 py-2.5 text-right tabular-nums text-red-500">
                    {r.lost_last_7d}
                  </td>
                  <td className="px-6 py-2.5 text-right tabular-nums text-amber-600">
                    {r.nurtured_last_7d}
                  </td>
                </tr>
              ))}
              <tr className="bg-surface-secondary/40 font-semibold">
                <td className="px-6 py-2.5">Total</td>
                <td className="px-6 py-2.5 text-right tabular-nums">{totals.total}</td>
                <td className="px-6 py-2.5 text-right tabular-nums">{totals.new7}</td>
                <td className="px-6 py-2.5 text-right tabular-nums">{totals.advanced7}</td>
                <td className="px-6 py-2.5 text-right tabular-nums">{totals.won7}</td>
                <td className="px-6 py-2.5 text-right tabular-nums">{totals.lost7}</td>
                <td className="px-6 py-2.5 text-right tabular-nums">{totals.nurtured7}</td>
              </tr>
            </tbody>
          </table>
        )}
      </section>

      {/* Conversion by Source */}
      <section className="bg-surface-primary rounded-2xl border border-th-border overflow-hidden">
        <header className="px-6 py-4 border-b border-th-border flex items-center gap-2">
          <Target className="w-4 h-4 text-th-accent-600" />
          <h2 className="text-sm font-semibold text-th-text-primary">Conversion by Source</h2>
        </header>
        {loadingConversion ? (
          <Loading />
        ) : conversion.length === 0 ? (
          <Empty label="No source data yet." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-secondary text-th-text-tertiary text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-6 py-2.5">Source</th>
                <th className="text-right px-6 py-2.5">Total</th>
                <th className="text-right px-6 py-2.5">Won</th>
                <th className="text-right px-6 py-2.5">Lost</th>
                <th className="text-right px-6 py-2.5">Nurtured</th>
                <th className="text-right px-6 py-2.5">Win rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-th-border-subtle">
              {conversion.map((r) => (
                <tr key={r.lead_source}>
                  <td className="px-6 py-2.5 font-medium">{r.lead_source}</td>
                  <td className="px-6 py-2.5 text-right tabular-nums">{r.total}</td>
                  <td className="px-6 py-2.5 text-right tabular-nums text-emerald-600">{r.won}</td>
                  <td className="px-6 py-2.5 text-right tabular-nums text-red-500">{r.lost}</td>
                  <td className="px-6 py-2.5 text-right tabular-nums text-amber-600">
                    {r.nurtured}
                  </td>
                  <td className="px-6 py-2.5 text-right tabular-nums font-semibold">
                    {r.win_rate_pct == null ? '—' : `${Number(r.win_rate_pct).toFixed(1)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Application Drop-off */}
      <section className="bg-surface-primary rounded-2xl border border-th-border overflow-hidden">
        <header className="px-6 py-4 border-b border-th-border flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-th-accent-600" />
          <h2 className="text-sm font-semibold text-th-text-primary">Application Drop-off</h2>
        </header>
        {loadingDropoff ? (
          <Loading />
        ) : dropoff.length === 0 ? (
          <Empty label="No applications started yet." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-secondary text-th-text-tertiary text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-6 py-2.5">Week</th>
                <th className="text-right px-6 py-2.5">In Progress</th>
                <th className="text-right px-6 py-2.5">→ Won</th>
                <th className="text-right px-6 py-2.5">→ Lost</th>
                <th className="text-right px-6 py-2.5">→ Nurture</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-th-border-subtle">
              {dropoff.map((r) => (
                <tr key={r.week_starting}>
                  <td className="px-6 py-2.5 font-medium">
                    {new Date(r.week_starting).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-2.5 text-right tabular-nums">{r.app_in_progress}</td>
                  <td className="px-6 py-2.5 text-right tabular-nums text-emerald-600">
                    {r.app_to_won}
                  </td>
                  <td className="px-6 py-2.5 text-right tabular-nums text-red-500">
                    {r.app_to_lost}
                  </td>
                  <td className="px-6 py-2.5 text-right tabular-nums text-amber-600">
                    {r.app_to_nurture}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Stalled in Stage */}
      <section className="bg-surface-primary rounded-2xl border border-th-border overflow-hidden">
        <header className="px-6 py-4 border-b border-th-border flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-th-text-primary">Stalled in Stage</h2>
        </header>
        {loadingStalled ? (
          <Loading />
        ) : stalled.length === 0 ? (
          <Empty label="No stalled leads — every stage is inside SLA." />
        ) : (
          <div className="divide-y divide-th-border-subtle">
            {STAGE_ORDER.map((stage) => {
              const rows = stalledByStage.get(stage);
              if (!rows || rows.length === 0) return null;
              return (
                <div key={stage} className="px-6 py-3">
                  <p className="text-xs uppercase tracking-wider text-th-text-tertiary mb-2">
                    {STAGE_LABEL[stage] ?? stage} · {rows.length} stalled
                  </p>
                  <ul className="space-y-1">
                    {rows.slice(0, 10).map((r) => (
                      <li key={r.lead_id} className="flex items-center justify-between text-sm">
                        <Link
                          to={`/leads/${r.lead_id}`}
                          className="text-th-accent-700 hover:underline truncate max-w-md"
                        >
                          Lead {r.lead_id.slice(0, 8)}…
                        </Link>
                        <span className="text-xs text-th-text-tertiary tabular-nums">
                          {Math.round(r.hours_in_stage)}h in stage · SLA {r.sla_hours}h ·{' '}
                          {formatTimeAgo(r.stage_changed_at)}
                        </span>
                      </li>
                    ))}
                    {rows.length > 10 && (
                      <li className="text-xs text-th-text-tertiary">
                        +{rows.length - 10} more stalled leads in {STAGE_LABEL[stage] ?? stage}
                      </li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Loading() {
  return (
    <div className="p-6 text-center text-th-text-tertiary text-sm">
      <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" /> Loading…
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="p-6 text-center text-th-text-tertiary text-xs">{label}</div>;
}
