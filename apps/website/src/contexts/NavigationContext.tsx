import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  description?: string;
  icon?: string;
  parent_id?: string;
  order_position: number;
  is_active: boolean;
  requires_auth: boolean;
  allowed_roles?: string[];
  external: boolean;
  badge?: string;
  children?: NavigationItem[];
}

interface NavigationContextType {
  navigationItems: NavigationItem[];
  loading: boolean;
  error: string | null;
  prospectNavigation: NavigationItem[];
  memberNavigation: NavigationItem[];
  trackNavigationClick: (itemId: string, action: string) => Promise<void>;
  refreshNavigation: () => Promise<void>;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};

const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('nav_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('nav_session_id', sessionId);
  }
  return sessionId;
};

const getMemberNavigation = (): NavigationItem[] => {
  return [
    {
      id: 'member-dashboard',
      label: 'Dashboard',
      href: '/member-portal',
      icon: 'LayoutDashboard',
      order_position: 1,
      is_active: true,
      requires_auth: true,
      external: false,
    },
    {
      id: 'portal-access',
      label: 'Portal Access',
      href: '#',
      icon: 'Lock',
      order_position: 2,
      is_active: true,
      requires_auth: true,
      external: false,
      children: [
        {
          id: 'member-portal',
          label: 'Member Portal',
          href: '/member-portal',
          description: 'Access your member dashboard',
          icon: 'ExternalLink',
          order_position: 1,
          is_active: true,
          requires_auth: true,
          external: false,
        },
        {
          id: 'member-dashboard-link',
          label: 'Dashboard',
          href: '/member-portal',
          description: 'View your account details and benefits',
          icon: 'UserCircle',
          order_position: 2,
          is_active: true,
          requires_auth: true,
          external: false,
        },
      ],
    },
    {
      id: 'member-forms',
      label: 'Member Forms',
      href: '#',
      icon: 'FileText',
      order_position: 3,
      is_active: true,
      requires_auth: true,
      external: false,
      children: [
        {
          id: 'member-feedback',
          label: 'Member Feedback',
          href: '/member/feedback',
          description: 'Share your experience with us',
          icon: 'MessageSquare',
          order_position: 1,
          is_active: true,
          requires_auth: true,
          external: false,
        },
        {
          id: 'refer-friend',
          label: 'Refer a Friend',
          href: '/member/refer',
          description: 'Help others discover MPB Health',
          icon: 'Users',
          order_position: 2,
          is_active: true,
          requires_auth: true,
          external: false,
        },
        {
          id: 'review-us',
          label: 'Review Us',
          href: '/member/review',
          description: 'Leave a review and help our community grow',
          icon: 'Star',
          order_position: 3,
          is_active: true,
          requires_auth: true,
          external: false,
        },
        {
          id: 'change-advisor',
          label: 'Review or Change Advisor',
          href: '/member/change-advisor',
          description: 'Update your healthcare advisor preferences',
          icon: 'Users',
          order_position: 4,
          is_active: true,
          requires_auth: true,
          external: false,
        },
        {
          id: 'advisor-directory-member',
          label: 'Advisor Directory',
          href: '/advisor-directory',
          description: 'Find and connect with MPB Health advisors',
          icon: 'Users',
          order_position: 5,
          is_active: true,
          requires_auth: true,
          external: false,
        },
      ],
    },
    {
      id: 'onboarding',
      label: 'Onboarding',
      href: '#',
      icon: 'Phone',
      order_position: 4,
      is_active: true,
      requires_auth: true,
      external: false,
      children: [
        {
          id: 'schedule-call',
          label: 'Schedule Welcome Call',
          href: '/schedule-welcome-call',
          description: 'Book your personalized orientation session',
          icon: 'Phone',
          order_position: 1,
          is_active: true,
          requires_auth: true,
          external: false,
        },
        {
          id: 'welcome-survey',
          label: 'Welcome Call Survey',
          href: '/member/welcome-survey',
          description: 'Share feedback on your welcome experience',
          icon: 'ClipboardList',
          order_position: 2,
          is_active: true,
          requires_auth: true,
          external: false,
        },
        {
          id: 'submit-ticket',
          label: 'Submit a Ticket',
          href: '/support',
          description: 'Get help with technical or account issues',
          icon: 'HelpCircle',
          order_position: 3,
          is_active: true,
          requires_auth: true,
          external: false,
        },
      ],
    },
    {
      id: 'member-handbooks',
      label: 'Member Handbooks',
      href: '#',
      icon: 'BookOpen',
      order_position: 5,
      is_active: true,
      requires_auth: true,
      external: false,
      children: [
        {
          id: 'careplus-handbook',
          label: 'Care+ Handbook',
          href: '/handbooks/care-plus',
          description: 'View the Care+ plan member handbook',
          icon: 'FileText',
          order_position: 1,
          is_active: true,
          requires_auth: true,
          external: false,
        },
        {
          id: 'direct-handbook',
          label: 'Direct Handbook',
          href: '/handbooks/direct',
          description: 'View the Direct plan member handbook',
          icon: 'FileText',
          order_position: 2,
          is_active: true,
          requires_auth: true,
          external: false,
        },
        {
          id: 'secure-hsa-handbook',
          label: 'Secure HSA Handbook',
          href: '/handbooks/secure-hsa',
          description: 'View the Secure HSA plan member handbook',
          icon: 'FileText',
          order_position: 3,
          is_active: true,
          requires_auth: true,
          external: false,
        },
        {
          id: 'essentials-handbook',
          label: 'Essentials Handbook',
          href: '/handbooks/essentials',
          description: 'View the Essentials plan member handbook',
          icon: 'FileText',
          order_position: 4,
          is_active: true,
          requires_auth: true,
          external: false,
        },
      ],
    },
    {
      id: 'employer-tools',
      label: 'Employer Tools',
      href: '#',
      icon: 'Building2',
      order_position: 6,
      is_active: true,
      requires_auth: true,
      allowed_roles: ['admin', 'employer'],
      external: false,
      children: [
        {
          id: 'list-bill-setup',
          label: 'List-Bill Setup',
          href: '/admin/list-bill-setup',
          description: 'Initialize list-billing for your organization',
          icon: 'Briefcase',
          order_position: 1,
          is_active: true,
          requires_auth: true,
          allowed_roles: ['admin', 'employer'],
          external: false,
        },
        {
          id: 'list-bill-conversion',
          label: 'List-Bill Conversion',
          href: '/admin/list-bill-conversion',
          description: 'Convert existing billing to list-bill format',
          icon: 'FileText',
          order_position: 2,
          is_active: true,
          requires_auth: true,
          allowed_roles: ['admin', 'employer'],
          external: false,
        },
        {
          id: 'list-bill-update',
          label: 'List-Bill Update',
          href: '/admin/list-bill-update',
          description: 'Update your list-billing information',
          icon: 'ClipboardList',
          order_position: 3,
          is_active: true,
          requires_auth: true,
          allowed_roles: ['admin', 'employer'],
          external: false,
        },
        {
          id: 'employee-removal',
          label: 'Employee Removal',
          href: '/admin/employee-removal',
          description: 'Process employee terminations',
          icon: 'UserMinus',
          order_position: 4,
          is_active: true,
          requires_auth: true,
          allowed_roles: ['admin', 'employer'],
          external: false,
        },
      ],
    },
    {
      id: 'resources-member',
      label: 'Resources',
      href: '/resources',
      icon: 'BookOpen',
      order_position: 7,
      is_active: true,
      requires_auth: true,
      external: false,
    },
    {
      id: 'support-member',
      label: 'Support',
      href: '/support',
      icon: 'HelpCircle',
      order_position: 8,
      is_active: true,
      requires_auth: true,
      external: false,
    },
  ];
};

