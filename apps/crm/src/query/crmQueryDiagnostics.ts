/**
 * DEV-only TanStack Query cache instrumentation: detect rapid refetch of the same key (storm heuristic).
 */
import type { QueryClient } from '@tanstack/react-query';
import { emitPortalDiagnostic, PORTAL_DIAG_THRESHOLDS } from '@mpbhealth/utils';

const fetchStartsByKey = new Map<string, number[]>();
const stormLogged = new Set<string>();

function prune(ts: number[], now: number): number[] {
  return ts.filter((t) => now - t < PORTAL_DIAG_THRESHOLDS.queryStormWindowMs);
}

export function attachCRMQueryDiagnostics(queryClient: QueryClient, enabled: boolean): void {
  if (!enabled) return;

  const lastFetchStatus = new Map<string, string>();

  queryClient.getQueryCache().subscribe((event) => {
    if (event.type !== 'updated') return;
    const q = event.query;
    const keyStr = JSON.stringify(q.queryKey);
    const prev = lastFetchStatus.get(keyStr);
    const cur = q.state.fetchStatus;
    lastFetchStatus.set(keyStr, cur);

    if (prev === 'fetching' || cur !== 'fetching') return;

    const now = Date.now();
    const arr = prune(fetchStartsByKey.get(keyStr) ?? [], now);
    arr.push(now);
    fetchStartsByKey.set(keyStr, arr);

    if (arr.length >= PORTAL_DIAG_THRESHOLDS.queryStormMinFetches && !stormLogged.has(keyStr)) {
      stormLogged.add(keyStr);
      emitPortalDiagnostic({
        kind: 'crm_query_refetch_storm',
        app: 'crm',
        detail: keyStr,
        queryKey: q.queryKey,
      });
    }
  });
}
