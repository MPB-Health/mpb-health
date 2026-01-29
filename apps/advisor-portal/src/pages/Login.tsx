import { useNavigate } from 'react-router-dom';
import { supabase } from '@mpbhealth/database';
import toast from 'react-hot-toast';
import { LoginLayout } from '@mpbhealth/ui';

export default function Login() {
  const navigate = useNavigate();

  const handleSubmit = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
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
      accentVariant="teal"
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
