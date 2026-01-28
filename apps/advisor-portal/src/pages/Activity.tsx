// ============================================================================
// Activity Feed Page — Timeline of all activities
// ============================================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity as ActivityIcon,
  Filter,
  RefreshCw,
  Users,
  MessageSquare,
  CheckCircle,
  Shield,
  Calendar,
  UserPlus,
  TrendingUp,
  AlertTriangle,
  Loader2,
  AlertCircle,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import { useActivityFeed, useActivityConfig } from '../hooks/useActivity';
import type { ActivityType, ActivityFeedItem } from '@mpbhealth/champion-core';

const ACTIVITY_TYPE_GROUPS = [
  {
    label: 'Lead Activities',
    types: ['lead_created', 'lead_updated', 'lead_assigned', 'lead_status_changed', 'lead_converted', 'lead_lost'] as ActivityType[],
    icon: Users,
    color: 'purple',
  },
  {
    label: 'Messages',
    types: ['message_sent', 'message_received', 'message_opened'] as ActivityType[],
    icon: MessageSquare,
    color: 'blue',
  },
  {
    label: 'Tasks',
    types: ['task_created', 'task_completed', 'task_overdue', 'task_assigned'] as ActivityType[],
    icon: CheckCircle,
    color: 'green',
  },
  {
    label: 'Compliance',
    types: ['compliance_completed', 'compliance_due', 'compliance_violation'] as ActivityType[],
    icon: Shield,
    color: 'yellow',
  },
  {
    label: 'Meetings',
    types: ['meeting_scheduled', 'meeting_started', 'meeting_completed', 'meeting_cancelled'] as ActivityType[],
    icon: Calendar,
    color: 'orange',
  },
  {
    label: 'Team',
    types: ['member_joined', 'member_left', 'member_role_changed'] as ActivityType[],
    icon: UserPlus,
    color: 'pink',
  },
  {
    label: 'Achievements',
    types: ['goal_achieved', 'milestone_reached', 'system_alert'] as ActivityType[],
    icon: TrendingUp,
    color: 'gold',
  },
];

const ACTIVITY_ICONS: Record<string, typeof ActivityIcon> = {
  lead: Users,
  message: MessageSquare,
  task: CheckCircle,
  compliance: Shield,
  meeting: Calendar,
  member: UserPlus,
  goal: TrendingUp,
  milestone: TrendingUp,
  system: AlertTriangle,
  sequence: RefreshCw,
};

const ACTIVITY_COLORS: Record<string, string> = {
  lead: 'bg-purple-100 text-purple-600',
  message: 'bg-blue-100 text-blue-600',
  task: 'bg-green-100 text-green-600',
  compliance: 'bg-yellow-100 text-yellow-600',
  meeting: 'bg-orange-100 text-orange-600',
  member: 'bg-pink-100 text-pink-600',
  goal: 'bg-amber-100 text-amber-600',
  milestone: 'bg-indigo-100 text-indigo-600',
  system: 'bg-gray-100 text-gray-600',
  sequence: 'bg-cyan-100 text-cyan-600',
};

