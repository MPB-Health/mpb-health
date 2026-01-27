// ============================================================================
// usePermission — React hook for checking org-scoped permissions
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import type { UserPermissionSet } from '../services/permissionService';
import {
  loadUserPermissions,
  hasPermission as checkPermission,
  invalidatePermissionCache,
} from '../services/permissionService';

export interface UsePermissionReturn {
  /** Full permission set for the active org */
  permissionSet: UserPermissionSet | null;
  /** Whether permissions are still loading */
  loading: boolean;
  /** Check a single permission synchronously (from cache) */
  can: (permissionKey: string) => boolean;
  /** Check if user has any of the given permissions */
  canAny: (permissionKeys: string[]) => boolean;
  /** Check if user has all given permissions */
  canAll: (permissionKeys: string[]) => boolean;
  /** Async permission check (hits DB if cache is stale) */
  checkPermission: (permissionKey: string) => Promise<boolean>;
  /** Refresh permissions */
  refresh: () => Promise<void>;
}

export function usePermission(orgId: string | null): UsePermissionReturn {
  const [permissionSet, setPermissionSet] = useState<UserPermissionSet | null>(null);
  const [loading, setLoading] = useState(true);
  const orgIdRef = useRef(orgId);

  const load = useCallback(async () => {
    if (!orgId) {
      setPermissionSet(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const ps = await loadUserPermissions(orgId);
      // Only update if orgId hasn't changed during load
      if (orgIdRef.current === orgId) {
        setPermissionSet(ps);
      }
    } catch (err) {
      console.error('[usePermission] Failed to load permissions:', err);
    } finally {
      if (orgIdRef.current === orgId) {
        setLoading(false);
      }
    }
  }, [orgId]);

  useEffect(() => {
    orgIdRef.current = orgId;
    load();
  }, [load, orgId]);

  const can = useCallback(
    (permissionKey: string): boolean => {
      if (!permissionSet) return false;
      return permissionSet.permissions.includes(permissionKey);
    },
    [permissionSet]
  );

  const canAny = useCallback(
    (permissionKeys: string[]): boolean => {
      if (!permissionSet) return false;
      return permissionKeys.some((k) => permissionSet.permissions.includes(k));
    },
    [permissionSet]
  );

  const canAll = useCallback(
    (permissionKeys: string[]): boolean => {
      if (!permissionSet) return false;
      return permissionKeys.every((k) => permissionSet.permissions.includes(k));
    },
    [permissionSet]
  );

  const asyncCheck = useCallback(
    async (permissionKey: string): Promise<boolean> => {
      if (!orgId) return false;
      return checkPermission(orgId, permissionKey);
    },
    [orgId]
  );

  const refresh = useCallback(async () => {
    if (orgId) invalidatePermissionCache(orgId);
    await load();
  }, [orgId, load]);

  return {
    permissionSet,
    loading,
    can,
    canAny,
    canAll,
    checkPermission: asyncCheck,
    refresh,
  };
}
