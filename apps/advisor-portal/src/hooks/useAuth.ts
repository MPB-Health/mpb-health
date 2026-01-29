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
  const { profile, loading, logout } = useAdvisor();

  const user = useMemo<AuthUser | null>(() => {
    if (!profile) return null;
    return {
      id: profile.user_id,
      email: profile.email,
      name: `${profile.first_name} ${profile.last_name}`,
    };
  }, [profile]);

  const isAuthenticated = !!profile;

  return {
    user,
    loading,
    isAuthenticated,
    logout,
  };
}
