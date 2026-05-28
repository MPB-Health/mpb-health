import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useCRMService } from '../../contexts/CRMServiceContext';
import { useOrg } from '../../contexts/OrgContext';
import { ReportLayout } from '../../components/reports/ReportLayout';
import { useCanExportReports } from '../../hooks/useCanExportReports';
import { exportToXLSX } from '../../lib/xlsxExport';

interface NurtureRow {
  month_label: string;
  entered_nurture: number;
  reactivated_to_working: number;
  reactivated_to_won: number;
  reactivation_pct: number;
  avg_days_in_nurture: number;
}

export default function NurtureReactivationReport() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { supabase, orgId } = useCRMService();
  const { activeOrgId, orgLoading } = useOrg();
  const canExport = useCanExportReports();
  const oid = orgId ?? activeOrgId;

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['crm', oid ?? 'none', 'report', 'nurtureReactivation', month, year],
    enabled: !!oid && !orgLoading,
    queryFn: async () => {
      const { data: rows, error: rpcError } = await supabase.rpc(
        'crm_nurture_reactivation_report',
        { p_org_id: oid, p_month: month, p_year: year },
      );
      if (rpcError) {
        const periodStart = `${year}-${String(month).padStart(2, '0')}-01`;
        const periodEnd =
          month === 12
            ? `${year + 1}-01-01`
            : `${year}-${String(month + 1).padStart(2, '0')}-01`;

        const { count: enteredNurture } = await supabase
          .from('lead_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', oid!)
          .eq('pipeline_stage', 'nurture')
          .gte('stage_changed_at', periodStart)
          .lt('stage_changed_at', periodEnd);

        const { count: toWon } = await supabase
          .from('lead_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', oid!)
          .eq('pipeline_stage', 'won')
          .eq('workflow_subsection', 'nurture')
          .gte('stage_changed_at', periodStart)
          .lt('stage_changed_at', periodEnd);

        const total = enteredNurture ?? 0;
        const won = toWon ?? 0;
        return [
          {
            month_label: `${year}-${String(month).padStart(2, '0')}`,
            entered_nurture: total,
            reactivated_to_working: 0,
            reactivated_to_won: won,
            reactivation_pct: total > 0 ? Math.round((won / total) * 1000) / 10 : 0,
            avg_days_in_nurture: 0,
          },
        ] as NurtureRow[];
      }
      return (rows ?? []) as NurtureRow[];
    },
  });

  const chartData = useMemo(
    () =>
      data.map((r) => ({
        month: r.month_label,
        entered: r.entered_nurture,
        reactivated: r.reactivated_to_won,
        pct: r.reactivation_pct,
      })),
    [data],
  );

  const handleExport = () => {
    if (!data.length) return;
    exportToXLSX(
      [
        { header: 'Month', key: 'month_label', width: 14 },
        { header: 'Entered Nurture', key: 'entered_nurture', width: 16 },
        { header: 'Reactivated → Working', key: 'reactivated_to_working', width: 20 },
        { header: 'Reactivated → Won', key: 'reactivated_to_won', width: 18 },
        { header: 'Reactivation %', key: 'reactivation_pct', width: 14, format: 'percent' },
        { header: 'Avg Days in Nurture', key: 'avg_days_in_nurture', width: 18 },
      ],
      data as unknown as Record<string, unknown>[],
      'NurtureReactivation',
      `crm-nurture-reactivation-${year}-${String(month).padStart(2, '0')}.xlsx`,
    );
  };

  return (
    <ReportLayout
      title="Nurture → Won reactivation"
      description="Conversion rate of leads that entered Nurture and were later reactivated to Won. Separate from new-lead conversion."
      month={month}
      year={year}
      onMonthChange={setMonth}
      onYearChange={setYear}
      onExport={canExport ? handleExport : undefined}
    >
      {error && (
        <p className="text-sm text-red-600 px-1">
          {error instanceof Error ? error.message : 'Failed to load report.'}
        </p>
      )}

      <div className="rounded-lg border border-th-border bg-surface-primary overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-th-border text-left text-th-text-secondary">
              <th className="p-3 font-medium">Period</th>
              <th className="p-3 font-medium text-right">Entered Nurture</th>
              <th className="p-3 font-medium text-right">Reactivated → Working</th>
              <th className="p-3 font-medium text-right">Reactivated → Won</th>
              <th className="p-3 font-medium text-right">Reactivation %</th>
              <th className="p-3 font-medium text-right">Avg Days in Nurture</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-6 text-th-text-secondary text-center">Loading…</td>
              </tr>
            ) : !data.length ? (
              <tr>
                <td colSpan={6} className="p-6 text-th-text-secondary text-center">
                  No nurture reactivation data for this period.
                </td>
              </tr>
            ) : (
              data.map((r) => (
                <tr key={r.month_label} className="border-b border-th-border/60">
                  <td className="p-3 font-medium text-th-text-primary">{r.month_label}</td>
                  <td className="p-3 text-right tabular-nums">{r.entered_nurture}</td>
                  <td className="p-3 text-right tabular-nums">{r.reactivated_to_working}</td>
                  <td className="p-3 text-right tabular-nums">{r.reactivated_to_won}</td>
                  <td className="p-3 text-right tabular-nums font-medium text-emerald-600">
                    {r.reactivation_pct}%
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {r.avg_days_in_nurture > 0 ? `${r.avg_days_in_nurture}d` : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-th-border bg-surface-primary p-4 h-[340px]">
        <h3 className="text-sm font-medium text-th-text-secondary mb-3">
          Nurture → Won over time
        </h3>
        {chartData.length === 0 ? (
          <p className="text-sm text-th-text-tertiary">No chart data.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ left: 12, right: 16, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-th-border" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="entered" name="Entered Nurture" fill="#8B5CF6" />
              <Bar dataKey="reactivated" name="Reactivated → Won" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ReportLayout>
  );
}
