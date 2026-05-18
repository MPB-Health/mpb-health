import { QueryClient } from '@tanstack/react-query';
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
 */
export function getAdvisorQueryClient(): QueryClient {
  const g = globalThis as typeof globalThis & { [CLIENT_SYM]?: QueryClient };
  if (!g[CLIENT_SYM]) {
    g[CLIENT_SYM] = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: ADVISOR_STALE_TIME_MS,
          gcTime: ADVISOR_GC_TIME_MS,
          retry: (failureCount, error) => {
            if (isAuthError(error)) return false;
            return failureCount < 3;
          },
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
          refetchOnWindowFocus: true,
          refetchOnReconnect: true,
          /** Avoid blank UI on remount after navigation (common enterprise expectation). */
          refetchOnMount: true,
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
  return g[CLIENT_SYM];
}
