import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCRMService } from '../contexts/CRMServiceContext';
import { crmQueryKeys } from '../query/crmQueryKeys';
import { useOrgReps, type OrgRep } from './useOrgReps';

// ----------------------------------------------------------------------------
// CRM rebuild — Tracked-in-reports rep roster (2026-05-15)
// ----------------------------------------------------------------------------
// Source of truth: any user with a row in `crm_user_conversation_goal_overrides`
// for the current org is an inside-sales rep being tracked in reports.
// (Admins seed this table for Adam + Tupac per the Round 12 Addendum
// roster; reports + the Daily Log admin view filter to that same set.)
//
// Falls back to the full org reps list when no overrides exist yet so a
// fresh org doesn't render an empty rep dropdown — the consumer can read
// `isFallback` to decide whether to surface a "Seed the inside-sales
// roster in Settings → Daily Log" hint.

export interface TrackedRepsResult {
  reps: OrgRep[];
  isLoading: boolean;
  /** True when no override rows exist; we fell back to the full org roster. */
  isFallback: boolean;
}

export function useTrackedReps(): TrackedRepsResult {
  const { supabase, orgId } = useCRMService();
  const allReps = useOrgReps();

  const trackedQuery = useQuery({
    queryKey: [...crmQueryKeys.org(orgId), 'trackedRepIds'] as const,
    enabled: !!orgId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_user_conversation_goal_overrides')
        .select('user_id')
        .eq('org_id', orgId);
      if (error) throw error;
      return new Set<string>((data ?? []).map((r) => String((r as { user_id: string }).user_id)));
    },
  });

  return useMemo(() => {
    const reps = allReps.data ?? [];
    const trackedIds = trackedQuery.data ?? new Set<string>();
    const isLoading = allReps.isLoading || trackedQuery.isLoading;
    if (trackedIds.size === 0) {
      return { reps, isLoading, isFallback: true };
    }
    return {
      reps: reps.filter((r) => trackedIds.has(r.user_id)),
      isLoading,
      isFallback: false,
    };
  }, [allReps.data, allReps.isLoading, trackedQuery.data, trackedQuery.isLoading]);
}
