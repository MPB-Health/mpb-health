import { useQuery } from '@tanstack/react-query';
import { getLeadAssignees, type LeadAssignee } from '@mpbhealth/crm-core/leads';
import { useCRMService } from '../contexts/CRMServiceContext';
import { crmQueryKeys } from '../query/crmQueryKeys';

export type { LeadAssignee };

export function useLeadAssignees() {
  const { supabase, orgId } = useCRMService();

  return useQuery({
    queryKey: [...crmQueryKeys.org(orgId), 'leadAssignees'] as const,
    enabled: !!orgId,
    staleTime: 60_000,
    queryFn: () => getLeadAssignees(supabase, orgId!),
  });
}
