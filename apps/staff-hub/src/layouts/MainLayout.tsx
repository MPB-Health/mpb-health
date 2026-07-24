import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, Outlet } from 'react-router-dom';
import { supabase } from '@mpbhealth/database';
import { useTheme } from '@mpbhealth/ui';
import {
  LayoutDashboard,
  StickyNote,
  CheckSquare,
  UserCircle,
  LogOut,
  Menu,
  X,
  CalendarDays,
  CalendarClock,
  ClipboardList,
  Clock3,
  Users,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  HR_ATTENDANCE_ENABLED,
  HR_TIME_OFF_ENABLED,
  checkIsStaffHr,
} from '../lib/hr';
import { HubAtmosphereControl } from '../components/HubAtmosphereControl';
import { InstallAppModal } from '../components/InstallAppModal';
import { useStaffHubInstall } from '../hooks/useStaffHubInstall';

type NavItem = { name: string; href: string; icon: typeof LayoutDashboard };

function buildNav(isHr: boolean): { label: string; items: NavItem[] }[] {
  const workspace: NavItem[] = [
    { name: 'Hub', href: '/', icon: LayoutDashboard },
    { name: 'Notes', href: '/notes', icon: StickyNote },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Profile', href: '/profile', icon: UserCircle },
  ];

  const time: NavItem[] = [];
  if (HR_ATTENDANCE_ENABLED) {
    time.push({ name: 'Attendance', href: '/attendance', icon: Clock3 });
  }
  if (HR_TIME_OFF_ENABLED) {
    time.push(
      { name: 'Time Off', href: '/time-off', icon: CalendarClock },
      { name: 'Calendar', href: '/calendar', icon: CalendarDays },
    );
  }

  const groups: { label: string; items: NavItem[] }[] = [
    { label: 'Workspace', items: workspace },
  ];
  if (time.length > 0) {
    groups.push({ label: 'Time', items: time });
  }
  if (isHr && (HR_ATTENDANCE_ENABLED || HR_TIME_OFF_ENABLED)) {
    const people: NavItem[] = [];
    if (HR_TIME_OFF_ENABLED) {
      people.push({ name: 'HR Queue', href: '/hr', icon: ClipboardList });
    }
    if (HR_ATTENDANCE_ENABLED) {
      people.push({ name: 'Roster', href: '/hr/roster', icon: Users });
    }
    if (people.length > 0) {
      groups.push({ label: 'People', items: people });
    }
  }
  return groups;
}

function pageTitle(pathname: string): string {
  if (pathname === '/') return 'Hub';
  if (pathname.startsWith('/attendance')) return 'Attendance';
  if (pathname.startsWith('/time-off/new')) return 'New request';
  if (pathname.startsWith('/time-off/')) return 'Request';
  if (pathname.startsWith('/time-off')) return 'Time Off';
  if (pathname.startsWith('/calendar')) return 'Calendar';
  if (pathname.startsWith('/hr/roster')) return 'Roster';
  if (pathname.startsWith('/hr')) return 'HR Queue';
  if (pathname.startsWith('/notes')) return 'Notes';
  if (pathname.startsWith('/tasks')) return 'Tasks';
  if (pathname.startsWith('/profile')) return 'Profile';
  return 'Staff Hub';
}

function NavGroups({
  groups,
  onNavigate,
}: {
  groups: { label: string; items: NavItem[] }[];
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="hub-side-label">{group.label}</p>
          <nav className="mt-2 space-y-0.5" aria-label={group.label}>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === '/'}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `hub-side-link ${isActive ? 'hub-side-link-active' : ''}`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-80" strokeWidth={1.75} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      ))}
    </div>
  );
}

