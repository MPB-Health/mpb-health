import React, { useState, useCallback, useEffect } from 'react';
import { cn } from '../utils';
import { Menu, X, ChevronLeft } from 'lucide-react';
import { ThemeToggle } from '../theme/ThemeToggle';

/* ============================================================================
   Types
   ============================================================================ */

export interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: React.ReactNode;
  children?: { name: string; href: string; external?: boolean }[];
}

export interface AppLayoutProps {
  children: React.ReactNode;
  appName: string;
  logoSrc?: string;
  navigation: NavItem[];
  userSection?: React.ReactNode;
  topBarActions?: React.ReactNode;
  /** Content rendered in the center of the top bar (e.g. global search) */
  topBarCenter?: React.ReactNode;
  /** Optional portal switcher dropdown to enable navigation between portals */
  portalSwitcher?: React.ReactNode;
  /** Persistent footer bar rendered at the bottom of the viewport */
  footerBar?: React.ReactNode;
  /** Initial collapsed state for the sidebar */
  initialCollapsed?: boolean;
  renderNavLink: (item: NavItem, props: NavLinkRenderProps) => React.ReactNode;
  renderChildNavLink?: (child: { name: string; href: string; external?: boolean }, props: ChildNavLinkRenderProps) => React.ReactNode;
}

export interface NavLinkRenderProps {
  className: string;
  onClick: () => void;
  children: React.ReactNode;
}

export interface ChildNavLinkRenderProps {
  className: string;
  onClick: () => void;
  children: React.ReactNode;
}

/* ============================================================================
   Component
   ============================================================================ */

