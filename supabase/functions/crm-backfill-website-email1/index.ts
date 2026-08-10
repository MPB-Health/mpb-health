// One-shot / operator-gated backfill for website Quote Email #1.
// Invoked with service role from the operator machine (verify_jwt=false);
// gated by BACKFILL_ENABLED + X-Backfill-Secret matching BACKFILL_SECRET.
// Calls send-crm-email-v2 edge-to-edge (same path as crm-website-lead-intake).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const ORG_ID = '00000000-0000-4000-a000-000000000001';
const TEMPLATE_ID = 'dd699908-5394-4ba7-a14d-1f0b9aed80e7';
const SOURCE_TAG = 'website_auto_response';
const FROM_ADDRESS = 'sales@mympb.com';
const FROM_NAME = 'MPB.Health Sales';
const CUTOVER = '2026-08-04T00:00:00Z';

serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ success: false, error: 'Method not allowed' }, 405);
  }

  if (Deno.env.get('BACKFILL_ENABLED') !== 'true') {
    return json({ success: false, error: 'kill_switch' }, 403);
  }

  const expectedSecret = Deno.env.get('BACKFILL_SECRET') ?? '';
  const provided = req.headers.get('X-Backfill-Secret') ?? '';
  if (!expectedSecret || provided !== expectedSecret) {
    return json({ success: false, error: 'unauthorized' }, 401);
  }

  let body: { expected_count?: number; dry_run?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const expected = Number(body.expected_count ?? 0);
  const dryRun = body.dry_run === true;

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ success: false, error: 'missing_env' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: tpl } = await supabase
    .from('crm_master_templates')
    .select('id, subject, body')
    .eq('id', TEMPLATE_ID)
    .is('archived_at', null)
    .maybeSingle();
  if (!tpl?.subject || !tpl?.body) {
    return json({ success: false, error: 'template_missing' }, 500);
  }

  const { data: candidates, error: candErr } = await supabase
    .from('lead_submissions')
    .select(
      'id,email,first_name,last_name,phone,zip_code,coverage_preference,monthly_premium,tags,preliminary_quote_sent_at,source_cta,created_at',
    )
    .eq('org_id', ORG_ID)
    .gte('created_at', CUTOVER)
    .is('preliminary_quote_sent_at', null)
    .eq('source_cta', 'hero-calculator-all-plans-comparison')
    .not('email', 'ilike', '%@example.com')
    .not('email', 'ilike', '%@resend.dev')
    .order('created_at', { ascending: true });

  if (candErr) {
    return json({ success: false, error: candErr.message }, 500);
  }

  const eligible: typeof candidates = [];
  for (const lead of candidates ?? []) {
    if ((lead.tags ?? []).includes(SOURCE_TAG)) continue;
    const { data: logs } = await supabase
      .from('crm_email_log')
      .select('id')
      .eq('lead_id', lead.id)
      .eq('direction', 'outbound')
      .limit(1);
    if (logs && logs.length > 0) continue;
    eligible.push(lead);
  }

  if (expected > 0 && eligible.length !== expected) {
    return json(
      {
        success: false,
        error: 'expected_count_mismatch',
        eligible: eligible.length,
        expected,
      },
      409,
    );
  }

  if (dryRun) {
    return json({
      success: true,
      dry_run: true,
      eligible: eligible.map((l) => ({ id: l.id, email: l.email })),
      count: eligible.length,
    });
  }

  let sent = 0;
  let failed = 0;
  const errors: Array<{ id: string; error: string }> = [];

  for (const lead of eligible) {
    const { data: fresh } = await supabase
      .from('lead_submissions')
      .select('id, preliminary_quote_sent_at, tags')
      .eq('id', lead.id)
      .maybeSingle();
    if (!fresh || fresh.preliminary_quote_sent_at) continue;

    const subject = mergeTokens(tpl.subject, lead);
    const html = mergeTokens(tpl.body, lead);

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
        from_email: FROM_ADDRESS,
        from_name: FROM_NAME,
        reply_to: FROM_ADDRESS,
        track_opens: true,
        track_clicks: true,
        tags: ['quote-response', 'website', 'auto-response', 'backfill-2026-08-10'],
        org_id: ORG_ID,
        lead_id: lead.id,
        master_template_id: TEMPLATE_ID,
        template_id: null,
        metadata: {
          source: 'crm-backfill-website-email1',
          attribution: SOURCE_TAG,
        },
      }),
    });

    if (!sendResp.ok) {
      failed += 1;
      errors.push({ id: lead.id, error: `send ${sendResp.status}` });
      continue;
    }

    const now = new Date().toISOString();
    const tags = Array.from(
      new Set([...(fresh.tags ?? []), SOURCE_TAG, 'website_email1_backfill']),
    );
    await supabase
      .from('lead_submissions')
      .update({
        pipeline_stage: 'quoted',
        stage_changed_at: now,
        preliminary_quote_sent_at: now,
        quote_cadence_started_at: now,
        last_touched_at: now,
        tags,
      })
      .eq('id', lead.id);

    sent += 1;
  }

  return json({ success: failed === 0, sent, failed, errors });
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function mergeTokens(input: string, lead: Record<string, unknown>): string {
  const map: Record<string, string> = {
    '#firstname': String(lead.first_name ?? ''),
    '#first_name': String(lead.first_name ?? ''),
    '#lastname': String(lead.last_name ?? ''),
    '#last_name': String(lead.last_name ?? ''),
    '#lead name': `${lead.first_name ?? ''} ${lead.last_name ?? ''}`.trim(),
    '#leadname': `${lead.first_name ?? ''} ${lead.last_name ?? ''}`.trim(),
    '#yoursignature':
      '<br/><br/>— MPB.Health Sales<br/>sales@mympb.com<br/>https://www.mympb.com',
    '#plan': String(lead.coverage_preference ?? ''),
    '#quote price': String(lead.monthly_premium ?? ''),
    '#email': String(lead.email ?? ''),
    '#phone': String(lead.phone ?? ''),
    '#zip': String(lead.zip_code ?? ''),
    '#zip_code': String(lead.zip_code ?? ''),
  };
  let out = input;
  for (const [token, value] of Object.entries(map)) {
    if (out.includes(token)) out = out.split(token).join(value);
  }
  return out;
}
