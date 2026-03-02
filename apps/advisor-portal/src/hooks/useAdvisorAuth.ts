import { useCallback } from 'react';
import { useAdvisor } from '../contexts/AdvisorContext';

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
      if (errorMessage.toLowerCase().includes('authentication expired') || 
          errorMessage.toLowerCase().includes('not authenticated') ||
          errorMessage.toLowerCase().includes('authorization') ||
          errorMessage.toLowerCase().includes('unauthorized')) {
        
        console.log('Authentication error detected, attempting to refresh session...');
        
        // Trigger session refresh
        await handleAuthError();
        
        // After session refresh, retry the operation once
        try {
          return await operation();
        } catch (retryError) {
          // If retry fails, throw the original error
          throw error;
        }
      }
      
      // If not an auth error, re-throw the original error
      throw error;
    }
  }, [handleAuthError]);

  return {
    withAuthRetry,
  };
}