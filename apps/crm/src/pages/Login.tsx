import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { LoginLayout } from '@mpbhealth/ui';

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
      navigate('/');
    } catch (err) {
      throw err instanceof Error ? err : new Error('Login failed. Please try again.');
    }
  };

  return (
    <LoginLayout
      appName="CRM"
      appDescription="MPB Health Customer Relationship Management"
      onSubmit={handleSubmit}
      accentVariant="blue"
      showForgotPassword={false}
      showRememberMe={true}
      emailPlaceholder="you@mympb.com"
      tagline="Empowering Health, Securing Futures"
    />
  );
}
