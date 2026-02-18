import { useState, useEffect, useMemo, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { format } from 'date-fns';
import * as LucideIcons from 'lucide-react';
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
} from 'lucide-react';
import { AppLayout, PortalSwitcher, type NavItem } from '@mpbhealth/ui';
import { getPortalUrl } from '@mpbhealth/config';
import { navigationService, type NavMenuItem } from '@mpbhealth/advisor-core';
import { useAdvisor } from '../contexts/AdvisorContext';
import { NotificationCenter } from '../components/notifications';
import { CommandPalette } from '../components/command-palette';
import { MobileBottomNav } from '../components/mobile';
import { PWAInstallPrompt } from '../components/pwa';
import { OnboardingWizard } from '../components/onboarding';
import { KeyboardShortcutsModal } from '../components/command-palette';
import { useCommandPalette } from '../hooks/useSearch';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useUserPreferences } from '../hooks/useSettings';

// Icon mapping for dynamic icons from CMS
const iconMap: Record<string, LucideIcons.LucideIcon> = {
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
};

// Get icon component from string name
function getIconComponent(iconName: string): LucideIcons.LucideIcon {
  // Try direct mapping first
  if (iconMap[iconName]) {
    return iconMap[iconName];
  }
  // Try to get from LucideIcons dynamically
  const lucideModule = LucideIcons as Record<string, unknown>;
  if (lucideModule[iconName] && typeof lucideModule[iconName] === 'function') {
    return lucideModule[iconName] as LucideIcons.LucideIcon;
  }
  // Fallback to Link icon
  return Link;
}

// Fallback navigation for when CMS data isn't available
const fallbackNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Quick Links', href: '/quick-links', icon: Link },
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
  { name: 'SOPs & Playbooks', href: '/sops', icon: BookOpen },
  { name: 'Bulletins', href: '/bulletins', icon: Bell },
  { name: 'Submit Group', href: '/submit-group', icon: UsersRound },
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

// Cache for CMS navigation
let cachedNavItems: NavItem[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function MainLayout() {
  const navigate = useNavigate();
  const { profile, unreadBulletinCount, logout, loading } = useAdvisor();
  const { open: openCommandPalette } = useCommandPalette();
  const { showShortcutsModal, setShowShortcutsModal } = useKeyboardShortcuts();
  const { preferences: userPreferences } = useUserPreferences();

  // Dynamic navigation from CMS with caching
  const [cmsNavItems, setCmsNavItems] = useState<NavItem[]>(cachedNavItems || []);
  const [navLoading, setNavLoading] = useState(!cachedNavItems);

  // Load navigation from CMS (with hierarchy for submenus)
  const loadNavigation = useCallback(async () => {
    // Check cache first
    if (cachedNavItems && Date.now() - cacheTimestamp < CACHE_DURATION) {
      setCmsNavItems(cachedNavItems);
      setNavLoading(false);
      return;
    }

    try {
      // Use getNavMenuItems() to get hierarchical data with children
      const items = await navigationService.getNavMenuItems();
      if (items && items.length > 0) {
        const mappedItems = mapMenuItemsToNavItems(items);
        cachedNavItems = mappedItems;
        cacheTimestamp = Date.now();
        setCmsNavItems(mappedItems);
      }
    } catch (error) {
      console.error('Failed to load navigation from CMS:', error);
      // Will use fallback navigation
    } finally {
      setNavLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNavigation();

    // Subscribe to real-time navigation changes
    const channel = navigationService.subscribeToNavMenuChanges((items) => {
      // Items already come as a tree structure from subscribeToNavMenuChanges
      const mappedItems = mapMenuItemsToNavItems(items);
      cachedNavItems = mappedItems;
      cacheTimestamp = Date.now();
      setCmsNavItems(mappedItems);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [loadNavigation]);

  // Use CMS navigation if available, otherwise fallback. Inject Quick Links after Forms if not already present.
  const navigation = useMemo(() => {
    const base = cmsNavItems.length > 0 ? cmsNavItems : fallbackNavigation;
    const hasQuickLinks = base.some((item) => item.href === '/quick-links' || item.name === 'Quick Links');
    if (hasQuickLinks) return base;
    const quickLinksItem: NavItem = { name: 'Quick Links', href: '/quick-links', icon: Link };
    const formsIndex = base.findIndex(
      (item) => item.name === 'Forms' || item.href === '/forms'
    );
    if (formsIndex === -1) {
      return [...base, quickLinksItem];
    }
    return [
      ...base.slice(0, formsIndex + 1),
      quickLinksItem,
      ...base.slice(formsIndex + 1),
    ];
  }, [cmsNavItems]);

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

  // Redirect to login if not authenticated
  if (!loading && !profile) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-secondary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-th-accent-600"></div>
      </div>
    );
  }

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
      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
            isActive
              ? 'bg-white/15 text-white'
              : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
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
          />
        ) : (
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white/80" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="truncate text-white">
            {profile?.first_name} {profile?.last_name}
          </p>
          <p className="text-xs text-white/50 truncate">
            {profile?.specialization}
          </p>
        </div>
      </NavLink>

      <button
        onClick={logout}
        className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.08] transition-all duration-150"
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
        <button
          onClick={() => {/* Link will be added later */}}
          className="relative flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white rounded-full text-sm font-medium hover:bg-red-600 transition-colors animate-pulse"
        >
          <Radio className="w-4 h-4" />
          <span className="hidden md:inline">Live Meeting</span>
        </button>
      ) : (
        <div className="relative group">
          <button
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
        logoSrc="/favicon.svg"
        navigation={navWithBadges}
        initialCollapsed={userPreferences?.sidebar_collapsed ?? false}
        userSection={userSection}
        topBarActions={topBarActions}
        renderNavLink={(item, props) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `${props.className} ${
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
              }`
            }
            onClick={props.onClick}
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
              className={`${props.className} text-white/50 hover:text-white`}
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
                    ? 'text-white font-medium'
                    : 'text-white/50 hover:text-white'
                }`
              }
              onClick={props.onClick}
            >
              {props.children}
            </NavLink>
          )
        }
      >
        <Outlet />
      </AppLayout>
      </div>
    </>
  );
}
