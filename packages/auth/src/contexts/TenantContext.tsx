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
import {
  resolvePortalSlugFromHost,
  resolveTenantFromHostname,
  type PortalSlug,
  type ResolvedTenant,
} from '../services/tenantService';

export interface TenantContextValue {
  tenant: ResolvedTenant | null;
  orgId: string | null;
  orgName: string | null;
  portalSlug: PortalSlug;
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
  const [tenant, setTenant] = useState<ResolvedTenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const portalSlug = useMemo((): PortalSlug => {
    if (portalSlugProp) return portalSlugProp;
    if (typeof window === 'undefined') return 'advisor';
    return resolvePortalSlugFromHost(window.location.hostname, window.location.port);
  }, [portalSlugProp]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        const resolved = await resolveTenantFromHostname(hostname, portalSlug);
        if (cancelled) return;
        if (!resolved) {
          setError('Organization not found for this domain.');
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
  }, [portalSlug]);

  const value = useMemo<TenantContextValue>(
    () => ({
      tenant,
      orgId: tenant?.orgId ?? null,
      orgName: tenant?.orgName ?? null,
      portalSlug,
      loading,
      error,
    }),
    [tenant, portalSlug, loading, error],
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
