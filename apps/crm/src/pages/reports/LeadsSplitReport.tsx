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

/** Sources that roll up into “TOTAL Self-Gen” (case-insensitive). */
const SELF_GEN_SOURCE_KEYS = new Set(['linkedin', 'networking', 'referrals', 'community', 'reactivation']);

function normalizeSourceLabel(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, '_');
}

export interface LeadsSplitRow {
  source_label: string;
  lead_count: number;
  is_self_generated: boolean;
}

function num(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number(v) || 0;
  return 0;
}

function mapRow(r: Record<string, unknown>): LeadsSplitRow {
  return {
    source_label: String(r.source_label ?? ''),
    lead_count: num(r.lead_count),
    is_self_generated: Boolean(r.is_self_generated),
  };
}

export default function LeadsSplitReport() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { supabase, orgId } = useCRMService();
  const { orgLoading } = useOrg();

  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: crmQueryKeys.reportLeadsSplit(orgId, month, year),
    queryFn: async () => {
      const { data: rows, error: rpcError } = await supabase.rpc('crm_leads_inhouse_vs_selfgen', {
        p_org_id: orgId,
        p_month: month,
        p_year: year,
      });
      if (rpcError) throw rpcError;
      return ((rows ?? []) as Record<string, unknown>[]).map(mapRow);
    },
    enabled: !!orgId && !orgLoading,
  });

  const { pieData, totalSelfGenSources, totalInhouseFromSplit, grandTotal } = useMemo(() => {
    let selfGenFlag = 0;
    let inhouseFlag = 0;
    let selfGenSources = 0;
    let total = 0;

    for (const row of data) {
      total += row.lead_count;
      if (row.is_self_generated) selfGenFlag += row.lead_count;
      else inhouseFlag += row.lead_count;

      if (SELF_GEN_SOURCE_KEYS.has(normalizeSourceLabel(row.source_label))) {
        selfGenSources += row.lead_count;
      }
    }

    const pie = [
      { name: 'Self-generated', value: selfGenFlag },
      { name: 'In-house', value: inhouseFlag },
    ].filter((d) => d.value > 0);

    return {
      pieData: pie,
      totalSelfGenSources: selfGenSources,
      totalInhouseFromSplit: Math.max(0, total - selfGenSources),
      grandTotal: total,
    };
  }, [data]);

  const handleExport = () => {
    if (!data.length && grandTotal === 0) return;
    const rows: Record<string, unknown>[] = data.map((r) => ({
      source: r.source_label,
      count: r.lead_count,
      self_generated: r.is_self_generated ? 'Yes' : 'No',
    }));
    rows.push({
      source: 'TOTAL Self-Gen (LinkedIn+Networking+Referrals+Community+Reactivation)',
      count: totalSelfGenSources,
      self_generated: '',
    });
    rows.push({
      source: 'TOTAL In-house (remainder)',
      count: totalInhouseFromSplit,
      self_generated: '',
    });
    rows.push({ source: 'GRAND TOTAL', count: grandTotal, self_generated: '' });

    exportToXLSX(
      [
        { header: 'Source', key: 'source', width: 48 },
        { header: 'Count', key: 'count' },
        { header: 'Self-Generated', key: 'self_generated', width: 16 },
      ],
      rows,
      'Leads split',
      `crm-leads-split-${year}-${String(month).padStart(2, '0')}.xlsx`
    );
  };

  return (
    <ReportLayout
      title="Leads: in-house vs self-generated"
      description="Lead volume by source and self-generated flag for the selected month."
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
          <h2 className="text-lg font-semibold text-th-text-primary mb-2">Totals</h2>
          <ul className="space-y-2 text-sm text-th-text-secondary">
            <li>
              <span className="font-medium text-th-text-primary">TOTAL Self-Gen</span> (LinkedIn + Networking + Referrals +
              Community + Reactivation):{' '}
              <span className="tabular-nums font-semibold text-th-text-primary">{totalSelfGenSources.toLocaleString()}</span>
            </li>
            <li>
              <span className="font-medium text-th-text-primary">TOTAL In-house</span> (remainder):{' '}
              <span className="tabular-nums font-semibold text-th-text-primary">{totalInhouseFromSplit.toLocaleString()}</span>
            </li>
            <li>
              <span className="font-medium text-th-text-primary">GRAND TOTAL</span>:{' '}
              <span className="tabular-nums font-semibold text-th-text-primary">{grandTotal.toLocaleString()}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-th-border bg-surface-primary">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-th-border bg-surface-secondary text-left text-th-text-secondary">
              <th className="px-3 py-2 font-medium">Source</th>
              <th className="px-3 py-2 font-medium text-right">Count</th>
              <th className="px-3 py-2 font-medium">Self-generated</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-3 py-8 text-center text-th-text-tertiary">
                  Loading…
                </td>
              </tr>
            ) : (
              <>
                {data.map((r, idx) => (
                  <tr key={`${r.source_label}-${r.is_self_generated}-${idx}`} className="border-b border-th-border">
                    <td className="px-3 py-2 text-th-text-primary">{r.source_label}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.lead_count.toLocaleString()}</td>
                    <td className="px-3 py-2">{r.is_self_generated ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-th-border bg-surface-secondary font-medium">
                  <td className="px-3 py-2 text-th-text-primary">
                    TOTAL Self-Gen (LinkedIn + Networking + Referrals + Community + Reactivation)
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{totalSelfGenSources.toLocaleString()}</td>
                  <td className="px-3 py-2">—</td>
                </tr>
                <tr className="bg-surface-secondary font-medium">
                  <td className="px-3 py-2 text-th-text-primary">TOTAL In-house (remainder)</td>
                  <td className="px-3 py-2 text-right tabular-nums">{totalInhouseFromSplit.toLocaleString()}</td>
                  <td className="px-3 py-2">—</td>
                </tr>
                <tr className="bg-surface-secondary font-semibold">
                  <td className="px-3 py-2 text-th-text-primary">GRAND TOTAL</td>
                  <td className="px-3 py-2 text-right tabular-nums">{grandTotal.toLocaleString()}</td>
                  <td className="px-3 py-2">—</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </ReportLayout>
  );
}
