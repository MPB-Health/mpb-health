import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, type UserRole } from '../contexts/AuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  loginPath?: string;
  forbiddenPath?: string;
}

export function RouteGuard({
  children,
  requiredRoles,
  loginPath = '/login',
  forbiddenPath = '/forbidden'
}: RouteGuardProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, userRoles, rolesLoading } = useAuth();

  useEffect(() => {
    const checkAuthorization = async () => {
      // Wait for auth and roles to load
      if (loading || rolesLoading) {
        return;
      }

      // Not logged in
      if (!user) {
        navigate(`${loginPath}?next=${encodeURIComponent(location.pathname)}`);
        return;
      }

      // Check role requirements
      if (requiredRoles && requiredRoles.length > 0) {
        const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

        if (!hasRequiredRole) {
          navigate(forbiddenPath);
          return;
        }
      }

      setIsAuthorized(true);
    };

    checkAuthorization();
  }, [user, loading, userRoles, rolesLoading, location.pathname, navigate, requiredRoles, loginPath, forbiddenPath]);

  if (loading || rolesLoading || isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-neutral-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  return isAuthorized ? <>{children}</> : null;
}

export default RouteGuard;
