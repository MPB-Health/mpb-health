import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useCRMService } from '../../contexts/CRMServiceContext';
import { useOrg } from '../../contexts/OrgContext';
import { ReportLayout } from '../../components/reports/ReportLayout';
import { exportToXLSX } from '../../lib/xlsxExport';
import { crmQueryKeys } from '../../query/crmQueryKeys';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#22C55E', '#EF4444', '#06B6D4', '#F97316'];

export interface SourceBreakdownRow {
  source_label: string;
  total_leads: number;
  converted_leads: number;
  conversion_pct: number;
}

function num(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number(v) || 0;
  return 0;
}

function mapRow(r: Record<string, unknown>): SourceBreakdownRow {
  return {
    source_label: String(r.source_label ?? ''),
    total_leads: num(r.total_leads),
    converted_leads: num(r.converted_leads),
    conversion_pct: num(r.conversion_pct),
  };
}

export default function SourceBreakdownReport() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { supabase, orgId } = useCRMService();
  const { orgLoading } = useOrg();

  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: crmQueryKeys.reportSourceBreakdown(orgId, month, year),
    queryFn: async () => {
      const { data: rows, error: rpcError } = await supabase.rpc('crm_lead_source_breakdown_monthly', {
        p_org_id: orgId,
        p_month: month,
        p_year: year,
      });
      if (rpcError) throw rpcError;
      return ((rows ?? []) as Record<string, unknown>[]).map(mapRow);
    },
    enabled: !!orgId && !orgLoading,
  });

  const pieData = useMemo(
    () =>
      data
        .filter((r) => r.total_leads > 0)
        .map((r) => ({
          name: r.source_label,
          value: r.total_leads,
        })),
    [data]
  );

  const totals = useMemo(() => {
    const t = data.reduce(
      (acc, r) => {
        acc.total += r.total_leads;
        acc.converted += r.converted_leads;
        return acc;
      },
      { total: 0, converted: 0 }
    );
    const convPct = t.total > 0 ? Math.round((t.converted * 1000) / t.total) / 10 : 0;
    return { ...t, convPct };
  }, [data]);

  const handleExport = () => {
    const rows: Record<string, unknown>[] = data.map((r) => ({
      source: r.source_label,
      total_leads: r.total_leads,
      converted: r.converted_leads,
      conversion_pct: r.conversion_pct,
    }));
    rows.push({
      source: 'TOTAL',
      total_leads: totals.total,
      converted: totals.converted,
      conversion_pct: totals.convPct,
    });

    exportToXLSX(
      [
        { header: 'Source', key: 'source', width: 28 },
        { header: 'Total Leads', key: 'total_leads' },
        { header: 'Converted', key: 'converted' },
        { header: 'Conversion %', key: 'conversion_pct', format: 'percent' },
      ],
      rows,
      'Source breakdown',
      `crm-source-breakdown-${year}-${String(month).padStart(2, '0')}.xlsx`
    );
  };

  return (
    <ReportLayout
      title="Lead source breakdown"
      description="Monthly leads and conversion rate by source."
      month={month}
      year={year}
      onMonthChange={setMonth}
      onYearChange={setYear}
      onExport={handleExport}
    >
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error instanceof Error ? error.message : 'Failed to load report'}
        </div>
      )}

      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <h2 className="text-lg font-semibold text-th-text-primary mb-4">Leads by source</h2>
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-th-accent-600 border-t-transparent" />
          </div>
        ) : pieData.length === 0 ? (
          <p className="text-sm text-th-text-tertiary">No leads in this period.</p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-th-border bg-surface-primary">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-th-border bg-surface-secondary text-left text-th-text-secondary">
              <th className="px-3 py-2 font-medium">Source</th>
              <th className="px-3 py-2 font-medium text-right">Total Leads</th>
              <th className="px-3 py-2 font-medium text-right">Converted</th>
              <th className="px-3 py-2 font-medium text-right">Conversion %</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-th-text-tertiary">
                  Loading…
                </td>
              </tr>
            ) : (
              <>
                {data.map((r) => (
                  <tr key={r.source_label} className="border-b border-th-border">
                    <td className="px-3 py-2 text-th-text-primary">{r.source_label}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.total_leads.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.converted_leads.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.conversion_pct.toFixed(1)}%</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-th-border bg-surface-secondary font-semibold">
                  <td className="px-3 py-2 text-th-text-primary">TOTAL</td>
                  <td className="px-3 py-2 text-right tabular-nums">{totals.total.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{totals.converted.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{totals.convPct.toFixed(1)}%</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </ReportLayout>
  );
}
