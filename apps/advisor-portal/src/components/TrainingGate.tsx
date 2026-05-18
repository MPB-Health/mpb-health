import { Navigate, useLocation } from 'react-router-dom';
import { isAdvisorExemptFromTrainingGate } from '@mpbhealth/advisor-core';
import { useAdvisor } from '../contexts/AdvisorContext';
import { ADVISOR_TRAINING_GATE_CUTOFF_MS } from '../config/advisorTrainingGate';

const TRAINING_ALLOWED_PATHS = [
  '/training',
  '/profile',
  '/change-password',
];

function isTrainingAllowedPath(pathname: string): boolean {
  return TRAINING_ALLOWED_PATHS.some(
    (allowed) => pathname === allowed || pathname.startsWith(allowed + '/')
  );
}

/**
 * Redirects advisors who must complete the new training track to /training.
 * Admins bypass. Advisors created before the configured cutoff are grandfathered.
 */
export function TrainingGate({
  children,
  isAdmin,
  isAdminPending = false,
}: {
  children: React.ReactNode;
  isAdmin: boolean;
  /** True while the admin role query is still resolving — must not treat as non-admin (default false). */
  isAdminPending?: boolean;
}) {
  const { profile, sessionUserCreatedAt } = useAdvisor();
  const location = useLocation();

  if (!profile) return <>{children}</>;

  // While role is loading, `isAdmin` defaults to false — never redirect to /training on that alone
  // (avoids navigation thrash, aborted fetches, and “infinite” loading on /chat, /admin/tickets, etc.).
  if (isAdminPending) return <>{children}</>;

  // Admins/super_admins bypass training requirement
  if (isAdmin) return <>{children}</>;

  if (isAdvisorExemptFromTrainingGate(profile, ADVISOR_TRAINING_GATE_CUTOFF_MS, sessionUserCreatedAt))
    return <>{children}</>;

  // Allow access to training pages and profile
  if (isTrainingAllowedPath(location.pathname)) return <>{children}</>;

  // Redirect to training
  return <Navigate to="/training" replace />;
}
