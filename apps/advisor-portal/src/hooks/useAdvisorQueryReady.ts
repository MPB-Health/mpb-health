import { useMemo } from 'react';
import { useAdvisor } from '../contexts/AdvisorContext';

/**
 * Stable readiness for user-scoped TanStack Query `enabled` flags and loading UI.
 *
 * Do not key off `profileLoading` alone: the shell can render with a hydrated profile
 * while a background refresh runs; disabling queries then causes "empty until refresh".
 */
export function useAdvisorQueryReady() {
  const { loading: authInitializing, hasSession, profile } = useAdvisor();

  const profileId = profile?.id ?? profile?.user_id ?? null;

  return useMemo(() => {
    const advisorReady = !authInitializing && hasSession && !!profileId;
    return {
      authInitializing,
      hasSession,
      profile,
      profileId,
      advisorReady,
    };
  }, [authInitializing, hasSession, profile, profileId]);
}
