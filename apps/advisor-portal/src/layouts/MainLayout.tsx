import { useState, useEffect, useMemo, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import {
  LayoutDashboard,
  GraduationCap,
  Video,
  FileText,
  BookOpen,
  Bell,
  User,
  LogOut,
  Radio,
  Inbox,
  Settings,
  Search,
  Link,
} from 'lucide-react';
import { AppLayout, PortalSwitcher, type NavItem } from '@mpbhealth/ui';
import { getPortalUrl } from '@mpbhealth/config';
import { navigationService, type NavMenuItem } from '@mpbhealth/advisor-core';
import { useAdvisor } from '../contexts/AdvisorContext';
import LiveMeetingBanner from '../components/LiveMeetingBanner';
import { NotificationCenter } from '../components/notifications';
import { CommandPalette } from '../components/command-palette';
import { MobileBottomNav } from '../components/mobile';
import { PWAInstallPrompt } from '../components/pwa';
import { OnboardingWizard } from '../components/onboarding';
import { KeyboardShortcutsModal } from '../components/command-palette';
import { useCommandPalette } from '../hooks/useSearch';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

// Icon mapping for dynamic icons from CMS
const iconMap: Record<string, LucideIcons.LucideIcon> = {
  LayoutDashboard,
  GraduationCap,
  Video,
  FileText,
  BookOpen,
  Bell,
  User,
  Inbox,
  Settings,
  Link,
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
  { name: 'Inbox', href: '/inbox', icon: Inbox },
  { name: 'Training', href: '/training', icon: GraduationCap },
  { name: 'Meetings', href: '/meetings', icon: Video },
  { name: 'Forms', href: '/forms', icon: FileText },
  { name: 'SOPs & Playbooks', href: '/sops', icon: BookOpen },
  { name: 'Bulletins', href: '/bulletins', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
];

// Convert CMS nav items to AppLayout NavItem format
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
    }));
}

// Cache for CMS navigation
let cachedNavItems: NavItem[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function MainLayout() {
  const navigate = useNavigate();
  const { profile, liveMeetings, unreadBulletinCount, logout, loading } = useAdvisor();
  const { open: openCommandPalette } = useCommandPalette();
  const { showShortcutsModal, setShowShortcutsModal } = useKeyboardShortcuts();

  // Dynamic navigation from CMS with caching
  const [cmsNavItems, setCmsNavItems] = useState<NavItem[]>(cachedNavItems || []);
  const [navLoading, setNavLoading] = useState(!cachedNavItems);

  // Load navigation from CMS
  const loadNavigation = useCallback(async () => {
    // Check cache first
    if (cachedNavItems && Date.now() - cacheTimestamp < CACHE_DURATION) {
      setCmsNavItems(cachedNavItems);
      setNavLoading(false);
      return;
    }

    try {
      const items = await navigationService.getNavMenuItemsFlat();
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
      const activeItems = items.filter(item => !item.parent_id);
      const mappedItems = mapMenuItemsToNavItems(activeItems);
      cachedNavItems = mappedItems;
      cacheTimestamp = Date.now();
      setCmsNavItems(mappedItems);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [loadNavigation]);

  // Use CMS navigation if available, otherwise fallback
  const navigation = useMemo(() => {
    if (cmsNavItems.length > 0) {
      return cmsNavItems;
    }
    return fallbackNavigation;
  }, [cmsNavItems]);

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
      {/* Live meeting indicator */}
      {liveMeetings.length > 0 && (
        <button
          onClick={() => navigate(`/meetings/${liveMeetings[0].id}`)}
          className="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white rounded-full text-sm font-medium animate-pulse"
        >
          <Radio className="w-4 h-4" />
          <span>Live Meeting</span>
        </button>
      )}

      {/* Global Search Button */}
      <button
        onClick={() => openCommandPalette('search')}
        className="flex items-center gap-2 px-3 py-1.5 text-th-text-secondary hover:text-th-text-primary bg-surface-secondary hover:bg-surface-tertiary rounded-lg transition-colors"
      >
        <Search className="w-4 h-4" />
        <span className="text-sm hidden md:inline">Search</span>
        <kbd className="hidden md:inline text-xs text-th-text-muted bg-surface-tertiary px-1.5 py-0.5 rounded font-mono">
          ⌘K
        </kbd>
      </button>

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

      {/* Live Meeting Banner */}
      {liveMeetings.length > 0 && <LiveMeetingBanner meetings={liveMeetings} />}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Add padding for mobile bottom nav */}
      <div className="pb-16 lg:pb-0">
        <AppLayout
        appName="Advisor Portal"
        logoSrc="/logo.png"
        navigation={navWithBadges}
        portalSwitcher={
          <PortalSwitcher
            currentPortal="advisors"
            canAccessAdmin={false}
            canAccessCRM={false}
            canAccessAdvisor={true}
            getPortalUrl={getPortalUrl}
          />
        }
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
      >
        <Outlet />
      </AppLayout>
      </div>
    </>
  );
}
