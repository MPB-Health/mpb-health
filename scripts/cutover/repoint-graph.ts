#!/usr/bin/env -S npx tsx
/**
 * Repoint Microsoft Graph change-notification subscriptions: legacy → ARYX.
 *
 * Graph subscriptions are immutable on `notificationUrl` — you can only PATCH
 * `expirationDateTime` and `clientState`. So the cutover is delete + recreate.
 *
 * This script:
 *   1. Acquires an app token (client_credentials flow, no user prompt).
 *   2. Lists every active subscription owned by the app.
 *   3. For each one whose `notificationUrl` points at the legacy project:
 *      a. Records its resource, changeType, clientState, expirationDateTime.
 *      b. Recreates with the same shape against the ARYX URL.
 *      c. Deletes the legacy subscription (only on POST success).
 *   4. Prints a per-account summary and updates `mail_accounts.provider_metadata`
 *      (subscription_id) on ARYX so `mail-webhook` can route notifications.
 *
 * Note: Graph subscriptions auto-expire ≤ 3 days. Even if you do nothing, every
 * subscription in the app dies on its own within 72h. Running this script
 * forces an immediate cut so we don't lose 0–3 days of mail sync events.
 *
 * Required env (place in `.env.cutover`):
 *   MS_GRAPH_TENANT_ID       Azure AD tenant ID
 *   MS_GRAPH_CLIENT_ID       App registration client ID
 *   MS_GRAPH_CLIENT_SECRET   App registration client secret
 *   MS_WEBHOOK_SECRET        Shared secret for `clientState` validation
 *                            (must match the same Supabase Edge Function secret)
 *   ARYX_SUPABASE_SERVICE_ROLE_KEY  (optional) For updating mail_accounts on ARYX
 *
 * Usage:
 *   npx tsx scripts/cutover/repoint-graph.ts          # dry run
 *   npx tsx scripts/cutover/repoint-graph.ts --apply  # commit
 *
 * Docs: https://learn.microsoft.com/graph/api/resources/subscription
 */

import {
  ARYX_FUNCTIONS_BASE,
  ARYX_PROJECT_REF,
  LEGACY_PROJECT_REF,
  WEBHOOK_PATHS,
  loadEnv,
  readEnv,
  requireEnv,
} from './_shared/env.ts';
import { createLogger } from './_shared/log.ts';

loadEnv();
const log = createLogger('graph');

const TENANT_ID = requireEnv('MS_GRAPH_TENANT_ID');
const CLIENT_ID = requireEnv('MS_GRAPH_CLIENT_ID');
const CLIENT_SECRET = requireEnv('MS_GRAPH_CLIENT_SECRET');
const WEBHOOK_SECRET = requireEnv(
  'MS_WEBHOOK_SECRET',
  'Must match the MS_WEBHOOK_SECRET edge-function secret on ARYX',
);
const ARYX_SERVICE_ROLE = readEnv('ARYX_SUPABASE_SERVICE_ROLE_KEY');

const APPLY = process.argv.includes('--apply');
const NEW_URL =
  `${ARYX_FUNCTIONS_BASE}${WEBHOOK_PATHS.mailWebhook}?provider=microsoft365`;

interface GraphSubscription {
  id: string;
  resource: string;
  changeType: string;
  notificationUrl: string;
  expirationDateTime: string;
  clientState?: string;
  applicationId?: string;
  creatorId?: string;
  latestSupportedTlsVersion?: string;
  includeResourceData?: boolean;
  encryptionCertificate?: string | null;
  encryptionCertificateId?: string | null;
}

