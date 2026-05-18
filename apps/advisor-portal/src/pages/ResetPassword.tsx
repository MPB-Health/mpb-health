import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@mpbhealth/database';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAdvisorPageDebugLog } from '../hooks/useAdvisorPageDebugLog';

export default function ResetPassword() {
  useAdvisorPageDebugLog('ResetPassword');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [linkError, setLinkError] = useState('');
  const [success, setSuccess] = useState(false);
  const sessionEstablished = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLinkError('Authentication service is not configured. Please contact support.');
      setVerifying(false);
      return;
    }

    let cancelled = false;

    const verifyToken = async () => {
      const tokenHash = searchParams.get('token_hash');
      const emailParam = searchParams.get('email');
      const rawToken = searchParams.get('token');
      const type = searchParams.get('type');

      // ── Flow 1: token_hash (scanner-proof, preferred) ──
      if (tokenHash && type === 'recovery') {
        const { error: otpError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery',
        });

        if (cancelled) return;

        if (otpError) {
          setLinkError(
            otpError.message.includes('expired')
              ? 'This password reset link has expired. Please request a new one.'
              : 'This password reset link is invalid or has already been used. Please request a new one.',
          );
          setVerifying(false);
          return;
        }

        sessionEstablished.current = true;
        setVerifying(false);
        return;
      }

      // ── Flow 2: email + raw token fallback ──
      if (emailParam && rawToken && type === 'recovery') {
        const { error: otpError } = await supabase.auth.verifyOtp({
          email: emailParam,
          token: rawToken,
          type: 'recovery',
        });

        if (cancelled) return;

        if (otpError) {
          setLinkError(
            otpError.message.includes('expired')
              ? 'This password reset link has expired. Please request a new one.'
              : 'This password reset link is invalid or has already been used. Please request a new one.',
          );
          setVerifying(false);
          return;
        }

        sessionEstablished.current = true;
        setVerifying(false);
        return;
      }

      // ── Flow 3: Hash-based tokens (legacy Supabase default) ──
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          sessionEstablished.current = true;
          if (!cancelled) setVerifying(false);
          return;
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }

      setTimeout(() => {
        if (!cancelled && !sessionEstablished.current) {
          setLinkError('This reset link is invalid or has expired. Please request a new one below.');
          setVerifying(false);
        }
      }, 4000);
    };

    verifyToken();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        sessionEstablished.current = true;
        setVerifying(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [navigate, searchParams]);

  // Password strength checks
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
      const updateResult = await Promise.race([
        supabase.auth.updateUser({ password }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Password reset timed out. Please try again.')), 15_000)),
      ]);
      const { error: updateError } = updateResult;

      if (updateError) throw updateError;

      // Get user for flag clear and ITSTS sync
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      // Clear must_change_password flag so MainLayout won't redirect to
      // /change-password after the user logs in with their new password.
      if (currentUser) {
        // Use RPC (SECURITY DEFINER) to clear flag — bypasses RLS and ensures
        // the update succeeds even when PASSWORD_RECOVERY session has different semantics.
        const { error: flagErr } = await supabase.rpc('clear_must_change_password_after_reset');
        if (flagErr) console.error('Failed to clear must_change_password:', flagErr);
      }

      // Sync password to ITSTS support system (fire-and-forget)
      if (currentUser?.email) {
        supabase.functions.invoke('sync-user-to-itsts', {
          body: {
            email: currentUser.email,
            first_name: currentUser.user_metadata?.first_name || '',
            last_name: currentUser.user_metadata?.last_name || '',
            roles: [],
            action: 'password_change',
            password,
          },
        }).catch(() => {});
      }

      setSuccess(true);
      toast.success('Password updated successfully! Taking you to your dashboard...');

      // Session is valid after updateUser() — navigate directly to the dashboard.
      // Do NOT sign out here: signing out clears the service-worker-cached token
      // and causes a 400 on the next page load when the stale token is replayed.
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset password';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Verifying token state
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">Verifying your reset link...</p>
          <p className="text-sm text-gray-500 mt-1">Please wait a moment.</p>
        </div>
      </div>
    );
  }

  if (linkError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset link not valid</h1>
            <p className="text-gray-600 mb-6">{linkError}</p>
            <div className="space-y-3">
              <Link
                to="/forgot-password"
                className="block w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 transition-colors text-center"
              >
                Request a new reset link
              </Link>
              <Link
                to="/login"
                className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-center"
              >
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Password reset!</h1>
            <p className="text-gray-600 mb-4">
              Your password has been successfully reset. Redirecting to your dashboard...
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Set new password</h1>
            <p className="text-gray-600">
              Your new password must be different from previously used passwords.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
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
                  placeholder="••••••••"
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

              {/* Password strength indicators */}
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

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
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
                  placeholder="••••••••"
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
              disabled={loading || !isPasswordStrong || !passwordsMatch}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Resetting...</span>
                </>
              ) : (
                'Reset password'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
