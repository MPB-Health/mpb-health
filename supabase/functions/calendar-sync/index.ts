// ============================================================================
// Calendar Sync Edge Function
// Google Calendar & Outlook integration for CRM calendar events
// Deploy with: supabase functions deploy calendar-sync
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';
import { checkRateLimit, getClientIdentifier } from '../_shared/security.ts';
const log = createLogger('calendar-sync');

// ============================================================================
// Environment Variables
// ============================================================================

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
const MICROSOFT_CLIENT_ID = Deno.env.get('MICROSOFT_CLIENT_ID')!;
const MICROSOFT_CLIENT_SECRET = Deno.env.get('MICROSOFT_CLIENT_SECRET')!;

// ============================================================================
// Types
// ============================================================================

type Provider = 'google' | 'outlook';

interface CalendarIntegration {
  id: string;
  user_id: string;
  org_id: string;
  provider: Provider;
  access_token_encrypted: string;
  refresh_token_encrypted: string;
  token_expires_at: string;
  last_sync_at: string | null;
  sync_status: string;
}

interface GoogleEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  status?: string;
  htmlLink?: string;
  attendees?: { email: string; responseStatus?: string }[];
}

interface OutlookEvent {
  id: string;
  subject?: string;
  body?: { contentType: string; content: string };
  location?: { displayName?: string };
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  isCancelled?: boolean;
  webLink?: string;
  attendees?: { emailAddress: { address: string }; status?: { response: string } }[];
}

// ============================================================================
// Helpers
// ============================================================================

function jsonResponse(req: Request, data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
  });
}

function errorResponse(req: Request, message: string, status = 400): Response {
  return jsonResponse(req, { error: message }, status);
}

/** Create a service-role Supabase client for DB operations. */
function getServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

/** Verify the JWT from the Authorization header and return the user. */
async function verifyAuth(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) throw new Error('Missing Authorization header');

  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) throw new Error('Invalid or expired token');
  return user;
}

// ============================================================================
// Action: auth_url — Generate OAuth2 authorization URL
// ============================================================================

function handleAuthUrl(req: Request, url: URL): Response {
  const provider = url.searchParams.get('provider') as Provider | null;
  const redirectUri = url.searchParams.get('redirect_uri');

  if (!provider || !['google', 'outlook'].includes(provider)) {
    return errorResponse(req, 'Missing or invalid provider. Must be "google" or "outlook".');
  }
  if (!redirectUri) {
    return errorResponse(req, 'Missing redirect_uri parameter.');
  }

  let authUrl: string;

  if (provider === 'google') {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events',
      access_type: 'offline',
      prompt: 'consent',
    });
    authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  } else {
    // Outlook / Microsoft
    const params = new URLSearchParams({
      client_id: MICROSOFT_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'Calendars.ReadWrite offline_access',
      response_mode: 'query',
    });
    authUrl = `https://login.microsoftonline.com/common/oauth2/v2/authorize?${params.toString()}`;
  }

  return jsonResponse(req, { auth_url: authUrl });
}

// ============================================================================
// Action: callback — Exchange OAuth2 code for tokens and store them
// ============================================================================

