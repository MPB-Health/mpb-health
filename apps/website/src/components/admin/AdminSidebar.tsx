import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  Users,
  DollarSign,
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
    pending_claims: number;
    pending_support_tickets: number;
    total_members: number;
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
      { id: 'members', label: 'Member Management', icon: Users, href: '/admin/members' },
      { id: 'claims', label: 'Needs Processing', icon: FileText, href: '/admin/claims' },
      { id: 'transactions', label: 'Transactions', icon: DollarSign, href: '/admin/transactions' },
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

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeView,
  onViewChange,
  stats,
  collapsed = false,
  onCollapsedChange
}) => {
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Dashboard', 'Analytics', 'Marketing', 'CRM', 'Content']);
  const [mobileOpen, setMobileOpen] = useState(false);

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
      case 'claims':
        return stats.pending_claims > 0 ? stats.pending_claims : undefined;
      case 'support':
        return stats.pending_support_tickets > 0 ? stats.pending_support_tickets : undefined;
      case 'members':
        return stats.total_members > 0 ? stats.total_members : undefined;
      case 'blog':
        return stats.total_blog_articles > 0 ? stats.total_blog_articles : undefined;
      default:
        return undefined;
    }
  };

  const isUrgent = (item: NavItem) => {
    return (item.id === 'claims' && stats.pending_claims > 0) ||
           (item.id === 'support' && stats.pending_support_tickets > 0);
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

      {/* Quick Search Hint */}
      {!collapsed && (
        <div className="px-4 py-3">
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 text-sm hover:bg-slate-800 hover:border-slate-600 transition-colors">
            <Search className="h-4 w-4" />
            <span>Quick search...</span>
            <kbd className="ml-auto px-1.5 py-0.5 text-xs bg-slate-700 rounded">⌘K</kbd>
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
            <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
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
        className="hidden lg:flex absolute left-[calc(var(--sidebar-width)-12px)] top-1/2 -translate-y-1/2 z-30 items-center justify-center w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shadow-lg"
        style={{ '--sidebar-width': collapsed ? '72px' : '256px' } as React.CSSProperties}
      >
        <ChevronRight className={cn("h-4 w-4 transition-transform", !collapsed && "rotate-180")} />
      </button>
    </>
  );
};

export default AdminSidebar;

