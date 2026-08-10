// ============================================================================
// crm-website-lead-intake — CRM rebuild Phase 3 / Section 13 / Round 7
//
// Wraps the existing `submit_public_lead` RPC so a website Get-a-Quote
// submission flows end-to-end:
//
//   1. Inserts the lead via submit_public_lead (stamps lead_source=website).
//   2. Sends Email #1 (preliminary quote) from sales@mympb.com using the
//      master template resolved via system_settings pins
//      (crm.website_quote_cadence_id / crm.website_quote_email1_template_id),
//      then Sales Cadence 2026 / Quote Response #1 name fallbacks.
//      Display name "MPB.Health Sales" (Round 7 Addendum locked).
//   3. On send success, advances stage `new → quoted` and tags the lead with
//      `website_auto_response`. The DB quote-cadence trigger enrolls the lead
//      once (no double cadence with insert-time default).
//   4. Notifies staff of the new lead (server-side, tenant-isolated). Recipients
//      are configured per-org in system_settings('crm.lead_notification_recipients').
//
// If the master template / cadence is not yet configured (placeholder content
// from migration 20260620110000), the function still creates the lead and
// returns a partial result — Email #1 is gated on admin-supplied content. The
// staff notification still fires so the team never misses a lead.
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
// Keep in sync with crm_lead_start_quote_cadence (Sales Cadence 2026 first).
const CADENCE_NAMES = [
  'Sales Cadence 2026',
  'Quote Response — 5-touch (Email)',
  'Quote Response',
] as const;
// Prefer live name; keep archived legacy name as last resort.
const QUOTE_TEMPLATE_NAMES = ['Quote Response #1', 'Email #1'] as const;
const SOURCE_TAG = 'website_auto_response';

