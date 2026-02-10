import { useState, useEffect, useCallback } from 'react';
import {
  sessionTimeoutService,
  type SessionTimeoutState,
  type SessionTimeoutConfig,
} from '../services/sessionTimeoutService';
import { useAuth } from '../contexts/AuthContext';

export interface UseSessionTimeoutOptions {
  /** Custom timeout configuration */
  config?: Partial<SessionTimeoutConfig>;
  /** Callback when session times out */
  onTimeout?: () => void;
  /** Callback when warning period starts */
  onWarning?: () => void;
  /** Whether to enable the timeout (default: true) */
  enabled?: boolean;
}

export interface UseSessionTimeoutReturn {
  /** Time remaining in milliseconds */
  timeRemaining: number;
  /** Time remaining formatted as MM:SS */
  timeRemainingFormatted: string;
  /** Whether we're in the warning period */
  isWarning: boolean;
  /** Whether the session has timed out */
  isTimedOut: boolean;
  /** Extend the session (reset the timer) */
  extendSession: () => void;
  /** Force logout */
  logout: () => Promise<void>;
}

/**
 * Hook for managing session timeout with HIPAA-compliant 15-minute inactivity timeout
 */
export function useSessionTimeout(
  options: UseSessionTimeoutOptions = {}
): UseSessionTimeoutReturn {
  const { config, onTimeout, onWarning, enabled = true } = options;
  const { user, signOut } = useAuth();

  const [state, setState] = useState<SessionTimeoutState>(() =>
    sessionTimeoutService.getState()
  );

  const [hasWarned, setHasWarned] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  // Initialize the service when enabled and user is logged in
  useEffect(() => {
    if (!enabled || !user) {
      return;
    }

    // Update config if provided
    if (config) {
      sessionTimeoutService.updateConfig(config);
    }

    // Initialize the service
    sessionTimeoutService.initialize(user.id);

    // Subscribe to state changes
    const unsubscribe = sessionTimeoutService.subscribe((newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
      sessionTimeoutService.destroy();
    };
  }, [enabled, user, config]);

  // Handle warning callback
  useEffect(() => {
    if (state.isWarning && !hasWarned && onWarning) {
      setHasWarned(true);
      onWarning();
    }

    // Reset warning flag when not in warning state
    if (!state.isWarning) {
      setHasWarned(false);
    }
  }, [state.isWarning, hasWarned, onWarning]);

  // Handle timeout callback
  useEffect(() => {
    if (state.isTimedOut && !hasTimedOut) {
      setHasTimedOut(true);
      if (onTimeout) {
        onTimeout();
      }
    }

    // Reset timeout flag when session is extended
    if (!state.isTimedOut) {
      setHasTimedOut(false);
    }
  }, [state.isTimedOut, hasTimedOut, onTimeout]);

  // Extend session handler
  const extendSession = useCallback(() => {
    sessionTimeoutService.extendSession();
    setHasWarned(false);
    setHasTimedOut(false);
  }, []);

  // Logout handler
  const logout = useCallback(async () => {
    sessionTimeoutService.destroy();
    await signOut();
  }, [signOut]);

  // Format time remaining as MM:SS
  const formatTimeRemaining = (ms: number): string => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    timeRemaining: state.timeRemaining,
    timeRemainingFormatted: formatTimeRemaining(state.timeRemaining),
    isWarning: state.isWarning,
    isTimedOut: state.isTimedOut,
    extendSession,
    logout,
  };
}
