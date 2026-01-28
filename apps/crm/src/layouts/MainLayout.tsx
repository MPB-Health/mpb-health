import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AppLayout, PortalSwitcher } from '@mpbhealth/ui';
import type { NavItem, NavLinkRenderProps } from '@mpbhealth/ui';
import { getPortalUrl } from '@mpbhealth/config';
import { supabase } from '../lib/supabase';

interface GlobalSearchResult {
  entity_type: string;
  entity_id: string;
  title: string;
  subtitle: string | null;
  extra_info: string | null;
  rank: number;
}
import {
  LayoutDashboard,
  Users,
  Kanban,
  CheckSquare,
  CalendarDays,
  BarChart3,
  Settings,
  LogOut,
  Search,
  Shield,
  FileText,
  Zap,
  Mail,
  Send,
  Clock,
  Building2,
  UserCircle,
  DollarSign,
  GitBranch,
  Package,
  FileCheck,
  Receipt,
  Megaphone,
  Truck,
  ShoppingCart,
  ClipboardList,
} from 'lucide-react';
import { OrgSwitcher } from '@mpbhealth/auth';
import { useAuth } from '../contexts/AuthContext';
import { useOrg } from '../contexts/OrgContext';
import { useCRM } from '../contexts/CRMContext';
import { NotificationCenter } from '../components/NotificationCenter';

interface ExtendedNavChild {
  name: string;
  href: string;
  permission?: string;
}

interface ExtendedNavItem extends Omit<NavItem, 'children'> {
  permission?: string;
  children?: ExtendedNavChild[];
}

const navigation: ExtendedNavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  // Lead Management
  { name: 'Leads', href: '/leads', icon: Users, permission: 'leads.read' },
  { name: 'Pipeline', href: '/pipeline', icon: Kanban, permission: 'pipeline.read' },
  // CRM Modules
  { name: 'Accounts', href: '/accounts', icon: Building2, permission: 'accounts.read' },
  { name: 'Contacts', href: '/contacts', icon: UserCircle, permission: 'contacts.read' },
  { name: 'Deals', href: '/deals', icon: DollarSign, permission: 'deals.read' },
  { name: 'Deal Pipeline', href: '/deal-pipeline', icon: GitBranch, permission: 'deals.read' },
  // Products & Quotes
  { name: 'Products', href: '/products', icon: Package, permission: 'products.read' },
  { name: 'Quotes', href: '/quotes', icon: FileCheck, permission: 'quotes.read' },
  { name: 'Invoices', href: '/invoices', icon: Receipt, permission: 'invoices.read' },
  { name: 'Sales Orders', href: '/sales-orders', icon: ShoppingCart, permission: 'sales_orders.read' },
  // Procurement
  { name: 'Vendors', href: '/vendors', icon: Truck, permission: 'vendors.read' },
  { name: 'Purchase Orders', href: '/purchase-orders', icon: ClipboardList, permission: 'purchase_orders.read' },
  // Marketing
  { name: 'Campaigns', href: '/campaigns', icon: Megaphone, permission: 'campaigns.read' },
  // Tasks & Calendar
  { name: 'Tasks', href: '/tasks', icon: CheckSquare, permission: 'tasks.read' },
  { name: 'Calendar', href: '/calendar', icon: CalendarDays, permission: 'tasks.read' },
  // Reporting
  { name: 'Reports', href: '/reports', icon: BarChart3, permission: 'reports.read' },
  // Email
  {
    name: 'Email',
    href: '#',
    icon: Mail,
    permission: 'leads.read',
    children: [
      { name: 'Sent Emails', href: '/email/sent', permission: 'leads.read' },
      { name: 'Schedules', href: '/email/schedules', permission: 'settings.manage' },
    ],
  },
  // Admin
  { name: 'Templates', href: '/templates', icon: FileText, permission: 'settings.manage' },
  { name: 'Automation', href: '/automation', icon: Zap, permission: 'settings.manage' },
  { name: 'Settings', href: '/settings', icon: Settings, permission: 'settings.manage' },
];

// Helper function to get the path for an entity
function getEntityPath(entityType: string, entityId: string): string {
  const pathMap: Record<string, string> = {
    lead: `/leads/${entityId}`,
    account: `/accounts/${entityId}`,
    contact: `/contacts/${entityId}`,
    deal: `/deals/${entityId}`,
    product: `/products/${entityId}`,
    quote: `/quotes/${entityId}`,
    invoice: `/invoices/${entityId}`,
    campaign: `/campaigns/${entityId}`,
    task: `/tasks`,
    vendor: `/vendors/${entityId}`,
    purchase_order: `/purchase-orders/${entityId}`,
    sales_order: `/sales-orders/${entityId}`,
  };
  return pathMap[entityType] || '/';
}

