import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, Outlet } from 'react-router-dom';
import { supabase } from '@mpbhealth/database';
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  HR_ATTENDANCE_ENABLED,
  HR_TIME_OFF_ENABLED,
  checkIsStaffHr,
} from '../lib/hr';

const BASE_NAV = [
  { name: 'Hub', href: '/', icon: LayoutDashboard },
  ...(HR_ATTENDANCE_ENABLED
    ? [{ name: 'Attendance', href: '/attendance', icon: Clock3 }]
    : []),
  ...(HR_TIME_OFF_ENABLED
    ? [
        { name: 'Time Off', href: '/time-off', icon: CalendarClock },
        { name: 'Calendar', href: '/calendar', icon: CalendarDays },
      ]
    : []),
  { name: 'Notes', href: '/notes', icon: StickyNote },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Profile', href: '/profile', icon: UserCircle },
];

export default function MainLayout() {
  const location = useLocation();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [isHr, setIsHr] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const navItems = useMemo(() => {
    const items = [...BASE_NAV];
    if (HR_TIME_OFF_ENABLED && isHr) {
      items.splice(
        HR_ATTENDANCE_ENABLED ? 4 : 3,
        0,
        { name: 'HR', href: '/hr', icon: ClipboardList },
        { name: 'Roster', href: '/hr/roster', icon: Users },
      );
    } else if (HR_ATTENDANCE_ENABLED && isHr) {
      items.splice(2, 0, { name: 'Roster', href: '/hr/roster', icon: Users });
    }
    return items;
  }, [isHr]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out');
    window.location.href = '/login';
  };

  return (
    <div className="hub-shell">
      <div className="hub-nav-island pt-3 sm:pt-4">
        <header className="hub-nav-glass">
          <div className="flex min-w-0 items-center gap-2.5 pl-1">
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-full p-2 text-[color:var(--hr-muted)] transition-colors hover:bg-[color:var(--hr-mist)] hover:text-[color:var(--hr-ink)] lg:hidden"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="hub-mark" aria-hidden>
              MPB
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-[color:var(--hr-ink)]">
                Staff Hub
              </p>
              <p className="hidden truncate text-[11px] text-[color:var(--hr-muted)] sm:block">
                Healthshare operations
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === '/'}
                  className={({ isActive }) =>
                    `hub-nav-link ${isActive ? 'hub-nav-link-active' : ''}`
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 pr-0.5">
            <span className="hidden max-w-[10rem] truncate text-xs text-[color:var(--hr-muted)] xl:block">
              {user?.email}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-[color:var(--hr-muted)] transition-colors hover:bg-[color:var(--hr-mist)] hover:text-[color:var(--hr-ink)]"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        {mobileOpen && (
          <div className="hub-mobile-drawer lg:hidden" role="dialog" aria-label="Navigation">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.href === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                        isActive
                          ? 'bg-[color:var(--hr-mist)] text-[color:var(--hr-accent-deep)]'
                          : 'text-[color:var(--hr-muted)] hover:bg-[color:var(--hr-mist)] hover:text-[color:var(--hr-ink)]'
                      }`
                    }
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-[color:var(--hr-ink)]/20 lg:hidden"
          aria-label="Close menu overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <main className="hub-main">
        <Outlet />
      </main>
    </div>
  );
}
