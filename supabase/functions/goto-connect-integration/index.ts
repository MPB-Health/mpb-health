// ============================================================================
// GoTo Connect Custom Connection — CRM Integration API
//
// This Edge Function serves as the API endpoint for GoTo Connect's
// "Custom Connection" integration (GoTo Admin → Integrations → Custom).
//
// GoTo calls these paths on the configured domain:
//   GET  /                          — connection verification
//   GET  /contacts?phone=+1...      — screen pop / contact lookup
//   POST /calls                     — log completed calls as CRM activities
//
// Auth: API Key via `x-api-key` or `Authorization: Bearer <key>` header.
//
// Deploy:  supabase functions deploy goto-connect-integration --no-verify-jwt
// Env:     SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOTO_CONNECT_API_KEY
//
// GoTo Admin setup:
//   Domain: dtmnkzllidaiqyheguhl.supabase.co/functions/v1/goto-connect-integration
//   Auth type: API Key
//   API Key: (value from GOTO_CONNECT_API_KEY secret)
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createLogger } from '../_shared/logger.ts';
import { checkRateLimit, getClientIdentifier } from '../_shared/security.ts';

const log = createLogger('goto-connect-integration');

// ============================================================================
// API Key verification (constant-time)
// ============================================================================

function verifyApiKey(req: Request): boolean {
  const expected = Deno.env.get('GOTO_CONNECT_API_KEY');
  if (!expected) {
    log.error('GOTO_CONNECT_API_KEY is not configured');
    return false;
  }

  const provided =
    req.headers.get('x-api-key') ||
    req.headers.get('authorization')?.replace(/^(Bearer|Basic)\s+/i, '') ||
    req.headers.get('apikey') ||
    '';

  if (!provided || provided.length !== expected.length) return false;

  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  return diff === 0;
}

// ============================================================================
// Phone normalization (strip formatting, ensure E.164-ish)
// ============================================================================

function normalizePhone(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  const digits = trimmed.replace(/[^\d]/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (trimmed.startsWith('+')) return `+${digits}`;
  return digits;
}

// ============================================================================
// Handler: Connection Verification (root GET)
// GoTo calls this to verify the connection is valid.
// Must return a structured JSON response with expected fields.
// ============================================================================

function handleConnectionTest(): Response {
  return jsonResponse({
    status: 'ok',
    service: 'aryx-crm',
    version: '1.0',
    timestamp: new Date().toISOString(),
    capabilities: ['contact_lookup', 'call_logging'],
    data: [],
    contacts: [],
    users: [],
  });
}

// ============================================================================
// Handler: Contact Lookup (screen pop)
// GoTo calls this when an inbound/outbound call starts to display lead info.
// ============================================================================

async function handleContactLookup(
  phone: string,
  supabase: ReturnType<typeof createClient>,
): Promise<Response> {
  if (!phone) {
    return jsonResponse({ contacts: [], data: [], total: 0 });
  }

  const normalized = normalizePhone(phone);
  const digitsOnly = normalized.replace(/[^\d]/g, '');

  if (!digitsOnly || digitsOnly.length < 7) {
    return jsonResponse({ contacts: [], data: [], total: 0 });
  }

  const last10 = digitsOnly.slice(-10);

  // Search lead_submissions by phone
  const { data: leads, error } = await supabase
    .from('lead_submissions')
    .select('id, first_name, last_name, email, phone, pipeline_stage, org_id, assigned_to, source')
    .or(`phone.ilike.%${last10}%`)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    log.error(`Contact lookup DB error: ${error.message}`);
    return jsonResponse({ contacts: [], data: [], total: 0 });
  }

  // Also check normalized crm_phone_numbers table for broader matching
  const { data: phoneMatches } = await supabase
    .from('crm_phone_numbers')
    .select('owner_id, owner_type, phone_number')
    .ilike('phone_number', `%${last10}%`)
    .eq('owner_type', 'lead')
    .limit(5);

  const directLeadIds = new Set((leads || []).map((l) => l.id));
  const extraLeadIds = (phoneMatches || [])
    .filter((pm) => !directLeadIds.has(pm.owner_id))
    .map((pm) => pm.owner_id);

  let extraLeads: typeof leads = [];
  if (extraLeadIds.length > 0) {
    const { data } = await supabase
      .from('lead_submissions')
      .select('id, first_name, last_name, email, phone, pipeline_stage, org_id, assigned_to, source')
      .in('id', extraLeadIds)
      .limit(5);
    extraLeads = data || [];
  }

  const allLeads = [...(leads || []), ...extraLeads];

  const contacts = allLeads.map((lead) => ({
    id: lead.id,
    name: `${lead.first_name} ${lead.last_name}`.trim(),
    first_name: lead.first_name,
    last_name: lead.last_name,
    email: lead.email || '',
    phone: lead.phone || '',
    company: 'MPB Health',
    stage: lead.pipeline_stage || '',
    source: lead.source || '',
    url: `https://crm.mpb.health/leads/${lead.id}`,
  }));

  return jsonResponse({
    contacts,
    data: contacts,
    results: contacts,
    total: contacts.length,
  });
}

