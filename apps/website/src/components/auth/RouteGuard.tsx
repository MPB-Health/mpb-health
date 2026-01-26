import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getCurrentUser, getUserProfile, canAccessRoute, UserRole } from "../../lib/auth";

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

export default function RouteGuard({ children, requiredRoles }: RouteGuardProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        const user = await getCurrentUser();

        if (!user) {
          navigate(`/login?next=${encodeURIComponent(location.pathname)}`);
          return;
        }

        const profile = await getUserProfile(user.id);
        const userRole = profile?.role || "guest";

        if (requiredRoles && !requiredRoles.includes(userRole)) {
          navigate("/forbidden");
          return;
        }

        if (!canAccessRoute(userRole, location.pathname)) {
          navigate("/forbidden");
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error("Authorization check failed:", error);
        navigate(`/login?next=${encodeURIComponent(location.pathname)}`);
      }
    };

    checkAuthorization();
  }, [location.pathname, navigate, requiredRoles]);

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  return isAuthorized ? <>{children}</> : null;
}
