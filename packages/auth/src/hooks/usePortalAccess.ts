/**
 * usePortalAccess - Hook to load user roles and compute portal access
 *
 * Queries the global `user_roles` table and computes which portals the
 * current user can access. Used by PortalSwitcher and app-level guards.
 *
 * Role → Portal mapping:
 *   super_admin → ALL portals
 *   admin       → Admin Portal
 *   advisor     → Advisor Portal
 *   crm_user    → CRM Portal
 *   member      → Member Portal (all authenticated users)
 */

import { useState, useEffect, useCallback } from 'react';
import { getUserRoles, type UserRole } from '../services/userRolesService';

export interface PortalAccessState {
  /** Raw roles from `user_roles` table */
  roles: UserRole[];
  /** Whether roles have been loaded yet */
  loading: boolean;
  /** Error message if role loading failed */
  error: string | null;
  /** User can access Admin Portal (super_admin or admin) */
  canAccessAdmin: boolean;
  /** User can access Advisor Portal (super_admin or advisor) */
  canAccessAdvisor: boolean;
  /** User can access CRM Portal (super_admin or crm_user) */
  canAccessCrm: boolean;
  /** User can access Website Backend / CMS (super_admin or admin) */
  canAccessWebsite: boolean;
  /** User can access Concierge Portal (super_admin or concierge) */
  canAccessConcierge: boolean;
  /** User can access Member Portal (always true for authenticated users) */
  canAccessMember: boolean;
  /** User can access Support Portal / ITSTS (super_admin, admin, advisor, or concierge) */
  canAccessSupport: boolean;
  /** Re-fetch roles from the database */
  refreshAccess: () => Promise<void>;
}

/**
 * Load user roles and compute portal access booleans.
 *
 * @param userId - The Supabase auth user ID. Pass `null`/`undefined` when
 *                 no user is signed in; the hook will return empty roles.
 */
export function usePortalAccess(userId: string | null | undefined): PortalAccessState {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRoles = useCallback(async (uid: string) => {
    try {
      setLoading(true);
      setError(null);
      const userRoles = await getUserRoles(uid);
      setRoles(userRoles);
    } catch (err) {
      console.error('[usePortalAccess] Failed to load roles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load roles');
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setRoles([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const userRoles = await getUserRoles(userId);
        if (!cancelled) {
          setRoles(userRoles);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[usePortalAccess] Failed to load roles:', err);
          setError(err instanceof Error ? err.message : 'Failed to load roles');
          setRoles([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const refreshAccess = useCallback(async () => {
    if (userId) {
      await loadRoles(userId);
    }
  }, [userId, loadRoles]);

  const isSuperAdmin = roles.includes('super_admin');

  return {
    roles,
    loading,
    error,
    canAccessAdmin: isSuperAdmin || roles.includes('admin'),
    canAccessAdvisor: isSuperAdmin || roles.includes('advisor'),
    canAccessCrm: isSuperAdmin || roles.includes('crm_user'),
    canAccessWebsite: isSuperAdmin || roles.includes('admin'),
    canAccessConcierge: isSuperAdmin || roles.includes('concierge'),
    canAccessMember: true,
    canAccessSupport: isSuperAdmin || roles.includes('admin') || roles.includes('advisor') || roles.includes('concierge'),
    refreshAccess,
  };
}
