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
import { ReportLayout } from '../../components/reports/ReportLayout';
import { ReportRepFilter } from '../../components/reports/ReportRepFilter';
import { useCanExportReports } from '../../hooks/useCanExportReports';
import { useIsLeadManager } from '../../hooks/useIsLeadManager';
import { useAuth } from '../../contexts/AuthContext';
import { exportToXLSX } from '../../lib/xlsxExport';
import { crmQueryKeys } from '../../query/crmQueryKeys';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#22C55E', '#EF4444', '#06B6D4', '#F97316'];

export interface IndividualPerformanceRow {
  rep_id: string;
  rep_name: string;
  calls_made: number;
  emails_sent: number;
  linkedin_messages: number;
  presentations_given: number;
  proposals_sent: number;
  meetings_held: number;
  closed_sales: number;
  revenue: number;
  close_rate: number;
  avg_deal_size: number;
  new_leads_entered: number;
  referrals_requested: number;
  community_activities: number;
}

function num(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number(v) || 0;
  return 0;
}

function mapPerformanceRow(r: Record<string, unknown>): IndividualPerformanceRow {
  return {
    rep_id: String(r.rep_id ?? ''),
    rep_name: String(r.rep_name ?? ''),
    calls_made: num(r.calls_made),
    emails_sent: num(r.emails_sent),
    linkedin_messages: num(r.linkedin_messages),
    presentations_given: num(r.presentations_given),
    proposals_sent: num(r.proposals_sent),
    meetings_held: num(r.meetings_held),
    closed_sales: num(r.closed_sales),
    revenue: num(r.revenue),
    close_rate: num(r.close_rate),
    avg_deal_size: num(r.avg_deal_size),
    new_leads_entered: num(r.new_leads_entered),
    referrals_requested: num(r.referrals_requested),
    community_activities: num(r.community_activities),
  };
}

export default function PerformanceReport() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { supabase, orgId } = useCRMService();
  const { orgLoading } = useOrg();
  const canExport = useCanExportReports();
  const isLeadManager = useIsLeadManager();
  const { user } = useAuth();

  // Non-managers are clamped to their own data by the RBAC rule from the
  // Sales Plan 2026 spec: "a regular rep cannot see another rep's
  // individual dashboard unless they also hold the Lead Manager role."
  const [repIds, setRepIds] = useState<string[] | null>(
    isLeadManager ? null : (user?.id ? [user.id] : null)
  );

  const effectiveRepIds = isLeadManager ? repIds : (user?.id ? [user.id] : null);

  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: crmQueryKeys.reportPerformance(orgId, month, year, effectiveRepIds),
    queryFn: async () => {
      const { data: rows, error: rpcError } = await supabase.rpc('crm_individual_performance_filtered', {
        p_org_id: orgId,
        p_month: month,
        p_year: year,
        p_rep_ids: effectiveRepIds,
      });
      if (rpcError) throw rpcError;
      return ((rows ?? []) as Record<string, unknown>[]).map(mapPerformanceRow);
    },
    enabled: !!orgId && !orgLoading,
  });

  const chartData = useMemo(
    () =>
      data.map((r) => ({
        name: r.rep_name,
        Calls: r.calls_made,
        Emails: r.emails_sent,
        'LinkedIn': r.linkedin_messages,
        Presentations: r.presentations_given,
        Proposals: r.proposals_sent,
        Meetings: r.meetings_held,
        Community: r.community_activities,
      })),
    [data]
  );

  const handleExport = () => {
    if (!data.length) return;
    exportToXLSX(
      [
        { header: 'Rep Name', key: 'rep_name', width: 28 },
        { header: 'Calls', key: 'calls_made' },
        { header: 'Emails', key: 'emails_sent' },
        { header: 'LinkedIn Messages', key: 'linkedin_messages' },
        { header: 'Presentations', key: 'presentations_given' },
        { header: 'Proposals', key: 'proposals_sent' },
        { header: 'Meetings', key: 'meetings_held' },
        { header: 'Closed Sales', key: 'closed_sales' },
        { header: 'Revenue', key: 'revenue', format: 'currency' },
        { header: 'Close Rate %', key: 'close_rate', format: 'percent' },
        { header: 'Avg Deal Size', key: 'avg_deal_size', format: 'currency' },
        { header: 'Leads Entered', key: 'new_leads_entered' },
        { header: 'Referrals Requested', key: 'referrals_requested' },
        { header: 'Community Activities', key: 'community_activities' },
      ],
      data as unknown as Record<string, unknown>[],
      'Performance',
      `crm-performance-${year}-${String(month).padStart(2, '0')}.xlsx`
    );
  };

  return (
    <ReportLayout
      title="Individual performance"
      description="Per-rep activity and outcomes for the selected month."
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
        <h2 className="text-lg font-semibold text-th-text-primary mb-4">Activities per rep</h2>
        {isLoading ? (
          <div className="flex h-72 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-th-accent-600 border-t-transparent" />
          </div>
        ) : chartData.length === 0 ? (
          <p className="text-sm text-th-text-tertiary">No data for this period.</p>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-th-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={70} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Calls" stackId="act" fill={COLORS[0]} />
                <Bar dataKey="Emails" stackId="act" fill={COLORS[1]} />
                <Bar dataKey="LinkedIn" stackId="act" fill={COLORS[2]} />
                <Bar dataKey="Presentations" stackId="act" fill={COLORS[3]} />
                <Bar dataKey="Proposals" stackId="act" fill={COLORS[4]} />
                <Bar dataKey="Meetings" stackId="act" fill={COLORS[5]} />
                <Bar dataKey="Community" stackId="act" fill={COLORS[6]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-th-border bg-surface-primary">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-th-border bg-surface-secondary text-left text-th-text-secondary">
              <th className="px-3 py-2 font-medium">Rep Name</th>
              <th className="px-3 py-2 font-medium text-right">Calls</th>
              <th className="px-3 py-2 font-medium text-right">Emails</th>
              <th className="px-3 py-2 font-medium text-right">LinkedIn</th>
              <th className="px-3 py-2 font-medium text-right">Presentations</th>
              <th className="px-3 py-2 font-medium text-right">Proposals</th>
              <th className="px-3 py-2 font-medium text-right">Meetings</th>
              <th className="px-3 py-2 font-medium text-right">Closed Sales</th>
              <th className="px-3 py-2 font-medium text-right">Revenue</th>
              <th className="px-3 py-2 font-medium text-right">Close %</th>
              <th className="px-3 py-2 font-medium text-right">Avg Deal</th>
              <th className="px-3 py-2 font-medium text-right">Leads Entered</th>
              <th className="px-3 py-2 font-medium text-right">Referrals Req.</th>
              <th className="px-3 py-2 font-medium text-right">Community</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={14} className="px-3 py-8 text-center text-th-text-tertiary">
                  Loading…
                </td>
              </tr>
            ) : (
              data.map((r) => (
                <tr key={r.rep_id} className="border-b border-th-border">
                  <td className="px-3 py-2 text-th-text-primary">{r.rep_name}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.calls_made}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.emails_sent}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.linkedin_messages}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.presentations_given}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.proposals_sent}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.meetings_held}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.closed_sales}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {r.revenue.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.close_rate.toFixed(1)}%</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {r.avg_deal_size.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.new_leads_entered}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.referrals_requested}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.community_activities}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </ReportLayout>
  );
}
