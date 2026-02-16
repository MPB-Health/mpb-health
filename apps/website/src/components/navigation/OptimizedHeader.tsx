import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, LogIn, LogOut, UserCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TopBar } from '../layout/TopBar';
import { MegaMenuV2 } from '../layout/MegaMenuV2';
import { GlobalSearch } from './GlobalSearch';
import { useAuth } from '../../contexts/AuthContext';
import { getNavigationByRole } from '../../lib/navigationConfig';
import * as LucideIcons from 'lucide-react';

const getIconComponent = (iconName?: string) => {
  if (!iconName) return null;
  const Icon = (LucideIcons as any)[iconName];
  return Icon || null;
};

export const OptimizedHeader: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [expandedMobileItems, setExpandedMobileItems] = useState<Record<string, boolean>>({});
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const location = useLocation();
  const { user, isAdmin, isAdvisor, signOut } = useAuth();

  const dropdownRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const lastScrollY = useRef(0);

  const isActive = (path: string) => location.pathname === path;
  const userRole = isAdmin ? 'admin' : isAdvisor ? 'advisor' : user ? 'member' : 'guest';
  const navigationItems = getNavigationByRole(userRole as any);

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout | null = null;

    const handleScroll = () => {
      if (scrollTimeout) return;

      scrollTimeout = setTimeout(() => {
        const currentScrollY = window.scrollY;
        setIsScrolled(currentScrollY > 10);

        if (currentScrollY < 10) {
          setIsVisible(true);
        } else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
          setIsVisible(false);
        } else if (currentScrollY < lastScrollY.current) {
          setIsVisible(true);
        }

        lastScrollY.current = currentScrollY;
        scrollTimeout = null;
      }, 10);
    };

    const handleClickOutside = (event: MouseEvent) => {
      let clickedInside = false;
      dropdownRefs.current.forEach((ref) => {
        if (ref && ref.contains(event.target as Node)) {
          clickedInside = true;
        }
      });
      if (!clickedInside) {
        setOpenDropdown(null);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setOpenDropdown(null);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMenuOpen) {
      setExpandedMobileItems({});
    }
  }, [isMenuOpen]);

  const toggleDropdown = (itemId: string) => {
    setOpenDropdown(openDropdown === itemId ? null : itemId);
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  const toggleMobileSection = (itemId: string) => {
    setExpandedMobileItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  return (
    <>
      <div
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-transform duration-300',
          !isVisible && '-translate-y-full'
        )}
      >
        <TopBar />
        <header
          className={cn(
            'relative w-full border-b border-neutral-200 bg-white/95 backdrop-blur-sm transition-all duration-300',
            isScrolled && 'shadow-md'
          )}
        >
          <nav className="relative flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 max-w-7xl mx-auto">
            <Link
              to={user ? '/member' : '/'}
              className="flex items-center text-primary hover:text-primary/80 transition-colors group flex-shrink-0"
              aria-label="MPB Health Home"
            >
              <img
                src="/assets/MPB-Health-No-background.png"
                alt="MPB Health"
                className={cn(
                  'w-auto transition-all duration-300',
                  isScrolled ? 'h-8' : 'h-10'
                )}
              />
            </Link>

            <div className="hidden lg:flex items-center space-x-1">
              {navigationItems.map((item) => {
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
                        aria-expanded={isOpen}
                        aria-haspopup="true"
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
                        items={[{ ...item, external: item.external ?? false } as any]}
                        isOpen={isOpen}
                        onClose={() => setOpenDropdown(null)}
                        columns={(item.children?.length ?? 0) <= 4 ? 2 : 3}
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
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center space-x-3">
              <GlobalSearch className="hidden md:block" />

              {user ? (
                <>
                  <Link
                    to="/member"
                    className="hidden lg:flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-700 hover:text-blue-600 transition-colors rounded-lg hover:bg-neutral-50"
                  >
                    <UserCircle className="h-4 w-4" />
                    <span>Account</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="hidden lg:flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors rounded-lg hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="hidden lg:flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 hover:text-blue-600 transition-colors rounded-lg hover:bg-neutral-50 border border-neutral-300"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Sign In</span>
                  </Link>
                  <Link
                    to="/get-started"
                    className="hidden lg:block flex-shrink-0"
                  >
                    <button className="inline-flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 whitespace-nowrap text-sm">
                      Get Free Quote
                    </button>
                  </Link>
                </>
              )}

              <button
                className="lg:hidden p-2 text-neutral-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </nav>

          {isMenuOpen && (
            <div className="lg:hidden border-t border-neutral-200 bg-white">
              <div className="max-h-[calc(100vh-8rem)] overflow-y-auto px-4 py-6 space-y-2">
                <div className="mb-6">
                  <GlobalSearch />
                </div>

                {navigationItems.map((item) => {
                  const hasChildren = item.children && item.children.length > 0;
                  const isExpanded = !!expandedMobileItems[item.id];
                  const panelId = `mobile-nav-panel-${item.id}`;

                  return (
                    <div key={item.id} className="border-b border-neutral-100 pb-2">
                      {hasChildren ? (
                        <>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-neutral-800 rounded-lg hover:bg-neutral-50 transition-colors"
                            aria-expanded={isExpanded}
                            aria-controls={panelId}
                            onClick={() => toggleMobileSection(item.id)}
                          >
                            <span>{item.label}</span>
                            <ChevronDown
                              className={cn(
                                'h-4 w-4 text-neutral-500 transition-transform duration-200',
                                isExpanded && 'rotate-180'
                              )}
                            />
                          </button>
                          <div
                            id={panelId}
                            className={cn(
                              'grid gap-1 px-2 pt-1 transition-all duration-300 ease-in-out',
                              isExpanded ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                            )}
                          >
                            {item.children?.map((child) => {
                              const Icon = getIconComponent(child.icon);
                              return (
                                <Link
                                  key={child.id}
                                  to={child.href}
                                  className="flex items-center gap-2 rounded-lg px-2 py-3 text-sm text-neutral-700 hover:bg-blue-50 transition-colors"
                                  onClick={() => setIsMenuOpen(false)}
                                >
                                  {Icon && <Icon className="h-4 w-4 text-blue-600" />}
                                  <span>{child.label}</span>
                                </Link>
                              );
                            })}
                          </div>
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
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {item.label}
                        </Link>
                      )}
                    </div>
                  );
                })}

                <div className="pt-4 space-y-2">
                  {user ? (
                    <>
                      <Link to="/member" onClick={() => setIsMenuOpen(false)}>
                        <button className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all">
                          <UserCircle className="h-4 w-4" />
                          My Account
                        </button>
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-all"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                        <button className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all">
                          <LogIn className="h-4 w-4" />
                          Sign In
                        </button>
                      </Link>
                      <Link to="/get-started" onClick={() => setIsMenuOpen(false)}>
                        <button className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg">
                          Get Free Quote
                        </button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </header>
      </div>
    </>
  );
};
