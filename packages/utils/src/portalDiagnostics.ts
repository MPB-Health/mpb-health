/**
 * Cross-portal diagnostic hooks for Phase 3+ verification and future APM wiring.
 * Dispatches a browser CustomEvent so Playwright / devtools / App Insights adapters can subscribe.
 * Safe no-op on server / non-browser.
 */

export type PortalDiagnosticKind =
  | 'permission_load'
  | 'crm_query_fetch_start'
  | 'crm_query_refetch_storm'
  | 'modal_open';

export interface PortalDiagnosticPayload {
  kind: PortalDiagnosticKind;
  /** e.g. crm | admin | advisor */
  app?: string;
  durationMs?: number;
  success?: boolean;
  /** RPC vs postgrest fallback, storm details, modal title, etc. */
  detail?: string;
  queryKey?: readonly unknown[];
}

const EVENT_NAME = 'mpb:portal-diag';

/** Tunable thresholds (document in verification reports; align with OrgContext timeouts). */
export const PORTAL_DIAG_THRESHOLDS = {
  slowPermissionMs: 4000,
  slowModalOpenMs: 600,
  /** Sliding window for counting rapid refetches of the same key */
  queryStormWindowMs: 1500,
  queryStormMinFetches: 4,
} as const;

function isDevLike(): boolean {
  const proc = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process;
  return proc?.env?.NODE_ENV === 'development';
}

/**
 * Emit a diagnostic event. In development, logs slow permission loads and refetch storms to console.
 */
export function emitPortalDiagnostic(payload: PortalDiagnosticPayload): void {
  if (typeof window === 'undefined') return;

  try {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: payload }));
  } catch {
    /* ignore */
  }

  if (!isDevLike()) return;

  if (payload.kind === 'permission_load' && payload.durationMs != null) {
    if (payload.durationMs >= PORTAL_DIAG_THRESHOLDS.slowPermissionMs) {
      console.warn(
        `[mpb:diag] Slow permission load: ${Math.round(payload.durationMs)}ms`,
        payload.detail ?? ''
      );
    }
  }

  if (payload.kind === 'modal_open' && payload.durationMs != null) {
    if (payload.durationMs >= PORTAL_DIAG_THRESHOLDS.slowModalOpenMs) {
      console.warn(`[mpb:diag] Slow modal open: ${Math.round(payload.durationMs)}ms`, payload.detail ?? '');
    }
  }

  if (payload.kind === 'crm_query_refetch_storm') {
    console.warn('[mpb:diag] CRM query refetch storm (dev)', payload.detail, payload.queryKey);
  }
}

export function subscribePortalDiagnostics(
  handler: (payload: PortalDiagnosticPayload) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  const listener = (ev: Event) => {
    const ce = ev as CustomEvent<PortalDiagnosticPayload>;
    if (ce.detail) handler(ce.detail);
  };
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
