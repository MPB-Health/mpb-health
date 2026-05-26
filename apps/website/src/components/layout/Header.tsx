import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { TopBar } from './TopBar';
import { MegaMenuV2 } from './MegaMenuV2';
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
  Info,
  Mail,
  HelpCircle,
  ExternalLink,
  Mic2,
  Edit3,
  CreditCard,
  Pill,
  Calendar,
  XCircle,
  Shield
} from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMembershipsOpen, setIsMembershipsOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [isMobileMembersOpen, setIsMobileMembersOpen] = useState(false);
  const [isMemberServicesOpen, setIsMemberServicesOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const location = useLocation();

  const membershipRef = useRef<HTMLDivElement>(null);
  const resourcesRef = useRef<HTMLDivElement>(null);
  const memberServicesRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const lastScrollY = useRef(0);
  const isMenuOpenRef = useRef(isMenuOpen);

  const isActive = (path: string) => location.pathname === path;

  // Keep ref in sync with state for scroll handler
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
      const target = event.target as Node;

      if (hamburgerRef.current && hamburgerRef.current.contains(target)) {
        return;
      }

      if (mobileMenuRef.current && mobileMenuRef.current.contains(target)) {
        return;
      }

      if (membershipRef.current && !membershipRef.current.contains(target)) {
        setIsMembershipsOpen(false);
      }
      if (resourcesRef.current && !resourcesRef.current.contains(target)) {
        setIsResourcesOpen(false);
      }
      if (memberServicesRef.current && !memberServicesRef.current.contains(target)) {
        setIsMemberServicesOpen(false);
      }
      if (aboutRef.current && !aboutRef.current.contains(target)) {
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

  const membershipItems = useMemo(() => [
    {
      id: 'memberships-individuals',
      label: 'For Individuals',
      href: '#',
      external: false,
      icon: 'Users',
      children: [
        {
          id: 'individuals-families',
          label: 'Individuals & Families',
          description: 'Comprehensive health sharing plans for you and your loved ones',
          icon: 'Users',
          href: '/individuals-and-families',
          external: false,
        },
      ],
    },
    {
      id: 'memberships-organizations',
      label: 'For Organizations',
      href: '#',
      external: false,
      icon: 'Building2',
      children: [
        {
          id: 'businesses-organizations',
          label: 'Businesses & Organizations',
          description: 'Health Plan with Health Savings Account',
          icon: 'Building2',
          href: '/businesses-and-organizations',
          external: false,
        },
      ],
    },
  ], []);

  const resourcesItems = useMemo(() => [
    {
      id: 'resources-learn',
      label: 'Learn & Explore',
      href: '#',
      external: false,
      icon: 'BookOpen',
      children: [
        {
          id: 'resource-library',
          label: 'Resource Library',
          description: 'Guides, articles, and helpful resources',
          icon: 'BookOpen',
          href: '/resources',
          external: false,
        },
        {
          id: 'blog',
          label: 'Blog',
          description: 'Latest news and healthcare insights',
          icon: 'Newspaper',
          href: '/blog',
          external: false,
        },
      ],
    },
    {
      id: 'resources-community',
      label: 'Community',
      href: '#',
      external: false,
      icon: 'Heart',
      children: [
        {
          id: 'events',
          label: 'Events',
          description: 'Upcoming webinars and community events',
          icon: 'PartyPopper',
          href: '/events',
          external: false,
        },
        {
          id: 'member-stories',
          label: 'Member Stories',
          description: 'Real experiences from our community',
          icon: 'Heart',
          href: '/member-stories',
          external: false,
        },
        {
          id: 'podcast',
          label: 'HealthyCare Podcast',
          description: 'Where wellness meets real life',
          icon: 'Mic2',
          href: '/podcast',
          external: false,
        },
      ],
    },
  ], []);

  const memberServicesItems = useMemo(() => [
    {
      id: 'member-portal',
      label: 'Member Portal',
      href: '#',
      external: false,
      icon: 'ExternalLink',
      children: [
        {
          id: 'member-portal-app',
          label: 'Access Member Portal',
          description: 'Access your MPB Health Benefits',
          icon: 'ExternalLink',
          href: 'https://app.mpb.health',
          external: true,
        },
      ],
    },
    {
      id: 'onboarding',
      label: 'Onboarding',
      href: '#',
      external: false,
      icon: 'Phone',
      children: [
        {
          id: 'welcome-call',
          label: 'Schedule Welcome Call',
          description: 'Book your personalized orientation session',
          icon: 'Phone',
          href: '/schedule-welcome-call',
          external: false,
        },
        {
          id: 'welcome-survey',
          label: 'Welcome Call Survey',
          description: 'Share feedback on your welcome experience',
          icon: 'ClipboardList',
          href: '/welcome-call-survey',
          external: false,
        },
      ],
    },
    {
      id: 'member-forms',
      label: 'Member Forms',
      href: '#',
      external: false,
      icon: 'MessageSquare',
      children: [
        {
          id: 'member-feedback',
          label: 'Member Feedback',
          description: 'Share your experience with us',
          icon: 'MessageSquare',
          href: '/member-feedback',
          external: false,
        },
        {
          id: 'refer-friend',
          label: 'Refer a Friend',
          description: 'Help others discover MPB Health',
          icon: 'UserPlus',
          href: '/refer-a-friend',
          external: false,
        },
        {
          id: 'change-advisor',
          label: 'Review or Change Advisor',
          description: 'Update your healthcare advisor preferences',
          icon: 'Users',
          href: '/review-or-change-advisor',
          external: false,
        },
        {
          id: 'review-us',
          label: 'Review Us',
          description: 'Leave a review and help our community grow',
          icon: 'Star',
          href: '/review-us',
          external: false,
        },
        {
          id: 'cancel-membership',
          label: 'Cancel Membership',
          description: 'Submit a membership cancellation request',
          icon: 'XCircle',
          href: '/cancel-membership',
          external: false,
        },
      ],
    },
    {
      id: 'employer-tools',
      label: 'Employer Tools',
      href: '#',
      external: false,
      icon: 'Briefcase',
      children: [
        {
          id: 'list-bill-setup',
          label: 'List-Bill Setup',
          description: 'Initialize list-billing for your organization',
          icon: 'Briefcase',
          href: '/list-bill-setup',
          external: false,
        },
        {
          id: 'list-bill-conversion',
          label: 'List-Bill Conversion',
          description: 'Convert existing billing to list-bill format',
          icon: 'FileText',
          href: '/list-bill-conversion',
          external: false,
        },
        {
          id: 'list-bill-update',
          label: 'List-Bill Update',
          description: 'Update your list-billing information',
          icon: 'ClipboardList',
          href: '/list-bill-update',
          external: false,
        },
        {
          id: 'employee-removal',
          label: 'Employee Removal',
          description: 'Process employee termination requests',
          icon: 'UserMinus',
          href: '/employee-removal',
          external: false,
        },
      ],
    },
  ], []);

  const aboutItems = useMemo(() => [
    {
      id: 'company',
      label: 'Company',
      href: '#',
      external: false,
      icon: 'Info',
      children: [
        {
          id: 'about-us',
          label: 'About Us',
          description: 'Our mission, values, and story',
          icon: 'Info',
          href: '/about-us',
          external: false,
        },
        {
          id: 'join-team',
          label: 'Join Our Team',
          description: 'Explore career opportunities',
          icon: 'Briefcase',
          href: '/join-our-team',
          external: false,
        },
      ],
    },
    {
      id: 'support',
      label: 'Support',
      href: '#',
      external: false,
      icon: 'HelpCircle',
      children: [
        {
          id: 'contact',
          label: 'Contact',
          description: 'Get in touch with our team',
          icon: 'Mail',
          href: '/contact',
          external: false,
        },
        {
          id: 'faq',
          label: 'FAQ',
          description: 'Answers to common questions',
          icon: 'HelpCircle',
          href: '/faq',
          external: false,
        },
      ],
    },
  ], []);

  return (
    <>
      <div className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-transform duration-300",
        !isVisible && "-translate-y-full"
      )}>
        <TopBar />
        <header className={cn(
          "w-full border-b border-neutral-200 bg-white/95 backdrop-blur-sm transition-all duration-300",
          isScrolled && "shadow-md"
        )}>
        <nav className="relative flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 max-w-[100vw] overflow-visible">
          <Link
            to="/"
            className="flex items-center text-primary hover:text-primary/80 transition-colors group flex-shrink-0"
            aria-label="MPB Health Home"
          >
            <img
              src="/assets/MPB-Health-No-background.png?v=2"
              alt="MPB Health"
              className={cn(
                "w-auto transition-all duration-300",
                isScrolled ? "h-8" : "h-10"
              )}
            />
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
                <span>Membership Options</span>
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
              Benefits
            </Link>

            <Link
              to="/how-it-works#why-different"
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors rounded-lg whitespace-nowrap",
                "text-neutral-700 hover:text-primary hover:bg-neutral-50"
              )}
            >
              Why MPB Health
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
            <Link to="/get-started" className="hidden lg:block flex-shrink-0">
              <button className="inline-flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 whitespace-nowrap text-sm">
                Get Free Quote
              </button>
            </Link>

            <button
              ref={hamburgerRef}
              className="lg:hidden p-2 text-neutral-700 hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </nav>

        {isMenuOpen && (
          <>
            <div
              ref={mobileMenuRef}
              className="lg:hidden border-t border-neutral-200 bg-white overflow-y-auto"
              style={{
                WebkitOverflowScrolling: 'touch',
                maxHeight: 'calc(100vh - 130px)'
              }}
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
                  Membership Options
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
                Benefits
              </Link>

              <Link
                to="/how-it-works#why-different"
                className="block px-4 py-3 text-sm font-medium rounded-lg transition-colors text-neutral-700 hover:bg-neutral-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Why MPB Health
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
                        <span>Member Updates</span>
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
                <Link
                  to="/faq"
                  className="block px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <HelpCircle className="h-4 w-4 text-primary" />
                    <span>FAQ</span>
                  </div>
                </Link>
              </div>

              <div className="pt-4">
                <Link to="/get-started" onClick={() => setIsMenuOpen(false)}>
                  <Button size="lg" className="w-full">
                    Get Free Quote
                  </Button>
                </Link>
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

export { Header };
