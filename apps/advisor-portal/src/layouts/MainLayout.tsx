import { useEffect, useMemo, useCallback } from 'react';
import { getBrandLogo, AppLayout, PortalSwitcher, Button, detectBrand, type NavItem, type PortalKey } from '@mpbhealth/ui';
import { Outlet, NavLink, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  GraduationCap,
  FileText,
  BookOpen,
  Bell,
  User,
  LogOut,
  Video,
  Radio,
  Inbox,
  Settings,
  Search,
  Link,
  Send,
  UsersRound,
  Mail,
  Headphones,
  ShieldCheck,
  // Additional icons that may come from CMS nav items
  Home,
  Phone,
  Calendar,
  BarChart2,
  Shield,
  FileSearch,
  ClipboardList,
  AlertCircle,
  CheckCircle,
  Download,
  Eye,
  ChevronRight,
  ExternalLink,
  ArrowRight,
  Briefcase,
  Heart,
  Star,
  Globe,
  MessageSquare,
  HelpCircle,
  Zap,
  Lock,
  Users,
  Building2,
  CreditCard,
  Activity,
  Pill,
  Compass,
} from 'lucide-react';
import { getPortalUrl } from '@mpbhealth/config';
import { isAdmin as checkIsAdmin, usePortalAccess, buildPortalSSOUrl, useSSONavigation } from '@mpbhealth/auth';
import { supabase } from '@mpbhealth/database';
import { navigationService, type NavMenuItem, isAdvisorExemptFromTrainingGate } from '@mpbhealth/advisor-core';
import { useAdvisor } from '../contexts/AdvisorContext';
import { useAdvisorQueryReady } from '../hooks/useAdvisorQueryReady';
import { NotificationCenter } from '../components/notifications';
import { CommandPalette } from '../components/command-palette';
import { MobileBottomNav } from '../components/mobile';
import { PWAInstallPrompt } from '../components/pwa';
import { OnboardingWizard } from '../components/onboarding';
import { ADVISOR_TRAINING_GATE_CUTOFF_MS } from '../config/advisorTrainingGate';
import { TrainingGate } from '../components/TrainingGate';
import { KeyboardShortcutsModal } from '../components/command-palette';
import { useCommandPalette } from '../hooks/useSearch';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useUserPreferences } from '../hooks/useSettings';
import { GlobalSearch } from '../components/GlobalSearch';
import { setClearQueryCache } from '../utils/navCache';
import { prefetchRouteByPath } from '../App';
import { AdvisorPageLoader } from '../components/loading';

// Icon mapping for dynamic icons from CMS
// NOTE: Keep this as named imports only — never use `import * as LucideIcons`
// as it defeats tree-shaking and bloats the bundle by ~500 KB.
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  GraduationCap,
  FileText,
  BookOpen,
  Bell,
  User,
  Inbox,
  Settings,
  Link,
  Send,
  UsersRound,
  Mail,
  // Extended set for CMS nav
  Home,
  Phone,
  Calendar,
  BarChart2,
  Shield,
  ShieldCheck,
  FileSearch,
  ClipboardList,
  AlertCircle,
  CheckCircle,
  Download,
  Eye,
  ChevronRight,
  ExternalLink,
  ArrowRight,
  Briefcase,
  Heart,
  Star,
  Globe,
  MessageSquare,
  HelpCircle,
  Zap,
  Lock,
  Users,
  Building2,
  CreditCard,
  Activity,
  Pill,
  Compass,
  Video,
  Radio,
  Headphones,
  Search,
  LogOut,
};

// Get icon component from string name
function getIconComponent(iconName: string): LucideIcon {
  return iconMap[iconName] ?? Link;
}

