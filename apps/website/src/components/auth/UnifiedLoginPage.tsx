import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, UserPlus, LogIn, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { LoginLayout } from '@mpbhealth/ui';
import { Button } from '../ui/button';

interface UnifiedLoginPageProps {
  portalType: 'member' | 'advisor' | 'admin';
  title: string;
  subtitle: string;
  onboardingPath?: string;
  redirectPath: string;
  allowedRoles?: string[];
  showOnboarding?: boolean;
}

const accentMap: Record<string, 'blue' | 'teal' | 'cyan' | 'red'> = {
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

  // Show config error state when Supabase env vars are missing (often due to cached build)
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-white to-slate-50 px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-left">
            <h2 className="text-lg font-semibold text-amber-800 mb-2">Authentication service is not configured</h2>
            <p className="text-sm text-amber-700 mb-4">
              This usually happens when your browser is showing a cached version of the site. Try these steps:
            </p>
            <ol className="text-sm text-amber-700 space-y-2 list-decimal list-inside mb-6">
              <li>Hard refresh: <kbd className="px-1.5 py-0.5 bg-amber-100 rounded text-xs font-mono">Ctrl+Shift+R</kbd> (Windows) or <kbd className="px-1.5 py-0.5 bg-amber-100 rounded text-xs font-mono">Cmd+Shift+R</kbd> (Mac)</li>
              <li>Or open the page in a private/incognito window</li>
              <li>Or try a different browser (Chrome, Firefox, Safari)</li>
            </ol>
            <Button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-5 w-5" />
              Reload page
            </Button>
          </div>
          <Link to="/" className="text-sm text-neutral-500 hover:text-primary-600">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Authentication service is not configured. Please contact support.');
    }

    const { error: signInError, data } = await signIn(email, password);
    if (signInError) throw signInError;

    const userId = data?.user?.id;
    const [profileRes, rolesRes] = await Promise.all([
      supabase.from('profiles').select('role').eq('id', userId).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', userId),
    ]);

    if (profileRes.error) {
      console.error(`[${portalType}Login] Profile fetch error:`, profileRes.error);
    }
    if (rolesRes.error) {
      console.error(`[${portalType}Login] User roles fetch error:`, rolesRes.error);
    }

    const profileRole = profileRes.data?.role;
    const userRoles = (rolesRes.data ?? []).map((r) => r.role);

    // Super admin: profiles.role = 'superadmin' OR user_roles has 'super_admin'
    const isSuperAdmin =
      profileRole === 'superadmin' || userRoles.includes('super_admin');

    // Effective roles: profile role + user_roles (map super_admin -> admin for compatibility)
    const effectiveRoles = new Set<string>();
    if (profileRole) effectiveRoles.add(profileRole);
    userRoles.forEach((r) => {
      effectiveRoles.add(r);
      if (r === 'super_admin') effectiveRoles.add('admin');
    });

    if (isSuperAdmin) {
      navigate(redirectPath);
    } else if (allowedRoles.length > 0) {
      const hasAllowedRole = allowedRoles.some((r) => effectiveRoles.has(r));
      if (hasAllowedRole) {
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
      onForgotPassword={() => navigate('/forgot-password')}
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
