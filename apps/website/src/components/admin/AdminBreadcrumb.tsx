import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, LayoutDashboard } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface AdminBreadcrumbProps {
  currentPage?: string;
  items?: BreadcrumbItem[];
  className?: string;
}

export const AdminBreadcrumb: React.FC<AdminBreadcrumbProps> = ({
  currentPage,
  items,
  className = ''
}) => {
  const breadcrumbItems: BreadcrumbItem[] = items
    ? items
    : currentPage
      ? [{ label: currentPage }]
      : [];

  return (
    <nav
      aria-label="Breadcrumb"
      className={`mb-6 ${className}`}
    >
      <ol className="flex items-center space-x-2 text-sm">
        <li>
          <Link
            to="/admin/dashboard"
            className="flex items-center gap-1.5 text-neutral-600 hover:text-blue-600 transition-colors font-medium"
            aria-label="Admin Dashboard"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Admin Dashboard</span>
          </Link>
        </li>

        {breadcrumbItems.map((item, index) => (
          <li key={index} className="flex items-center space-x-2">
            <ChevronRight className="h-4 w-4 text-neutral-400" />
            {item.href && index < breadcrumbItems.length - 1 ? (
              <Link
                to={item.href}
                className="text-neutral-600 hover:text-blue-600 transition-colors font-medium"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-neutral-900" aria-current={index === breadcrumbItems.length - 1 ? 'page' : undefined}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
