import { useCallback } from 'react';
import { refreshSessionOnce } from '@mpbhealth/database';

/**
 * Hook that provides authentication-aware ticket service operations.
 *
 * On auth failure we only run `refreshSessionOnce()` (8s cap) and retry once —
 * NOT the full `handleAuthError()` profile reload (which could take 20s+ and
 * left reply-with-attachment sends spinning indefinitely).
 */
export function useAdvisorAuth() {
  const withAuthRetry = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      const isAuthError =
        errorMessage === 'SESSION_EXPIRED' ||
        errorMessage === '_AUTH_RETRYABLE' ||
        /authentication expired|not authenticated|session has expired/i.test(errorMessage) ||
        (/authorization|unauthorized/i.test(errorMessage) &&
          !/requester|ticket not found|upload failed|access denied/i.test(errorMessage));

      if (!isAuthError) {
        throw error;
      }

      console.debug('[useAdvisorAuth] Auth error on ticket op — refreshing session once');
      try {
        const { error: refreshErr } = await refreshSessionOnce();
        if (refreshErr) throw refreshErr;
        return await operation();
      } catch (retryErr) {
        const retryMsg = retryErr instanceof Error ? retryErr.message : String(retryErr);
        if (retryMsg === 'SESSION_DEAD') {
          throw new Error('SESSION_EXPIRED');
        }
        throw error;
      }
    }
  }, []);

  return {
    withAuthRetry,
  };
}