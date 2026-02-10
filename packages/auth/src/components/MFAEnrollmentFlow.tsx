import React, { useState, useCallback } from 'react';
import { mfaService, type MFAEnrollmentData } from '../services/mfaService';
import { useAuth } from '../contexts/AuthContext';

export type MFAEnrollmentStep = 'intro' | 'qrcode' | 'verify' | 'backup' | 'complete';

export interface MFAEnrollmentFlowProps {
  /** Callback when enrollment is completed successfully */
  onComplete?: () => void;
  /** Callback when user cancels enrollment */
  onCancel?: () => void;
  /** Whether to show a cancel button */
  showCancel?: boolean;
  /** Initial step (default: 'intro') */
  initialStep?: MFAEnrollmentStep;
}

/**
 * Multi-step MFA enrollment flow component.
 * Guides users through setting up TOTP-based two-factor authentication.
 */
export const MFAEnrollmentFlow: React.FC<MFAEnrollmentFlowProps> = ({
  onComplete,
  onCancel,
  showCancel = true,
  initialStep = 'intro',
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<MFAEnrollmentStep>(initialStep);
  const [enrollmentData, setEnrollmentData] = useState<MFAEnrollmentData | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Start enrollment - get QR code and secret
  const handleStartEnrollment = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await mfaService.enrollTOTP(user.id);
      if (data) {
        setEnrollmentData(data);
        // Extract factor ID from the enrollment response if available
        // For now, we'll handle this in verification
        setStep('qrcode');
      } else {
        setError('Failed to start MFA enrollment. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during enrollment setup.');
      console.error('MFA enrollment error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Verify the TOTP code
  const handleVerifyCode = useCallback(async () => {
    if (!user || !verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First, we need to verify the TOTP enrollment
      const success = await mfaService.verifyTOTP(user.id, verificationCode);

      if (success) {
        setStep('backup');
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
      console.error('MFA verification error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, verificationCode]);

  // Handle code input change
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(value);
    setError(null);
  };

  // Auto-submit when 6 digits are entered
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && verificationCode.length === 6) {
      handleVerifyCode();
    }
  };

  // Download backup codes
  const handleDownloadBackupCodes = useCallback(() => {
    if (!enrollmentData?.backup_codes) return;

    const content = [
      'MPB Health - MFA Backup Codes',
      '==============================',
      '',
      'Keep these codes in a safe place. Each code can only be used once.',
      '',
      ...enrollmentData.backup_codes.map((code, i) => `${i + 1}. ${code}`),
      '',
      `Generated: ${new Date().toISOString()}`,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mpb-health-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [enrollmentData]);

  // Copy secret to clipboard
  const handleCopySecret = useCallback(async () => {
    if (enrollmentData?.secret) {
      await navigator.clipboard.writeText(enrollmentData.secret);
    }
  }, [enrollmentData]);

  // Render intro step
  const renderIntro = () => (
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
        Set Up Two-Factor Authentication
      </h2>
      <p className="text-th-text-secondary mb-6">
        Add an extra layer of security to your account by enabling two-factor
        authentication (2FA). You'll need an authenticator app like Google
        Authenticator or Authy.
      </p>
      <div className="bg-surface-secondary rounded-lg p-4 mb-6 text-left">
        <h3 className="font-medium text-th-text-primary mb-2">You'll need:</h3>
        <ul className="space-y-2 text-sm text-th-text-secondary">
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            An authenticator app on your phone
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            A few minutes to complete setup
          </li>
        </ul>
      </div>
      <div className="flex gap-3">
        {showCancel && (
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-surface-secondary text-th-text-primary rounded-lg font-medium border border-th-border hover:bg-surface-tertiary transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleStartEnrollment}
          disabled={loading}
          className="flex-1 px-4 py-2.5 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Setting up...' : 'Get Started'}
        </button>
      </div>
    </div>
  );

  // Render QR code step
  const renderQRCode = () => (
    <div>
      <h2 className="text-xl font-semibold text-th-text-primary text-center mb-2">
        Scan QR Code
      </h2>
      <p className="text-th-text-secondary text-center mb-6">
        Open your authenticator app and scan this QR code.
      </p>

      {enrollmentData?.qr_code && (
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <img
              src={enrollmentData.qr_code}
              alt="MFA QR Code"
              className="w-48 h-48"
            />
          </div>
        </div>
      )}

      <div className="bg-surface-secondary rounded-lg p-4 mb-6">
        <p className="text-sm text-th-text-secondary mb-2">
          Can't scan the code? Enter this key manually:
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 bg-surface-primary rounded border border-th-border font-mono text-sm text-th-text-primary break-all">
            {enrollmentData?.secret}
          </code>
          <button
            onClick={handleCopySecret}
            className="px-3 py-2 text-th-accent-600 hover:bg-th-accent-50 rounded transition-colors"
            title="Copy to clipboard"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      <button
        onClick={() => setStep('verify')}
        className="w-full px-4 py-2.5 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 transition-colors"
      >
        I've Scanned the Code
      </button>
    </div>
  );

  // Render verification step
  const renderVerify = () => (
    <div>
      <h2 className="text-xl font-semibold text-th-text-primary text-center mb-2">
        Verify Setup
      </h2>
      <p className="text-th-text-secondary text-center mb-6">
        Enter the 6-digit code from your authenticator app to verify setup.
      </p>

      <div className="mb-6">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={verificationCode}
          onChange={handleCodeChange}
          onKeyDown={handleKeyDown}
          placeholder="000000"
          className="w-full text-center text-2xl font-mono tracking-widest px-4 py-4 border border-th-border rounded-lg bg-surface-primary text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
          autoFocus
        />
        {error && (
          <p className="mt-2 text-sm text-red-500 text-center">{error}</p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setStep('qrcode')}
          className="flex-1 px-4 py-2.5 bg-surface-secondary text-th-text-primary rounded-lg font-medium border border-th-border hover:bg-surface-tertiary transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleVerifyCode}
          disabled={loading || verificationCode.length !== 6}
          className="flex-1 px-4 py-2.5 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </div>
    </div>
  );

  // Render backup codes step
  const renderBackupCodes = () => (
    <div>
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-th-text-primary text-center mb-2">
        Save Your Backup Codes
      </h2>
      <p className="text-th-text-secondary text-center mb-6">
        Keep these backup codes safe. You can use them to access your account if
        you lose your authenticator device.
      </p>

      <div className="bg-surface-secondary rounded-lg p-4 mb-4">
        <div className="grid grid-cols-2 gap-2">
          {enrollmentData?.backup_codes.map((code, index) => (
            <code
              key={index}
              className="px-3 py-2 bg-surface-primary rounded border border-th-border font-mono text-sm text-th-text-primary text-center"
            >
              {code}
            </code>
          ))}
        </div>
      </div>

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
              Important
            </p>
            <p className="text-amber-700 dark:text-amber-300">
              Each backup code can only be used once. Store them securely and
              don't share them with anyone.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleDownloadBackupCodes}
          className="flex-1 px-4 py-2.5 bg-surface-secondary text-th-text-primary rounded-lg font-medium border border-th-border hover:bg-surface-tertiary transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </button>
        <button
          onClick={() => {
            setStep('complete');
            onComplete?.();
          }}
          className="flex-1 px-4 py-2.5 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 transition-colors"
        >
          I've Saved My Codes
        </button>
      </div>
    </div>
  );

  // Render complete step
  const renderComplete = () => (
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-th-text-primary mb-2">
        Two-Factor Authentication Enabled
      </h2>
      <p className="text-th-text-secondary mb-6">
        Your account is now protected with two-factor authentication. You'll
        need to enter a code from your authenticator app each time you sign in.
      </p>
      <button
        onClick={onComplete}
        className="w-full px-4 py-2.5 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 transition-colors"
      >
        Done
      </button>
    </div>
  );

  // Render current step
  const renderStep = () => {
    switch (step) {
      case 'intro':
        return renderIntro();
      case 'qrcode':
        return renderQRCode();
      case 'verify':
        return renderVerify();
      case 'backup':
        return renderBackupCodes();
      case 'complete':
        return renderComplete();
      default:
        return renderIntro();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-surface-primary rounded-xl border border-th-border shadow-lg">
      {/* Progress Indicator */}
      {step !== 'complete' && (
        <div className="flex items-center justify-center gap-2 mb-6">
          {(['intro', 'qrcode', 'verify', 'backup'] as MFAEnrollmentStep[]).map((s, i) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-colors ${
                step === s
                  ? 'bg-th-accent-600'
                  : ['intro', 'qrcode', 'verify', 'backup'].indexOf(step) > i
                  ? 'bg-th-accent-400'
                  : 'bg-th-border'
              }`}
            />
          ))}
        </div>
      )}

      {renderStep()}
    </div>
  );
};

export default MFAEnrollmentFlow;
