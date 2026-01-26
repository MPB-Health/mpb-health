import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Copy, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { mfaService } from '../lib/mfaService';

export default function MFAEnrollment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, returnPath } = location.state || {};

  const [step, setStep] = useState<'intro' | 'setup' | 'verify' | 'backup' | 'complete'>('intro');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [_factorId, _setFactorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);

  useEffect(() => {
    if (!userId) {
      navigate('/');
    }
  }, [userId, navigate]);

  const handleStartSetup = async () => {
    setLoading(true);
    setError('');

    try {
      const enrollmentData = await mfaService.enrollTOTP(userId);

      if (!enrollmentData) {
        setError('Failed to start MFA enrollment. Please try again.');
        setLoading(false);
        return;
      }

      setQrCode(enrollmentData.qr_code);
      setSecret(enrollmentData.secret);
      setBackupCodes(enrollmentData.backup_codes);

      const factors = await mfaService.getMFASettings(userId);
      if (factors) {
        setStep('setup');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start MFA enrollment');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const verified = await mfaService.verifyTOTPEnrollment(userId, verificationCode, factorId);

      if (!verified) {
        setError('Invalid verification code. Please try again.');
        setLoading(false);
        return;
      }

      setStep('backup');
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleCopyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setCopiedBackup(true);
    setTimeout(() => setCopiedBackup(false), 2000);
  };

  const handleDownloadBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mpb-health-backup-codes.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleComplete = () => {
    navigate(returnPath || '/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Shield className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Multi-Factor Authentication</h1>
          <p className="text-gray-600">
            Secure your account with an additional layer of protection
          </p>
        </div>

        <Card className="p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 'intro' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  MFA is Required for Your Account
                </h2>
                <p className="text-gray-600 mb-4">
                  As an {userId ? 'authorized user' : 'administrator'}, you must set up
                  multi-factor authentication to enhance your account security.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">What you'll need:</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>An authenticator app (Google Authenticator, Authy, Microsoft Authenticator)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>Your smartphone or tablet</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>5 minutes to complete setup</span>
                  </li>
                </ul>
              </div>

              <Button
                onClick={handleStartSetup}
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Starting Setup...' : 'Start MFA Setup'}
              </Button>
            </div>
          )}

          {step === 'setup' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Scan QR Code
                </h2>
                <p className="text-gray-600">
                  Open your authenticator app and scan this QR code:
                </p>
              </div>

              {qrCode && (
                <div className="flex justify-center">
                  <img src={qrCode} alt="MFA QR Code" className="w-64 h-64" />
                </div>
              )}

              <div>
                <Label>Or enter this code manually:</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={secret}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    onClick={handleCopySecret}
                    variant="outline"
                    className="flex-shrink-0"
                  >
                    {copiedSecret ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <Button
                onClick={() => setStep('verify')}
                className="w-full"
              >
                Continue to Verification
              </Button>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Verify Setup
                </h2>
                <p className="text-gray-600">
                  Enter the 6-digit code from your authenticator app to verify the setup:
                </p>
              </div>

              <div>
                <Label htmlFor="verificationCode">Verification Code</Label>
                <Input
                  id="verificationCode"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-mono"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep('setup')}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleVerify}
                  className="flex-1"
                  disabled={loading || verificationCode.length !== 6}
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </Button>
              </div>
            </div>
          )}

          {step === 'backup' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Save Backup Codes
                </h2>
                <p className="text-gray-600 mb-4">
                  Store these backup codes in a safe place. Each code can be used once if you
                  lose access to your authenticator app.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="text-center py-2 bg-white rounded border border-gray-200">
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCopyBackupCodes}
                  variant="outline"
                  className="flex-1"
                >
                  {copiedBackup ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Codes
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleDownloadBackupCodes}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Important:</strong> These codes will not be shown again. Make sure to
                  save them securely before continuing.
                </p>
              </div>

              <Button
                onClick={handleComplete}
                className="w-full"
              >
                Complete Setup
              </Button>
            </div>
          )}
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Need help? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
