// ============================================================================
// crm-website-lead-intake — CRM rebuild Phase 3 / Section 13 / Round 7
//
// Wraps the existing `submit_public_lead` RPC so a website Get-a-Quote
// submission flows end-to-end:
//
//   1. Inserts the lead via the anon-safe RPC (security guarantees preserved).
//   2. Enrolls the lead in the org's "Quote Response" cadence.
//   3. Sends Email #1 (preliminary quote) from sales@mympb.com using the
//      master template the cadence references. Display name "MPB.Health
//      Sales" (Round 7 Addendum locked).
//   4. On send success, advances stage `new → quoted` and tags the lead
//      with `lead_source_attribution = 'website_auto_response'`.
//
// If the master template / cadence is not yet configured (placeholder content
// from migration 20260620110000), the function still creates the lead and
// returns a partial result — Email #1 is gated on admin-supplied content.
//
// Deploy: supabase functions deploy crm-website-lead-intake
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { checkRateLimit, getClientIdentifier } from '../_shared/security.ts';

interface IntakePayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  household_size?: number;
  current_insurance?: string;
  monthly_premium?: string;
  coverage_preference?: string;
  zip_code?: string;
  primary_concern?: string;
  contact_preference?: string;
  source_page?: string;
  source_cta?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer?: string;
  form_data?: Record<string, unknown>;
}

const FROM_ADDRESS = 'sales@mympb.com';
const FROM_NAME = 'MPB.Health Sales'; // Round 7 Addendum locked
const REPLY_TO = 'sales@mympb.com';
const CADENCE_NAME = 'Quote Response';
const QUOTE_TEMPLATE_NAME = 'Email #1';
const SOURCE_TAG = 'website_auto_response';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);
  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: jsonHeaders },
    );
  }

  // Public endpoint — rate limit by IP. 10/min mirrors web-form-submit.
  const clientIp = getClientIdentifier(req);
  const rateLimitResponse = checkRateLimit(
    clientIp,
    { maxRequests: 10, windowSeconds: 60, keyPrefix: 'crm-website-lead-intake' },
    corsHeaders,
  );
  if (rateLimitResponse) return rateLimitResponse;

  let payload: IntakePayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'invalid json' }),
      { status: 400, headers: jsonHeaders },
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ success: false, error: 'missing_env' }),
      { status: 500, headers: jsonHeaders },
    );
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Create the lead via the anon-safe RPC. We use service role here so
  //    the same RPC is reused across both anonymous public form callers and
  //    this trusted edge function — same validation, same triggers.
  const { data: lead, error: insertError } = await supabase.rpc(
    'submit_public_lead',
    { payload },
  );
  if (insertError || !lead) {
    return new Response(
      JSON.stringify({ success: false, error: insertError?.message ?? 'lead_insert_failed' }),
      { status: 400, headers: jsonHeaders },
    );
  }

  // 2. Look up the org's Quote Response cadence + Email #1 master template.
  //    A missing template / cadence is non-fatal — the lead row exists and
  //    the rep can still pick it up; we just skip the auto-response.
  const orgId: string | null = lead.org_id ?? null;
  let cadenceId: string | null = null;
  let masterTemplateId: string | null = null;
  let emailSubject: string | null = null;
  let emailBody: string | null = null;

  if (orgId) {
    const { data: cadenceRow } = await supabase
      .from('crm_follow_up_cadences')
      .select('id, steps')
      .eq('org_id', orgId)
      .eq('name', CADENCE_NAME)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (cadenceRow) {
      cadenceId = cadenceRow.id as string;
      const steps = Array.isArray(cadenceRow.steps) ? cadenceRow.steps : [];
      // Step 1 is Email #1; pull its template_id if present.
      const step1 = steps.find(
        (s: Record<string, unknown>) => s && (s.step === 1 || s.step === '1'),
      );
      if (step1 && typeof step1.template_id === 'string') {
        masterTemplateId = step1.template_id as string;
      }
    }

    // Resolve the master template — prefer the cadence-linked one; fall
    // back to the most recent active "Email #1" by name in this org.
    if (masterTemplateId) {
      const { data: tpl } = await supabase
        .from('crm_master_templates')
        .select('id, subject, body')
        .eq('id', masterTemplateId)
        .is('archived_at', null)
        .maybeSingle();
      if (tpl) {
        emailSubject = tpl.subject ?? null;
        emailBody = tpl.body ?? null;
      }
    }
    if (!emailSubject || !emailBody) {
      const { data: fallback } = await supabase
        .from('crm_master_templates')
        .select('id, subject, body')
        .eq('org_id', orgId)
        .eq('channel', 'email')
        .eq('name', QUOTE_TEMPLATE_NAME)
        .is('archived_at', null)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (fallback) {
        masterTemplateId = fallback.id as string;
        emailSubject = fallback.subject ?? null;
        emailBody = fallback.body ?? null;
      }
    }
  }

  // 3. Enroll the lead in Quote Response (idempotent RPC). Skipped if the
  //    cadence is not yet configured for this org.
  if (cadenceId) {
    await supabase.rpc('crm_enroll_lead_in_cadence', {
      p_lead_id: lead.id,
      p_cadence_id: cadenceId,
    });
  }

  // 4. Send Email #1 via send-crm-email-v2 (existing transactional sender).
  //    Skipped if the template body is missing (admin must fill it in).
  let emailSent = false;
  let emailError: string | null = null;

  if (emailSubject && emailBody && lead.email) {
    const html = mergeTokens(emailBody, lead);
    const subject = mergeTokens(emailSubject, lead);

    try {
      const sendResp = await fetch(`${supabaseUrl}/functions/v1/send-crm-email-v2`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: [lead.email],
          subject,
          html,
          // Section 13 (Round 7 Addendum): the website auto-response ships
          // from the shared MPB Sales inbox, not the org's generic
          // `crm@mpb.health` envelope. send-crm-email-v2 honors per-send
          // overrides so rep-driven sends from other CRM surfaces still use
          // the env-default sender.
          from_email: FROM_ADDRESS,
          from_name: FROM_NAME,
          reply_to: REPLY_TO,
          track_opens: true,
          track_clicks: true,
          tags: ['quote-response', 'website', 'auto-response'],
          org_id: orgId,
          lead_id: lead.id,
          template_id: masterTemplateId,
          metadata: {
            source: 'crm-website-lead-intake',
            cadence: CADENCE_NAME,
            from_address: FROM_ADDRESS,
            attribution: SOURCE_TAG,
          },
        }),
      });
      emailSent = sendResp.ok;
      if (!emailSent) {
        emailError = `send-crm-email-v2 returned ${sendResp.status}`;
      }
    } catch (err) {
      emailError = err instanceof Error ? err.message : String(err);
    }
  }

  // 5. On send success, advance stage new → quoted and tag attribution.
  if (emailSent) {
    await supabase
      .from('lead_submissions')
      .update({
        pipeline_stage: 'quoted',
        stage_changed_at: new Date().toISOString(),
        preliminary_quote_sent_at: new Date().toISOString(),
        quote_cadence_started_at: new Date().toISOString(),
        last_touched_at: new Date().toISOString(),
        // Append the attribution tag without clobbering existing tags.
        tags: Array.from(new Set([...(lead.tags ?? []), SOURCE_TAG])),
      })
      .eq('id', lead.id);
  }

  return new Response(
    JSON.stringify({
      success: true,
      lead_id: lead.id,
      email_sent: emailSent,
      email_error: emailError,
      cadence_enrolled: !!cadenceId,
      auto_response_pending: !emailSent,
    }),
    { status: 200, headers: jsonHeaders },
  );
});

