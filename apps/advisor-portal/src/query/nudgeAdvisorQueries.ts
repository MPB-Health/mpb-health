import { focusManager } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';

/**
 * Wake TanStack Query after idle, tab background, bfcache, or online.
 *
 * Strategy: nudge `focusManager` and resume paused mutations. Do NOT call
 * `refetchQueries({ type: 'active' })` — that creates a refetch storm on every
 * focus event. With `refetchOnWindowFocus: true` + `staleTime`, TanStack
 * already refetches only the queries that are actually stale, which is what we want.
 *
 * Callers that genuinely need an immediate forced refetch (e.g. user-pressed “Refresh”)
 * should call `queryClient.invalidateQueries(...)` themselves, not this helper.
 */
export function nudgeAdvisorQueries(queryClient: QueryClient, reason?: string) {
  try {
    if (typeof document !== 'undefined') {
      focusManager.setFocused(document.visibilityState === 'visible');
    } else {
      focusManager.setFocused(true);
    }
  } catch (e) {
    console.warn('[advisor-portal] focusManager.setFocused failed', reason ?? '', e);
  }
  try {
    void queryClient.resumePausedMutations();
  } catch (e) {
    console.warn('[advisor-portal] resumePausedMutations failed', reason ?? '', e);
  }
}
