/**
 * Nav cache clearing utility.
 *
 * Extracted to its own module to break the circular dependency between
 * AdvisorContext (which calls clearNavCache on logout) and MainLayout
 * (which consumes AdvisorContext via useAdvisor).
 *
 * MainLayout registers its query-cache purge callback via `_clearQueryCache`,
 * and AdvisorContext calls `clearNavCache()` which invokes it.
 */

/** Registered by MainLayout to remove React Query nav cache */
export let _clearQueryCache: (() => void) | null = null;

export function setClearQueryCache(fn: (() => void) | null) {
  _clearQueryCache = fn;
}

/** Clear cached CMS navigation (called on logout so stale nav doesn't persist). */
export function clearNavCache() {
  _clearQueryCache?.();
}