// Per-org staff "new lead" notification recipients live in system_settings so
// each tenant only ever notifies its own people (see migration
// 20260624160000_aryx_lead_notification_recipients).
const LEAD_NOTIFY_SETTINGS_KEY = 'crm.lead_notification_recipients';
// Durable pins — see migration 20260810160000_crm_website_quote_intake_settings.
const WEBSITE_QUOTE_CADENCE_SETTINGS_KEY = 'crm.website_quote_cadence_id';
const WEBSITE_QUOTE_EMAIL1_TEMPLATE_SETTINGS_KEY = 'crm.website_quote_email1_template_id';
const CRM_BASE_URL = 'https://crm.mpb.health';

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

  // 2. Look up the org's quote cadence + Email #1 master template.
  //    Resolution order: system_settings IDs → cadence name list (aligned with
  //    crm_lead_start_quote_cadence) → template name fallbacks. Archived
  //    templates are never used. Missing config is non-fatal — lead still lands.
  const orgId: string | null = lead.org_id ?? null;
  let cadenceId: string | null = null;
  let masterTemplateId: string | null = null;
  let emailSubject: string | null = null;
  let emailBody: string | null = null;

  if (orgId) {
    const pinnedCadenceId = await readSettingsUuid(
      supabase,
      WEBSITE_QUOTE_CADENCE_SETTINGS_KEY,
    );
    const pinnedTemplateId = await readSettingsUuid(
      supabase,
      WEBSITE_QUOTE_EMAIL1_TEMPLATE_SETTINGS_KEY,
    );

    if (pinnedCadenceId) {
      const { data: pinnedCadence } = await supabase
        .from('crm_follow_up_cadences')
        .select('id, steps, name')
        .eq('id', pinnedCadenceId)
        .eq('org_id', orgId)
        .eq('is_active', true)
        .maybeSingle();
      if (pinnedCadence) {
        cadenceId = pinnedCadence.id as string;
        masterTemplateId = extractStep1TemplateId(pinnedCadence.steps) ?? pinnedTemplateId;
      }
    }

    if (!cadenceId) {
      const { data: cadenceRows } = await supabase
        .from('crm_follow_up_cadences')
        .select('id, steps, name')
        .eq('org_id', orgId)
        .in('name', [...CADENCE_NAMES])
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      const cadenceRow = (cadenceRows ?? []).sort((a, b) => {
        const aIdx = CADENCE_NAMES.indexOf(a.name as (typeof CADENCE_NAMES)[number]);
        const bIdx = CADENCE_NAMES.indexOf(b.name as (typeof CADENCE_NAMES)[number]);
        return (aIdx < 0 ? 99 : aIdx) - (bIdx < 0 ? 99 : bIdx);
      })[0];

      if (cadenceRow) {
        cadenceId = cadenceRow.id as string;
        masterTemplateId =
          extractStep1TemplateId(cadenceRow.steps) ?? pinnedTemplateId ?? masterTemplateId;
      }
    }

    if (!masterTemplateId && pinnedTemplateId) {
      masterTemplateId = pinnedTemplateId;
    }

    // Resolve the master template — prefer cadence/settings-linked id; fall
    // back to active template names (Quote Response #1, then Email #1).
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
      } else {
        masterTemplateId = null;
      }
    }
    if (!emailSubject || !emailBody) {
      const { data: fallbackRows } = await supabase
        .from('crm_master_templates')
        .select('id, name, subject, body')
        .eq('org_id', orgId)
        .eq('channel', 'email')
        .in('name', [...QUOTE_TEMPLATE_NAMES])
        .is('archived_at', null)
        .order('version', { ascending: false });

      const fallback = (fallbackRows ?? []).sort((a, b) => {
        const aIdx = QUOTE_TEMPLATE_NAMES.indexOf(
          a.name as (typeof QUOTE_TEMPLATE_NAMES)[number],
        );
        const bIdx = QUOTE_TEMPLATE_NAMES.indexOf(
          b.name as (typeof QUOTE_TEMPLATE_NAMES)[number],
        );
        return (aIdx < 0 ? 99 : aIdx) - (bIdx < 0 ? 99 : bIdx);
      })[0];

      if (fallback) {
        masterTemplateId = fallback.id as string;
        emailSubject = fallback.subject ?? null;
        emailBody = fallback.body ?? null;
      }
    }
  }

  // 3. Send Email #1 via send-crm-email-v2 (existing transactional sender).
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
          // crm_email_log.template_id FKs to crm_templates; the auto-response
          // uses a *master* template, so it must go in master_template_id
          // (FK -> crm_master_templates). Stamping it into template_id caused
          // the log insert to fail the FK silently (email still sent, but no
          // crm_email_log row / no timeline entry). Route it correctly here.
          master_template_id: masterTemplateId,
          template_id: null,
          metadata: {
            source: 'crm-website-lead-intake',
            cadence: cadenceId ? 'quote-response' : null,
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

  // 4. On send success, advance stage new → quoted and tag attribution.
  //    trg_lead_start_quote_cadence enrolls Quote Response once on this transition.
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

  // 5. Notify staff of the new lead — server-side so it is reliable and
  //    tenant-isolated. Recipients are configured per-org in
  //    system_settings('crm.lead_notification_recipients'); we only ever
  //    notify the recipients mapped to THIS lead's org. This fires for every
  //    lead regardless of whether Email #1 sent, so the team never misses one.
  //    Best-effort: a failure here must never fail the intake — the lead row
  //    already exists and was returned to the caller.
  let staffNotified = false;
  let staffNotifyError: string | null = null;
  try {
    const recipients = await resolveStaffRecipients(supabase, orgId);
    if (recipients.length > 0) {
      const leadName =
        [lead.first_name, lead.last_name].filter(Boolean).join(' ').trim() ||
        String(lead.email ?? 'New lead');
      const notifyResp = await fetch(`${supabaseUrl}/functions/v1/send-crm-email-v2`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: recipients,
          subject: `New lead: ${leadName}`,
          html: buildStaffNotificationHtml(lead),
          from_email: FROM_ADDRESS,
          from_name: FROM_NAME,
          // Reps can reply straight to the prospect from the alert.
          reply_to: (lead.email as string | null) ?? REPLY_TO,
          track_opens: false,
          track_clicks: false,
          tags: ['lead-notification', 'website', 'internal'],
          org_id: orgId,
          // Intentionally NO lead_id: this internal alert is audited in
          // crm_email_log (org-scoped) but must NOT appear on the lead's own
          // email timeline, which filters by lead_id.
          metadata: {
            source: 'crm-website-lead-intake',
            kind: 'staff_lead_notification',
            lead_id: lead.id,
          },
        }),
      });
      staffNotified = notifyResp.ok;
      if (!notifyResp.ok) {
        staffNotifyError = `send-crm-email-v2 returned ${notifyResp.status}`;
      }
    }
  } catch (err) {
    staffNotifyError = err instanceof Error ? err.message : String(err);
  }

  return new Response(
    JSON.stringify({
      success: true,
      lead_id: lead.id,
      email_sent: emailSent,
      email_error: emailError,
      cadence_enrolled: emailSent && !!cadenceId,
      auto_response_pending: !emailSent,
      staff_notified: staffNotified,
      staff_notify_error: staffNotifyError,
    }),
    { status: 200, headers: jsonHeaders },
  );
});

