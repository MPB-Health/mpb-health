import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserProfile, UserRole } from '../../lib/auth';
import { LeadNotificationProvider } from '../../providers/LeadNotificationProvider';

interface LeadNotificationWrapperProps {
  children: React.ReactNode;
}

// Roles that should receive lead notifications
const NOTIFICATION_ENABLED_ROLES: UserRole[] = ['admin', 'superadmin', 'staff', 'advisor'];

/**
 * Conditionally wraps children with LeadNotificationProvider
 * Only enables for admin, staff, and advisor users
 */
export const LeadNotificationWrapper: React.FC<LeadNotificationWrapperProps> = ({
  children,
}) => {
  const { user, loading: authLoading } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setUserRole(null);
        setLoading(false);
        return;
      }

      try {
        const profile = await getUserProfile(user.id);
        setUserRole(profile?.role || 'guest');
      } catch (error) {
        console.error('Error fetching user profile for notifications:', error);
        setUserRole('guest');
      }
      setLoading(false);
    };

    if (!authLoading) {
      checkUserRole();
    }
  }, [user, authLoading]);

  // Still loading - render children without notifications
  if (authLoading || loading) {
    return <>{children}</>;
  }

  // Check if user role should receive notifications
  const shouldEnableNotifications =
    userRole && NOTIFICATION_ENABLED_ROLES.includes(userRole);

  if (shouldEnableNotifications) {
    return (
      <LeadNotificationProvider enabled={true}>
        {children}
      </LeadNotificationProvider>
    );
  }

  // Not an eligible role - render without notifications
  return <>{children}</>;
};

export default LeadNotificationWrapper;

