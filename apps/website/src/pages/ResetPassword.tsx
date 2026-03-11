import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card } from '../components/ui/Card';
import { PasswordStrengthMeter } from '../components/ui/PasswordStrengthMeter';
import { AlertCircle, CheckCircle, Eye, EyeOff, RefreshCw } from 'lucide-react';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsValidToken(false);
      setError('Authentication service is not configured. Please contact support.');
      return;
    }

    // Token exchange is handled by /auth/confirm (the bridge page).
    // By the time the user arrives here, they should already have a valid session.
    // We also handle the legacy case where someone lands here directly with hash params.
    const checkSession = async () => {
      // Legacy fallback: if someone arrives with hash params directly on this page
      // (e.g. old bookmarked link or old email), handle it
      const hash = window.location.hash;
      if (hash) {
        const hashParams = new URLSearchParams(hash.substring(1));
        const hashError = hashParams.get('error');
        const errorDesc = hashParams.get('error_description');

        if (hashError) {
          setIsValidToken(false);
          setError(
            errorDesc ||
            (hashError === 'access_denied' || hashError.includes('expired')
              ? 'This password reset link has expired. Links are valid for about 1 hour and can only be used once. Please request a new one.'
              : 'This password reset link is invalid. Please request a new one.')
          );
          return;
        }

        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');
        if (type === 'recovery' && accessToken) {
          setIsValidToken(true);
          return;
        }
      }

      // Normal flow: /auth/confirm already established the session
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsValidToken(true);
          return;
        }
      } catch {
        // Fall through
      }

      // Give detectSessionInUrl time to finish (legacy hash case)
      await new Promise((r) => setTimeout(r, 2000));

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsValidToken(true);
          return;
        }
      } catch {
        // Fall through
      }

      setIsValidToken(false);
      setError(
        'This password reset link is invalid or has expired. Links expire after about 1 hour and can only be used once. ' +
          'If your email client or security software previews links, it may have used the link before you clicked it — please request a new one.'
      );
    };

    checkSession();

    // Listen for PASSWORD_RECOVERY event as a fallback
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidToken(true);
        setError('');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      // Sync password to ITSTS support system (fire-and-forget)
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        supabase.functions.invoke('sync-user-to-itsts', {
          body: {
            email: user.email,
            first_name: user.user_metadata?.first_name || '',
            last_name: user.user_metadata?.last_name || '',
            roles: [],
            action: 'password_change',
            password,
          },
        }).catch(() => {});
      }

      setSuccess(true);

      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-neutral-100 flex items-center justify-center p-4">
        <div className="animate-pulse text-neutral-600">Verifying reset link...</div>
      </div>
    );
  }

  if (isValidToken === false) {
    const isConfigError = error.includes('not configured');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-neutral-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isConfigError ? 'bg-amber-100' : 'bg-red-100'}`}>
              <AlertCircle className={`w-8 h-8 ${isConfigError ? 'text-amber-600' : 'text-red-600'}`} />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {isConfigError ? 'Authentication service is not configured' : 'Invalid Reset Link'}
            </h1>
            <p className="text-neutral-600 text-sm text-left">
              {isConfigError ? (
                <>
                  This usually happens when your browser is showing a cached version. Try a hard refresh (
                  <kbd className="px-1 py-0.5 bg-neutral-100 rounded text-xs">Ctrl+Shift+R</kbd>) or open in a private window.
                </>
              ) : (
                error
              )}
            </p>
            <div className="flex flex-col gap-2 w-full mt-4">
              {isConfigError ? (
                <Button onClick={() => window.location.reload()} variant="default" className="w-full flex items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Reload page
                </Button>
              ) : (
                <Button onClick={() => navigate('/forgot-password')} variant="default" className="w-full">
                  Request New Reset Link
                </Button>
              )}
              <Button onClick={() => navigate('/login')} variant="outline" className="w-full">
                Back to Login
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-neutral-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">Password Reset Successful</h1>
            <p className="text-neutral-600">
              Your password has been successfully updated. Redirecting to login...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-neutral-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Reset Your Password</h1>
          <p className="text-neutral-600">Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                minLength={8}
                disabled={loading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {password && <PasswordStrengthMeter password={password} />}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={8}
                disabled={loading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !password || !confirmPassword}
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;
