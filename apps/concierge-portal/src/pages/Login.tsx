import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@mpbhealth/database';
import toast from 'react-hot-toast';
import { LoginLayout } from '@mpbhealth/ui';
import { HeartHandshake, BookOpen, Headphones } from 'lucide-react';

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

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <LoginLayout
      appName="Concierge Portal"
      appDescription="Sign in to access training resources and member services"
      onSubmit={handleSubmit}
      onForgotPassword={handleForgotPassword}
      accentVariant="forest"
      showForgotPassword={true}
      showRememberMe={true}
      emailPlaceholder="concierge@mympb.com"
      tagline="Empowering Health, Securing Futures"
      features={[
        { icon: <HeartHandshake className="w-5 h-5" />, title: 'Member Services', description: 'Manage and support member needs' },
        { icon: <BookOpen className="w-5 h-5" />, title: 'Training Resources', description: 'SOPs, handbooks, and guides' },
        { icon: <Headphones className="w-5 h-5" />, title: 'Ticket System', description: 'Submit and track support tickets' },
      ]}
      formFooter={
        <p className="text-center text-sm text-neutral-400">
          Access restricted to authorized ARYX concierge staff
        </p>
      }
    />
  );
}
