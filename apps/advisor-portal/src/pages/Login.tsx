import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@mpbhealth/database';
import toast from 'react-hot-toast';
import { LoginLayout } from '@mpbhealth/ui';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Show success toast when redirected after a successful password reset
  useEffect(() => {
    if (searchParams.get('reset') === '1') {
      toast.success('Password reset successfully. Please sign in with your new password.', {
        duration: 5000,
        id: 'reset-success', // prevent duplicates
      });
      // Clean the URL without triggering a re-render loop
      searchParams.delete('reset');
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  const withTimeout = async <T,>(promise: Promise<T>, ms: number): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Login request timed out. Please try again.'));
      }, ms);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  const handleSubmit = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Authentication service is not configured. Please contact support.');
    }
    try {
      // Clear any stale session / internal lock before a fresh login attempt.
      // scope:'local' only wipes the browser state — no server round-trip that
      // could itself hang if the old token is already invalid.
      await supabase.auth.signOut({ scope: 'local' });

      const { error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        15000,
      );
      if (error) {
        throw new Error(error.message || 'Invalid email or password');
      }
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      throw err instanceof Error ? err : new Error('Login failed. Please try again.');
    }
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <LoginLayout
      appName="Advisor Portal"
      appDescription="Sign in to access your dashboard"
      onSubmit={handleSubmit}
      onForgotPassword={handleForgotPassword}
      accentVariant="blue"
      showForgotPassword={true}
      showRememberMe={true}
      emailPlaceholder="advisor@mympb.com"
      tagline="Empowering Health, Securing Futures"
      formFooter={
        <p className="text-center text-sm text-th-text-tertiary">
          Need help?{' '}
          <a href="#" className="text-th-accent-600 hover:text-th-accent-700 font-medium">
            Contact Support
          </a>
        </p>
      }
    />
  );
}
