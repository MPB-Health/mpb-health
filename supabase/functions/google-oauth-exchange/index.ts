// Supabase Edge Function: google-oauth-exchange
// Handles OAuth 2.0 token exchange and refresh for Google Search Console.
// The GOOGLE_CLIENT_SECRET stays server-side — it is never sent to the browser.
//
// Deploy: supabase functions deploy google-oauth-exchange
// Secrets required (set via `supabase secrets set ...`):
//   GOOGLE_CLIENT_SECRET
//   GOOGLE_CLIENT_ID (can also be public, but kept here for simplicity)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';
import { checkRateLimit, getClientIdentifier, requireAuth } from '../_shared/security.ts';

const log = createLogger('google-oauth-exchange');

type ExchangeRequest =
  | { action: 'exchange_code'; code: string; redirect_uri: string }
  | { action: 'refresh_token'; refresh_token: string };

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      log.error('Google OAuth credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Google OAuth not configured' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      log.error('Supabase configuration missing');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Rate limit: 20 requests per minute per IP (admin-only but still bounded)
    const clientIp = getClientIdentifier(req);
    const rateLimitResponse = checkRateLimit(clientIp, {
      maxRequests: 20,
      windowSeconds: 60,
      keyPrefix: 'google-oauth-exchange',
    });
    if (rateLimitResponse) return rateLimitResponse;

    // Require authentication — this endpoint is admin-only
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { errorResponse } = await requireAuth(req, supabaseAuth);
    if (errorResponse) {
      return new Response(errorResponse.body, {
        status: errorResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: ExchangeRequest = await req.json();

    if (body.action === 'exchange_code') {
      // Exchange authorization code for access + refresh tokens
      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code: body.code,
        grant_type: 'authorization_code',
        redirect_uri: body.redirect_uri,
      });

      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
      });

      const data = await res.json();
      if (!res.ok) {
        log.error('Google token exchange failed', data);
        return new Response(
          JSON.stringify({ error: data.error_description || 'Token exchange failed' }),
          { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      log.info('Google OAuth code exchanged successfully');
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (body.action === 'refresh_token') {
      // Refresh an existing access token
      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: body.refresh_token,
        grant_type: 'refresh_token',
      });

      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
      });

      const data = await res.json();
      if (!res.ok) {
        log.error('Google token refresh failed', data);
        return new Response(
          JSON.stringify({ error: data.error_description || 'Token refresh failed' }),
          { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      log.info('Google access token refreshed successfully');
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use exchange_code or refresh_token.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    log.error('Unexpected error', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
