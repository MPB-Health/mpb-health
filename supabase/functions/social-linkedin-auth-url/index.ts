// Returns LinkedIn OAuth authorize URL for the active org (JWT required).
// Deploy: supabase functions deploy social-linkedin-auth-url
//
// Secrets (Supabase Edge):
//   LINKEDIN_OAUTH_CLIENT_ID
//   LINKEDIN_OAUTH_REDIRECT_URI  → must match LinkedIn app + social-linkedin-oauth-callback URL
//   LINKEDIN_OAUTH_STATE_SECRET  → optional; falls back to MAIL_TOKEN_ENCRYPTION_KEY
//   LINKEDIN_OAUTH_SCOPES        → optional; default "openid profile email"

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { requireAuth, checkRateLimit, getClientIdentifier } from '../_shared/security.ts';

const STATE_TTL_MS = 10 * 60 * 1000;

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

function packState(innerJson: string, mac: string): string {
  return btoa(JSON.stringify({ inner: innerJson, mac }));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const CLIENT_ID = Deno.env.get('LINKEDIN_OAUTH_CLIENT_ID')?.trim() || '';
    const REDIRECT_URI = Deno.env.get('LINKEDIN_OAUTH_REDIRECT_URI')?.trim() || '';
    const SCOPES =
      Deno.env.get('LINKEDIN_OAUTH_SCOPES')?.trim() ||
      'openid profile email';

    const secret = stateSecret();
    if (!secret || !CLIENT_ID || !REDIRECT_URI) {
      console.error('social-linkedin-auth-url: missing LINKEDIN_OAUTH_CLIENT_ID, REDIRECT_URI, or state secret');
      return new Response(JSON.stringify({ error: 'LinkedIn OAuth is not configured on the server' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const clientIp = getClientIdentifier(req);
    const rl = checkRateLimit(clientIp, { maxRequests: 20, windowSeconds: 60, keyPrefix: 'social-li-auth' });
    if (rl) return rl;

    const { user: authUser, errorResponse } = await requireAuth(req, supabase);
    if (errorResponse || !authUser.userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let body: { org_id?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const orgId = body.org_id?.trim();
    if (!orgId) {
      return new Response(JSON.stringify({ error: 'org_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: mem, error: memErr } = await supabase
      .from('org_memberships')
      .select('org_id')
      .eq('org_id', orgId)
      .eq('user_id', authUser.userId)
      .maybeSingle();

    if (memErr || !mem) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const exp = Date.now() + STATE_TTL_MS;
    const inner = JSON.stringify({ org_id: orgId, user_id: authUser.userId, exp });
    const mac = await hmacSha256Hex(secret, inner);
    const state = packState(inner, mac);

    const url =
      'https://www.linkedin.com/oauth/v2/authorization?' +
      `response_type=code` +
      `&client_id=${encodeURIComponent(CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&scope=${encodeURIComponent(SCOPES)}` +
      `&state=${encodeURIComponent(state)}`;

    return new Response(JSON.stringify({ url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('social-linkedin-auth-url:', e);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
