// ============================================================================
// TenantContext — resolves org from hostname or AOS path slug
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
import { isAosPlatformHost, parseAosTenantSlugFromPath } from '../platform/aosPlatform';
import {
  resolvePortalSlugFromHost,
  resolveAdvisorTenant,
  type PortalSlug,
  type ResolvedTenant,
} from '../services/tenantService';

export interface TenantContextValue {
  tenant: ResolvedTenant | null;
  orgId: string | null;
  orgName: string | null;
  orgSlug: string | null;
  portalSlug: PortalSlug;
  /** AOS path tenant slug (e.g. saudemax), null on MPB hosts. */
  pathTenantSlug: string | null;
  isAosPlatform: boolean;
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
  const location = useLocation();
  const [tenant, setTenant] = useState<ResolvedTenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const isAosPlatform = isAosPlatformHost(hostname);
  const pathTenantSlug = isAosPlatform ? parseAosTenantSlugFromPath(location.pathname) : null;

  const portalSlug = useMemo((): PortalSlug => {
    if (portalSlugProp) return portalSlugProp;
    if (typeof window === 'undefined') return 'advisor';
    return resolvePortalSlugFromHost(hostname, window.location.port);
  }, [portalSlugProp, hostname]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        if (isAosPlatform && !pathTenantSlug) {
          if (cancelled) return;
          setTenant(null);
          setError(null);
          setLoading(false);
          return;
        }

        const resolved = await resolveAdvisorTenant({
          hostname,
          portalSlug,
          pathTenantSlug,
        });
        if (cancelled) return;
        if (!resolved) {
          setError(
            isAosPlatform && pathTenantSlug
              ? `Organization "${pathTenantSlug}" not found or advisor portal is disabled.`
              : 'Organization not found for this domain.',
          );
          setTenant(null);
        } else {
          setTenant(resolved);
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
  }, [hostname, portalSlug, pathTenantSlug, isAosPlatform]);

  const value = useMemo<TenantContextValue>(
    () => ({
      tenant,
      orgId: tenant?.orgId ?? null,
      orgName: tenant?.orgName ?? null,
      orgSlug: tenant?.orgSlug ?? pathTenantSlug ?? null,
      portalSlug,
      pathTenantSlug,
      isAosPlatform,
      loading,
      error,
    }),
    [tenant, portalSlug, pathTenantSlug, isAosPlatform, loading, error],
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
