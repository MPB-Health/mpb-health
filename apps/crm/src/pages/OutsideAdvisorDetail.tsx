import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCRMService } from '../contexts/CRMServiceContext';
import { useOrg } from '../contexts/OrgContext';
import { crmQueryKeys } from '../query/crmQueryKeys';
import { GradientHeader } from '@mpbhealth/ui';

export default function OutsideAdvisorDetail() {
  const { id } = useParams<{ id: string }>();
  const { outsideAdvisorService } = useCRMService();
  const { activeOrgId } = useOrg();

  const now = useMemo(() => new Date(), []);
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const { data: advisor, isLoading: loadingAdvisor } = useQuery({
    queryKey: crmQueryKeys.outsideAdvisor(activeOrgId, id ?? ''),
    queryFn: () => outsideAdvisorService.getAdvisor(id!),
    enabled: !!activeOrgId && !!id,
  });

  const { data: production = [], isLoading: loadingProd } = useQuery({
    queryKey: crmQueryKeys.advisorProduction(activeOrgId, month, year),
    queryFn: () => outsideAdvisorService.getAdvisorProduction(month, year),
    enabled: !!activeOrgId && !!id,
  });

  const row = useMemo(
    () => production.find((p) => p.advisor_id === id),
    [production, id]
  );

  if (!id) {
    return <p className="text-th-text-tertiary">Missing advisor id.</p>;
  }

  if (loadingAdvisor) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-th-accent-600 border-t-transparent" />
      </div>
    );
  }

  if (!advisor) {
    return (
      <div className="space-y-4">
        <Link
          to="/outside-advisors"
          className="inline-flex items-center gap-1 text-sm text-th-accent-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to advisors
        </Link>
        <p className="text-th-text-tertiary">Advisor not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Link
          to="/outside-advisors"
          className="inline-flex items-center gap-1 text-sm text-th-accent-600 hover:underline w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Back to advisors
        </Link>
        <GradientHeader
          title={advisor.name}
          subtitle={advisor.company ?? 'Outside advisor'}
        />
      </div>

      <div className="rounded-xl border border-th-border bg-surface-primary p-4 space-y-3">
        <h2 className="text-sm font-semibold text-th-text-primary">Contact</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-th-text-tertiary">Company</dt>
            <dd className="text-th-text-primary">{advisor.company || '—'}</dd>
          </div>
          <div>
            <dt className="text-th-text-tertiary">Email</dt>
            <dd className="text-th-text-primary">{advisor.email || '—'}</dd>
          </div>
          <div>
            <dt className="text-th-text-tertiary">Phone</dt>
            <dd className="text-th-text-primary">{advisor.phone || '—'}</dd>
          </div>
          <div>
            <dt className="text-th-text-tertiary">Status</dt>
            <dd className="text-th-text-primary">{advisor.is_active ? 'Active' : 'Inactive'}</dd>
          </div>
        </dl>
        {advisor.notes && (
          <p className="text-sm text-th-text-secondary border-t border-th-border pt-3">{advisor.notes}</p>
        )}
      </div>

      <div className="rounded-xl border border-th-border bg-surface-primary overflow-hidden">
        <div className="border-b border-th-border px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <h2 className="text-sm font-semibold text-th-text-primary">Production stats</h2>
          <p className="text-xs text-th-text-tertiary">
            Month {month}/{year} · Matched leads where source is outside advisors and CTA contains advisor
            name
          </p>
        </div>
        {loadingProd ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-th-accent-600 border-t-transparent" />
          </div>
        ) : !row ? (
          <p className="py-8 text-center text-sm text-th-text-tertiary">
            No production row for this period (advisor may be inactive or no matching leads).
          </p>
        ) : (
          <div className="p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Leads (month)', value: row.leads_month },
              { label: 'Closed (month)', value: row.closed_month },
              { label: 'Leads (YTD)', value: row.leads_ytd },
              { label: 'Closed (YTD)', value: row.closed_ytd },
            ].map((cell) => (
              <div
                key={cell.label}
                className="rounded-lg border border-th-border bg-th-accent-50/30 dark:bg-th-accent-900/10 p-3"
              >
                <p className="text-xs font-medium text-th-text-tertiary">{cell.label}</p>
                <p className="mt-1 text-xl font-semibold text-th-text-primary tabular-nums">{cell.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
