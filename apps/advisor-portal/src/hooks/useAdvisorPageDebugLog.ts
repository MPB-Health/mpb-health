import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAdvisor } from '../contexts/AdvisorContext';

const PAGE_DEBUG_LS_KEY = 'advisor-portal:page-debug';

function isAdvisorPageDebugEnabled(): boolean {
  if (!import.meta.env.DEV) return false;
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(PAGE_DEBUG_LS_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Log a one-line perf snapshot per page mount when `advisor-portal:page-debug`
 * is set. Captures: queries cached / fetching, focus state, auth gate state.
 * Enable with `localStorage.setItem('advisor-portal:page-debug', '1')`.
 *
 * Filter DevTools with: AdvisorPerf
 */
export function useAdvisorPerfSnapshot(pageLabel: string) {
  const queryClient = useQueryClient();
  const { loading, hasSession, profile, profileLoading, error } = useAdvisor();

  useEffect(() => {
    if (!isAdvisorPageDebugEnabled()) return;
    const cache = queryClient.getQueryCache();
    const all = cache.getAll();
    const fetching = all.filter((q) => q.state.fetchStatus === 'fetching').length;
    const errored = all.filter((q) => q.state.status === 'error').length;
    console.debug('[AdvisorPerf]', pageLabel, {
      authLoading: loading,
      profileLoading,
      hasSession,
      hasProfile: !!profile,
      authError: error ?? null,
      cachedQueries: all.length,
      fetchingQueries: fetching,
      erroredQueries: errored,
      online: typeof navigator !== 'undefined' ? navigator.onLine : undefined,
      visibility: typeof document !== 'undefined' ? document.visibilityState : undefined,
    });
    // Snapshot on mount only — pages re-mount or remount via route change, which is the right granularity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageLabel]);
}

/**
 * Opt-in page diagnostics (mount timing + route changes). Keeps the dev console quiet by default.
 *
 * Enable: `localStorage.setItem('advisor-portal:page-debug', '1')` then reload.
 * Disable: remove the key or set to anything other than `'1'`.
 *
 * Filter DevTools with: AdvisorPortal:Page
 *
 * Enter/leave are real mount/unmount only (URL query sync does not retrigger the mount effect).
 * In development, paired enter→leave with ~0–50ms often means React StrictMode; many pairs while
 * editing usually means Vite HMR remounting the tree.
 */
export function useAdvisorPageDebugLog(pageLabel: string) {
  const location = useLocation();
  const visitRef = useRef(0);

  useEffect(() => {
    if (!isAdvisorPageDebugEnabled()) return;

    visitRef.current += 1;
    const visit = visitRef.current;
    // Intentionally mount-scoped (deps: [pageLabel]): URL query churn must not look like remounts.
    const path = `${location.pathname}${location.search || ''}`;
    const t0 = typeof performance !== 'undefined' ? performance.now() : 0;

    const enterPayload: Record<string, unknown> = {
      page: pageLabel,
      visit,
      path,
      visibility: typeof document !== 'undefined' ? document.visibilityState : undefined,
      online: typeof navigator !== 'undefined' ? navigator.onLine : undefined,
      perfNowMs: typeof performance !== 'undefined' ? Math.round(performance.now()) : undefined,
      wallTs: new Date().toISOString(),
    };
    enterPayload.hint =
      'If you see leave ~0–100ms after enter, that is usually React StrictMode (dev), not a slow page.';
    console.debug('[AdvisorPortal:Page]', 'enter', enterPayload);

    return () => {
      const mountedMs =
        typeof performance !== 'undefined' ? Math.round(performance.now() - t0) : undefined;
      const leavePayload: Record<string, unknown> = {
        page: pageLabel,
        visit,
        path,
        mountedMs,
        perfNowMs: typeof performance !== 'undefined' ? Math.round(performance.now()) : undefined,
        wallTs: new Date().toISOString(),
      };
      if (mountedMs !== undefined && mountedMs < 120) {
        leavePayload.note = 'Short mount — typically React 18 StrictMode double-mount in development';
      }
      console.debug('[AdvisorPortal:Page]', 'leave', leavePayload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount/unmount only; route moves log separately below
  }, [pageLabel]);

  useEffect(() => {
    if (!isAdvisorPageDebugEnabled()) return;
    const path = `${location.pathname}${location.search || ''}`;
    console.debug('[AdvisorPortal:Page]', 'route', { page: pageLabel, path });
  }, [pageLabel, location.pathname, location.search]);
}
