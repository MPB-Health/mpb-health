import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useCRMService } from '../../contexts/CRMServiceContext';
import { useOrg } from '../../contexts/OrgContext';
import { ReportLayout } from '../../components/reports/ReportLayout';
import { ReportRepFilter } from '../../components/reports/ReportRepFilter';
import { useCanExportReports } from '../../hooks/useCanExportReports';
import { useIsLeadManager } from '../../hooks/useIsLeadManager';
import { useAuth } from '../../contexts/AuthContext';
import { exportToXLSX } from '../../lib/xlsxExport';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#22C55E', '#EF4444', '#06B6D4'];

interface ProjectRollupRow {
  user_id: string;
  project_label: string;
  project_type_id: string | null;
  log_date: string;
  total_minutes: number;
  entry_count: number;
}

interface RepProfile {
  id: string;
  full_name: string | null;
  email: string | null;
}

function fmt(total: number): string {
  if (!total || total <= 0) return '—';
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function SpecialProjectsReport() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { supabase, orgId } = useCRMService();
  const { activeOrgId, orgLoading } = useOrg();
  const { user } = useAuth();
  const canExport = useCanExportReports();
  const isLeadManager = useIsLeadManager();
  const oid = orgId ?? activeOrgId;

  const [repIds, setRepIds] = useState<string[] | null>(
    isLeadManager ? null : user?.id ? [user.id] : null,
  );
  const effectiveRepIds = isLeadManager ? repIds : user?.id ? [user.id] : null;

  const periodStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const periodEnd =
    month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, '0')}-01`;

  const { data: rawRows = [], isLoading } = useQuery({
    queryKey: ['crm', oid ?? 'none', 'report', 'specialProjects', month, year, effectiveRepIds],
    enabled: !!oid && !orgLoading,
    queryFn: async () => {
      let q = supabase
        .from('crm_v_special_project_rollup')
        .select('user_id,project_label,project_type_id,log_date,total_minutes,entry_count')
        .eq('org_id', oid!)
        .gte('log_date', periodStart)
        .lt('log_date', periodEnd);
      if (effectiveRepIds?.length) {
        q = q.in('user_id', effectiveRepIds);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ProjectRollupRow[];
    },
  });

  const repUserIds = useMemo(
    () => Array.from(new Set(rawRows.map((r) => r.user_id))),
    [rawRows],
  );

  const { data: profiles = [] } = useQuery({
    queryKey: ['crm', oid ?? 'none', 'profiles', repUserIds.sort().join(',')],
    enabled: repUserIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', repUserIds);
      return (data ?? []) as RepProfile[];
    },
  });

  const nameMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of profiles) {
      m.set(p.id, p.full_name?.trim() || p.email || p.id.slice(0, 8));
    }
    return m;
  }, [profiles]);

  const byRep = useMemo(() => {
    const m = new Map<string, { user_id: string; minutes: number; entries: number }>();
    for (const r of rawRows) {
      const cur = m.get(r.user_id) ?? { user_id: r.user_id, minutes: 0, entries: 0 };
      cur.minutes += r.total_minutes ?? 0;
      cur.entries += r.entry_count ?? 0;
      m.set(r.user_id, cur);
    }
    return Array.from(m.values()).sort((a, b) => b.minutes - a.minutes);
  }, [rawRows]);

  const byProject = useMemo(() => {
    const m = new Map<string, { label: string; minutes: number; entries: number }>();
    for (const r of rawRows) {
      const key = r.project_label || 'Untitled';
      const cur = m.get(key) ?? { label: key, minutes: 0, entries: 0 };
      cur.minutes += r.total_minutes ?? 0;
      cur.entries += r.entry_count ?? 0;
      m.set(key, cur);
    }
    return Array.from(m.values()).sort((a, b) => b.minutes - a.minutes);
  }, [rawRows]);

  const crossTab = useMemo((): Array<Record<string, number | string> & { name: string; total: number }> => {
    const projects = byProject.map((p) => p.label);
    return byRep.map((rep) => {
      const name = nameMap.get(rep.user_id) ?? rep.user_id.slice(0, 8);
      const perProject: Record<string, number> = {};
      for (const proj of projects) {
        perProject[proj] = rawRows
          .filter((r) => r.user_id === rep.user_id && (r.project_label || 'Untitled') === proj)
          .reduce((sum, r) => sum + (r.total_minutes ?? 0), 0);
      }
      return { name, ...perProject, total: rep.minutes } as Record<string, number | string> & { name: string; total: number };
    });
  }, [byRep, byProject, rawRows, nameMap]);

  const totalMinutes = rawRows.reduce((s, r) => s + (r.total_minutes ?? 0), 0);

  const chartData = useMemo(
    () => byProject.slice(0, 10).map((p) => ({ project: p.label, minutes: p.minutes })),
    [byProject],
  );

  const handleExport = () => {
    if (!rawRows.length) return;
    const projects = byProject.map((p) => p.label);
    const cols = [
      { header: 'Rep', key: 'name', width: 24 },
      ...projects.map((p) => ({ header: p, key: p, width: 16 })),
      { header: 'Total', key: 'total', width: 12 },
    ];
    exportToXLSX(
      cols,
      crossTab as unknown as Record<string, unknown>[],
      'SpecialProjects',
      `crm-special-projects-${year}-${String(month).padStart(2, '0')}.xlsx`,
    );
  };

  return (
    <ReportLayout
      title="Special Projects breakdown"
      description="Project × rep × time over the selected date range. Non-pipeline work logged in the Daily Log."
      month={month}
      year={year}
      onMonthChange={setMonth}
      onYearChange={setYear}
      onExport={canExport ? handleExport : undefined}
      filters={<ReportRepFilter value={repIds} onChange={setRepIds} />}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <p className="text-sm text-th-text-tertiary">Total Time</p>
          <p className="text-3xl font-bold text-th-text-primary mt-2">{fmt(totalMinutes)}</p>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <p className="text-sm text-th-text-tertiary">Reps Logging</p>
          <p className="text-3xl font-bold text-th-text-primary mt-2">{byRep.length}</p>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <p className="text-sm text-th-text-tertiary">Distinct Projects</p>
          <p className="text-3xl font-bold text-th-text-primary mt-2">{byProject.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-th-border bg-surface-primary overflow-hidden">
          <div className="px-4 py-3 border-b border-th-border">
            <h3 className="text-sm font-semibold text-th-text-primary">Per-rep</h3>
          </div>
          {isLoading ? (
            <p className="p-6 text-sm text-th-text-tertiary text-center">Loading…</p>
          ) : byRep.length === 0 ? (
            <p className="p-6 text-sm text-th-text-tertiary text-center">No data.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-surface-secondary">
                <tr className="text-left text-th-text-tertiary">
                  <th className="px-3 py-2 font-medium">Rep</th>
                  <th className="px-3 py-2 font-medium text-right">Entries</th>
                  <th className="px-3 py-2 font-medium text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border-subtle">
                {byRep.map((row) => (
                  <tr key={row.user_id}>
                    <td className="px-3 py-2 text-th-text-primary">
                      {nameMap.get(row.user_id) ?? row.user_id.slice(0, 8)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-th-text-secondary">
                      {row.entries}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium text-th-text-primary">
                      {fmt(row.minutes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-lg border border-th-border bg-surface-primary overflow-hidden">
          <div className="px-4 py-3 border-b border-th-border">
            <h3 className="text-sm font-semibold text-th-text-primary">Per-project</h3>
          </div>
          {isLoading ? (
            <p className="p-6 text-sm text-th-text-tertiary text-center">Loading…</p>
          ) : byProject.length === 0 ? (
            <p className="p-6 text-sm text-th-text-tertiary text-center">No data.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-surface-secondary">
                <tr className="text-left text-th-text-tertiary">
                  <th className="px-3 py-2 font-medium">Project</th>
                  <th className="px-3 py-2 font-medium text-right">Entries</th>
                  <th className="px-3 py-2 font-medium text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border-subtle">
                {byProject.map((row) => (
                  <tr key={row.label}>
                    <td className="px-3 py-2 text-th-text-primary">{row.label}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-th-text-secondary">
                      {row.entries}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium text-th-text-primary">
                      {fmt(row.minutes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {crossTab.length > 0 && byProject.length > 0 && (
        <div className="rounded-lg border border-th-border bg-surface-primary overflow-x-auto">
          <div className="px-4 py-3 border-b border-th-border">
            <h3 className="text-sm font-semibold text-th-text-primary">
              Project × Rep cross-tab (minutes)
            </h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-surface-secondary">
              <tr className="text-left text-th-text-tertiary">
                <th className="px-3 py-2 font-medium sticky left-0 bg-surface-secondary z-10">
                  Rep
                </th>
                {byProject.map((p) => (
                  <th key={p.label} className="px-3 py-2 font-medium text-right whitespace-nowrap">
                    {p.label}
                  </th>
                ))}
                <th className="px-3 py-2 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-th-border-subtle">
              {crossTab.map((row) => (
                <tr key={row.name}>
                  <td className="px-3 py-2 font-medium text-th-text-primary sticky left-0 bg-surface-primary">
                    {row.name}
                  </td>
                  {byProject.map((p) => (
                    <td
                      key={p.label}
                      className="px-3 py-2 text-right tabular-nums text-th-text-secondary"
                    >
                      {fmt(Number(row[p.label]) || 0)}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right tabular-nums font-medium text-th-text-primary">
                    {fmt(row.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-lg border border-th-border bg-surface-primary p-4 h-[340px]">
        <h3 className="text-sm font-medium text-th-text-secondary mb-3">
          Time by project (top 10)
        </h3>
        {chartData.length === 0 ? (
          <p className="text-sm text-th-text-tertiary">No chart data.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ left: 12, right: 16, top: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-th-border" />
              <XAxis type="number" tickFormatter={(v: number) => fmt(v)} />
              <YAxis type="category" dataKey="project" width={140} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              <Bar dataKey="minutes" name="Time" fill={COLORS[0]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ReportLayout>
  );
}
