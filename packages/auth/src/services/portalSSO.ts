/**
 * portalSSO - Client-side cross-portal session transfer
 *
 * Instead of generating a server-side magic link (via the portal-sso edge
 * function), this utility reads the current Supabase session and constructs
 * a URL with the access & refresh tokens in the URL hash fragment.
 *
 * The target portal's Supabase client has `detectSessionInUrl: true`, so it
 * will automatically pick up the tokens from the URL hash and establish a
 * session — no extra server roundtrip, no dependency on Supabase's redirect
 * URL allowlist.
 *
 * Security notes:
 *  - Tokens are placed in the URL **fragment** (hash), which is never sent to
 *    the server in HTTP requests.
 *  - The Supabase SDK clears the hash from the URL immediately after consuming
 *    the tokens.
 *  - Tokens are short-lived (the SDK auto-refreshes using the refresh_token).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Build a URL to navigate to another portal with the current user's session
 * embedded in the URL hash fragment.
 *
 * @param targetUrl - The base URL of the target portal (e.g. from `getPortalUrl('crm')`)
 * @param supabase  - The Supabase client instance (to read the current session)
 * @returns The full URL with session tokens in the hash, or `null` if no
 *          active session exists.
 *
 * @example
 * ```ts
 * import { getPortalUrl } from '@mpbhealth/config';
 * const url = await buildPortalSSOUrl(getPortalUrl('crm'), supabase);
 * if (url) window.location.href = url;
 * ```
 */
export async function buildPortalSSOUrl(
  targetUrl: string,
  supabase: SupabaseClient,
): Promise<string | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      console.warn('[portalSSO] No active session to transfer:', error?.message);
      return null;
    }

    const { access_token, refresh_token, expires_in, token_type } = session;

    if (!access_token || !refresh_token) {
      console.warn('[portalSSO] Session missing tokens');
      return null;
    }

    // Build the hash fragment in the format Supabase JS SDK expects
    // (same format as OAuth / magic-link callbacks)
    const hashParams = new URLSearchParams({
      access_token,
      refresh_token,
      expires_in: String(expires_in ?? 3600),
      token_type: token_type ?? 'bearer',
      type: 'magiclink',
    });

    return `${targetUrl}#${hashParams.toString()}`;
  } catch (err) {
    console.error('[portalSSO] Failed to build SSO URL:', err);
    return null;
  }
}