// ----------------------------------------------------------------------------
// Cadence / template resolution helpers
// ----------------------------------------------------------------------------

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function readSettingsUuid(
  supabase: ReturnType<typeof createClient>,
  key: string,
): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    const raw = typeof data?.value === 'string' ? data.value.trim() : '';
    return UUID_RE.test(raw) ? raw : null;
  } catch {
    return null;
  }
}

function extractStep1TemplateId(steps: unknown): string | null {
  if (!Array.isArray(steps)) return null;
  const step1 = steps.find(
    (s: unknown) =>
      s &&
      typeof s === 'object' &&
      ((s as Record<string, unknown>).step === 1 ||
        (s as Record<string, unknown>).step === '1'),
  ) as Record<string, unknown> | undefined;
  return typeof step1?.template_id === 'string' && UUID_RE.test(step1.template_id)
    ? step1.template_id
    : null;
}

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

// ----------------------------------------------------------------------------
// Staff "new lead" notification helpers.
// ----------------------------------------------------------------------------

/**
 * Resolve the staff notification recipients for a lead's org from
 * system_settings('crm.lead_notification_recipients'). The setting is a JSON
 * object keyed by org_id -> string[] of emails, with an optional "*" default.
 * Tenant isolation: we only ever return the list mapped to THIS org (falling
 * back to "*" only if the org has no explicit entry). Read with the service
 * role (RLS bypassed). Never throws — returns [] on any problem.
 */
async function resolveStaffRecipients(
  supabase: ReturnType<typeof createClient>,
  orgId: string | null,
): Promise<string[]> {
  if (!orgId) return [];
  try {
    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', LEAD_NOTIFY_SETTINGS_KEY)
      .maybeSingle();

    let map: Record<string, unknown> = {};
    const raw: unknown = data?.value ?? null;
    if (raw && typeof raw === 'object') {
      map = raw as Record<string, unknown>;
    } else if (typeof raw === 'string') {
      try {
        map = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        map = {};
      }
    }

    const pick = (map[orgId] ?? map['*']) as unknown;
    const list = Array.isArray(pick) ? pick : [];
    return Array.from(
      new Set(
        list
          .map((e) => (typeof e === 'string' ? e.trim() : ''))
          .filter((e) => e.includes('@')),
      ),
    );
  } catch {
    return [];
  }
}

