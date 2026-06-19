import { useCallback } from 'react';
import { isAosPlatformHost, prefixTenantPath } from '../services/tenantService';
import { useTenant } from '../contexts/TenantContext';

/**
 * Returns a function that prefixes in-app paths with /{tenantSlug} on AOS hosts only.
 * On advisor.mpb.health (and all non-AOS hosts) paths pass through unchanged.
 */
export function useTenantPath(): (path: string) => string {
  const { pathTenantSlug, isAosPlatform } = useTenant();

  return useCallback(
    (path: string) => {
      if (!isAosPlatform || !pathTenantSlug) return path;
      const hostname =
        typeof window !== 'undefined' ? window.location.hostname : undefined;
      return prefixTenantPath(path, pathTenantSlug, hostname);
    },
    [isAosPlatform, pathTenantSlug],
  );
}

/** Non-hook helper for boot-time path parsing (before React). */
export function tenantPathForHost(
  path: string,
  tenantSlug: string | null,
  hostname?: string,
): string {
  if (!tenantSlug || !isAosPlatformHost(hostname)) return path;
  return prefixTenantPath(path, tenantSlug, hostname);
}