export default function MainLayout() {
  const location = useLocation();
  const { resolvedTheme } = useTheme();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [isHr, setIsHr] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const install = useStaffHubInstall();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (u) {
        setUser({ email: u.email ?? '' });
        setIsHr(await checkIsStaffHr());
      }
    });
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]:not([media])');
    const color = resolvedTheme === 'dark' ? '#0a1620' : '#0A4E8E';
    if (meta) {
      meta.setAttribute('content', color);
    } else {
      const el = document.createElement('meta');
      el.name = 'theme-color';
      el.content = color;
      document.head.appendChild(el);
    }
  }, [resolvedTheme]);

  const groups = useMemo(() => buildNav(isHr), [isHr]);
  const title = pageTitle(location.pathname);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out');
    window.location.href = '/login';
  };

  return (
    <div className="hub-shell hub-shell-rail" data-theme={resolvedTheme}>
      <aside className="hub-sidebar" aria-label="Staff Hub sidebar">
        <div className="hub-sidebar-inner">
          <div className="flex items-center gap-3 px-1">
            <div className="hub-mark" aria-hidden>
              MPB
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-[color:var(--hr-ink)]">
                Staff Hub
              </p>
              <p className="truncate text-[11px] text-[color:var(--hr-muted)]">
                Healthshare ops
              </p>
            </div>
          </div>

          <div className="mt-8 flex-1 overflow-y-auto pr-1">
            <NavGroups groups={groups} />
          </div>

          <div className="mt-6 space-y-4 border-t border-[color:var(--hr-line)] pt-4">
            <HubAtmosphereControl />
            {!install.isInstalled && !install.isStandalone ? (
              <button
                type="button"
                onClick={() => install.openModal()}
                className="hub-side-link w-full"
              >
                <Download className="h-4 w-4 shrink-0 opacity-80" strokeWidth={1.75} />
                <span>Install app</span>
              </button>
            ) : null}
            <div>
              <p className="truncate px-2.5 text-[11px] text-[color:var(--hr-muted)]">
                {user?.email ?? 'Signed in'}
              </p>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="hub-side-link mt-2 w-full"
              >
                <LogOut className="h-4 w-4 shrink-0 opacity-80" strokeWidth={1.75} />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="hub-content">
        <header className="hub-mobile-bar lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="hub-icon-btn"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 text-center">
            <p className="truncate text-sm font-semibold text-[color:var(--hr-ink)]">{title}</p>
          </div>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="hub-icon-btn"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </header>

        {mobileOpen ? (
          <>
            <button
              type="button"
              className="hub-drawer-scrim lg:hidden"
              aria-label="Close menu overlay"
              onClick={() => setMobileOpen(false)}
            />
            <div className="hub-mobile-drawer-rail lg:hidden" role="dialog" aria-label="Navigation">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="hub-mark" aria-hidden>
                    MPB
                  </div>
                  <p className="text-sm font-semibold text-[color:var(--hr-ink)]">Menu</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="hub-icon-btn"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <NavGroups groups={groups} onNavigate={() => setMobileOpen(false)} />
              <div className="mt-8 border-t border-[color:var(--hr-line)] pt-4">
                <HubAtmosphereControl />
                {!install.isInstalled && !install.isStandalone ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      install.openModal();
                    }}
                    className="hub-side-link mt-4 w-full"
                  >
                    <Download className="h-4 w-4 shrink-0 opacity-80" strokeWidth={1.75} />
                    <span>Install app</span>
                  </button>
                ) : null}
                <p className="mt-4 truncate px-2.5 text-[11px] text-[color:var(--hr-muted)]">
                  {user?.email ?? 'Signed in'}
                </p>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="hub-side-link mt-2 w-full"
                >
                  <LogOut className="h-4 w-4 shrink-0 opacity-80" strokeWidth={1.75} />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </>
        ) : null}

        <main className="hub-main" key={location.pathname}>
          <Outlet />
        </main>
      </div>

      <InstallAppModal
        open={install.modalOpen}
        canNativeInstall={install.canNativeInstall}
        needsManualInstall={install.needsManualInstall}
        manualSteps={install.manualSteps}
        onInstall={() => void install.install()}
        onDismiss={() => install.dismiss(14)}
        onClose={install.closeModal}
      />
    </div>
  );
}
