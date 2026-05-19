import { supabase, SUPABASE_AUTH_STORAGE_KEY } from '@mpbhealth/database';
import { clearNavCache } from './navCache';

/**
 * Supabase's auto-refresh doesn't fire SIGNED_OUT on a rejected refresh token —
 * it silently fails, leaving the app in a zombie state where every subsequent
 * request 401s but the UI thinks the user is signed in. This boot-time guard
 * patches `window.fetch` exactly once per page load and forces a clean redirect
 * to /login when the auth token endpoint returns 400 for `grant_type=refresh_token`.
 *
 * Why a module-scope install (not a React effect):
 *  - Under StrictMode / Vite HMR, effects can run twice. Patching `window.fetch`
 *    from an effect risks stacking wrappers or restoring a stale `origFetch`.
 *  - This guard must outlive any single React subtree; the AdvisorProvider may
 *    unmount/remount during navigation.
 *
 * Safe re-imports: a global symbol ensures we only patch once even if HMR
 * re-executes the boot graph.
 */
const INSTALLED_SYM = Symbol.for('mpb.advisorPortal.authRefreshGuard');

type Installed = typeof globalThis & { [INSTALLED_SYM]?: boolean };

export function installAuthRefreshGuard(): void {
  if (typeof window === 'undefined') return;
  const g = globalThis as Installed;
  if (g[INSTALLED_SYM]) return;
  g[INSTALLED_SYM] = true;

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
      if (
        response.status === 400 &&
        url.includes('/auth/v1/token') &&
        url.includes('grant_type=refresh_token')
      ) {
        console.warn('[Auth] Refresh token rejected (400) — redirecting to login');
        try {
          await supabase.auth.signOut({ scope: 'local' });
        } catch {
          /* ignore */
        }
        try {
          localStorage.removeItem(SUPABASE_AUTH_STORAGE_KEY);
          localStorage.removeItem('mpb-auth-token');
        } catch {
          /* storage unavailable */
        }
        clearNavCache();
        if (
          !window.location.pathname.startsWith('/login') &&
          !window.location.pathname.startsWith('/forgot-password') &&
          !window.location.pathname.startsWith('/reset-password')
        ) {
          window.location.href = '/login';
        }
      }
    } catch {
      // Never break the fetch pipeline because of the guard.
    }
    return response;
  };

  window.fetch = patched;
}
