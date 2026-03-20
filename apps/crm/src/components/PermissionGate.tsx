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

function PermissionLoadingPanel() {
  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-th-accent-600 border-t-transparent mb-4" aria-hidden />
      <p className="text-sm text-th-text-secondary text-center">Checking permissions…</p>
    </div>
  );
}

export function PermissionGate({
  permission,
  anyOf,
  allOf,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { can, canAny, canAll, permissionsLoading, permissionsError, refreshPermissions, orgRole } =
    useOrg();

  if (permissionsLoading) {
    return <PermissionLoadingPanel />;
  }

  // Org owners/admins bypass permission rows; do not block them when the permission query fails.
  const isElevatedOrgRole = orgRole === 'owner' || orgRole === 'admin';

  if (permissionsError && !isElevatedOrgRole) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center text-center px-4 py-12 max-w-md mx-auto">
        <p className="text-sm text-th-text-secondary mb-4">{permissionsError}</p>
        <button
          type="button"
          onClick={() => {
            void refreshPermissions();
          }}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-th-accent-600 text-white hover:bg-th-accent-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  let allowed = false;

  if (permission) {
    allowed = can(permission);
  } else if (anyOf) {
    allowed = canAny(anyOf);
  } else if (allOf) {
    allowed = canAll(allOf);
  } else {
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
      <h2 className="text-xl font-semibold text-th-text-primary mb-2">Access Denied</h2>
      <p className="text-th-text-secondary max-w-md">
        You don&apos;t have permission to access this page. Contact your organization admin if you believe
        this is an error.
      </p>
    </div>
  );
}
