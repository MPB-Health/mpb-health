// ============================================================================
// OrgContext — Organization + Permission context for CRM app
// ============================================================================

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import {
  getUserOrgs,
  getUserOrgRole,
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
import { createClientLogger } from '@mpbhealth/utils';
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
    loadOrgs();
  }, [loadOrgs]);

  // --- Load role for active org ---
  useEffect(() => {
    if (!activeOrgId || !user) {
      setOrgRole(null);
      return;
    }
    getUserOrgRole(activeOrgId)
      .then((role) => {
        log.info('[OrgContext] User role loaded:', role);
        setOrgRole(role);
      })
      .catch((err) => {
        console.error('[OrgContext] Failed to load role:', err);
        setOrgRole(null);
      });
  }, [activeOrgId, user]);

  // --- Load permissions when org changes ---
  const loadPermissions = useCallback(async () => {
    if (!activeOrgId) {
      setPermissionSet(null);
      setPermissionsLoading(false);
      return;
    }

    orgIdRef.current = activeOrgId;
    setPermissionsLoading(true);
    try {
      const ps = await loadUserPermissions(activeOrgId);
      if (orgIdRef.current === activeOrgId) {
        setPermissionSet(ps);
      }
    } catch (err) {
      console.error('[OrgContext] Failed to load permissions:', err);
    } finally {
      if (orgIdRef.current === activeOrgId) {
        setPermissionsLoading(false);
      }
    }
  }, [activeOrgId]);

  useEffect(() => {
    loadPermissions();
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

  return (
    <OrgContext.Provider
      value={{
        orgs,
        activeOrg,
        activeOrgId,
        orgRole,
        orgLoading,
        permissionSet,
        permissionsLoading,
        can,
        canAny,
        canAll,
        switchOrg,
        refreshOrgs,
        refreshPermissions,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error('useOrg must be used within an OrgProvider');
  }
  return context;
}