const getFallbackNavigation = (): NavigationItem[] => {
  return [
    {
      id: 'home',
      label: 'Home',
      href: '/',
      icon: 'Home',
      order_position: 1,
      is_active: true,
      requires_auth: false,
      external: false,
    },
    {
      id: 'plans',
      label: 'Plans & Pricing',
      href: '/plans',
      icon: 'DollarSign',
      order_position: 2,
      is_active: true,
      requires_auth: false,
      external: false,
      children: [
        {
          id: 'individuals',
          label: 'Individuals & Families',
          href: '/individuals-and-families',
          description: 'Comprehensive health sharing plans for you and your loved ones',
          icon: 'Users',
          order_position: 1,
          is_active: true,
          requires_auth: false,
          external: false,
        },
        {
          id: 'businesses',
          label: 'Businesses & Organizations',
          href: '/businesses-and-organizations',
          description: 'Health Plan with Health Savings Account',
          icon: 'Building2',
          order_position: 2,
          is_active: true,
          requires_auth: false,
          external: false,
        },
        {
          id: 'compare',
          label: 'Compare Plans',
          href: '/compare-plans',
          description: 'Side-by-side comparison of all available plans',
          icon: 'GitCompare',
          order_position: 3,
          is_active: true,
          requires_auth: false,
          external: false,
        },
      ],
    },
    {
      id: 'how-it-works',
      label: 'How It Works',
      href: '/how-it-works',
      icon: 'HelpCircle',
      order_position: 3,
      is_active: true,
      requires_auth: false,
      external: false,
    },
    {
      id: 'features',
      label: 'Features',
      href: '/features',
      icon: 'Star',
      order_position: 4,
      is_active: true,
      requires_auth: false,
      external: false,
    },
    {
      id: 'resources',
      label: 'Resources',
      href: '/resources',
      icon: 'BookOpen',
      order_position: 5,
      is_active: true,
      requires_auth: false,
      external: false,
      children: [
        {
          id: 'resource-library',
          label: 'Resource Library',
          href: '/resources',
          description: 'Guides, articles, and helpful resources',
          icon: 'BookOpen',
          order_position: 1,
          is_active: true,
          requires_auth: false,
          external: false,
        },
        {
          id: 'blog',
          label: 'Blog',
          href: '/blog',
          description: 'Latest news and healthcare insights',
          icon: 'Newspaper',
          order_position: 2,
          is_active: true,
          requires_auth: false,
          external: false,
        },
        {
          id: 'events',
          label: 'Events',
          href: '/events',
          description: 'Upcoming webinars and community events',
          icon: 'Calendar',
          order_position: 3,
          is_active: true,
          requires_auth: false,
          external: false,
        },
        {
          id: 'member-stories',
          label: 'Member Stories',
          href: '/member-stories',
          description: 'Real experiences from our community',
          icon: 'Heart',
          order_position: 4,
          is_active: true,
          requires_auth: false,
          external: false,
        },
        {
          id: 'state-notices',
          label: 'State Notices',
          href: '/state-notices',
          description: 'Important state-specific information and requirements',
          icon: 'FileText',
          order_position: 5,
          is_active: true,
          requires_auth: false,
          external: false,
        },
        {
          id: 'washington-statement',
          label: 'Washington Statement',
          href: '/washington-statement',
          description: 'Washington state-specific disclosures',
          icon: 'Shield',
          order_position: 6,
          is_active: true,
          requires_auth: false,
          external: false,
        },
        {
          id: 'faq',
          label: 'FAQ',
          href: '/faq',
          description: 'Frequently asked questions and answers',
          icon: 'HelpCircle',
          order_position: 7,
          is_active: true,
          requires_auth: false,
          external: false,
        },
      ],
    },
    {
      id: 'about',
      label: 'About',
      href: '/about-us',
      icon: 'Info',
      order_position: 6,
      is_active: true,
      requires_auth: false,
      external: false,
      children: [
        {
          id: 'about-us',
          label: 'About Us',
          href: '/about-us',
          description: 'Our mission, values, and story',
          icon: 'Info',
          order_position: 1,
          is_active: true,
          requires_auth: false,
          external: false,
        },
        {
          id: 'contact',
          label: 'Contact',
          href: '/contact',
          description: 'Get in touch with our team',
          icon: 'Mail',
          order_position: 2,
          is_active: true,
          requires_auth: false,
          external: false,
        },
        {
          id: 'join-team',
          label: 'Join Our Team',
          href: '/join-our-team',
          description: 'Explore career opportunities',
          icon: 'Briefcase',
          order_position: 3,
          is_active: true,
          requires_auth: false,
          external: false,
        },
      ],
    },
  ];
};

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const _buildNavigationTree = (items: NavigationItem[]): NavigationItem[] => {
    const itemMap = new Map<string, NavigationItem>();
    const rootItems: NavigationItem[] = [];

    items.forEach(item => {
      itemMap.set(item.id, { ...item, children: [] });
    });

    items.forEach(item => {
      const currentItem = itemMap.get(item.id);
      if (!currentItem) return;

      if (item.parent_id) {
        const parent = itemMap.get(item.parent_id);
        if (parent && parent.children) {
          parent.children.push(currentItem);
          parent.children.sort((a, b) => a.order_position - b.order_position);
        }
      } else {
        rootItems.push(currentItem);
      }
    });

    return rootItems.sort((a, b) => a.order_position - b.order_position);
  };

  const fetchNavigation = useCallback(async () => {
    setLoading(true);
    setError(null);

    const prospectItems = getFallbackNavigation();
    const memberItems = getMemberNavigation();
    const allItems = [...prospectItems, ...memberItems];
    setNavigationItems(allItems);
    setLoading(false);

    // Supabase fetch disabled for performance - using fallback navigation
    // Uncomment below if you need dynamic navigation from database
    /*
    try {
      const { data, error: fetchError } = await supabase
        .from('navigation_items')
        .select('*')
        .eq('is_active', true)
        .order('order_position', { ascending: true });

      if (fetchError) {
        console.error('NavigationContext: Supabase fetch error:', fetchError);
        throw fetchError;
      }

      const tree = buildNavigationTree(data || []);
      setNavigationItems(tree);

      if (tree.length === 0) {
        console.warn('NavigationContext: No navigation items found, using fallback');
        const prospectItems = getFallbackNavigation();
        const memberItems = getMemberNavigation();
        const allItems = [...prospectItems, ...memberItems];
        setNavigationItems(allItems);
      }
    } catch (err) {
      console.error('NavigationContext: Error fetching navigation:', err);
      setError('Failed to load navigation');

      const prospectItems = getFallbackNavigation();
      const memberItems = getMemberNavigation();
      const allItems = [...prospectItems, ...memberItems];
      setNavigationItems(allItems);
    } finally {
      setLoading(false);
    }
    */
  }, []);

  useEffect(() => {
    fetchNavigation();
  }, [fetchNavigation]);

  const trackNavigationClick = useCallback(async (itemId: string, action: string = 'click') => {
    if (!isSupabaseConfigured) return;
    try {
      const sessionId = getSessionId();

      await supabase.from('navigation_analytics').insert({
        user_id: user?.id || null,
        navigation_item_id: itemId,
        session_id: sessionId,
        action,
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
      });
    } catch (err) {
      console.error('Error tracking navigation:', err);
    }
  }, [user]);

  const filterNavigationTree = (items: NavigationItem[], requiresAuth: boolean): NavigationItem[] => {
    return items
      .filter(item => {
        if (item.requires_auth !== requiresAuth) return false;

        if (requiresAuth && !user) return false;

        if (item.allowed_roles && item.allowed_roles.length > 0) {
          const userRole = user?.user_metadata?.role || user?.app_metadata?.role;
          if (!userRole || !item.allowed_roles.includes(userRole)) return false;
        }

        return true;
      })
      .map(item => ({
        ...item,
        children: item.children ? filterNavigationTree(item.children, requiresAuth) : undefined,
      }));
  };

  const prospectNavigation = filterNavigationTree(navigationItems, false);
  const memberNavigation = filterNavigationTree(navigationItems, true);

  const value: NavigationContextType = {
    navigationItems,
    loading,
    error,
    prospectNavigation,
    memberNavigation,
    trackNavigationClick,
    refreshNavigation: fetchNavigation,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};