// ----------------------------------------------------------------------------
// Token merge — supports the site-spec tokens. Keep this fast and lossless;
// missing values fall through as the original token so admins can spot them
// in inbox previews while iterating on copy.
// ----------------------------------------------------------------------------
const TOKENS: Record<string, (lead: Record<string, unknown>) => string> = {
  '#firstname': (l) => String(l.first_name ?? ''),
  '#first_name': (l) => String(l.first_name ?? ''),
  '#lastname': (l) => String(l.last_name ?? ''),
  '#last_name': (l) => String(l.last_name ?? ''),
  '#lead name': (l) => `${l.first_name ?? ''} ${l.last_name ?? ''}`.trim(),
  '#leadname': (l) => `${l.first_name ?? ''} ${l.last_name ?? ''}`.trim(),
  '#yoursignature': () =>
    '<br/><br/>— MPB.Health Sales<br/>sales@mympb.com<br/>https://www.mympb.com',
  '#plan': (l) => String(l.coverage_preference ?? ''),
  '#quote price': (l) => String(l.monthly_premium ?? ''),
  '#email': (l) => String(l.email ?? ''),
  '#phone': (l) => String(l.phone ?? ''),
  '#zip': (l) => String(l.zip_code ?? ''),
  '#zip_code': (l) => String(l.zip_code ?? ''),
};

function mergeTokens(input: string, lead: Record<string, unknown>): string {
  let out = input;
  for (const [token, fn] of Object.entries(TOKENS)) {
    if (out.includes(token)) {
      const value = fn(lead);
      out = out.split(token).join(value);
    }
  }
  return out;
}
