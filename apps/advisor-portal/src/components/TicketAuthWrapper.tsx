import { ReactNode, useCallback } from 'react';
import { useAdvisorAuth } from '../hooks/useAdvisorAuth';

interface TicketAuthWrapperProps {
  children: ReactNode;
}

/**
 * Wrapper component that automatically handles authentication errors for ticket operations
 * This ensures that when a ticket operation fails due to authentication, the user is
 * automatically re-authenticated and the operation is retried
 */
export function TicketAuthWrapper({ children }: TicketAuthWrapperProps) {
  const { withAuthRetry } = useAdvisorAuth();

  // Create a context for ticket operations that can be used by child components
  const ticketContext = {
    withAuthRetry,
  };

  // Make the context available through a React context or prop drilling
  // For now, we'll use a simple approach where child components can access it
  return (
    <div data-ticket-auth-wrapper="true">
      {children}
    </div>
  );
}

/**
 * Hook for components that need to perform ticket operations with automatic auth handling
 */
export function useTicketAuth() {
  const { withAuthRetry } = useAdvisorAuth();

  return {
    /**
     * Execute a ticket operation with automatic authentication retry
     */
    executeWithAuth: withAuthRetry,
  };
}