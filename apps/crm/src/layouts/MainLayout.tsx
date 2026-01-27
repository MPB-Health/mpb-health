import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { Lead } from '@mpbhealth/crm-core';
import {
  LayoutDashboard,
  Users,
  Kanban,
  CheckSquare,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Shield,
} from 'lucide-react';
import { OrgSwitcher } from '@mpbhealth/auth';
import { useAuth } from '../contexts/AuthContext';
import { useOrg } from '../contexts/OrgContext';
import { useCRM } from '../contexts/CRMContext';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string; // Required permission to show this nav item
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: Users, permission: 'leads.view' },
  { name: 'Pipeline', href: '/pipeline', icon: Kanban, permission: 'pipeline.view' },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare, permission: 'tasks.view' },
  { name: 'Calendar', href: '/calendar', icon: Calendar, permission: 'tasks.view' },
  { name: 'Reports', href: '/reports', icon: BarChart3, permission: 'reports.view' },
  { name: 'Settings', href: '/settings', icon: Settings, permission: 'settings.manage' },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  const visibleNav = navigation.filter((item) => {
    if (!item.permission) return true;
    return can(item.permission);
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-neutral-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-neutral-200">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">MPB</span>
              </div>
              <span className="font-semibold text-neutral-900">CRM</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-neutral-500 hover:text-neutral-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Org Switcher */}
          <div className="border-b border-neutral-200">
            <OrgSwitcher
              orgs={orgs}
              activeOrg={activeOrg}
              onSwitch={switchOrg}
              className="px-2 py-2"
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {visibleNav.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                  {item.name === 'Tasks' && totalPendingTasks > 0 && (
                    <span className="ml-auto bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">
                      {totalPendingTasks}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-neutral-200 p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-700 font-medium text-sm">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {user?.email?.split('@')[0]}
                </p>
                {orgRole && (
                  <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-neutral-400" />
                    <p className="text-xs text-neutral-500 capitalize">{orgRole}</p>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white border-b border-neutral-200">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-neutral-500 hover:text-neutral-700"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Search */}
              <div ref={searchRef} className="hidden sm:block relative w-64">
                <div className="flex items-center bg-neutral-100 rounded-lg px-3 py-2">
                  <Search className="w-4 h-4 text-neutral-400 mr-2" />
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
                    className="bg-transparent border-none outline-none text-sm w-full text-neutral-700 placeholder-neutral-400"
                  />
                </div>
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute top-full mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                    {searchResults.map((lead) => (
                      <Link
                        key={lead.id}
                        to={`/leads/${lead.id}`}
                        onClick={() => { setShowSearchResults(false); setSearchQuery(''); }}
                        className="block px-3 py-2.5 hover:bg-neutral-50 border-b border-neutral-100 last:border-b-0"
                      >
                        <p className="text-sm font-medium text-neutral-900">
                          {lead.first_name} {lead.last_name}
                        </p>
                        <p className="text-xs text-neutral-500">{lead.email}</p>
                      </Link>
                    ))}
                    <button
                      onClick={() => {
                        navigate(`/leads?search=${encodeURIComponent(searchQuery)}`);
                        setShowSearchResults(false);
                        setSearchQuery('');
                      }}
                      className="w-full text-center text-xs text-primary-600 py-2 hover:bg-neutral-50"
                    >
                      View all results
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Stats badges */}
              {dashboardStats && (
                <div className="hidden md:flex items-center space-x-4 text-sm">
                  <div className="flex items-center text-green-600">
                    <span className="font-medium">{dashboardStats.new_leads}</span>
                    <span className="ml-1 text-neutral-500">new today</span>
                  </div>
                  <div className="flex items-center text-blue-600">
                    <span className="font-medium">{dashboardStats.total_leads}</span>
                    <span className="ml-1 text-neutral-500">total</span>
                  </div>
                </div>
              )}

              {/* Notifications */}
              <button className="relative p-2 text-neutral-500 hover:text-neutral-700">
                <Bell className="w-5 h-5" />
                {overdueTasks.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
