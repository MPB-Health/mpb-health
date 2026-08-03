// Shared org ID map for edge functions (mirrors organization_id_map + packages/auth).

export type OrgIdPurpose = "portal" | "membership";

export const MPB_HEALTH_SLUG = "mpb-health";

/** Accounts-canonical slug for MPB (ARYX Accounts SoT). */
export const MPB_ACCOUNTS_SLUG = "mpb";

const MPB_ORG_IDS: Record<OrgIdPurpose, string> = {
  portal: "a0000000-0000-0000-0000-000000000001",
  membership: "00000000-0000-4000-a000-000000000001",
};

/** Static map — keep in sync with packages/auth orgIdResolver (MPB-only). */
const STATIC_ORG_ID_BY_SLUG: Record<string, Record<OrgIdPurpose, string>> = {
  [MPB_HEALTH_SLUG]: MPB_ORG_IDS,
  [MPB_ACCOUNTS_SLUG]: MPB_ORG_IDS,
};

export function resolveOrgIdFromMap(
  slug: string,
  purpose: OrgIdPurpose = "membership",
): string | null {
  const normalized = slug.trim().toLowerCase();
  return STATIC_ORG_ID_BY_SLUG[normalized]?.[purpose] ?? null;
}

export function translateOrgIdStatic(
  orgId: string,
  targetPurpose: OrgIdPurpose = "membership",
): string {
  for (const ids of Object.values(STATIC_ORG_ID_BY_SLUG)) {
    if (ids.portal === orgId || ids.membership === orgId) {
      return ids[targetPurpose];
    }
  }
  return orgId;
}

/** MPB CRM / org_memberships UUID */
export const MPB_MEMBERSHIP_ORG_ID =
  resolveOrgIdFromMap(MPB_HEALTH_SLUG, "membership")!;

/** MPB portal registry UUID (org_portal_access, concierge CMS) */
export const MPB_PORTAL_ORG_ID = resolveOrgIdFromMap(MPB_HEALTH_SLUG, "portal")!;

type RpcClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: unknown }>;
};

export async function translateOrgId(
  client: RpcClient,
  orgId: string,
  targetPurpose: OrgIdPurpose = "membership",
): Promise<string> {
  try {
    const { data, error } = await client.rpc("translate_org_id", {
      p_org_id: orgId,
      p_target_purpose: targetPurpose,
    });
    if (!error && data) return String(data);
  } catch {
    // RPC unavailable in some environments
  }
  return translateOrgIdStatic(orgId, targetPurpose);
}
