#!/usr/bin/env -S npx tsx
/**
 * Watchdog: check whether the legacy Supabase project is still receiving
 * traffic on the webhook functions we cut over.
 *
 * During the safety window (May 28 → June 11), this should run daily.
 * Wire it into a GitHub Actions cron, a Vercel Cron Job pointed at a small
 * `/api/cron/legacy-watchdog` route, or a local launchd plist — whatever
 * matches your team's monitoring style.
 *
 * Behaviour:
 *   1. Pulls request counts (last 24h) from the Supabase Management API
 *      analytics endpoint for both projects.
 *   2. For each webhook function (resend-webhook, mail-webhook, etc.),
 *      compares legacy counts vs ARYX counts.
 *   3. Alerts (Resend email + non-zero exit) if legacy > ALERT_THRESHOLD.
 *   4. Writes a JSON summary to stdout for piping into dashboards.
 *
 * Required env (place in `.env.cutover` or CI secrets):
 *   SUPABASE_ACCESS_TOKEN     Personal access token w/ org read scope
 *                             (https://supabase.com/dashboard/account/tokens)
 *   RESEND_API_KEY            For alert emails (optional — skip alerts if unset)
 *   WATCHDOG_ALERT_TO         CSV list of email addresses to notify on legacy traffic
 *   WATCHDOG_ALERT_THRESHOLD  Default 0 — flag legacy traffic > N invocations/24h
 *
 * Usage:
 *   npx tsx scripts/cutover/check-legacy-traffic.ts
 */

import {
  ARYX_PROJECT_REF,
  LEGACY_PROJECT_REF,
  loadEnv,
  readEnv,
  requireEnv,
} from './_shared/env.ts';
import { createLogger } from './_shared/log.ts';

loadEnv();
const log = createLogger('watchdog');

const ACCESS_TOKEN = requireEnv(
  'SUPABASE_ACCESS_TOKEN',
  'Generate one at https://supabase.com/dashboard/account/tokens (Org → Read)',
);
const RESEND_KEY = readEnv('RESEND_API_KEY');
const ALERT_TO = readEnv('WATCHDOG_ALERT_TO')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const ALERT_THRESHOLD = parseInt(readEnv('WATCHDOG_ALERT_THRESHOLD', '0'), 10);

/**
 * The webhook functions that should ONLY be receiving traffic on ARYX after
 * the cutover. Anything > ALERT_THRESHOLD on legacy means a provider didn't
 * get repointed.
 */
const TRACKED_FUNCTIONS = [
  'resend-webhook',
  'crm-calendar-booking-webhook',
  'goto-connect-integration',
  'mail-webhook',
  'social-linkedin-oauth-callback',
] as const;

type TrackedFunction = typeof TRACKED_FUNCTIONS[number];

interface LogfaceQueryRow {
  function_id: string;
  function_name: string;
  status_code: number | null;
  count: number;
}

interface LogfaceQueryResponse {
  result?: LogfaceQueryRow[];
  error?: string | null;
}

/**
 * Use the Logflare-backed `analytics_buckets/v1/projects/<ref>/analytics/endpoints/logs.functions`
 * endpoint to count invocations per function per status code over the last 24h.
 */
async function getCounts(projectRef: string): Promise<Record<string, number>> {
  const sql = `
    SELECT
      m.function_name AS function_name,
      f.status_code AS status_code,
      COUNT(*) AS count
    FROM
      function_edge_logs f
      CROSS JOIN UNNEST(metadata) AS m
    WHERE
      f.timestamp > timestamp_sub(current_timestamp(), interval 1 day)
    GROUP BY
      function_name, status_code
  `.replace(/\s+/g, ' ').trim();

  const url =
    `https://api.supabase.com/v1/projects/${projectRef}/analytics/endpoints/logs.functions` +
    `?sql=${encodeURIComponent(sql)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
  });
  if (!res.ok) {
    throw new Error(`logs.functions ${projectRef}: HTTP ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as LogfaceQueryResponse;
  if (!json.result) return {};

  const totals: Record<string, number> = {};
  for (const row of json.result) {
    if (!row.function_name) continue;
    totals[row.function_name] = (totals[row.function_name] ?? 0) + Number(row.count);
  }
  return totals;
}

