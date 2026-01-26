import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TopBar } from './TopBar';
import { MegaMenuV2 } from './MegaMenuV2';
import { useNavigation } from '../../contexts/NavigationContext';

export const ProspectHeader: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { prospectNavigation, trackNavigationClick } = useNavigation();

  const dropdownRefs = useRef<Map<string, HTMLDivElement>>(new Map());

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

  const topLevelItems = prospectNavigation;

  return (
    <>
      <TopBar />
      <header
        className={cn(
          'sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/95 backdrop-blur-sm transition-all duration-300',
          isScrolled && 'shadow-md'
        )}
      >
        <nav className="relative flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 max-w-[100vw] overflow-visible">
          <Link
            to="/"
            className="flex items-center text-primary hover:text-primary/80 transition-colors group flex-shrink-0"
            aria-label="MPB Health Home"
            onClick={() => {
              const homeItem = prospectNavigation.find(item => item.href === '/');
              if (homeItem) trackNavigationClick(homeItem.id, 'click');
            }}
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
            <Link to="/get-started" className="hidden lg:block flex-shrink-0">
              <button className="inline-flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 whitespace-nowrap text-sm">
                Get Free Quote
              </button>
            </Link>

            <Link to="/login" className="hidden lg:block flex-shrink-0">
              <button className="inline-flex items-center justify-center px-5 py-2.5 border-2 border-blue-600 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all duration-300 whitespace-nowrap text-sm">
                Member Login
              </button>
            </Link>

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
              <div className="flex flex-col gap-3 mb-6">
                <Link to="/get-started" onClick={() => setIsMenuOpen(false)}>
                  <button className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg">
                    Get Free Quote
                  </button>
                </Link>
                <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                  <button className="w-full inline-flex items-center justify-center px-6 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all duration-300">
                    Member Login
                  </button>
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
            </div>
          </div>
        )}
      </header>
    </>
  );
};
