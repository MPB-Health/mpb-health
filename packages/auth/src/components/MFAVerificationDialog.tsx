import React, { useState, useCallback, useRef, useEffect } from 'react';
import { mfaService } from '../services/mfaService';
import { useAuth } from '../contexts/AuthContext';

export interface MFAVerificationDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when verification is successful */
  onSuccess: () => void;
  /** Callback when dialog is cancelled/closed */
  onCancel?: () => void;
  /** Callback when "Trust this device" is selected */
  onTrustDevice?: () => void;
  /** Whether to show the "Trust this device" option */
  showTrustDevice?: boolean;
  /** Title override */
  title?: string;
  /** Description override */
  description?: string;
}

/**
 * MFA verification dialog component.
 * Displays a modal for entering 6-digit TOTP codes with backup code fallback.
 */
export const MFAVerificationDialog: React.FC<MFAVerificationDialogProps> = ({
  isOpen,
  onSuccess,
  onCancel,
  onTrustDevice,
  showTrustDevice = true,
  title = 'Two-Factor Authentication',
  description = 'Enter the 6-digit code from your authenticator app.',
}) => {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showBackupInput, setShowBackupInput] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [trustDevice, setTrustDevice] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, showBackupInput]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCode('');
      setBackupCode('');
      setError(null);
      setShowBackupInput(false);
      setTrustDevice(false);
    }
  }, [isOpen]);

  // Handle TOTP code verification
  const handleVerifyCode = useCallback(async () => {
    if (!user || code.length !== 6) {
      setError('Please enter a valid 6-digit code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await mfaService.verifyTOTP(user.id, code);

      if (success) {
        // Handle trust device if selected
        if (trustDevice && onTrustDevice) {
          const fingerprint = mfaService.generateDeviceFingerprint();
          await mfaService.addTrustedDevice(user.id, 'Trusted Browser', fingerprint);
          onTrustDevice();
        }
        onSuccess();
      } else {
        setError('Invalid code. Please try again.');
        setCode('');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
      console.error('MFA verification error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, code, trustDevice, onTrustDevice, onSuccess]);

  // Handle backup code verification
  const handleVerifyBackupCode = useCallback(async () => {
    if (!user || !backupCode.trim()) {
      setError('Please enter a backup code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await mfaService.verifyBackupCode(user.id, backupCode.trim().toUpperCase());

      if (success) {
        onSuccess();
      } else {
        setError('Invalid backup code. Please try again.');
        setBackupCode('');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
      console.error('Backup code verification error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, backupCode, onSuccess]);

  // Handle code input change
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    setError(null);

    // Auto-submit when 6 digits are entered
    if (value.length === 6) {
      // Small delay to show the complete code before submitting
      setTimeout(() => {
        if (user) {
          handleVerifyCode();
        }
      }, 100);
    }
  };

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (showBackupInput) {
        handleVerifyBackupCode();
      } else if (code.length === 6) {
        handleVerifyCode();
      }
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mfa-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-surface-primary rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-th-border animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-th-accent-100 dark:bg-th-accent-900/30 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-th-accent-600"
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
          <h2
            id="mfa-dialog-title"
            className="text-lg font-semibold text-th-text-primary"
          >
            {title}
          </h2>
          <p className="text-sm text-th-text-secondary mt-1">
            {showBackupInput
              ? 'Enter one of your backup codes.'
              : description}
          </p>
        </div>

        {/* Code Input */}
        {!showBackupInput ? (
          <>
            <div className="mb-4">
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={handleCodeChange}
                onKeyDown={handleKeyDown}
                placeholder="000000"
                disabled={loading}
                className="w-full text-center text-3xl font-mono tracking-[0.5em] px-4 py-4 border border-th-border rounded-lg bg-surface-primary text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent disabled:opacity-50"
                autoComplete="one-time-code"
              />
            </div>

            {/* Code dots indicator */}
            <div className="flex justify-center gap-2 mb-4">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    code.length > i
                      ? 'bg-th-accent-600'
                      : 'bg-th-border'
                  }`}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="mb-4">
            <input
              ref={inputRef}
              type="text"
              value={backupCode}
              onChange={(e) => {
                setBackupCode(e.target.value.toUpperCase());
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="XXXX-XXXX"
              disabled={loading}
              className="w-full text-center text-xl font-mono tracking-widest px-4 py-4 border border-th-border rounded-lg bg-surface-primary text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent disabled:opacity-50"
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <p className="text-sm text-red-500 text-center mb-4">{error}</p>
        )}

        {/* Trust Device Checkbox */}
        {showTrustDevice && !showBackupInput && (
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={trustDevice}
              onChange={(e) => setTrustDevice(e.target.checked)}
              className="w-4 h-4 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
            />
            <span className="text-sm text-th-text-secondary">
              Trust this device for 30 days
            </span>
          </label>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {!showBackupInput ? (
            <button
              onClick={handleVerifyCode}
              disabled={loading || code.length !== 6}
              className="w-full px-4 py-2.5 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 disabled:opacity-50 transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </button>
          ) : (
            <button
              onClick={handleVerifyBackupCode}
              disabled={loading || !backupCode.trim()}
              className="w-full px-4 py-2.5 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Verifying...' : 'Use Backup Code'}
            </button>
          )}

          {onCancel && (
            <button
              onClick={onCancel}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-surface-secondary text-th-text-primary rounded-lg font-medium border border-th-border hover:bg-surface-tertiary transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Backup Code Toggle */}
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setShowBackupInput(!showBackupInput);
              setError(null);
            }}
            className="text-sm text-th-accent-600 hover:text-th-accent-700 hover:underline"
          >
            {showBackupInput
              ? 'Use authenticator app instead'
              : "Can't access your authenticator? Use a backup code"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MFAVerificationDialog;
