import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { LoginLayout, AryxAuthShell, detectBrand } from '@mpbhealth/ui';
import { ArrowLeft } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleSubmit = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Authentication service is not configured. Please contact support.');
    }
    try {
      const loginPromise = signIn(email, password);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Login request timed out. Please try again.')), 15000),
      );
      const { error } = await Promise.race([loginPromise, timeoutPromise]);
      if (error) {
        throw new Error(error.message || 'Invalid email or password');
      }
      navigate('/dashboard');
    } catch (err) {
      throw err instanceof Error ? err : new Error('Login failed. Please try again.');
    }
  };

  if (detectBrand() === 'aryx') {
    return (
      <AryxAuthShell
        appName="CRM"
        appDescription="Customer Relationship Management"
        onSubmit={handleSubmit}
        emailPlaceholder="you@mympb.com"
      />
    );
  }

  return (
    <LoginLayout
      appName="CRM"
      appDescription="Customer Relationship Management"
      onSubmit={handleSubmit}
      accentVariant="blue"
      showForgotPassword={false}
      showRememberMe={true}
      emailPlaceholder="you@mympb.com"
      tagline="Empowering Health, Securing Futures"
      formHeader={
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      }
      formFooter={
        <p className="text-center text-sm text-neutral-500">
          Don&apos;t have an account?{' '}
          <Link to="/#pricing" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
            Start your free trial
          </Link>
        </p>
      }
    />
  );
}
