import { ReactNode, useCallback } from 'react';
import { useAdvisorAuth } from '../hooks/useAdvisorAuth';

interface TicketAuthWrapperProps {
  children: ReactNode;
}

/**
 * Optional layout wrapper — children use `useTicketAuth().executeWithAuth` for retries.
 */
export function TicketAuthWrapper({ children }: TicketAuthWrapperProps) {
  return <>{children}</>;
}

/**
 * Hook for components that need ticket operations with automatic refresh + retry on auth errors.
 */
export function useTicketAuth() {
  const { withAuthRetry } = useAdvisorAuth();

  return {
    executeWithAuth: withAuthRetry,
  };
}
