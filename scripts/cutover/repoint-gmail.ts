#!/usr/bin/env -S npx tsx
/**
 * Repoint Gmail push notifications: legacy → ARYX.
 *
 * Gmail sends push notifications via Google Cloud Pub/Sub. The chain is:
 *
 *   Gmail (users.watch)
 *     → Pub/Sub topic
 *     → Pub/Sub push subscription with `pushEndpoint = <our webhook>`
 *     → mail-webhook?provider=gmail
 *
 * Cutting over means:
 *   1. Walking every push subscription in our project's topic that pushes to
 *      the legacy `dtmnkzllidaiqyheguhl` URL and either rewriting or
 *      replacing them with one pointing at ARYX.
 *   2. Re-issuing `users.watch` for every connected mailbox so the mailbox
 *      keeps emitting events to the (now ARYX-bound) topic.
 *
 * This script focuses on (1) — rewriting Pub/Sub push endpoints. (2) requires
 * a per-user OAuth refresh token, which we keep in `mail_accounts`. We list
 * the connected mailboxes from the ARYX `mail_accounts` table and re-issue
 * `users.watch` against the same topic the existing subscriptions push to.
 *
 * Required env (place in `.env.cutover`):
 *   GOOGLE_PROJECT_ID                       e.g. mpb-prod-123456
 *   GOOGLE_PUBSUB_TOPIC                     e.g. projects/mpb-prod-123456/topics/gmail-events
 *   GOOGLE_SERVICE_ACCOUNT_JSON             Inline JSON or a path to the key file
 *                                           Needs roles/pubsub.editor + Domain-wide
 *                                           Delegation if you watch others' mailboxes
 *   ARYX_SUPABASE_SERVICE_ROLE_KEY          For reading mail_accounts on ARYX
 *
 * Usage:
 *   npx tsx scripts/cutover/repoint-gmail.ts          # dry run
 *   npx tsx scripts/cutover/repoint-gmail.ts --apply  # commit
 *
 * Docs:
 *   https://developers.google.com/gmail/api/guides/push
 *   https://cloud.google.com/pubsub/docs/admin
 */

import { existsSync, readFileSync } from 'node:fs';
import { createSign } from 'node:crypto';

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
const log = createLogger('gmail');

const GOOGLE_PROJECT_ID = requireEnv('GOOGLE_PROJECT_ID');
const PUBSUB_TOPIC = requireEnv(
  'GOOGLE_PUBSUB_TOPIC',
  'Full topic path: projects/<project>/topics/<name>',
);
const SA_RAW = requireEnv(
  'GOOGLE_SERVICE_ACCOUNT_JSON',
  'Either inline JSON or a path to the key file',
);
const ARYX_SERVICE_ROLE = readEnv('ARYX_SUPABASE_SERVICE_ROLE_KEY');

const APPLY = process.argv.includes('--apply');
const NEW_URL =
  `${ARYX_FUNCTIONS_BASE}${WEBHOOK_PATHS.mailWebhook}?provider=gmail`;

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

function loadServiceAccount(): ServiceAccountKey {
  const candidate = SA_RAW.trim();
  let raw = candidate;
  if (existsSync(candidate)) {
    raw = readFileSync(candidate, 'utf8');
  }
  const parsed = JSON.parse(raw) as ServiceAccountKey;
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON missing client_email/private_key');
  }
  return parsed;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function getAccessToken(scopes: string[]): Promise<string> {
  const sa = loadServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: sa.client_email,
    scope: scopes.join(' '),
    aud: sa.token_uri ?? 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };
  const header = { alg: 'RS256', typ: 'JWT' };
  const segments = [
    base64url(JSON.stringify(header)),
    base64url(JSON.stringify(claim)),
  ];
  const signer = createSign('RSA-SHA256');
  signer.update(segments.join('.'));
  signer.end();
  const sig = base64url(signer.sign(sa.private_key));
  const jwt = `${segments.join('.')}.${sig}`;

  const tokenUri = sa.token_uri ?? 'https://oauth2.googleapis.com/token';
  const res = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error(`oauth: HTTP ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error('oauth: missing access_token');
  return json.access_token;
}

interface OidcToken {
  serviceAccountEmail: string;
  audience?: string;
}

interface PushConfig {
  pushEndpoint?: string;
  attributes?: Record<string, string>;
  oidcToken?: OidcToken;
}

interface PubSubSubscription {
  name: string;
  topic: string;
  pushConfig?: PushConfig;
}

async function listSubscriptions(token: string): Promise<PubSubSubscription[]> {
  const out: PubSubSubscription[] = [];
  let pageToken: string | undefined;
  while (true) {
    const params = new URLSearchParams();
    if (pageToken) params.set('pageToken', pageToken);
    const url =
      `https://pubsub.googleapis.com/v1/projects/${GOOGLE_PROJECT_ID}/subscriptions` +
      (params.size ? `?${params.toString()}` : '');
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`list subs: HTTP ${res.status} ${await res.text()}`);
    const json = (await res.json()) as {
      subscriptions?: PubSubSubscription[];
      nextPageToken?: string;
    };
    if (json.subscriptions) out.push(...json.subscriptions);
    pageToken = json.nextPageToken;
    if (!pageToken) break;
  }
  // Filter to subscriptions on our topic only.
  return out.filter((s) => s.topic === PUBSUB_TOPIC);
}

