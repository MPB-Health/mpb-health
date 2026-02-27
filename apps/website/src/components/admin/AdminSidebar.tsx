import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  BarChart3,
  Globe,
  MousePointerClick,
  Layers,
  TrendingUp,
  Send,
  Link2,
  FileText,
  BookOpen,
  Sparkles,
  Mail,
  HelpCircle,
  Database,
  Search,
  MapPin,
  AlertCircle,
  Shield,
  UserCheck,
  Settings,
  Code,
  Monitor,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Bell,
  Book,
  LogOut,
  Target,
  List,
  Calendar,
  Video,
  GraduationCap,
  Crown,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  viewId?: string;
  badge?: number;
  urgent?: boolean;
  children?: NavItem[];
}

interface AdminSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  stats: {
    pending_support_tickets: number;
    total_blog_articles: number;
  };
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: 'Dashboard',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard, viewId: 'overview' },
    ]
  },
  {
    title: 'Analytics',
    items: [
      { id: 'live', label: 'Live View', icon: Activity, viewId: 'live' },
      { id: 'analytics', label: 'Analytics Overview', icon: BarChart3, viewId: 'analytics' },
      { id: 'traffic', label: 'Traffic Sources', icon: Globe, viewId: 'traffic' },
      { id: 'behavior', label: 'User Behavior', icon: MousePointerClick, viewId: 'behavior' },
      { id: 'pages', label: 'Page Performance', icon: Layers, viewId: 'pages' },
    ]
  },
  {
    title: 'Marketing',
    items: [
      { id: 'marketing', label: 'Marketing Analytics', icon: TrendingUp, viewId: 'marketing' },
      { id: 'social', label: 'Social Media', icon: Send, viewId: 'social' },
      { id: 'campaigns', label: 'UTM Campaigns', icon: Link2, viewId: 'campaigns' },
      { id: 'quotes', label: "Julia's Quote Leads", icon: FileText, viewId: 'quotes' },
    ]
  },
  {
    title: 'CRM',
    items: [
      { id: 'crm-dashboard', label: 'CRM Dashboard', icon: Target, href: '/admin/crm' },
      { id: 'crm-pipeline', label: 'Lead Pipeline', icon: Layers, href: '/admin/crm/pipeline' },
      { id: 'crm-leads', label: 'All Leads', icon: List, href: '/admin/crm/leads' },
      { id: 'crm-templates', label: 'Email Templates', icon: Mail, href: '/admin/crm/templates' },
      { id: 'crm-calendar', label: 'Calendar', icon: Calendar, href: '/admin/crm/calendar' },
    ]
  },
  {
    title: 'Content',
    items: [
      { id: 'content-panel', label: 'Content Analytics', icon: BarChart3, viewId: 'content' },
      { id: 'blog', label: 'Blog Management', icon: BookOpen, href: '/admin/blog' },
      { id: 'ai-blog', label: 'AI Blog Generator', icon: Sparkles, href: '/admin/gemini-blog-generator' },
      { id: 'newsletter-subs', label: 'Newsletter Subscribers', icon: Mail, href: '/admin/newsletter-subscribers' },
      { id: 'newsletter-camp', label: 'Newsletter Campaigns', icon: Send, href: '/admin/newsletter-campaigns' },
      { id: 'faq', label: 'FAQ Management', icon: HelpCircle, href: '/admin/faq' },
      { id: 'resources', label: 'Resource Library', icon: Database, href: '/admin/resources' },
      { id: 'handbooks', label: 'Member Handbooks', icon: Book, href: '/admin/handbooks' },
      { id: 'video-manager', label: 'Video Manager', icon: Video, href: '/admin/settings?tab=media' },
      { id: 'forms-manager', label: 'Forms Manager', icon: FileText, href: '/admin/forms' },
      { id: 'advisor-cms', label: 'Advisor Portal CMS', icon: GraduationCap, href: '/admin/advisor-cms' },
    ]
  },
  {
    title: 'SEO',
    items: [
      { id: 'seoanalytics', label: 'SEO Analytics', icon: TrendingUp, viewId: 'seoanalytics' },
      { id: 'seo', label: 'SEO Settings', icon: Search, viewId: 'seo' },
    ]
  },
  {
    title: 'Operations',
    items: [
      { id: 'support', label: 'Support Tickets', icon: AlertCircle, href: '/admin/support' },
      { id: 'documents', label: 'Document Review', icon: Shield, href: '/admin/documents' },
      { id: 'providers', label: 'Provider Directory', icon: UserCheck, href: '/admin/providers' },
      { id: 'coverage', label: 'Membership Plans', icon: Activity, href: '/admin/coverage' },
      { id: 'notifications', label: 'Notifications', icon: Bell, href: '/admin/notifications' },
      { id: 'advisor-training', label: 'Advisor Training', icon: TrendingUp, href: '/admin/advisor-training' },
    ]
  },
  {
    title: 'Settings',
    items: [
      { id: 'user-management', label: 'User Management', icon: Crown, href: '/admin/users' },
      { id: 'settings', label: 'Site Configuration', icon: Settings, viewId: 'settings' },
      { id: 'geo', label: 'Geo Settings', icon: MapPin, viewId: 'geo' },
      { id: 'integrations', label: 'Tracking Setup', icon: Code, viewId: 'integrations' },
      { id: 'health', label: 'Health Monitor', icon: Monitor, viewId: 'health' },
      { id: 'system-settings', label: 'System Settings', icon: Settings, href: '/admin/settings' },
    ]
  },
];

