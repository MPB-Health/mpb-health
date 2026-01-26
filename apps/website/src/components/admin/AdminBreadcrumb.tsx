import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, LayoutDashboard } from 'lucide-react';

interface AdminBreadcrumbProps {
  currentPage: string;
  className?: string;
}

export const AdminBreadcrumb: React.FC<AdminBreadcrumbProps> = ({
  currentPage,
  className = ''
}) => {
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

        <li className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4 text-neutral-400" />
          <span className="font-medium text-neutral-900" aria-current="page">
            {currentPage}
          </span>
        </li>
      </ol>
    </nav>
  );
};
