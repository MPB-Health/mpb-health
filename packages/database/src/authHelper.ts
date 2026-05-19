/**
 * Shared auth helper for edge function calls.
 *
 * WHY THIS EXISTS
 * ───────────────
 * Supabase refresh tokens are single-use. When multiple services (TicketService,
 * ChatService, …) each keep their own refreshOnce() singleton and fire concurrently,
 * they each call supabase.auth.refreshSession() independently. Only the first call
 * succeeds; the rest get "Invalid refresh token" (400). The losers then send the
 * expired access token to the edge function, which responds with 401.
 *
 * Solution: one app-wide refresh promise shared across every service.
 */

import { supabase } from './client';

type InvokeFunctionOptions = NonNullable<Parameters<typeof supabase.functions.invoke>[1]>;

/** Seconds before JWT expiry that we proactively force a synchronous refresh. */
const TOKEN_EXPIRY_BUFFER_SECONDS = 30;

type SessionResult = Awaited<ReturnType<typeof supabase.auth.getSession>>;
type RefreshResult = Awaited<ReturnType<typeof supabase.auth.refreshSession>>;

/** Single app-wide pending refresh — shared by all services. */
let _pendingRefresh: Promise<RefreshResult> | null = null;

/** Single app-wide pending getSession — coalesces concurrent reads (login bursts, multi-query mount). */
let _pendingSession: Promise<SessionResult> | null = null;

/** Last successful session read; reused within `SESSION_CACHE_TTL_MS` to avoid hammering storage / Web Locks. */
let _cachedSession: { value: SessionResult; at: number } | null = null;

/**
 * Hard caps — if the Supabase client never settles (network hang, service worker, proxy stall),
 * callers would await forever. That left advisor-portal stuck in `profileLoading` with no `finally`.
 */
const REFRESH_SESSION_DEADLINE_MS = 8_000;
const GET_SESSION_DEADLINE_MS = 8_000;

/** Reuse cached session within this window so repeat callers don't all hit auth storage. */
const SESSION_CACHE_TTL_MS = 1_500;

/** Bypass the in-memory cache when callers explicitly need the freshest value (post-login, post-refresh). */
export function invalidateCachedSession(): void {
  _cachedSession = null;
}

/**
 * Module-level latch: once auth refresh definitively fails (e.g. refresh token
 * rejected with 400) every concurrent caller should bail without making the
 * network noisier. The boot-time guard sets this immediately before redirecting
 * to /login; any pending TicketService/ChatService/warmup attempts then return
 * a clean SESSION_EXPIRED instead of firing more 401s.
 */
let _sessionDead = false;
const _sessionDeadListeners = new Set<() => void>();

export function isSessionDead(): boolean {
  return _sessionDead;
}

export function markSessionDead(reason?: string): void {
  if (_sessionDead) return;
  _sessionDead = true;
  _cachedSession = null;
  if (reason) console.warn('[auth] Session marked dead:', reason);
  for (const fn of _sessionDeadListeners) {
    try {
      fn();
    } catch {
      /* listener errors must not block redirect */
    }
  }
}

/** Used by app shell to react to a dead session (e.g. invalidate query observers). */
export function onSessionDead(listener: () => void): () => void {
  _sessionDeadListeners.add(listener);
  return () => _sessionDeadListeners.delete(listener);
}

/** Test/dev only — clears the latch (the app does not call this in production). */
export function resetSessionDeadForTesting(): void {
  _sessionDead = false;
}

/**
 * Refresh the Supabase session exactly once at a time. Concurrent callers all
 * await the same in-flight request rather than each consuming the refresh token.
 *
 * Latches `markSessionDead` when the refresh definitively fails (rejected promise
 * or `{ error }` resolution from Supabase). Callers can then short-circuit via
 * `isSessionDead()` instead of each owning their own retry/error-noise logic.
 */
export function refreshSessionOnce(): Promise<RefreshResult> {
  if (_sessionDead) {
    return Promise.reject(new Error('SESSION_DEAD'));
  }
  if (!_pendingRefresh) {
    _pendingRefresh = new Promise<RefreshResult>((resolve, reject) => {
      const t = globalThis.setTimeout(() => {
        reject(new Error('REFRESH_SESSION_TIMEOUT'));
      }, REFRESH_SESSION_DEADLINE_MS);
      void supabase.auth.refreshSession().then(
        (v) => {
          globalThis.clearTimeout(t);
          // Supabase resolves with `{ error }` (not a rejection) when the
          // refresh token is rejected. Treat that as a hard session death so
          // every other in-flight caller bails cleanly via `isSessionDead()`.
          if (v?.error) {
            markSessionDead(`refresh_returned_error:${v.error.message || 'unknown'}`);
          } else {
            // Bust cache so the next getCachedSession reflects the rotated token.
            _cachedSession = null;
          }
          resolve(v);
        },
        (e) => {
          globalThis.clearTimeout(t);
          // Don't latch on our own timeout — the network may still come back.
          const msg = e instanceof Error ? e.message : String(e);
          if (msg !== 'REFRESH_SESSION_TIMEOUT') {
            markSessionDead(`refresh_rejected:${msg}`);
          }
          reject(e);
        },
      );
    }).finally(() => {
      _pendingRefresh = null;
    });
  }
  return _pendingRefresh;
}

