import { QueryClient, QueryCache } from '@tanstack/react-query';
import { supabase, SUPABASE_AUTH_STORAGE_KEY } from '../lib/supabase';

function isAuthError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    const status = (error as { status?: number }).status
      ?? (error as { code?: number }).code;
    if (status === 401 || status === 403) return true;
    const msg = String((error as { message?: string }).message ?? '');
    if (/unauthorized|forbidden|jwt expired|invalid.*token/i.test(msg)) return true;
  }
  return false;
}

let signOutScheduled = false;

/**
 * When a query fails with 401/403, the session is dead. Clear it and
 * redirect to /login so the user isn't stuck on a broken dashboard.
 */
function handleGlobalAuthError() {
  if (signOutScheduled) return;
  signOutScheduled = true;

  console.warn('[CRM] Auth error detected — signing out');
  supabase.auth.signOut({ scope: 'local' }).catch(() => {});
  try {
    localStorage.removeItem(SUPABASE_AUTH_STORAGE_KEY);
    localStorage.removeItem('mpb-auth-token');
  } catch (_) { /* noop */ }

  setTimeout(() => {
    signOutScheduled = false;
    if (!window.location.pathname.startsWith('/login')) {
      window.location.replace('/login');
    }
  }, 100);
}

/** Shared defaults: align with Advisor portal — avoid refetch storms on focus. */
export const crmQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 45_000,
      gcTime: 5 * 60 * 1000,
      retry: (failureCount, error) => {
        if (isAuthError(error)) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: 'online',
      meta: { handleAuthError: true },
    },
    mutations: {
      retry: 0,
      networkMode: 'online',
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      if (isAuthError(error)) {
        handleGlobalAuthError();
      }
    },
  }),
});
