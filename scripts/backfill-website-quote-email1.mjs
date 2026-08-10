#!/usr/bin/env node
/**
 * One-shot backfill: send missed website Quote Email #1 for leads that landed
 * after the cadence/template rename (~2026-08-04) with no preliminary quote.
 *
 * Safety:
 *  - Expected-count gate (EXPECTED_COUNT)
 *  - Skip leads with any outbound crm_email_log
 *  - Kill switch: BACKFILL_ENABLED=true required
 *  - Idempotent: re-check preliminary_quote_sent_at before each send
 *
 * Usage:
 *   BACKFILL_ENABLED=true EXPECTED_COUNT=8 \
 *   SUPABASE_URL=https://knelbprqqbjggqfqvfmc.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   node scripts/backfill-website-quote-email1.mjs
 */

const ENABLED = process.env.BACKFILL_ENABLED === 'true';
const EXPECTED = Number(process.env.EXPECTED_COUNT || '0');
const DRY_RUN = process.env.DRY_RUN === 'true';
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ORG_ID = '00000000-0000-4000-a000-000000000001';
const TEMPLATE_ID = 'dd699908-5394-4ba7-a14d-1f0b9aed80e7';
const SOURCE_TAG = 'website_auto_response';
const FROM_EMAIL = 'sales@mympb.com';
const FROM_NAME = 'MPB.Health Sales';

if (!ENABLED) {
  console.error('Kill switch: set BACKFILL_ENABLED=true to run');
  process.exit(2);
}
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(2);
}

const headers = {
  Authorization: `Bearer ${SERVICE_KEY}`,
  apikey: SERVICE_KEY,
  'Content-Type': 'application/json',
};

async function rest(path, init = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { ...headers, Prefer: init.prefer || 'return=representation', ...(init.headers || {}) },
  });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    throw new Error(`${init.method || 'GET'} ${path} → ${res.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  }
  return body;
}

function mergeTokens(input, lead) {
  const map = {
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

async function main() {
  const candidates = await rest(
    `lead_submissions?select=id,email,first_name,last_name,phone,zip_code,coverage_preference,monthly_premium,tags,pipeline_stage,preliminary_quote_sent_at,source_cta,created_at` +
      `&org_id=eq.${ORG_ID}` +
      `&created_at=gte.2026-08-04T00:00:00Z` +
      `&preliminary_quote_sent_at=is.null` +
      `&source_cta=eq.hero-calculator-all-plans-comparison` +
      `&email=not.ilike.*@example.com` +
      `&email=not.ilike.*@resend.dev` +
      `&order=created_at.asc`,
  );

  const eligible = [];
  for (const lead of candidates) {
    if ((lead.tags || []).includes(SOURCE_TAG)) continue;
    const logs = await rest(
      `crm_email_log?select=id,status,direction&lead_id=eq.${lead.id}&direction=eq.outbound&limit=1`,
    );
    if (Array.isArray(logs) && logs.length > 0) {
      console.log(`skip ${lead.id} (${lead.email}): has outbound log`);
      continue;
    }
    eligible.push(lead);
  }

  console.log(`candidates_raw=${candidates.length} eligible=${eligible.length} expected=${EXPECTED}`);
  if (eligible.length !== EXPECTED) {
    console.error(`ABORT: expected ${EXPECTED} eligible leads, found ${eligible.length}`);
    process.exit(3);
  }

  const [tpl] = await rest(
    `crm_master_templates?select=id,subject,body,archived_at&id=eq.${TEMPLATE_ID}&archived_at=is.null&limit=1`,
  );
  if (!tpl?.subject || !tpl?.body) {
    console.error('ABORT: Quote Response #1 template missing or archived');
    process.exit(3);
  }

  let sent = 0;
  let failed = 0;

  for (const lead of eligible) {
    // Re-check kill / idempotency before each write
    const [fresh] = await rest(
      `lead_submissions?select=id,preliminary_quote_sent_at,tags&id=eq.${lead.id}&limit=1`,
    );
    if (!fresh || fresh.preliminary_quote_sent_at) {
      console.log(`skip ${lead.id}: already has preliminary_quote_sent_at`);
      continue;
    }

    const subject = mergeTokens(tpl.subject, lead);
    const html = mergeTokens(tpl.body, lead);

    if (DRY_RUN) {
      console.log(`[dry-run] would send to ${lead.email} subject=${subject}`);
      continue;
    }

    const sendResp = await fetch(`${SUPABASE_URL}/functions/v1/send-crm-email-v2`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        to: [lead.email],
        subject,
        html,
        from_email: FROM_EMAIL,
        from_name: FROM_NAME,
        reply_to: FROM_EMAIL,
        track_opens: true,
        track_clicks: true,
        tags: ['quote-response', 'website', 'auto-response', 'backfill-2026-08-10'],
        org_id: ORG_ID,
        lead_id: lead.id,
        master_template_id: TEMPLATE_ID,
        template_id: null,
        metadata: {
          source: 'backfill-website-quote-email1',
          attribution: SOURCE_TAG,
        },
      }),
    });

    if (!sendResp.ok) {
      const errText = await sendResp.text();
      console.error(`FAIL send ${lead.id} ${lead.email}: ${sendResp.status} ${errText}`);
      failed += 1;
      continue;
    }

    const now = new Date().toISOString();
    const tags = Array.from(new Set([...(fresh.tags || []), SOURCE_TAG, 'website_email1_backfill']));
    await rest(`lead_submissions?id=eq.${lead.id}`, {
      method: 'PATCH',
      prefer: 'return=minimal',
      body: JSON.stringify({
        pipeline_stage: 'quoted',
        stage_changed_at: now,
        preliminary_quote_sent_at: now,
        quote_cadence_started_at: now,
        last_touched_at: now,
        tags,
      }),
    });

    sent += 1;
    console.log(`OK ${lead.id} → ${lead.email}`);
    // Gentle pacing for Resend
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log(JSON.stringify({ sent, failed, dry_run: DRY_RUN }, null, 2));
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
