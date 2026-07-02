import { useCallback } from 'react';
import { useNavigate, type NavigateOptions } from 'react-router-dom';
import { useTenantPath } from '@mpbhealth/auth';

/** navigate() wrapper for the concierge portal (MPB-only, flat routes on concierge.mpb.health). */
export function useConciergeNavigate() {
  const navigate = useNavigate();
  const toTenantPath = useTenantPath();

  return useCallback(
    (to: string, options?: NavigateOptions) => navigate(toTenantPath(to), options),
    [navigate, toTenantPath],
  );
}
