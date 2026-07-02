import { useEffect } from 'react';
import { useTenant } from '@mpbhealth/auth';
import { setConciergeOrgId } from '../lib/concierge-api';

/** Syncs TenantProvider org id into concierge-api module context. */
export function ConciergeOrgSync({ children }: { children: React.ReactNode }) {
  const { orgId, loading } = useTenant();

  useEffect(() => {
    if (!loading && orgId) {
      setConciergeOrgId(orgId);
    }
  }, [orgId, loading]);

  return <>{children}</>;
}
