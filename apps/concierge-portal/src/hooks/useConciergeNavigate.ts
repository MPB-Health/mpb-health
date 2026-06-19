import { useCallback } from 'react';
import { useNavigate, type NavigateOptions } from 'react-router-dom';
import { useTenantPath } from '@mpbhealth/auth';

/** navigate() with automatic /{tenantSlug} prefix on concierge.aryxcloud.com; flat on concierge.mpb.health. */
export function useConciergeNavigate() {
  const navigate = useNavigate();
  const toTenantPath = useTenantPath();

  return useCallback(
    (to: string, options?: NavigateOptions) => navigate(toTenantPath(to), options),
    [navigate, toTenantPath],
  );
}
