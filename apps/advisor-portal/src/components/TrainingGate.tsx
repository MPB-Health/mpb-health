import { Navigate, useLocation } from 'react-router-dom';
import { useAdvisor } from '../contexts/AdvisorContext';

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
 * Redirects advisors who haven't completed training to the training page.
 * Admins and super_admins bypass this gate entirely.
 * Renders children if training is completed or the current path is training-related.
 */
export function TrainingGate({ children, isAdmin }: { children: React.ReactNode; isAdmin: boolean }) {
  const { profile } = useAdvisor();
  const location = useLocation();

  if (!profile) return <>{children}</>;

  // Admins/super_admins bypass training requirement
  if (isAdmin) return <>{children}</>;

  // Already completed training — full access
  if (profile.training_completed) return <>{children}</>;

  // Allow access to training pages and profile
  if (isTrainingAllowedPath(location.pathname)) return <>{children}</>;

  // Redirect to training
  return <Navigate to="/training" replace />;
}
