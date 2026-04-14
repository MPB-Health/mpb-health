import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, Outlet } from 'react-router-dom';
import { supabase } from '@mpbhealth/database';
import {
  LayoutDashboard,
  Headphones,
  UserCircle,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ChevronDown,
  Globe,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { QUICK_LINKS } from '@mpbhealth/concierge-core';

const NAV_ITEMS = [
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-1.5 -ml-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-600 to-cyan-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs">MPB</span>
              </div>
              <span className="font-semibold text-slate-800">Concierge Portal</span>
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
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
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
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
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
            <span className="text-sm text-slate-500 hidden sm:block">{user?.email}</span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Quick Links Bar */}
      <div className="bg-brand-navy border-b border-white/10 relative z-40" ref={dropdownRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-13">
            {QUICK_LINKS.map((link) =>
              link.children ? (
                <div key={link.name} className="relative flex-1 flex justify-center">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === link.name ? null : link.name)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                  >
                    {link.name}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === link.name ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === link.name && (
                    <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-xl border border-slate-200 py-1 min-w-[200px] z-[9999]">
                      {link.children.map((child) => (
                        <a
                          key={child.url}
                          href={child.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setOpenDropdown(null)}
                          className="flex items-center justify-between gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          {child.name}
                          <ExternalLink className="w-3 h-3 text-slate-400" />
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
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                >
                  {link.name}
                  <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                </a>
              ),
            )}
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-20 bg-black/20" onClick={() => setMobileOpen(false)}>
          <nav
            className="absolute top-14 left-0 right-0 bg-white border-b border-slate-200 shadow-lg p-3 space-y-1"
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
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
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
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
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
