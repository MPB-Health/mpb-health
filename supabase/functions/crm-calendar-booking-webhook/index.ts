// ============================================================================
// CRM Calendar Booking Webhook (Round 7 — engagement-signal producer)
//
// Receives inbound calendar-booking events (Calendly first; Outlook + Google
// to follow once their integrations ship) and fires the
// `crm_register_engagement_signal(lead_id, 'calendar_booking')` RPC for the
// matched lead — which halts the Quote Response cadence and advances
// Quoted/Working → Engaged.
//
// Public endpoint, signature-verified. Idempotent on `(provider, external_uri)`
// via `crm_calendar_booking_log`.
//
// Deploy with:    supabase functions deploy crm-calendar-booking-webhook
// Required env:   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//                 CRM_CALENDLY_WEBHOOK_SIGNING_KEY (per Calendly v2 webhook
//                 setup — admin must rotate via Calendly dashboard).
//
// Calendly setup (one-time, admin task):
//   1. Calendly dashboard → Integrations → Webhook subscriptions
//   2. URL: https://<project>.supabase.co/functions/v1/crm-calendar-booking-webhook
//   3. Events: invitee.created, invitee.canceled
//   4. Copy the signing key, run:
//        supabase secrets set CRM_CALENDLY_WEBHOOK_SIGNING_KEY=<key>
//   5. Save. Calendly fires a test ping that this function ACKs.
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';
import { checkRateLimit, getClientIdentifier } from '../_shared/security.ts';

const log = createLogger('crm-calendar-booking-webhook');

const ALLOW_HEADERS =
  'Content-Type, Authorization, X-Client-Info, Apikey, calendly-webhook-signature';

// ----------------------------------------------------------------------------
// Calendly v2 payload shape (subset we consume)
// https://developer.calendly.com/api-docs/c1ddc06ce1f1b-webhook-payload
// ----------------------------------------------------------------------------

interface CalendlyWebhookPayload {
  event: 'invitee.created' | 'invitee.canceled' | string;
  created_at: string;
  payload: {
    uri: string; // unique invitee URI — used as dedupe key
    name?: string;
    email?: string;
    status?: 'active' | 'canceled' | string;
    timezone?: string;
    cancel_url?: string;
    reschedule_url?: string;
    questions_and_answers?: Array<{
      question: string;
      answer: string;
      position?: number;
    }>;
    scheduled_event?: {
      uri: string;
      name?: string;
      start_time?: string;
      end_time?: string;
      event_type?: string;
      event_memberships?: Array<{
        user_email?: string;
        user_name?: string;
      }>;
      location?: {
        type?: string;
        location?: string;
        join_url?: string;
      };
    };
  };
}

// ----------------------------------------------------------------------------
// Calendly signature verification — HMAC-SHA256 with the signing key.
// Header format: `t=<unix_timestamp>,v1=<hex_signature>` (comma-separated key=value).
// Signed payload: `<timestamp>.<raw_body>`
// ----------------------------------------------------------------------------