async function modifyPushEndpoint(
  token: string,
  subscriptionName: string,
  newEndpoint: string,
  oidcToken?: OidcToken,
): Promise<void> {
  // ModifyPushConfig allows in-place rewrite without delete/recreate.
  const url =
    `https://pubsub.googleapis.com/v1/${subscriptionName}:modifyPushConfig`;
  const body: Record<string, unknown> = {
    pushConfig: {
      pushEndpoint: newEndpoint,
      ...(oidcToken
        ? {
            oidcToken: {
              serviceAccountEmail: oidcToken.serviceAccountEmail,
              audience: oidcToken.audience ?? newEndpoint,
            },
          }
        : {}),
    },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(
      `modifyPushConfig ${subscriptionName}: HTTP ${res.status} ${await res.text()}`,
    );
  }
}

interface MailAccountRow {
  id: string;
  user_id: string;
  email: string;
  refresh_token: string | null;
  provider_metadata: Record<string, unknown> | null;
}

async function fetchGmailAccountsFromAryx(): Promise<MailAccountRow[]> {
  if (!ARYX_SERVICE_ROLE) {
    log.warn('skipping users.watch refresh — ARYX_SUPABASE_SERVICE_ROLE_KEY not set');
    return [];
  }
  const url =
    `https://${ARYX_PROJECT_REF}.supabase.co/rest/v1/mail_accounts` +
    `?provider=eq.gmail&select=id,user_id,email,refresh_token,provider_metadata`;
  const res = await fetch(url, {
    headers: {
      'apikey': ARYX_SERVICE_ROLE,
      'Authorization': `Bearer ${ARYX_SERVICE_ROLE}`,
    },
  });
  if (!res.ok) {
    log.warn('mail_accounts fetch failed', { status: res.status });
    return [];
  }
  return (await res.json()) as MailAccountRow[];
}

async function refreshUserAccessToken(refreshToken: string): Promise<string | null> {
  const sa = loadServiceAccount();
  // Service account approach uses scope-specific JWT; refresh tokens used here
  // assume Google OAuth client credentials. We only need them if NOT using
  // domain-wide delegation. Keep this no-op-on-failure so the rest of the
  // script still works for org-wide delegated setups.
  if (!process.env.GOOGLE_OAUTH_CLIENT_ID || !process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
    return null;
  }
  void sa;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string };
  return json.access_token ?? null;
}

async function reissueWatch(
  account: MailAccountRow,
): Promise<{ historyId?: string; expiration?: string } | null> {
  if (!account.refresh_token) {
    log.warn('skipping watch refresh — no refresh_token', { email: account.email });
    return null;
  }
  const accessToken = await refreshUserAccessToken(account.refresh_token);
  if (!accessToken) {
    log.warn('skipping watch refresh — could not mint user token', {
      email: account.email,
    });
    return null;
  }
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(account.email)}/watch`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topicName: PUBSUB_TOPIC,
        labelIds: ['INBOX'],
        labelFilterBehavior: 'INCLUDE',
      }),
    },
  );
  if (!res.ok) {
    log.warn('watch refresh failed', { email: account.email, status: res.status });
    return null;
  }
  return (await res.json()) as { historyId?: string; expiration?: string };
}

async function main(): Promise<void> {
  log.info('starting cutover', {
    apply: APPLY,
    project: GOOGLE_PROJECT_ID,
    topic: PUBSUB_TOPIC,
    target_url: NEW_URL,
  });

  const token = await getAccessToken([
    'https://www.googleapis.com/auth/pubsub',
    'https://www.googleapis.com/auth/cloud-platform',
  ]);

  const subs = await listSubscriptions(token);
  log.info('subscriptions on topic', { total: subs.length });

  const stale = subs.filter(
    (s) => s.pushConfig?.pushEndpoint?.includes(LEGACY_PROJECT_REF) ?? false,
  );
  const onTarget = subs.filter((s) => s.pushConfig?.pushEndpoint === NEW_URL);

  log.info('classified', {
    stale_legacy: stale.length,
    already_aryx: onTarget.length,
    other_external: subs.length - stale.length - onTarget.length,
  });

  for (const s of stale) {
    log.info(`stale → ${s.name}`, { endpoint: s.pushConfig?.pushEndpoint });
    if (!APPLY) continue;
    try {
      await modifyPushEndpoint(token, s.name, NEW_URL, s.pushConfig?.oidcToken);
      log.ok(`endpoint rewritten → ${s.name}`);
    } catch (err) {
      log.error(`rewrite failed for ${s.name}`, { error: String(err) });
      throw err;
    }
  }

  // Optional: re-issue users.watch for every Gmail account on ARYX so we
  // don't lose 0–7 days of historyId continuity. Watch self-renews after
  // 7 days, so this is mainly for confidence after a topic change.
  const accounts = await fetchGmailAccountsFromAryx();
  log.info('gmail accounts on aryx', { total: accounts.length });
  if (APPLY) {
    for (const a of accounts) {
      const result = await reissueWatch(a);
      if (result) {
        log.ok(`re-issued watch → ${a.email}`, {
          historyId: result.historyId,
          expiration: result.expiration,
        });
      }
    }
  }

  if (!APPLY) {
    log.warn('dry-run only — re-run with --apply to commit changes');
  } else if (stale.length === 0 && accounts.length === 0) {
    log.ok('nothing to do — no legacy subscriptions or Gmail accounts found');
  } else {
    log.ok('cutover complete', {
      subs_rewritten: stale.length,
      watches_re_issued: accounts.length,
    });
  }
}

main().catch((err) => {
  log.error('fatal', { error: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
