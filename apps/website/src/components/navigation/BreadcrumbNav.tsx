import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const routeLabels: Record<string, string> = {
  'individuals-and-families': 'Individuals & Families',
  'businesses-and-organizations': 'Businesses & Organizations',
  'advisors-and-brokers': 'For Advisors',
  'how-it-works': 'How It Works',
  'get-started': 'Get a Quote',
  'compare-plans': 'Compare Plans',
  'plans': 'Plans',
  'features': 'Features',
  'resources': 'Resources',
  'blog': 'Blog',
  'events': 'Events',
  'member-stories': 'Member Stories',
  'podcast': 'Podcast',
  'faq': 'FAQ',
  'about-us': 'About Us',
  'contact': 'Contact',
  'join-our-team': 'Careers',
  'member': 'My Account',
  'portal': 'Portal',
  'claims': 'Claims',
  'forms': 'Forms',
  'feedback': 'Feedback',
  'refer-friend': 'Refer a Friend',
  'review': 'Review',
  'change-advisor': 'Change Advisor',
  'welcome-call': 'Welcome Call',
  'welcome-survey': 'Welcome Survey',
  'support': 'Support',
  'privacy-policy': 'Privacy Policy',
  'terms-and-conditions': 'Terms & Conditions',
  'state-notices': 'State Notices',
  'advisor-directory': 'Advisor Directory',
  'admin': 'Admin',
  'advisor': 'Advisor',
};

interface BreadcrumbNavProps {
  className?: string;
  customItems?: BreadcrumbItem[];
}

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ className, customItems }) => {
  const location = useLocation();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (customItems) return customItems;

    const pathSegments = location.pathname.split('/').filter(Boolean);

    if (pathSegments.length === 0) {
      return [];
    }

    const breadcrumbs: BreadcrumbItem[] = [];
    let currentPath = '';

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const label = routeLabels[segment] || segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      breadcrumbs.push({
        label,
        href: index === pathSegments.length - 1 ? undefined : currentPath,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        'py-4 px-4 sm:px-6 lg:px-8 bg-neutral-50 border-b border-neutral-200',
        className
      )}
    >
      <ol className="flex items-center space-x-2 text-sm max-w-7xl mx-auto">
        <li>
          <Link
            to="/"
            className="flex items-center text-neutral-600 hover:text-blue-600 transition-colors"
            aria-label="Home"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>

        {breadcrumbs.map((item, index) => (
          <li key={index} className="flex items-center">
            <ChevronRight className="h-4 w-4 text-neutral-400 mx-2" />
            {item.href ? (
              <Link
                to={item.href}
                className="text-neutral-600 hover:text-blue-600 transition-colors font-medium"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-neutral-900 font-semibold">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
