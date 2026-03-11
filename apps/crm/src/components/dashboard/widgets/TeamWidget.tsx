// ============================================================================
// Team Widget
// Shows team member activity and presence
// ============================================================================

import { useState, useEffect, useMemo } from 'react';
import { Users, Circle, Clock, MessageSquare, Phone, FileText, CheckSquare } from 'lucide-react';
import { useOrg } from '../../../contexts/OrgContext';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { usePresence } from '@mpbhealth/database';
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
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [activities, setActivities] = useState<TeamActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const view = (config.view as string) || 'activity';

  // Track presence via Supabase Realtime
  const presenceMeta = useMemo(() => ({ org_id: activeOrgId }), [activeOrgId]);
  const { presenceState } = usePresence({
    channelName: `crm-presence:${activeOrgId || 'default'}`,
    userId: user?.id || 'anon',
    metadata: presenceMeta,
  });

  // Derive online user IDs from presence state
  const onlineUserIds = useMemo(() => new Set(Object.keys(presenceState)), [presenceState]);

  useEffect(() => {
    if (activeOrgId) {
      loadTeamData();
    }
  }, [activeOrgId]);

  // Update member presence status when realtime presence changes
  useEffect(() => {
    if (members.length > 0) {
      setMembers((prev) =>
        prev.map((m) => ({
          ...m,
          status: onlineUserIds.has(m.id) ? 'online' as const : 'offline' as const,
        }))
      );
    }
  }, [onlineUserIds]);

  const loadTeamData = async () => {
    setIsLoading(true);
    try {
      // Load organization members
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .limit(10);

      if (profiles) {
        // Look up org membership roles for each profile
        const { data: memberships } = await supabase
          .from('org_memberships')
          .select('user_id, role')
          .eq('org_id', activeOrgId!)
          .in('user_id', profiles.map((p) => p.id));

        const roleMap = new Map(memberships?.map((m) => [m.user_id, m.role]) ?? []);

        const membersWithStatus: TeamMember[] = profiles.map((p) => ({
          id: p.id,
          full_name: p.full_name || 'Team Member',
          avatar_url: p.avatar_url,
          status: onlineUserIds.has(p.id) ? 'online' as const : 'offline' as const,
          role: (roleMap.get(p.id) || 'agent').replace(/^\w/, (c: string) => c.toUpperCase()),
        }));
        setMembers(membersWithStatus);

        // Load real recent activity from lead_activities
        const { data: recentActivities } = await supabase
          .from('lead_activities')
          .select('id, activity_type, title, description, created_at, created_by')
          .order('created_at', { ascending: false })
          .limit(8);

        if (recentActivities && recentActivities.length > 0) {
          const profileMap = new Map(profiles.map((p) => [p.id, p.full_name || 'Team Member']));

          const ACTION_TYPE_MAP: Record<string, TeamActivity['action']> = {
            call: 'call',
            note: 'note',
            email: 'message',
            meeting: 'call',
            status_change: 'lead',
            assignment: 'lead',
            task_created: 'task',
            task_completed: 'task',
          };

          const realActivities: TeamActivity[] = recentActivities.map((a) => ({
            id: a.id,
            user_id: a.created_by || '',
            user_name: profileMap.get(a.created_by || '') || 'Team Member',
            action: ACTION_TYPE_MAP[a.activity_type] || 'note',
            description: a.title || a.description || a.activity_type,
            timestamp: a.created_at,
          }));
          setActivities(realActivities);
        } else {
          setActivities([]);
        }
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
          <div className="h-12 bg-surface-tertiary rounded" />
          <div className="h-12 bg-surface-tertiary rounded" />
          <div className="h-12 bg-surface-tertiary rounded" />
        </div>
      </div>
    );
  }

  const onlineCount = members.filter((m) => m.status === 'online').length;

  return (
    <div className="p-4">
      {/* Header Stats */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-th-border">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium">{onlineCount} online</p>
            <p className="text-xs text-th-text-secondary">of {members.length} members</p>
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
                  className="h-8 w-8 rounded-full border-2 border-surface-primary"
                />
              ) : (
                <div className="h-8 w-8 rounded-full border-2 border-surface-primary bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-xs font-medium text-blue-600">
                  {member.full_name.charAt(0)}
                </div>
              )}
              <span
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface-primary',
                  member.status === 'online' && 'bg-green-500',
                  member.status === 'away' && 'bg-amber-500',
                  member.status === 'offline' && 'bg-surface-tertiary'
                )}
              />
            </div>
          ))}
          {members.length > 5 && (
            <div className="h-8 w-8 rounded-full border-2 border-surface-primary bg-surface-tertiary flex items-center justify-center text-xs font-medium">
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
          className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-surface-secondary transition-colors"
        >
          <div className="relative">
            {member.avatar_url ? (
              <img
                src={member.avatar_url}
                alt={member.full_name}
                className="h-10 w-10 rounded-full"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-sm font-medium text-blue-600">
                {member.full_name.charAt(0)}
              </div>
            )}
            <span
              className={cn(
                'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface-primary',
                member.status === 'online' && 'bg-green-500',
                member.status === 'away' && 'bg-amber-500',
                member.status === 'offline' && 'bg-surface-tertiary'
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{member.full_name}</p>
            <p className="text-xs text-th-text-secondary">{member.role}</p>
          </div>
          <div className="text-right">
            <p className={cn(
              'text-xs capitalize',
              member.status === 'online' && 'text-green-600',
              member.status === 'away' && 'text-amber-600',
              member.status === 'offline' && 'text-th-text-secondary'
            )}>
              {member.status}
            </p>
            {member.status !== 'online' && member.last_active && (
              <p className="text-xs text-th-text-tertiary flex items-center gap-1 justify-end">
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
  lead: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30',
  message: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30',
};

function TeamActivityFeed({ activities }: TeamActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-4 text-th-text-secondary">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const Icon = ACTIVITY_ICONS[activity.action] || Circle;
        const colorClass = ACTIVITY_COLORS[activity.action] || 'bg-surface-tertiary text-th-text-secondary';

        return (
          <div key={activity.id} className="flex gap-3">
            <div className={cn('p-2 rounded-lg h-fit', colorClass)}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{activity.user_name}</span>
              </p>
              <p className="text-sm text-th-text-secondary truncate">
                {activity.description}
              </p>
              <p className="text-xs text-th-text-tertiary mt-1">{formatTimeAgo(activity.timestamp)}</p>
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
