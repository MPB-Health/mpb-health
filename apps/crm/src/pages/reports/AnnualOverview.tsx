import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useCRMService } from '../../contexts/CRMServiceContext';
import { useOrg } from '../../contexts/OrgContext';
import { ReportLayout } from '../../components/reports/ReportLayout';
import { exportMultiSheetXLSX } from '../../lib/xlsxExport';
import { crmQueryKeys } from '../../query/crmQueryKeys';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#22C55E', '#EF4444', '#06B6D4', '#F97316'];

type LeadTrendRow = { month_num: number; month_label: string; lead_count: number };
type RevenueRow = { rep_id: string; rep_name: string; month_num: number; revenue: number };
type SourceRow = {
  source_label: string;
  total_leads: number;
  converted: number;
  conversion_pct: number;
};
type ConversionRow = {
  rep_id: string;
  rep_name: string;
  total_leads: number;
  total_closed: number;
  overall_conv_pct: number;
  inhouse_conv_pct: number;
  selfgen_conv_pct: number;
};

function useAnnualReportData(year: number, orgKey: string | null, supabase: ReturnType<typeof useCRMService>['supabase']) {
  const enabled = Boolean(orgKey);

  const leadTrend = useQuery({
    queryKey: crmQueryKeys.reportAnnualLeadTrend(orgKey, year),
    enabled,
    queryFn: async () => {
      if (!orgKey) return [];
      const { data, error } = await supabase.rpc('crm_annual_lead_trend', {
        p_org_id: orgKey,
        p_year: year,
      });
      if (error) throw error;
      return (data ?? []) as LeadTrendRow[];
    },
  });

  const revenueTrend = useQuery({
    queryKey: crmQueryKeys.reportAnnualRevenue(orgKey, year),
    enabled,
    queryFn: async () => {
      if (!orgKey) return [];
      const { data, error } = await supabase.rpc('crm_annual_revenue_trend', {
        p_org_id: orgKey,
        p_year: year,
      });
      if (error) throw error;
      return (data ?? []) as RevenueRow[];
    },
  });

  const sourceDistribution = useQuery({
    queryKey: crmQueryKeys.reportAnnualSource(orgKey, year),
    enabled,
    queryFn: async () => {
      if (!orgKey) return [];
      const { data, error } = await supabase.rpc('crm_annual_source_distribution', {
        p_org_id: orgKey,
        p_year: year,
      });
      if (error) throw error;
      return (data ?? []) as SourceRow[];
    },
  });

  const conversionByRep = useQuery({
    queryKey: crmQueryKeys.reportAnnualConversion(orgKey, year),
    enabled,
    queryFn: async () => {
      if (!orgKey) return [];
      const { data, error } = await supabase.rpc('crm_annual_conversion_by_rep', {
        p_org_id: orgKey,
        p_year: year,
      });
      if (error) throw error;
      return (data ?? []) as ConversionRow[];
    },
  });

  const loading =
    leadTrend.isLoading ||
    revenueTrend.isLoading ||
    sourceDistribution.isLoading ||
    conversionByRep.isLoading;
  const err =
    leadTrend.error ||
    revenueTrend.error ||
    sourceDistribution.error ||
    conversionByRep.error;

  return {
    leadTrend: leadTrend.data ?? [],
    revenueTrend: revenueTrend.data ?? [],
    sourceDistribution: sourceDistribution.data ?? [],
    conversionByRep: conversionByRep.data ?? [],
    loading,
    error: err,
  };
}

function pivotRevenueForStack(rows: RevenueRow[]) {
  const repOrder: { id: string; name: string }[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    if (!seen.has(r.rep_id)) {
      seen.add(r.rep_id);
      repOrder.push({ id: r.rep_id, name: r.rep_name });
    }
  }
  const byMonthRep = new Map<string, number>();
  for (const r of rows) {
    byMonthRep.set(`${r.month_num}:${r.rep_id}`, Number(r.revenue));
  }
  const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1;
    const point: Record<string, string | number> = {
      month: MONTH_SHORT[i],
    };
    for (const { id } of repOrder) {
      point[id] = byMonthRep.get(`${monthNum}:${id}`) ?? 0;
    }
    return point;
  });
  return { chartData, repOrder };
}

