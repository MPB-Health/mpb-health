import React, { useEffect, useCallback } from 'react';
import { useSessionTimeout, type UseSessionTimeoutOptions } from '../hooks/useSessionTimeout';

export interface SessionTimeoutWarningProps {
  /** Custom timeout configuration */
  config?: UseSessionTimeoutOptions['config'];
  /** Callback after logout due to timeout */
  onLogout?: () => void;
  /** Whether to enable the timeout (default: true) */
  enabled?: boolean;
  /** Custom modal content renderer */
  renderModal?: (props: {
    timeRemaining: string;
    onExtend: () => void;
    onLogout: () => void;
  }) => React.ReactNode;
}

/**
 * Session timeout warning component that displays a modal when the session
 * is about to expire due to inactivity.
 *
 * Implements HIPAA-compliant 15-minute inactivity timeout with 2-minute warning.
 */
export const SessionTimeoutWarning: React.FC<SessionTimeoutWarningProps> = ({
  config,
  onLogout,
  enabled = true,
  renderModal,
}) => {
  const handleTimeout = useCallback(async () => {
    // Session has timed out - force logout
  }, []);

  const {
    timeRemainingFormatted,
    isWarning,
    isTimedOut,
    extendSession,
    logout,
  } = useSessionTimeout({
    config,
    enabled,
    onTimeout: handleTimeout,
  });

  // Handle timeout - auto logout
  useEffect(() => {
    if (isTimedOut) {
      logout().then(() => {
        onLogout?.();
      });
    }
  }, [isTimedOut, logout, onLogout]);

  // Handle extend session
  const handleExtend = useCallback(() => {
    extendSession();
  }, [extendSession]);

  // Handle manual logout
  const handleLogout = useCallback(() => {
    logout().then(() => {
      onLogout?.();
    });
  }, [logout, onLogout]);

  // Don't render if not in warning state
  if (!isWarning || isTimedOut) {
    return null;
  }

  // Use custom renderer if provided
  if (renderModal) {
    return (
      <>
        {renderModal({
          timeRemaining: timeRemainingFormatted,
          onExtend: handleExtend,
          onLogout: handleLogout,
        })}
      </>
    );
  }

  // Default modal UI
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-timeout-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-surface-primary rounded-xl shadow-2xl p-6 max-w-md mx-4 border border-th-border animate-in fade-in zoom-in duration-200">
        {/* Warning Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-amber-600 dark:text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2
          id="session-timeout-title"
          className="text-xl font-semibold text-th-text-primary text-center mb-2"
        >
          Session Expiring Soon
        </h2>

        {/* Description */}
        <p className="text-th-text-secondary text-center mb-4">
          Your session will expire in{' '}
          <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
            {timeRemainingFormatted}
          </span>{' '}
          due to inactivity.
        </p>

        {/* Timer Display */}
        <div className="flex justify-center mb-6">
          <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <span className="font-mono text-2xl font-bold text-amber-600 dark:text-amber-400">
              {timeRemainingFormatted}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleExtend}
            className="flex-1 px-4 py-2.5 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 active:bg-th-accent-800 transition-colors focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:ring-offset-2"
          >
            Stay Logged In
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 px-4 py-2.5 bg-surface-secondary text-th-text-primary rounded-lg font-medium border border-th-border hover:bg-surface-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:ring-offset-2"
          >
            Log Out Now
          </button>
        </div>

        {/* Security Notice */}
        <p className="text-xs text-th-text-tertiary text-center mt-4">
          For your security, you will be automatically logged out after{' '}
          15 minutes of inactivity.
        </p>
      </div>
    </div>
  );
};

export default SessionTimeoutWarning;
