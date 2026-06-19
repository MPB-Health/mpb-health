// ============================================================================
// TenantContext — resolves org from hostname for multi-tenant portals
// ============================================================================

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import {
  isAosPlatformHost,
  isPathTenantPlatformHost,
  parsePathTenantSlug,
  resolvePortalSlugFromHost,
  resolveTenantForPortal,
  type PortalSlug,
  type ResolvedTenant,
} from '../services/tenantService';

export interface TenantContextValue {
  tenant: ResolvedTenant | null;
  orgId: string | null;
  orgName: string | null;
  /** Org slug from resolved tenant or URL segment on AOS. */
  orgSlug: string | null;
  portalSlug: PortalSlug;
  /** First URL segment on path-tenant hosts (/saudemax/…); null on MPB Health hosts. */
  pathTenantSlug: string | null;
  /** True on advisor AOS (aos.aryxcloud.com) — legacy alias for advisor path-tenant hosts. */
  isAosPlatform: boolean;
  /** True when this portal uses /{tenantSlug}/… on its ARYX platform host. */
  isPathTenantPlatform: boolean;
  loading: boolean;
  error: string | null;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export interface TenantProviderProps {
  children: ReactNode;
  /** Override portal slug (defaults to hostname detection) */
  portalSlug?: PortalSlug;
}

export function TenantProvider({ children, portalSlug: portalSlugProp }: TenantProviderProps) {
  const { pathname } = useLocation();
  const [tenant, setTenant] = useState<ResolvedTenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const portalSlug = useMemo((): PortalSlug => {
    if (portalSlugProp) return portalSlugProp;
    if (typeof window === 'undefined') return 'advisor';
    return resolvePortalSlugFromHost(hostname, window.location.port);
  }, [portalSlugProp, hostname]);

  const isPathTenantPlatform = isPathTenantPlatformHost(hostname, portalSlug);
  const isAosPlatform = isAosPlatformHost(hostname);
  const pathTenantSlug = isPathTenantPlatform ? parsePathTenantSlug(pathname) : null;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        // Advisor /landing and other global paths have no tenant segment.
        if (isPathTenantPlatform && !pathTenantSlug) {
          if (cancelled) return;
          setTenant(null);
          setError(null);
          setLoading(false);
          return;
        }

        const resolved = await resolveTenantForPortal({
          hostname,
          portalSlug,
          pathTenantSlug,
        });

        if (cancelled) return;

        if (!resolved) {
          setError(
            isPathTenantPlatform && pathTenantSlug
              ? `Organization "${pathTenantSlug}" not found or ${portalSlug.replace('_', ' ')} portal is disabled.`
              : 'Organization not found for this domain.',
          );
          setTenant(null);
        } else {
          setTenant(resolved);
          setError(null);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load organization');
        setTenant(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hostname, portalSlug, pathTenantSlug, isPathTenantPlatform]);

  const value = useMemo<TenantContextValue>(
    () => ({
      tenant,
      orgId: tenant?.orgId ?? null,
      orgName: tenant?.orgName ?? null,
      orgSlug: tenant?.orgSlug ?? pathTenantSlug ?? null,
      portalSlug,
      pathTenantSlug,
      isAosPlatform,
      isPathTenantPlatform,
      loading,
      error,
    }),
    [tenant, portalSlug, pathTenantSlug, isAosPlatform, isPathTenantPlatform, loading, error],
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return ctx;
}

/** Safe hook when TenantProvider may be absent (returns null org). */
export function useTenantOptional(): TenantContextValue | null {
  return useContext(TenantContext) ?? null;
}
