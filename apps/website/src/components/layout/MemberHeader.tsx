import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, LogOut, User, Bell } from 'lucide-react';
import { cn } from '../../lib/utils';
import { MegaMenuV2 } from './MegaMenuV2';
import { useNavigation } from '../../contexts/NavigationContext';
import { useAuth } from '../../contexts/AuthContext';

export const MemberHeader: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { memberNavigation, trackNavigationClick } = useNavigation();
  const { user, signOut } = useAuth();

  const dropdownRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    const handleClickOutside = (event: MouseEvent) => {
      let clickedInside = false;
      dropdownRefs.current.forEach((ref) => {
        if (ref && ref.contains(event.target as Node)) {
          clickedInside = true;
        }
      });

      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }

      if (!clickedInside) {
        setOpenDropdown(null);
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = (itemId: string) => {
    setOpenDropdown(openDropdown === itemId ? null : itemId);
  };

  const handleNavClick = (itemId: string) => {
    trackNavigationClick(itemId, 'click');
    setOpenDropdown(null);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const topLevelItems = memberNavigation;

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/95 backdrop-blur-sm transition-all duration-300',
        isScrolled && 'shadow-md'
      )}
    >
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-2 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Welcome back, {user?.email?.split('@')[0] || 'Member'}</span>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 hover:text-blue-100 transition-colors">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </button>
          </div>
        </div>
      </div>

      <nav className="relative flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 max-w-[100vw] overflow-visible">
        <Link
          to="/member-portal"
          className="flex items-center text-primary hover:text-primary/80 transition-colors group flex-shrink-0"
          aria-label="Member Dashboard"
          onClick={() => {
            const dashboardItem = memberNavigation.find(item => item.href === '/member-portal');
            if (dashboardItem) trackNavigationClick(dashboardItem.id, 'click');
          }}
        >
          <img
            src="/assets/MPB-Health-No-background.png?v=2"
            alt="MPB Health"
            className={cn(
              'w-auto transition-all duration-300',
              isScrolled ? 'h-8' : 'h-10'
            )}
          />
        </Link>

        <div className="hidden lg:flex items-center space-x-1 absolute left-1/2 transform -translate-x-1/2">
          {topLevelItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isOpen = openDropdown === item.id;

            if (hasChildren) {
              return (
                <div
                  key={item.id}
                  className="relative"
                  ref={(el) => {
                    if (el) dropdownRefs.current.set(item.id, el);
                  }}
                >
                  <button
                    onClick={() => toggleDropdown(item.id)}
                    className={cn(
                      'flex items-center space-x-1 px-4 py-2 text-sm font-medium transition-colors rounded-lg',
                      isOpen
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-neutral-700 hover:text-blue-600 hover:bg-neutral-50'
                    )}
                  >
                    <span>{item.label}</span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform duration-200',
                        isOpen && 'rotate-180'
                      )}
                    />
                  </button>
                  <MegaMenuV2
                    items={[item]}
                    isOpen={isOpen}
                    onClose={() => setOpenDropdown(null)}
                    onItemClick={handleNavClick}
                  />
                </div>
              );
            }

            return (
              <Link
                key={item.id}
                to={item.href}
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-colors rounded-lg whitespace-nowrap',
                  isActive(item.href)
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-neutral-700 hover:text-blue-600 hover:bg-neutral-50'
                )}
                onClick={() => handleNavClick(item.id)}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden lg:block relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 px-4 py-2 border-2 border-neutral-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all"
            >
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">Account</span>
              <ChevronDown className={cn('h-4 w-4 transition-transform', showUserMenu && 'rotate-180')} />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-neutral-200 rounded-lg shadow-xl z-50">
                <div className="p-4 border-b border-neutral-200">
                  <p className="text-sm font-semibold text-neutral-900">{user?.email}</p>
                  <p className="text-xs text-neutral-500 mt-1">Member Account</p>
                </div>
                <div className="py-2">
                  <Link
                    to="/member-portal/account"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-blue-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="h-4 w-4" />
                    My Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            className="lg:hidden p-2 text-neutral-700 hover:text-blue-600 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {isMenuOpen && (
        <div className="lg:hidden border-t border-neutral-200 bg-white animate-fade-in max-h-[calc(100vh-8rem)] overflow-y-auto">
          <div className="px-4 py-6 space-y-2">
            <div className="mb-6 pb-4 border-b border-neutral-200">
              <p className="text-sm font-semibold text-neutral-900 mb-1">{user?.email}</p>
              <Link
                to="/member-portal/account"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                onClick={() => setIsMenuOpen(false)}
              >
                <User className="h-4 w-4" />
                View Profile
              </Link>
            </div>

            {topLevelItems.map((item) => (
              <div key={item.id} className="border-b border-neutral-100 pb-2">
                {item.children && item.children.length > 0 ? (
                  <>
                    <div className="px-4 py-2 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                      {item.label}
                    </div>
                    {item.children.map((child) => (
                      <Link
                        key={child.id}
                        to={child.href}
                        className="block px-4 py-3 text-sm text-neutral-700 hover:bg-blue-50 rounded-lg transition-colors"
                        onClick={() => {
                          handleNavClick(child.id);
                          setIsMenuOpen(false);
                        }}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </>
                ) : (
                  <Link
                    to={item.href}
                    className={cn(
                      'block px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                      isActive(item.href)
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-neutral-700 hover:bg-neutral-50'
                    )}
                    onClick={() => {
                      handleNavClick(item.id);
                      setIsMenuOpen(false);
                    }}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}

            <div className="pt-4">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-all duration-300"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