/**
 * Single-source `supabase.auth.getSession()` with:
 *   - short‑lived in‑memory cache so a burst of mount-time queries doesn't all hit auth storage
 *   - shared in-flight promise so concurrent callers coalesce
 *   - hard deadline so a hung auth call can't leave React stuck in `loading: true` forever
 *
 * Use this everywhere instead of `supabase.auth.getSession()` directly.
 */
export function getCachedSession(opts: { forceRefresh?: boolean } = {}): Promise<SessionResult> {
  // Hard stop after a dead-session signal so we don't keep hammering auth storage
  // while the boot guard is mid-redirect.
  if (_sessionDead) {
    return Promise.resolve({
      data: { session: null },
      error: null,
    } as unknown as SessionResult);
  }
  const now = Date.now();
  if (!opts.forceRefresh && _cachedSession && now - _cachedSession.at < SESSION_CACHE_TTL_MS) {
    return Promise.resolve(_cachedSession.value);
  }
  if (_pendingSession) return _pendingSession;

  _pendingSession = new Promise<SessionResult>((resolve, reject) => {
    const t = globalThis.setTimeout(() => {
      reject(new Error('GET_SESSION_TIMEOUT'));
    }, GET_SESSION_DEADLINE_MS);
    void supabase.auth.getSession().then(
      (v) => {
        globalThis.clearTimeout(t);
        _cachedSession = { value: v, at: Date.now() };
        resolve(v);
      },
      (e) => {
        globalThis.clearTimeout(t);
        reject(e);
      },
    );
  }).finally(() => {
    _pendingSession = null;
  });

  return _pendingSession;
}

/**
 * Returns a valid `{ Authorization: "Bearer <token>" }` header, proactively
 * refreshing the session when the access token is within TOKEN_EXPIRY_BUFFER_SECONDS
 * of expiry. Returns `null` when there is no session (not authenticated).
 */
export async function getResolvedAuthHeader(): Promise<{ Authorization: string } | null> {
  if (_sessionDead) return null;
  const { data: { session } } = await getCachedSession();
  if (!session?.access_token) return null;

  const nowSec = Math.floor(Date.now() / 1000);
  const needsRefresh =
    !session.expires_at || session.expires_at < nowSec + TOKEN_EXPIRY_BUFFER_SECONDS;

  if (needsRefresh) {
    try {
      const { data: refreshed, error } = await refreshSessionOnce();
      if (error || !refreshed?.session?.access_token) {
        // refreshSessionOnce already called markSessionDead on hard failures;
        // re-checking the latch keeps this call site responsive to that signal.
        return null;
      }
      return { Authorization: `Bearer ${refreshed.session.access_token}` };
    } catch {
      // Same as above — markSessionDead has fired if this was a real refresh
      // failure (not just our own REFRESH_SESSION_TIMEOUT, in which case the
      // caller can retry later).
      return null;
    }
  }

  return { Authorization: `Bearer ${session.access_token}` };
}

/**
 * Extract a human-readable message from a Supabase FunctionsHttpError.
 *
 * The Supabase client wraps non-2xx responses in a FunctionsHttpError whose
 * `.message` is a generic string. The raw Response is stored in `.context`
 * and must be read to get the edge function's actual JSON error body.
 */
async function extractEdgeFunctionError(error: unknown): Promise<string> {
  if (error && typeof error === 'object' && 'context' in error) {
    try {
      const res = (error as { context: Response }).context;
      if (res && typeof res.json === 'function') {
        const body = await res.json();
        if (body?.error && typeof body.error === 'string') return body.error;
        if (body?.message && typeof body.message === 'string') return body.message;
      }
    } catch { /* fall through to generic message */ }
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as { message: string }).message;
  }
  return 'An unexpected error occurred';
}

/**
 * Invoke a Supabase Edge Function with a freshly resolved bearer token.
 * Throws when the user is no longer authenticated so callers can surface a
 * clear re-login message instead of an opaque 401 from the function.
 *
 * When the edge function returns a non-2xx status the returned `error.message`
 * is the edge function's own error string rather than the generic Supabase SDK
 * message.
 */
export async function invokeWithResolvedAuth<TData = unknown>(
  functionName: string,
  options: InvokeFunctionOptions = {},
): Promise<{ data: TData | null; error: { message: string } | null }> {
  const authHeaders = await getResolvedAuthHeader();
  if (!authHeaders) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  const result = await supabase.functions.invoke<TData>(functionName, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      ...authHeaders,
    },
  });

  if (result.error) {
    const message = await extractEdgeFunctionError(result.error);
    return { data: null, error: { message } };
  }

  return result;
}
