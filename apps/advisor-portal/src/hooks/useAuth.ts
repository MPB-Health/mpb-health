// ============================================================================
// Auth Hook — Provides authentication context from the advisor profile
// ============================================================================

import { useMemo } from 'react';
import { useAdvisor } from '../contexts/AdvisorContext';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export function useAuth() {
  const { profile, loading, profileLoading, hasSession, logout } = useAdvisor();

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
  /** Initial Supabase auth or first profile fetch still in flight. */
  const isBootstrapping = loading || (hasSession && profileLoading);

  return {
    user,
    loading: loading || profileLoading,
    isAuthenticated,
    isBootstrapping,
    logout,
  };
}
