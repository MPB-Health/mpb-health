import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useCRMService } from '../../contexts/CRMServiceContext';
import { useOrg } from '../../contexts/OrgContext';
import { useAuth } from '../../contexts/AuthContext';
import { ReportLayout } from '../../components/reports/ReportLayout';
import { ReportRepFilter } from '../../components/reports/ReportRepFilter';
import { useCanExportReports } from '../../hooks/useCanExportReports';
import { useIsLeadManager } from '../../hooks/useIsLeadManager';
import { exportToXLSX } from '../../lib/xlsxExport';
import { crmQueryKeys } from '../../query/crmQueryKeys';

type ActivityTargetRow = {
  rep_id: string;
  rep_name: string;
  activity_type: string;
  actual: number;
  target: number;
};

function monthPaceRatio(month: number, year: number): number {
  const totalDays = new Date(year, month, 0).getDate();
  const today = new Date();
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  if (today < start) return 0;
  if (today > end) return 1;
  return Math.min(1, today.getDate() / totalDays);
}

function isBehindPace(row: ActivityTargetRow, paceRatio: number): boolean {
  if (row.target <= 0) return false;
  const expected = row.target * paceRatio;
  return row.actual < expected;
}

export default function ActivityTargetsReport() {
  const now = new Date();
  const [month, setMonth] = useState(() => now.getMonth() + 1);
  const [year, setYear] = useState(() => now.getFullYear());
  const { supabase, orgId } = useCRMService();
  const { activeOrgId } = useOrg();
  const canExport = useCanExportReports();
  const isLeadManager = useIsLeadManager();
  const { user } = useAuth();

  const [repIds, setRepIds] = useState<string[] | null>(
    isLeadManager ? null : user?.id ? [user.id] : null,
  );
  const effectiveRepIds = isLeadManager ? repIds : user?.id ? [user.id] : null;

  const paceRatio = useMemo(() => monthPaceRatio(month, year), [month, year]);

  const { data, isLoading, error } = useQuery({
    queryKey: crmQueryKeys.reportActivityTargets(orgId ?? activeOrgId, month, year, effectiveRepIds),
    enabled: Boolean(orgId ?? activeOrgId),
    queryFn: async () => {
      const oid = orgId ?? activeOrgId;
      if (!oid) return [];
      const { data: rows, error: rpcError } = await supabase.rpc('crm_activity_summary_filtered', {
        p_org_id: oid,
        p_month: month,
        p_year: year,
        p_rep_ids: effectiveRepIds,
      });
      if (rpcError) throw rpcError;
      return (rows ?? []).map((r: ActivityTargetRow) => ({
        ...r,
        actual: Number(r.actual),
        target: Number(r.target),
      })) as ActivityTargetRow[];
    },
  });

  const byRep = useMemo(() => {
    const map = new Map<string, ActivityTargetRow[]>();
    for (const row of data ?? []) {
      const list = map.get(row.rep_id) ?? [];
      list.push(row);
      map.set(row.rep_id, list);
    }
    return map;
  }, [data]);

  const handleExport = () => {
    if (!data?.length) return;
    exportToXLSX(
      [
        { header: 'Rep', key: 'rep_name', width: 28 },
        { header: 'Activity Type', key: 'activity_type', width: 22 },
        { header: 'Actual', key: 'actual', width: 10 },
        { header: 'Target', key: 'target', width: 10 },
      ],
      data.map((r) => ({
        rep_name: r.rep_name,
        activity_type: r.activity_type,
        actual: r.actual,
        target: r.target,
      })),
      'Activity vs targets',
      `crm-activity-targets-${year}-${String(month).padStart(2, '0')}.xlsx`
    );
  };

  return (
    <ReportLayout
      title="Activity vs targets"
      description="Actual activity counts compared to monthly targets. Sourced from the Daily Log (Section 8 auto-capture + manual entries); bars turn red when behind expected pace for the month."
      month={month}
      year={year}
      onMonthChange={setMonth}
      onYearChange={setYear}
      onExport={canExport ? handleExport : undefined}
      filters={<ReportRepFilter value={repIds} onChange={setRepIds} />}
    >
      {error && (
        <p className="text-sm text-red-600 px-1">
          {error instanceof Error ? error.message : 'Failed to load report.'}
        </p>
      )}

      {isLoading ? (
        <p className="text-sm text-th-text-secondary px-1">Loading…</p>
      ) : !data?.length ? (
        <p className="text-sm text-th-text-secondary px-1">No activity rows for this period.</p>
      ) : (
        <div className="space-y-8">
          {Array.from(byRep.entries()).map(([repId, rows]) => {
            const repName = rows[0]?.rep_name ?? repId;
            const chartRows = rows.map((r) => ({
              activity_type: r.activity_type,
              actual: r.actual,
              target: r.target,
              paceExpected: Math.round(r.target * paceRatio * 100) / 100,
            }));
            return (
              <div key={repId} className="rounded-lg border border-th-border bg-surface-primary p-4">
                <h3 className="text-sm font-semibold text-th-text-primary mb-4">{repName}</h3>
                <div className="min-h-[200px]" style={{ height: Math.max(200, rows.length * 36) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={chartRows} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-th-border" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="activity_type" width={100} tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(value: number, name: string) => [value, name === 'paceExpected' ? 'Expected (pace)' : name]}
                      />
                      <Legend />
                      <Bar dataKey="target" name="Target" fill="#E5E7EB" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="actual" name="Actual" radius={[0, 4, 4, 0]}>
                        {rows.map((r, i) => (
                          <Cell
                            key={`${r.activity_type}-${i}`}
                            fill={isBehindPace(r, paceRatio) ? '#EF4444' : '#3B82F6'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-3 space-y-2 text-xs text-th-text-secondary">
                  {rows.map((r) => {
                    const behind = isBehindPace(r, paceRatio);
                    return (
                      <li key={r.activity_type} className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-th-text-primary">{r.activity_type}</span>
                        <span className="tabular-nums">
                          {r.actual} / {r.target}
                        </span>
                        {behind && r.target > 0 && (
                          <span className="text-red-600">Behind pace</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </ReportLayout>
  );
}
