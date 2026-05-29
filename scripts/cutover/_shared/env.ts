/**
 * Shared env loader for `scripts/cutover/*` scripts.
 *
 * Loads variables from `.env`, `.env.local`, and `.env.cutover` (in that
 * order, first hit wins) so the cutover scripts can be run from a checkout
 * without polluting the main app `.env`.
 *
 * `.env.cutover` is git-ignored (`.env*.local` pattern + explicit gitignore
 * line — see `.gitignore`). Use it for one-shot provider tokens.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ENV_FILES = ['.env', '.env.local', '.env.cutover'];

function parseDotenv(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    // strip wrapping quotes
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

let LOADED = false;

export function loadEnv(): void {
  if (LOADED) return;
  for (const fname of ENV_FILES) {
    const full = join(process.cwd(), fname);
    if (!existsSync(full)) continue;
    const parsed = parseDotenv(readFileSync(full, 'utf8'));
    for (const [k, v] of Object.entries(parsed)) {
      if (process.env[k] == null || process.env[k] === '') process.env[k] = v;
    }
  }
  LOADED = true;
}

/** Throw if a required env var is missing. */
export function requireEnv(name: string, hint?: string): string {
  loadEnv();
  const v = process.env[name];
  if (!v) {
    const tail = hint ? `\n  → ${hint}` : '';
    throw new Error(`Missing required env var: ${name}${tail}`);
  }
  return v;
}

/** Read an env var, returning the default if unset. */
export function readEnv(name: string, fallback = ''): string {
  loadEnv();
  return process.env[name] ?? fallback;
}

/** True if the var is set to any truthy-ish value. */
export function flag(name: string): boolean {
  const v = readEnv(name).toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'y';
}

// ============================================================================
// Project refs / URLs — single source of truth so scripts agree
// ============================================================================

export const LEGACY_PROJECT_REF = 'dtmnkzllidaiqyheguhl';
export const ARYX_PROJECT_REF = 'knelbprqqbjggqfqvfmc';

export const LEGACY_FUNCTIONS_BASE =
  `https://${LEGACY_PROJECT_REF}.supabase.co/functions/v1`;
export const ARYX_FUNCTIONS_BASE =
  `https://${ARYX_PROJECT_REF}.supabase.co/functions/v1`;

export interface WebhookCutoverPaths {
  resendWebhook: string;
  calendarBookingWebhook: string;
  goToConnectIntegration: string;
  mailWebhook: string;
  socialLinkedInOAuthCallback: string;
}

/** Path-only catalog so callers can pick legacy/aryx base. */
export const WEBHOOK_PATHS: WebhookCutoverPaths = {
  resendWebhook: '/resend-webhook',
  calendarBookingWebhook: '/crm-calendar-booking-webhook',
  goToConnectIntegration: '/goto-connect-integration',
  mailWebhook: '/mail-webhook',
  socialLinkedInOAuthCallback: '/social-linkedin-oauth-callback',
};
