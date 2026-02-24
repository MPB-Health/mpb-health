// ============================================================================
// Recent Leads Widget
// Shows most recent leads
// ============================================================================

import { Link } from 'react-router-dom';
import { ArrowRight, User } from 'lucide-react';
import { useCRM } from '../../../contexts/CRMContext';
import type { BaseWidgetProps } from '../types';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

// ============================================================================
// Recent Leads Widget Component
// ============================================================================

export default function RecentLeadsWidget({ config, size }: BaseWidgetProps) {
  const { recentLeads } = useCRM();

  const limit = (config.limit as number) || (size === 'sm' ? 3 : 5);
  const showAvatar = config.showAvatar !== false;

  const displayLeads = recentLeads.slice(0, limit);

  if (displayLeads.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No leads yet</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="space-y-3">
        {displayLeads.map((lead) => (
          <Link
            key={lead.id}
            to={`/leads/${lead.id}`}
            className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            {showAvatar && (
              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-medium text-sm">
                {getInitials(lead.first_name, lead.last_name)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {lead.first_name} {lead.last_name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {lead.email || 'No email'}
              </p>
            </div>
            <span className="text-xs text-gray-400">
              {formatTimeAgo(lead.created_at)}
            </span>
          </Link>
        ))}
      </div>

      <Link
        to="/leads"
        className="flex items-center justify-center gap-1 mt-4 pt-4 border-t dark:border-gray-700 text-sm text-blue-600 hover:text-blue-700 transition-colors"
      >
        View all leads
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.charAt(0) || '';
  const last = lastName?.charAt(0) || '';
  return (first + last).toUpperCase() || '?';
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return date.toLocaleDateString();
}