async function handleCallback(req: Request): Promise<Response> {
  const body = await req.json();
  const { provider, code, redirect_uri, user_id, org_id } = body;

  if (!provider || !['google', 'outlook'].includes(provider)) {
    return errorResponse(req, 'Missing or invalid provider.');
  }
  if (!code) return errorResponse(req, 'Missing authorization code.');
  if (!redirect_uri) return errorResponse(req, 'Missing redirect_uri.');
  if (!user_id) return errorResponse(req, 'Missing user_id.');
  if (!org_id) return errorResponse(req, 'Missing org_id.');

  let tokenData: { access_token: string; refresh_token: string; expires_in: number };

  if (provider === 'google') {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri,
        grant_type: 'authorization_code',
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      log.error('Google token exchange failed:', errText);
      return errorResponse(req, `Google token exchange failed: ${errText}`, 502);
    }

    tokenData = await res.json();
  } else {
    // Outlook / Microsoft
    const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: MICROSOFT_CLIENT_ID,
        client_secret: MICROSOFT_CLIENT_SECRET,
        redirect_uri,
        grant_type: 'authorization_code',
        scope: 'Calendars.ReadWrite offline_access',
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      log.error('Microsoft token exchange failed:', errText);
      return errorResponse(req, `Microsoft token exchange failed: ${errText}`, 502);
    }

    tokenData = await res.json();
  }

  // Store tokens in the database
  const supabase = getServiceClient();
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

  const { error: upsertError } = await supabase
    .from('crm_calendar_integrations')
    .upsert(
      {
        user_id,
        org_id,
        provider,
        access_token_encrypted: tokenData.access_token,
        refresh_token_encrypted: tokenData.refresh_token,
        token_expires_at: expiresAt,
        sync_status: 'connected',
        last_sync_at: null,
      },
      { onConflict: 'user_id,provider' }
    );

  if (upsertError) {
    log.error('Failed to store integration:', upsertError);
    return errorResponse(req, 'Failed to store calendar integration.', 500);
  }

  return jsonResponse(req, { success: true, provider });
}

// ============================================================================
// Token Refresh Helpers
// ============================================================================

async function refreshGoogleToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google token refresh failed: ${errText}`);
  }

  return await res.json();
}

async function refreshOutlookToken(refreshToken: string): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> {
  const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: MICROSOFT_CLIENT_ID,
      client_secret: MICROSOFT_CLIENT_SECRET,
      grant_type: 'refresh_token',
      scope: 'Calendars.ReadWrite offline_access',
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Microsoft token refresh failed: ${errText}`);
  }

  return await res.json();
}

/** Ensure the integration's access token is valid; refresh if expired. Returns the current access token. */
async function ensureValidToken(integration: CalendarIntegration): Promise<string> {
  const expiresAt = new Date(integration.token_expires_at).getTime();
  const now = Date.now();

  // If token is still valid (with 60s buffer), return it as-is
  if (expiresAt - now > 60_000) {
    return integration.access_token_encrypted;
  }

  log.info(`Refreshing ${integration.provider} token for user ${integration.user_id}`);

  let newAccessToken: string;
  let newRefreshToken: string | undefined;
  let expiresIn: number;

  if (integration.provider === 'google') {
    const data = await refreshGoogleToken(integration.refresh_token_encrypted);
    newAccessToken = data.access_token;
    expiresIn = data.expires_in;
  } else {
    const data = await refreshOutlookToken(integration.refresh_token_encrypted);
    newAccessToken = data.access_token;
    newRefreshToken = data.refresh_token; // Outlook may rotate refresh tokens
    expiresIn = data.expires_in;
  }

  // Update tokens in the database
  const supabase = getServiceClient();
  const newExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  const updatePayload: Record<string, unknown> = {
    access_token_encrypted: newAccessToken,
    token_expires_at: newExpiresAt,
  };
  if (newRefreshToken) {
    updatePayload.refresh_token_encrypted = newRefreshToken;
  }

  await supabase
    .from('crm_calendar_integrations')
    .update(updatePayload)
    .eq('id', integration.id);

  return newAccessToken;
}

// ============================================================================
// Calendar API Helpers — Google
// ============================================================================

async function fetchGoogleEvents(accessToken: string): Promise<GoogleEvent[]> {
  const now = new Date();
  const timeMin = now.toISOString();
  const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Calendar API error: ${errText}`);
  }

  const data = await res.json();
  return data.items || [];
}

async function createGoogleEvent(
  accessToken: string,
  event: { title: string; description?: string; location?: string; start_time: string; end_time: string }
): Promise<string> {
  const body = {
    summary: event.title,
    description: event.description || '',
    location: event.location || '',
    start: { dateTime: event.start_time, timeZone: 'UTC' },
    end: { dateTime: event.end_time, timeZone: 'UTC' },
  };

  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google create event error: ${errText}`);
  }

  const created = await res.json();
  return created.id;
}