async function verifyCalendlySignature(
  signingKey: string,
  signatureHeader: string,
  rawBody: string,
  toleranceSeconds = 300,
): Promise<void> {
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((p) => {
      const eq = p.indexOf('=');
      return [p.slice(0, eq).trim(), p.slice(eq + 1).trim()];
    }),
  );
  const ts = parts['t'];
  const sig = parts['v1'];
  if (!ts || !sig) {
    throw new Error('Calendly signature header missing t=/v1=');
  }

  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) {
    throw new Error('Calendly signature timestamp is not numeric');
  }
  const ageSec = Math.abs(Date.now() / 1000 - tsNum);
  if (ageSec > toleranceSeconds) {
    throw new Error(`Calendly signature timestamp out of tolerance (${ageSec}s)`);
  }

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(signingKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const macBuf = await crypto.subtle.sign('HMAC', key, enc.encode(`${ts}.${rawBody}`));
  const macHex = Array.from(new Uint8Array(macBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Constant-time string compare
  if (macHex.length !== sig.length) {
    throw new Error('Calendly signature length mismatch');
  }
  let diff = 0;
  for (let i = 0; i < macHex.length; i++) {
    diff |= macHex.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  if (diff !== 0) {
    throw new Error('Calendly signature mismatch');
  }
}

// ----------------------------------------------------------------------------
// Main handler
// ----------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req, { allowHeaders: ALLOW_HEADERS });
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const clientIp = getClientIdentifier(req);
  const rateLimit = checkRateLimit(clientIp, {
    maxRequests: 200,
    windowSeconds: 60,
    keyPrefix: 'crm-calendar-booking-webhook',
  });
  if (rateLimit) return rateLimit;

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const SIGNING_KEY = Deno.env.get('CRM_CALENDLY_WEBHOOK_SIGNING_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration is missing');
    }
    if (!SIGNING_KEY) {
      log.error('CRM_CALENDLY_WEBHOOK_SIGNING_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook verification is not configured' }),
        {
          headers: {
            ...getCorsHeaders(req, { allowHeaders: ALLOW_HEADERS }),
            'Content-Type': 'application/json',
          },
          status: 500,
        },
      );
    }

    const sigHeader = req.headers.get('calendly-webhook-signature');
    if (!sigHeader) {
      log.warn('Missing calendly-webhook-signature header');
      return new Response(
        JSON.stringify({ error: 'Missing signature header' }),
        {
          headers: {
            ...getCorsHeaders(req, { allowHeaders: ALLOW_HEADERS }),
            'Content-Type': 'application/json',
          },
          status: 401,
        },
      );
    }

    const rawBody = await req.text();

    try {
      await verifyCalendlySignature(SIGNING_KEY, sigHeader, rawBody);
    } catch (err) {
      log.error(`Calendly signature verification failed: ${(err as Error).message}`);
      return new Response(
        JSON.stringify({ error: 'Invalid webhook signature' }),
        {
          headers: {
            ...getCorsHeaders(req, { allowHeaders: ALLOW_HEADERS }),
            'Content-Type': 'application/json',
          },
          status: 401,
        },
      );
    }

    const payload = JSON.parse(rawBody) as CalendlyWebhookPayload;
    log.info(`Received ${payload.event} for invitee ${payload.payload?.uri}`);

    // Only `invitee.created` qualifies as an engagement signal — the lead
    // has actively committed to a meeting time. `invitee.canceled` is
    // logged but does NOT fire the engagement signal (and intentionally
    // does not resume the cadence — the rep decides on next steps).
    if (payload.event !== 'invitee.created') {
      return new Response(
        JSON.stringify({ received: true, action: 'skipped (non-created)' }),
        {
          headers: {
            ...getCorsHeaders(req, { allowHeaders: ALLOW_HEADERS }),
            'Content-Type': 'application/json',
          },
          status: 200,
        },
      );
    }

    const invitee = payload.payload;
    const inviteeEmail = invitee.email?.toLowerCase().trim();
    if (!inviteeEmail) {
      log.warn('Calendly payload missing invitee.email — cannot resolve lead');
      return new Response(
        JSON.stringify({ received: true, action: 'no_email' }),
        {
          headers: {
            ...getCorsHeaders(req, { allowHeaders: ALLOW_HEADERS }),
            'Content-Type': 'application/json',
          },
          status: 200,
        },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Resolve the lead by email. Prefer the most recently created active
    // lead so that re-engagements (lead opts back in after being lost,
    // booked a new call) hit the active row, not the abandoned one.
    const { data: lead, error: leadErr } = await supabase
      .from('lead_submissions')
      .select('id, org_id, email, pipeline_stage, assigned_to')
      .ilike('email', inviteeEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (leadErr) {
      log.error(`Lead lookup failed: ${leadErr.message}`);
    }

    if (!lead) {
      log.info(`No matching lead for ${inviteeEmail}; logging booking only`);
      await supabase.from('crm_calendar_booking_log').upsert(
        {
          org_id: null,
          lead_id: null,
          recruit_id: null,
          provider: 'calendly',
          external_uri: invitee.uri,
          invitee_email: inviteeEmail,
          invitee_name: invitee.name ?? null,
          scheduled_start: invitee.scheduled_event?.start_time ?? null,
          scheduled_end: invitee.scheduled_event?.end_time ?? null,
          event_type_name: invitee.scheduled_event?.name ?? null,
          raw_payload: payload as unknown as Record<string, unknown>,
          engagement_signal_fired: false,
          activity_id: null,
        },
        { onConflict: 'provider,external_uri', ignoreDuplicates: false },
      );

      return new Response(
        JSON.stringify({ received: true, action: 'logged_no_lead' }),
        {
          headers: {
            ...getCorsHeaders(req, { allowHeaders: ALLOW_HEADERS }),
            'Content-Type': 'application/json',
          },
          status: 200,
        },
      );
    }

    // Idempotency check — if we already booked this Calendly URI for this
    // lead, skip the engagement-signal fan-out.
    const { data: prior } = await supabase
      .from('crm_calendar_booking_log')
      .select('id, engagement_signal_fired')
      .eq('provider', 'calendly')
      .eq('external_uri', invitee.uri)
      .maybeSingle();

    if (prior?.engagement_signal_fired) {
      log.info(`Duplicate Calendly URI ${invitee.uri}; engagement signal already fired`);
      return new Response(
        JSON.stringify({ received: true, action: 'duplicate' }),
        {
          headers: {
            ...getCorsHeaders(req, { allowHeaders: ALLOW_HEADERS }),
            'Content-Type': 'application/json',
          },
          status: 200,
        },
      );
    }

    // 1. Fire the engagement signal — halts the cadence + advances stage.
    const { error: signalErr } = await supabase.rpc('crm_register_engagement_signal', {
      p_lead_id: lead.id,
      p_signal_type: 'calendar_booking',
    });

    if (signalErr) {
      log.error(`crm_register_engagement_signal failed for lead ${lead.id}: ${signalErr.message}`);
    } else {
      log.info(`Engagement signal fired for lead ${lead.id} (calendar_booking)`);
    }

    // 2. Insert a `crm_activities` row so the booking shows up on the
    // unified timeline and feeds the Daily Log auto-classifier as a
    // meeting.
    const subject = invitee.scheduled_event?.name
      ? `Calendly booking: ${invitee.scheduled_event.name}`
      : 'Calendly booking received';
    const description = [
      `Invitee: ${invitee.name ?? inviteeEmail}`,
      invitee.scheduled_event?.start_time
        ? `When: ${invitee.scheduled_event.start_time} → ${invitee.scheduled_event.end_time ?? '(end unknown)'}`
        : null,
      invitee.scheduled_event?.location?.join_url
        ? `Join: ${invitee.scheduled_event.location.join_url}`
        : null,
      invitee.cancel_url ? `Cancel: ${invitee.cancel_url}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const { data: activity, error: activityErr } = await supabase
      .from('crm_activities')
      .insert({
        org_id: lead.org_id,
        lead_id: lead.id,
        activity_type: 'meeting',
        subject,
        description,
        created_by: lead.assigned_to ?? '00000000-0000-0000-0000-000000000000',
        metadata: {
          source: 'calendly',
          calendly_uri: invitee.uri,
          scheduled_event_uri: invitee.scheduled_event?.uri ?? null,
          start_time: invitee.scheduled_event?.start_time ?? null,
          end_time: invitee.scheduled_event?.end_time ?? null,
          location: invitee.scheduled_event?.location ?? null,
          cancel_url: invitee.cancel_url ?? null,
          reschedule_url: invitee.reschedule_url ?? null,
          questions_and_answers: invitee.questions_and_answers ?? null,
        },
      })
      .select('id')
      .maybeSingle();

    if (activityErr) {
      log.error(`crm_activities insert failed for lead ${lead.id}: ${activityErr.message}`);
    }

    // 3. Persist the booking row (idempotent on (provider, external_uri)).
    await supabase.from('crm_calendar_booking_log').upsert(
      {
        org_id: lead.org_id,
        lead_id: lead.id,
        recruit_id: null,
        provider: 'calendly',
        external_uri: invitee.uri,
        invitee_email: inviteeEmail,
        invitee_name: invitee.name ?? null,
        scheduled_start: invitee.scheduled_event?.start_time ?? null,
        scheduled_end: invitee.scheduled_event?.end_time ?? null,
        event_type_name: invitee.scheduled_event?.name ?? null,
        raw_payload: payload as unknown as Record<string, unknown>,
        engagement_signal_fired: !signalErr,
        activity_id: activity?.id ?? null,
      },
      { onConflict: 'provider,external_uri', ignoreDuplicates: false },
    );

    return new Response(
      JSON.stringify({
        received: true,
        action: 'engagement_fired',
        lead_id: lead.id,
        activity_id: activity?.id ?? null,
      }),
      {
        headers: {
          ...getCorsHeaders(req, { allowHeaders: ALLOW_HEADERS }),
          'Content-Type': 'application/json',
        },
        status: 200,
      },
    );
  } catch (err) {
    log.error('Unhandled error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        headers: {
          ...getCorsHeaders(req, { allowHeaders: ALLOW_HEADERS }),
          'Content-Type': 'application/json',
        },
        status: 500,
      },
    );
  }
});
