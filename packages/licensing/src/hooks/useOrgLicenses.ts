// ============================================================================
// Hook: useOrgLicenses — Get all active licenses and features for an org
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { licensingService } from '../LicensingService';
import type { OrgLicenseSummary, ModuleSlug } from '../types';

export interface UseOrgLicensesReturn {
  summary: OrgLicenseSummary | null;
  loading: boolean;
  error: Error | null;
  hasModule: (slug: ModuleSlug) => boolean;
  hasFeature: (slug: string) => boolean;
  refresh: () => Promise<void>;
}

export function useOrgLicenses(orgId: string | null): UseOrgLicensesReturn {
  const [summary, setSummary] = useState<OrgLicenseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!orgId) {
      setSummary(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await licensingService.getOrgLicenseSummary(orgId);
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load licenses'));
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const hasModule = useCallback(
    (slug: ModuleSlug): boolean => {
      if (!summary) return false;
      return summary.modules.some(m => m.slug === slug && m.status === 'active');
    },
    [summary]
  );

  const hasFeature = useCallback(
    (slug: string): boolean => {
      if (!summary) return false;
      return summary.features.some(f => f.slug === slug);
    },
    [summary]
  );

  return { summary, loading, error, hasModule, hasFeature, refresh: fetch };
}
