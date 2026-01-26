import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../lib/utils';
import { generateBreadcrumbSchema } from '../../lib/schemaUtils';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const formatPathSegment = (segment: string): string => {
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const generateBreadcrumbsFromPath = (pathname: string): BreadcrumbItem[] => {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return [];
  }

  const breadcrumbs: BreadcrumbItem[] = [];
  let currentPath = '';

  segments.forEach((segment) => {
    currentPath += `/${segment}`;

    breadcrumbs.push({
      label: formatPathSegment(segment),
      href: currentPath,
    });
  });

  return breadcrumbs;
};

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
  const location = useLocation();

  const breadcrumbItems = items || generateBreadcrumbsFromPath(location.pathname);

  const schemaJson = useMemo(() => {
    if (breadcrumbItems.length === 0 || typeof window === 'undefined') {
      return '';
    }

    const origin = window.location?.origin || 'https://mpb.health';

    const schemaItems = [
      {
        name: 'Home',
        item: `${origin}/`,
        position: 1,
      },
      ...breadcrumbItems.map((item, index) => ({
        name: item.label,
        item: `${origin}${item.href}`,
        position: index + 2,
      })),
    ];

    return generateBreadcrumbSchema(schemaItems);
  }, [breadcrumbItems]);

  if (breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        'bg-neutral-50 border-b border-neutral-200 py-3 px-4 sm:px-6 lg:px-8',
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

        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;

          return (
            <li key={item.href} className="flex items-center space-x-2">
              <ChevronRight className="h-4 w-4 text-neutral-400" />
              {isLast ? (
                <span className="font-medium text-blue-600" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className="text-neutral-600 hover:text-blue-600 transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      {schemaJson && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: schemaJson }}
        />
      )}
    </nav>
  );
};
