import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@mpbhealth/database';
import toast from 'react-hot-toast';
import { LoginLayout } from '@mpbhealth/ui';

export default function Login() {
  const navigate = useNavigate();

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
          <a href="/contact" className="text-th-accent-600 hover:text-th-accent-700 font-medium">
            Contact Support
          </a>
        </p>
      }
    />
  );
}
