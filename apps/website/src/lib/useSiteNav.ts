import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Home,
  Layers,
  Users,
  Building2,
  Briefcase,
  GitCompare,
  CircleHelp,
  Sparkles,
  Award,
  BookOpen,
  Newspaper,
  Library,
  Mic2,
  Calendar,
  Heart,
  HelpCircle,
  Info,
  Mail,
  LayoutDashboard,
  Wrench,
  ExternalLink,
  FileText,
  UserCog,
  Zap,
  UserPlus,
  MessageSquare,
  Star,
  Phone,
  LifeBuoy,
  ClipboardList,
  UserMinus,
  UserCircle,
  Shield,
  MapPin,
  Calculator,
  MessageCircle,
  Edit3,
  CreditCard,
  Pill,
  XCircle,
  PartyPopper,
  Book,
  type LucideIcon,
} from 'lucide-react';
import { getCurrentUser, getUserProfile, type UserRole } from './auth';
import { formsService, type CognitoFormRecord } from './formsService';

/**
 * Single source of truth for the public site navigation.
 * Both the global HeaderWithAuth and the landing-redesign header consume this
 * hook so the menus can never drift apart.
 */
export interface SiteNavItem {
  id: string;
  label: string;
  href: string;
  description?: string;
  icon?: string;
  external: boolean;
  badge?: string;
  children?: SiteNavItem[];
}

// Icon map for navigation-driven dynamic icon rendering (avoids wildcard import)
export const navIconMap: Record<string, LucideIcon> = {
  Home, Layers, Users, Building2, Briefcase, GitCompare, CircleHelp,
  Sparkles, Award, BookOpen, Newspaper, Library, Mic2, Calendar, Heart,
  HelpCircle, Info, Mail, LayoutDashboard, Wrench, ExternalLink, FileText,
  UserCog, Zap, UserPlus, UserCircle, MessageSquare, Star, Phone, LifeBuoy,
  ClipboardList, UserMinus, Shield, MapPin, Calculator, MessageCircle,
  Edit3, CreditCard, Pill, XCircle, PartyPopper, Book,
};

/** Resolves string keys from nav config; falls back so every link keeps a visible icon */
export const getIconComponent = (iconName?: string): LucideIcon => {
  if (!iconName) return FileText;
  return navIconMap[iconName] ?? FileText;
};

export const getAccountRoute = (role: UserRole): string => {
  switch (role) {
    case 'advisor':
      return 'https://advisor.mpb.health';
    case 'admin':
    case 'staff':
    case 'superadmin':
      return '/admin';
    case 'member':
    default:
      return '/member/portal';
  }
};

/** Role-aware Sign In redirect used by both headers. */
export const signInRedirect = async (): Promise<void> => {
  const user = await getCurrentUser();
  if (user) {
    const profile = await getUserProfile(user.id);
    const role = profile?.role || 'member';

    if (role === 'admin' || role === 'staff') {
      window.location.href = '/admin';
    } else if (role === 'advisor') {
      window.location.href = 'https://advisor.mpb.health';
    } else {
      window.location.href = '/member/portal';
    }
  } else {
    window.location.href = '/login';
  }
};

// Static form labels that are already in the menu - used to prevent duplicates
const staticFormLabels = new Set([
  'Membership Changes', 'Update Payment', 'Dependent Over 18 Info', 'Refer a Friend',
  'Review Us', 'Member Feedback', 'HIPAA Authorization', 'RX, Labs, Imaging',
  'Dr. Appt. Scheduling', 'Schedule a Welcome Call', 'Cancel Membership',
  'Welcome Call Webinar Questionnaire', 'Schedule Welcome Call', 'Welcome Call Survey',
  'Authorization to Share Information', 'Update Form of Payment',
  'Dependent Over 18 Information', 'Request RX Quote', 'Request to Schedule an Appointment',
  'Advisor Directory', 'Review or Change Advisor'
]);

// Helper function to convert form records to menu items
const formToMenuItem = (form: CognitoFormRecord): SiteNavItem => ({
  id: `form-${form.id}`,
  label: form.label,
  description: form.description || '',
  icon: form.icon,
  href: `/forms${form.slug}`,
  external: false,
});

export interface SiteNav {
  isAuthenticated: boolean;
  userRole: UserRole;
  membershipItems: SiteNavItem[];
  resourcesItems: SiteNavItem[];
  memberServicesItems: SiteNavItem[];
  aboutItems: SiteNavItem[];
}

export function useSiteNav(): SiteNav {
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [menuForms, setMenuForms] = useState<CognitoFormRecord[]>([]);
  const location = useLocation();

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

  // Get forms for a specific menu section, filtering out duplicates of static items
  const getFormsForSection = (section: string) =>
    menuForms
      .filter(f => f.menu_section === section && !staticFormLabels.has(f.label))
      .map(formToMenuItem);

  const membershipItems = useMemo<SiteNavItem[]>(() => [
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

  const resourcesItems = useMemo<SiteNavItem[]>(() => [
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

  const memberServicesItems = useMemo<SiteNavItem[]>(() => {
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
              label: 'Membership Changes',
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
            id: 'premium-care-handbook',
            label: 'Premium Care Handbook',
            description: 'View the Premium Care plan member handbook',
            icon: 'FileText',
            href: '/3d-flip-book/premium-care',
            external: false,
          },
          {
            id: 'premium-hsa-handbook',
            label: 'Premium HSA Handbook',
            description: 'View the Premium HSA plan member handbook',
            icon: 'FileText',
            href: '/3d-flip-book/premium-hsa',
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

  const aboutItems = useMemo<SiteNavItem[]>(() => [
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

  return {
    isAuthenticated,
    userRole,
    membershipItems,
    resourcesItems,
    memberServicesItems,
    aboutItems,
  };
}
