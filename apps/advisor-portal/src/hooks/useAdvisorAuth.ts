import { useCallback } from 'react';
import { useAdvisor } from '../contexts/AdvisorContext';

/**
 * Must exceed worst-case `handleAuthError`: refreshSessionOnce (20s) + loadProfile body (25s)
 * plus a little slack. Shorter values abort recovery mid-flight and surface confusing ticket errors.
 */
const AUTH_RECOVERY_MS = 55_000;

/**
 * Hook that provides authentication-aware ticket service operations
 * Automatically handles authentication errors by triggering session refresh
 */
export function useAdvisorAuth() {
  const { handleAuthError } = useAdvisor();

  /**
   * Wraps a ticket service operation with automatic authentication error handling
   */
  const withAuthRetry = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check if this is an authentication error
      if (
        errorMessage.toLowerCase().includes('authentication expired') ||
        errorMessage.toLowerCase().includes('not authenticated') ||
        errorMessage.toLowerCase().includes('authorization') ||
        errorMessage.toLowerCase().includes('unauthorized') ||
        errorMessage.toLowerCase().includes('violates row-level security') ||
        errorMessage.toLowerCase().includes('rls policy') ||
        errorMessage === 'SESSION_EXPIRED'
      ) {
        console.log('Authentication error detected, attempting to refresh session...');

        let recovered = false;
        await Promise.race([
          handleAuthError().then(() => {
            recovered = true;
          }),
          new Promise<void>((resolve) => {
            window.setTimeout(resolve, AUTH_RECOVERY_MS);
          }),
        ]);

        if (!recovered) {
          console.warn('[useAdvisorAuth] Session recovery timed out');
          throw error;
        }

        try {
          return await operation();
        } catch {
          throw error;
        }
      }

      throw error;
    }
  }, [handleAuthError]);

  return {
    withAuthRetry,
  };
}