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

  return (
    <LoginLayout
      appName="Admin Portal"
      appDescription="Sign in to manage your platform"
      onSubmit={handleSubmit}
      accentVariant="blue"
      showForgotPassword={false}
      showRememberMe={true}
      emailPlaceholder="admin@mpb.health"
      tagline="Empowering Health, Securing Futures"
      formFooter={
        <p className="text-center text-sm text-th-text-tertiary">
          Access restricted to authorized administrators only
        </p>
      }
    />
  );
}
