import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AppLayout, PortalSwitcher } from '@mpbhealth/ui';
import type { NavItem, NavLinkRenderProps } from '@mpbhealth/ui';
import { getPortalUrl } from '@mpbhealth/config';
import type { Lead } from '@mpbhealth/crm-core';
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
} from 'lucide-react';
import { OrgSwitcher } from '@mpbhealth/auth';
import { useAuth } from '../contexts/AuthContext';
import { useOrg } from '../contexts/OrgContext';
import { useCRM } from '../contexts/CRMContext';
import { NotificationCenter } from '../components/NotificationCenter';

const navigation: (NavItem & { permission?: string })[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: Users, permission: 'leads.view' },
  { name: 'Pipeline', href: '/pipeline', icon: Kanban, permission: 'pipeline.view' },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare, permission: 'tasks.view' },
  { name: 'Calendar', href: '/calendar', icon: CalendarDays, permission: 'tasks.view' },
  { name: 'Reports', href: '/reports', icon: BarChart3, permission: 'reports.view' },
  { name: 'Templates', href: '/templates', icon: FileText, permission: 'settings.manage' },
  { name: 'Automation', href: '/automation', icon: Zap, permission: 'settings.manage' },
  { name: 'Settings', href: '/settings', icon: Settings, permission: 'settings.manage' },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { orgs, activeOrg, orgRole, can, switchOrg } = useOrg();
  const { dashboardStats, tasksDueToday, overdueTasks, leadService } = useCRM();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Lead[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    const timer = setTimeout(async () => {
      const { leads } = await leadService.getLeads({ search: searchQuery }, 5, 0);
      setSearchResults(leads);
      setShowSearchResults(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, leadService]);

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
      badge:
        item.name === 'Tasks' && totalPendingTasks > 0 ? (
          <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">
            {totalPendingTasks}
          </span>
        ) : undefined,
    }));

  const renderNavLink = (item: NavItem, props: NavLinkRenderProps) => {
    const isActive = location.pathname === item.href;
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
      {/* Search */}
      <div ref={searchRef} className="hidden sm:block relative w-64">
        <div className="flex items-center bg-surface-tertiary rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-th-text-tertiary mr-2" />
          <input
            type="text"
            placeholder="Search leads..."
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
        </div>
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute top-full mt-1 w-full bg-surface-primary border border-th-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
            {searchResults.map((lead) => (
              <Link
                key={lead.id}
                to={`/leads/${lead.id}`}
                onClick={() => { setShowSearchResults(false); setSearchQuery(''); }}
                className="block px-3 py-2.5 hover:bg-surface-secondary border-b border-th-border-subtle last:border-b-0"
              >
                <p className="text-sm font-medium text-th-text-primary">
                  {lead.first_name} {lead.last_name}
                </p>
                <p className="text-xs text-th-text-tertiary">{lead.email}</p>
              </Link>
            ))}
            <button
              onClick={() => {
                navigate(`/leads?search=${encodeURIComponent(searchQuery)}`);
                setShowSearchResults(false);
                setSearchQuery('');
              }}
              className="w-full text-center text-xs text-th-accent-600 py-2 hover:bg-surface-secondary"
            >
              View all results
            </button>
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
    >
      {children}
    </AppLayout>
  );
}
