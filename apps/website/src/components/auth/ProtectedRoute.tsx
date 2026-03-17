import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

type RequiredRole = 'admin' | 'member' | 'advisor';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: RequiredRole;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, loading, rolesLoading, isAdmin, isAdvisor, canAccessAdminPortal } = useAuth();
  const location = useLocation();

  if (loading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    let hasAccess = false;

    switch (requiredRole) {
      case 'admin':
        hasAccess = canAccessAdminPortal;
        break;
      case 'advisor':
        hasAccess = isAdvisor || isAdmin;
        break;
      case 'member':
        // Any authenticated user can access member routes
        hasAccess = true;
        break;
    }

    if (!hasAccess) {
      return <Navigate to="/forbidden" replace />;
    }
  }

  return <>{children}</>;
};
