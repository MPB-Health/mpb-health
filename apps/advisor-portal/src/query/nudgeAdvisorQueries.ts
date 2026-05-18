import { focusManager } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';

/**
 * Wake TanStack Query after idle, tab background, or route changes.
 * Fixes observers stuck in pending/fetching until a full reload when focus/online events don't fire.
 */
export function nudgeAdvisorQueries(queryClient: QueryClient, reason?: string) {
  try {
    if (typeof document !== 'undefined') {
      focusManager.setFocused(document.visibilityState === 'visible');
    } else {
      focusManager.setFocused(true);
    }
  } catch {
    /* ignore */
  }
  try {
    queryClient.resumePausedMutations();
  } catch {
    /* ignore */
  }
  // Refetch active observers only — avoids marking entire cache stale on route/tab wake.
  try {
    void queryClient.refetchQueries({ type: 'active' });
  } catch (e) {
    console.warn('[advisor-portal] refetchQueries(active) failed', reason ?? '', e);
  }
}
