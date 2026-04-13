import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { differenceInCalendarDays } from 'date-fns';
import toast from 'react-hot-toast';
import { useCRMService } from '../contexts/CRMServiceContext';
import { useOrg } from '../contexts/OrgContext';
import { crmQueryKeys } from '../query/crmQueryKeys';
import { GradientHeader } from '@mpbhealth/ui';

interface StaleLeadRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  pipeline_stage: string | null;
  last_contacted_at: string | null;
}

const CLOSED_STAGES = '(won,converted,closed_won)';

export default function Reactivation() {
  const { supabase, cadenceService } = useCRMService();
  const { activeOrgId } = useOrg();
  const queryClient = useQueryClient();

  const [minDaysInactive, setMinDaysInactive] = useState(90);
  const [stageFilter, setStageFilter] = useState<string>('all');

  const stageKey = stageFilter;

  const { data: cadences = [] } = useQuery({
    queryKey: crmQueryKeys.cadences(activeOrgId),
    queryFn: () => cadenceService.getCadences(),
    enabled: !!activeOrgId,
  });

  const reactivationCadenceId = useMemo(() => {
    const c = cadences.find((x) => x.is_active && x.name.toLowerCase().includes('reactivation'));
    return c?.id ?? null;
  }, [cadences]);

  const { data: staleLeads = [], isLoading } = useQuery({
    queryKey: crmQueryKeys.reactivationStaleLeads(activeOrgId, minDaysInactive, stageKey),
    enabled: !!activeOrgId,
    queryFn: async (): Promise<StaleLeadRow[]> => {
      let q = supabase
        .from('lead_submissions')
        .select('id, first_name, last_name, email, pipeline_stage, last_contacted_at')
        .eq('org_id', activeOrgId!)
        .not('pipeline_stage', 'in', CLOSED_STAGES)
        .order('last_contacted_at', { ascending: true, nullsFirst: true })
        .limit(800);

      if (stageFilter !== 'all') {
        q = q.eq('pipeline_stage', stageFilter);
      }

      const { data, error } = await q;
      if (error || !data) {
        console.error('Reactivation leads query failed:', error);
        return [];
      }

      const now = Date.now();
      const minMs = minDaysInactive * 86_400_000;

      return (data as StaleLeadRow[]).filter((row) => {
        if (!row.last_contacted_at) return true;
        return now - new Date(row.last_contacted_at).getTime() >= minMs;
      });
    },
  });

  const enrollMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const cadenceId = reactivationCadenceId ?? undefined;
      const state = await cadenceService.enrollLead(leadId, cadenceId);
      return { state, usedCadenceId: cadenceId };
    },
    onSuccess: ({ state }, leadId) => {
      queryClient.invalidateQueries({
        queryKey: crmQueryKeys.reactivationStaleLeads(activeOrgId, minDaysInactive, stageKey),
      });
      if (leadId) {
        queryClient.invalidateQueries({ queryKey: crmQueryKeys.leadCadenceState(activeOrgId, leadId) });
      }
      if (state) toast.success('Enrolled in reactivation cadence');
      else
        toast.error(
          reactivationCadenceId || cadences.some((c) => c.is_default)
            ? 'Could not enroll (check cadence steps and permissions)'
            : 'Set up an active cadence named “Reactivation” or mark a default cadence'
        );
    },
    onError: () => toast.error('Enrollment failed'),
  });

  const displayName = (row: StaleLeadRow) =>
    [row.first_name, row.last_name].filter(Boolean).join(' ') || row.email || 'Lead';

  const daysSinceContact = (row: StaleLeadRow) => {
    if (!row.last_contacted_at) return null;
    return differenceInCalendarDays(new Date(), new Date(row.last_contacted_at));
  };

  return (
    <div className="space-y-6">
      <GradientHeader
        title="Reactivation pipeline"
        subtitle="Open leads with no recent contact — enroll into a follow-up cadence to bring them back."
      />

      {!reactivationCadenceId && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          No active cadence with &quot;reactivation&quot; in the name was found. Enrollment will fall back
          to the org default cadence if one exists. Create a cadence named e.g. &quot;Reactivation&quot; for
          explicit routing.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-th-border bg-surface-primary p-4">
        <label className="text-sm text-th-text-secondary flex items-center gap-2">
          Min. days inactive
          <select
            value={minDaysInactive}
            onChange={(e) => setMinDaysInactive(Number(e.target.value))}
            className="rounded-lg border border-th-border bg-surface-primary px-2 py-1.5 text-sm text-th-text-primary focus:outline-none focus:ring-1 focus:ring-th-accent-500"
          >
            {[30, 60, 90, 120, 180].map((d) => (
              <option key={d} value={d}>
                {d}+ days
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-th-text-secondary flex items-center gap-2">
          Pipeline stage
          <input
            list="reactivation-stages"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value || 'all')}
            placeholder="all"
            className="rounded-lg border border-th-border bg-surface-primary px-2 py-1.5 text-sm text-th-text-primary w-44"
          />
          <datalist id="reactivation-stages">
            <option value="all" />
            <option value="new" />
            <option value="contacted" />
            <option value="qualified" />
            <option value="proposal" />
            <option value="negotiation" />
          </datalist>
        </label>
      </div>

      <div className="rounded-xl border border-th-border bg-surface-primary overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-th-accent-600 border-t-transparent" />
          </div>
        ) : staleLeads.length === 0 ? (
          <p className="py-12 text-center text-sm text-th-text-tertiary">
            No stale leads match these filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-th-border bg-th-accent-50/40 dark:bg-th-accent-900/10">
                  <th className="text-left px-4 py-3 font-medium text-th-text-secondary">Lead</th>
                  <th className="text-left px-4 py-3 font-medium text-th-text-secondary">Stage</th>
                  <th className="text-left px-4 py-3 font-medium text-th-text-secondary">
                    Last contacted
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-th-text-secondary">Action</th>
                </tr>
              </thead>
              <tbody>
                {staleLeads.map((row) => {
                  const days = daysSinceContact(row);
                  return (
                    <tr key={row.id} className="border-b border-th-border last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          to={`/leads/${row.id}`}
                          className="font-medium text-th-accent-600 hover:underline"
                        >
                          {displayName(row)}
                        </Link>
                        {row.email && (
                          <p className="text-xs text-th-text-tertiary mt-0.5">{row.email}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-th-text-secondary">
                        {row.pipeline_stage || '—'}
                      </td>
                      <td className="px-4 py-3 text-th-text-secondary">
                        {row.last_contacted_at
                          ? `${new Date(row.last_contacted_at).toLocaleDateString()} (${days}d ago)`
                          : 'Never'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={enrollMutation.isPending}
                          onClick={() => enrollMutation.mutate(row.id)}
                          className="rounded-lg bg-th-accent-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-th-accent-700 disabled:opacity-60"
                        >
                          Enroll in reactivation
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
