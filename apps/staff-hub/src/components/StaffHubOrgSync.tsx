import { useEffect } from 'react';
import { useTenant } from '@mpbhealth/auth';

/** Active org id for staff-hub data queries (notes, tasks). */
let staffHubOrgId: string | null = null;

export function getStaffHubOrgId(): string {
  if (!staffHubOrgId) {
    throw new Error('Staff Hub org context is not set');
  }
  return staffHubOrgId;
}

export function setStaffHubOrgId(orgId: string | null): void {
  staffHubOrgId = orgId;
}

export function StaffHubOrgSync({ children }: { children: React.ReactNode }) {
  const { orgId, loading } = useTenant();

  useEffect(() => {
    if (!loading && orgId) {
      setStaffHubOrgId(orgId);
    }
  }, [orgId, loading]);

  return <>{children}</>;
}
