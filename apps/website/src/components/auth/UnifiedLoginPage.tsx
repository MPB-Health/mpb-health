import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { LoginLayout } from '@mpbhealth/ui';
import { Button } from '../ui/Button';

interface UnifiedLoginPageProps {
  portalType: 'member' | 'advisor' | 'admin';
  title: string;
  subtitle: string;
  onboardingPath?: string;
  redirectPath: string;
  allowedRoles?: string[];
  showOnboarding?: boolean;
}

const accentMap: Record<string, 'blue' | 'teal' | 'purple' | 'red'> = {
  member: 'blue',
  advisor: 'teal',
  admin: 'blue',
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

  const handleSubmit = async (email: string, password: string) => {
    const { error: signInError, data } = await signIn(email, password);
    if (signInError) throw signInError;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data?.user?.id)
      .maybeSingle();

    if (profileError) {
      console.error(`[${portalType}Login] Profile fetch error:`, profileError);
    }

    const isSuperAdmin = profile?.role === 'superadmin';

    if (isSuperAdmin) {
      navigate(redirectPath);
    } else if (allowedRoles.length > 0) {
      if (profile?.role && allowedRoles.includes(profile.role)) {
        navigate(redirectPath);
      } else {
        const roleDescription = portalType === 'member' ? 'members' : `${portalType}s`;
        await supabase.auth.signOut();
        throw new Error(`This login is for ${roleDescription} only. Please use the appropriate login portal.`);
      }
    } else {
      navigate(redirectPath);
    }
  };

  const handleModeSwitch = (newMode: 'signin' | 'onboarding') => {
    setMode(newMode);
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

  const otherPortalLinks = getOtherPortalLinks();
  const currentOnboardingContent = onboardingContent[portalType];

  // Build the tabs header for onboarding-capable portals
  const formHeader = showOnboarding && onboardingPath ? (
    <div className="flex gap-2 mb-6">
      <button
        onClick={() => handleModeSwitch('signin')}
        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
          mode === 'signin'
            ? 'bg-primary-600 text-white shadow-md'
            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
        }`}
      >
        <LogIn className="w-5 h-5 inline-block mr-2" />
        Sign In
      </button>
      <button
        onClick={() => handleModeSwitch('onboarding')}
        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
          mode === 'onboarding'
            ? 'bg-primary-600 text-white shadow-md'
            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
        }`}
      >
        <UserPlus className="w-5 h-5 inline-block mr-2" />
        Onboarding
      </button>
    </div>
  ) : undefined;

  // Footer with portal links
  const formFooter = (
    <div className="space-y-3">
      {otherPortalLinks.length > 0 && (
        <div className="flex items-center justify-center gap-4 text-sm text-neutral-500">
          {otherPortalLinks.map((link, index) => (
            <React.Fragment key={link.path}>
              {index > 0 && <span className="text-neutral-300">·</span>}
              <Link to={link.path} className="hover:text-primary-600 transition-colors">
                {link.label}
              </Link>
            </React.Fragment>
          ))}
        </div>
      )}
      <Link
        to="/"
        className="text-sm text-neutral-500 hover:text-primary-600 transition-colors block text-center"
      >
        &larr; Back to Home
      </Link>
    </div>
  );

  // Member portal: show a redirect button instead of the login form
  // Onboarding mode: show onboarding steps instead of the login form
  const showCustomChildren = portalType === 'member' || mode === 'onboarding';

  return (
    <LoginLayout
      appName={title}
      appDescription={subtitle}
      onSubmit={handleSubmit}
      accentVariant={accentMap[portalType]}
      showForgotPassword={true}
      showRememberMe={true}
      emailPlaceholder={`${portalType}@mympb.com`}
      tagline="Empowering Health, Securing Futures"
      formHeader={formHeader}
      formFooter={formFooter}
    >
      {showCustomChildren ? (
        portalType === 'member' && mode === 'signin' ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
                Welcome back
              </h2>
              <p className="text-neutral-500">{subtitle}</p>
            </div>
            <Button
              type="button"
              className="w-full"
              onClick={() => window.location.href = 'https://app.mpb.health'}
            >
              Launch Member App
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <div className="text-center text-sm text-neutral-500">
              <Link to="/forgot-password" className="text-primary-600 hover:text-primary-700">
                Forgot your password?
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
                {portalType === 'member' ? 'New Member Enrollment' :
                 portalType === 'advisor' ? 'New Advisor Onboarding' :
                 'New Admin Setup'}
              </h2>
              <p className="text-neutral-500">
                {portalType === 'member'
                  ? 'Ready to join MPB Health? Complete your enrollment to get started.'
                  : portalType === 'advisor'
                  ? 'Ready to join the MPB Health advisor team? Complete your onboarding to get started.'
                  : 'Set up your administrator account to manage the platform.'}
              </p>
            </div>

            <div className="space-y-3">
              {currentOnboardingContent.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-primary-50 rounded-lg border border-primary-100">
                  <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">{step.title}</h3>
                    <p className="text-sm text-neutral-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none transition-all"
              onClick={() => onboardingPath && navigate(onboardingPath)}
            >
              {currentOnboardingContent.buttonText}
              <ArrowRight className="h-5 w-5" />
            </button>

            <p className="text-center text-sm text-neutral-500">
              Already have an account? Click &ldquo;Sign In&rdquo; above.
            </p>
          </div>
        )
      ) : undefined}
    </LoginLayout>
  );
}