// Helper function to get the icon for an entity type
function getEntityIcon(entityType: string) {
  const iconMap: Record<string, typeof Users> = {
    lead: Users,
    account: Building2,
    contact: UserCircle,
    deal: DollarSign,
    product: Package,
    quote: FileCheck,
    invoice: Receipt,
    campaign: Megaphone,
    task: CheckSquare,
    vendor: Truck,
    purchase_order: ClipboardList,
    sales_order: ShoppingCart,
  };
  return iconMap[entityType] || FileText;
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { orgs, activeOrg, orgRole, can, switchOrg } = useOrg();
  const { dashboardStats, tasksDueToday, overdueTasks } = useCRM();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced global search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    const timer = setTimeout(async () => {
      if (!activeOrg?.id) return;
      setSearchLoading(true);
      try {
        const { data, error } = await supabase.rpc('crm_global_search', {
          p_org_id: activeOrg.id,
          p_query: searchQuery,
          p_limit: 10,
        });
        if (!error && data) {
          setSearchResults(data as GlobalSearchResult[]);
          setShowSearchResults(true);
        }
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, activeOrg?.id]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const totalPendingTasks = tasksDueToday.length + overdueTasks.length;

  // Filter nav items based on permissions
  const visibleNav: NavItem[] = navigation
    .filter((item) => {
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
            ? 'bg-white/15 text-white'
            : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
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
            ? 'bg-white/15 text-white'
            : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
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
        <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
          <span className="text-white font-medium text-sm">
            {user?.email?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {user?.email?.split('@')[0]}
          </p>
          {orgRole && (
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-white/50" />
              <p className="text-xs text-white/50 capitalize">{orgRole}</p>
            </div>
          )}
        </div>
      </div>
      <button
        onClick={handleSignOut}
        className="w-full flex items-center px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors"
      >
        <LogOut className="w-4 h-4 mr-3" />
        Sign out
      </button>
    </div>
  );

  const topBarActions = (
    <div className="flex items-center space-x-4">
      {/* Global Search */}
      <div ref={searchRef} className="hidden sm:block relative w-72">
        <div className="flex items-center bg-surface-tertiary rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-th-text-tertiary mr-2" />
          <input
            type="text"
            placeholder="Search everything..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                navigate(`/leads?search=${encodeURIComponent(searchQuery)}`);
                setShowSearchResults(false);
                setSearchQuery('');
              }
            }}
            className="bg-transparent border-none outline-none text-sm w-full text-th-text-secondary placeholder-th-text-tertiary"
          />
          {searchLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-th-accent-600" />
          )}
        </div>
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute top-full mt-1 w-full bg-surface-primary border border-th-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
            {searchResults.map((result) => {
              const entityPath = getEntityPath(result.entity_type, result.entity_id);
              const EntityIcon = getEntityIcon(result.entity_type);
              return (
                <Link
                  key={`${result.entity_type}-${result.entity_id}`}
                  to={entityPath}
                  onClick={() => { setShowSearchResults(false); setSearchQuery(''); }}
                  className="flex items-start gap-3 px-3 py-2.5 hover:bg-surface-secondary border-b border-th-border-subtle last:border-b-0"
                >
                  <div className="mt-0.5">
                    <EntityIcon className="w-4 h-4 text-th-text-tertiary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-th-text-primary truncate">
                      {result.title}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-th-accent-600 capitalize">{result.entity_type}</span>
                      {result.subtitle && (
                        <span className="text-xs text-th-text-tertiary truncate">{result.subtitle}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        {showSearchResults && searchResults.length === 0 && searchQuery.length >= 2 && !searchLoading && (
          <div className="absolute top-full mt-1 w-full bg-surface-primary border border-th-border rounded-lg shadow-lg z-50 p-4 text-center">
            <p className="text-sm text-th-text-tertiary">No results found</p>
          </div>
        )}
      </div>

      {/* Stats badges */}
      {dashboardStats && (
        <div className="hidden md:flex items-center space-x-4 text-sm">
          <div className="flex items-center text-green-600">
            <span className="font-medium">{dashboardStats.new_leads}</span>
            <span className="ml-1 text-th-text-tertiary">new today</span>
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
    <AppLayout
      appName="CRM"
      logoSrc="/logo.png"
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
      topBarActions={topBarActions}
      renderNavLink={renderNavLink}
      renderChildNavLink={renderChildNavLink}
    >
      {children}
    </AppLayout>
  );
}
