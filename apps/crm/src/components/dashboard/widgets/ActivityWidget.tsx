// ============================================================================
// Activity Widget
// Shows recent activities timeline
// ============================================================================

import { Link } from 'react-router-dom';
import { ArrowRight, Phone, Mail, Calendar, FileText, CheckSquare } from 'lucide-react';
import { useCRM } from '../../../contexts/CRMContext';
import type { BaseWidgetProps } from '../types';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

// ============================================================================
// Activity Type Icons
// ============================================================================

const ACTIVITY_ICONS: Record<string, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: FileText,
  task_created: CheckSquare,
  task_completed: CheckSquare,
};

const ACTIVITY_COLORS: Record<string, string> = {
  call: 'bg-blue-500',
  email: 'bg-green-500',
  meeting: 'bg-blue-500',
  note: 'bg-yellow-500',
  task_created: 'bg-blue-500',
  task_completed: 'bg-green-500',
};

// ============================================================================
// Activity Widget Component
// ============================================================================

export default function ActivityWidget({ config, size }: BaseWidgetProps) {
  const { recentActivities } = useCRM();

  const limit = (config.limit as number) || (size === 'sm' ? 3 : 5);
  const showDescription = config.showDescription !== false;

  const displayActivities = recentActivities.slice(0, limit);

  if (displayActivities.length === 0) {
    return (
      <div className="p-4 text-center text-th-text-secondary">
        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-surface-tertiary" />

        <div className="space-y-4">
          {displayActivities.map((activity, index) => {
            const Icon = ACTIVITY_ICONS[activity.activity_type] || FileText;
            const color = ACTIVITY_COLORS[activity.activity_type] || 'bg-gray-500';

            return (
              <div key={activity.id || index} className="relative flex gap-3">
                {/* Timeline dot */}
                <div className={cn('w-6 h-6 rounded-full flex items-center justify-center z-10', color)}>
                  <Icon className="h-3 w-3 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-4">
                  <p className="text-sm font-medium truncate">{activity.title}</p>
                  {showDescription && activity.description && (
                    <p className="text-xs text-th-text-secondary mt-0.5 line-clamp-2">
                      {activity.description}
                    </p>
                  )}
                  <p className="text-xs text-th-text-tertiary mt-1">
                    {formatTimeAgo(activity.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Link
        to="/leads"
        className="flex items-center justify-center gap-1 mt-2 pt-4 border-t border-th-border text-sm text-blue-600 hover:text-blue-700 transition-colors"
      >
        View all activity
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return date.toLocaleDateString();
}
