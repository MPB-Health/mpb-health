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
import { useCanExportReports } from '../../hooks/useCanExportReports';
import { exportToXLSX } from '../../lib/xlsxExport';

interface OECampaignRow {
  campaign_year: number;
  total_targeted: number;
  emails_delivered: number;
  emails_opened: number;
  replies_received: number;
  reactivated: number;
  converted_won: number;
  delivery_pct: number;
  open_pct: number;
  response_pct: number;
  conversion_pct: number;
}

export default function OEReactivationReport() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { supabase, orgId } = useCRMService();
  const { activeOrgId, orgLoading } = useOrg();
  const canExport = useCanExportReports();
  const oid = orgId ?? activeOrgId;

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['crm', oid ?? 'none', 'report', 'oeReactivation', year],
    enabled: !!oid && !orgLoading,
    queryFn: async () => {
      const { data: rows, error: rpcError } = await supabase.rpc(
        'crm_oe_reactivation_campaign_report',
        { p_org_id: oid, p_year: year },
      );
      if (rpcError) {
        const { count: targeted } = await supabase
          .from('crm_lead_cadence_state')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', oid!);
        const { count: emailsSent } = await supabase
          .from('crm_email_log')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', oid!)
          .gte('sent_at', `${year}-09-01`)
          .lt('sent_at', `${year}-12-31`);

        const t = targeted ?? 0;
        const sent = emailsSent ?? 0;
        return [
          {
            campaign_year: year,
            total_targeted: t,
            emails_delivered: sent,
            emails_opened: 0,
            replies_received: 0,
            reactivated: 0,
            converted_won: 0,
            delivery_pct: t > 0 ? Math.round((sent / t) * 1000) / 10 : 0,
            open_pct: 0,
            response_pct: 0,
            conversion_pct: 0,
          },
        ] as OECampaignRow[];
      }
      return (rows ?? []) as OECampaignRow[];
    },
  });

  const chartData = useMemo(
    () =>
      data.map((r) => ({
        year: String(r.campaign_year),
        delivered: r.delivery_pct,
        opened: r.open_pct,
        responded: r.response_pct,
        converted: r.conversion_pct,
      })),
    [data],
  );

  const handleExport = () => {
    if (!data.length) return;
    exportToXLSX(
      [
        { header: 'Campaign Year', key: 'campaign_year', width: 14 },
        { header: 'Targeted', key: 'total_targeted', width: 12 },
        { header: 'Delivered', key: 'emails_delivered', width: 12 },
        { header: 'Opened', key: 'emails_opened', width: 12 },
        { header: 'Replies', key: 'replies_received', width: 12 },
        { header: 'Reactivated', key: 'reactivated', width: 12 },
        { header: 'Won', key: 'converted_won', width: 10 },
        { header: 'Delivery %', key: 'delivery_pct', width: 12, format: 'percent' },
        { header: 'Open %', key: 'open_pct', width: 10, format: 'percent' },
        { header: 'Response %', key: 'response_pct', width: 12, format: 'percent' },
        { header: 'Conversion %', key: 'conversion_pct', width: 14, format: 'percent' },
      ],
      data as unknown as Record<string, unknown>[],
      'OE Reactivation',
      `crm-oe-reactivation-${year}.xlsx`,
    );
  };

  return (
    <ReportLayout
      title="OE Reactivation Campaign"
      description="Annual Open Enrollment reactivation campaign performance: delivery, opens, responses, and conversions per campaign push."
      month={month}
      year={year}
      onMonthChange={setMonth}
      onYearChange={setYear}
      yearOnly
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
              <th className="p-3 font-medium">Year</th>
              <th className="p-3 font-medium text-right">Targeted</th>
              <th className="p-3 font-medium text-right">Delivered</th>
              <th className="p-3 font-medium text-right">Opened</th>
              <th className="p-3 font-medium text-right">Replies</th>
              <th className="p-3 font-medium text-right">Reactivated</th>
              <th className="p-3 font-medium text-right">Won</th>
              <th className="p-3 font-medium text-right">Delivery %</th>
              <th className="p-3 font-medium text-right">Open %</th>
              <th className="p-3 font-medium text-right">Response %</th>
              <th className="p-3 font-medium text-right">Conv %</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={11} className="p-6 text-th-text-secondary text-center">Loading…</td>
              </tr>
            ) : !data.length ? (
              <tr>
                <td colSpan={11} className="p-6 text-th-text-secondary text-center">
                  No OE campaign data for {year}.
                </td>
              </tr>
            ) : (
              data.map((r) => (
                <tr key={r.campaign_year} className="border-b border-th-border/60">
                  <td className="p-3 font-medium text-th-text-primary">{r.campaign_year}</td>
                  <td className="p-3 text-right tabular-nums">{r.total_targeted}</td>
                  <td className="p-3 text-right tabular-nums">{r.emails_delivered}</td>
                  <td className="p-3 text-right tabular-nums">{r.emails_opened}</td>
                  <td className="p-3 text-right tabular-nums">{r.replies_received}</td>
                  <td className="p-3 text-right tabular-nums">{r.reactivated}</td>
                  <td className="p-3 text-right tabular-nums font-medium">{r.converted_won}</td>
                  <td className="p-3 text-right tabular-nums">{r.delivery_pct}%</td>
                  <td className="p-3 text-right tabular-nums">{r.open_pct}%</td>
                  <td className="p-3 text-right tabular-nums">{r.response_pct}%</td>
                  <td className="p-3 text-right tabular-nums font-medium text-emerald-600">
                    {r.conversion_pct}%
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-th-border bg-surface-primary p-4 h-[340px]">
        <h3 className="text-sm font-medium text-th-text-secondary mb-3">
          Campaign funnel rates by year
        </h3>
        {chartData.length === 0 ? (
          <p className="text-sm text-th-text-tertiary">No chart data.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ left: 12, right: 16, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-th-border" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v: number) => `${v}%`} />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Legend />
              <Bar dataKey="delivered" name="Delivery %" fill="#3B82F6" />
              <Bar dataKey="opened" name="Open %" fill="#8B5CF6" />
              <Bar dataKey="responded" name="Response %" fill="#F59E0B" />
              <Bar dataKey="converted" name="Conv %" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ReportLayout>
  );
}
