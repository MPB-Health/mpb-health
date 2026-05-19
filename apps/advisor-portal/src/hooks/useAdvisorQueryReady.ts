import { useMemo, useSyncExternalStore } from 'react';
import { isSessionDead, onSessionDead } from '@mpbhealth/database';
import { useAdvisor } from '../contexts/AdvisorContext';

/**
 * Stable readiness for user-scoped TanStack Query `enabled` flags and loading UI.
 *
 * Do not key off `profileLoading` alone: the shell can render with a hydrated profile
 * while a background refresh runs; disabling queries then causes "empty until refresh".
 *
 * Also reacts to the module-level "session dead" latch from authHelper. When
 * `markSessionDead` fires (e.g. refresh token rejected mid-session), every
 * gated query short-circuits its `enabled` to false and no more edge-fn calls
 * are emitted while the redirect-to-login lands.
 */
function subscribeSessionDead(cb: () => void) {
  return onSessionDead(cb);
}

export function useAdvisorQueryReady() {
  const { loading: authInitializing, hasSession, profile } = useAdvisor();
  const sessionDead = useSyncExternalStore(subscribeSessionDead, isSessionDead, isSessionDead);

  const profileId = profile?.id ?? profile?.user_id ?? null;

  return useMemo(() => {
    const advisorReady = !authInitializing && hasSession && !!profileId && !sessionDead;
    return {
      authInitializing,
      hasSession,
      profile,
      profileId,
      advisorReady,
      sessionDead,
    };
  }, [authInitializing, hasSession, profile, profileId, sessionDead]);
}
