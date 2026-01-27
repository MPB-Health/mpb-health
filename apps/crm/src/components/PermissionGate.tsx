// ============================================================================
// PermissionGate — Conditionally render children based on org permissions
// ============================================================================

import type { ReactNode } from 'react';
import { useOrg } from '../contexts/OrgContext';

interface PermissionGateProps {
  /** Required permission key (e.g. "leads.view") */
  permission?: string;
  /** Require any one of these permissions */
  anyOf?: string[];
  /** Require all of these permissions */
  allOf?: string[];
  /** What to render when permission is denied (defaults to null) */
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGate({
  permission,
  anyOf,
  allOf,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { can, canAny, canAll, permissionsLoading } = useOrg();

  if (permissionsLoading) return null;

  let allowed = false;

  if (permission) {
    allowed = can(permission);
  } else if (anyOf) {
    allowed = canAny(anyOf);
  } else if (allOf) {
    allowed = canAll(allOf);
  } else {
    // No permission specified — allow by default
    allowed = true;
  }

  return allowed ? <>{children}</> : <>{fallback}</>;
}

/** Full-page access denied fallback */
export function AccessDenied() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-neutral-900 mb-2">Access Denied</h2>
      <p className="text-neutral-600 max-w-md">
        You don't have permission to access this page. Contact your organization admin if you believe
        this is an error.
      </p>
    </div>
  );
}
