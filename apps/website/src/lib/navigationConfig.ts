export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  description?: string;
  icon?: string;
  badge?: string;
  external?: boolean;
  priority?: 'high' | 'medium' | 'low';
  children?: NavigationItem[];
}

export interface NavigationSection {
  id: string;
  title: string;
  items: NavigationItem[];
}

export const prospectNavigation: NavigationItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/',
    icon: 'Home',
    priority: 'high',
  },
  {
    id: 'plans',
    label: 'Membership Options',
    href: '/plans',
    icon: 'Layers',
    priority: 'high',
    description: 'Explore our health sharing options',
    children: [
      {
        id: 'individuals-families',
        label: 'Individuals & Families',
        href: '/individuals-and-families',
        description: 'Comprehensive plans for you and your loved ones',
        icon: 'Users',
      },
      {
        id: 'businesses',
        label: 'Businesses & Organizations',
        href: '/businesses-and-organizations',
        description: 'Health sharing solutions for your team',
        icon: 'Building2',
      },
      {
        id: 'advisors-brokers',
        label: 'For Advisors',
        href: '/advisors-and-brokers',
        description: 'Partnership opportunities for advisors',
        icon: 'Briefcase',
      },
      {
        id: 'compare-plans',
        label: 'Compare Plans',
        href: '/compare-plans',
        description: 'Side-by-side plan comparison',
        icon: 'GitCompare',
      },
    ],
  },
  {
    id: 'how-it-works',
    label: 'How It Works',
    href: '/how-it-works',
    icon: 'CircleHelp',
    priority: 'high',
  },
  {
    id: 'benefits',
    label: 'Benefits',
    href: '/features',
    icon: 'Sparkles',
    priority: 'high',
    description: 'Explore our comprehensive healthcare benefits',
  },
  {
    id: 'why-mpb',
    label: 'Why MPB Health',
    href: '/how-it-works#why-different',
    icon: 'Award',
    priority: 'high',
    description: 'Discover what makes MPB Health different',
  },
  {
    id: 'resources',
    label: 'Learn',
    href: '#',
    icon: 'BookOpen',
    priority: 'medium',
    children: [
      {
        id: 'blog',
        label: 'Blog',
        href: '/blog',
        description: 'Healthcare insights and news',
        icon: 'Newspaper',
      },
      {
        id: 'plan-comparison',
        label: 'Plan Comparison',
        href: '/plans/compare',
        description: 'Compare plans side-by-side',
        icon: 'GitCompare',
      },
      {
        id: 'resources-library',
        label: 'Resource Library',
        href: '/resources',
        description: 'Guides and helpful resources',
        icon: 'Library',
      },
      {
        id: 'podcast',
        label: 'HealthyCare Podcast',
        href: '/podcast',
        description: 'Where wellness meets real life',
        icon: 'Mic2',
        badge: 'New',
      },
      {
        id: 'events',
        label: 'Events',
        href: '/events',
        description: 'Webinars and community events',
        icon: 'Calendar',
      },
      {
        id: 'member-stories',
        label: 'Member Stories',
        href: '/member-stories',
        description: 'Real member experiences',
        icon: 'Heart',
      },
      {
        id: 'faq',
        label: 'FAQ',
        href: '/faq',
        description: 'Common questions answered',
        icon: 'HelpCircle',
      },
    ],
  },
  {
    id: 'about',
    label: 'About',
    href: '#',
    icon: 'Info',
    priority: 'low',
    children: [
      {
        id: 'about-us',
        label: 'About Us',
        href: '/about-us',
        description: 'Our mission and values',
        icon: 'Info',
      },
      {
        id: 'contact',
        label: 'Contact',
        href: '/contact',
        description: 'Get in touch',
        icon: 'Mail',
      },
      {
        id: 'join-team',
        label: 'Careers',
        href: '/join-our-team',
        description: 'Join our team',
        icon: 'Briefcase',
      },
    ],
  },
];

export const memberNavigation: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/member',
    icon: 'LayoutDashboard',
    priority: 'high',
  },
  {
    id: 'my-tools',
    label: 'My Tools',
    href: '#',
    icon: 'Wrench',
    priority: 'high',
    children: [
      {
        id: 'member-portal-link',
        label: 'Member Portal',
        href: 'https://app.mpb.health/',
        description: 'Access your full member account',
        icon: 'ExternalLink',
        external: true,
      },
      {
        id: 'claims',
        label: 'Claims',
        href: '/member/portal/claims',
        description: 'View and manage claims',
        icon: 'FileText',
      },
      {
        id: 'advisor-directory-member',
        label: 'Find an Advisor',
        href: '/advisor-directory',
        description: 'Connect with MPB advisors',
        icon: 'Users',
      },
      {
        id: 'change-advisor',
        label: 'Change Advisor',
        href: '/member/forms/change-advisor',
        description: 'Update your advisor',
        icon: 'UserCog',
      },
    ],
  },
  {
    id: 'quick-actions',
    label: 'Quick Actions',
    href: '#',
    icon: 'Zap',
    priority: 'high',
    children: [
      {
        id: 'refer-friend',
        label: 'Refer a Friend',
        href: '/member/forms/refer-friend',
        description: 'Help others discover MPB',
        icon: 'UserPlus',
      },
      {
        id: 'give-feedback',
        label: 'Give Feedback',
        href: '/member/forms/feedback',
        description: 'Share your experience',
        icon: 'MessageSquare',
      },
      {
        id: 'review-us',
        label: 'Leave a Review',
        href: '/member/forms/review',
        description: 'Review our service',
        icon: 'Star',
      },
      {
        id: 'schedule-call',
        label: 'Schedule a Call',
        href: '/member/forms/welcome-call',
        description: 'Book a support call',
        icon: 'Phone',
      },
    ],
  },
  {
    id: 'resources-member',
    label: 'Resources',
    href: '/resources',
    icon: 'BookOpen',
    priority: 'medium',
  },
  {
    id: 'support-member',
    label: 'Support',
    href: '/support',
    icon: 'LifeBuoy',
    priority: 'medium',
  },
];

