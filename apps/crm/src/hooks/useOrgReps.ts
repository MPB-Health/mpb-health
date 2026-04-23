import { useQuery } from '@tanstack/react-query';
import { useCRMService } from '../contexts/CRMServiceContext';
import { crmQueryKeys } from '../query/crmQueryKeys';

export interface OrgRep {
  user_id: string;
  display_name: string;
  email: string | null;
  role: string;
}

/**
 * Fetches the list of active org members for the current org. Used by the
 * report rep-filter dropdown.
 *
 * Stable alphabetized by display_name so the rep switcher order is consistent
 * between renders.
 */
export function useOrgReps() {
  const { supabase, orgId } = useCRMService();

  return useQuery({
    queryKey: [...crmQueryKeys.org(orgId), 'orgReps'] as const,
    enabled: !!orgId,
    staleTime: 60_000,
    queryFn: async (): Promise<OrgRep[]> => {
      const { data, error } = await supabase
        .from('org_memberships')
        .select('user_id, role, status, profile:profiles(id, first_name, last_name, display_name, email)')
        .eq('org_id', orgId)
        .eq('status', 'active');

      if (error) throw error;

      return (data ?? []).map((row: Record<string, unknown>) => {
        const profile = row.profile as
          | { display_name?: string | null; first_name?: string | null; last_name?: string | null; email?: string | null }
          | null;
        const displayName = profile?.display_name
          || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim()
          || profile?.email
          || (row.user_id as string).slice(0, 8);
        return {
          user_id: row.user_id as string,
          display_name: displayName,
          email: profile?.email ?? null,
          role: (row.role as string) ?? 'member',
        };
      }).sort((a, b) => a.display_name.localeCompare(b.display_name));
    },
  });
}
