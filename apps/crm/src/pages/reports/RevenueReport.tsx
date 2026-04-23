import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
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

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#22C55E', '#EF4444', '#06B6D4', '#F97316'];

export interface RevenueClosedSalesRow {
  rep_id: string;
  rep_name: string;
  closed_sales_month: number;
  revenue_month: number;
  closed_sales_ytd: number;
  revenue_ytd: number;
  avg_deal_size: number;
}

function num(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number(v) || 0;
  return 0;
}

function mapRow(r: Record<string, unknown>): RevenueClosedSalesRow {
  return {
    rep_id: String(r.rep_id ?? ''),
    rep_name: String(r.rep_name ?? ''),
    closed_sales_month: num(r.closed_sales_month),
    revenue_month: num(r.revenue_month),
    closed_sales_ytd: num(r.closed_sales_ytd),
    revenue_ytd: num(r.revenue_ytd),
    avg_deal_size: num(r.avg_deal_size),
  };
}

export default function RevenueReport() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { supabase, orgId } = useCRMService();
  const { orgLoading } = useOrg();
  const canExport = useCanExportReports();
  const isLeadManager = useIsLeadManager();
  const { user } = useAuth();

  const [repIds, setRepIds] = useState<string[] | null>(
    isLeadManager ? null : user?.id ? [user.id] : null,
  );
  const effectiveRepIds = isLeadManager ? repIds : user?.id ? [user.id] : null;

  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: crmQueryKeys.reportRevenue(orgId, month, year, effectiveRepIds),
    queryFn: async () => {
      const { data: rows, error: rpcError } = await supabase.rpc('crm_revenue_closed_sales_filtered', {
        p_org_id: orgId,
        p_month: month,
        p_year: year,
        p_rep_ids: effectiveRepIds,
      });
      if (rpcError) throw rpcError;
      return ((rows ?? []) as Record<string, unknown>[]).map(mapRow);
    },
    enabled: !!orgId && !orgLoading,
  });

  const chartData = useMemo(
    () =>
      data.map((r) => ({
        name: r.rep_name,
        revenue: r.revenue_month,
      })),
    [data]
  );

  const handleExport = () => {
    if (!data.length) return;
    exportToXLSX(
      [
        { header: 'Rep', key: 'rep_name', width: 28 },
        { header: 'Closed Sales (Month)', key: 'closed_sales_month' },
        { header: 'Revenue (Month)', key: 'revenue_month', format: 'currency' },
        { header: 'Closed Sales (YTD)', key: 'closed_sales_ytd' },
        { header: 'Revenue (YTD)', key: 'revenue_ytd', format: 'currency' },
        { header: 'Avg Deal Size', key: 'avg_deal_size', format: 'currency' },
      ],
      data as unknown as Record<string, unknown>[],
      'Revenue',
      `crm-revenue-${year}-${String(month).padStart(2, '0')}.xlsx`
    );
  };

  const fmtMoney = (n: number) =>
    n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <ReportLayout
      title="Revenue & closed sales"
      description="Monthly and year-to-date closed sales and revenue by rep."
      month={month}
      year={year}
      onMonthChange={setMonth}
      onYearChange={setYear}
      onExport={canExport ? handleExport : undefined}
      filters={<ReportRepFilter value={repIds} onChange={setRepIds} />}
    >
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error instanceof Error ? error.message : 'Failed to load report'}
        </div>
      )}

      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <h2 className="text-lg font-semibold text-th-text-primary mb-4">Revenue (month) by rep</h2>
        {isLoading ? (
          <div className="flex h-72 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-th-accent-600 border-t-transparent" />
          </div>
        ) : chartData.every((d) => d.revenue === 0) ? (
          <p className="text-sm text-th-text-tertiary">No closed revenue in this month.</p>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-th-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={70} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) =>
                    typeof v === 'number'
                      ? v >= 1_000_000
                        ? `$${(v / 1_000_000).toFixed(1)}M`
                        : v >= 1000
                          ? `$${(v / 1000).toFixed(0)}k`
                          : `$${v}`
                      : String(v)
                  }
                />
                <Tooltip formatter={(value: number) => fmtMoney(value)} />
                <Legend />
                <Bar dataKey="revenue" name="Revenue (month)" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-th-border bg-surface-primary">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-th-border bg-surface-secondary text-left text-th-text-secondary">
              <th className="px-3 py-2 font-medium">Rep</th>
              <th className="px-3 py-2 font-medium text-right">Closed (Mo)</th>
              <th className="px-3 py-2 font-medium text-right">Revenue (Mo)</th>
              <th className="px-3 py-2 font-medium text-right">Closed (YTD)</th>
              <th className="px-3 py-2 font-medium text-right">Revenue (YTD)</th>
              <th className="px-3 py-2 font-medium text-right">Avg Deal</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-th-text-tertiary">
                  Loading…
                </td>
              </tr>
            ) : (
              data.map((r) => (
                <tr key={r.rep_id} className="border-b border-th-border">
                  <td className="px-3 py-2 text-th-text-primary">{r.rep_name}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.closed_sales_month}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtMoney(r.revenue_month)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.closed_sales_ytd}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtMoney(r.revenue_ytd)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtMoney(r.avg_deal_size)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </ReportLayout>
  );
}