export default function AnnualOverview() {
  const now = new Date();
  const [month] = useState(1);
  const [year, setYear] = useState(() => now.getFullYear());
  const { supabase, orgId } = useCRMService();
  const { activeOrgId } = useOrg();
  const orgKey = orgId ?? activeOrgId;

  const { leadTrend, revenueTrend, sourceDistribution, conversionByRep, loading, error } =
    useAnnualReportData(year, orgKey, supabase);

  const { chartData: revenueChartData, repOrder } = useMemo(
    () => pivotRevenueForStack(revenueTrend),
    [revenueTrend]
  );

  const pieData = useMemo(
    () =>
      sourceDistribution.map((s) => ({
        name: s.source_label,
        value: Number(s.total_leads),
        conversion_pct: s.conversion_pct,
      })),
    [sourceDistribution]
  );

  const leadLineData = useMemo(
    () =>
      leadTrend.map((r) => ({
        month: r.month_label,
        leads: Number(r.lead_count),
      })),
    [leadTrend]
  );

  const conversionBarData = useMemo(
    () =>
      conversionByRep.map((r) => ({
        rep: r.rep_name,
        overall: Number(r.overall_conv_pct),
      })),
    [conversionByRep]
  );

  const handleExport = () => {
    if (!orgKey) return;
    exportMultiSheetXLSX(
      [
        {
          name: 'Lead trend',
          columns: [
            { header: 'Month #', key: 'month_num', width: 10 },
            { header: 'Month', key: 'month_label', width: 10 },
            { header: 'Leads', key: 'lead_count', width: 12 },
          ],
          rows: leadTrend.map((r) => ({
            month_num: r.month_num,
            month_label: r.month_label,
            lead_count: r.lead_count,
          })),
        },
        {
          name: 'Revenue',
          columns: [
            { header: 'Rep', key: 'rep_name', width: 24 },
            { header: 'Month #', key: 'month_num', width: 10 },
            { header: 'Revenue', key: 'revenue', width: 14 },
          ],
          rows: revenueTrend.map((r) => ({
            rep_name: r.rep_name,
            month_num: r.month_num,
            revenue: r.revenue,
          })),
        },
        {
          name: 'Sources',
          columns: [
            { header: 'Source', key: 'source_label', width: 24 },
            { header: 'Leads', key: 'total_leads', width: 12 },
            { header: 'Converted', key: 'converted', width: 12 },
            { header: 'Conv %', key: 'conversion_pct', width: 10, format: 'percent' as const },
          ],
          rows: sourceDistribution.map((r) => ({ ...r })),
        },
        {
          name: 'Conversion by rep',
          columns: [
            { header: 'Rep', key: 'rep_name', width: 24 },
            { header: 'Leads', key: 'total_leads', width: 10 },
            { header: 'Closed', key: 'total_closed', width: 10 },
            { header: 'Overall %', key: 'overall_conv_pct', width: 12, format: 'percent' as const },
            { header: 'Inhouse %', key: 'inhouse_conv_pct', width: 12, format: 'percent' as const },
            { header: 'Self-Gen %', key: 'selfgen_conv_pct', width: 12, format: 'percent' as const },
          ],
          rows: conversionByRep.map((r) => ({ ...r })),
        },
      ],
      `crm-annual-overview-${year}.xlsx`
    );
  };

  return (
    <ReportLayout
      title="Annual overview"
      description="Year-to-date leads, revenue by rep, lead sources, and conversion rates."
      month={month}
      year={year}
      onMonthChange={() => {}}
      onYearChange={setYear}
      yearOnly
      onExport={handleExport}
    >
      {error && (
        <p className="text-sm text-red-600 px-1">
          {error instanceof Error ? error.message : 'Failed to load one or more charts.'}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-th-text-secondary px-1">Loading…</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-th-border bg-surface-primary p-4 h-[320px]">
            <h3 className="text-sm font-medium text-th-text-secondary mb-2">Lead trend</h3>
            {leadLineData.length === 0 ? (
              <p className="text-xs text-th-text-tertiary">No data.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={leadLineData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-th-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="leads" name="Leads" stroke={COLORS[0]} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="rounded-lg border border-th-border bg-surface-primary p-4 h-[320px]">
            <h3 className="text-sm font-medium text-th-text-secondary mb-2">Revenue by rep (stacked)</h3>
            {revenueChartData.length === 0 || repOrder.length === 0 ? (
              <p className="text-xs text-th-text-tertiary">No data.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-th-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  {repOrder.map((r, i) => (
                    <Bar
                      key={r.id}
                      dataKey={r.id}
                      name={r.name}
                      stackId="rev"
                      fill={COLORS[i % COLORS.length]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="rounded-lg border border-th-border bg-surface-primary p-4 h-[320px]">
            <h3 className="text-sm font-medium text-th-text-secondary mb-2">Lead source distribution</h3>
            {pieData.length === 0 ? (
              <p className="text-xs text-th-text-tertiary">No data.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, _n, item) => {
                      const payload = item?.payload as { conversion_pct?: number } | undefined;
                      const pct = payload?.conversion_pct;
                      return [`${value} leads${pct != null ? ` · ${pct}% conv.` : ''}`, 'Total'];
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="rounded-lg border border-th-border bg-surface-primary p-4 h-[320px]">
            <h3 className="text-sm font-medium text-th-text-secondary mb-2">YTD conversion % by rep</h3>
            {conversionBarData.length === 0 ? (
              <p className="text-xs text-th-text-tertiary">No data.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conversionBarData} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-th-border" />
                  <XAxis dataKey="rep" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={60} interval={0} />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'Overall']} />
                  <Bar dataKey="overall" name="Overall %" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </ReportLayout>
  );
}
