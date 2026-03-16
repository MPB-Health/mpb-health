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

/** Seconds before JWT expiry that we proactively force a synchronous refresh. */
const TOKEN_EXPIRY_BUFFER_SECONDS = 30;

/** Single app-wide pending refresh — shared by all services. */
let _pendingRefresh: Promise<Awaited<ReturnType<typeof supabase.auth.refreshSession>>> | null = null;

/**
 * Refresh the Supabase session exactly once at a time. Concurrent callers all
 * await the same in-flight request rather than each consuming the refresh token.
 */
export function refreshSessionOnce() {
  if (!_pendingRefresh) {
    _pendingRefresh = supabase.auth.refreshSession().finally(() => {
      _pendingRefresh = null;
    });
  }
  return _pendingRefresh;
}

/**
 * Returns a valid `{ Authorization: "Bearer <token>" }` header, proactively
 * refreshing the session when the access token is within TOKEN_EXPIRY_BUFFER_SECONDS
 * of expiry. Returns `null` when there is no session (not authenticated).
 */
export async function getResolvedAuthHeader(): Promise<{ Authorization: string } | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return null;

  const nowSec = Math.floor(Date.now() / 1000);
  const needsRefresh =
    !session.expires_at || session.expires_at < nowSec + TOKEN_EXPIRY_BUFFER_SECONDS;

  if (needsRefresh) {
    const { data: refreshed, error } = await refreshSessionOnce();
    if (error || !refreshed?.session?.access_token) return null;
    return { Authorization: `Bearer ${refreshed.session.access_token}` };
  }

  return { Authorization: `Bearer ${session.access_token}` };
}
