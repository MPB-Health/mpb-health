// ============================================================================
// Mail OAuth Callback - Exchange auth codes for tokens (M365 + Gmail)
// Handles OAuth redirect callback and stores encrypted tokens
// Deploy: supabase functions deploy mail-oauth-callback
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { requireAuth, checkRateLimit, getClientIdentifier } from '../_shared/security.ts';

// ============================================================================
// Types
// ============================================================================

interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
  token_type: string;
  id_token?: string;
}

interface MicrosoftUserProfile {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
}

interface GmailUserProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

// ============================================================================
// Handler
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const TOKEN_ENCRYPTION_KEY = Deno.env.get('MAIL_TOKEN_ENCRYPTION_KEY')!;

    // Microsoft OAuth config
    const MS_CLIENT_ID = Deno.env.get('MS_OAUTH_CLIENT_ID') || '';
    const MS_CLIENT_SECRET = Deno.env.get('MS_OAUTH_CLIENT_SECRET') || '';
    const MS_REDIRECT_URI = Deno.env.get('MS_OAUTH_REDIRECT_URI') || '';

    // Google OAuth config
    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID') || '';
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET') || '';
    const GOOGLE_REDIRECT_URI = Deno.env.get('GOOGLE_OAUTH_REDIRECT_URI') || '';

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Rate limit
    const clientIp = getClientIdentifier(req);
    const rateLimitResponse = checkRateLimit(clientIp, {
      maxRequests: 10,
      windowSeconds: 60,
      keyPrefix: 'mail-oauth',
    });
    if (rateLimitResponse) return rateLimitResponse;

    // Require auth
    const { user: authUser, errorResponse } = await requireAuth(req, supabase);
    if (errorResponse) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      // ====================================================================
      // Generate OAuth URL
      // ====================================================================
      case 'get_auth_url': {
        const { provider, org_id } = body;

        if (provider === 'microsoft365') {
          const scopes = [
            'openid',
            'profile',
            'email',
            'offline_access',
            'Mail.ReadWrite',
            'Mail.Send',
            'MailboxSettings.ReadWrite',
          ].join(' ');

          const state = btoa(JSON.stringify({
            provider: 'microsoft365',
            user_id: authUser.userId,
            org_id,
          }));

          const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
            `client_id=${encodeURIComponent(MS_CLIENT_ID)}` +
            `&response_type=code` +
            `&redirect_uri=${encodeURIComponent(MS_REDIRECT_URI)}` +
            `&scope=${encodeURIComponent(scopes)}` +
            `&state=${encodeURIComponent(state)}` +
            `&prompt=consent`;

          return new Response(JSON.stringify({ url }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (provider === 'gmail') {
          const scopes = [
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.labels',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
          ].join(' ');

          const state = btoa(JSON.stringify({
            provider: 'gmail',
            user_id: authUser.userId,
            org_id,
          }));

          const url = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
            `&response_type=code` +
            `&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}` +
            `&scope=${encodeURIComponent(scopes)}` +
            `&state=${encodeURIComponent(state)}` +
            `&access_type=offline` +
            `&prompt=consent`;

          return new Response(JSON.stringify({ url }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ error: 'Invalid provider' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ====================================================================
      // Exchange code for tokens
      // ====================================================================
      case 'exchange_code': {
        const { code, provider, org_id } = body;

        let tokens: OAuthTokenResponse;
        let emailAddress: string;
        let displayName: string;
        let providerAccountId: string;
        let avatarUrl: string | null = null;
        let scopes: string[] = [];
        let deltaToken: string | null = null;

        if (provider === 'microsoft365') {
          // Exchange code for tokens
          const tokenRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: MS_CLIENT_ID,
              client_secret: MS_CLIENT_SECRET,
              code,
              redirect_uri: MS_REDIRECT_URI,
              grant_type: 'authorization_code',
            }),
          });

          if (!tokenRes.ok) {
            const err = await tokenRes.text();
            console.error('Microsoft token exchange failed:', err);
            return new Response(JSON.stringify({ error: 'Token exchange failed' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          tokens = await tokenRes.json();
          scopes = (tokens.scope || '').split(' ');

          // Get user profile
          const profileRes = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          const profile: MicrosoftUserProfile = await profileRes.json();
          emailAddress = profile.mail || profile.userPrincipalName;
          displayName = profile.displayName;
          providerAccountId = profile.userPrincipalName;

          // Get profile photo
          try {
            const photoRes = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
              headers: { Authorization: `Bearer ${tokens.access_token}` },
            });
            if (photoRes.ok) {
              // Convert to data URI for storage
              const blob = await photoRes.blob();
              const buffer = await blob.arrayBuffer();
              const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
              avatarUrl = `data:image/jpeg;base64,${base64}`;
            }
          } catch { /* photo is optional */ }

        } else if (provider === 'gmail') {
          // Exchange code for tokens
          const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: GOOGLE_CLIENT_ID,
              client_secret: GOOGLE_CLIENT_SECRET,
              code,
              redirect_uri: GOOGLE_REDIRECT_URI,
              grant_type: 'authorization_code',
            }),
          });

          if (!tokenRes.ok) {
            const err = await tokenRes.text();
            console.error('Google token exchange failed:', err);
            return new Response(JSON.stringify({ error: 'Token exchange failed' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          tokens = await tokenRes.json();
          scopes = (tokens.scope || '').split(' ');

          // Get Gmail profile
          const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          const profile: GmailUserProfile = await profileRes.json();
          emailAddress = profile.emailAddress;
          providerAccountId = profile.emailAddress;
          deltaToken = profile.historyId; // Gmail uses historyId for delta sync

          // Get user info for display name
          const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          const userInfo = await userInfoRes.json();
          displayName = userInfo.name || emailAddress;
          avatarUrl = userInfo.picture || null;

        } else {
          return new Response(JSON.stringify({ error: 'Invalid provider' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Encrypt tokens
        const { data: encAccess } = await supabase.rpc('encrypt_token', {
          token: tokens.access_token,
          key: TOKEN_ENCRYPTION_KEY,
        });

        let encRefresh = null;
        if (tokens.refresh_token) {
          const { data } = await supabase.rpc('encrypt_token', {
            token: tokens.refresh_token,
            key: TOKEN_ENCRYPTION_KEY,
          });
          encRefresh = data;
        }

        const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

        // Upsert account
        const { data: account, error: upsertError } = await supabase
          .from('mail_accounts')
          .upsert({
            org_id,
            user_id: authUser.userId,
            provider,
            email_address: emailAddress,
            display_name: displayName,
            access_token_encrypted: encAccess,
            refresh_token_encrypted: encRefresh,
            token_expires_at: tokenExpiresAt,
            scopes,
            sync_status: 'idle',
            sync_error: null,
            is_active: true,
            provider_account_id: providerAccountId,
            avatar_url: avatarUrl,
            delta_token: deltaToken,
          }, {
            onConflict: 'org_id,email_address',
          })
          .select('id, org_id, user_id, provider, email_address, display_name, avatar_url')
          .single();

        if (upsertError) {
          console.error('Failed to save account:', upsertError);
          return new Response(JSON.stringify({ error: 'Failed to save account' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Audit log
        await supabase.from('mail_audit_log').insert({
          org_id,
          user_id: authUser.userId,
          account_id: account.id,
          action: 'account_connected',
          details: { provider, email_address: emailAddress },
          ip_address: clientIp,
        });

        // Queue initial full sync
        await supabase.from('mail_sync_jobs').insert({
          account_id: account.id,
          job_type: 'full_sync',
          priority: 10,
        });

        return new Response(JSON.stringify({
          success: true,
          account: {
            id: account.id,
            email_address: emailAddress,
            display_name: displayName,
            provider,
            avatar_url: avatarUrl,
          },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ====================================================================
      // Refresh token
      // ====================================================================
      case 'refresh_token': {
        const { account_id } = body;

        // Get account (service role bypasses RLS)
        const { data: account } = await supabase
          .from('mail_accounts')
          .select('id, org_id, user_id, provider, email_address, display_name, access_token_encrypted, refresh_token_encrypted, token_expires_at, scopes, sync_status, sync_error, is_active, provider_account_id, avatar_url, delta_token, provider_metadata, last_sync_at, created_at, updated_at')
          .eq('id', account_id)
          .eq('user_id', authUser.userId)
          .single();

        if (!account) {
          return new Response(JSON.stringify({ error: 'Account not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Decrypt refresh token
        const { data: refreshToken } = await supabase.rpc('decrypt_token', {
          encrypted: account.refresh_token_encrypted,
          key: TOKEN_ENCRYPTION_KEY,
        });

        if (!refreshToken) {
          return new Response(JSON.stringify({ error: 'No refresh token available' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        let newTokens: OAuthTokenResponse;

        if (account.provider === 'microsoft365') {
          const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: MS_CLIENT_ID,
              client_secret: MS_CLIENT_SECRET,
              refresh_token: refreshToken,
              grant_type: 'refresh_token',
            }),
          });
          if (!res.ok) {
            const err = await res.text();
            console.error('Microsoft refresh failed:', err);
            await supabase.from('mail_accounts').update({
              sync_status: 'error',
              sync_error: 'Token refresh failed - reconnect required',
            }).eq('id', account_id);
            return new Response(JSON.stringify({ error: 'Token refresh failed' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          newTokens = await res.json();
        } else if (account.provider === 'gmail') {
          const res = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: GOOGLE_CLIENT_ID,
              client_secret: GOOGLE_CLIENT_SECRET,
              refresh_token: refreshToken,
              grant_type: 'refresh_token',
            }),
          });
          if (!res.ok) {
            const err = await res.text();
            console.error('Google refresh failed:', err);
            await supabase.from('mail_accounts').update({
              sync_status: 'error',
              sync_error: 'Token refresh failed - reconnect required',
            }).eq('id', account_id);
            return new Response(JSON.stringify({ error: 'Token refresh failed' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          newTokens = await res.json();
        } else {
          return new Response(JSON.stringify({ error: 'Unsupported provider' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Encrypt new access token
        const { data: encAccess } = await supabase.rpc('encrypt_token', {
          token: newTokens.access_token,
          key: TOKEN_ENCRYPTION_KEY,
        });

        const updateData: Record<string, unknown> = {
          access_token_encrypted: encAccess,
          token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
        };

        // Some providers return a new refresh token
        if (newTokens.refresh_token) {
          const { data: encRefresh } = await supabase.rpc('encrypt_token', {
            token: newTokens.refresh_token,
            key: TOKEN_ENCRYPTION_KEY,
          });
          updateData.refresh_token_encrypted = encRefresh;
        }

        await supabase.from('mail_accounts').update(updateData).eq('id', account_id);

        // Audit log
        await supabase.from('mail_audit_log').insert({
          org_id: account.org_id,
          user_id: authUser.userId,
          account_id,
          action: 'token_refresh',
          ip_address: clientIp,
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ====================================================================
      // Disconnect account
      // ====================================================================
      case 'disconnect': {
        const { account_id } = body;

        const { error } = await supabase
          .from('mail_accounts')
          .update({ is_active: false, sync_status: 'disabled' })
          .eq('id', account_id)
          .eq('user_id', authUser.userId);

        if (error) {
          return new Response(JSON.stringify({ error: 'Failed to disconnect' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        await supabase.from('mail_audit_log').insert({
          user_id: authUser.userId,
          account_id,
          action: 'account_disconnected',
          ip_address: clientIp,
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Unhandled error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