// ============================================================================
// Calendar API Helpers — Outlook / Microsoft Graph
// ============================================================================

async function fetchOutlookEvents(accessToken: string): Promise<OutlookEvent[]> {
  const now = new Date();
  const startDateTime = now.toISOString();
  const endDateTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    startDateTime,
    endDateTime,
    $top: '250',
    $orderby: 'start/dateTime',
  });

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/calendarView?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Microsoft Graph calendar error: ${errText}`);
  }

  const data = await res.json();
  return data.value || [];
}

async function createOutlookEvent(
  accessToken: string,
  event: { title: string; description?: string; location?: string; start_time: string; end_time: string }
): Promise<string> {
  const body = {
    subject: event.title,
    body: { contentType: 'text', content: event.description || '' },
    location: { displayName: event.location || '' },
    start: { dateTime: event.start_time, timeZone: 'UTC' },
    end: { dateTime: event.end_time, timeZone: 'UTC' },
  };

  const res = await fetch(
    'https://graph.microsoft.com/v1.0/me/calendar/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Microsoft create event error: ${errText}`);
  }

  const created = await res.json();
  return created.id;
}

// ============================================================================
// Action: sync — Pull & push calendar events
// ============================================================================

async function handleSync(req: Request): Promise<Response> {
  const body = await req.json();
  const { user_id, org_id, provider } = body;

  if (!user_id) return errorResponse(req, 'Missing user_id.');
  if (!org_id) return errorResponse(req, 'Missing org_id.');
  if (!provider || !['google', 'outlook'].includes(provider)) {
    return errorResponse(req, 'Missing or invalid provider.');
  }

  const supabase = getServiceClient();

  // Load the integration record
  const { data: integration, error: loadError } = await supabase
    .from('crm_calendar_integrations')
    .select('id, user_id, org_id, provider, access_token_encrypted, refresh_token_encrypted, token_expires_at, last_sync_at, sync_status')
    .eq('user_id', user_id)
    .eq('provider', provider)
    .single();

  if (loadError || !integration) {
    return errorResponse(req, 'Calendar integration not found. Please connect your calendar first.', 404);
  }

  // Update sync status to in_progress
  await supabase
    .from('crm_calendar_integrations')
    .update({ sync_status: 'syncing' })
    .eq('id', integration.id);

  try {
    // Ensure we have a valid access token (refresh if needed)
    const accessToken = await ensureValidToken(integration as CalendarIntegration);

    let pulled = 0;
    let pushed = 0;

    // ---- PULL: External → CRM ----
    if (provider === 'google') {
      const events = await fetchGoogleEvents(accessToken);

      for (const event of events) {
        const startTime = event.start.dateTime || event.start.date || '';
        const endTime = event.end.dateTime || event.end.date || '';

        const { error: upsertErr } = await supabase
          .from('calendar_events')
          .upsert(
            {
              org_id,
              user_id,
              title: event.summary || '(No title)',
              description: event.description || null,
              location: event.location || null,
              start_time: startTime,
              end_time: endTime,
              external_calendar_id: 'primary',
              external_event_id: event.id,
              provider: 'google',
              external_link: event.htmlLink || null,
            },
            { onConflict: 'org_id,external_event_id,provider' }
          );

        if (!upsertErr) pulled++;
      }
    } else {
      // Outlook
      const events = await fetchOutlookEvents(accessToken);

      for (const event of events) {
        const { error: upsertErr } = await supabase
          .from('calendar_events')
          .upsert(
            {
              org_id,
              user_id,
              title: event.subject || '(No title)',
              description: event.body?.content || null,
              location: event.location?.displayName || null,
              start_time: event.start.dateTime,
              end_time: event.end.dateTime,
              external_calendar_id: 'primary',
              external_event_id: event.id,
              provider: 'outlook',
              external_link: event.webLink || null,
            },
            { onConflict: 'org_id,external_event_id,provider' }
          );

        if (!upsertErr) pulled++;
      }
    }

    // ---- PUSH: CRM → External ----
    const { data: crmEvents, error: crmError } = await supabase
      .from('calendar_events')
      .select('id, org_id, user_id, title, description, location, start_time, end_time, external_calendar_id, external_event_id, provider, external_link')
      .eq('org_id', org_id)
      .eq('user_id', user_id)
      .is('external_event_id', null);

    if (crmError) {
      log.error('Failed to load CRM events for push:', crmError);
    }

    if (crmEvents && crmEvents.length > 0) {
      for (const event of crmEvents) {
        try {
          let externalId: string;

          if (provider === 'google') {
            externalId = await createGoogleEvent(accessToken, {
              title: event.title,
              description: event.description,
              location: event.location,
              start_time: event.start_time,
              end_time: event.end_time,
            });
          } else {
            externalId = await createOutlookEvent(accessToken, {
              title: event.title,
              description: event.description,
              location: event.location,
              start_time: event.start_time,
              end_time: event.end_time,
            });
          }

          // Save the external ID back to the CRM event
          await supabase
            .from('calendar_events')
            .update({
              external_event_id: externalId,
              external_calendar_id: 'primary',
              provider,
            })
            .eq('id', event.id);

          pushed++;
        } catch (pushErr) {
          log.error(`Failed to push event ${event.id} to ${provider}:`, pushErr);
        }
      }
    }

    // Update sync metadata
    await supabase
      .from('crm_calendar_integrations')
      .update({
        last_sync_at: new Date().toISOString(),
        sync_status: 'connected',
      })
      .eq('id', integration.id);

    return jsonResponse(req, { success: true, pulled, pushed });
  } catch (syncError) {
    log.error('Sync failed:', syncError);

    // Mark the integration as errored
    await supabase
      .from('crm_calendar_integrations')
      .update({ sync_status: 'error' })
      .eq('id', integration.id);

    return errorResponse(req, `Sync failed: ${(syncError as Error).message}`, 500);
  }
}

