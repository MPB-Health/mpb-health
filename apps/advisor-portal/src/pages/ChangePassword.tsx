import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@mpbhealth/database';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAdvisor } from '../contexts/AdvisorContext';

const PASSWORD_UPDATE_TIMEOUT_MS = 15_000; // 15 seconds — auth should respond well within this
const RETRY_DELAY_MS = 2000;
const MAX_RETRIES = 1; // 1 retry max → 2 attempts × 15s + 2s = ~32s worst case

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out. Please try again.`)), ms),
    ),
  ]);
}

function isRetryableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /503|502|504|timeout|network|ECONNRESET|fetch failed/i.test(msg);
}

export default function ChangePassword() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAdvisor();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const passwordChecks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const isPasswordStrong = Object.values(passwordChecks).filter(Boolean).length >= 4;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isSupabaseConfigured) {
      setError('Authentication service is not configured. Please contact support or try again later.');
      toast.error('Service unavailable');
      return;
    }

    if (!isPasswordStrong) {
      setError('Please create a stronger password');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Update password with timeout and retry on transient failures (503, timeout, etc.)
      let lastError: unknown = null;
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const updatePromise = supabase.auth.updateUser({ password });
          const { error: updateError } = await withTimeout(
            updatePromise,
            PASSWORD_UPDATE_TIMEOUT_MS,
            'Password update',
          );
          if (updateError) throw updateError;
          lastError = null;
          break;
        } catch (err) {
          lastError = err;
          if (attempt < MAX_RETRIES && isRetryableError(err)) {
            await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
            continue;
          }
          throw err;
        }
      }
      if (lastError) throw lastError;

      // Clear the must_change_password flag BEFORE refreshing profile.
      // This MUST complete before refreshProfile() or MainLayout will
      // see the old flag and redirect back to /change-password (loop).
      if (profile?.id) {
        try {
          const { error: flagError } = await supabase
            .from('advisor_profiles')
            .update({ must_change_password: false })
            .eq('id', profile.id);
          if (flagError) console.error('Failed to clear must_change_password flag:', flagError);
        } catch {
          // If this fails, still continue — user changed their password
        }
      }

      setSuccess(true);
      toast.success('Password updated successfully!');

      // Refresh profile so context picks up must_change_password=false
      await refreshProfile().catch(() => {});

      // Sync password to ITSTS (deferred fire-and-forget — avoids 503 blocking UX)
      const syncToItsts = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) return;
        const body = {
          email: user.email,
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          roles: [] as string[],
          action: 'password_change' as const,
          password,
        };
        try {
          await supabase.functions.invoke('sync-user-to-itsts', { body });
        } catch {
          await new Promise((r) => setTimeout(r, 5000));
          supabase.functions.invoke('sync-user-to-itsts', { body }).catch(() => {});
        }
      };
      setTimeout(() => syncToItsts().catch(() => {}), 3000);

      setTimeout(() => navigate('/', { replace: true }), 1500);
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Failed to change password';
      const message =
        /503|502|504|service unavailable|timeout|not configured/i.test(raw)
          ? 'Service temporarily unavailable. Please try again in a moment. If this persists, contact support.'
          : /session.*not.*found|auth.*session.*missing|invalid.*session|session.*expired/i.test(raw)
          ? 'Your session has expired. Please sign in again to set your password.'
          : raw;
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Password updated!</h1>
            <p className="text-gray-600 mb-4">
              Your password has been changed. Redirecting to the dashboard...
            </p>
            <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-7 h-7 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Set your password</h1>
            <p className="text-gray-600">
              For your security, please create a new password before continuing.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                New password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a strong password"
                  autoComplete="new-password"
                  className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-11 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {password.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => {
                      const strength = Object.values(passwordChecks).filter(Boolean).length;
                      const isActive = level <= strength;
                      return (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            isActive
                              ? strength <= 2
                                ? 'bg-red-500'
                                : strength <= 3
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              : 'bg-gray-200'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <li className={`flex items-center gap-1 ${passwordChecks.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordChecks.minLength ? '✓' : '○'} 8+ characters
                    </li>
                    <li className={`flex items-center gap-1 ${passwordChecks.hasUppercase ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordChecks.hasUppercase ? '✓' : '○'} Uppercase
                    </li>
                    <li className={`flex items-center gap-1 ${passwordChecks.hasLowercase ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordChecks.hasLowercase ? '✓' : '○'} Lowercase
                    </li>
                    <li className={`flex items-center gap-1 ${passwordChecks.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordChecks.hasNumber ? '✓' : '○'} Number
                    </li>
                    <li className={`flex items-center gap-1 ${passwordChecks.hasSpecial ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordChecks.hasSpecial ? '✓' : '○'} Special char
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  className={`block w-full rounded-lg border bg-white py-2.5 pl-10 pr-11 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:outline-none transition-colors ${
                    confirmPassword.length > 0
                      ? passwordsMatch
                        ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
                        : 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="mt-1.5 text-xs text-red-600">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordStrong || !passwordsMatch || !isSupabaseConfigured}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Updating...</span>
                </>
              ) : (
                'Set password & continue'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
