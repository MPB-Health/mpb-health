/**
 * Enterprise defaults for TanStack Query usage in the advisor portal.
 * Keeps refetch / stale behavior predictable across pages (see `getAdvisorQueryClient`).
 */

/** Match global QueryClient default — prefer omitting `staleTime` on queries to inherit this. */
export const ADVISOR_STALE_TIME_MS = 2 * 60 * 1000;

export const ADVISOR_GC_TIME_MS = 5 * 60 * 1000;

/**
 * Polling interval for “live” views (ticket thread, etc.).
 * Only runs when the tab/window is in the foreground (`refetchIntervalInBackground: false`).
 */
export const ADVISOR_LIVE_POLL_INTERVAL_MS = 60_000;

/** Shorter stale window so foreground refetches feel fresh while polling. */
export const ADVISOR_LIVE_STALE_TIME_MS = 15_000;

/**
 * Merge into `useQuery` / `useInfiniteQuery` for ticket detail–style pages that should
 * stay reasonably up to date without hammering the API in background tabs.
 */
export function advisorLiveDetailQueryOptions() {
  return {
    staleTime: ADVISOR_LIVE_STALE_TIME_MS,
    refetchInterval: ADVISOR_LIVE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
  } as const;
}
