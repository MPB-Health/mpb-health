import { useCallback } from 'react';
import {
  isPathTenantPlatformHost,
  prefixTenantPath,
  type PortalSlug,
} from '../services/tenantService';
import { useTenant } from '../contexts/TenantContext';

/**
 * Returns a function that prefixes in-app paths with /{tenantSlug} on path-tenant ARYX hosts.
 * On MPB Health hosts (advisor.mpb.health, concierge.mpb.health) paths pass through unchanged.
 */
export function useTenantPath(): (path: string) => string {
  const { pathTenantSlug, isPathTenantPlatform, portalSlug } = useTenant();

  return useCallback(
    (path: string) => {
      if (!isPathTenantPlatform || !pathTenantSlug) return path;
      const hostname =
        typeof window !== 'undefined' ? window.location.hostname : undefined;
      return prefixTenantPath(path, pathTenantSlug, hostname, portalSlug);
    },
    [isPathTenantPlatform, pathTenantSlug, portalSlug],
  );
}

/** Non-hook helper for boot-time path parsing (before React). */
export function tenantPathForHost(
  path: string,
  tenantSlug: string | null,
  hostname?: string,
  portalSlug: PortalSlug = 'advisor',
): string {
  if (!tenantSlug || !isPathTenantPlatformHost(hostname, portalSlug)) return path;
  return prefixTenantPath(path, tenantSlug, hostname, portalSlug);
}
