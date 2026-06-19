import { useCallback } from 'react';
import { useNavigate, type NavigateOptions } from 'react-router-dom';
import { useTenantPath } from '@mpbhealth/auth';

/** navigate() with automatic /{tenantSlug} prefix on AOS; identity on advisor.mpb.health. */
export function useAdvisorNavigate() {
  const navigate = useNavigate();
  const toTenantPath = useTenantPath();

  return useCallback(
    (to: string, options?: NavigateOptions) => navigate(toTenantPath(to), options),
    [navigate, toTenantPath],
  );
}
