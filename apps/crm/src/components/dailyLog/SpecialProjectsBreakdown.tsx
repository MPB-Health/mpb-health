import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Loader2, Settings as SettingsIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useOrgReps } from '../../hooks/useOrgReps';
import { useOrg } from '../../contexts/OrgContext';
import { ProjectTypesAdminModal } from './ProjectTypesAdminModal';

// ---------------------------------------------------------------------------
// CRM Round 7 — Special Projects breakdown (admin view)
// ---------------------------------------------------------------------------
// Spec: "Reports view: include a Special Projects breakdown (project name ×
// rep × time spent over date range)." Powered by the
// `crm_v_special_project_rollup` view created in migration
// `20260620480000_crm_p7_dl_round7_entry_types.sql`.
//
// The component is rendered inside the Daily Log Admin view (?view=admin) and
// shares the rep / date-range filters that are already on the page so the
// admin sees pipeline activity and Special Projects time side by side.

interface Props {
  orgId: string;
  dateFrom: string; // YYYY-MM-DD
  dateTo: string; // YYYY-MM-DD
  repFilter: string; // user_id or 'all'
}

interface RollupRow {
  org_id: string;
  user_id: string;
  project_label: string;
  project_type_id: string | null;
  log_date: string;
  total_minutes: number;
  entry_count: number;
}

export function SpecialProjectsBreakdown({ orgId, dateFrom, dateTo, repFilter }: Props) {
  const { data: orgReps = [] } = useOrgReps();
  const { orgRole } = useOrg();
  const isOrgAdmin = orgRole === 'admin' || orgRole === 'owner';
  const [adminModalOpen, setAdminModalOpen] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['specialProjectsRollup', orgId, dateFrom, dateTo, repFilter] as const,
    queryFn: async () => {
      let q = supabase
        .from('crm_v_special_project_rollup')
        .select('*')
        .eq('org_id', orgId)
        .gte('log_date', dateFrom)
        .lte('log_date', dateTo)
        .order('total_minutes', { ascending: false });
      if (repFilter !== 'all') q = q.eq('user_id', repFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as RollupRow[];
    },
    staleTime: 30_000,
  });

  // Group by project label (across reps + days) for the table view.
  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { project_label: string; total_minutes: number; entries: number; reps: Set<string> }
    >();
    for (const r of rows) {
      const key = r.project_label;
      const cur = map.get(key) ?? {
        project_label: r.project_label,
        total_minutes: 0,
        entries: 0,
        reps: new Set<string>(),
      };
      cur.total_minutes += r.total_minutes;
      cur.entries += r.entry_count;
      cur.reps.add(r.user_id);
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.total_minutes - a.total_minutes);
  }, [rows]);

  const totalMinutes = useMemo(
    () => rows.reduce((acc, r) => acc + r.total_minutes, 0),
    [rows],
  );

  // Per-rep totals (rep × minutes).
  const perRep = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) {
      map.set(r.user_id, (map.get(r.user_id) ?? 0) + r.total_minutes);
    }
    return Array.from(map.entries())
      .map(([user_id, mins]) => ({
        user_id,
        display_name: orgReps.find((rep) => rep.user_id === user_id)?.display_name ?? user_id.slice(0, 8),
        total_minutes: mins,
      }))
      .sort((a, b) => b.total_minutes - a.total_minutes);
  }, [rows, orgReps]);

  return (
    <div className="bg-surface-primary border border-th-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-th-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-th-accent-50 flex items-center justify-center">
            <ClipboardList className="w-4 h-4 text-th-accent-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-th-text-primary">Special Projects breakdown</p>
            <p className="text-xs text-th-text-tertiary mt-0.5">
              Project × rep × time over the selected date range. Manual entries only — no
              auto-capture path.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-th-text-tertiary">Total time</p>
            <p className="text-base font-semibold tabular-nums text-th-text-primary">
              {formatMinutes(totalMinutes)}
            </p>
          </div>
          {isOrgAdmin && (
            <button
              type="button"
              onClick={() => setAdminModalOpen(true)}
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md border border-th-border hover:bg-surface-secondary text-xs text-th-text-secondary"
              title="Manage project types pick-list"
            >
              <SettingsIcon className="w-3 h-3" /> Manage types
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="p-6 text-center text-th-text-tertiary text-sm">
          <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" /> Loading…
        </div>
      ) : rows.length === 0 ? (
        <div className="p-6 text-center text-th-text-tertiary text-xs">
          No Special Projects logged in this range.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="border-r border-th-border-subtle">
            <p className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-th-text-tertiary border-b border-th-border-subtle">
              By project
            </p>
            <table className="w-full text-sm">
              <thead className="bg-surface-secondary/40 text-[11px] uppercase tracking-wider text-th-text-tertiary">
                <tr>
                  <th className="text-left px-5 py-2 font-semibold">Project</th>
                  <th className="text-right px-5 py-2 font-semibold">Reps</th>
                  <th className="text-right px-5 py-2 font-semibold">Entries</th>
                  <th className="text-right px-5 py-2 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border-subtle">
                {grouped.map((g) => (
                  <tr key={g.project_label}>
                    <td className="px-5 py-2 text-th-text-primary">{g.project_label}</td>
                    <td className="px-5 py-2 text-right tabular-nums">{g.reps.size}</td>
                    <td className="px-5 py-2 text-right tabular-nums">{g.entries}</td>
                    <td className="px-5 py-2 text-right tabular-nums font-medium">
                      {formatMinutes(g.total_minutes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <p className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-th-text-tertiary border-b border-th-border-subtle">
              By rep
            </p>
            <table className="w-full text-sm">
              <thead className="bg-surface-secondary/40 text-[11px] uppercase tracking-wider text-th-text-tertiary">
                <tr>
                  <th className="text-left px-5 py-2 font-semibold">Rep</th>
                  <th className="text-right px-5 py-2 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border-subtle">
                {perRep.map((r) => (
                  <tr key={r.user_id}>
                    <td className="px-5 py-2 text-th-text-primary">{r.display_name}</td>
                    <td className="px-5 py-2 text-right tabular-nums font-medium">
                      {formatMinutes(r.total_minutes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ProjectTypesAdminModal
        open={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        orgId={orgId}
      />
    </div>
  );
}

function formatMinutes(total: number): string {
  if (total <= 0) return '0m';
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}
