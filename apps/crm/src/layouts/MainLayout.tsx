import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AppLayout, PortalSwitcher } from '@mpbhealth/ui';
import type { NavItem, NavLinkRenderProps } from '@mpbhealth/ui';
import { getPortalUrl } from '@mpbhealth/config';
import {
  LayoutDashboard,
  Users,
  Kanban,
  CheckSquare,
  CalendarDays,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  FileText,
  Zap,
  Mail,
  Inbox,
  Send,
  Clock,
  PenTool,
  ListOrdered,
  Activity,
  ShieldCheck,
  Video,
  Building2,
  UserCircle,
  DollarSign,
  GitBranch,
  Package,
  FileCheck,
  Receipt,
  Megaphone,
  Settings2,
  Calculator,
  Command,
  Download,
} from 'lucide-react';
import { OrgSwitcher } from '@mpbhealth/auth';
import { useAuth } from '../contexts/AuthContext';
import { useOrg } from '../contexts/OrgContext';
import { useCRM } from '../contexts/CRMContext';
import { NotificationCenter } from '../components/NotificationCenter';
import { NotificationTicker } from '../components/NotificationTicker';
import CommandPalette from '../components/CommandPalette';
import GlobalSearch from '../components/GlobalSearch';
import { RouteErrorBoundary } from '../components/ErrorBoundary';

interface ExtendedNavChild {
  name: string;
  href: string;
  permission?: string;
}

interface ExtendedNavItem extends Omit<NavItem, 'children'> {
  permission?: string;
  children?: ExtendedNavChild[];
}

// ============================================================================
// Navigation Configuration with Grouped Sections
// ============================================================================

interface NavSection {
  id: string;
  label?: string; // Optional section label
  items: ExtendedNavItem[];
}

