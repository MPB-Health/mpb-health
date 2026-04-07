import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Users, Eye, Circle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useOrg } from '../contexts/OrgContext';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PresenceUser {
  userId: string;
  name: string;
  avatarUrl?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  currentPage?: string;
}

// ---------------------------------------------------------------------------
// PresenceAvatar
// ---------------------------------------------------------------------------

interface PresenceAvatarProps {
  userId: string;
  name: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  avatarUrl?: string;
  size?: 'sm' | 'md';
}

const STATUS_DOT_COLOR: Record<PresenceAvatarProps['status'], string> = {
  online: 'bg-green-500',
  away: 'bg-amber-500',
  busy: 'bg-red-500',
  offline: 'bg-gray-400 dark:bg-gray-600',
};

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
  'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400',
  'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400',
];

function getAvatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] ?? '?').toUpperCase();
}

export function PresenceAvatar({ userId, name, status, avatarUrl, size = 'md' }: PresenceAvatarProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const sizeClasses = size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-8 w-8 text-xs';
  const dotSize = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3';

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className={cn(sizeClasses, 'rounded-full border-2 border-surface-primary object-cover')}
        />
      ) : (
        <div className={cn(
          sizeClasses,
          'rounded-full border-2 border-surface-primary flex items-center justify-center font-semibold',
          getAvatarColor(userId),
        )}>
          {getInitials(name)}
        </div>
      )}

      {/* Status dot */}
      <span className={cn(
        'absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-surface-primary',
        dotSize,
        STATUS_DOT_COLOR[status],
        status === 'online' && 'animate-pulse',
      )} />

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg bg-gray-900 dark:bg-gray-700 text-white text-xs whitespace-nowrap z-50 shadow-lg pointer-events-none">
          <p className="font-semibold">{name}</p>
          <p className="text-gray-300 dark:text-gray-400 capitalize">{status}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45" />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// LivePresenceBar
// ---------------------------------------------------------------------------

interface LivePresenceBarProps {
  entityType: string;
  entityId: string;
}