// Fallback navigation for when CMS data isn't available
const fallbackNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Bulletins', href: '/bulletins', icon: Bell },
  { name: 'Resource Center', href: '/quick-links', icon: Link },
  {
    name: 'Resources',
    href: '/sops',
    icon: BookOpen,
    children: [
      { name: 'Handbooks', href: '/sops/handbooks' },
      { name: 'Overviews', href: '/overview' },
    ],
  },
  { 
    name: 'Forms', 
    href: '/forms', 
    icon: FileText,
    children: [
      { name: 'Advisor', href: '/forms/advisor' },
      { name: 'Employer', href: '/forms/employer' },
      { name: 'Member', href: '/forms/member' },
    ],
  },
  { 
    name: 'Training', 
    href: '/training', 
    icon: GraduationCap,
    children: [
      { name: 'MPB Training', href: '/training/mpb' },
      { name: 'Sedera Training', href: 'https://sedera.my.salesforce-sites.com/Affiliate/apex/Affiliate_Contact_Form?Contact.Parent_Affiliate_Account__c=0011N00001vSpDl', external: true },
      { name: 'Zion Training', href: 'https://zionhealthshare.thinkific.com/courses/zionhealthshare', external: true },
    ],
  },
  { name: 'Video Library', href: '/videos', icon: Video },
  { name: 'Submit Group', href: '/submit-group', icon: UsersRound },
  { name: 'Assigned Leads', href: '/leads', icon: Users },
  { name: 'Support Tickets', href: '/tickets', icon: Headphones },
  { name: 'Contact', href: '/contact', icon: Mail },
];