// Build searchable items from nav groups
const searchableNavItems = navGroups.flatMap(group =>
  group.items.map(item => ({
    id: item.id,
    label: item.label,
    group: group.title,
    href: item.href,
    viewId: item.viewId,
    icon: item.icon,
  }))
);

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeView,
  onViewChange,
  stats,
  collapsed = false,
  onCollapsedChange
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Dashboard', 'Analytics', 'Marketing', 'CRM', 'Content']);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof searchableNavItems>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('adminRecentSearches');
    if (stored) {
      try { setRecentSearches(JSON.parse(stored)); } catch {}
    }
  }, []);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
        setSearchQuery('');
        setSelectedIndex(0);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  // Filter results when query changes
  const performSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSelectedIndex(0);
      return;
    }
    const lower = query.toLowerCase();
    const filtered = searchableNavItems.filter(
      item =>
        item.label.toLowerCase().includes(lower) ||
        item.group.toLowerCase().includes(lower)
    );
    setSearchResults(filtered);
    setSelectedIndex(0);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => performSearch(searchQuery), 100);
    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  const saveRecentSearch = (label: string) => {
    const updated = [label, ...recentSearches.filter(s => s !== label)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('adminRecentSearches', JSON.stringify(updated));
  };

  const handleSearchSelect = (item: typeof searchableNavItems[0]) => {
    saveRecentSearch(item.label);
    setSearchOpen(false);
    setSearchQuery('');
    if (item.href) {
      navigate(item.href);
    } else if (item.viewId) {
      onViewChange(item.viewId);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    const items = searchQuery ? searchResults : [];
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && items[selectedIndex]) {
      e.preventDefault();
      handleSearchSelect(items[selectedIndex]);
    }
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, activeView]);

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev =>
      prev.includes(title)
        ? prev.filter(g => g !== title)
        : [...prev, title]
    );
  };

  const isItemActive = (item: NavItem) => {
    if (item.viewId) {
      return activeView === item.viewId;
    }
    if (item.href) {
      return location.pathname === item.href;
    }
    return false;
  };

  const getBadgeForItem = (item: NavItem) => {
    switch (item.id) {
      case 'support':
        return stats.pending_support_tickets > 0 ? stats.pending_support_tickets : undefined;
      case 'blog':
        return stats.total_blog_articles > 0 ? stats.total_blog_articles : undefined;
      default:
        return undefined;
    }
  };

  const isUrgent = (item: NavItem) => {
    return (item.id === 'support' && stats.pending_support_tickets > 0);
  };

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const badge = getBadgeForItem(item);
    const urgent = isUrgent(item);
    const active = isItemActive(item);

    const itemContent = (
      <>
        <div className={cn(
          "flex items-center justify-center w-9 h-9 rounded-lg transition-colors",
          active ? "bg-primary-500/20 text-primary-400" : "text-slate-400 group-hover:text-slate-200"
        )}>
          <Icon className="h-5 w-5" />
        </div>
        {!collapsed && (
          <>
            <span className={cn(
              "flex-1 text-sm font-medium transition-colors",
              active ? "text-white" : "text-slate-300 group-hover:text-white"
            )}>
              {item.label}
            </span>
            {badge !== undefined && (
              <span className={cn(
                "px-2 py-0.5 text-xs font-semibold rounded-full",
                urgent
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-slate-600 text-slate-200"
              )}>
                {badge}
              </span>
            )}
          </>
        )}
      </>
    );

    const baseClasses = cn(
      "group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
      active
        ? "bg-primary-500/10 border-l-2 border-primary-400 ml-[-2px]"
        : "hover:bg-slate-800/50 border-l-2 border-transparent ml-[-2px]",
      collapsed && "justify-center px-2"
    );

    if (item.href) {
      return (
        <Link key={item.id} to={item.href} className={baseClasses}>
          {itemContent}
        </Link>
      );
    }

    return (
      <button
        key={item.id}
        onClick={() => item.viewId && onViewChange(item.viewId)}
        className={cn(baseClasses, "w-full text-left")}
      >
        {itemContent}
      </button>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo / Header */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-5 border-b border-slate-700/50",
        collapsed && "justify-center px-2"
      )}>
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/25">
          <LayoutDashboard className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <h1 className="text-lg font-bold text-white">MPB Admin</h1>
            <p className="text-xs text-slate-400">Control Center</p>
          </div>
        )}
      </div>

      {/* Quick Search Button */}
      {!collapsed && (
        <div className="px-4 py-3">
          <button
            onClick={() => {
              setSearchOpen(true);
              setTimeout(() => searchInputRef.current?.focus(), 50);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 text-sm hover:bg-slate-800 hover:border-slate-600 transition-colors"
          >
            <Search className="h-4 w-4" />
            <span>Quick search...</span>
            <kbd className="ml-auto px-1.5 py-0.5 text-xs bg-slate-700 rounded">⌘K</kbd>
          </button>
        </div>
      )}
      {collapsed && (
        <div className="px-2 py-3 flex justify-center">
          <button
            onClick={() => {
              setSearchOpen(true);
              setTimeout(() => searchInputRef.current?.focus(), 50);
            }}
            aria-label="Open search"
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:border-slate-600 transition-colors"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {navGroups.map((group) => {
          const isExpanded = expandedGroups.includes(group.title);
          
          return (
            <div key={group.title} className="mb-2">
              <button
                onClick={() => toggleGroup(group.title)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors",
                  collapsed && "justify-center"
                )}
              >
                {!collapsed && <span>{group.title}</span>}
                {!collapsed && (
                  isExpanded
                    ? <ChevronDown className="h-4 w-4" />
                    : <ChevronRight className="h-4 w-4" />
                )}
              </button>
              
              {(isExpanded || collapsed) && (
                <div className={cn("space-y-0.5", collapsed && "mt-1")}>
                  {group.items.map(renderNavItem)}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={cn(
        "border-t border-slate-700/50 p-4",
        collapsed && "p-2"
      )}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-semibold text-sm">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin User</p>
              <p className="text-xs text-slate-400 truncate">Super Admin</p>
            </div>
            <button aria-label="Log out" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-semibold text-sm">
              A
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-900 text-white shadow-lg"
      >
        {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-slate-800 transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64"
      )}>
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <aside className={cn(
        "lg:hidden fixed top-0 left-0 h-full w-72 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-slate-800 z-50 transition-transform duration-300",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {sidebarContent}
      </aside>

      {/* Collapse Toggle (Desktop) */}
      <button
        onClick={() => onCollapsedChange?.(!collapsed)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="hidden lg:flex absolute left-[calc(var(--sidebar-width)-12px)] top-1/2 -translate-y-1/2 z-30 items-center justify-center w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shadow-lg"
        style={{ '--sidebar-width': collapsed ? '72px' : '256px' } as React.CSSProperties}
      >
        <ChevronRight className={cn("h-4 w-4 transition-transform", !collapsed && "rotate-180")} />
      </button>

      {/* Search Modal */}
      {searchOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={() => { setSearchOpen(false); setSearchQuery(''); setSelectedIndex(0); }}
          />
          <div className="fixed inset-x-4 top-20 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg z-[101] bg-white rounded-xl shadow-2xl border border-neutral-200 max-h-[70vh] flex flex-col">
            {/* Search Input */}
            <div className="p-4 border-b border-neutral-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search pages, settings, tools..."
                  className="w-full pl-10 pr-10 py-3 text-base border-2 border-neutral-200 rounded-lg focus:border-blue-600 focus:outline-none transition-colors"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-3">
              {searchQuery && searchResults.length > 0 && (
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-3 mb-2">
                    Results
                  </p>
                  {searchResults.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSearchSelect(item)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left group",
                          index === selectedIndex ? "bg-blue-50" : "hover:bg-neutral-100"
                        )}
                      >
                        <div className="flex-shrink-0 w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors">
                            {item.label}
                          </p>
                          <p className="text-xs text-neutral-500">{item.group}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                      </button>
                    );
                  })}
                </div>
              )}

              {searchQuery && searchResults.length === 0 && (
                <div className="text-center py-10">
                  <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Search className="h-7 w-7 text-neutral-400" />
                  </div>
                  <p className="text-neutral-600 font-medium mb-1">No results found</p>
                  <p className="text-sm text-neutral-500">Try a different search term</p>
                </div>
              )}

              {!searchQuery && (
                <>
                  {recentSearches.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-3 mb-2 flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        Recent
                      </p>
                      <div className="space-y-0.5">
                        {recentSearches.map((label, i) => (
                          <button
                            key={i}
                            onClick={() => { setSearchQuery(label); performSearch(label); }}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-100 rounded-lg transition-colors text-left"
                          >
                            <Clock className="h-4 w-4 text-neutral-400" />
                            <span className="text-sm text-neutral-700">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-3 mb-2">
                      Quick Links
                    </p>
                    <div className="space-y-0.5">
                      {searchableNavItems.slice(0, 6).map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSearchSelect(item)}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-100 rounded-lg transition-colors text-left group"
                          >
                            <Icon className="h-4 w-4 text-neutral-400 group-hover:text-blue-600" />
                            <span className="text-sm text-neutral-700 group-hover:text-blue-600">{item.label}</span>
                            <span className="ml-auto text-xs text-neutral-400">{item.group}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer hints */}
            <div className="p-3 border-t border-neutral-200 bg-neutral-50 rounded-b-xl">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white border border-neutral-300 rounded text-xs font-mono">↑↓</kbd>
                    navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white border border-neutral-300 rounded text-xs font-mono">↵</kbd>
                    select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white border border-neutral-300 rounded text-xs font-mono">esc</kbd>
                    close
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default AdminSidebar;

