import { supabase, SUPABASE_AUTH_STORAGE_KEY } from './client';
import { markSessionDead, onSessionDead } from './authHelper';

/**
 * Shared auth refresh guard — detects a dead Supabase refresh token at the
 * network level and redirects to the login page.
 *
 * Two layered triggers:
 *  1) `window.fetch` patch — detects the canonical signal (`/auth/v1/token`
 *     returns 400 for `grant_type=refresh_token`) even if no service code
 *     awaited the refresh, and calls `markSessionDead` exactly once.
 *  2) `onSessionDead` listener — single source of truth for the actual sign-out
 *     + storage-clear + redirect. Fires for ANY caller that latches the death
 *     (refreshSessionOnce, getResolvedAuthHeader, the fetch patch, …).
 *
 * Why module-scope install (not a React effect):
 *  - Under StrictMode / Vite HMR, effects can run twice. Patching `window.fetch`
 *    from an effect risks stacking wrappers or restoring a stale `origFetch`.
 *  - The listener must outlive any single React subtree.
 *
 * A global symbol ensures we only patch + subscribe once across HMR.
 */
const INSTALLED_SYM = Symbol.for('mpb.shared.authRefreshGuard');

type Installed = typeof globalThis & { [INSTALLED_SYM]?: boolean };

export interface AuthRefreshGuardOptions {
  /**
   * Login path to redirect to. Defaults to '/login'.
   */
  loginPath?: string;
  /**
   * Paths that should NOT trigger a redirect (already on login/auth pages).
   * Defaults to ['/login', '/forgot-password', '/reset-password'].
   */
  excludePaths?: string[];
  /**
   * Optional callback invoked just before the redirect. Use this for
   * app-specific cleanup (e.g. clearing React Query caches, nav caches).
   */
  onBeforeRedirect?: () => void;
}

/** Redirects exactly once even if multiple paths latch the death simultaneously. */
let _redirectingToLogin = false;

async function performLogoutRedirect(options: AuthRefreshGuardOptions): Promise<void> {
  if (_redirectingToLogin) return;
  _redirectingToLogin = true;

  const loginPath = options.loginPath ?? '/login';
  const excludePaths = options.excludePaths ?? ['/login', '/forgot-password', '/reset-password'];

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
    try {
      options.onBeforeRedirect?.();
    } catch {
      /* app cleanup errors must not block the redirect */
    }
    if (typeof window === 'undefined') return;
    const path = window.location.pathname;
    if (!excludePaths.some((ep) => path.startsWith(ep))) {
      window.location.href = loginPath;
    }
  } catch {
    /* never throw out of the listener */
  }
}

/**
 * Install the auth refresh guard. Call once at app boot (in `main.tsx`)
 * BEFORE React renders.
 *
 * @example
 * ```ts
 * // admin-portal/src/main.tsx
 * import { installAuthRefreshGuard } from '@mpbhealth/database';
 * installAuthRefreshGuard({ loginPath: '/login' });
 * ```
 */
export function installAuthRefreshGuard(options: AuthRefreshGuardOptions = {}): void {
  if (typeof window === 'undefined') return;
  const g = globalThis as Installed;
  if (g[INSTALLED_SYM]) return;
  g[INSTALLED_SYM] = true;

  // Single redirect-to-login path. Any caller that latches the death
  // (refreshSessionOnce, getResolvedAuthHeader, the fetch patch below, …)
  // just calls markSessionDead — this listener does the rest.
  onSessionDead(() => {
    void performLogoutRedirect(options);
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