// ============================================================================
// Action: disconnect — Remove a calendar integration
// ============================================================================

async function handleDisconnect(req: Request): Promise<Response> {
  const body = await req.json();
  const { user_id, provider } = body;

  if (!user_id) return errorResponse(req, 'Missing user_id.');
  if (!provider || !['google', 'outlook'].includes(provider)) {
    return errorResponse(req, 'Missing or invalid provider.');
  }

  const supabase = getServiceClient();

  const { error } = await supabase
    .from('crm_calendar_integrations')
    .delete()
    .eq('user_id', user_id)
    .eq('provider', provider);

  if (error) {
    log.error('Failed to disconnect integration:', error);
    return errorResponse(req, 'Failed to disconnect calendar integration.', 500);
  }

  return jsonResponse(req, { success: true });
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  // Rate limit: authenticated CRUD endpoint
  const clientIp = getClientIdentifier(req);
  const rateLimitResponse = checkRateLimit(clientIp, {
    maxRequests: 60,
    windowSeconds: 60,
    keyPrefix: 'calendar-sync',
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // Verify JWT for all actions
    try {
      await verifyAuth(req);
    } catch (authErr) {
      return errorResponse(req, `Unauthorized: ${(authErr as Error).message}`, 401);
    }

    switch (action) {
      case 'auth_url':
        return handleAuthUrl(req, url);

      case 'callback':
        return await handleCallback(req);

      case 'sync':
        return await handleSync(req);

      case 'disconnect':
        return await handleDisconnect(req);

      default:
        return errorResponse(
          req,
          'Unknown action. Supported actions: auth_url, callback, sync, disconnect.',
          400
        );
    }
  } catch (err) {
    log.error('Unhandled error:', err);
    return errorResponse(req, `Internal server error: ${(err as Error).message}`, 500);
  }
});
