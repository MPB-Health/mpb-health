import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GradientHeader } from '@mpbhealth/ui';
import {
  TrendingUp,
  TrendingDown,
  Users,
  XCircle,
  CheckCircle2,
  Calendar,
  Filter,
} from 'lucide-react';
import { useCRMService } from '../../contexts/CRMServiceContext';
import { useOrg } from '../../contexts/OrgContext';
import { useTrackedReps } from '../../hooks/useTrackedReps';
import { useIsLeadManager } from '../../hooks/useIsLeadManager';
import { useAuth } from '../../contexts/AuthContext';
import { crmQueryKeys } from '../../query/crmQueryKeys';

// ----------------------------------------------------------------------------
// CRM rebuild — Round 13 (2026-05-15)
// ----------------------------------------------------------------------------
// Sales vs. Cancellations vs. Leads Snapshot — single comparative report
// inside Reports (Section 2e). Surfaces:
//   • Sales         (lead_submissions.enrollment_approved_at in range)
//   • Cancellations (crm_daily_log_events with cancellation subtype)
//   • New Leads     (lead_submissions.created_at in range)
//   • Net           (sales – cancellations)
//
// Period selector exposes both Week and Month views — for each, we render
// the current-to-date number side-by-side with the trailing window so an
// admin can spot dips at a glance:
//   Week  → current week-to-date vs trailing 7 days
//   Month → current month-to-date vs trailing 30 days
//
// Per-rep filter: matches the Section 5 / Round 12 Addendum salesperson
// pattern (Adam / Tupac / All). Per-source cut: New Leads + Sales segmented
// by Section 13 lead-source labels. Cancellations are shown as a single
// row total — they live on the Daily Log event, not the lead, so source
// attribution at the call level isn't 1:1 (documented in the migration).

type PeriodMode = 'week' | 'month';

interface SnapshotRow {
  row_kind: 'total' | 'source';
  source: string | null;
  new_leads: number;
  sales: number;
  cancellations: number;
  net: number;
}

