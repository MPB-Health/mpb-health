/** Prod MPB org id (champion seed); dev may use 00000000-4000-… instead. */
export const MPB_ORG_ID_ALT = 'a0000000-0000-0000-0000-000000000001';
export const MPB_ORG_ID = '00000000-0000-4000-a000-000000000001';

let activeAdminOrgId: string | null = null;

/** Set from AdminContext after the signed-in admin profile loads. */
export function setAdminOrgContext(orgId: string | null | undefined): void {
  activeAdminOrgId = orgId?.trim() || null;
}

/** Org id for admin CMS queries — defaults to prod MPB org when unset. */
export function getAdminOrgId(): string {
  return activeAdminOrgId || MPB_ORG_ID_ALT;
}
