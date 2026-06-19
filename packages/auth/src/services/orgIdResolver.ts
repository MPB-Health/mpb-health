// ============================================================================
// Org ID resolver — Phase 1 canonical mapping (portal vs membership)
// Static fallbacks mirror organization_id_map in Supabase for offline resilience.
// ============================================================================

import { supabase } from '@mpbhealth/database';

export type OrgIdPurpose = 'portal' | 'membership';

export const MPB_HEALTH_SLUG = 'mpb-health';

/** Static map — keep in sync with organization_id_map migration. */
const STATIC_ORG_ID_BY_SLUG: Record<string, Record<OrgIdPurpose, string>> = {
  [MPB_HEALTH_SLUG]: {
    portal: 'a0000000-0000-0000-0000-000000000001',
    membership: '00000000-0000-4000-a000-000000000001',
  },
};

/** Synchronous resolver using the static map only (safe for hot paths). */
export function resolveOrgIdFromMap(
  slug: string,
  purpose: OrgIdPurpose = 'membership',
): string | null {
  const normalized = slug.trim().toLowerCase();
  return STATIC_ORG_ID_BY_SLUG[normalized]?.[purpose] ?? null;
}

/** Resolve org UUID by slug + purpose; falls back to static map if RPC unavailable. */
export async function resolveOrgId(
  slug: string,
  purpose: OrgIdPurpose = 'membership',
): Promise<string | null> {
  const fallback = resolveOrgIdFromMap(slug, purpose);
  try {
    const { data, error } = await supabase.rpc('resolve_org_id', {
      p_slug: slug,
      p_purpose: purpose,
    });
    if (!error && data) return String(data);
  } catch {
    // RPC may not exist in local dev until migration is applied
  }
  return fallback;
}

/** Map a known org UUID to the UUID used for another purpose (same slug). */
export async function translateOrgId(
  orgId: string,
  targetPurpose: OrgIdPurpose,
): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('translate_org_id', {
      p_org_id: orgId,
      p_target_purpose: targetPurpose,
    });
    if (!error && data) return String(data);
  } catch {
    // fall through to static map
  }

  for (const ids of Object.values(STATIC_ORG_ID_BY_SLUG)) {
    if (ids.portal === orgId || ids.membership === orgId) {
      return ids[targetPurpose];
    }
  }

  return orgId;
}

/** True when slug uses the same UUID for portal and membership. */
export function isUnifiedOrgSlug(slug: string): boolean {
  const portal = resolveOrgIdFromMap(slug, 'portal');
  const membership = resolveOrgIdFromMap(slug, 'membership');
  return Boolean(portal && membership && portal === membership);
}