interface RangeMeta {
  label: string;
  startISO: string;
  endISO: string;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

/** ISO Monday of the week containing `d` (00:00 local). */
function startOfIsoWeek(d: Date): Date {
  const x = startOfDay(d);
  const day = x.getDay() || 7; // Sunday = 7 so Monday = 1
  if (day !== 1) x.setDate(x.getDate() - (day - 1));
  return x;
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function rangesFor(mode: PeriodMode, now = new Date()): { current: RangeMeta; trailing: RangeMeta } {
  const exclusiveEnd = addDays(startOfDay(now), 1); // up to "now"; treat as < tomorrow 00:00

  if (mode === 'week') {
    const weekStart = startOfIsoWeek(now);
    return {
      current: {
        label: 'This week (to date)',
        startISO: weekStart.toISOString(),
        endISO: exclusiveEnd.toISOString(),
      },
      trailing: {
        label: 'Trailing 7 days',
        startISO: addDays(exclusiveEnd, -7).toISOString(),
        endISO: exclusiveEnd.toISOString(),
      },
    };
  }
  const monthStart = startOfMonth(now);
  return {
    current: {
      label: 'This month (to date)',
      startISO: monthStart.toISOString(),
      endISO: exclusiveEnd.toISOString(),
    },
    trailing: {
      label: 'Trailing 30 days',
      startISO: addDays(exclusiveEnd, -30).toISOString(),
      endISO: exclusiveEnd.toISOString(),
    },
  };
}

function num(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number(v) || 0;
  return 0;
}

function mapRow(r: Record<string, unknown>): SnapshotRow {
  return {
    row_kind: ((r.row_kind as string) ?? 'source') as SnapshotRow['row_kind'],
    source: r.source == null ? null : String(r.source),
    new_leads: num(r.new_leads),
    sales: num(r.sales),
    cancellations: num(r.cancellations),
    net: num(r.net),
  };
}

interface SnapshotData {
  total: SnapshotRow;
  sources: SnapshotRow[];
}

function emptyTotal(): SnapshotRow {
  return { row_kind: 'total', source: null, new_leads: 0, sales: 0, cancellations: 0, net: 0 };
}

function bucketise(rows: SnapshotRow[]): SnapshotData {
  const total = rows.find((r) => r.row_kind === 'total') ?? emptyTotal();
  const sources = rows.filter((r) => r.row_kind === 'source');
  return { total, sources };
}

export default function SalesCancellationsLeadsSnapshot() {
  const { supabase, orgId } = useCRMService();
  const { orgLoading } = useOrg();
  const { user } = useAuth();
  const isLeadManager = useIsLeadManager();
  // 2026-05-15 — Reports rep roster is restricted to inside-sales reps
  // tracked in reports (users with a `crm_user_conversation_goal_overrides`
  // row). Per the Round 12 Addendum that's Adam + Tupac.
  const { reps: orgReps, isFallback: trackedIsFallback } = useTrackedReps();

  const [mode, setMode] = useState<PeriodMode>('week');
  // RBAC: a non-Lead-Manager only sees themselves (matches the existing
  // Reports rep filter convention).
  const [repFilter, setRepFilter] = useState<string | null>(
    isLeadManager ? null : user?.id ?? null,
  );

  const ranges = useMemo(() => rangesFor(mode), [mode]);

  const effectiveRep = isLeadManager ? repFilter : user?.id ?? null;

  const fetchRange = async (range: RangeMeta) => {
    const { data, error } = await supabase.rpc('crm_sales_cancellations_leads_snapshot', {
      p_org_id: orgId,
      p_period_start: range.startISO,
      p_period_end: range.endISO,
      p_user_id: effectiveRep,
    });
    if (error) throw error;
    return bucketise(((data ?? []) as Record<string, unknown>[]).map(mapRow));
  };

  const enabled = !!orgId && !orgLoading;

  const currentQuery = useQuery({
    queryKey: crmQueryKeys.reportSalesCancellationsLeads(
      orgId,
      ranges.current.startISO,
      ranges.current.endISO,
      effectiveRep,
    ),
    queryFn: () => fetchRange(ranges.current),
    enabled,
    staleTime: 60_000,
  });
  const trailingQuery = useQuery({
    queryKey: crmQueryKeys.reportSalesCancellationsLeads(
      orgId,
      ranges.trailing.startISO,
      ranges.trailing.endISO,
      effectiveRep,
    ),
    queryFn: () => fetchRange(ranges.trailing),
    enabled,
    staleTime: 60_000,
  });

  const isLoading = currentQuery.isLoading || trailingQuery.isLoading;
  const isError = currentQuery.isError || trailingQuery.isError;
  const errorMessage =
    (currentQuery.error instanceof Error ? currentQuery.error.message : null) ??
    (trailingQuery.error instanceof Error ? trailingQuery.error.message : null) ??
    'Failed to load snapshot';

  const current = currentQuery.data ?? { total: emptyTotal(), sources: [] };
  const trailing = trailingQuery.data ?? { total: emptyTotal(), sources: [] };

  // Merge source rows from both ranges into a single table where each row
  // shows current vs trailing side-by-side. Sorted by current sales desc,
  // then current new leads desc.
  const sourceRows = useMemo(() => {
    const map = new Map<string, { current: SnapshotRow; trailing: SnapshotRow }>();
    const ensure = (label: string) => {
      if (!map.has(label)) {
        map.set(label, {
          current: { row_kind: 'source', source: label, new_leads: 0, sales: 0, cancellations: 0, net: 0 },
          trailing: { row_kind: 'source', source: label, new_leads: 0, sales: 0, cancellations: 0, net: 0 },
        });
      }
      return map.get(label)!;
    };
    for (const s of current.sources) {
      ensure(s.source ?? 'Unattributed').current = s;
    }
    for (const s of trailing.sources) {
      ensure(s.source ?? 'Unattributed').trailing = s;
    }
    return Array.from(map.entries())
      .map(([label, v]) => ({ label, ...v }))
      .sort((a, b) =>
        b.current.sales - a.current.sales ||
        b.current.new_leads - a.current.new_leads ||
        a.label.localeCompare(b.label),
      );
  }, [current.sources, trailing.sources]);

  return (
    <div className="space-y-6">
      <GradientHeader
        title="Sales vs. Cancellations vs. Leads"
        subtitle="Sales (won), cancellation calls, and new top-of-funnel volume side by side. Inputs auto-roll from existing capture paths — no manual entry."
      />

      {/* Period + filter bar */}
      <div className="flex flex-wrap items-center gap-3 px-1">
        <div className="inline-flex rounded-lg border border-th-border overflow-hidden">
          {(['week', 'month'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 text-sm font-medium ${
                mode === m
                  ? 'bg-th-accent-600 text-white'
                  : 'bg-surface-primary text-th-text-secondary hover:bg-surface-secondary'
              }`}
            >
              {m === 'week' ? 'Week' : 'Month'}
            </button>
          ))}
        </div>
        <div className="inline-flex items-center gap-2 text-xs text-th-text-tertiary">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            {ranges.current.label} <span className="text-th-text-tertiary/70">vs</span>{' '}
            {ranges.trailing.label}
          </span>
        </div>
        <div className="flex-1" />
        {isLeadManager && (
          <label className="flex items-center gap-2 text-sm text-th-text-secondary">
            <Filter className="h-3.5 w-3.5" />
            <span className="font-medium">Rep:</span>
            <select
              value={repFilter ?? 'all'}
              onChange={(e) => setRepFilter(e.target.value === 'all' ? null : e.target.value)}
              className="border border-th-border rounded-lg px-3 py-1.5 bg-surface-primary text-sm"
            >
              <option value="all">All tracked reps (team total)</option>
              {orgReps.map((r) => (
                <option key={r.user_id} value={r.user_id}>
                  {r.display_name}
                </option>
              ))}
            </select>
            {trackedIsFallback && (
              <span
                className="text-[11px] text-th-text-tertiary"
                title="No inside-sales reps configured yet. Seed Adam + Tupac in Settings → Daily Log → Conversation goals to scope reports to the tracked roster."
              >
                (showing all org members)
              </span>
            )}
          </label>
        )}
      </div>

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorMessage}
        </div>
      )}

      {/* Totals — current period */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <MetricTile
          label="New Leads"
          icon={Users}
          color="sky"
          current={current.total.new_leads}
          trailing={trailing.total.new_leads}
          currentLabel={ranges.current.label}
          trailingLabel={ranges.trailing.label}
          loading={isLoading}
        />
        <MetricTile
          label="Sales"
          icon={CheckCircle2}
          color="emerald"
          current={current.total.sales}
          trailing={trailing.total.sales}
          currentLabel={ranges.current.label}
          trailingLabel={ranges.trailing.label}
          loading={isLoading}
        />
        <MetricTile
          label="Cancellations"
          icon={XCircle}
          color="red"
          current={current.total.cancellations}
          trailing={trailing.total.cancellations}
          currentLabel={ranges.current.label}
          trailingLabel={ranges.trailing.label}
          loading={isLoading}
        />
        <MetricTile
          label="Net (Sales – Cancellations)"
          icon={current.total.net >= 0 ? TrendingUp : TrendingDown}
          color={current.total.net >= 0 ? 'emerald' : 'red'}
          current={current.total.net}
          trailing={trailing.total.net}
          currentLabel={ranges.current.label}
          trailingLabel={ranges.trailing.label}
          loading={isLoading}
        />
      </div>

      {/* Source breakdown table */}
      <div className="bg-surface-primary border border-th-border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-th-border">
          <h2 className="text-base font-semibold text-th-text-primary">Source breakdown</h2>
          <p className="text-xs text-th-text-tertiary mt-0.5">
            New Leads and Sales segmented by Section 13 lead source. Cancellations are
            shown as a single team total — they live on the Daily Log event, not the lead
            row.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-surface-secondary text-left text-th-text-secondary">
                <th rowSpan={2} className="px-3 py-2 font-medium align-bottom">
                  Source
                </th>
                <th colSpan={2} className="px-3 py-2 font-medium text-right border-l border-th-border">
                  New Leads
                </th>
                <th colSpan={2} className="px-3 py-2 font-medium text-right border-l border-th-border">
                  Sales
                </th>
              </tr>
              <tr className="bg-surface-secondary text-left text-th-text-tertiary text-[11px] uppercase tracking-wider">
                <th className="px-3 pb-2 font-normal text-right border-l border-th-border">
                  {ranges.current.label}
                </th>
                <th className="px-3 pb-2 font-normal text-right">{ranges.trailing.label}</th>
                <th className="px-3 pb-2 font-normal text-right border-l border-th-border">
                  {ranges.current.label}
                </th>
                <th className="px-3 pb-2 font-normal text-right">{ranges.trailing.label}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-th-text-tertiary">
                    Loading…
                  </td>
                </tr>
              ) : sourceRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-th-text-tertiary text-xs">
                    No source rows in this period. (Cancellations may still appear in the
                    totals tile above — they aren&apos;t segmented by source.)
                  </td>
                </tr>
              ) : (
                sourceRows.map((r) => (
                  <tr key={r.label} className="border-b border-th-border-subtle">
                    <td className="px-3 py-2 text-th-text-primary">{r.label}</td>
                    <td className="px-3 py-2 text-right tabular-nums border-l border-th-border-subtle">
                      {r.current.new_leads.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-th-text-tertiary">
                      {r.trailing.new_leads.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums border-l border-th-border-subtle">
                      {r.current.sales.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-th-text-tertiary">
                      {r.trailing.sales.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
              {/* Footer: team totals echoed inside the table for export parity. */}
              {!isLoading && sourceRows.length > 0 && (
                <tr className="bg-surface-secondary font-semibold border-t-2 border-th-border">
                  <td className="px-3 py-2 text-th-text-primary">Team total</td>
                  <td className="px-3 py-2 text-right tabular-nums border-l border-th-border-subtle">
                    {current.total.new_leads.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-th-text-tertiary">
                    {trailing.total.new_leads.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums border-l border-th-border-subtle">
                    {current.total.sales.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-th-text-tertiary">
                    {trailing.total.sales.toLocaleString()}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px] text-th-text-tertiary px-1">
        Data sources: <strong>Sales</strong> from
        <code className="px-1">lead_submissions.enrollment_approved_at</code> (Section 5
        won-stage transition); <strong>Cancellations</strong> from
        <code className="px-1">crm_daily_log_events</code> with
        <code className="px-1">activity_subtype = &apos;cancellation&apos;</code> (Section 11);{' '}
        <strong>New Leads</strong> from
        <code className="px-1">lead_submissions.created_at</code> across all capture paths
        (Section 13). All three roll up automatically — if any tile reads zero unexpectedly,
        treat as a wiring failure and check the source pipeline.
      </p>
    </div>
  );
}

interface MetricTileProps {
  label: string;
  icon: typeof Users;
  color: 'sky' | 'emerald' | 'red';
  current: number;
  trailing: number;
  currentLabel: string;
  trailingLabel: string;
  loading: boolean;
}

function MetricTile({
  label,
  icon: Icon,
  color,
  current,
  trailing,
  currentLabel,
  trailingLabel,
  loading,
}: MetricTileProps) {
  const color_classes = {
    sky: { tile: 'border-sky-200', icon: 'text-sky-600 bg-sky-50' },
    emerald: { tile: 'border-emerald-200', icon: 'text-emerald-600 bg-emerald-50' },
    red: { tile: 'border-red-200', icon: 'text-red-600 bg-red-50' },
  }[color];

  const delta = current - trailing;
  const deltaPositive = delta > 0;
  const deltaNegative = delta < 0;

  return (
    <div className={`bg-surface-primary border ${color_classes.tile} rounded-2xl p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
            {label}
          </p>
          <p className="text-3xl font-semibold tabular-nums text-th-text-primary mt-1">
            {loading ? '—' : current.toLocaleString()}
          </p>
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color_classes.icon}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-th-text-tertiary">
        <span className="truncate">{currentLabel}</span>
        <span className="text-th-text-tertiary/40">·</span>
        <span className="truncate">
          {trailingLabel}: <strong className="tabular-nums">{loading ? '—' : trailing.toLocaleString()}</strong>
        </span>
      </div>
      {!loading && (deltaPositive || deltaNegative) && (
        <div
          className={`mt-1 inline-flex items-center gap-1 text-[11px] font-medium ${
            deltaPositive ? 'text-emerald-700' : 'text-red-700'
          }`}
        >
          {deltaPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {deltaPositive ? '+' : ''}
          {delta.toLocaleString()} vs trailing
        </div>
      )}
    </div>
  );
}
