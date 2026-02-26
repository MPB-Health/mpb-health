import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FileText,
  Settings,
  ClipboardList,
  LogOut,
  Bell,
  Package,
} from 'lucide-react';
import { useCallback } from 'react';
import { AppLayout, PortalSwitcher, type NavItem, type PortalKey } from '@mpbhealth/ui';
import { getPortalUrl } from '@mpbhealth/config';
import { supabase } from '@mpbhealth/database';
import { useAdmin } from '../contexts/AdminContext';

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Users', href: '/users', icon: Users },
  {
    name: 'Enrollments',
    href: '/enrollments',
    icon: UserPlus,
    // badge is set dynamically below
  },
  { name: 'Plan Management', href: '/plans', icon: Package },
  {
    name: 'Content',
    href: '#',
    icon: FileText,
    children: [
      { name: 'Bulletins', href: '/content/bulletins' },
      { name: 'Blog Posts', href: '/content/blog' },
      { name: 'Resources', href: '/content/resources' },
    ],
  },
  { name: 'Audit Logs', href: '/audit-logs', icon: ClipboardList },
  {
    name: 'Settings',
    href: '#',
    icon: Settings,
    children: [
      { name: 'General', href: '/settings' },
      { name: 'Payment Processors', href: '/settings/payments' },
      { name: 'SMS Accounts', href: '/settings/sms' },
      { name: 'Promo Codes', href: '/settings/promo-codes' },
      { name: 'Code Inventory', href: '/settings/code-inventory' },
      { name: 'Resources', href: '/settings/resources' },
      { name: 'E-Signature', href: '/settings/esignature' },
    ],
  },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const { user, logout, pendingEnrollments, loading } = useAdmin();

  // Redirect to login if not authenticated
  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-secondary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-th-accent-600"></div>
      </div>
    );
  }

  // Build navigation with dynamic badge
  const navWithBadges: NavItem[] = navigation.map((item) => {
    if (item.name === 'Enrollments' && pendingEnrollments > 0) {
      return {
        ...item,
        badge: (
          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-medium">
            {pendingEnrollments}
          </span>
        ),
      };
    }
    return item;
  });

  const getPortalUrlWithSSO = useCallback(async (portal: PortalKey): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke<{ url: string }>('portal-sso', {
        body: { portal },
      });
      if (error || !data?.url) return null;
      return data.url;
    } catch {
      return null;
    }
  }, []);

  return (
    <AppLayout
      appName="Admin Portal"
      logoSrc="/logo.png"
      navigation={navWithBadges}
      portalSwitcher={
        <PortalSwitcher
          currentPortal="admin"
          canAccessAdmin={true}
          canAccessCRM={true}
          canAccessAdvisor={true}
          getPortalUrl={getPortalUrl}
          getPortalUrlWithSSO={getPortalUrlWithSSO}
        />
      }
      renderNavLink={(item, props) => (
        <NavLink
          key={item.name}
          to={item.href}
          onClick={props.onClick}
          className={({ isActive }) =>
            `${props.className} ${
              isActive
                ? 'bg-white/15 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
            }`
          }
        >
          {props.children}
        </NavLink>
      )}
      renderChildNavLink={(child, props) => (
        <NavLink
          key={child.name}
          to={child.href}
          onClick={props.onClick}
          className={({ isActive }) =>
            `${props.className} ${
              isActive
                ? 'bg-white/15 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
            }`
          }
        >
          {props.children}
        </NavLink>
      )}
      topBarActions={
        pendingEnrollments > 0 ? (
          <button
            onClick={() => navigate('/enrollments')}
            aria-label="View pending enrollments"
            className="relative p-2 text-th-text-secondary hover:text-th-text-primary rounded-lg hover:bg-surface-tertiary transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        ) : undefined
      }
      userSection={
        <div className="space-y-2">
          <div className="flex items-center space-x-3 px-3 py-2">
            <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center shrink-0">
              <span className="text-sm font-medium text-white">
                {user?.first_name?.[0]}
                {user?.last_name?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-white/50 capitalize">{user?.role}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center space-x-3 px-3 py-2 w-full rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span>Sign Out</span>
          </button>
        </div>
      }
    >
      <Outlet />
    </AppLayout>
  );
}
