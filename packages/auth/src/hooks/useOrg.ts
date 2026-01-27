// ============================================================================
// useOrg — React hook for organization context
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import type { OrgWithMembership, OrgRole } from '../services/orgService';
import { getUserOrgs, invalidateCache, DEFAULT_ORG_ID } from '../services/orgService';
import { useAuth } from '../contexts/AuthContext';

const ACTIVE_ORG_KEY = 'mpb_active_org_id';

export interface UseOrgReturn {
  /** All orgs the user is a member of */
  orgs: OrgWithMembership[];
  /** The currently active org */
  activeOrg: OrgWithMembership | null;
  /** The active org's ID (convenience) */
  activeOrgId: string | null;
  /** The user's role in the active org */
  orgRole: OrgRole | null;
  /** Whether orgs are still loading */
  loading: boolean;
  /** Switch to a different org */
  switchOrg: (orgId: string) => void;
  /** Refresh the org list */
  refreshOrgs: () => Promise<void>;
}

export function useOrg(): UseOrgReturn {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<OrgWithMembership[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACTIVE_ORG_KEY) || null;
  });
  const [loading, setLoading] = useState(true);

  const loadOrgs = useCallback(async () => {
    if (!user) {
      setOrgs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const userOrgs = await getUserOrgs();
      setOrgs(userOrgs);

      // Auto-select active org
      if (userOrgs.length > 0) {
        const storedId = localStorage.getItem(ACTIVE_ORG_KEY);
        const storedOrgValid = storedId && userOrgs.some((o) => o.id === storedId);

        if (!storedOrgValid) {
          // Default to MPB Health org or first available
          const defaultOrg = userOrgs.find((o) => o.id === DEFAULT_ORG_ID) || userOrgs[0];
          setActiveOrgId(defaultOrg.id);
          localStorage.setItem(ACTIVE_ORG_KEY, defaultOrg.id);
        }
      }
    } catch (err) {
      console.error('[useOrg] Failed to load orgs:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadOrgs();
  }, [loadOrgs]);

  const switchOrg = useCallback((orgId: string) => {
    setActiveOrgId(orgId);
    localStorage.setItem(ACTIVE_ORG_KEY, orgId);
    invalidateCache();
  }, []);

  const refreshOrgs = useCallback(async () => {
    invalidateCache();
    await loadOrgs();
  }, [loadOrgs]);

  const activeOrg = orgs.find((o) => o.id === activeOrgId) ?? null;
  const orgRole = activeOrg?.membership.role ?? null;

  return {
    orgs,
    activeOrg,
    activeOrgId,
    orgRole,
    loading,
    switchOrg,
    refreshOrgs,
  };
}
