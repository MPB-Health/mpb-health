import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Zap,
  Inbox,
  MessageSquare,
  Menu,
} from 'lucide-react';
import { cn } from '@mpbhealth/ui';
import { useChat } from '../../hooks/useChat';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

const baseNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Inbox', href: '/inbox', icon: Inbox },
  { name: 'More', href: '/more', icon: Menu },
];

export function MobileBottomNav() {
  const location = useLocation();
  const { totalUnread } = useChat();

  // Inject live badge count into Chat nav item
  const mobileNavItems = baseNavItems.map((item) =>
    item.name === 'Chat' ? { ...item, badge: totalUnread } : item,
  );

  // Hide on certain pages (like conversation threads)
  const hiddenPaths = ['/inbox/', '/chat/'];
  const shouldHide = hiddenPaths.some((path) => location.pathname.startsWith(path) && location.pathname !== path.slice(0, -1));

  if (shouldHide) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 pb-safe">
      <div className="flex items-center justify-around h-16">
        {mobileNavItems.map((item) => {
          // Special handling for "More" which opens the sidebar
          if (item.name === 'More') {
            return (
              <button
                key={item.name}
                onClick={() => {
                  // Dispatch custom event to open sidebar
                  window.dispatchEvent(new CustomEvent('open-mobile-sidebar'));
                }}
                className="flex flex-col items-center justify-center flex-1 h-full text-neutral-500 dark:text-neutral-400"
              >
                <item.icon className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-medium">{item.name}</span>
              </button>
            );
          }

          const isActive = location.pathname === item.href;

          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full transition-colors',
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-neutral-500 dark:text-neutral-400'
              )}
            >
              <div
                className={cn(
                  'relative flex items-center justify-center w-12 h-8 rounded-full transition-colors',
                  isActive && 'bg-primary-50 dark:bg-primary-900/30'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.badge != null && item.badge > 0 && (
                  <span className="absolute -top-1 -right-0.5 min-w-[16px] h-[16px] flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full px-0.5">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                'text-[10px] font-medium mt-0.5',
                isActive && 'font-semibold'
              )}>
                {item.name}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileBottomNav;
