import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCRMService } from '../../contexts/CRMServiceContext';
import { useOrg } from '../../contexts/OrgContext';
import { ReportLayout } from '../../components/reports/ReportLayout';
import { useCanExportReports } from '../../hooks/useCanExportReports';
import { exportToXLSX } from '../../lib/xlsxExport';
import { crmQueryKeys } from '../../query/crmQueryKeys';

type AdvisorProductionRow = {
  advisor_id: string;
  advisor_name: string;
  leads_month: number;
  closed_month: number;
  leads_ytd: number;
  closed_ytd: number;
};

export default function AdvisorProductionReport() {
  const now = new Date();
  const [month, setMonth] = useState(() => now.getMonth() + 1);
  const [year, setYear] = useState(() => now.getFullYear());
  const { supabase, orgId } = useCRMService();
  const { activeOrgId } = useOrg();
  const canExport = useCanExportReports();

  const { data, isLoading, error } = useQuery({
    queryKey: crmQueryKeys.reportAdvisorProduction(orgId ?? activeOrgId, month, year),
    enabled: Boolean(orgId ?? activeOrgId),
    queryFn: async () => {
      const oid = orgId ?? activeOrgId;
      if (!oid) return [];
      const { data: rows, error: rpcError } = await supabase.rpc('crm_outside_advisor_production', {
        p_org_id: oid,
        p_month: month,
        p_year: year,
      });
      if (rpcError) throw rpcError;
      return (rows ?? []).map((r: AdvisorProductionRow) => ({
        ...r,
        leads_month: Number(r.leads_month),
        closed_month: Number(r.closed_month),
        leads_ytd: Number(r.leads_ytd),
        closed_ytd: Number(r.closed_ytd),
      })) as AdvisorProductionRow[];
    },
  });

  const handleExport = () => {
    if (!data?.length) return;
    exportToXLSX(
      [
        { header: 'Advisor Name', key: 'advisor_name', width: 28 },
        { header: 'Leads (Month)', key: 'leads_month', width: 14 },
        { header: 'Closed (Month)', key: 'closed_month', width: 14 },
        { header: 'Leads (YTD)', key: 'leads_ytd', width: 14 },
        { header: 'Closed (YTD)', key: 'closed_ytd', width: 14 },
      ],
      data.map((r) => ({
        advisor_name: r.advisor_name,
        leads_month: r.leads_month,
        closed_month: r.closed_month,
        leads_ytd: r.leads_ytd,
        closed_ytd: r.closed_ytd,
      })),
      'Advisor production',
      `crm-advisor-production-${year}-${String(month).padStart(2, '0')}.xlsx`
    );
  };

  return (
    <ReportLayout
      title="Outside advisor production"
      description="Lead and closed counts attributed to outside advisors for the month and year-to-date."
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
              <th className="p-3 font-medium">Advisor Name</th>
              <th className="p-3 font-medium text-right">Leads (Month)</th>
              <th className="p-3 font-medium text-right">Closed (Month)</th>
              <th className="p-3 font-medium text-right">Leads (YTD)</th>
              <th className="p-3 font-medium text-right">Closed (YTD)</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-6 text-th-text-secondary text-center">
                  Loading…
                </td>
              </tr>
            ) : !data?.length ? (
              <tr>
                <td colSpan={5} className="p-6 text-th-text-secondary text-center">
                  No advisors or no data for this period.
                </td>
              </tr>
            ) : (
              data.map((r) => (
                <tr key={r.advisor_id} className="border-b border-th-border/60">
                  <td className="p-3">{r.advisor_name}</td>
                  <td className="p-3 text-right tabular-nums">{r.leads_month}</td>
                  <td className="p-3 text-right tabular-nums">{r.closed_month}</td>
                  <td className="p-3 text-right tabular-nums">{r.leads_ytd}</td>
                  <td className="p-3 text-right tabular-nums">{r.closed_ytd}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </ReportLayout>
  );
}
