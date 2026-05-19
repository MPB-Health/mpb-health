import {
  supabase,
  SUPABASE_AUTH_STORAGE_KEY,
  markSessionDead,
  onSessionDead,
} from '@mpbhealth/database';
import { clearNavCache } from './navCache';

/**
 * Boot-time guard that turns a dead Supabase session into a clean redirect.
 *
 * Two layered triggers:
 *  1) `window.fetch` patch — detects the canonical signal (`/auth/v1/token`
 *     returns 400 for `grant_type=refresh_token`) even if no service code
 *     awaited the refresh, and calls `markSessionDead` exactly once.
 *  2) `onSessionDead` listener — single source of truth for the actual sign-out
 *     + storage-clear + redirect. Fires for ANY caller that latches the death
 *     (refreshSessionOnce, getResolvedAuthHeader, the fetch patch, the
 *     AdvisorContext boot validator, …), so we don't duplicate redirect logic.
 *
 * Why module-scope install (not a React effect):
 *  - Under StrictMode / Vite HMR, effects can run twice. Patching `window.fetch`
 *    from an effect risks stacking wrappers or restoring a stale `origFetch`.
 *  - The listener must outlive any single React subtree; AdvisorProvider can
 *    unmount/remount during navigation.
 *
 * A global symbol ensures we only patch + subscribe once across HMR.
 */
const INSTALLED_SYM = Symbol.for('mpb.advisorPortal.authRefreshGuard');

type Installed = typeof globalThis & { [INSTALLED_SYM]?: boolean };

/** Redirects exactly once even if multiple paths latch the death simultaneously. */
let _redirectingToLogin = false;

async function performLogoutRedirect(): Promise<void> {
  if (_redirectingToLogin) return;
  _redirectingToLogin = true;
  try {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      /* Supabase signOut errors are non-fatal once we've decided to redirect */
    }
    try {
      localStorage.removeItem(SUPABASE_AUTH_STORAGE_KEY);
      localStorage.removeItem('mpb-auth-token');
    } catch {
      /* storage unavailable in some embedded contexts */
    }
    clearNavCache();
    if (typeof window === 'undefined') return;
    const path = window.location.pathname;
    if (
      !path.startsWith('/login') &&
      !path.startsWith('/forgot-password') &&
      !path.startsWith('/reset-password')
    ) {
      window.location.href = '/login';
    }
  } catch {
    /* never throw out of the listener */
  }
}

export function installAuthRefreshGuard(): void {
  if (typeof window === 'undefined') return;
  const g = globalThis as Installed;
  if (g[INSTALLED_SYM]) return;
  g[INSTALLED_SYM] = true;

  // Single redirect-to-login path. Any caller that latches the death (refresh
  // helper, getResolvedAuthHeader, AdvisorContext boot validator, the fetch
  // patch below) just calls markSessionDead — this listener does the rest.
  onSessionDead(() => {
    void performLogoutRedirect();
  });

  const origFetch = window.fetch;

  const patched: typeof fetch = async (input, init) => {
    const response = await origFetch(input, init);
    try {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      const isRefreshTokenReject =
        response.status === 400 &&
        url.includes('/auth/v1/token') &&
        url.includes('grant_type=refresh_token');
      if (isRefreshTokenReject) {
        // The listener above handles the redirect; just latch the signal.
        // markSessionDead is idempotent, so duplicate triggers from
        // refreshSessionOnce are harmless.
        markSessionDead('refresh_token_rejected');
      }
    } catch {
      // Never break the fetch pipeline because of the guard.
    }
    return response;
  };

  window.fetch = patched;
}
