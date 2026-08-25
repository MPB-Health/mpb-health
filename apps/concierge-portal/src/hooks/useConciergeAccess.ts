/**
 * useConciergeAccess — resolves the current user's Concierge management rights
 * and per-feature permissions.
 *
 * Mirrors the server-side `concierge_can()` / `is_concierge_manager()` logic so
 * the UI hides/disables what the database would reject:
 *   - Managers (super_admin, admin, or an explicit is_manager grant) can do
 *     everything and are never feature-restricted.
 *   - Everyone else is allowed a feature unless it's in their deny-list.
 *
 * This is a UX convenience only — RLS + the edge function are the real gate.
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@mpbhealth/database';
import { usePortalAccess } from '@mpbhealth/auth';
import { MPB_CONCIERGE_ORG_ID } from '../lib/concierge-api';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- concierge_user_access not in generated Database types yet
const db = supabase as any;

export interface ConciergeAccessState {
  loading: boolean;
  userId: string | null;
  roles: string[];
  isSuperAdmin: boolean;
  isAdmin: boolean;
  /** Can open/use the Management Center. */
  isManager: boolean;
  /** Feature keys explicitly denied to this user (empty for managers). */
  deniedFeatures: string[];
  /** True when the user may use `feature` (managers always true). */
  can: (feature: string) => boolean;
  refresh: () => Promise<void>;
}

export function useConciergeAccess(): ConciergeAccessState {
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [deniedFeatures, setDeniedFeatures] = useState<string[]>([]);
  const [grantIsManager, setGrantIsManager] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);

  const { roles, loading: rolesLoading } = usePortalAccess(userId);
  const isSuperAdmin = roles.includes('super_admin');
  const isAdmin = roles.includes('admin');

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setUserId(session?.user?.id ?? null);
      setSessionLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadOwnAccess = useCallback(async (uid: string | null) => {
    if (!uid) {
      setDeniedFeatures([]);
      setGrantIsManager(false);
      setAccessLoading(false);
      return;
    }
    setAccessLoading(true);
    try {
      const { data } = await db
        .from('concierge_user_access')
        .select('is_manager, denied_features')
        .eq('org_id', MPB_CONCIERGE_ORG_ID)
        .eq('user_id', uid)
        .maybeSingle();
      setGrantIsManager(data?.is_manager === true);
      setDeniedFeatures(Array.isArray(data?.denied_features) ? (data.denied_features as string[]) : []);
    } catch {
      // Fail closed on restrictions but never crash the portal.
      setGrantIsManager(false);
      setDeniedFeatures([]);
    } finally {
      setAccessLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionLoading) return;
    void loadOwnAccess(userId);
  }, [userId, sessionLoading, loadOwnAccess]);

  const isManager = isSuperAdmin || isAdmin || grantIsManager;

  const can = useCallback(
    (feature: string) => isManager || !deniedFeatures.includes(feature),
    [isManager, deniedFeatures],
  );

  const refresh = useCallback(async () => {
    await loadOwnAccess(userId);
  }, [loadOwnAccess, userId]);

  return {
    loading: sessionLoading || rolesLoading || accessLoading,
    userId,
    roles,
    isSuperAdmin,
    isAdmin,
    isManager,
    deniedFeatures,
    can,
    refresh,
  };
}