// ============================================================================
// Handler: Call Log (post-call activity creation)
// GoTo calls this after a call ends to log it in the CRM.
// ============================================================================

interface CallLogPayload {
  callId?: string;
  call_id?: string;
  direction?: 'inbound' | 'outbound' | 'missed' | string;
  type?: string;
  callerNumber?: string;
  caller_number?: string;
  from?: string;
  calleeNumber?: string;
  callee_number?: string;
  to?: string;
  startTime?: string;
  start_time?: string;
  started_at?: string;
  endTime?: string;
  end_time?: string;
  ended_at?: string;
  duration?: number;
  duration_seconds?: number;
  outcome?: string;
  disposition?: string;
  status?: string;
  userId?: string;
  user_id?: string;
  userEmail?: string;
  user_email?: string;
  userExtension?: string;
  user_extension?: string;
  extension?: string;
  notes?: string;
  note?: string;
  recording_url?: string;
  recordingUrl?: string;
}

async function handleCallLog(
  req: Request,
  supabase: ReturnType<typeof createClient>,
): Promise<Response> {
  let payload: CallLogPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ success: true, data: [], message: 'No body provided' });
  }

  // Normalize field names (GoTo may use different casing/naming)
  const direction = (payload.direction || payload.type || 'inbound').toLowerCase();
  const callerNumber = payload.callerNumber || payload.caller_number || payload.from || '';
  const calleeNumber = payload.calleeNumber || payload.callee_number || payload.to || '';
  const duration = payload.duration || payload.duration_seconds || 0;
  const startTime = payload.startTime || payload.start_time || payload.started_at || '';
  const endTime = payload.endTime || payload.end_time || payload.ended_at || '';
  const outcome = payload.outcome || payload.disposition || payload.status || '';
  const callId = payload.callId || payload.call_id || '';
  const userEmail = payload.userEmail || payload.user_email || '';
  const userExtension = payload.userExtension || payload.user_extension || payload.extension || '';
  const notes = payload.notes || payload.note || '';
  const recordingUrl = payload.recording_url || payload.recordingUrl || '';

  // Determine the external phone number (the lead's number)
  const externalNumber = direction === 'outbound' ? calleeNumber : callerNumber;
  const normalized = normalizePhone(externalNumber);
  const digitsOnly = normalized.replace(/[^\d]/g, '');

  // Try to resolve the lead by phone number
  let leadId: string | null = null;
  let orgId: string | null = null;
  let assignedTo: string | null = null;

  if (digitsOnly && digitsOnly.length >= 7) {
    const last10 = digitsOnly.slice(-10);

    const { data: lead } = await supabase
      .from('lead_submissions')
      .select('id, org_id, assigned_to, first_name, last_name')
      .or(`phone.ilike.%${last10}%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lead) {
      leadId = lead.id;
      orgId = lead.org_id;
      assignedTo = lead.assigned_to;
    } else {
      const { data: phoneMatch } = await supabase
        .from('crm_phone_numbers')
        .select('owner_id')
        .ilike('phone_number', `%${last10}%`)
        .eq('owner_type', 'lead')
        .limit(1)
        .maybeSingle();

      if (phoneMatch) {
        const { data: resolvedLead } = await supabase
          .from('lead_submissions')
          .select('id, org_id, assigned_to')
          .eq('id', phoneMatch.owner_id)
          .maybeSingle();
        if (resolvedLead) {
          leadId = resolvedLead.id;
          orgId = resolvedLead.org_id;
          assignedTo = resolvedLead.assigned_to;
        }
      }
    }
  }

  if (!orgId) {
    const defaultOrg = Deno.env.get('GOTO_CONNECT_DEFAULT_ORG_ID');
    if (defaultOrg) orgId = defaultOrg;
  }

  if (!orgId) {
    log.warn(`Call log — no org resolved for ${externalNumber || 'unknown number'}`);
    return jsonResponse({
      success: true,
      data: [],
      activity: null,
      message: 'Call received, no matching organization',
    });
  }

  const callType = direction === 'outbound' ? 'outbound'
    : direction === 'missed' ? 'missed'
    : 'inbound';

  const callOutcome = mapCallOutcome(outcome, direction);

  const subject = direction === 'missed'
    ? `Missed call from ${externalNumber || 'unknown'}`
    : direction === 'outbound'
      ? `Outbound call to ${externalNumber || 'unknown'}`
      : `Inbound call from ${externalNumber || 'unknown'}`;

  const durationStr = duration
    ? `${Math.floor(duration / 60)}m ${duration % 60}s`
    : 'unknown duration';
  const description = [
    `Direction: ${direction}`,
    `Duration: ${durationStr}`,
    startTime ? `Started: ${startTime}` : null,
    outcome ? `Outcome: ${outcome}` : null,
    notes || null,
  ].filter(Boolean).join('\n');

  const createdBy = assignedTo || '00000000-0000-0000-0000-000000000000';

  const { data: activity, error: activityErr } = await supabase
    .from('crm_activities')
    .insert({
      org_id: orgId,
      lead_id: leadId,
      activity_type: 'call',
      subject,
      description,
      call_type: callType,
      call_outcome: callOutcome,
      call_duration_seconds: duration || null,
      status: 'completed',
      completed_at: endTime || new Date().toISOString(),
      scheduled_at: startTime || null,
      created_by: createdBy,
      metadata: {
        source: 'goto_connect',
        goto_call_id: callId || null,
        caller_number: callerNumber || null,
        callee_number: calleeNumber || null,
        goto_user_email: userEmail || null,
        goto_user_extension: userExtension || null,
        recording_url: recordingUrl || null,
      },
    })
    .select('id')
    .maybeSingle();

  if (activityErr) {
    log.error(`Failed to insert call activity: ${activityErr.message}`);
    return jsonResponse({
      success: false,
      data: [],
      error: 'Failed to log call',
    }, 500);
  }

  log.info(`Call logged: ${activity?.id} for lead ${leadId || 'unmatched'} (${direction})`);

  return jsonResponse({
    success: true,
    data: [{ id: activity?.id, lead_id: leadId, type: 'call' }],
    activity: { id: activity?.id, lead_id: leadId, matched: !!leadId },
  });
}

function mapCallOutcome(outcome: string, direction: string): string {
  const lower = (outcome || '').toLowerCase();
  if (direction === 'missed') return 'no_answer';
  if (lower.includes('answer') || lower.includes('connect') || lower.includes('completed')) return 'answered';
  if (lower.includes('busy')) return 'busy';
  if (lower.includes('voicemail') || lower.includes('vm')) return 'voicemail';
  if (lower.includes('no_answer') || lower.includes('no answer') || lower.includes('noanswer')) return 'no_answer';
  if (lower.includes('callback')) return 'callback_requested';
  return 'answered';
}

// ============================================================================
// JSON response helper — always returns valid JSON with Content-Type
// ============================================================================

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization, apikey',
    },
  });
}

// ============================================================================
// Path extraction — get the sub-path after the function name
// Supabase Edge Functions may receive the URL in different formats:
//   /functions/v1/goto-connect-integration/contacts
//   /goto-connect-integration/contacts
//   /contacts
// ============================================================================

function extractPath(url: URL): string {
  const fullPath = url.pathname;

  // Try stripping known prefixes
  const prefixes = [
    '/functions/v1/goto-connect-integration',
    '/goto-connect-integration',
  ];
  for (const prefix of prefixes) {
    const idx = fullPath.indexOf(prefix);
    if (idx !== -1) {
      const sub = fullPath.slice(idx + prefix.length);
      return sub || '/';
    }
  }

  // If none matched, the path itself might already be the sub-path
  return fullPath || '/';
}

// ============================================================================
// Main router
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return jsonResponse({ status: 'ok' });
  }

  // Rate limiting
  const clientIp = getClientIdentifier(req);
  const rateLimit = checkRateLimit(clientIp, {
    maxRequests: 120,
    windowSeconds: 60,
    keyPrefix: 'goto-connect',
  });
  if (rateLimit) return rateLimit;

  // API Key authentication
  if (!verifyApiKey(req)) {
    log.warn(`Unauthorized request from ${clientIp}`);
    return jsonResponse({ error: 'Unauthorized', data: [] }, 401);
  }

  const url = new URL(req.url);
  const path = extractPath(url);
  const action = url.searchParams.get('action') || '';

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Route by path first, then fall back to ?action= query param
    const hasPhoneParam = !!(url.searchParams.get('phone') || url.searchParams.get('number') || url.searchParams.get('q'));

    if (path === '/contacts' || action === 'contact_lookup' || (req.method === 'GET' && hasPhoneParam)) {
      const phone = url.searchParams.get('phone') || url.searchParams.get('number') || url.searchParams.get('q') || '';
      return await handleContactLookup(phone, supabase);
    }

    if (path === '/calls' || path === '/activities' || action === 'call_log') {
      if (req.method === 'POST') {
        return await handleCallLog(req, supabase);
      }
      return jsonResponse({ data: [], calls: [], total: 0 });
    }

    if (path === '/health' || action === 'health') {
      return handleConnectionTest();
    }

    if (path === '/users' || path === '/agents') {
      return jsonResponse({ data: [], users: [], total: 0 });
    }

    // POST to root with a body = call log attempt
    if (req.method === 'POST' && path === '/') {
      return await handleCallLog(req, supabase);
    }

    // Root path or unknown path — return connection verification
    // This is what GoTo hits first when testing the connection.
    // Every field that GoTo might try to iterate must be a non-null array.
    return handleConnectionTest();
  } catch (err) {
    log.error('Unhandled error:', err);
    return jsonResponse({ error: 'Internal server error', data: [] }, 500);
  }
});
