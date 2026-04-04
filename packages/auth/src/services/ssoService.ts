/**
 * ssoService - Unified cross-portal SSO dispatch
 *
 * Routes SSO navigation to the correct mechanism:
 *  - Same-project portals (admin, crm, advisors, website): token-in-hash transfer
 *    via `buildPortalSSOUrl` — no server roundtrip.
 *  - Cross-project portals (support/ITSTS): calls the `sso-itsts-login` edge
 *    function to generate a magic link on the ITSTS Supabase project.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getPortalUrl, PORTALS, type PortalKey } from '@mpbhealth/config';
import { buildPortalSSOUrl } from './portalSSO';

export interface SSOResult {
  url: string;
  /** 'hash' = token-in-hash (same Supabase project), 'edge' = magic link via edge function */
  method: 'hash' | 'edge';
}

const CROSS_PROJECT_PORTALS: ReadonlySet<PortalKey> = new Set(['support']);

/**
 * Get an SSO URL for the target portal, dispatching to the correct mechanism.
 *
 * @throws if no active session exists or the edge function call fails.
 */
export async function getPortalSSOUrl(
  portal: PortalKey,
  supabase: SupabaseClient,
): Promise<SSOResult> {
  if (CROSS_PROJECT_PORTALS.has(portal)) {
    return getCrossProjectSSOUrl(portal, supabase);
  }

  const url = await buildPortalSSOUrl(getPortalUrl(portal), supabase);
  if (!url) {
    throw new Error('No active session to transfer');
  }
  return { url, method: 'hash' };
}

/**
 * Whether a portal opens in a new tab by default (cross-project portals).
 */
export function shouldOpenInNewTab(portal: PortalKey): boolean {
  return PORTALS[portal]?.openInNewTab === true;
}

async function getCrossProjectSSOUrl(
  portal: PortalKey,
  supabase: SupabaseClient,
): Promise<SSOResult> {
  const edgeFunctionMap: Record<string, string> = {
    support: 'sso-itsts-login',
  };

  const fnName = edgeFunctionMap[portal];
  if (!fnName) {
    throw new Error(`No SSO edge function configured for portal: ${portal}`);
  }

  const { data, error } = await supabase.functions.invoke<{
    success: boolean;
    url?: string;
    error?: string;
  }>(fnName);

  if (error) {
    const msg = error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : 'SSO request failed';
    throw new Error(msg);
  }

  if (!data?.success || !data.url) {
    throw new Error(data?.error || 'No SSO URL returned');
  }

  return { url: data.url, method: 'edge' };
}

export const ssoService = {
  getPortalSSOUrl,
  shouldOpenInNewTab,
};