interface ProjectSummary {
  project_ref: string;
  totals: Record<string, number>;
}

async function gather(): Promise<{ legacy: ProjectSummary; aryx: ProjectSummary }> {
  const [legacy, aryx] = await Promise.all([
    getCounts(LEGACY_PROJECT_REF),
    getCounts(ARYX_PROJECT_REF),
  ]);
  return {
    legacy: { project_ref: LEGACY_PROJECT_REF, totals: legacy },
    aryx: { project_ref: ARYX_PROJECT_REF, totals: aryx },
  };
}

function buildReport(
  legacy: ProjectSummary,
  aryx: ProjectSummary,
): {
  rows: Array<{
    fn: TrackedFunction;
    legacy: number;
    aryx: number;
    flagged: boolean;
  }>;
  flagged: number;
  total_legacy: number;
  total_aryx: number;
} {
  let flagged = 0;
  let total_legacy = 0;
  let total_aryx = 0;
  const rows = TRACKED_FUNCTIONS.map((fn) => {
    const l = legacy.totals[fn] ?? 0;
    const a = aryx.totals[fn] ?? 0;
    const f = l > ALERT_THRESHOLD;
    if (f) flagged += 1;
    total_legacy += l;
    total_aryx += a;
    return { fn, legacy: l, aryx: a, flagged: f };
  });
  return { rows, flagged, total_legacy, total_aryx };
}

async function sendAlert(report: ReturnType<typeof buildReport>): Promise<void> {
  if (!RESEND_KEY || ALERT_TO.length === 0) {
    log.warn('alert skipped — RESEND_API_KEY or WATCHDOG_ALERT_TO unset');
    return;
  }
  const offenders = report.rows.filter((r) => r.flagged);
  if (offenders.length === 0) return;

  const html = `
    <h2>Legacy Supabase project still receiving traffic</h2>
    <p>The cutover safety window watchdog detected unexpected traffic on
    legacy project <code>${LEGACY_PROJECT_REF}</code> in the last 24h.</p>
    <table border="1" cellpadding="6" cellspacing="0">
      <thead><tr><th>Function</th><th>Legacy</th><th>ARYX</th></tr></thead>
      <tbody>
        ${offenders
          .map(
            (r) =>
              `<tr><td>${r.fn}</td><td>${r.legacy}</td><td>${r.aryx}</td></tr>`,
          )
          .join('')}
      </tbody>
    </table>
    <p>Threshold: > ${ALERT_THRESHOLD} invocations / 24h.</p>
  `;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'ARYX cutover watchdog <notifications@mpb.health>',
      to: ALERT_TO,
      subject: `[ARYX] Legacy traffic detected on ${offenders.length} function(s)`,
      html,
    }),
  });
  if (!res.ok) {
    log.warn('resend send failed', { status: res.status, body: await res.text() });
  } else {
    log.ok('alert sent', { to: ALERT_TO, offenders: offenders.length });
  }
}

async function main(): Promise<void> {
  log.info('gathering counts', {
    legacy: LEGACY_PROJECT_REF,
    aryx: ARYX_PROJECT_REF,
    threshold: ALERT_THRESHOLD,
  });
  const { legacy, aryx } = await gather();
  const report = buildReport(legacy, aryx);

  // Print a clean per-function table to stdout so dashboards can parse it.
  for (const row of report.rows) {
    log.info(`fn:${row.fn}`, {
      legacy: row.legacy,
      aryx: row.aryx,
      flagged: row.flagged,
    });
  }

  log.info('summary', {
    flagged_functions: report.flagged,
    total_legacy_invocations: report.total_legacy,
    total_aryx_invocations: report.total_aryx,
  });

  // Emit a machine-readable line for piping
  console.log(
    `WATCHDOG_JSON ${JSON.stringify({
      generated_at: new Date().toISOString(),
      threshold: ALERT_THRESHOLD,
      ...report,
    })}`,
  );

  if (report.flagged > 0) {
    log.error(`legacy traffic detected on ${report.flagged} function(s)`);
    await sendAlert(report);
    process.exit(2);
  } else {
    log.ok('clean — no legacy traffic detected');
  }
}

main().catch((err) => {
  log.error('fatal', { error: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