function getActivityCategory(type: ActivityType): string {
  const prefix = type.split('_')[0];
  return prefix;
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDateLabel(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function ActivityItem({ activity }: { activity: ActivityFeedItem }) {
  const category = getActivityCategory(activity.activity_type);
  const Icon = ACTIVITY_ICONS[category] || ActivityIcon;
  const colorClass = ACTIVITY_COLORS[category] || 'bg-gray-100 text-gray-600';

  return (
    <div className="flex gap-4">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className={`p-2 rounded-full ${colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="w-px flex-1 bg-th-border-primary mt-2" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-th-text-primary">
              {activity.actor_name !== 'System' && (
                <span className="font-medium">{activity.actor_name} </span>
              )}
              {activity.title}
            </p>
            {activity.description && (
              <p className="text-sm text-th-text-secondary mt-1">{activity.description}</p>
            )}
            {activity.lead_name && (
              <Link
                to={`/leads/${activity.lead_id}`}
                className="inline-flex items-center gap-1 text-sm text-th-accent-600 hover:text-th-accent-700 mt-1"
              >
                <Users className="w-3.5 h-3.5" />
                {activity.lead_name}
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
          <span className="text-xs text-th-text-muted whitespace-nowrap">
            {formatTime(activity.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Activity() {
  const [selectedTypes, setSelectedTypes] = useState<ActivityType[] | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);

  const { groupedActivities, loading, error, hasMore, loadMore, refresh } = useActivityFeed({
    types: selectedTypes,
    limit: 50,
  });

  const { allConfigs } = useActivityConfig();

  const toggleTypeGroup = (types: ActivityType[]) => {
    if (!selectedTypes) {
      setSelectedTypes(types);
    } else {
      const allSelected = types.every((t) => selectedTypes.includes(t));
      if (allSelected) {
        const newTypes = selectedTypes.filter((t) => !types.includes(t));
        setSelectedTypes(newTypes.length > 0 ? newTypes : undefined);
      } else {
        setSelectedTypes([...new Set([...selectedTypes, ...types])]);
      }
    }
  };

  const clearFilters = () => {
    setSelectedTypes(undefined);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-th-text-secondary">{error}</p>
          <button
            onClick={refresh}
            className="mt-4 text-th-accent-600 hover:text-th-accent-700 font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const dateKeys = Object.keys(groupedActivities);

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-th-text-primary">Activity Feed</h1>
            <p className="text-th-text-secondary mt-1">
              See what's happening across your organization
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showFilters || selectedTypes
                  ? 'bg-th-accent-600 text-white'
                  : 'bg-surface-secondary text-th-text-secondary hover:bg-surface-tertiary'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {selectedTypes && (
                <span className="px-1.5 py-0.5 bg-white/20 rounded text-xs">
                  {selectedTypes.length}
                </span>
              )}
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            <button
              onClick={refresh}
              className="p-2 text-th-text-muted hover:text-th-text-primary hover:bg-surface-secondary rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-6 p-4 bg-surface-primary rounded-xl border border-th-border-primary">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-th-text-secondary">Filter by activity type</span>
              {selectedTypes && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-th-accent-600 hover:text-th-accent-700"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_TYPE_GROUPS.map((group) => {
                const isSelected =
                  selectedTypes && group.types.every((t) => selectedTypes.includes(t));
                const GroupIcon = group.icon;

                return (
                  <button
                    key={group.label}
                    onClick={() => toggleTypeGroup(group.types)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-th-accent-600 text-white'
                        : 'bg-surface-secondary text-th-text-secondary hover:bg-surface-tertiary'
                    }`}
                  >
                    <GroupIcon className="w-4 h-4" />
                    {group.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Activity Timeline */}
        {loading && dateKeys.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-th-accent-600" />
          </div>
        ) : dateKeys.length === 0 ? (
          <div className="text-center py-16 bg-surface-primary rounded-xl border border-th-border-primary">
            <ActivityIcon className="w-12 h-12 text-th-text-muted mx-auto mb-4" />
            <p className="text-th-text-secondary">No activities found</p>
            <p className="text-sm text-th-text-muted mt-1">
              {selectedTypes ? 'Try adjusting your filters' : 'Activities will appear here as they happen'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {dateKeys.map((date) => (
              <div key={date}>
                {/* Date Header */}
                <div className="sticky top-0 z-10 mb-4">
                  <div className="inline-flex items-center px-3 py-1 bg-surface-secondary rounded-full text-sm font-medium text-th-text-secondary">
                    {formatDateLabel(groupedActivities[date][0].created_at)}
                  </div>
                </div>

                {/* Activities for this date */}
                <div className="bg-surface-primary rounded-xl border border-th-border-primary p-6">
                  {groupedActivities[date].map((activity, index) => (
                    <div key={activity.id}>
                      <ActivityItem activity={activity} />
                      {index === groupedActivities[date].length - 1 && (
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-th-border-primary" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Load More */}
            {hasMore && (
              <div className="text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-6 py-2 bg-surface-secondary text-th-text-secondary rounded-lg hover:bg-surface-tertiary transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    'Load more'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
