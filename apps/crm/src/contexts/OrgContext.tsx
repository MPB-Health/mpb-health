// ============================================================================
// OrgContext — Organization + Permission context for CRM app
// ============================================================================

import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo, type ReactNode } from 'react';
import {
  getUserOrgs,
  loadUserPermissions,
  hasPermission as checkPermission,
  invalidatePermissionCache,
  invalidateCache as invalidateOrgCache,
  DEFAULT_ORG_ID,
  DEFAULT_ORG_ID_ALT,
  type OrgWithMembership,
  type OrgRole,
  type UserPermissionSet,
} from '@mpbhealth/auth';
import { createClientLogger, emitPortalDiagnostic } from '@mpbhealth/utils';
import { useAuth } from './AuthContext';

const log = createClientLogger('OrgContext');

const ACTIVE_ORG_KEY = 'mpb_active_org_id';

interface OrgContextType {
  // Org state
  orgs: OrgWithMembership[];
  activeOrg: OrgWithMembership | null;
  activeOrgId: string | null;
  orgRole: OrgRole | null;
  orgLoading: boolean;

  // Permission state
  permissionSet: UserPermissionSet | null;
  permissionsLoading: boolean;
  /** Set when the last permission load failed (non-timeout); use for retry UX */
  permissionsError: string | null;

  // Permission checks
  can: (permissionKey: string) => boolean;
  canAny: (permissionKeys: string[]) => boolean;
  canAll: (permissionKeys: string[]) => boolean;

  // Actions
  switchOrg: (orgId: string) => void;
  refreshOrgs: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
}

const OrgContext = createContext<OrgContextType | null>(null);

