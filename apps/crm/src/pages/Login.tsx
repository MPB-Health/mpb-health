import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoginLayout } from '@mpbhealth/ui';

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleSubmit = async (email: string, password: string) => {
    try {
      const { error } = await signIn(email, password);
      if (error) {
        // Return the error message to be displayed by LoginLayout
        throw new Error(error.message || 'Invalid email or password');
      }
      navigate('/');
    } catch (err) {
      // Re-throw for LoginLayout to handle and display
      throw err instanceof Error ? err : new Error('Login failed. Please try again.');
    }
  };

  return (
    <LoginLayout
      appName="CRM"
      appDescription="MPB Health Customer Relationship Management"
      onSubmit={handleSubmit}
      accentVariant="purple"
      showForgotPassword={false}
      showRememberMe={true}
      emailPlaceholder="you@mympb.com"
      tagline="Empowering Health, Securing Futures"
    />
  );
}
