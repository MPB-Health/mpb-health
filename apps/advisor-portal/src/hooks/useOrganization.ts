// ============================================================================
// Organization Hook — Provides organization context from the advisor profile
// ============================================================================

import { useMemo } from 'react';
import { useAdvisor } from '../contexts/AdvisorContext';

export interface Organization {
  id: string;
  name?: string;
}

export function useOrganization() {
  const { profile, loading } = useAdvisor();

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
