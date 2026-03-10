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
  LifeBuoy,
  Heart,
  TrendingUp,
  Server,
  MessageSquare,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { AppLayout, PortalSwitcher, type NavItem, type PortalKey } from '@mpbhealth/ui';
import { getPortalUrl } from '@mpbhealth/config';
import { supabase } from '@mpbhealth/database';
import { usePortalAccess, buildPortalSSOUrl } from '@mpbhealth/auth';
import { useAdmin } from '../contexts/AdminContext';

/* ---- Section separator inserted between nav groups ---- */
const SECTION_BREAK: NavItem = { name: '---', href: '', icon: () => null };
const sectionLabel = (label: string): NavItem => ({
  name: `§${label}`,
  href: '',
  icon: () => null,
});

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Advisor Access', href: '/advisor-access', icon: ShieldCheck },
  {
    name: 'Enrollments',
    href: '/enrollments',
    icon: UserPlus,
    // badge is set dynamically below
  },
  { name: 'Members', href: '/members', icon: Heart },
  { name: 'Plan Management', href: '/plans', icon: Package },

  sectionLabel('Sales & Support'),
  {
    name: 'CRM',
    href: '#',
    icon: TrendingUp,
    children: [
      { name: 'Dashboard', href: '/crm/dashboard' },
      { name: 'Leads', href: '/crm/leads' },
    ],
  },
  {
    name: 'Support',
    href: '#',
    icon: LifeBuoy,
    children: [
      { name: 'Tickets', href: '/support/tickets' },
    ],
  },
  {
    name: 'Messaging',
    href: '#',
    icon: MessageSquare,
    children: [
      { name: 'Chat Moderation', href: '/messaging/chat' },
      { name: 'Push Notifications', href: '/messaging/push' },
    ],
  },

  sectionLabel('Content'),
  {
    name: 'Content',
    href: '#',
    icon: FileText,
    children: [
      { name: 'Bulletins', href: '/content/bulletins' },
      { name: 'Blog Posts', href: '/content/blog' },
      { name: 'Resources', href: '/content/resources' },
      { name: 'Training Modules', href: '/content/training' },
      { name: 'SOPs', href: '/content/sops' },
      { name: 'Quick Links', href: '/content/quick-links' },
      { name: 'Video Library', href: '/content/videos' },
      { name: 'Forms', href: '/content/forms' },
      { name: 'Contact Directory', href: '/content/contacts' },
      { name: 'Navigation', href: '/content/navigation' },
    ],
  },

  sectionLabel('System'),
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'System Health', href: '/system/health', icon: Server },
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
      { name: 'Ticket Categories', href: '/settings/ticket-categories' },
    ],
  },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const { user, logout, pendingEnrollments, loading } = useAdmin();

  // Load portal access from global user_roles table
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUserId(session?.user?.id ?? null);
    });
  }, []);
  const { canAccessAdmin, canAccessAdvisor, canAccessCrm } = usePortalAccess(authUserId);

  const getPortalUrlWithSSO = useCallback(async (portal: PortalKey): Promise<string | null> => {
    return buildPortalSSOUrl(getPortalUrl(portal), supabase);
  }, []);

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

  // Build navigation with dynamic badge + filter section labels for collapsed mode
  const navWithBadges: NavItem[] = navigation
    .filter((item) => {
      // Hide section labels when they'd just clutter things
      if (item.name.startsWith('§')) return true;
      return true;
    })
    .map((item) => {
      if (item.name === 'Enrollments' && pendingEnrollments > 0) {
        return {
          ...item,
          badge: (
            <span className="bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5 font-semibold leading-none">
              {pendingEnrollments}
            </span>
          ),
        };
      }
      return item;
    });

  return (
    <AppLayout
      appName="Admin Portal"
      logoSrc="/logo.png"
      navigation={navWithBadges}
      portalSwitcher={
        <PortalSwitcher
          currentPortal="admin"
          canAccessAdmin={canAccessAdmin}
          canAccessCRM={canAccessCrm}
          canAccessAdvisor={canAccessAdvisor}
          getPortalUrl={getPortalUrl}
          getPortalUrlWithSSO={getPortalUrlWithSSO}
        />
      }
      renderNavLink={(item, props) => {
        // Section labels render as dividers with text
        if (item.name.startsWith('§')) {
          return (
            <div key={item.name} className="nav-section-label">
              {item.name.slice(1)}
            </div>
          );
        }

        return (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/'}
            onClick={props.onClick}
            className={({ isActive }) =>
              `${props.className} ${
                isActive
                  ? 'nav-active-indicator bg-[rgb(var(--sidebar-active-bg))] text-[rgb(var(--accent-700))] dark:text-[rgb(var(--sidebar-text-active))] font-semibold'
                  : 'text-[rgb(var(--sidebar-text))] hover:text-[rgb(var(--sidebar-text-active))] hover:bg-[rgb(var(--sidebar-hover))]'
              }`
            }
          >
            {props.children}
          </NavLink>
        );
      }}
      renderChildNavLink={(child, props) => (
        <NavLink
          key={child.name}
          to={child.href}
          onClick={props.onClick}
          className={({ isActive }) =>
            `${props.className} ${
              isActive
                ? 'bg-[rgb(var(--sidebar-active-bg))] text-[rgb(var(--accent-700))] dark:text-[rgb(var(--sidebar-text-active))] font-semibold'
                : 'text-[rgb(var(--sidebar-text))] hover:text-[rgb(var(--sidebar-text-active))] hover:bg-[rgb(var(--sidebar-hover))]'
            }`
          }
        >
          {props.children}
        </NavLink>
      )}
      topBarActions={
        pendingEnrollments > 0 ? (
          <button
            type="button"
            onClick={() => navigate('/enrollments')}
            aria-label="View pending enrollments"
            className="relative p-2 text-th-text-secondary hover:text-th-text-primary rounded-lg hover:bg-surface-tertiary transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </button>
        ) : undefined
      }
      userSection={
        <div className="space-y-1">
          <div className="flex items-center space-x-3 px-3 py-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-[rgb(var(--accent-500))] to-[rgb(var(--accent-700))]">
              <span className="text-sm font-medium text-white">
                {user?.first_name?.[0]}
                {user?.last_name?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[rgb(var(--sidebar-text-active))] truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-[11px] text-[rgb(var(--sidebar-text))] capitalize">{user?.role}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex items-center space-x-3 px-3 py-2 w-full rounded-xl text-sm font-medium text-[rgb(var(--sidebar-text))] hover:text-[rgb(var(--sidebar-text-active))] hover:bg-[rgb(var(--sidebar-hover))] transition-colors"
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