// Convert CMS nav items to AppLayout NavItem format (supports hierarchy)
function mapMenuItemsToNavItems(items: NavMenuItem[]): NavItem[] {
  return items
    .filter(item => item.is_active)
    .sort((a, b) => a.order_index - b.order_index)
    .map(item => ({
      name: item.label,
      href: item.url || '/',
      icon: getIconComponent(item.icon),
      badge: item.badge_text ? (
        <span 
          className={`ml-auto text-white text-xs rounded-full px-2 py-0.5 ${
            item.badge_color === 'red' ? 'bg-red-500' :
            item.badge_color === 'green' ? 'bg-green-500' :
            item.badge_color === 'yellow' ? 'bg-yellow-500' :
            'bg-blue-500'
          }`}
        >
          {item.badge_text}
        </span>
      ) : undefined,
      // Map children if they exist (for accordion submenus)
      children: item.children && item.children.length > 0
        ? item.children
            .filter(child => child.is_active)
            .sort((a, b) => a.order_index - b.order_index)
            .map(child => ({
              name: child.label,
              href: child.url || '/',
            }))
        : undefined,
    }));
}

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    profile,
    sessionUserCreatedAt,
    unreadBulletinCount,
    logout,
    loading,
    profileLoading,
    hasSession,
    error: profileError,
    refreshProfile,
  } = useAdvisor();
  const { advisorReady } = useAdvisorQueryReady();
  const { open: openCommandPalette } = useCommandPalette();
  const { showShortcutsModal, setShowShortcutsModal } = useKeyboardShortcuts();
  const { preferences: userPreferences } = useUserPreferences();
  const { navigateToPortal, loadingPortal } = useSSONavigation();
  const ssoLoading = loadingPortal === 'support';
  const openSupport = useCallback(() => navigateToPortal('support', { newTab: true }), [navigateToPortal]);
  const queryClient = useQueryClient();

  // Register the query-cache clear function so logout can purge nav cache
  const clearQuery = useCallback(() => {
    queryClient.removeQueries({ queryKey: ['cmsNavigation'] });
  }, [queryClient]);
  setClearQueryCache(clearQuery);

  // Admin role check via React Query (deduped + cached)
  const {
    data: isAdminUser = false,
    isPending: isAdminQueryPending,
  } = useQuery({
    queryKey: ['isAdmin', profile?.user_id],
    queryFn: () => checkIsAdmin(profile!.user_id),
    enabled: advisorReady,
    staleTime: 5 * 60 * 1000,
  });
  const isAdminRolePending = advisorReady && isAdminQueryPending;

  // Portal access from global user_roles table
  const { canAccessAdmin, canAccessAdvisor, canAccessCrm } = usePortalAccess(profile?.user_id);

  const safeGetPortalUrl = useCallback((portal: PortalKey): string => {
    try {
      return getPortalUrl(portal as Parameters<typeof getPortalUrl>[0]);
    } catch {
      return '#';
    }
  }, []);

  // SSO-aware portal navigation (client-side session transfer)
  const getPortalUrlWithSSO = useCallback(async (portal: PortalKey): Promise<string | null> => {
    const baseUrl = safeGetPortalUrl(portal);
    if (!baseUrl || baseUrl === '#') return null;
    return buildPortalSSOUrl(baseUrl, supabase);
  }, [safeGetPortalUrl]);

  // CMS navigation via React Query — automatic dedup, caching, and stale-while-revalidate
  const { data: cmsNavItems = [] } = useQuery<NavItem[]>({
    queryKey: ['cmsNavigation'],
    queryFn: async () => {
      const items = await navigationService.getNavMenuItems();
      return items && items.length > 0 ? mapMenuItemsToNavItems(items) : [];
    },
    enabled: advisorReady,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Real-time nav subscription — updates React Query cache on CMS changes
  useEffect(() => {
    const channel = navigationService.subscribeToNavMenuChanges((items) => {
      const mappedItems = mapMenuItemsToNavItems(items);
      queryClient.setQueryData(['cmsNavigation'], mappedItems);
    });
    return () => { channel.unsubscribe(); };
  }, [queryClient]);

  // External training links that override CMS/fallback values
  const EXTERNAL_TRAINING_LINKS: Record<string, { href: string; external: true }> = {
    'Sedera Training': { href: 'https://sedera.my.salesforce-sites.com/Affiliate/apex/Affiliate_Contact_Form?Contact.Parent_Affiliate_Account__c=0011N00001vSpDl', external: true },
    'Zion Training': { href: 'https://zionhealthshare.thinkific.com/courses/zionhealthshare', external: true },
  };

  // Use CMS navigation if available, otherwise fallback. Inject Quick Links after Forms if not already present.
  const navigation = useMemo(() => {
    let base = cmsNavItems.length > 0 ? cmsNavItems : fallbackNavigation;

    // Override Sedera/Zion training links to external URLs
    base = base.map(item => {
      if (item.children) {
        return {
          ...item,
          children: item.children.map(child => {
            const override = EXTERNAL_TRAINING_LINKS[child.name];
            return override ? { ...child, ...override } : child;
          }),
        };
      }
      return item;
    });

    // Inject items that may not exist in CMS nav
    if (!base.some((item) => item.href === '/quick-links' || item.name === 'Resource Center')) {
      base.push({ name: 'Resource Center', href: '/quick-links', icon: Link });
    }
    if (!base.some((item) => item.href === '/videos' || item.name === 'Video Library')) {
      base.push({ name: 'Video Library', href: '/videos', icon: Video });
    }
    if (!base.some((item) => item.href === '/leads' || item.name === 'Assigned Leads')) {
      base.push({ name: 'Assigned Leads', href: '/leads', icon: Users });
    }
    if (!base.some((item) => item.href === '/tickets' || item.name === 'Support Tickets')) {
      base.push({ name: 'Support Tickets', href: '/tickets', icon: Headphones });
    }

    // Admin-only: Ticket Management
    if (isAdminUser) {
      if (!base.some((item) => item.href === '/admin/tickets' || item.name === 'Ticket Management')) {
        base.push({ name: 'Ticket Management', href: '/admin/tickets', icon: ShieldCheck });
      }
    } else {
      base = base.filter((item) => item.name !== 'Ticket Management');
    }

    // Enforce sidebar order
    const ORDER: string[] = ['Dashboard', 'Bulletins', 'Resource Center', 'Resources', 'Forms', 'Training', 'Video Library', 'Submit Group', 'Support Tickets', 'Ticket Management', 'Contact'];
    base = [...base].sort((a, b) => {
      const ai = ORDER.indexOf(a.name);
      const bi = ORDER.indexOf(b.name);
      return (ai === -1 ? ORDER.length : ai) - (bi === -1 ? ORDER.length : bi);
    });

    // If training gate applies and not admin, only show Training in the nav
    const trainingRequired =
      profile &&
      !isAdminUser &&
      !isAdvisorExemptFromTrainingGate(profile, ADVISOR_TRAINING_GATE_CUTOFF_MS, sessionUserCreatedAt);
    if (trainingRequired) {
      return base.filter(
        (item) => item.name === 'Training' || item.href === '/training'
      );
    }

    return base;
  }, [cmsNavItems, isAdminUser, profile, sessionUserCreatedAt]);

  // Determine if today is a meeting day (2nd or 4th Tuesday)
  // NOTE: This useMemo MUST be above the early returns to satisfy React's Rules of Hooks.
  const meetingInfo = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayOfWeek = today.getDay();

    // Check if today is a Tuesday
    const isTuesday = dayOfWeek === 2;

    // Find which Tuesday of the month this is
    let tuesayCount = 0;
    if (isTuesday) {
      for (let d = 1; d <= today.getDate(); d++) {
        const date = new Date(today.getFullYear(), today.getMonth(), d);
        if (date.getDay() === 2) tuesayCount++;
      }
    }

    const isMeetingDay = isTuesday && (tuesayCount === 2 || tuesayCount === 4);

    // Find next meeting date (next 2nd or 4th Tuesday)
    let nextMeeting: Date | null = null;
    let month = now.getMonth();
    let year = now.getFullYear();
    let found = false;

    while (!found) {
      const tuesdays: Date[] = [];
      for (let d = 1; d <= 31; d++) {
        const date = new Date(year, month, d);
        if (date.getMonth() !== month) break;
        if (date.getDay() === 2) tuesdays.push(date);
      }
      const targets = [tuesdays[1], tuesdays[3]].filter(Boolean);
      for (const t of targets) {
        if (t && t > today) {
          nextMeeting = t;
          found = true;
          break;
        }
      }
      if (!found) {
        month++;
        if (month > 11) { month = 0; year++; }
      }
    }

    return { isMeetingDay, nextMeeting };
  }, []);

  // No Supabase session — route unauthenticated visitors based on brand:
  //   * ARYX hosts (advisor.aryxcloud.com)  → /landing (marketing page)
  //   * MPB Health hosts (advisor.mpb.health) → /login (skip marketing entirely
  //     so MPB tenants never see the ARYX-branded parent platform pitch).
  // We avoid kicking users who DO have a session but suffered a transient
  // profile-fetch failure (they get the recovery UI below instead).
  if (!loading && !hasSession) {
    const target = detectBrand() === 'aryx' ? '/landing' : '/login';
    return <Navigate to={target} replace />;
  }

  // Session exists but profile never hydrated — recovery UI (not login; session is still valid)
  if (!loading && hasSession && !profile && !profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--surface-primary))] p-6">
        <div className="max-w-md w-full rounded-2xl border border-th-border bg-th-surface-secondary p-8 shadow-lg text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h1 className="text-lg font-semibold text-th-text-primary">Couldn&apos;t load your profile</h1>
          <p className="text-sm text-th-text-secondary">
            {profileError ||
              'Something went wrong while loading your account. You are still signed in — try again, or sign out and back in.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button type="button" variant="primary" onClick={() => void refreshProfile()}>
              Try again
            </Button>
            <Button type="button" variant="secondary" onClick={() => void logout()}>
              Sign out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Force password change for newly imported accounts
  if (!loading && profile?.must_change_password) {
    return <Navigate to="/change-password" replace />;
  }

  const isShellLoading = loading || (!profile && profileLoading);

  // Add badge to Bulletins nav item
  const navWithBadges: NavItem[] = navigation.map((item) => {
    if (item.name === 'Bulletins' && unreadBulletinCount > 0) {
      return {
        ...item,
        badge: (
          <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
            {unreadBulletinCount}
          </span>
        ),
      };
    }
    return item;
  });

  const userSection = (
    <div className="space-y-1">
      {isShellLoading ? (
        /* Skeleton user row while profile loads */
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-8 h-8 rounded-full bg-[rgb(var(--sidebar-text)_/_0.12)] animate-pulse" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="h-3.5 w-24 rounded bg-[rgb(var(--sidebar-text)_/_0.12)] animate-pulse" />
            <div className="h-2.5 w-16 rounded bg-[rgb(var(--sidebar-text)_/_0.08)] animate-pulse" />
          </div>
        </div>
      ) : (
      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
            isActive
              ? 'bg-[rgb(var(--sidebar-active-bg)_/_0.15)] text-[rgb(var(--sidebar-text-active))]'
              : 'text-[rgb(var(--sidebar-text))] hover:text-[rgb(var(--sidebar-text-active))] hover:bg-[rgb(var(--sidebar-hover))]'
          }`
        }
      >
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt=""
            aria-hidden="true"
            role="presentation"
            className="w-8 h-8 rounded-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
          />
        ) : null}
        <div className={`w-8 h-8 bg-[rgb(var(--sidebar-text)_/_0.12)] rounded-full flex items-center justify-center ${profile?.avatar_url ? 'hidden' : ''}`}>
          <User className="w-4 h-4 text-[rgb(var(--sidebar-text))]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-[rgb(var(--sidebar-text-active))]">
            {profile?.first_name} {profile?.last_name}
          </p>
          <p className="text-xs text-[rgb(var(--sidebar-text)_/_0.7)] truncate">
            {profile?.specialization}
          </p>
        </div>
      </NavLink>
      )}

      <button
        type="button"
        onClick={openSupport}
        disabled={ssoLoading}
        className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-[rgb(var(--sidebar-text))] hover:text-[rgb(var(--sidebar-text-active))] hover:bg-[rgb(var(--sidebar-hover))] transition-all duration-150 disabled:opacity-50"
      >
        <Headphones className="w-[18px] h-[18px]" />
        <span>{ssoLoading ? 'Opening...' : 'Support Portal'}</span>
      </button>

      <button
        type="button"
        onClick={logout}
        className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-[rgb(var(--sidebar-text))] hover:text-[rgb(var(--sidebar-text-active))] hover:bg-[rgb(var(--sidebar-hover))] transition-all duration-150"
      >
        <LogOut className="w-[18px] h-[18px]" />
        <span>Sign Out</span>
      </button>
    </div>
  );

  const topBarActions = (
    <>
      {/* Meeting Button */}
      {meetingInfo.isMeetingDay ? (
        <a
          href="https://teams.microsoft.com/l/meetup-join/19%3ameeting_ODY1ZGM0NjEtYWIwNi00YzdmLTg1MjEtZWRiODEwZDc3NDVh%40thread.v2/0?context=%7b%22Tid%22%3a%22ad4e49c8-3dea-4d37-8be6-ee2fdc324f04%22%2c%22Oid%22%3a%22ad01a7ba-787a-4389-97d2-90b3ec45896c%22%7d"
          target="_blank"
          rel="noopener noreferrer"
          className="relative flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white rounded-full text-sm font-medium hover:bg-red-600 transition-colors animate-pulse"
        >
          <Radio className="w-4 h-4" />
          <span className="hidden md:inline">Live Meeting</span>
        </a>
      ) : (
        <div className="relative group">
          <button
            type="button"
            disabled
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-400 text-white rounded-full text-sm font-medium cursor-not-allowed opacity-75"
          >
            <Video className="w-4 h-4" />
            <span className="hidden md:inline">Meeting</span>
          </button>
          {meetingInfo.nextMeeting && (
            <div className="absolute top-full mt-2 right-0 z-50 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
              Next meeting: {format(meetingInfo.nextMeeting, 'EEEE, MMM d')}
              <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 rotate-45" />
            </div>
          )}
        </div>
      )}

      {/* Notification Center */}
      <NotificationCenter />
    </>
  );

  return (
    <>
      {/* Command Palette (Cmd+K) */}
      <CommandPalette />

      {/* Onboarding Wizard for new users */}
      <OnboardingWizard />

      {/* Keyboard Shortcuts Modal (press ?) */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Add padding for mobile bottom nav */}
      <div className="pb-16 lg:pb-0">
        <AppLayout
        appName="Advisor Portal"
        logoSrc={getBrandLogo()}
        navigation={navWithBadges}
        initialCollapsed={userPreferences?.sidebar_collapsed ?? false}
        portalSwitcher={
          <PortalSwitcher
            currentPortal="advisors"
            canAccessAdmin={canAccessAdmin}
            canAccessCRM={canAccessCrm}
            canAccessAdvisor={canAccessAdvisor}
            getPortalUrl={safeGetPortalUrl}
            getPortalUrlWithSSO={getPortalUrlWithSSO}
          />
        }
        userSection={userSection}
        topBarCenter={<GlobalSearch />}
        topBarActions={topBarActions}
        renderNavLink={(item, props) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `${props.className} ${
                isActive
                  ? 'bg-[rgb(var(--sidebar-active-bg)_/_0.15)] text-[rgb(var(--sidebar-text-active))]'
                  : 'text-[rgb(var(--sidebar-text))] hover:text-[rgb(var(--sidebar-text-active))] hover:bg-[rgb(var(--sidebar-hover))]'
              }`
            }
            onClick={(e) => {
              e.preventDefault();
              props.onClick?.();
              // Do not wrap in startTransition — same issue as v7_startTransition: lazy routes + Outlet can
              // desync (blank main content until a full reload). See main.tsx BrowserRouter future flags.
              navigate(item.href);
            }}
            onMouseEnter={() => prefetchRouteByPath(item.href)}
            onFocus={() => prefetchRouteByPath(item.href)}
          >
            {props.children}
          </NavLink>
        )}
        renderChildNavLink={(child, props) =>
          child.external ? (
            <a
              key={child.name}
              href={child.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`${props.className} text-[rgb(var(--sidebar-text)_/_0.7)] hover:text-[rgb(var(--sidebar-text-active))]`}
              onClick={props.onClick}
            >
              {props.children}
            </a>
          ) : (
            <NavLink
              key={child.name}
              to={child.href}
              className={({ isActive }) =>
                `${props.className} ${
                  isActive
                    ? 'text-[rgb(var(--sidebar-text-active))] font-medium'
                    : 'text-[rgb(var(--sidebar-text)_/_0.7)] hover:text-[rgb(var(--sidebar-text-active))]'
                }`
              }
              onClick={(e) => {
                e.preventDefault();
                props.onClick?.();
                navigate(child.href);
              }}
            >
              {props.children}
            </NavLink>
          )
        }
      >
        {isShellLoading ? (
          <AdvisorPageLoader
            message="Loading your workspace…"
            subtitle="Setting up your profile and navigation."
          />
        ) : (
          <div className="relative min-h-[12rem]">
            <TrainingGate isAdmin={isAdminUser} isAdminPending={isAdminRolePending}>
              {/* Avoid key={pathname}: remounting the whole outlet on every navigation fights lazy routes and
                  Suspense, and contributed to blank content until refresh alongside deferred navigation updates. */}
              <Outlet />
            </TrainingGate>
          </div>
        )}
      </AppLayout>
      </div>
    </>
  );
}
