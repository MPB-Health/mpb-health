// ============================================================================
// Team Widget
// Shows team member activity and presence
// ============================================================================

import { useState, useEffect } from 'react';
import { Users, Circle, Clock, MessageSquare, Phone, FileText, CheckSquare } from 'lucide-react';
import { useOrg } from '../../../contexts/OrgContext';
import { supabase } from '../../../lib/supabase';
import type { BaseWidgetProps } from '../types';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

// ============================================================================
// Types
// ============================================================================

interface TeamMember {
  id: string;
  full_name: string;
  avatar_url?: string;
  status: 'online' | 'away' | 'offline';
  last_active?: string;
  role?: string;
}

interface TeamActivity {
  id: string;
  user_id: string;
  user_name: string;
  action: 'call' | 'task' | 'note' | 'lead' | 'message';
  description: string;
  timestamp: string;
}

// ============================================================================
// Team Widget Component
// ============================================================================

export default function TeamWidget({ config, size }: BaseWidgetProps) {
  const { activeOrgId } = useOrg();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [activities, setActivities] = useState<TeamActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const view = (config.view as string) || 'activity';

  useEffect(() => {
    if (activeOrgId) {
      loadTeamData();
    }
  }, [activeOrgId]);

  const loadTeamData = async () => {
    setIsLoading(true);
    try {
      // Load organization members
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .limit(10);

      if (profiles) {
        // Simulate presence data (in production, use realtime presence)
        const membersWithStatus: TeamMember[] = profiles.map((p, index) => ({
          id: p.id,
          full_name: p.full_name || 'Team Member',
          avatar_url: p.avatar_url,
          status: index === 0 ? 'online' : index < 3 ? 'away' : 'offline',
          last_active: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          role: index === 0 ? 'Admin' : 'Agent',
        }));
        setMembers(membersWithStatus);

        // Generate mock activity
        const mockActivities: TeamActivity[] = [
          {
            id: '1',
            user_id: profiles[0]?.id || '',
            user_name: profiles[0]?.full_name || 'Team Member',
            action: 'call',
            description: 'Completed call with John Smith',
            timestamp: new Date(Date.now() - 300000).toISOString(),
          },
          {
            id: '2',
            user_id: profiles[1]?.id || '',
            user_name: profiles[1]?.full_name || 'Team Member',
            action: 'lead',
            description: 'Added new lead: Sarah Johnson',
            timestamp: new Date(Date.now() - 900000).toISOString(),
          },
          {
            id: '3',
            user_id: profiles[0]?.id || '',
            user_name: profiles[0]?.full_name || 'Team Member',
            action: 'task',
            description: 'Completed task: Follow up with prospect',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
          },
          {
            id: '4',
            user_id: profiles[2]?.id || '',
            user_name: profiles[2]?.full_name || 'Team Member',
            action: 'note',
            description: 'Added note to lead: Michael Brown',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
          },
        ];
        setActivities(mockActivities);
      }
    } catch (error) {
      console.error('Failed to load team data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 animate-pulse">
        <div className="space-y-3">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  const onlineCount = members.filter((m) => m.status === 'online').length;

  return (
    <div className="p-4">
      {/* Header Stats */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium">{onlineCount} online</p>
            <p className="text-xs text-gray-500">of {members.length} members</p>
          </div>
        </div>
        <div className="flex -space-x-2">
          {members.slice(0, 5).map((member) => (
            <div
              key={member.id}
              className="relative"
              title={member.full_name}
            >
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt={member.full_name}
                  className="h-8 w-8 rounded-full border-2 border-white dark:border-gray-800"
                />
              ) : (
                <div className="h-8 w-8 rounded-full border-2 border-white dark:border-gray-800 bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-xs font-medium text-violet-600">
                  {member.full_name.charAt(0)}
                </div>
              )}
              <span
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-gray-800',
                  member.status === 'online' && 'bg-green-500',
                  member.status === 'away' && 'bg-amber-500',
                  member.status === 'offline' && 'bg-gray-400'
                )}
              />
            </div>
          ))}
          {members.length > 5 && (
            <div className="h-8 w-8 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium">
              +{members.length - 5}
            </div>
          )}
        </div>
      </div>

      {/* Content based on view */}
      {view === 'members' ? (
        <TeamMembersList members={members} />
      ) : (
        <TeamActivityFeed activities={activities} />
      )}
    </div>
  );
}

// ============================================================================
// Team Members List Component
// ============================================================================

interface TeamMembersListProps {
  members: TeamMember[];
}

function TeamMembersList({ members }: TeamMembersListProps) {
  const sortedMembers = [...members].sort((a, b) => {
    const statusOrder = { online: 0, away: 1, offline: 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  return (
    <div className="space-y-2">
      {sortedMembers.map((member) => (
        <div
          key={member.id}
          className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div className="relative">
            {member.avatar_url ? (
              <img
                src={member.avatar_url}
                alt={member.full_name}
                className="h-10 w-10 rounded-full"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-sm font-medium text-violet-600">
                {member.full_name.charAt(0)}
              </div>
            )}
            <span
              className={cn(
                'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-gray-800',
                member.status === 'online' && 'bg-green-500',
                member.status === 'away' && 'bg-amber-500',
                member.status === 'offline' && 'bg-gray-400'
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{member.full_name}</p>
            <p className="text-xs text-gray-500">{member.role}</p>
          </div>
          <div className="text-right">
            <p className={cn(
              'text-xs capitalize',
              member.status === 'online' && 'text-green-600',
              member.status === 'away' && 'text-amber-600',
              member.status === 'offline' && 'text-gray-500'
            )}>
              {member.status}
            </p>
            {member.status !== 'online' && member.last_active && (
              <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(member.last_active)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Team Activity Feed Component
// ============================================================================

interface TeamActivityFeedProps {
  activities: TeamActivity[];
}

const ACTIVITY_ICONS: Record<string, typeof Phone> = {
  call: Phone,
  task: CheckSquare,
  note: FileText,
  lead: Users,
  message: MessageSquare,
};

const ACTIVITY_COLORS: Record<string, string> = {
  call: 'bg-green-100 text-green-600 dark:bg-green-900/30',
  task: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30',
  note: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30',
  lead: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30',
  message: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30',
};

function TeamActivityFeed({ activities }: TeamActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const Icon = ACTIVITY_ICONS[activity.action] || Circle;
        const colorClass = ACTIVITY_COLORS[activity.action] || 'bg-gray-100 text-gray-600 dark:bg-gray-700';

        return (
          <div key={activity.id} className="flex gap-3">
            <div className={cn('p-2 rounded-lg h-fit', colorClass)}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{activity.user_name}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {activity.description}
              </p>
              <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(activity.timestamp)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}
