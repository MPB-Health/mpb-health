import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoginLayout } from '@mpbhealth/ui';

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleSubmit = async (email: string, password: string) => {
    const { error } = await signIn(email, password);
    if (error) throw error;
    navigate('/');
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
