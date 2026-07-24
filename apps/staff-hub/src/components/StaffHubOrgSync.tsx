import { useTenant } from '@mpbhealth/auth';

/** Canonical Staff Hub tenant (mpb-health). */
export const STAFF_HUB_DEFAULT_ORG_ID = 'a0000000-0000-0000-0000-000000000001';

/** Active org id for staff-hub data queries (notes, tasks, HR). */
let staffHubOrgId: string | null = null;

export function getStaffHubOrgId(): string {
  if (staffHubOrgId) return staffHubOrgId;
  // Fallback avoids race where pages load before TenantProvider sync lands.
  return STAFF_HUB_DEFAULT_ORG_ID;
}

export function setStaffHubOrgId(orgId: string | null): void {
  staffHubOrgId = orgId;
}

export function StaffHubOrgSync({ children }: { children: React.ReactNode }) {
  const { orgId, loading } = useTenant();

  // Sync during render so getStaffHubOrgId() is ready in the same commit as orgId.
  if (!loading && orgId && staffHubOrgId !== orgId) {
    setStaffHubOrgId(orgId);
  }

  return <>{children}</>;
}