export const adminToolsNavigation: NavigationItem[] = [
  {
    id: 'list-bill-setup',
    label: 'List-Bill Setup',
    href: '/admin/list-bill-setup',
    description: 'Initialize list-billing',
    icon: 'Briefcase',
  },
  {
    id: 'list-bill-conversion',
    label: 'List-Bill Conversion',
    href: '/admin/list-bill-conversion',
    description: 'Convert to list-bill format',
    icon: 'FileText',
  },
  {
    id: 'list-bill-update',
    label: 'List-Bill Update',
    href: '/admin/list-bill-update',
    description: 'Update billing information',
    icon: 'ClipboardList',
  },
  {
    id: 'employee-removal',
    label: 'Employee Removal',
    href: '/admin/employee-removal',
    description: 'Process terminations',
    icon: 'UserMinus',
  },
];

export const mobileQuickLinks: NavigationItem[] = [
  {
    id: 'quick-home',
    label: 'Home',
    href: '/',
    icon: 'Home',
  },
  {
    id: 'quick-plans',
    label: 'Plans',
    href: '/plans',
    icon: 'Layers',
  },
  {
    id: 'quick-quote',
    label: 'Quote',
    href: '/get-started',
    icon: 'Calculator',
  },
  {
    id: 'quick-contact',
    label: 'Contact',
    href: '/contact',
    icon: 'MessageCircle',
  },
];

export const footerNavigation: NavigationSection[] = [
  {
    id: 'plans-footer',
    title: 'Plans',
    items: [
      {
        id: 'footer-individuals',
        label: 'Individuals & Families',
        href: '/individuals-and-families',
        icon: 'Users',
      },
      {
        id: 'footer-businesses',
        label: 'Businesses',
        href: '/businesses-and-organizations',
        icon: 'Building2',
      },
      {
        id: 'footer-advisors',
        label: 'For Advisors',
        href: '/advisors-and-brokers',
        icon: 'Briefcase',
      },
    ],
  },
  {
    id: 'resources-footer',
    title: 'Resources',
    items: [
      {
        id: 'footer-blog',
        label: 'Blog',
        href: '/blog',
        icon: 'Newspaper',
      },
      {
        id: 'footer-faq',
        label: 'FAQ',
        href: '/faq',
        icon: 'HelpCircle',
      },
      {
        id: 'footer-resources',
        label: 'Resource Library',
        href: '/resources',
        icon: 'Library',
      },
    ],
  },
  {
    id: 'company-footer',
    title: 'Company',
    items: [
      {
        id: 'footer-about',
        label: 'About Us',
        href: '/about-us',
        icon: 'Info',
      },
      {
        id: 'footer-contact',
        label: 'Contact',
        href: '/contact',
        icon: 'Mail',
      },
      {
        id: 'footer-careers',
        label: 'Careers',
        href: '/join-our-team',
        icon: 'Briefcase',
      },
    ],
  },
  {
    id: 'legal-footer',
    title: 'Legal',
    items: [
      {
        id: 'footer-privacy',
        label: 'Privacy Policy',
        href: '/privacy-policy',
        icon: 'Shield',
      },
      {
        id: 'footer-terms',
        label: 'Terms & Conditions',
        href: '/terms-and-conditions',
        icon: 'FileText',
      },
      {
        id: 'footer-state-notices',
        label: 'State Notices',
        href: '/state-notices',
        icon: 'MapPin',
      },
    ],
  },
];

export const getNavigationByRole = (
  userRole?: 'guest' | 'member' | 'advisor' | 'admin' | 'staff'
): NavigationItem[] => {
  if (!userRole || userRole === 'guest') {
    return prospectNavigation;
  }

  if (userRole === 'member') {
    return memberNavigation;
  }

  if (userRole === 'admin' || userRole === 'staff') {
    const memberNav = [...memberNavigation];
    const toolsSection = memberNav.find(item => item.id === 'my-tools');
    if (toolsSection && toolsSection.children) {
      toolsSection.children = [
        ...toolsSection.children,
        ...adminToolsNavigation,
      ];
    }
    return memberNav;
  }

  return prospectNavigation;
};
