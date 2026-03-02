import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AUTH_SAFE_REDIRECT_DESTINATIONS } from '@mpbhealth/config';

/**
 * Auth Confirmation Bridge Page — /auth/confirm
 *
 * This page sits between the email reset link and /reset-password.
 * It solves two critical problems:
 *
 * 1. EMAIL SCANNER TOKEN THEFT (primary fix)
 *    Enterprise email scanners (Microsoft Defender, Proofpoint, Mimecast, Barracuda,
 *    Gmail Safe Browsing) actively click links in emails. Supabase reset tokens are
 *    single-use, so the scanner consumes the token before the human clicks.
 *
 *    With the token_hash email template approach, the link goes directly to this page
 *    with ?token_hash=... in query params. Scanners fetch the HTML but don't execute
 *    JavaScript — so the token is never exchanged. Only real browsers running JS will
 *    call verifyOtp() and establish a session.
 *
 * 2. HASH FRAGMENT LOSS (secondary fix)
 *    If mpb.health redirects to www.mpb.health, the #access_token fragment is lost
 *    because fragments are never sent to the server. With token_hash in query params,
 *    the token survives any server-side redirect.
 *
 * Supports two flows:
 * - token_hash flow (preferred): /auth/confirm?token_hash=xxx&type=recovery
 * - Legacy hash flow (fallback): /auth/confirm#access_token=xxx&refresh_token=yyy
 */
const AuthConfirm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const getRecoveryDestination = async (): Promise<string> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return '/reset-password';

      const { data: roleRows } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const roles = (roleRows || []).map((r: { role: string }) => r.role);
      if (roles.includes('advisor')) return 'https://advisor.mpb.health/reset-password';
      if (roles.includes('super_admin') || roles.includes('admin')) return 'https://admin.mpb.health/reset-password';
      if (roles.includes('crm_user')) return 'https://crm.mpbhealth.com/reset-password';
      return '/reset-password';
    } catch {
      return '/reset-password';
    }
  };

  const routeToRecoveryDestination = async () => {
    const destination = await getRecoveryDestination();
    // Open-redirect guard: destination is always hardcoded in getRecoveryDestination(),
    // but we validate anyway so future changes can't accidentally introduce a dynamic
    // redirect from user-controlled input.
    if (destination.startsWith('http') && !AUTH_SAFE_REDIRECT_DESTINATIONS.has(destination)) {
      console.error('[AuthConfirm] Blocked unsafe redirect destination:', destination);
      navigate('/reset-password', { replace: true });
      return;
    }
    if (destination.startsWith('http')) {
      window.location.replace(destination);
      return;
    }
    navigate(destination, { replace: true });
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      navigate('/forgot-password', { replace: true });
      return;
    }

    let cancelled = false;

    const confirmAuth = async () => {
      // ── Flow 1: token_hash in query params (scanner-proof) ──
      // Email template uses: {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');

      if (tokenHash && type === 'recovery') {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery',
        });

        if (cancelled) return;

        if (error) {
          const msg = error.message.includes('expired')
            ? 'This password reset link has expired. Links are valid for about 1 hour and can only be used once. Please request a new one.'
            : 'This password reset link is invalid. Please request a new one.';
          navigate(`/forgot-password?error=${encodeURIComponent(msg)}`, { replace: true });
          return;
        }

        await routeToRecoveryDestination();
        return;
      }

      // ── Flow 2: Hash-based tokens (current Supabase default) ──
      // URL: /auth/confirm#access_token=...&refresh_token=...&type=recovery
      const hash = window.location.hash;
      if (hash) {
        const hashParams = new URLSearchParams(hash.substring(1));
        const hashError = hashParams.get('error');
        const errorDesc = hashParams.get('error_description');

        if (hashError) {
          const msg =
            errorDesc ||
            (hashError === 'access_denied' || hashError.includes('expired')
              ? 'This password reset link has expired. Please request a new one.'
              : 'This password reset link is invalid. Please request a new one.');
          if (!cancelled) navigate(`/forgot-password?error=${encodeURIComponent(msg)}`, { replace: true });
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
            navigate(`/forgot-password?error=${encodeURIComponent(error.message)}`, { replace: true });
            return;
          }

          await routeToRecoveryDestination();
          return;
        }
      }

      // ── Flow 3: detectSessionInUrl may have already processed the hash ──
      // The Supabase client auto-processes hash params on init. Wait briefly, then check.
      await new Promise((r) => setTimeout(r, 2000));

      if (cancelled) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await routeToRecoveryDestination();
          return;
        }
      } catch {
        // Fall through
      }

      // Nothing worked
      if (!cancelled) {
        navigate(
          '/forgot-password?error=' +
            encodeURIComponent('Invalid or expired reset link. Please request a new one.'),
          { replace: true },
        );
      }
    };

    confirmAuth();

    // Also listen for PASSWORD_RECOVERY event as a fallback
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        routeToRecoveryDestination();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-neutral-100 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-lg font-medium text-neutral-700">Verifying your secure link...</p>
        <p className="text-sm text-neutral-500 mt-2">Please wait a moment.</p>
      </div>
    </div>
  );
};

export default AuthConfirm;
