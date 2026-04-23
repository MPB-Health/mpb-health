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
import { useAuth } from '../../contexts/AuthContext';
import { ReportLayout } from '../../components/reports/ReportLayout';
import { ReportRepFilter } from '../../components/reports/ReportRepFilter';
import { useCanExportReports } from '../../hooks/useCanExportReports';
import { useIsLeadManager } from '../../hooks/useIsLeadManager';
import { exportToXLSX } from '../../lib/xlsxExport';
import { crmQueryKeys } from '../../query/crmQueryKeys';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#22C55E', '#EF4444'];

/**
 * Canonical row shape returned by `crm_leads_split_2026`. Rows come back
 * in spec display order: LinkedIn → Networking → Referrals → Community →
 * Reactivation → TOTAL Self-Gen → Inhouse (RR) → GRAND TOTAL.
 */
export interface LeadsSplitRow {
  display_order: number;
  row_kind: 'source' | 'subtotal' | 'grand_total';
  label: string;
  lead_count: number;
  closed_count: number;
  conversion_pct: number;
}

function num(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number(v) || 0;
  return 0;
}

function mapRow(r: Record<string, unknown>): LeadsSplitRow {
  return {
    display_order: num(r.display_order),
    row_kind: (r.row_kind as LeadsSplitRow['row_kind']) ?? 'source',
    label: String(r.label ?? ''),
    lead_count: num(r.lead_count),
    closed_count: num(r.closed_count),
    conversion_pct: num(r.conversion_pct),
  };
}

export default function LeadsSplitReport() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [ytd, setYtd] = useState(false);
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
    queryKey: crmQueryKeys.reportLeadsSplit(orgId, month, year, effectiveRepIds, ytd),
    queryFn: async () => {
      const { data: rows, error: rpcError } = await supabase.rpc('crm_leads_split_2026', {
        p_org_id: orgId,
        p_month: month,
        p_year: year,
        p_rep_ids: effectiveRepIds,
        p_ytd: ytd,
      });
      if (rpcError) throw rpcError;
      return ((rows ?? []) as Record<string, unknown>[])
        .map(mapRow)
        .sort((a, b) => a.display_order - b.display_order);
    },
    enabled: !!orgId && !orgLoading,
  });

  const pieData = useMemo(() => {
    const selfGen = data.find((r) => r.label === 'TOTAL Self-Gen')?.lead_count ?? 0;
    const inhouse = data.find((r) => r.label === 'Inhouse (RR)')?.lead_count ?? 0;
    return [
      { name: 'Self-Gen', value: selfGen },
      { name: 'Inhouse (RR)', value: inhouse },
    ].filter((d) => d.value > 0);
  }, [data]);

  const handleExport = () => {
    if (!data.length) return;
    exportToXLSX(
      [
        { header: 'Source', key: 'label', width: 40 },
        { header: 'Leads', key: 'lead_count' },
        { header: 'Closed', key: 'closed_count' },
        { header: 'Conv. %', key: 'conversion_pct', format: 'percent' },
      ],
      data as unknown as Record<string, unknown>[],
      'Leads split',
      `crm-leads-split-${year}-${String(month).padStart(2, '0')}${ytd ? '-ytd' : ''}.xlsx`,
    );
  };

  const rowClass = (kind: LeadsSplitRow['row_kind']) => {
    if (kind === 'grand_total') return 'bg-surface-secondary font-semibold border-t-2 border-th-border';
    if (kind === 'subtotal') return 'bg-surface-secondary font-medium';
    return 'border-b border-th-border';
  };

  return (
    <ReportLayout
      title="Leads: in-house vs self-generated"
      description={`Lead volume by spec row — ${ytd ? 'year to date' : 'selected month'}.`}
      month={month}
      year={year}
      onMonthChange={setMonth}
      onYearChange={setYear}
      onExport={canExport ? handleExport : undefined}
      showYtdToggle
      ytdEnabled={ytd}
      onYtdToggle={setYtd}
      filters={<ReportRepFilter value={repIds} onChange={setRepIds} />}
    >
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error instanceof Error ? error.message : 'Failed to load report'}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <h2 className="text-lg font-semibold text-th-text-primary mb-4">Self-gen vs in-house</h2>
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-th-accent-600 border-t-transparent" />
            </div>
          ) : pieData.length === 0 ? (
            <p className="text-sm text-th-text-tertiary">No leads in this period.</p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
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

        <div className="rounded-xl border border-th-border bg-surface-primary p-6">
          <h2 className="text-lg font-semibold text-th-text-primary mb-2">Spec totals</h2>
          <p className="text-xs text-th-text-tertiary mb-3">
            Rows match Sales Reports & Dashboards 2026 Slide 24.
          </p>
          <ul className="space-y-1.5 text-sm text-th-text-secondary">
            {data.filter((r) => r.row_kind !== 'source').map((r) => (
              <li key={r.label} className="flex justify-between">
                <span className="font-medium text-th-text-primary">{r.label}</span>
                <span className="tabular-nums">{r.lead_count.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-th-border bg-surface-primary">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-th-border bg-surface-secondary text-left text-th-text-secondary">
              <th className="px-3 py-2 font-medium">Source</th>
              <th className="px-3 py-2 font-medium text-right">Leads</th>
              <th className="px-3 py-2 font-medium text-right">Closed</th>
              <th className="px-3 py-2 font-medium text-right">Conv. %</th>
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
              data.map((r) => (
                <tr key={r.label} className={rowClass(r.row_kind)}>
                  <td className="px-3 py-2 text-th-text-primary">{r.label}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.lead_count.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.closed_count.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.conversion_pct.toFixed(1)}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </ReportLayout>
  );
}
