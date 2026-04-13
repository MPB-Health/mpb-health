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
import { exportToXLSX } from '../../lib/xlsxExport';
import { crmQueryKeys } from '../../query/crmQueryKeys';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#22C55E', '#EF4444', '#06B6D4', '#F97316'];

type ConversionRow = {
  rep_id: string;
  rep_name: string;
  leads_received: number;
  inhouse_leads: number;
  inhouse_closed: number;
  inhouse_conv_pct: number;
  selfgen_leads: number;
  selfgen_closed: number;
  selfgen_conv_pct: number;
  overall_conv_pct: number;
};

export default function ConversionReport() {
  const now = new Date();
  const [month, setMonth] = useState(() => now.getMonth() + 1);
  const [year, setYear] = useState(() => now.getFullYear());
  const { supabase, orgId } = useCRMService();
  const { activeOrgId } = useOrg();

  const { data, isLoading, error } = useQuery({
    queryKey: crmQueryKeys.reportConversion(orgId ?? activeOrgId, month, year),
    enabled: Boolean(orgId ?? activeOrgId),
    queryFn: async () => {
      const oid = orgId ?? activeOrgId;
      if (!oid) return [];
      const { data: rows, error: rpcError } = await supabase.rpc('crm_conversion_rates', {
        p_org_id: oid,
        p_month: month,
        p_year: year,
      });
      if (rpcError) throw rpcError;
      return (rows ?? []) as ConversionRow[];
    },
  });

  const chartData = useMemo(
    () =>
      (data ?? []).map((r) => ({
        rep: r.rep_name,
        inhouse: Number(r.inhouse_conv_pct),
        selfgen: Number(r.selfgen_conv_pct),
        overall: Number(r.overall_conv_pct),
      })),
    [data]
  );

  const handleExport = () => {
    if (!data?.length) return;
    exportToXLSX(
      [
        { header: 'Rep', key: 'rep_name', width: 28 },
        { header: 'Leads Received', key: 'leads_received', width: 14 },
        { header: 'Inhouse Leads', key: 'inhouse_leads', width: 14 },
        { header: 'Inhouse Closed', key: 'inhouse_closed', width: 14 },
        { header: 'Inhouse Conv%', key: 'inhouse_conv_pct', width: 14, format: 'percent' },
        { header: 'Self-Gen Leads', key: 'selfgen_leads', width: 14 },
        { header: 'Self-Gen Closed', key: 'selfgen_closed', width: 14 },
        { header: 'Self-Gen Conv%', key: 'selfgen_conv_pct', width: 14, format: 'percent' },
        { header: 'Overall Conv%', key: 'overall_conv_pct', width: 14, format: 'percent' },
      ],
      data.map((r) => ({
        rep_name: r.rep_name,
        leads_received: r.leads_received,
        inhouse_leads: r.inhouse_leads,
        inhouse_closed: r.inhouse_closed,
        inhouse_conv_pct: r.inhouse_conv_pct,
        selfgen_leads: r.selfgen_leads,
        selfgen_closed: r.selfgen_closed,
        selfgen_conv_pct: r.selfgen_conv_pct,
        overall_conv_pct: r.overall_conv_pct,
      })),
      'Conversion',
      `crm-conversion-${year}-${String(month).padStart(2, '0')}.xlsx`
    );
  };

  return (
    <ReportLayout
      title="Conversion rates"
      description="Inhouse vs self-generated conversion by rep for the selected month."
      month={month}
      year={year}
      onMonthChange={setMonth}
      onYearChange={setYear}
      onExport={handleExport}
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
              <th className="p-3 font-medium">Rep</th>
              <th className="p-3 font-medium text-right">Leads Received</th>
              <th className="p-3 font-medium text-right">Inhouse Leads</th>
              <th className="p-3 font-medium text-right">Inhouse Closed</th>
              <th className="p-3 font-medium text-right">Inhouse Conv%</th>
              <th className="p-3 font-medium text-right">Self-Gen Leads</th>
              <th className="p-3 font-medium text-right">Self-Gen Closed</th>
              <th className="p-3 font-medium text-right">Self-Gen Conv%</th>
              <th className="p-3 font-medium text-right">Overall Conv%</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} className="p-6 text-th-text-secondary text-center">
                  Loading…
                </td>
              </tr>
            ) : !data?.length ? (
              <tr>
                <td colSpan={9} className="p-6 text-th-text-secondary text-center">
                  No rows for this period.
                </td>
              </tr>
            ) : (
              data.map((r) => (
                <tr key={r.rep_id} className="border-b border-th-border/60">
                  <td className="p-3">{r.rep_name}</td>
                  <td className="p-3 text-right tabular-nums">{r.leads_received}</td>
                  <td className="p-3 text-right tabular-nums">{r.inhouse_leads}</td>
                  <td className="p-3 text-right tabular-nums">{r.inhouse_closed}</td>
                  <td className="p-3 text-right tabular-nums">{r.inhouse_conv_pct}%</td>
                  <td className="p-3 text-right tabular-nums">{r.selfgen_leads}</td>
                  <td className="p-3 text-right tabular-nums">{r.selfgen_closed}</td>
                  <td className="p-3 text-right tabular-nums">{r.selfgen_conv_pct}%</td>
                  <td className="p-3 text-right tabular-nums font-medium">{r.overall_conv_pct}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-th-border bg-surface-primary p-4 h-[420px]">
        <h3 className="text-sm font-medium text-th-text-secondary mb-3">Conversion % by rep</h3>
        {chartData.length === 0 ? (
          <p className="text-sm text-th-text-tertiary">No chart data.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={chartData} margin={{ left: 12, right: 16, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-th-border" />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="rep" width={120} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Legend />
              <Bar dataKey="inhouse" name="Inhouse %" fill={COLORS[0]} />
              <Bar dataKey="selfgen" name="Self-Gen %" fill={COLORS[1]} />
              <Bar dataKey="overall" name="Overall %" fill={COLORS[2]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ReportLayout>
  );
}
