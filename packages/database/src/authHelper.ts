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
 * Refresh the Supabase session exactly once at a time. Concurrent callers all
 * await the same in-flight request rather than each consuming the refresh token.
 */
export function refreshSessionOnce(): Promise<RefreshResult> {
  if (!_pendingRefresh) {
    _pendingRefresh = new Promise<RefreshResult>((resolve, reject) => {
      const t = globalThis.setTimeout(() => {
        reject(new Error('REFRESH_SESSION_TIMEOUT'));
      }, REFRESH_SESSION_DEADLINE_MS);
      void supabase.auth.refreshSession().then(
        (v) => {
          globalThis.clearTimeout(t);
          // Bust cache so the next getCachedSession reflects the rotated token.
          _cachedSession = null;
          resolve(v);
        },
        (e) => {
          globalThis.clearTimeout(t);
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
  const { data: { session } } = await getCachedSession();
  if (!session?.access_token) return null;

  const nowSec = Math.floor(Date.now() / 1000);
  const needsRefresh =
    !session.expires_at || session.expires_at < nowSec + TOKEN_EXPIRY_BUFFER_SECONDS;

  if (needsRefresh) {
    try {
      const { data: refreshed, error } = await refreshSessionOnce();
      if (error || !refreshed?.session?.access_token) return null;
      return { Authorization: `Bearer ${refreshed.session.access_token}` };
    } catch {
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
