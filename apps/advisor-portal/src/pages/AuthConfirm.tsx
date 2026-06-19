import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdvisorNavigate } from '../hooks/useAdvisorNavigate';
import { supabase, isSupabaseConfigured } from '@mpbhealth/database';
import { AuthPageSeo } from '../components/AuthPageSeo';

const IMPERSONATION_FLAG_KEY = 'mpb_advisor_impersonation';

export function setAdvisorImpersonationFlag(active: boolean) {
  try {
    if (active) {
      sessionStorage.setItem(IMPERSONATION_FLAG_KEY, '1');
    } else {
      sessionStorage.removeItem(IMPERSONATION_FLAG_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export function isAdvisorImpersonationSession(): boolean {
  try {
    return sessionStorage.getItem(IMPERSONATION_FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Exchanges Supabase magic-link / recovery tokens for an advisor portal session.
 * Used by admin impersonation and email auth links.
 */
export default function AuthConfirm() {
  const navigate = useAdvisorNavigate();
  const [searchParams] = useSearchParams();
  const isImpersonation = searchParams.get('impersonation') === '1';

  useEffect(() => {
    if (!isSupabaseConfigured) {
      navigate('/login', { replace: true });
      return;
    }

    let cancelled = false;

    const finish = () => {
      if (isImpersonation) {
        setAdvisorImpersonationFlag(true);
      }
      navigate('/', { replace: true });
    };

    const fail = (message: string) => {
      navigate(`/login?error=${encodeURIComponent(message)}`, { replace: true });
    };

    const confirmAuth = async () => {
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      const email = searchParams.get('email');
      const otpToken = searchParams.get('token');

      if (tokenHash && (type === 'magiclink' || type === 'email')) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'magiclink',
        });
        if (cancelled) return;
        if (error) {
          fail(
            error.message.includes('expired')
              ? 'This sign-in link has expired. Request a new one from Admin Portal.'
              : 'This sign-in link is invalid. Request a new one from Admin Portal.',
          );
          return;
        }
        finish();
        return;
      }

      if (email && otpToken && (type === 'magiclink' || type === 'email')) {
        const { error } = await supabase.auth.verifyOtp({
          email,
          token: otpToken,
          type: 'magiclink',
        });
        if (cancelled) return;
        if (error) {
          fail(
            error.message.includes('expired')
              ? 'This sign-in link has expired. Request a new one from Admin Portal.'
              : 'This sign-in link is invalid. Request a new one from Admin Portal.',
          );
          return;
        }
        finish();
        return;
      }

      const hash = window.location.hash;
      if (hash) {
        const hashParams = new URLSearchParams(hash.substring(1));
        const hashError = hashParams.get('error');
        const errorDesc = hashParams.get('error_description');

        if (hashError) {
          if (!cancelled) {
            fail(
              errorDesc ||
                (hashError.includes('expired')
                  ? 'This sign-in link has expired. Request a new one from Admin Portal.'
                  : 'This sign-in link is invalid.'),
            );
          }
          return;
        }

        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (cancelled) return;
          if (error) {
            fail(error.message);
            return;
          }
          finish();
          return;
        }
      }

      await new Promise((r) => setTimeout(r, 1500));
      if (cancelled) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        finish();
        return;
      }

      if (!cancelled) {
        fail('Invalid or expired sign-in link. Request a new one from Admin Portal.');
      }
    };

    confirmAuth();

    return () => {
      cancelled = true;
    };
  }, [navigate, searchParams, isImpersonation]);

  return (
    <>
      <AuthPageSeo
        title="Signing In | MPB Health Advisor Portal"
        description="Completing secure sign-in to the MPB Health Advisor Portal."
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-lg font-medium text-slate-700">Signing you in…</p>
          <p className="text-sm text-slate-500 mt-2">Please wait a moment.</p>
        </div>
      </div>
    </>
  );
}
