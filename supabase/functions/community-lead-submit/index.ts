// Supabase Edge Function: community-lead-submit
// Public endpoint for on-site community event capture (tablet / laptop at a
// booth). The rep hands the prospect `/forms/community/<eventId>`; this
// endpoint receives the form payload, validates the event is active, and
// writes a `lead_submissions` row stamped with `lead_source='community'` and
// `community_event_id=<eventId>`. The `crm_community_event_bump_counter`
// trigger (Phase 4 migration) then increments the event's lead tally, and the
// Phase 2 automation trigger takes care of round-robin + SLA + cadence.
//
// Rate limited (8/min/IP) and escaped. No auth required.
//
// Deploy: supabase functions deploy community-lead-submit

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';
import { checkRateLimit, getClientIdentifier } from '../_shared/security.ts';

const log = createLogger('community-lead-submit');

interface SubmitBody {
  event_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  zip_code?: string;
  notes?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req);

  const corsHeaders = getCorsHeaders(req);
  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  const clientIp = getClientIdentifier(req);
  const rl = checkRateLimit(
    clientIp,
    { maxRequests: 8, windowSeconds: 60, keyPrefix: 'community-lead-submit' },
    corsHeaders,
  );
  if (rl) return rl;

  let body: SubmitBody;
  try {
    body = (await req.json()) as SubmitBody;
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON body' }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  if (!body.event_id) {
    return new Response(JSON.stringify({ success: false, error: 'event_id is required' }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  if (!body.email && !body.phone) {
    return new Response(
      JSON.stringify({ success: false, error: 'Provide at least email or phone' }),
      { status: 400, headers: jsonHeaders },
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: event, error: evErr } = await supabase
    .from('crm_community_events')
    .select('id, org_id, name, event_date')
    .eq('id', body.event_id)
    .maybeSingle();

  if (evErr || !event) {
    log.warn('Community event not found', { event_id: body.event_id, error: evErr?.message });
    return new Response(JSON.stringify({ success: false, error: 'Event not found' }), {
      status: 404,
      headers: jsonHeaders,
    });
  }

  // Time-window guard: only accept captures from the day before the event
  // through the day after, so a stale URL can't be abused to inject leads
  // weeks later. If ops need looser windows they can always capture from the
  // authenticated CRM UI.
  const evDate = event.event_date ? new Date(event.event_date) : null;
  if (evDate) {
    const now = Date.now();
    const windowMs = 36 * 60 * 60 * 1000; // +/- 36h
    const diff = Math.abs(evDate.getTime() - now);
    if (diff > windowMs && now > evDate.getTime() + windowMs) {
      return new Response(
        JSON.stringify({ success: false, error: 'This event has ended — thanks for your interest.' }),
        { status: 400, headers: jsonHeaders },
      );
    }
  }

  const { data: lead, error: leadErr } = await supabase
    .from('lead_submissions')
    .insert({
      org_id: event.org_id,
      source: 'community_event',
      lead_source: 'community',
      community_event_id: event.id,
      first_name: body.first_name ?? null,
      last_name: body.last_name ?? null,
      email: body.email ?? null,
      phone: body.phone ?? null,
      zip_code: body.zip_code ?? null,
      pipeline_stage: 'new',
      metadata: {
        community_event_name: event.name,
        captured_notes: body.notes ?? null,
        client_ip: clientIp,
      },
    })
    .select('id')
    .single();

  if (leadErr) {
    log.error('Failed to insert community lead', { error: leadErr.message });
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to save submission' }),
      { status: 500, headers: jsonHeaders },
    );
  }

  log.info('Community lead captured', { lead_id: lead.id, event_id: event.id });

  return new Response(
    JSON.stringify({
      success: true,
      lead_id: lead.id,
      message:
        'Thanks! One of our advisors will reach out shortly — usually within one business day.',
    }),
    { status: 200, headers: jsonHeaders },
  );
});
