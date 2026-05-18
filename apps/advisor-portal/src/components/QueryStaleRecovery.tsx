import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { nudgeAdvisorQueries } from '../query/nudgeAdvisorQueries';

/** Hidden shorter than this is ignored (focus flicker); longer triggers active-query recovery. */
const MIN_HIDDEN_MS_BEFORE_QUERY_RECOVERY = 450;

/** After returning from background / regaining network, nudge active queries so the UI doesn't stay stale. */
export function QueryStaleRecovery() {
  const queryClient = useQueryClient();
  const hiddenAtRef = useRef<number | null>(null);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now();
        return;
      }
      const hiddenAt = hiddenAtRef.current;
      hiddenAtRef.current = null;
      if (hiddenAt == null) return;
      if (Date.now() - hiddenAt < MIN_HIDDEN_MS_BEFORE_QUERY_RECOVERY) return;
      nudgeAdvisorQueries(queryClient, 'visibility');
    };

    const onOnline = () => {
      nudgeAdvisorQueries(queryClient, 'online');
    };

    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) nudgeAdvisorQueries(queryClient, 'bfcache');
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('online', onOnline);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [queryClient]);

  return null;
}
