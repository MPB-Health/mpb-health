import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@mpbhealth/database';
import toast from 'react-hot-toast';
import { LoginLayout } from '@mpbhealth/ui';
import { KeyRound, ShieldCheck, ArrowRightLeft } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();

  const handleSubmit = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Authentication service is not configured. Please contact support.');
    }
    try {
      // Clear any stale session / internal lock before a fresh login attempt
      await supabase.auth.signOut({ scope: 'local' });
      const loginPromise = supabase.auth.signInWithPassword({ email, password });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Login request timed out. Please try again.')), 15000),
      );
      const { error } = await Promise.race([loginPromise, timeoutPromise]);
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
      appName="Staff Hub"
      appDescription="Sign in to access your work portals"
      onSubmit={handleSubmit}
      accentVariant="blue"
      showForgotPassword={false}
      showRememberMe={true}
      emailPlaceholder="you@mpb.health"
      tagline="Empowering Health, Securing Futures"
      features={[
        { icon: <KeyRound className="w-5 h-5" />, title: 'Single Sign-On', description: 'One login for all your portals' },
        { icon: <ShieldCheck className="w-5 h-5" />, title: 'Role-Based Access', description: 'Managed by your administrator' },
        { icon: <ArrowRightLeft className="w-5 h-5" />, title: 'Seamless Switching', description: 'Move between apps instantly' },
      ]}
      formFooter={
        <p className="text-center text-sm text-neutral-400">
          Access restricted to authorized MPB Health staff
        </p>
      }
    />
  );
}
