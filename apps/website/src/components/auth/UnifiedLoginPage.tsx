import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, UserPlus, LogIn, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';

interface UnifiedLoginPageProps {
  portalType: 'member' | 'advisor' | 'admin';
  title: string;
  subtitle: string;
  onboardingPath?: string;
  redirectPath: string;
  allowedRoles?: string[];
  showOnboarding?: boolean;
}

export function UnifiedLoginPage({
  portalType,
  title,
  subtitle,
  onboardingPath,
  redirectPath,
  allowedRoles = [],
  showOnboarding = false,
}: UnifiedLoginPageProps) {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [mode, setMode] = useState<'signin' | 'onboarding'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log(`[${portalType}Login] Attempting sign in for:`, email);
      const { error: signInError, data } = await signIn(email, password);

      if (signInError) {
        console.error(`[${portalType}Login] Sign in error:`, signInError);
        setError(signInError.message);
        setLoading(false);
        return;
      }

      console.log(`[${portalType}Login] Sign in successful, user ID:`, data?.user?.id);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data?.user?.id)
        .maybeSingle();

      console.log(`[${portalType}Login] Profile role:`, profile?.role);

      if (profileError) {
        console.error(`[${portalType}Login] Profile fetch error:`, profileError);
      }

      const isSuperAdmin = profile?.role === 'superadmin';

      if (isSuperAdmin) {
        console.log(`[${portalType}Login] Superadmin access granted, navigating to ${redirectPath}`);
        navigate(redirectPath);
      } else if (allowedRoles.length > 0) {
        if (profile?.role && allowedRoles.includes(profile.role)) {
          console.log(`[${portalType}Login] Navigating to ${redirectPath}`);
          navigate(redirectPath);
        } else {
          const roleDescription = portalType === 'member' ? 'members' : `${portalType}s`;
          setError(`This login is for ${roleDescription} only. Please use the appropriate login portal.`);
          await supabase.auth.signOut();
        }
      } else {
        navigate(redirectPath);
      }
    } catch (err: any) {
      console.error(`[${portalType}Login] Exception:`, err);
      setError(err.message || 'An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleModeSwitch = (newMode: 'signin' | 'onboarding') => {
    setMode(newMode);
    setError('');
    setEmail('');
    setPassword('');
  };

  const getOtherPortalLinks = () => {
    const links = [];
    if (portalType !== 'member') {
      links.push({ label: 'Member Login', path: '/login' });
    }
    if (portalType !== 'advisor') {
      links.push({ label: 'Advisor Login', path: '/advisor/login' });
    }
    if (portalType !== 'admin') {
      links.push({ label: 'Admin Login', path: '/admin/login' });
    }
    return links;
  };

  const onboardingContent = {
    member: {
      steps: [
        { title: 'Complete Enrollment', description: 'Choose your healthcare plan' },
        { title: 'Set Up Your Profile', description: 'Add your personal information' },
        { title: 'Access Your Benefits', description: 'Start using your membership' },
      ],
      buttonText: 'Start Enrollment',
    },
    advisor: {
      steps: [
        { title: 'Create Your Account', description: 'Set up your advisor credentials' },
        { title: 'Complete Your Profile', description: 'Add your professional information' },
        { title: 'Start Training', description: 'Access certification courses' },
      ],
      buttonText: 'Begin Onboarding',
    },
    admin: {
      steps: [
        { title: 'Create Admin Account', description: 'Set up administrator credentials' },
        { title: 'Configure Permissions', description: 'Set up your access level' },
        { title: 'Access Admin Tools', description: 'Start managing the platform' },
      ],
      buttonText: 'Begin Setup',
    },
  };

  const currentOnboardingContent = onboardingContent[portalType];
  const otherPortalLinks = getOtherPortalLinks();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600">{subtitle}</p>
        </div>

        <Card className="p-8">
          {showOnboarding && onboardingPath && (
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => handleModeSwitch('signin')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  mode === 'signin'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <LogIn className="w-5 h-5 inline-block mr-2" />
                Sign In
              </button>
              <button
                onClick={() => handleModeSwitch('onboarding')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  mode === 'onboarding'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <UserPlus className="w-5 h-5 inline-block mr-2" />
                Onboarding
              </button>
            </div>
          )}

          {mode === 'signin' ? (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign In to Your Account</h2>

              {portalType === 'member' ? (
                <div className="space-y-6">
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => window.location.href = 'https://app.mpb.health'}
                  >
                    Launch Member App
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>

                  <div className="mt-6 text-center text-sm text-gray-600">
                    <Link to="/forgot-password" className="text-blue-600 hover:text-blue-700 hover:underline">
                      Forgot your password?
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={`${email || `${portalType}@mympb.com`}`}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <span>Signing In...</span>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>

                  <div className="mt-6 text-center text-sm text-gray-600">
                    <Link to="/forgot-password" className="text-blue-600 hover:text-blue-700 hover:underline">
                      Forgot your password?
                    </Link>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {portalType === 'member' ? 'New Member Enrollment' :
                 portalType === 'advisor' ? 'New Advisor Onboarding' :
                 'New Admin Setup'}
              </h2>
              <p className="text-gray-600 mb-6">
                {portalType === 'member'
                  ? 'Ready to join MPB Health? Complete your enrollment to get started.'
                  : portalType === 'advisor'
                  ? 'Ready to join the MPB Health advisor team? Complete your onboarding to get started.'
                  : 'Set up your administrator account to manage the platform.'}
              </p>

              <div className="space-y-4 mb-6">
                {currentOnboardingContent.steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{step.title}</h3>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                className="w-full"
                onClick={() => onboardingPath && navigate(onboardingPath)}
              >
                {currentOnboardingContent.buttonText}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <div className="mt-4 text-center text-sm text-gray-600">
                <p>Already have an account? Click "Sign In" above.</p>
              </div>
            </div>
          )}
        </Card>

        <div className="text-center space-y-2">
          {otherPortalLinks.length > 0 && (
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
              {otherPortalLinks.map((link, index) => (
                <React.Fragment key={link.path}>
                  {index > 0 && <span>•</span>}
                  <Link to={link.path} className="hover:text-blue-600 transition-colors">
                    {link.label}
                  </Link>
                </React.Fragment>
              ))}
            </div>
          )}
          <Link to="/" className="text-sm text-gray-600 hover:text-blue-600 transition-colors block">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
