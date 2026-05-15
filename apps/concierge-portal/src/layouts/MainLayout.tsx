import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, Outlet } from 'react-router-dom';
import { supabase } from '@mpbhealth/database';
import {
  ClipboardList,
  LayoutDashboard,
  Headphones,
  UserCircle,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ChevronDown,
  Globe,
  BarChart3,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { QUICK_LINKS } from '@mpbhealth/concierge-core';

const NAV_ITEMS = [
  { name: 'Daily Logs', href: '/daily-logs', icon: ClipboardList },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Resources', href: '/', icon: LayoutDashboard },
  { name: 'Tickets', href: '/tickets', icon: Headphones },
  { name: 'Member Portal', href: 'https://app.mpb.health/', icon: Globe, external: true },
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out');
    window.location.href = '/login';
  };

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-sage/20 via-white to-brand-sage/10">
      <header className="border-b border-brand-sage/30 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-1.5 -ml-1.5 text-brand-olive hover:text-brand-forest hover:bg-brand-sage/20 rounded-lg"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-forest to-brand-teal flex items-center justify-center">
                <span className="text-white font-bold text-xs">MPB</span>
              </div>
              <span className="font-semibold text-brand-forest">Concierge Portal</span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              if (item.external) {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-brand-olive hover:text-brand-forest hover:bg-brand-sage/20 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </a>
                );
              }
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-teal/10 text-brand-teal'
                        : 'text-brand-olive hover:text-brand-forest hover:bg-brand-sage/20'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-sm text-brand-olive hidden sm:block">{user?.email}</span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-brand-olive hover:text-brand-forest hover:bg-brand-sage/20 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Quick Links Bar */}
      <div className="bg-gradient-to-r from-brand-forest to-brand-forest/90 border-b border-brand-chartreuse/20 relative z-40" ref={dropdownRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-[68px]">
            {QUICK_LINKS.map((link) =>
              link.children ? (
                <div key={link.name} className="relative flex-1 flex justify-center">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === link.name ? null : link.name)}
                    className="flex items-center gap-2 px-5 py-3 rounded text-base font-medium text-brand-sage hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                  >
                    {link.name}
                    <ChevronDown className={`w-4.5 h-4.5 transition-transform ${openDropdown === link.name ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === link.name && (
                    <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-xl border border-brand-sage/30 py-1.5 min-w-[240px] z-[9999]">
                      {link.children.map((child) => (
                        <a
                          key={child.url}
                          href={child.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setOpenDropdown(null)}
                          className="flex items-center justify-between gap-2 px-5 py-2.5 text-sm text-brand-forest hover:bg-brand-sage/15 transition-colors"
                        >
                          {child.name}
                          <ExternalLink className="w-3.5 h-3.5 text-brand-olive" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded text-base font-medium text-brand-sage hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                >
                  {link.name}
                  <ExternalLink className="w-4.5 h-4.5 opacity-50" />
                </a>
              ),
            )}
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-20 bg-black/20" onClick={() => setMobileOpen(false)}>
          <nav
            className="absolute top-14 left-0 right-0 bg-white border-b border-brand-sage/30 shadow-lg p-3 space-y-1"
            onClick={(e) => e.stopPropagation()}
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              if (item.external) {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-brand-olive hover:text-brand-forest hover:bg-brand-sage/20 transition-colors"
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                    <ExternalLink className="w-3.5 h-3.5 opacity-50 ml-auto" />
                  </a>
                );
              }
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-teal/10 text-brand-teal'
                        : 'text-brand-olive hover:text-brand-forest hover:bg-brand-sage/20'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-0">
        <Outlet />
      </main>
    </div>
  );
}
