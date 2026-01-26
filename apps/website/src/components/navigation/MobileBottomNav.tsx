import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Layers, Calculator, Phone, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  authRequired?: boolean;
}

const navItems: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/',
    icon: Home,
  },
  {
    id: 'plans',
    label: 'Plans',
    href: '/plans',
    icon: Layers,
  },
  {
    id: 'quote',
    label: 'Quote',
    href: '/get-started',
    icon: Calculator,
  },
  {
    id: 'contact',
    label: 'Contact',
    href: '/contact',
    icon: Phone,
  },
];

const authNavItem: NavItem = {
  id: 'account',
  label: 'Account',
  href: '/member',
  icon: User,
  authRequired: true,
};

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const displayItems = user ? [...navItems.slice(0, 3), authNavItem] : navItems;

  const shouldShow = !location.pathname.startsWith('/admin') &&
                     !location.pathname.startsWith('/advisor/dashboard');

  if (!shouldShow) return null;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 shadow-2xl safe-area-inset-bottom">
      <div className="grid grid-cols-4 h-16">
        {displayItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.id}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-all duration-200',
                active
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-neutral-600 hover:text-blue-600 hover:bg-neutral-50'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 transition-transform',
                  active && 'scale-110'
                )}
              />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