async function getAppToken(): Promise<string> {
  const url = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'client_credentials',
    scope: 'https://graph.microsoft.com/.default',
  });
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`token: HTTP ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error('token: missing access_token');
  return json.access_token;
}

async function graph(
  token: string,
  method: 'GET' | 'POST' | 'DELETE' | 'PATCH',
  path: string,
  body?: unknown,
): Promise<{ status: number; data: unknown }> {
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
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

async function listSubscriptions(token: string): Promise<GraphSubscription[]> {
  const out: GraphSubscription[] = [];
  let next: string | null = '/subscriptions';
  while (next) {
    const { status, data } = await graph(token, 'GET', next);
    if (status !== 200 || !data || typeof data !== 'object') {
      throw new Error(`list subs: HTTP ${status} ${JSON.stringify(data)}`);
    }
    const d = data as {
      value?: GraphSubscription[];
      '@odata.nextLink'?: string;
    };
    if (Array.isArray(d.value)) out.push(...d.value);
    const nl = d['@odata.nextLink'];
    next = nl ? nl.replace(/^https?:\/\/graph\.microsoft\.com\/v1\.0/, '') : null;
  }
  return out;
}

async function createSubscription(
  token: string,
  template: GraphSubscription,
): Promise<GraphSubscription> {
  // Graph caps TTLs by resource. Re-use the template TTL minus a small buffer
  // to play nicely with whatever cap it had previously.
  const expiration = new Date(template.expirationDateTime);
  if (expiration.getTime() < Date.now() + 60 * 60 * 1000) {
    // ≤1h remaining → bump to +60m so the new sub is healthy
    expiration.setTime(Date.now() + 60 * 60 * 1000);
  }
  const body: Record<string, unknown> = {
    resource: template.resource,
    changeType: template.changeType,
    notificationUrl: NEW_URL,
    clientState: WEBHOOK_SECRET,
    expirationDateTime: expiration.toISOString(),
  };
  if (template.latestSupportedTlsVersion) {
    body.latestSupportedTlsVersion = template.latestSupportedTlsVersion;
  }

  const { status, data } = await graph(token, 'POST', '/subscriptions', body);
  if (status !== 201) {
    throw new Error(`create sub: HTTP ${status} ${JSON.stringify(data)}`);
  }
  return data as GraphSubscription;
}

async function deleteSubscription(token: string, id: string): Promise<void> {
  const { status, data } = await graph(token, 'DELETE', `/subscriptions/${id}`);
  if (status !== 204 && status !== 404) {
    throw new Error(`delete ${id}: HTTP ${status} ${JSON.stringify(data)}`);
  }
}

async function updateMailAccountSubscription(
  oldId: string,
  newId: string,
): Promise<void> {
  if (!ARYX_SERVICE_ROLE) return;
  const url =
    `https://${ARYX_PROJECT_REF}.supabase.co/rest/v1/mail_accounts` +
    `?provider=eq.microsoft365&provider_metadata->>subscription_id=eq.${encodeURIComponent(oldId)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'apikey': ARYX_SERVICE_ROLE,
      'Authorization': `Bearer ${ARYX_SERVICE_ROLE}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      provider_metadata: { subscription_id: newId },
    }),
  });
  if (!res.ok) {
    log.warn('mail_accounts update failed', {
      status: res.status,
      old: oldId,
      new: newId,
      body: await res.text(),
    });
  }
}

async function main(): Promise<void> {
  log.info('starting cutover', { apply: APPLY, target_url: NEW_URL });

  const token = await getAppToken();
  const subs = await listSubscriptions(token);
  log.info('discovered subscriptions', { total: subs.length });

  const stale = subs.filter((s) => s.notificationUrl.includes(LEGACY_PROJECT_REF));
  const onTarget = subs.filter((s) =>
    s.notificationUrl.startsWith(`${ARYX_FUNCTIONS_BASE}${WEBHOOK_PATHS.mailWebhook}`),
  );
  log.info('classified', {
    stale_legacy: stale.length,
    already_aryx: onTarget.length,
    other_external: subs.length - stale.length - onTarget.length,
  });

  let cut = 0;
  for (const s of stale) {
    const tag = `${s.changeType} ${s.resource}`;
    log.info(`stale → ${s.id}`, { tag, expires: s.expirationDateTime });
    if (!APPLY) continue;
    try {
      const created = await createSubscription(token, s);
      log.ok(`created replacement → ${s.id} → ${created.id}`, { resource: s.resource });
      await deleteSubscription(token, s.id);
      log.ok(`deleted legacy → ${s.id}`);
      await updateMailAccountSubscription(s.id, created.id);
      cut += 1;
    } catch (err) {
      log.error(`cutover failed for ${s.id}`, { error: String(err) });
      throw err;
    }
  }

  if (!APPLY) {
    log.warn('dry-run only — re-run with --apply to commit changes');
  } else if (stale.length === 0) {
    log.ok('nothing to do — no legacy subscriptions found');
  } else {
    log.ok('cutover complete', { replaced: cut });
  }
}

main().catch((err) => {
  log.error('fatal', { error: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
