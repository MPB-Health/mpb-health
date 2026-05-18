// ============================================================================
// Organization Hook — Provides organization context from the advisor profile
// ============================================================================

import { useMemo } from 'react';
import { useAdvisor } from '../contexts/AdvisorContext';
import { useAdvisorQueryReady } from './useAdvisorQueryReady';

export interface Organization {
  id: string;
  name?: string;
}

export function useOrganization() {
  const { profile, loading: authInitializing, hasSession } = useAdvisor();
  const { advisorReady } = useAdvisorQueryReady();
  /** Don’t block org-scoped fetches on background profile refresh once the advisor row is hydrated. */
  const loading = authInitializing || (hasSession && !advisorReady);

  const organization = useMemo<Organization | null>(() => {
    if (!profile?.org_id) return null;
    return {
      id: profile.org_id,
    };
  }, [profile?.org_id]);

  return {
    organization,
    loading,
    orgId: profile?.org_id || null,
  };
}
