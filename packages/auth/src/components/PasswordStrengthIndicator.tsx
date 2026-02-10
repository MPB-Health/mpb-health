import React, { useMemo } from 'react';
import { passwordSecurityService, type PasswordStrength } from '../services/passwordSecurityService';

export interface PasswordStrengthIndicatorProps {
  /** The password to evaluate */
  password: string;
  /** User info for checking password doesn't contain personal data */
  userInfo?: {
    email?: string;
    firstName?: string;
    lastName?: string;
  };
  /** Whether to show the requirements checklist */
  showRequirements?: boolean;
  /** Whether to show the breach warning when password is compromised */
  showBreachWarning?: boolean;
  /** Breach check result (from checkPasswordBreach) */
  breachResult?: {
    isBreached: boolean;
    count?: number;
  };
  /** Custom class name */
  className?: string;
}

/**
 * Visual password strength indicator with progress bar and requirements checklist.
 * Uses the passwordSecurityService to calculate strength.
 */
export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  userInfo,
  showRequirements = true,
  showBreachWarning = true,
  breachResult,
  className = '',
}) => {
  // Calculate password strength
  const strength = useMemo<PasswordStrength | null>(() => {
    if (!password) return null;
    return passwordSecurityService.calculatePasswordStrength(password, userInfo);
  }, [password, userInfo]);

  // Get color based on strength
  const getStrengthColor = (score: number): string => {
    if (score <= 25) return 'bg-red-500';
    if (score <= 45) return 'bg-orange-500';
    if (score <= 65) return 'bg-yellow-500';
    if (score <= 85) return 'bg-lime-500';
    return 'bg-green-500';
  };

  const getStrengthTextColor = (score: number): string => {
    if (score <= 25) return 'text-red-600 dark:text-red-400';
    if (score <= 45) return 'text-orange-600 dark:text-orange-400';
    if (score <= 65) return 'text-yellow-600 dark:text-yellow-400';
    if (score <= 85) return 'text-lime-600 dark:text-lime-400';
    return 'text-green-600 dark:text-green-400';
  };

  // Don't render if no password
  if (!password || !strength) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Strength Meter */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-th-text-secondary">Password Strength</span>
          <span className={`text-sm font-medium ${getStrengthTextColor(strength.score)}`}>
            {strength.label}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-surface-tertiary rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ease-out ${getStrengthColor(strength.score)}`}
            style={{ width: `${strength.score}%` }}
          />
        </div>

        {/* Score percentage */}
        <div className="text-xs text-th-text-tertiary text-right">
          {strength.score}%
        </div>
      </div>

      {/* Breach Warning */}
      {showBreachWarning && breachResult?.isBreached && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
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
            <div className="text-sm">
              <p className="font-medium text-red-800 dark:text-red-200">
                Password Found in Data Breach
              </p>
              <p className="text-red-700 dark:text-red-300 mt-0.5">
                This password has been exposed in{' '}
                <strong>{breachResult.count?.toLocaleString()}</strong> data breaches.
                Please choose a different password.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Messages */}
      {strength.feedback.length > 0 && (
        <div className="space-y-1">
          {strength.feedback.map((message, index) => (
            <p key={index} className="text-sm text-th-text-secondary flex items-center gap-1.5">
              <svg
                className="w-4 h-4 text-amber-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {message}
            </p>
          ))}
        </div>
      )}

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="bg-surface-secondary rounded-lg p-3">
          <p className="text-sm font-medium text-th-text-primary mb-2">
            Password Requirements
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {strength.requirements.map((req) => (
              <div
                key={req.id}
                className={`flex items-center gap-2 text-sm ${
                  req.met
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-th-text-tertiary'
                }`}
              >
                {req.met ? (
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
                <span className={req.met ? 'line-through opacity-75' : ''}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
