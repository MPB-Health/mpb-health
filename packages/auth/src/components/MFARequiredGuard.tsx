import React, { useState, useEffect, useCallback } from 'react';
import { mfaService } from '../services/mfaService';
import { useAuth } from '../contexts/AuthContext';
import { MFAEnrollmentFlow } from './MFAEnrollmentFlow';
import { MFAVerificationDialog } from './MFAVerificationDialog';

export interface MFARequiredGuardProps {
  /** Children to render when MFA is satisfied */
  children: React.ReactNode;
  /** Loading component to show while checking MFA status */
  loadingComponent?: React.ReactNode;
  /** Callback when user cancels MFA enrollment/verification */
  onCancel?: () => void;
  /** Whether to allow cancellation (if false, user must complete MFA) */
  allowCancel?: boolean;
  /** Whether to show trust device option during verification */
  showTrustDevice?: boolean;
  /** Custom check for whether MFA should be required (overrides default role check) */
  requireMFA?: boolean;
}

type MFAGuardState = 'loading' | 'not_required' | 'needs_enrollment' | 'needs_verification' | 'satisfied';

/**
 * Route guard component that ensures users have MFA enabled and verified.
 *
 * For users with roles that require MFA (admin, staff, advisor):
 * - If MFA is not enrolled, shows the enrollment flow
 * - If MFA is enrolled but not verified for this session, shows verification dialog
 * - If MFA is satisfied, renders children
 */
export const MFARequiredGuard: React.FC<MFARequiredGuardProps> = ({
  children,
  loadingComponent,
  onCancel,
  allowCancel = false,
  showTrustDevice = true,
  requireMFA,
}) => {
  const { user, loading: authLoading } = useAuth();
  const [guardState, setGuardState] = useState<MFAGuardState>('loading');
  const [checkingMFA, setCheckingMFA] = useState(true);

  // Check MFA status
  const checkMFAStatus = useCallback(async () => {
    if (!user) {
      setGuardState('loading');
      return;
    }

    setCheckingMFA(true);

    try {
      // Check if user's device is trusted
      const fingerprint = mfaService.generateDeviceFingerprint();
      const isTrusted = await mfaService.isTrustedDevice(user.id, fingerprint);

      if (isTrusted) {
        setGuardState('satisfied');
        setCheckingMFA(false);
        return;
      }

      // Check if MFA is required and enrolled
      const enforcement = await mfaService.enforceMFAEnrollment(user.id);

      // Handle custom requireMFA override
      if (requireMFA === false) {
        setGuardState('not_required');
      } else if (requireMFA === true || enforcement.required) {
        if (!enforcement.enrolled) {
          setGuardState('needs_enrollment');
        } else {
          setGuardState('needs_verification');
        }
      } else {
        setGuardState('not_required');
      }
    } catch (error) {
      console.error('Error checking MFA status:', error);
      // On error, be permissive but log it
      setGuardState('not_required');
    } finally {
      setCheckingMFA(false);
    }
  }, [user, requireMFA]);

  // Check MFA status when component mounts or user changes
  useEffect(() => {
    if (!authLoading) {
      checkMFAStatus();
    }
  }, [authLoading, checkMFAStatus]);

  // Handle enrollment completion
  const handleEnrollmentComplete = useCallback(() => {
    setGuardState('satisfied');
  }, []);

  // Handle verification success
  const handleVerificationSuccess = useCallback(() => {
    setGuardState('satisfied');
  }, []);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  // Handle trust device
  const handleTrustDevice = useCallback(() => {
    // Device trust is handled in the verification dialog
  }, []);

  // Show loading state
  if (authLoading || checkingMFA || guardState === 'loading') {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-th-accent-600 mx-auto mb-4" />
          <p className="text-th-text-secondary">Checking security status...</p>
        </div>
      </div>
    );
  }

  // MFA not required or satisfied - render children
  if (guardState === 'not_required' || guardState === 'satisfied') {
    return <>{children}</>;
  }

  // Needs MFA enrollment
  if (guardState === 'needs_enrollment') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary p-4">
        <div className="w-full max-w-md">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-amber-600 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  MFA Required
                </p>
                <p className="text-amber-700 dark:text-amber-300">
                  Your account requires two-factor authentication. Please
                  complete the setup to continue.
                </p>
              </div>
            </div>
          </div>

          <MFAEnrollmentFlow
            onComplete={handleEnrollmentComplete}
            onCancel={allowCancel ? handleCancel : undefined}
            showCancel={allowCancel}
          />
        </div>
      </div>
    );
  }

  // Needs MFA verification
  if (guardState === 'needs_verification') {
    return (
      <>
        {/* Show a placeholder/loading screen behind the dialog */}
        <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-th-accent-100 dark:bg-th-accent-900/30 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-th-accent-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-th-text-primary mb-2">
              Verification Required
            </h2>
            <p className="text-th-text-secondary">
              Please verify your identity to continue.
            </p>
          </div>
        </div>

        <MFAVerificationDialog
          isOpen={true}
          onSuccess={handleVerificationSuccess}
          onCancel={allowCancel ? handleCancel : undefined}
          onTrustDevice={handleTrustDevice}
          showTrustDevice={showTrustDevice}
        />
      </>
    );
  }

  // Fallback - should not reach here
  return <>{children}</>;
};

export default MFARequiredGuard;
