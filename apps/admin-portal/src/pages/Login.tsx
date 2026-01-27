import { useNavigate } from 'react-router-dom';
import { supabase } from '@mpbhealth/database';
import toast from 'react-hot-toast';
import { LoginLayout } from '@mpbhealth/ui';

export default function Login() {
  const navigate = useNavigate();

  const handleSubmit = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    toast.success('Welcome back!');
    navigate('/');
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
        <p className="text-center text-sm text-neutral-500">
          Access restricted to authorized administrators only
        </p>
      }
    />
  );
}