export function OrgProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // Org state
  const [orgs, setOrgs] = useState<OrgWithMembership[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACTIVE_ORG_KEY) || null;
  });
  const [orgRole, setOrgRole] = useState<OrgRole | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);

  // Permission state
  const [permissionSet, setPermissionSet] = useState<UserPermissionSet | null>(null);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);
  const orgIdRef = useRef(activeOrgId);

  // --- Load orgs ---
  const loadOrgs = useCallback(async () => {
    if (!user) {
      setOrgs([]);
      setOrgLoading(false);
      return;
    }

    setOrgLoading(true);
    try {
      const userOrgs = await getUserOrgs();
      setOrgs(userOrgs);

      // Auto-select active org
      if (userOrgs.length > 0) {
        const storedId = localStorage.getItem(ACTIVE_ORG_KEY);
        const storedOrgValid = storedId && userOrgs.some((o) => o.id === storedId);

        if (!storedOrgValid) {
          const defaultOrg = userOrgs.find((o) => o.id === DEFAULT_ORG_ID || o.id === DEFAULT_ORG_ID_ALT) || userOrgs[0];
          setActiveOrgId(defaultOrg.id);
          localStorage.setItem(ACTIVE_ORG_KEY, defaultOrg.id);
        }
      }
    } catch (err) {
      console.error('[OrgContext] Failed to load orgs:', err);
    } finally {
      setOrgLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Safety timeout: if org loading hangs (network, stale token), force
    // orgLoading=false so ProtectedRoute stops showing "Loading workspace…"
    const timeout = setTimeout(() => {
      setOrgLoading((prev) => {
        if (prev) {
          console.warn('[OrgContext] Org loading timed out after 10 s');
          return false;
        }
        return prev;
      });
    }, 10_000);

    loadOrgs();

    return () => clearTimeout(timeout);
  }, [loadOrgs]);

  // Org role is set from the same batched permission snapshot as permissionSet (see loadPermissions).

  // --- Load permissions when org changes ---
  const loadPermissions = useCallback(async () => {
    if (!activeOrgId) {
      setPermissionSet(null);
      setOrgRole(null);
      setPermissionsLoading(false);
      setPermissionsError(null);
      return;
    }

    orgIdRef.current = activeOrgId;
    setPermissionsLoading(true);
    setPermissionsError(null);
    const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
    try {
      const ps = await loadUserPermissions(activeOrgId);
      if (orgIdRef.current === activeOrgId) {
        setPermissionSet(ps);
        setOrgRole(ps ? (ps.role as OrgRole) : null);
        if (ps) {
          log.info('[OrgContext] Permissions + role loaded for org:', activeOrgId, ps.role);
        }
        setPermissionsError(null);
        const durationMs = typeof performance !== 'undefined' ? performance.now() - t0 : 0;
        emitPortalDiagnostic({
          kind: 'permission_load',
          app: 'crm',
          durationMs,
          success: !!ps,
          detail: activeOrgId,
        });
      }
    } catch (err) {
      console.error('[OrgContext] Failed to load permissions:', err);
      if (orgIdRef.current === activeOrgId) {
        setPermissionSet(null);
        setOrgRole(null);
        setPermissionsError(err instanceof Error ? err.message : 'Failed to load permissions');
        const durationMs = typeof performance !== 'undefined' ? performance.now() - t0 : 0;
        emitPortalDiagnostic({
          kind: 'permission_load',
          app: 'crm',
          durationMs,
          success: false,
          detail: activeOrgId,
        });
      }
    } finally {
      if (orgIdRef.current === activeOrgId) {
        setPermissionsLoading(false);
      }
    }
  }, [activeOrgId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPermissionsLoading((prev) => {
        if (prev) {
          console.warn('[OrgContext] Permission loading timed out after 10 s');
          setPermissionsError('Permission check is taking too long. Try again or refresh the page.');
          return false;
        }
        return prev;
      });
    }, 10_000);

    loadPermissions();

    return () => clearTimeout(timeout);
  }, [loadPermissions]);

  // --- Permission checks ---
  const isOrgOwnerOrAdmin = orgRole === 'owner' || orgRole === 'admin';

  const can = useCallback(
    (permissionKey: string): boolean => {
      // Owners and admins have all permissions
      if (isOrgOwnerOrAdmin) return true;
      // Otherwise check against actual permission set
      if (!permissionSet) return false;
      return permissionSet.permissions.includes(permissionKey);
    },
    [permissionSet, isOrgOwnerOrAdmin]
  );

  const canAny = useCallback(
    (permissionKeys: string[]): boolean => {
      if (isOrgOwnerOrAdmin) return true;
      if (!permissionSet) return false;
      return permissionKeys.some((k) => permissionSet.permissions.includes(k));
    },
    [permissionSet, isOrgOwnerOrAdmin]
  );

  const canAll = useCallback(
    (permissionKeys: string[]): boolean => {
      if (isOrgOwnerOrAdmin) return true;
      if (!permissionSet) return false;
      return permissionKeys.every((k) => permissionSet.permissions.includes(k));
    },
    [permissionSet, isOrgOwnerOrAdmin]
  );

  // --- Actions ---
  const switchOrg = useCallback((orgId: string) => {
    setActiveOrgId(orgId);
    localStorage.setItem(ACTIVE_ORG_KEY, orgId);
    invalidateOrgCache();
    invalidatePermissionCache(orgId);
  }, []);

  const refreshOrgs = useCallback(async () => {
    invalidateOrgCache();
    await loadOrgs();
  }, [loadOrgs]);

  const refreshPermissions = useCallback(async () => {
    if (activeOrgId) invalidatePermissionCache(activeOrgId);
    await loadPermissions();
  }, [activeOrgId, loadPermissions]);

  const activeOrg = orgs.find((o) => o.id === activeOrgId) ?? null;

  const orgContextValue = useMemo<OrgContextType>(
    () => ({
      orgs,
      activeOrg,
      activeOrgId,
      orgRole,
      orgLoading,
      permissionSet,
      permissionsLoading,
      permissionsError,
      can,
      canAny,
      canAll,
      switchOrg,
      refreshOrgs,
      refreshPermissions,
    }),
    [
      orgs,
      activeOrg,
      activeOrgId,
      orgRole,
      orgLoading,
      permissionSet,
      permissionsLoading,
      permissionsError,
      can,
      canAny,
      canAll,
      switchOrg,
      refreshOrgs,
      refreshPermissions,
    ]
  );

  return <OrgContext.Provider value={orgContextValue}>{children}</OrgContext.Provider>;
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error('useOrg must be used within an OrgProvider');
  }
  return context;
}
