import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Phone, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useOrgReps } from '../../hooks/useOrgReps';

// ---------------------------------------------------------------------------
// CRM Round 7 — Cancellation Calls report breakdown (admin view)
// ---------------------------------------------------------------------------
// Spec: "Cancellation Calls count separately from regular Calls in all
// reports (Daily Log, Weekly, Monthly, Activity Analytics per Section 2/3/4)."
// Powered by `crm_v_call_breakdown` (regular vs cancellation per rep × day).

interface Props {
  orgId: string;
  dateFrom: string;
  dateTo: string;
  repFilter: string; // user_id or 'all'
}

interface BreakdownRow {
  org_id: string;
  user_id: string;
  log_date: string;
  regular_calls: number;
  cancellation_calls: number;
  total_calls: number;
}

export function CallBreakdownPanel({ orgId, dateFrom, dateTo, repFilter }: Props) {
  const { data: orgReps = [] } = useOrgReps();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['callBreakdownRollup', orgId, dateFrom, dateTo, repFilter] as const,
    queryFn: async () => {
      let q = supabase
        .from('crm_v_call_breakdown')
        .select('*')
        .eq('org_id', orgId)
        .gte('log_date', dateFrom)
        .lte('log_date', dateTo);
      if (repFilter !== 'all') q = q.eq('user_id', repFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as BreakdownRow[];
    },
    staleTime: 30_000,
  });

  const totals = useMemo(() => {
    let regular = 0;
    let cancel = 0;
    for (const r of rows) {
      regular += r.regular_calls;
      cancel += r.cancellation_calls;
    }
    return { regular, cancel, total: regular + cancel };
  }, [rows]);

  // Per-rep summary for the table.
  const perRep = useMemo(() => {
    const map = new Map<string, { regular: number; cancel: number }>();
    for (const r of rows) {
      const cur = map.get(r.user_id) ?? { regular: 0, cancel: 0 };
      cur.regular += r.regular_calls;
      cur.cancel += r.cancellation_calls;
      map.set(r.user_id, cur);
    }
    return Array.from(map.entries())
      .map(([user_id, v]) => ({
        user_id,
        display_name:
          orgReps.find((rep) => rep.user_id === user_id)?.display_name ?? user_id.slice(0, 8),
        regular: v.regular,
        cancel: v.cancel,
        total: v.regular + v.cancel,
        cancelPct: v.regular + v.cancel === 0 ? 0 : Math.round((v.cancel / (v.regular + v.cancel)) * 100),
      }))
      .sort((a, b) => b.total - a.total);
  }, [rows, orgReps]);

  return (
    <div className="bg-surface-primary border border-th-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-th-border-subtle flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-th-accent-50 flex items-center justify-center">
            <Phone className="w-4 h-4 text-th-accent-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-th-text-primary">Call breakdown</p>
            <p className="text-xs text-th-text-tertiary mt-0.5">
              Regular vs cancellation calls — counted separately in every report (Daily Log,
              Weekly, Monthly, Activity Analytics).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
            <Phone className="w-3 h-3" />
            <span className="tabular-nums font-semibold">{totals.regular}</span> regular
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium">
            <XCircle className="w-3 h-3" />
            <span className="tabular-nums font-semibold">{totals.cancel}</span> cancellation
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-surface-secondary text-th-text-secondary text-xs">
            <span className="tabular-nums font-semibold">{totals.total}</span> total
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="p-6 text-center text-th-text-tertiary text-sm">
          <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" /> Loading…
        </div>
      ) : rows.length === 0 ? (
        <div className="p-6 text-center text-th-text-tertiary text-xs">
          No calls logged in this range.
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-surface-secondary/40 text-[11px] uppercase tracking-wider text-th-text-tertiary">
            <tr>
              <th className="text-left px-5 py-2 font-semibold">Rep</th>
              <th className="text-right px-5 py-2 font-semibold">Regular</th>
              <th className="text-right px-5 py-2 font-semibold">Cancellation</th>
              <th className="text-right px-5 py-2 font-semibold">Total</th>
              <th className="text-right px-5 py-2 font-semibold">% Cancel</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-th-border-subtle">
            {perRep.map((r) => (
              <tr key={r.user_id}>
                <td className="px-5 py-2 text-th-text-primary">{r.display_name}</td>
                <td className="px-5 py-2 text-right tabular-nums">{r.regular}</td>
                <td className="px-5 py-2 text-right tabular-nums text-red-600">{r.cancel}</td>
                <td className="px-5 py-2 text-right tabular-nums font-medium">{r.total}</td>
                <td className="px-5 py-2 text-right tabular-nums text-th-text-tertiary">
                  {r.cancelPct}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
