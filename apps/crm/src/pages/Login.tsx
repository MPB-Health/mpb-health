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
      const { error } = await signIn(email, password);
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
      accentVariant="cyan"
      showForgotPassword={false}
      showRememberMe={true}
      emailPlaceholder="you@mympb.com"
      tagline="Empowering Health, Securing Futures"
    />
  );
}
