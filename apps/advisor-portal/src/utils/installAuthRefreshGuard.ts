import { installAuthRefreshGuard } from '@mpbhealth/database';
import { clearNavCache } from './navCache';

/**
 * Boot-time guard that turns a dead Supabase session into a clean redirect.
 *
 * Delegates to the shared `installAuthRefreshGuard` from `@mpbhealth/database`,
 * which patches `window.fetch` to detect `/auth/v1/token` returning 400 for
 * `grant_type=refresh_token`, and fires a clean sign-out + redirect.
 *
 * The advisor-portal adds `clearNavCache` as app-specific cleanup before redirect.
 *
 * Why module-scope install (not a React effect):
 *  - Under StrictMode / Vite HMR, effects can run twice. Patching `window.fetch`
 *    from an effect risks stacking wrappers or restoring a stale `origFetch`.
 *  - The listener must outlive any single React subtree; AdvisorProvider can
 *    unmount/remount during navigation.
 */
export function installAdvisorAuthRefreshGuard(): void {
  installAuthRefreshGuard({
    loginPath: '/login',
    excludePaths: ['/login', '/forgot-password', '/reset-password'],
    onBeforeRedirect: () => {
      clearNavCache();
    },
  });
}
