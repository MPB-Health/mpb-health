import { QueryClient } from '@tanstack/react-query';
import { onSessionDead } from '@mpbhealth/database';
import {
  ADVISOR_GC_TIME_MS,
  ADVISOR_STALE_TIME_MS,
} from './advisorQueryPolicy';

const CLIENT_SYM = Symbol.for('mpb.advisorPortal.queryClient');

function isAuthError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    const status = (error as { status?: number }).status ?? (error as { code?: number }).code;
    if (status === 401 || status === 403) return true;
    const msg = String((error as { message?: string }).message ?? '');
    if (/unauthorized|forbidden|jwt expired|invalid.*token/i.test(msg)) return true;
  }
  return false;
}

/**
 * Single TanStack Query client for the advisor portal, stored on `globalThis`
 * so Vite HMR can re-run `main.tsx` without dropping in-flight requests,
 * invalidating cache, or attaching duplicate providers.
 *
 * Defaults are tuned to avoid the “refetch storm” we observed:
 *  - `refetchOnMount: false` — navigating back to a page uses cache unless stale.
 *    Pages that *must* be fresh on mount opt-in with `refetchOnMount: 'always'`.
 *  - `refetchOnWindowFocus: true` is left on, but the global `staleTime` of 2 minutes
 *    means most focus events are no-ops, not full refetches.
 *  - Retry cap reduced to 2 (3 total attempts) with shorter backoff so a failing call
 *    surfaces an error in ~5s instead of ~30s. Auth errors still skip retry.
 */
const SESSION_DEAD_HOOK_SYM = Symbol.for('mpb.advisorPortal.querySessionDeadHook');

export function getAdvisorQueryClient(): QueryClient {
  const g = globalThis as typeof globalThis & {
    [CLIENT_SYM]?: QueryClient;
    [SESSION_DEAD_HOOK_SYM]?: () => void;
  };
  if (!g[CLIENT_SYM]) {
    g[CLIENT_SYM] = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: ADVISOR_STALE_TIME_MS,
          gcTime: ADVISOR_GC_TIME_MS,
          retry: (failureCount, error) => {
            if (isAuthError(error)) return false;
            return failureCount < 2;
          },
          retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 4_000),
          refetchOnWindowFocus: true,
          refetchOnReconnect: true,
          /** Cache-first by default; opt-in with `refetchOnMount: 'always'` per query when needed. */
          refetchOnMount: false,
          /** Avoid queries staying paused after wake when `navigator.onLine` is flaky. */
          networkMode: 'always',
        },
        mutations: {
          retry: 0,
          networkMode: 'always',
        },
      },
    });
  }
  if (!g[SESSION_DEAD_HOOK_SYM]) {
    // When the auth refresh guard latches a dead session, cancel anything in-flight
    // and clear the cache so observers don't display half-loaded data with stale auth.
    const client = g[CLIENT_SYM]!;
    const unsubscribe = onSessionDead(() => {
      try {
        void client.cancelQueries();
        client.clear();
      } catch (e) {
        console.warn('[advisor-portal] queryClient cleanup on session dead failed', e);
      }
    });
    g[SESSION_DEAD_HOOK_SYM] = unsubscribe;
  }
  return g[CLIENT_SYM];
}
