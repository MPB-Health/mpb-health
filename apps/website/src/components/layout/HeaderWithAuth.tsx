import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { TopBar } from './TopBar';
import { MegaMenuV2 } from './MegaMenuV2';
import { getCurrentUser, getUserProfile, UserRole } from '../../lib/auth';
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
  HelpCircle,
  Edit3,
  CreditCard,
  Pill,
  Calendar,
  Shield
} from 'lucide-react';
import { formsService, type CognitoFormRecord } from '../../lib/formsService';

const HeaderWithAuth = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMembershipsOpen, setIsMembershipsOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [isMemberServicesOpen, setIsMemberServicesOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isMobileMembersOpen, setIsMobileMembersOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [menuForms, setMenuForms] = useState<CognitoFormRecord[]>([]);
  const location = useLocation();

  const membershipRef = useRef<HTMLDivElement>(null);
  const resourcesRef = useRef<HTMLDivElement>(null);
  const memberServicesRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  const isActive = (path: string) => location.pathname === path;

  const getAccountRoute = (role: UserRole): string => {
    switch (role) {
      case 'advisor':
        return '/advisor/dashboard';
      case 'admin':
      case 'staff':
      case 'superadmin':
        return '/admin';
      case 'member':
      default:
        return '/member/portal';
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser();
      if (user) {
        setIsAuthenticated(true);
        const profile = await getUserProfile(user.id);
        setUserRole(profile?.role || 'member');
      } else {
        setIsAuthenticated(false);
        setUserRole('guest');
      }
    };

    checkAuth();
  }, [location.pathname]);

  // Fetch menu forms from database
  useEffect(() => {
    const loadMenuForms = async () => {
      try {
        const forms = await formsService.getMenuForms();
        setMenuForms(forms);
      } catch (error) {
        console.warn('Failed to load menu forms:', error);
      }
    };
    loadMenuForms();
  }, []);

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

  // Helper function to convert form records to menu items
  const formToMenuItem = (form: CognitoFormRecord) => ({
    id: `form-${form.id}`,
    label: form.label,
    description: form.description || '',
    icon: form.icon,
    href: `/forms${form.slug}`,
    external: false,
  });

  // Static form labels that are already in the menu - used to prevent duplicates
  const staticFormLabels = new Set([
    'Member Updates', 'Update Payment', 'Dependent Over 18 Info', 'Refer a Friend',
    'Review Us', 'Member Feedback', 'HIPAA Authorization', 'RX, Labs, Imaging',
    'Dr. Appt. Scheduling', 'Schedule a Welcome Call', 'Cancel Membership',
    'Welcome Call Webinar Questionnaire', 'Schedule Welcome Call', 'Welcome Call Survey',
    'Authorization to Share Information', 'Update Form of Payment',
    'Dependent Over 18 Information', 'Request RX Quote', 'Request to Schedule an Appointment',
    'Advisor Directory', 'Review or Change Advisor'
  ]);

  // Get forms for a specific menu section, filtering out duplicates of static items
  const getFormsForSection = (section: string) =>
    menuForms
      .filter(f => f.menu_section === section && !staticFormLabels.has(f.label))
      .map(formToMenuItem);

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

  const memberServicesItems = useMemo(() => {
    // Get dynamic forms for each section
    const memberFormsFromDB = getFormsForSection('member-forms');
    const requestsFormsFromDB = getFormsForSection('requests-scheduling');
    const onboardingFormsFromDB = getFormsForSection('onboarding');

    // Public menu (not authenticated)
    if (!isAuthenticated) {
      return [
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
            {
              id: 'submit-ticket-public',
              label: 'Submit a Ticket',
              description: 'Get help with technical or account issues',
              icon: 'HelpCircle',
              href: 'https://support.mpb.health/support/member',
              external: true,
            },
          ],
        },
        {
          id: 'member-forms-public',
          label: 'Member Forms',
          href: '#',
          external: false,
          icon: 'FileText',
          children: [
            {
              id: 'membership-changes-public',
              label: 'Member Updates',
              description: 'Update your membership information',
              icon: 'Edit3',
              href: '/membership-changes',
              external: false,
            },
            {
              id: 'update-payment-public',
              label: 'Update Payment',
              description: 'Update your payment method',
              icon: 'CreditCard',
              href: '/update-form-of-payment',
              external: false,
            },
            {
              id: 'dependent-over-18-public',
              label: 'Dependent Over 18 Info',
              description: 'Provide information for dependents over 18',
              icon: 'UserPlus',
              href: '/dependent-over-18-information',
              external: false,
            },
            {
              id: 'refer-friend-public',
              label: 'Refer a Friend',
              description: 'Refer someone to MPB Health',
              icon: 'UserPlus',
              href: '/refer-a-friend',
              external: false,
            },
            {
              id: 'review-us-public',
              label: 'Review Us',
              description: 'Leave a review and help our community grow',
              icon: 'Star',
              href: '/review-us',
              external: false,
            },
            // Add dynamic member forms from database
            ...memberFormsFromDB,
          ],
        },
        {
          id: 'requests-scheduling-public',
          label: 'Requests & Scheduling',
          href: '#',
          external: false,
          icon: 'Calendar',
          children: [
            {
              id: 'hipaa-auth-public',
              label: 'HIPAA Authorization',
              description: 'Grant permission to discuss your plan details',
              icon: 'Shield',
              href: '/permission-to-discuss-plan',
              external: false,
            },
            {
              id: 'rx-quote-public',
              label: 'RX, Labs, Imaging',
              description: 'Request quotes for medications and services',
              icon: 'Pill',
              href: '/request-rx-quote',
              external: false,
            },
            {
              id: 'schedule-appt-public',
              label: 'Dr. Appt. Scheduling',
              description: 'Schedule an appointment with our concierge',
              icon: 'Calendar',
              href: '/request-to-schedule-an-appointment',
              external: false,
            },
            {
              id: 'schedule-call-public',
              label: 'Schedule a Welcome Call',
              description: 'Book your personalized orientation session',
              icon: 'Phone',
              href: '/schedule-a-call',
              external: false,
            },
            {
              id: 'cancel-membership-public',
              label: 'Cancel Membership',
              description: 'Submit a membership cancellation request',
              icon: 'XCircle',
              href: '/cancel-membership',
              external: false,
            },
            {
              id: 'webinar-questionnaire-public',
              label: 'Welcome Call Webinar Questionnaire',
              description: 'Complete your welcome call webinar questionnaire',
              icon: 'ClipboardList',
              href: '/forms/webinar-questionnaire',
              external: false,
            },
            // Add dynamic request/scheduling forms from database
            ...requestsFormsFromDB,
          ],
        },
        // Onboarding section with dynamic forms
        ...(onboardingFormsFromDB.length > 0 ? [{
          id: 'onboarding-public',
          label: 'Onboarding',
          href: '#',
          external: false,
          icon: 'Phone',
          children: [
            {
              id: 'welcome-call-public',
              label: 'Schedule Welcome Call',
              description: 'Book your personalized orientation session',
              icon: 'Phone',
              href: '/schedule-a-call',
              external: false,
            },
            {
              id: 'welcome-survey-public',
              label: 'Welcome Call Survey',
              description: 'Share feedback on your welcome experience',
              icon: 'ClipboardList',
              href: '/welcome-call-survey',
              external: false,
            },
            // Add dynamic onboarding forms from database
            ...onboardingFormsFromDB,
          ],
        }] : []),
      ];
    }

    return [
      {
        id: 'member-portal',
        label: 'Portal Access',
        href: '#',
        external: false,
        icon: 'UserCircle',
        children: [
          {
            id: 'member-portal-link',
            label: 'Member Portal',
            description: 'Access your member dashboard',
            icon: 'ExternalLink',
            href: 'https://app.mpb.health/',
            external: true,
          },
          {
            id: 'member-dashboard',
            label: 'Dashboard',
            description: 'View your account details and benefits',
            icon: 'UserCircle',
            href: '/member',
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
            href: '/member/forms/feedback',
            external: false,
          },
          {
            id: 'refer-friend',
            label: 'Refer a Friend',
            description: 'Help others discover MPB Health',
            icon: 'UserPlus',
            href: '/member/forms/refer-friend',
            external: false,
          },
          {
            id: 'change-advisor',
            label: 'Review or Change Advisor',
            description: 'Update your healthcare advisor preferences',
            icon: 'Users',
            href: '/member/forms/change-advisor',
            external: false,
          },
          {
            id: 'review-us',
            label: 'Review Us',
            description: 'Leave a review and help our community grow',
            icon: 'Star',
            href: '/member/forms/review',
            external: false,
          },
          // Add dynamic member forms from database
          ...memberFormsFromDB,
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
            href: '/member/forms/welcome-call',
            external: false,
          },
          {
            id: 'welcome-survey',
            label: 'Welcome Call Survey',
            description: 'Share feedback on your welcome experience',
            icon: 'ClipboardList',
            href: '/member/forms/welcome-survey',
            external: false,
          },
          {
            id: 'submit-ticket',
            label: 'Submit a Ticket',
            description: 'Get help with technical or account issues',
            icon: 'HelpCircle',
            href: 'https://support.mpb.health/support/member',
            external: true,
          },
          {
            id: 'webinar-questionnaire',
            label: 'Welcome Call Webinar Questionnaire',
            description: 'Complete your welcome call webinar questionnaire',
            icon: 'ClipboardList',
            href: '/forms/webinar-questionnaire',
            external: false,
          },
          // Add dynamic onboarding forms from database
          ...onboardingFormsFromDB,
        ],
      },
      {
        id: 'member-handbooks',
        label: 'Member Handbooks',
        href: '#',
        external: false,
        icon: 'Book',
        children: [
          {
            id: 'careplus-handbook',
            label: 'Care+ Handbook',
            description: 'View the Care+ plan member handbook',
            icon: 'FileText',
            href: '/3d-flip-book/careplus',
            external: false,
          },
          {
            id: 'direct-handbook',
            label: 'Direct Handbook',
            description: 'View the Direct plan member handbook',
            icon: 'FileText',
            href: '/3d-flip-book/direct-handbook',
            external: false,
          },
          {
            id: 'secure-hsa-handbook',
            label: 'Secure HSA Handbook',
            description: 'View the Secure HSA plan member handbook',
            icon: 'FileText',
            href: '/3d-flip-book/secure-hsa',
            external: false,
          },
          {
            id: 'essentials-handbook',
            label: 'Essentials Handbook',
            description: 'View the Essentials plan member handbook',
            icon: 'FileText',
            href: '/3d-flip-book/essentials',
            external: false,
          },
          {
            id: 'mec-essentials-handbook',
            label: 'MEC+ Essentials Handbook',
            description: 'View the MEC+ Essentials plan member handbook',
            icon: 'FileText',
            href: '/3d-flip-book/mecessentials-handbook',
            external: false,
          },
        ],
      },
      ...(userRole === 'admin' || userRole === 'staff' ? [
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
              href: '/admin/list-bill-setup',
              external: false,
            },
            {
              id: 'list-bill-conversion',
              label: 'List-Bill Conversion',
              description: 'Convert existing billing to list-bill format',
              icon: 'FileText',
              href: '/admin/list-bill-conversion',
              external: false,
            },
            {
              id: 'list-bill-update',
              label: 'List-Bill Update',
              description: 'Update your list-billing information',
              icon: 'ClipboardList',
              href: '/admin/list-bill-update',
              external: false,
            },
            {
              id: 'employee-removal',
              label: 'Employee Removal',
              description: 'Process employee termination requests',
              icon: 'UserMinus',
              href: '/admin/employee-removal',
              external: false,
            },
          ],
        },
      ] : []),
    ];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, userRole, menuForms]);

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
          "relative w-full border-b border-neutral-200 bg-white/95 backdrop-blur-sm transition-all duration-300",
          isScrolled && "shadow-md"
        )}>
        <nav className="relative flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 max-w-[100vw] overflow-visible">
          <Link
            to="/"
            className="flex items-center text-primary hover:text-primary/80 transition-colors group flex-shrink-0"
            aria-label="MPB Health Home"
          >
            <img
              src="/assets/MPB-Health-No-background.png"
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
                  onClick={async () => {
                    const user = await getCurrentUser();
                    if (user) {
                      const profile = await getUserProfile(user.id);
                      const role = profile?.role || 'member';

                      if (role === 'admin' || role === 'staff') {
                        window.location.href = '/admin';
                      } else if (role === 'advisor') {
                        window.location.href = '/advisor/dashboard';
                      } else {
                        window.location.href = '/member/portal';
                      }
                    } else {
                      window.location.href = '/login';
                    }
                  }}
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
                    <a
                      href="https://support.mpb.health/support/member"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <HelpCircle className="h-4 w-4 text-primary" />
                        <span>Submit a Ticket</span>
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
                      onClick={async () => {
                        const user = await getCurrentUser();
                        if (user) {
                          const profile = await getUserProfile(user.id);
                          const role = profile?.role || 'member';

                          if (role === 'admin' || role === 'staff') {
                            window.location.href = '/admin';
                          } else if (role === 'advisor') {
                            window.location.href = '/advisor/dashboard';
                          } else {
                            window.location.href = '/member/portal';
                          }
                        } else {
                          window.location.href = '/login';
                        }
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