/** Build the internal "new lead" alert email body. */
function buildStaffNotificationHtml(lead: Record<string, unknown>): string {
  const val = (v: unknown) => (v == null ? '' : esc(String(v)));
  const name =
    [lead.first_name, lead.last_name].filter(Boolean).map(String).join(' ').trim() ||
    '(no name provided)';
  const leadUrl = `${CRM_BASE_URL}/leads/${esc(String(lead.id ?? ''))}`;

  // Quote-calculator / multi-step form details are persisted in the lead's
  // form_data JSON by submit_public_lead. Surface them so reps see age,
  // household makeup, priorities and the rate comparison without opening the
  // CRM. Every row is value-gated below, so leads without these fields render
  // exactly as before.
  const fd = parseFormData(lead.form_data);

  const fields: Array<[string, unknown]> = [
    ['Email', lead.email],
    ['Phone', lead.phone],
    ['ZIP', lead.zip_code],
    ['Household size', formatHouseholdSize(lead.household_size)],
    ['Lead type', fd.lead_type],
    ['Household type', formatHouseholdType(fd.household_type)],
    ['State', fd.state],
    ['Primary age', fd.primary_age],
    ['Spouse age', fd.spouse_age],
    ['Number of dependents', fd.dependents_count],
    ['Oldest dependent age', fd.oldest_dependent_age],
    ['Membership priorities', formatList(fd.membership_priorities)],
    ['Priorities matched', formatList(fd.priorities_matched)],
    ['Traditional insurance estimate', formatCurrency(fd.traditional_cost_estimate)],
    ['Best match plan', fd.best_match_plan],
    ['Best match score', formatPercent(fd.best_match_percentage)],
    ['Current insurance', lead.current_insurance],
    ['Budget (monthly)', lead.monthly_premium],
    ['Coverage preference', lead.coverage_preference],
    ['Primary concern', lead.primary_concern],
    ['Contact preference', lead.contact_preference],
    ['Source page', lead.source_page],
    ['Source CTA', lead.source_cta],
    ['Campaign', lead.utm_campaign],
    ['Plan rate comparison', formatPlanRates(fd.all_plan_rates)],
  ];

  const rows = fields
    .filter(([, v]) => v != null && String(v).trim() !== '')
    .map(
      ([label, v]) =>
        `<tr><td style="padding:6px 14px;color:#64748b;font-size:13px;white-space:nowrap;vertical-align:top;">${esc(label)}</td>` +
        `<td style="padding:6px 14px;color:#0f172a;font-size:14px;font-weight:600;">${val(v).replace(/\n/g, '<br>')}</td></tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
  <body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f1f5f9;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 0;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
          <tr><td style="background:linear-gradient(to right,#2563eb,#06b6d4);padding:22px 28px;">
            <p style="margin:0;color:#e0f2fe;font-size:13px;letter-spacing:.5px;text-transform:uppercase;">New website lead</p>
            <h1 style="margin:4px 0 0 0;color:#ffffff;font-size:22px;">${esc(name)}</h1>
          </td></tr>
          <tr><td style="padding:24px 14px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${rows}</table>
          </td></tr>
          <tr><td style="padding:0 28px 28px 28px;" align="center">
            <a href="${leadUrl}" style="display:inline-block;background:linear-gradient(to right,#2563eb,#06b6d4);color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;font-size:15px;">Open lead in CRM</a>
          </td></tr>
          <tr><td style="padding:16px 28px;background-color:#f8fafc;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">Automated alert from crm-website-lead-intake · reply to this email to reach the prospect.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

/** HTML-entity-escape user-supplied values before interpolating into markup. */
function esc(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ----------------------------------------------------------------------------
// form_data formatting helpers for the staff "new lead" notification.
// Mirror apps/website/src/lib/leadNotificationFormat.ts so the server-side
// alert matches the website's own notification. All return '' when empty so
// the caller's value-gate skips the row.
// ----------------------------------------------------------------------------

const HOUSEHOLD_TYPE_LABELS: Record<string, string> = {
  'member-only': 'Just Me (Individual)',
  'member-spouse': 'Member + Spouse',
  'member-child': 'Member + Child(ren)',
  'member-family': 'Member + Family',
  individual: 'Individual',
  couple: 'Couple',
  family: 'Family',
};

/** Coerce a jsonb form_data column (object or JSON string) into a plain map. */
function parseFormData(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

function formatHouseholdSize(v: unknown): string {
  if (v == null || String(v).trim() === '') return '';
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  return `${n} ${n === 1 ? 'person' : 'people'}`;
}

function formatHouseholdType(v: unknown): string {
  if (v == null || String(v).trim() === '') return '';
  const s = String(v);
  return HOUSEHOLD_TYPE_LABELS[s] ?? s;
}

function formatList(v: unknown): string {
  if (Array.isArray(v)) return v.map((x) => String(x)).filter((x) => x.trim() !== '').join(', ');
  if (v == null) return '';
  return String(v);
}

function formatCurrency(v: unknown): string {
  if (v == null || String(v).trim() === '') return '';
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return '';
  return `$${n.toLocaleString('en-US')}/month`;
}

function formatPercent(v: unknown): string {
  if (v == null || String(v).trim() === '') return '';
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return '';
  return `${n}%`;
}

interface PlanRateEntry {
  planLabel?: string;
  lowestPrice?: number;
  highestPrice?: number;
  flatRate?: number | null;
}

/** Render all_plan_rates into one "Label: $low–$high/month" line per plan. */
function formatPlanRates(raw: unknown): string {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return '';
  const entries = Object.entries(raw as Record<string, PlanRateEntry>);
  if (entries.length === 0) return '';
  return entries
    .map(([planId, plan]) => {
      const label = (plan && plan.planLabel) || planId;
      if (typeof plan?.flatRate === 'number') {
        return `${label}: $${plan.flatRate.toLocaleString('en-US')}/month (flat rate)`;
      }
      if (typeof plan?.lowestPrice === 'number' && typeof plan?.highestPrice === 'number') {
        if (plan.lowestPrice === plan.highestPrice) {
          return `${label}: $${plan.lowestPrice.toLocaleString('en-US')}/month`;
        }
        return `${label}: $${plan.lowestPrice.toLocaleString('en-US')}–$${plan.highestPrice.toLocaleString('en-US')}/month`;
      }
      if (typeof plan?.lowestPrice === 'number') {
        return `${label}: from $${plan.lowestPrice.toLocaleString('en-US')}/month`;
      }
      return `${label}: rates unavailable`;
    })
    .join('\n');
}