export function AppLayout({
  children,
  appName,
  logoSrc,
  navigation,
  userSection,
  topBarActions,
  topBarCenter,
  portalSwitcher,
  footerBar,
  initialCollapsed = false,
  renderNavLink,
  renderChildNavLink,
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Listen for mobile sidebar open event (from MobileBottomNav "More" button)
  useEffect(() => {
    const handleOpenMobileSidebar = () => setSidebarOpen(true);
    window.addEventListener('open-mobile-sidebar', handleOpenMobileSidebar);
    return () => window.removeEventListener('open-mobile-sidebar', handleOpenMobileSidebar);
  }, []);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const toggleGroup = useCallback((name: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const sidebarWidth = collapsed && !isMobile ? 'w-[72px]' : 'w-72';
  const mainMargin = collapsed && !isMobile ? 'lg:pl-[72px]' : 'lg:pl-72';

  return (
    <div className="min-h-screen bg-surface-secondary gradient-mesh">
      {/* ---- Mobile overlay ---- */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* ---- Sidebar ---- */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full flex flex-col',
          'bg-[rgb(var(--sidebar-bg))] text-[rgb(var(--sidebar-text))]',
          'border-r border-[rgb(var(--sidebar-text)_/_0.1)] transition-all duration-300 ease-in-out',
          sidebarWidth,
          isMobile
            ? sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            : 'translate-x-0'
        )}
      >
        {/* Accent gradient strip */}
        <div className="absolute inset-y-0 left-0 w-[3px] sidebar-gradient-strip" />

        {/* ---- Logo area ---- */}
        <div className={cn(
          'border-b border-[rgb(var(--sidebar-text)_/_0.1)] shrink-0',
          collapsed && !isMobile ? 'flex items-center justify-center h-16 px-2' : 'px-4 py-3'
        )}>
          {collapsed && !isMobile ? (
            <>
              {logoSrc ? (
                <img src={logoSrc} alt={appName} className="w-8 h-8 rounded-lg object-contain" />
              ) : (
                <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-xs">{appName.slice(0, 3).toUpperCase()}</span>
                </div>
              )}
            </>
          ) : (
            <div className="relative flex flex-col items-center gap-2 py-1">
              <div className="absolute top-1 right-0">
                {isMobile ? (
                  <button
                    onClick={closeSidebar}
                    aria-label="Close sidebar"
                    className="p-1.5 rounded-lg text-[rgb(var(--sidebar-text))] hover:text-[rgb(var(--sidebar-text-active))] hover:bg-[rgb(var(--sidebar-hover))] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={() => setCollapsed(true)}
                    aria-label="Collapse sidebar"
                    className="p-1.5 rounded-lg text-[rgb(var(--sidebar-text)_/_0.6)] hover:text-[rgb(var(--sidebar-text-active))] hover:bg-[rgb(var(--sidebar-hover))] transition-colors hidden lg:flex"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
              </div>
              {logoSrc ? (
                <img src={logoSrc} alt={appName} className="h-8 w-auto object-contain" />
              ) : (
                <div className="w-12 h-12 rounded-lg gradient-accent flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-sm">{appName.slice(0, 3).toUpperCase()}</span>
                </div>
              )}
              <span className="text-[11px] font-medium text-[rgb(var(--sidebar-text)_/_0.7)] uppercase tracking-wider text-center">
                {appName}
              </span>
            </div>
          )}
        </div>

        {/* ---- Portal Switcher ---- */}
        {portalSwitcher && !(collapsed && !isMobile) && (
          <div className="px-3 py-2 border-b border-[rgb(var(--sidebar-text)_/_0.1)]">
            {portalSwitcher}
          </div>
        )}

        {/* ---- Navigation ---- */}
        <nav className={cn(
          'flex-1 overflow-y-auto py-4 space-y-1',
          collapsed && !isMobile ? 'px-2' : 'px-3'
        )}>
          {navigation.map((item) => {
            if (item.children && renderChildNavLink) {
              const isExpanded = expandedGroups.has(item.name);
              return (
                <div key={item.name}>
                  <button
                    onClick={() => toggleGroup(item.name)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                      'text-[rgb(var(--sidebar-text))] hover:text-[rgb(var(--sidebar-text-active))] hover:bg-[rgb(var(--sidebar-hover))]',
                      collapsed && !isMobile && 'justify-center px-0'
                    )}
                  >
                    <item.icon className="w-[18px] h-[18px] shrink-0" />
                    {!(collapsed && !isMobile) && (
                      <>
                        <span className="flex-1 text-left truncate">{item.name}</span>
                        <ChevronLeft className={cn(
                          'w-3.5 h-3.5 transition-transform duration-200',
                          isExpanded ? '-rotate-90' : 'rotate-0'
                        )} />
                      </>
                    )}
                  </button>
                  {isExpanded && !(collapsed && !isMobile) && (
                    <div className="ml-[30px] mt-1 space-y-0.5 border-l border-[rgb(var(--sidebar-text)_/_0.1)] pl-3">
                      {item.children.map((child) =>
                        renderChildNavLink(child, {
                          className: 'block px-3 py-2 rounded-lg text-sm transition-all duration-150',
                          onClick: closeSidebar,
                          children: child.name,
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            }

            const navContent = (
              <>
                <item.icon className="w-[18px] h-[18px] shrink-0" />
                {!(collapsed && !isMobile) && (
                  <>
                    <span className="flex-1 truncate">{item.name}</span>
                    {item.badge}
                  </>
                )}
              </>
            );

            return (
              <React.Fragment key={item.name}>
                {renderNavLink(item, {
                  className: cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    collapsed && !isMobile && 'justify-center px-0'
                  ),
                  onClick: closeSidebar,
                  children: navContent,
                })}
              </React.Fragment>
            );
          })}
        </nav>

        {/* ---- Bottom section: User + Theme ---- */}
        <div className={cn(
          'shrink-0 border-t border-[rgb(var(--sidebar-text)_/_0.1)]',
          collapsed && !isMobile ? 'p-2' : 'p-3'
        )}>
          {/* Expand button when collapsed */}
          {collapsed && !isMobile && (
            <button
              onClick={() => setCollapsed(false)}
              aria-label="Expand sidebar"
              className="w-full flex items-center justify-center p-2.5 rounded-xl text-[rgb(var(--sidebar-text)_/_0.6)] hover:text-[rgb(var(--sidebar-text-active))] hover:bg-[rgb(var(--sidebar-hover))] transition-colors mb-2"
            >
              <ChevronLeft className="w-4 h-4 rotate-180" />
            </button>
          )}

          {/* Theme toggle */}
          <div className={cn(
            'mb-2',
            collapsed && !isMobile ? 'flex justify-center' : ''
          )}>
            <ThemeToggle
              size="sm"
              showLabel={!(collapsed && !isMobile)}
              className="w-full justify-start text-[rgb(var(--sidebar-text))] hover:text-[rgb(var(--sidebar-text-active))] hover:bg-[rgb(var(--sidebar-hover))] rounded-xl px-3 py-2.5"
            />
          </div>

          {/* User section */}
          {userSection && !(collapsed && !isMobile) && userSection}
        </div>
      </aside>

      {/* ---- Main Content ---- */}
      <div className={cn('transition-all duration-300 ease-in-out', mainMargin)}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 glass border-b border-th-border/50">
          <div className="flex items-center h-14 px-4 md:px-6 gap-4">
            <div className="flex items-center gap-3 shrink-0">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
                className="p-2 rounded-lg text-th-text-secondary hover:text-th-text-primary hover:bg-surface-tertiary transition-colors lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

            {topBarCenter ? (
              <div className="flex-1 flex justify-center min-w-0">
                {topBarCenter}
              </div>
            ) : (
              <div className="flex-1" />
            )}

            {/* Right side actions */}
            <div className="flex items-center gap-2 shrink-0">
              {topBarActions}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className={cn('p-4 md:p-6 lg:p-8 w-full', footerBar && 'pb-16 md:pb-20')}>
          {children}
        </main>

        {/* Footer bar */}
        {footerBar}
      </div>
    </div>
  );
}
