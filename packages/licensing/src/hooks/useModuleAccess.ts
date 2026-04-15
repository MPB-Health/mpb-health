// ============================================================================
// Hook: useModuleAccess — Check if current org has access to a module
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { licensingService } from '../LicensingService';
import type { ModuleSlug } from '../types';

export interface UseModuleAccessReturn {
  hasAccess: boolean;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useModuleAccess(orgId: string | null, moduleSlug: ModuleSlug): UseModuleAccessReturn {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const check = useCallback(async () => {
    if (!orgId) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await licensingService.orgHasModule(orgId, moduleSlug);
      setHasAccess(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to check module access'));
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  }, [orgId, moduleSlug]);

  useEffect(() => {
    check();
  }, [check]);

  return { hasAccess, loading, error, refresh: check };
}