const navigationSections: NavSection[] = [
  {
    id: 'main',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    ],
  },
  {
    id: 'leads',
    label: 'Lead Management',
    items: [
      { name: 'Leads', href: '/leads', icon: Users, permission: 'leads.read' },
      { name: 'Quick Rate Leads', href: '/leads/quick-rate-estimate', icon: Calculator, permission: 'leads.read' },
      { name: 'Pipeline', href: '/pipeline', icon: Kanban, permission: 'pipeline.read' },
      { name: 'Import from Zoho', href: '/import/zoho', icon: Download, permission: 'settings.manage' },
    ],
  },
  {
    id: 'crm',
    label: 'CRM',
    items: [
      { name: 'Accounts', href: '/accounts', icon: Building2, permission: 'accounts.read' },
      { name: 'Contacts', href: '/contacts', icon: UserCircle, permission: 'contacts.read' },
      { name: 'Deals', href: '/deals', icon: DollarSign, permission: 'deals.read' },
      { name: 'Deal Pipeline', href: '/deal-pipeline', icon: GitBranch, permission: 'deals.read' },
    ],
  },
  {
    id: 'sales',
    label: 'Sales & Billing',
    items: [
      { name: 'Products', href: '/products', icon: Package, permission: 'products.read' },
      { name: 'Quotes', href: '/quotes', icon: FileCheck, permission: 'quotes.read' },
      { name: 'Invoices', href: '/invoices', icon: Receipt, permission: 'invoices.read' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    items: [
      { name: 'Campaigns', href: '/campaigns', icon: Megaphone, permission: 'campaigns.read' },
    ],
  },
  {
    id: 'productivity',
    label: 'Productivity',
    items: [
      { name: 'Tasks', href: '/tasks', icon: CheckSquare, permission: 'tasks.read' },
      { name: 'Calendar', href: '/calendar', icon: CalendarDays, permission: 'tasks.read' },
      { name: 'Meetings', href: '/meetings', icon: Video, permission: 'tasks.read' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    items: [
      { name: 'Reports', href: '/reports', icon: BarChart3, permission: 'reports.read' },
      { name: 'Sales Activity', href: '/sales-activity', icon: Activity, permission: 'reports.read' },
    ],
  },
  {
    id: 'email',
    label: 'Email',
    items: [
      { name: 'Inbox', href: '/email/inbox', icon: Inbox, permission: 'email.read' },
      {
        name: 'Email',
        href: '#',
        icon: Mail,
        permission: 'email.read',
        children: [
          { name: 'Sent Emails', href: '/email/sent', permission: 'email.read' },
          { name: 'Schedules', href: '/email/schedules', permission: 'email.templates' },
          { name: 'Sequences', href: '/email/sequences', permission: 'email.read' },
          { name: 'Deliverability', href: '/email/deliverability', permission: 'email.read' },
        ],
      },
      { name: 'Signatures', href: '/email/signatures', icon: PenTool, permission: 'email.read' },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    items: [
      { name: 'Templates', href: '/templates', icon: FileText, permission: 'settings.manage' },
      { name: 'Automation', href: '/automation', icon: Zap, permission: 'settings.manage' },
      { name: 'Studio', href: '/studio', icon: Settings2, permission: 'settings.manage' },
      { name: 'Settings', href: '/settings', icon: Settings, permission: 'settings.manage' },
    ],
  },
];

// Flatten for backward compatibility
const navigation: ExtendedNavItem[] = navigationSections.flatMap(section => section.items);

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { orgs, activeOrg, orgRole, can, switchOrg } = useOrg();
  const { dashboardStats, tasksDueToday, overdueTasks, zohoConfigured } = useCRM();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const totalPendingTasks = tasksDueToday.length + overdueTasks.length;

  // Filter nav items based on permissions and feature flags
  const visibleNav: NavItem[] = navigation
    .filter((item) => {
      // Hide Zoho-specific items when Zoho is not configured
      if (item.href === '/import/zoho' && !zohoConfigured) return false;
      if (!item.permission) return true;
      return can(item.permission);
    })
    .map((item) => ({
      name: item.name,
      href: item.href,
      icon: item.icon,
      children: item.children
        ?.filter((child) => !child.permission || can(child.permission))
        .map((child) => ({ name: child.name, href: child.href })),
      badge:
        item.name === 'Tasks' && totalPendingTasks > 0 ? (
          <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">
            {totalPendingTasks}
          </span>
        ) : undefined,
    }));

  const renderNavLink = (item: NavItem, props: NavLinkRenderProps) => {
    const isActive = location.pathname === item.href ||
      (item.children && item.children.some(c => location.pathname === c.href));
    return (
      <NavLink
        to={item.href}
        className={`${props.className} ${
          isActive
            ? 'bg-[rgb(var(--sidebar-active-bg)_/_0.15)] text-[rgb(var(--sidebar-text-active))]'
            : 'text-[rgb(var(--sidebar-text))] hover:text-[rgb(var(--sidebar-text-active))] hover:bg-[rgb(var(--sidebar-hover))]'
        }`}
        onClick={props.onClick}
      >
        {props.children}
      </NavLink>
    );
  };

  const renderChildNavLink = (child: { name: string; href: string }, props: NavLinkRenderProps) => {
    const isActive = location.pathname === child.href;
    return (
      <NavLink
        key={child.name}
        to={child.href}
        onClick={props.onClick}
        className={`${props.className} ${
          isActive
            ? 'bg-[rgb(var(--sidebar-active-bg)_/_0.15)] text-[rgb(var(--sidebar-text-active))]'
            : 'text-[rgb(var(--sidebar-text))] hover:text-[rgb(var(--sidebar-text-active))] hover:bg-[rgb(var(--sidebar-hover))]'
        }`}
      >
        {props.children}
      </NavLink>
    );
  };

  const userSection = (
    <div className="space-y-3">
      {/* Org Switcher */}
      <div className="px-2">
        <OrgSwitcher
          orgs={orgs}
          activeOrg={activeOrg}
          onSwitch={switchOrg}
          className="w-full"
        />
      </div>
      {/* User info */}
      <div className="flex items-center space-x-3 px-3">
        <div className="w-9 h-9 bg-[rgb(var(--sidebar-text)_/_0.12)] rounded-full flex items-center justify-center">
          <span className="text-[rgb(var(--sidebar-text-active))] font-medium text-sm">
            {user?.email?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[rgb(var(--sidebar-text-active))] truncate">
            {user?.email?.split('@')[0]}
          </p>
          {orgRole && (
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-[rgb(var(--sidebar-text)_/_0.7)]" />
              <p className="text-xs text-[rgb(var(--sidebar-text)_/_0.7)] capitalize">{orgRole}</p>
            </div>
          )}
        </div>
      </div>
      <button
        onClick={handleSignOut}
        className="w-full flex items-center px-3 py-2 text-sm text-[rgb(var(--sidebar-text))] hover:text-[rgb(var(--sidebar-text-active))] hover:bg-[rgb(var(--sidebar-hover))] rounded-lg transition-colors"
      >
        <LogOut className="w-4 h-4 mr-3" />
        Sign out
      </button>
    </div>
  );

  const topBarActions = (
    <div className="flex items-center space-x-3">
      {/* Command Palette Trigger */}
      <button
        onClick={() => {
          const event = new KeyboardEvent('keydown', {
            key: 'k',
            metaKey: true,
            bubbles: true,
          });
          document.dispatchEvent(event);
        }}
        className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-tertiary hover:bg-surface-secondary rounded-lg text-xs text-th-text-tertiary transition-colors"
        title="Command Palette (⌘K)"
      >
        <Command className="w-3.5 h-3.5" />
        <kbd className="text-[10px] bg-white/10 px-1 py-0.5 rounded font-mono">⌘K</kbd>
      </button>

      {/* Stats badges */}
      {dashboardStats && (
        <div className="hidden lg:flex items-center space-x-3 text-sm">
          <div className="flex items-center text-green-600">
            <span className="font-medium">{dashboardStats.new_leads}</span>
            <span className="ml-1 text-th-text-tertiary">new</span>
          </div>
          <div className="flex items-center text-blue-600">
            <span className="font-medium">{dashboardStats.total_leads}</span>
            <span className="ml-1 text-th-text-tertiary">total</span>
          </div>
        </div>
      )}

      {/* Notifications */}
      <NotificationCenter />
    </div>
  );

  return (
    <>
      {/* Command Palette - always rendered */}
      <CommandPalette />

      <AppLayout
        appName="CRM"
        logoSrc="/assets/MPB-Health-No-background.png"
        navigation={visibleNav}
        portalSwitcher={
          <PortalSwitcher
            currentPortal="crm"
            canAccessAdmin={true}
            canAccessCRM={true}
            canAccessAdvisor={true}
            getPortalUrl={getPortalUrl}
          />
        }
        userSection={userSection}
        topBarCenter={<GlobalSearch />}
        topBarActions={topBarActions}
        renderNavLink={renderNavLink}
        renderChildNavLink={renderChildNavLink}
      >
        {/* Notification Ticker - real-time activity feed */}
        <NotificationTicker />

        {/* Route Error Boundary - shell stays intact on page errors */}
        <RouteErrorBoundary>
          {children}
        </RouteErrorBoundary>
      </AppLayout>
    </>
  );
}
