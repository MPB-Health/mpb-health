// ============================================================================
// Auth Hook — Provides authentication context from the advisor profile
// ============================================================================

import { useMemo } from 'react';
import { useAdvisor } from '../contexts/AdvisorContext';
import { useAdvisorQueryReady } from './useAdvisorQueryReady';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export function useAuth() {
  const { profile, loading, hasSession, logout } = useAdvisor();
  const { advisorReady } = useAdvisorQueryReady();

  const user = useMemo<AuthUser | null>(() => {
    if (!profile) return null;
    return {
      id: profile.user_id,
      email: profile.email,
      name: `${profile.first_name} ${profile.last_name}`,
    };
  }, [profile]);

  /** True only when we have a hydrated advisor profile — not while profile is still loading. */
  const isAuthenticated = !!profile;
  /** Initial Supabase auth or advisor row not yet stable for user-scoped work (matches query `enabled` gates). */
  const isBootstrapping = loading || (hasSession && !advisorReady);

  return {
    user,
    loading: isBootstrapping,
    isAuthenticated,
    isBootstrapping,
    logout,
  };
}
