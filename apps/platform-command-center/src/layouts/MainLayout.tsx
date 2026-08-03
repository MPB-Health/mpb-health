import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  AppWindow,
  Building2,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MailPlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { accounts } from '@/lib/accountsClient';

const nav = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/organizations', label: 'Organizations', icon: Building2 },
  { to: '/apps', label: 'Apps', icon: AppWindow },
  { to: '/licenses', label: 'Licenses', icon: KeyRound },
  { to: '/invitations', label: 'Invitations', icon: MailPlus },
];

export default function MainLayout() {
  const navigate = useNavigate();

  const signOut = async () => {
    await accounts.auth.signOut();
    toast.success('Signed out');
    navigate('/login');
  };

  return (
    <div className="min-h-[100dvh] lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-surface-line bg-surface-raised/80 backdrop-blur lg:border-b-0 lg:border-r">
        <div className="px-5 py-6">
          <p className="font-display text-2xl tracking-tight text-ink">ARYX</p>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-ink-muted">
            Platform Command Center
          </p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-4 lg:flex-col">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-accent-soft text-accent-deep'
                    : 'text-ink-muted hover:bg-surface hover:text-ink',
                ].join(' ')
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden px-3 pb-6 lg:block">
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-muted transition hover:bg-surface hover:text-ink"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
      <main className="px-4 py-6 sm:px-8">
        <Outlet />
      </main>
    </div>
  );
}
