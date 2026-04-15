// LinkedIn OAuth redirect target: exchanges code for tokens, encrypts with encrypt_token RPC,
// upserts crm_social_platform_connections (service role), then redirects back to the CRM UI.
// Deploy: supabase functions deploy social-linkedin-oauth-callback
//
// Secrets:
//   LINKEDIN_OAUTH_CLIENT_ID, LINKEDIN_OAUTH_CLIENT_SECRET, LINKEDIN_OAUTH_REDIRECT_URI
//   MAIL_TOKEN_ENCRYPTION_KEY (same as mail-oauth-callback)
//   LINKEDIN_OAUTH_STATE_SECRET (optional; fallback MAIL_TOKEN_ENCRYPTION_KEY)
//   SOCIAL_LINKEDIN_FRONTEND_REDIRECT — full URL to Social hub, e.g. https://crm.mpb.health/social-media
//     or http://localhost:5173/social-media

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
  token_type?: string;
}

interface UserInfo {
  sub?: string;
  name?: string;
  email?: string;
  picture?: string;
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}

function stateSecret(): string {
  return (
    Deno.env.get('LINKEDIN_OAUTH_STATE_SECRET')?.trim() ||
    Deno.env.get('MAIL_TOKEN_ENCRYPTION_KEY')?.trim() ||
    ''
  );
}

async function verifyState(
  encoded: string,
  secret: string,
): Promise<{ org_id: string; user_id: string } | null> {
  let outer: { inner: string; mac: string };
  try {
    outer = JSON.parse(atob(encoded));
  } catch {
    return null;
  }
  if (typeof outer.inner !== 'string' || typeof outer.mac !== 'string') return null;
  const mac = await hmacSha256Hex(secret, outer.inner);
  if (!timingSafeEqualHex(mac, outer.mac)) return null;
  let payload: { org_id?: string; user_id?: string; exp?: number };
  try {
    payload = JSON.parse(outer.inner);
  } catch {
    return null;
  }
  if (!payload.org_id || !payload.user_id || typeof payload.exp !== 'number') return null;
  if (payload.exp < Date.now()) return null;
  return { org_id: payload.org_id, user_id: payload.user_id };
}

function frontendRedirect(params: Record<string, string>): Response {
  const raw =
    Deno.env.get('SOCIAL_LINKEDIN_FRONTEND_REDIRECT')?.trim() ||
    'http://localhost:5173/social-media';
  const u = new URL(raw.includes('://') ? raw : `https://${raw}`);
  u.searchParams.set('tab', 'connections');
  for (const [k, v] of Object.entries(params)) {
    if (v) u.searchParams.set(k, v);
  }
  return Response.redirect(u.toString(), 302);
}

serve(async (req) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const liError = url.searchParams.get('error');
    const liDesc = url.searchParams.get('error_description') || liError || 'access_denied';

    if (liError) {
      return frontendRedirect({ linkedin: 'error', linkedin_error: liDesc.slice(0, 200) });
    }

    const code = url.searchParams.get('code');
    const stateEnc = url.searchParams.get('state');
    if (!code || !stateEnc) {
      return frontendRedirect({ linkedin: 'error', linkedin_error: 'missing_code_or_state' });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const CLIENT_ID = Deno.env.get('LINKEDIN_OAUTH_CLIENT_ID')?.trim() || '';
    const CLIENT_SECRET = Deno.env.get('LINKEDIN_OAUTH_CLIENT_SECRET')?.trim() || '';
    const REDIRECT_URI = Deno.env.get('LINKEDIN_OAUTH_REDIRECT_URI')?.trim() || '';
    const TOKEN_KEY = Deno.env.get('MAIL_TOKEN_ENCRYPTION_KEY')?.trim() || '';
    const secret = stateSecret();

    if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI || !TOKEN_KEY || !secret) {
      console.error('social-linkedin-oauth-callback: missing env configuration');
      return frontendRedirect({ linkedin: 'error', linkedin_error: 'server_misconfigured' });
    }

    const st = await verifyState(stateEnc, secret);
    if (!st) {
      return frontendRedirect({ linkedin: 'error', linkedin_error: 'invalid_or_expired_state' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: mem } = await supabase
      .from('org_memberships')
      .select('org_id')
      .eq('org_id', st.org_id)
      .eq('user_id', st.user_id)
      .maybeSingle();

    if (!mem) {
      return frontendRedirect({ linkedin: 'error', linkedin_error: 'forbidden' });
    }

    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenRes.ok) {
      const t = await tokenRes.text();
      console.error('LinkedIn token exchange failed:', tokenRes.status, t);
      return frontendRedirect({ linkedin: 'error', linkedin_error: 'token_exchange_failed' });
    }

    const tokens = (await tokenRes.json()) as TokenResponse;
    if (!tokens.access_token) {
      return frontendRedirect({ linkedin: 'error', linkedin_error: 'no_access_token' });
    }

    let profile: UserInfo = {};
    try {
      const ui = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (ui.ok) profile = (await ui.json()) as UserInfo;
    } catch (e) {
      console.warn('LinkedIn userinfo fetch failed:', e);
    }

    const displayName = profile.name || profile.email || null;
    const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString();

    const { data: encAccess, error: encAerr } = await supabase.rpc('encrypt_token', {
      token: tokens.access_token,
      key: TOKEN_KEY,
    });
    if (encAerr || encAccess == null) {
      console.error('encrypt_token access:', encAerr);
      return frontendRedirect({ linkedin: 'error', linkedin_error: 'encrypt_failed' });
    }

    let encRefresh: unknown = null;
    if (tokens.refresh_token) {
      const { data: er, error: encRerr } = await supabase.rpc('encrypt_token', {
        token: tokens.refresh_token,
        key: TOKEN_KEY,
      });
      if (!encRerr) encRefresh = er;
      else console.warn('encrypt_token refresh:', encRerr);
    }

    const { data: existing } = await supabase
      .from('crm_social_platform_connections')
      .select('metadata, refresh_token_encrypted')
      .eq('org_id', st.org_id)
      .eq('provider', 'linkedin')
      .maybeSingle();

    const prevMeta = (existing?.metadata && typeof existing.metadata === 'object'
      ? existing.metadata
      : {}) as Record<string, unknown>;

    const metadata: Record<string, unknown> = {
      ...prevMeta,
      linkedin_member_sub: profile.sub ?? null,
      linkedin_profile_picture: profile.picture ?? null,
    };

    const refreshOut =
      encRefresh != null ? encRefresh : (existing?.refresh_token_encrypted ?? null);

    const row = {
      org_id: st.org_id,
      provider: 'linkedin' as const,
      connection_status: 'connected' as const,
      display_name: displayName,
      metadata,
      sync_error: null as string | null,
      last_synced_at: new Date().toISOString(),
      connected_by: st.user_id,
      access_token_encrypted: encAccess,
      refresh_token_encrypted: refreshOut,
      token_expires_at: expiresAt,
      oauth_scope: tokens.scope || null,
    };

    const { error: upErr } = await supabase.from('crm_social_platform_connections').upsert(row, {
      onConflict: 'org_id,provider',
    });

    if (upErr) {
      console.error('crm_social_platform_connections upsert:', upErr);
      return frontendRedirect({ linkedin: 'error', linkedin_error: 'db_write_failed' });
    }

    return frontendRedirect({ linkedin: 'connected' });
  } catch (e) {
    console.error('social-linkedin-oauth-callback:', e);
    return frontendRedirect({ linkedin: 'error', linkedin_error: 'internal_error' });
  }
});
