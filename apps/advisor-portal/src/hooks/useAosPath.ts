import { useCallback } from 'react';
import { useTenant, withAosTenantPath } from '@mpbhealth/auth';

/** Prefix in-app paths with /{tenantSlug} on aos.aryxcloud.com. */
export function useAosPath() {
  const { pathTenantSlug, isAosPlatform } = useTenant();

  return useCallback(
    (path: string) => {
      if (!isAosPlatform || !pathTenantSlug) return path;
      return withAosTenantPath(path, pathTenantSlug);
    },
    [isAosPlatform, pathTenantSlug],
  );
}