export function LivePresenceBar({ entityType, entityId }: LivePresenceBarProps) {
  const { user } = useAuth();
  const [viewers, setViewers] = useState<PresenceUser[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Track this user's presence on this entity
  useEffect(() => {
    if (!user?.id) return;

    supabase
      .from('user_presence')
      .update({
        viewing_entity_type: entityType,
        viewing_entity_id: entityId,
        last_seen_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .then(({ error }) => {
        if (error) console.error('[LivePresenceBar] Failed to update presence:', error);
      });

    return () => {
      supabase
        .from('user_presence')
        .update({
          viewing_entity_type: null,
          viewing_entity_id: null,
        })
        .eq('user_id', user.id)
        .then(({ error }) => {
          if (error) console.error('[LivePresenceBar] Failed to clear presence:', error);
        });
    };
  }, [user?.id, entityType, entityId]);

  // Subscribe to presence changes for this entity
  useEffect(() => {
    if (!user?.id) return;

    const loadViewers = async () => {
      const { data, error } = await supabase
        .from('user_presence')
        .select('user_id, status, profiles!user_presence_user_id_fkey(full_name, avatar_url)')
        .eq('viewing_entity_type', entityType)
        .eq('viewing_entity_id', entityId)
        .neq('user_id', user.id);

      if (error) {
        console.error('[LivePresenceBar] Failed to fetch viewers:', error);
        return;
      }

      if (data) {
        setViewers(
          (data as any[]).map((row) => ({
            userId: row.user_id,
            name: row.profiles?.full_name || 'Team Member',
            avatarUrl: row.profiles?.avatar_url || undefined,
            status: (row.status as PresenceUser['status']) || 'online',
          })),
        );
      }
    };

    loadViewers();

    const channel = supabase
      .channel(`presence:${entityType}:${entityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `viewing_entity_type=eq.${entityType}`,
        },
        () => {
          loadViewers();
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, entityType, entityId]);

  if (viewers.length === 0) return null;

  const MAX_VISIBLE = 5;
  const visible = viewers.slice(0, MAX_VISIBLE);
  const overflow = viewers.length - MAX_VISIBLE;

  return (
    <div className="flex items-center gap-2">
      <Eye className="h-3.5 w-3.5 text-th-text-tertiary flex-shrink-0" />
      <div className="flex -space-x-2">
        {visible.map((v) => (
          <PresenceAvatar
            key={v.userId}
            userId={v.userId}
            name={v.name}
            status={v.status}
            avatarUrl={v.avatarUrl}
            size="sm"
          />
        ))}
        {overflow > 0 && (
          <div className="h-7 w-7 rounded-full border-2 border-surface-primary bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[10px] font-semibold text-th-text-secondary">
            +{overflow}
          </div>
        )}
      </div>
      <span className="text-[11px] text-th-text-tertiary">
        {viewers.length === 1 ? '1 viewer' : `${viewers.length} viewing`}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// OnlineTeamList
// ---------------------------------------------------------------------------

const PAGE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/pipeline': 'Pipeline',
  '/leads': 'Leads',
  '/tasks': 'Tasks',
  '/calendar': 'Calendar',
  '/deals': 'Deals',
  '/settings': 'Settings',
  '/reports': 'Reports',
  '/email': 'Email',
};

function derivePage(currentPage: string | undefined): string {
  if (!currentPage) return 'Somewhere';
  for (const [prefix, label] of Object.entries(PAGE_LABELS)) {
    if (currentPage.startsWith(prefix)) return label;
  }
  if (currentPage.startsWith('/leads/')) return 'Viewing Lead';
  if (currentPage.startsWith('/deals/')) return 'Viewing Deal';
  return 'CRM';
}

export function OnlineTeamList() {
  const { user } = useAuth();
  const { activeOrgId } = useOrg();
  const [members, setMembers] = useState<PresenceUser[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const loadOnlineMembers = useCallback(async () => {
    if (!activeOrgId) return;

    const { data, error } = await supabase
      .from('user_presence')
      .select('user_id, status, current_page, profiles!user_presence_user_id_fkey(full_name, avatar_url)')
      .eq('org_id', activeOrgId)
      .in('status', ['online', 'away', 'busy'])
      .neq('user_id', user?.id ?? '');

    if (error) {
      console.error('[OnlineTeamList] Failed to fetch members:', error);
      setLoading(false);
      return;
    }

    if (data) {
      setMembers(
        (data as any[]).map((row) => ({
          userId: row.user_id,
          name: row.profiles?.full_name || 'Team Member',
          avatarUrl: row.profiles?.avatar_url || undefined,
          status: (row.status as PresenceUser['status']) || 'online',
          currentPage: row.current_page,
        })),
      );
    }
    setLoading(false);
  }, [activeOrgId, user?.id]);

  useEffect(() => {
    loadOnlineMembers();

    const channel = supabase
      .channel(`team-presence:${activeOrgId || 'default'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `org_id=eq.${activeOrgId}`,
        },
        () => {
          loadOnlineMembers();
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [loadOnlineMembers, activeOrgId]);

  if (loading) {
    return (
      <div className="p-4 space-y-3 animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-1">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
              <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="p-4 text-center">
        <Users className="h-8 w-8 mx-auto mb-2 text-th-text-tertiary opacity-50" />
        <p className="text-xs text-th-text-secondary">No team members online</p>
      </div>
    );
  }

  const sorted = [...members].sort((a, b) => {
    const order = { online: 0, away: 1, busy: 2, offline: 3 };
    return order[a.status] - order[b.status];
  });

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Circle className="h-2 w-2 fill-green-500 text-green-500" />
        <span className="text-xs font-semibold text-th-text-secondary">
          {members.length} online
        </span>
      </div>
      <div className="space-y-1">
        {sorted.map((member) => (
          <div
            key={member.userId}
            className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface-secondary transition-colors"
          >
            <PresenceAvatar
              userId={member.userId}
              name={member.name}
              status={member.status}
              avatarUrl={member.avatarUrl}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-th-text-primary truncate">{member.name}</p>
              <p className="text-[11px] text-th-text-tertiary truncate">
                {derivePage(member.currentPage)}
              </p>
            </div>
            <span className={cn(
              'text-[10px] capitalize font-medium px-1.5 py-0.5 rounded',
              member.status === 'online' && 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400',
              member.status === 'away' && 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',
              member.status === 'busy' && 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400',
            )}>
              {member.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
