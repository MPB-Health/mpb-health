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
} from 'lucide-react';
import toast from 'react-hot-toast';
import { HR_TIME_OFF_ENABLED, checkIsStaffHr } from '../lib/hr';

const BASE_NAV = [
  { name: 'Hub', href: '/', icon: LayoutDashboard },
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
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUser({ email: session.user.email ?? '' });
    });
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navItems = useMemo(() => {
    const items = [...BASE_NAV];
    if (HR_TIME_OFF_ENABLED && checkIsStaffHr(user?.email)) {
      items.splice(3, 0, { name: 'HR', href: '/hr', icon: ClipboardList });
    }
    return items;
  }, [user?.email]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="-ml-1.5 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500">
                <span className="text-xs font-bold text-white">MPB</span>
              </div>
              <span className="font-semibold text-slate-800">Staff Hub</span>
            </div>
          </div>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:block">{user?.email}</span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-20 bg-black/20 lg:hidden" onClick={() => setMobileOpen(false)}>
          <nav
            className="absolute top-14 right-0 left-0 space-y-1 border-b border-slate-200 bg-white p-3 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
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

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
