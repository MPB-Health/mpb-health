#!/usr/bin/env -S npx tsx
/**
 * Repoint Calendly webhook subscriptions: legacy → ARYX.
 *
 * Calendly webhooks are API-managed (no UI for editing the URL once created),
 * so this script:
 *   1. Lists every webhook subscription owned by your token.
 *   2. For each one whose `callback_url` points at the legacy project ref
 *      (`dtmnkzllidaiqyheguhl`), records its scope + signing key, deletes it,
 *      and creates a fresh subscription pointing at ARYX with the same scope.
 *   3. Prints a summary table.
 *
 * Dry-run by default (no destructive ops). Pass `--apply` to actually mutate.
 *
 * Required env (place in `.env.cutover`):
 *   CALENDLY_PERSONAL_ACCESS_TOKEN  Personal access token w/ webhook scope
 *   CALENDLY_ORGANIZATION_URI       e.g. https://api.calendly.com/organizations/AAAAAAAAAAAAAAAA
 *   CALENDLY_USER_URI               (optional) per-user webhook scope target
 *   CALENDLY_SIGNING_KEY            (optional) shared signing key for new subs
 *
 * Usage:
 *   npx tsx scripts/cutover/repoint-calendly.ts          # dry run
 *   npx tsx scripts/cutover/repoint-calendly.ts --apply  # commit
 *
 * Docs: https://developer.calendly.com/api-docs/webhook-subscriptions
 */

import {
  ARYX_FUNCTIONS_BASE,
  LEGACY_PROJECT_REF,
  WEBHOOK_PATHS,
  loadEnv,
  readEnv,
  requireEnv,
} from './_shared/env.ts';
import { createLogger } from './_shared/log.ts';

loadEnv();
const log = createLogger('calendly');

const TOKEN = requireEnv(
  'CALENDLY_PERSONAL_ACCESS_TOKEN',
  'Create one at https://calendly.com/integrations/api_webhooks',
);
const ORG_URI = requireEnv(
  'CALENDLY_ORGANIZATION_URI',
  'GET https://api.calendly.com/users/me to find your organization URI',
);
const USER_URI = readEnv('CALENDLY_USER_URI');
const SIGNING_KEY = readEnv('CALENDLY_SIGNING_KEY');

const APPLY = process.argv.includes('--apply');
const NEW_URL = `${ARYX_FUNCTIONS_BASE}${WEBHOOK_PATHS.calendarBookingWebhook}`;

interface CalendlyWebhook {
  uri: string;
  callback_url: string;
  events: string[];
  scope: 'organization' | 'user';
  organization?: string;
  user?: string;
  state: string;
  created_at: string;
}

async function calendly(
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<{ status: number; data: unknown }> {
  const res = await fetch(`https://api.calendly.com${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body == null ? undefined : JSON.stringify(body),
  });
  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  return { status: res.status, data };
}

async function listSubscriptions(scope: 'organization' | 'user'): Promise<CalendlyWebhook[]> {
  const params = new URLSearchParams({
    organization: ORG_URI,
    scope,
    count: '100',
  });
  if (scope === 'user') {
    if (!USER_URI) return [];
    params.set('user', USER_URI);
  }
  const out: CalendlyWebhook[] = [];
  let next: string | null = `/webhook_subscriptions?${params.toString()}`;
  while (next) {
    const { status, data } = await calendly('GET', next);
    if (status !== 200 || !data || typeof data !== 'object') {
      throw new Error(`list ${scope} subs failed: HTTP ${status} ${JSON.stringify(data)}`);
    }
    const d = data as { collection?: CalendlyWebhook[]; pagination?: { next_page?: string | null } };
    if (Array.isArray(d.collection)) out.push(...d.collection);
    next = d.pagination?.next_page
      ? d.pagination.next_page.replace(/^https?:\/\/api\.calendly\.com/, '')
      : null;
  }
  return out;
}

async function createSubscription(
  events: string[],
  scope: 'organization' | 'user',
): Promise<CalendlyWebhook> {
  const body: Record<string, unknown> = {
    url: NEW_URL,
    events,
    organization: ORG_URI,
    scope,
  };
  if (scope === 'user' && USER_URI) body.user = USER_URI;
  if (SIGNING_KEY) body.signing_key = SIGNING_KEY;

  const { status, data } = await calendly('POST', '/webhook_subscriptions', body);
  if (status !== 201) {
    throw new Error(`create sub failed: HTTP ${status} ${JSON.stringify(data)}`);
  }
  const resource = (data as { resource?: CalendlyWebhook }).resource;
  if (!resource) throw new Error('create sub: missing resource in response');
  return resource;
}

async function deleteSubscription(uri: string): Promise<void> {
  const path = uri.replace(/^https?:\/\/api\.calendly\.com/, '');
  const { status, data } = await calendly('DELETE', path);
  if (status !== 204) {
    throw new Error(`delete ${path} failed: HTTP ${status} ${JSON.stringify(data)}`);
  }
}

async function main(): Promise<void> {
  log.info('starting cutover', { apply: APPLY, target_url: NEW_URL });

  const orgSubs = await listSubscriptions('organization');
  const userSubs = USER_URI ? await listSubscriptions('user') : [];
  const all = [...orgSubs, ...userSubs];
  log.info('discovered subscriptions', {
    total: all.length,
    organization: orgSubs.length,
    user: userSubs.length,
  });

  const stale = all.filter((w) => w.callback_url.includes(LEGACY_PROJECT_REF));
  const onTarget = all.filter((w) => w.callback_url === NEW_URL);
  const other = all.filter(
    (w) => !w.callback_url.includes(LEGACY_PROJECT_REF) && w.callback_url !== NEW_URL,
  );

  log.info('classified', {
    stale_legacy: stale.length,
    already_aryx: onTarget.length,
    other_external: other.length,
  });

  for (const w of stale) {
    const tag = `${w.scope}:${w.uri.split('/').pop()}`;
    log.info(`stale → ${tag}`, { events: w.events, callback: w.callback_url });
    if (!APPLY) continue;

    try {
      const created = await createSubscription(w.events, w.scope);
      log.ok(`created replacement → ${tag}`, { new_uri: created.uri });
      await deleteSubscription(w.uri);
      log.ok(`deleted legacy → ${tag}`);
    } catch (err) {
      log.error(`cutover failed for ${tag}`, { error: String(err) });
      throw err;
    }
  }

  if (!APPLY) {
    log.warn('dry-run only — re-run with --apply to commit changes');
  } else if (stale.length === 0) {
    log.ok('nothing to do — no legacy webhooks found');
  } else {
    log.ok('cutover complete', {
      replaced: stale.length,
    });
  }
}

main().catch((err) => {
  log.error('fatal', { error: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
