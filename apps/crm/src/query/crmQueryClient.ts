import { QueryClient } from '@tanstack/react-query';

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
    },
    mutations: {
      retry: 0,
      networkMode: 'online',
    },
  },
});
