import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { TopBar } from './TopBar';
import { MegaMenuV2 } from './MegaMenuV2';
import { useSiteNav, getAccountRoute, signInRedirect } from '../../lib/useSiteNav';
import {
  Users,
  Building2,
  BookOpen,
  Newspaper,
  PartyPopper,
  Heart,
  UserPlus,
  Star,
  Phone,
  Briefcase,
  FileText,
  Info,
  Mail,
  ExternalLink,
  LogIn,
  LogOut,
  UserCircle,
  Mic2,
  Edit3,
  CreditCard,
  Pill,
  Calendar,
  Shield,
  XCircle
} from 'lucide-react';

const HeaderWithAuth = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMembershipsOpen, setIsMembershipsOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [isMemberServicesOpen, setIsMemberServicesOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isMobileMembersOpen, setIsMobileMembersOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const { isAuthenticated, userRole, membershipItems, resourcesItems, memberServicesItems, aboutItems } = useSiteNav();
  const location = useLocation();

  const membershipRef = useRef<HTMLDivElement>(null);
  const resourcesRef = useRef<HTMLDivElement>(null);
  const memberServicesRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  const isActive = (path: string) => location.pathname === path;

  // Store isMenuOpen in a ref so scroll handler can access latest value without re-creating effect
  const isMenuOpenRef = useRef(isMenuOpen);
  useEffect(() => {
    isMenuOpenRef.current = isMenuOpen;
    
    // Body scroll lock for mobile menu
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout | null = null;

    const handleScroll = () => {
      if (scrollTimeout) return;

      scrollTimeout = setTimeout(() => {
        const currentScrollY = window.scrollY;

        setIsScrolled(currentScrollY > 10);

        // Skip header hide/show when mobile menu is open
        if (isMenuOpenRef.current) {
          scrollTimeout = null;
          return;
        }

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
      if (membershipRef.current && !membershipRef.current.contains(event.target as Node)) {
        setIsMembershipsOpen(false);
      }
      if (resourcesRef.current && !resourcesRef.current.contains(event.target as Node)) {
        setIsResourcesOpen(false);
      }
      if (memberServicesRef.current && !memberServicesRef.current.contains(event.target as Node)) {
        setIsMemberServicesOpen(false);
      }
      if (aboutRef.current && !aboutRef.current.contains(event.target as Node)) {
        setIsAboutOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <div className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-transform duration-300",
        !isVisible && "-translate-y-full"
      )}>
        <TopBar />
        <header className={cn(
          "relative w-full border-b border-neutral-200 bg-white/95 backdrop-blur-sm transition-all duration-300",
          isScrolled && "shadow-md"
        )}>
        <nav className="relative flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 max-w-[100vw] overflow-visible">
          <Link
            to="/"
            className="flex items-center text-primary hover:text-primary/80 transition-colors group flex-shrink-0"
            aria-label="MPB Health Home"
          >
            <picture>
              <source srcSet="/assets/MPB-Health-No-background.webp" type="image/webp" />
              <img
                src="/assets/MPB-Health-No-background.png?v=2"
                alt="MPB Health"
                width={160}
                height={40}
                className={cn(
                  "w-auto transition-all duration-300",
                  isScrolled ? "h-8" : "h-10"
                )}
              />
            </picture>
          </Link>

          <div className="hidden lg:flex items-center space-x-1 absolute left-1/2 transform -translate-x-1/2">
            <Link
              to="/"
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors rounded-lg",
                isActive('/')
                  ? "text-primary bg-primary/5"
                  : "text-neutral-700 hover:text-primary hover:bg-neutral-50"
              )}
            >
              Home
            </Link>

            <div className="relative" ref={membershipRef}>
              <button
                onClick={() => setIsMembershipsOpen(!isMembershipsOpen)}
                className={cn(
                  "flex items-center space-x-1 px-4 py-2 text-sm font-medium transition-colors rounded-lg",
                  isMembershipsOpen
                    ? "text-primary bg-primary/5"
                    : "text-neutral-700 hover:text-primary hover:bg-neutral-50"
                )}
              >
                <span>Memberships</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isMembershipsOpen && "rotate-180"
                  )}
                />
              </button>
              <MegaMenuV2
                items={membershipItems}
                isOpen={isMembershipsOpen}
                onClose={() => setIsMembershipsOpen(false)}
                columns={2}
              />
            </div>

            <Link
              to="/how-it-works"
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors rounded-lg whitespace-nowrap",
                isActive('/how-it-works')
                  ? "text-primary bg-primary/5"
                  : "text-neutral-700 hover:text-primary hover:bg-neutral-50"
              )}
            >
              How It Works
            </Link>

            <Link
              to="/features"
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors rounded-lg",
                isActive('/features')
                  ? "text-primary bg-primary/5"
                  : "text-neutral-700 hover:text-primary hover:bg-neutral-50"
              )}
            >
              Features
            </Link>

            <Link
              to="/advisor-directory"
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors rounded-lg whitespace-nowrap",
                isActive('/advisor-directory')
                  ? "text-primary bg-primary/5"
                  : "text-neutral-700 hover:text-primary hover:bg-neutral-50"
              )}
            >
              Advisor Directory
            </Link>

            <div className="relative" ref={resourcesRef}>
              <button
                onClick={() => setIsResourcesOpen(!isResourcesOpen)}
                className={cn(
                  "flex items-center space-x-1 px-4 py-2 text-sm font-medium transition-colors rounded-lg",
                  isResourcesOpen
                    ? "text-primary bg-primary/5"
                    : "text-neutral-700 hover:text-primary hover:bg-neutral-50"
                )}
              >
                <span>Resources</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isResourcesOpen && "rotate-180"
                  )}
                />
              </button>
              <MegaMenuV2
                items={resourcesItems}
                isOpen={isResourcesOpen}
                onClose={() => setIsResourcesOpen(false)}
                columns={2}
              />
            </div>

            <div className="relative" ref={memberServicesRef}>
              <button
                onClick={() => setIsMemberServicesOpen(!isMemberServicesOpen)}
                className={cn(
                  "flex items-center space-x-1 px-4 py-2 text-sm font-medium transition-colors rounded-lg",
                  isMemberServicesOpen
                    ? "text-primary bg-primary/5"
                    : "text-neutral-700 hover:text-primary hover:bg-neutral-50"
                )}
              >
                <span>Members</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isMemberServicesOpen && "rotate-180"
                  )}
                />
              </button>
              <MegaMenuV2
                items={memberServicesItems}
                isOpen={isMemberServicesOpen}
                onClose={() => setIsMemberServicesOpen(false)}
                columns={4}
              />
            </div>

            <div className="relative" ref={aboutRef}>
              <button
                onClick={() => setIsAboutOpen(!isAboutOpen)}
                className={cn(
                  "flex items-center space-x-1 px-4 py-2 text-sm font-medium transition-colors rounded-lg",
                  isAboutOpen
                    ? "text-primary bg-primary/5"
                    : "text-neutral-700 hover:text-primary hover:bg-neutral-50"
                )}
              >
                <span>About</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isAboutOpen && "rotate-180"
                  )}
                />
              </button>
              <MegaMenuV2
                items={aboutItems}
                isOpen={isAboutOpen}
                onClose={() => setIsAboutOpen(false)}
                columns={2}
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                <Link to={getAccountRoute(userRole)} className="hidden lg:flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-700 hover:text-primary transition-colors rounded-lg hover:bg-neutral-50">
                  <UserCircle className="h-4 w-4" />
                  <span>My Account</span>
                </Link>
                <Link to="/logout" className="hidden lg:flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-700 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50">
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </Link>
              </>
            ) : (
              <>
                <button
                  onClick={() => void signInRedirect()}
                  className="hidden lg:flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-700 hover:text-primary transition-colors rounded-lg hover:bg-neutral-50"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </button>
                <Link to="/get-started" className="hidden lg:block flex-shrink-0">
                  <button className="inline-flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 whitespace-nowrap text-sm">
                    Get Free Quote
                  </button>
                </Link>
              </>
            )}

            <button
              className="lg:hidden relative z-[60] p-2.5 text-neutral-700 hover:text-primary transition-colors touch-manipulation"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
              type="button"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </nav>

        {isMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <div 
              className="lg:hidden fixed inset-0 bg-black/20 z-[90]"
              onClick={() => setIsMenuOpen(false)}
              aria-hidden="true"
            />
            <div 
              className="lg:hidden absolute left-0 right-0 top-full z-[100] border-t border-neutral-200 bg-white shadow-xl overflow-y-auto overscroll-contain"
              style={{ maxHeight: 'calc(100vh - 104px)' }}
            >
            <div className="px-4 py-6 space-y-1">
              <Link
                to="/"
                className={cn(
                  "block px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                  isActive('/') ? "text-primary bg-primary/5" : "text-neutral-700 hover:bg-neutral-50"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>

              <div className="border-t border-neutral-100 my-2 pt-2">
                <div className="px-4 py-2 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Memberships
                </div>
                <Link
                  to="/individuals-and-families"
                  className="block px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span>Individuals & Families</span>
                  </div>
                </Link>
                <Link
                  to="/businesses-and-organizations"
                  className="block px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span>Businesses & Organizations</span>
                  </div>
                </Link>
              </div>

              <Link
                to="/how-it-works"
                className={cn(
                  "block px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                  isActive('/how-it-works') ? "text-primary bg-primary/5" : "text-neutral-700 hover:bg-neutral-50"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                How It Works
              </Link>

              <Link
                to="/features"
                className={cn(
                  "block px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                  isActive('/features') ? "text-primary bg-primary/5" : "text-neutral-700 hover:bg-neutral-50"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </Link>

              <Link
                to="/advisor-directory"
                className={cn(
                  "block px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                  isActive('/advisor-directory') ? "text-primary bg-primary/5" : "text-neutral-700 hover:bg-neutral-50"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                Advisor Directory
              </Link>

              <div className="border-t border-neutral-100 my-2 pt-2">
                <div className="px-4 py-2 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Resources
                </div>
                <Link
                  to="/resources"
                  className="block px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span>Resource Library</span>
                  </div>
                </Link>
                <Link
                  to="/blog"
                  className="block px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <Newspaper className="h-4 w-4 text-primary" />
                    <span>Blog</span>
                  </div>
                </Link>
                <Link
                  to="/events"
                  className="block px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <PartyPopper className="h-4 w-4 text-primary" />
                    <span>Events</span>
                  </div>
                </Link>
                <Link
                  to="/member-stories"
                  className="block px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4 text-primary" />
                    <span>Member Stories</span>
                  </div>
                </Link>
                <Link
                  to="/podcast"
                  className="block px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <Mic2 className="h-4 w-4 text-primary" />
                    <span>HealthyCare Podcast</span>
                  </div>
                </Link>
              </div>

              <div className="border-t border-neutral-100 my-2 pt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMobileMembersOpen(!isMobileMembersOpen);
                  }}
                  className="w-full flex items-center justify-between px-4 py-2 text-xs font-bold text-neutral-500 uppercase tracking-wider hover:bg-neutral-50 rounded-lg transition-colors touch-manipulation"
                >
                  <span>Members</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      isMobileMembersOpen && "rotate-180"
                    )}
                  />
                </button>
                {isMobileMembersOpen && (
                  <>
                    {/* Member Portal Section */}
                    <div className="px-4 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider mt-2">
                      Member Portal
                    </div>
                    <a
                      href="https://app.mpb.health/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <ExternalLink className="h-4 w-4 text-primary" />
                        <span>Access Member Portal</span>
                      </div>
                    </a>

                    {/* Member Forms Section */}
                    <div className="px-4 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider mt-2">
                      Member Forms
                    </div>
                    <Link
                      to="/membership-changes"
                      className="block px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="flex items-center space-x-2">
                        <Edit3 className="h-4 w-4 text-primary" />
                        <span>Membership Changes</span>
                      </div>
                    </Link>
                    <Link
                      to="/update-form-of-payment"
                      className="block px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4 text-primary" />
                        <span>Update Payment</span>
                      </div>
                    </Link>
                    <Link
                      to="/dependent-over-18-information"
                      className="block px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="flex items-center space-x-2">
                        <UserPlus className="h-4 w-4 text-primary" />
                        <span>Dependent Over 18 Info</span>
                      </div>
                    </Link>
                    <Link
                      to="/refer-a-friend"
                      className="block px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="flex items-center space-x-2">
                        <UserPlus className="h-4 w-4 text-primary" />
                        <span>Refer a Friend</span>
                      </div>
                    </Link>
                    <Link
                      to="/review-us"
                      className="block px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-primary" />
                        <span>Review Us</span>
                      </div>
                    </Link>

                    {/* Requests & Scheduling Section */}
                    <div className="px-4 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider mt-2">
                      Requests & Scheduling
                    </div>
                    <Link
                      to="/permission-to-discuss-plan"
                      className="block px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <span>HIPAA Authorization</span>
                      </div>
                    </Link>
                    <Link
                      to="/request-rx-quote"
                      className="block px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="flex items-center space-x-2">
                        <Pill className="h-4 w-4 text-primary" />
                        <span>RX, Labs, Imaging</span>
                      </div>
                    </Link>
                    <Link
                      to="/request-to-schedule-an-appointment"
                      className="block px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>Dr. Appt. Scheduling</span>
                      </div>
                    </Link>
                    <Link
                      to="/schedule-a-call"
                      className="block px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-primary" />
                        <span>Schedule a Welcome Call</span>
                      </div>
                    </Link>
                    <Link
                      to="/cancel-membership"
                      className="block px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="flex items-center space-x-2">
                        <XCircle className="h-4 w-4 text-primary" />
                        <span>Cancel Membership</span>
                      </div>
                    </Link>

                    {/* Admin Links - Only for authenticated admin/staff */}
                    {isAuthenticated && (userRole === 'admin' || userRole === 'staff') && (
                      <>
                        <div className="px-4 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider mt-2">
                          Admin
                        </div>
                        <Link
                          to="/admin/list-bill-setup"
                          className="block px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <div className="flex items-center space-x-2">
                            <Briefcase className="h-4 w-4 text-primary" />
                            <span>List-Bill Setup</span>
                          </div>
                        </Link>
                        <Link
                          to="/admin/list-bill-conversion"
                          className="block px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <span>List-Bill Conversion</span>
                          </div>
                        </Link>
                      </>
                    )}
                  </>
                )}
              </div>

              <div className="border-t border-neutral-100 my-2 pt-2">
                <div className="px-4 py-2 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  About
                </div>
                <Link
                  to="/about-us"
                  className="block px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <Info className="h-4 w-4 text-primary" />
                    <span>About Us</span>
                  </div>
                </Link>
                <Link
                  to="/join-our-team"
                  className="block px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <Briefcase className="h-4 w-4 text-primary" />
                    <span>Join Our Team</span>
                  </div>
                </Link>
                <Link
                  to="/contact"
                  className="block px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <span>Contact</span>
                  </div>
                </Link>
              </div>

              <div className="pt-4 space-y-2">
                {isAuthenticated ? (
                  <Link to="/logout" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" size="lg" className="w-full">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full"
                      onClick={() => {
                        void signInRedirect();
                        setIsMenuOpen(false);
                      }}
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In
                    </Button>
                    <Link to="/get-started" onClick={() => setIsMenuOpen(false)}>
                      <Button size="lg" className="w-full">
                        Get Free Quote
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
          </>
        )}
        </header>
      </div>
    </>
  );
};

export { HeaderWithAuth };
