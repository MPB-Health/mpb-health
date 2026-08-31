import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserProfile, UserRole } from '../../lib/auth';
import { LeadNotificationProvider } from '../../providers/LeadNotificationProvider';

interface LeadNotificationWrapperProps {
  children: React.ReactNode;
}

// Roles that should receive lead notifications
const NOTIFICATION_ENABLED_ROLES: UserRole[] = ['admin', 'superadmin', 'staff', 'advisor'];

// ─────────────────────────────────────────────────────────────────────────────
// Realtime new-lead alerts are INERT since the MPB → ARYX CRM consolidation.
//
// LeadNotificationProvider subscribes to INSERTs on this project's (MonoRepo,
// dtmnkzllidaiqyheguhl) `lead_submissions`, but website quotes now write only
// to the ARYX CRM project (knelbprqqbjggqfqvfmc) — verified: the MonoRepo
// table has taken 0 rows in the last 30 days, last insert 2026-07-06.
//
// So the subscription can never fire. Leaving it on is worse than off: it
// holds an open realtime channel for nothing and, more importantly, implies to
// staff that they are being alerted to new leads when they are not. New-lead
// alerting belongs in the ARYX CRM, which owns the data and the org-scoped RLS
// that makes such alerts safe to deliver.
//
// Flip back to true only alongside a subscription that targets ARYX.
// ─────────────────────────────────────────────────────────────────────────────
const REALTIME_LEAD_ALERTS_ENABLED = false;

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
    REALTIME_LEAD_ALERTS_ENABLED && userRole && NOTIFICATION_ENABLED_ROLES.includes(userRole);

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

