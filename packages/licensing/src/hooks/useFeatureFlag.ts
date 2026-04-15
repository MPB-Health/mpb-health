// ============================================================================
// Hook: useFeatureFlag — Check if a feature flag is enabled for current org
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { licensingService } from '../LicensingService';

export interface UseFeatureFlagReturn {
  enabled: boolean;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useFeatureFlag(orgId: string | null, featureSlug: string): UseFeatureFlagReturn {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const check = useCallback(async () => {
    if (!orgId) {
      setEnabled(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await licensingService.orgHasFeature(orgId, featureSlug);
      setEnabled(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to check feature flag'));
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  }, [orgId, featureSlug]);

  useEffect(() => {
    check();
  }, [check]);

  return { enabled, loading, error, refresh: check };
}
