import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { AtSign, MessageSquare, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useOrg } from '../contexts/OrgContext';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OrgMember {
  id: string;
  full_name: string;
  avatar_url?: string;
  role?: string;
}

interface Mention {
  id: string;
  mentioned_user_id: string;
  mentioner_user_id: string;
  mentioner_name: string;
  mentioner_avatar_url?: string;
  entity_type: string;
  entity_id: string;
  entity_label?: string;
  context_text?: string;
  read: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MENTION_REGEX = /@\[([^\]]+)\]\(([^)]+)\)/g;
const TRIGGER_REGEX = /@(\w*)$/;

function extractMentionIds(text: string): string[] {
  const ids: string[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(MENTION_REGEX.source, 'g');
  while ((match = re.exec(text)) !== null) {
    ids.push(match[2]);
  }
  return ids;
}

function renderMentionText(text: string): string {
  return text.replace(MENTION_REGEX, '@$1');
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] ?? '?').toUpperCase();
}

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
  'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400',
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ---------------------------------------------------------------------------
// useMentions hook
// ---------------------------------------------------------------------------

export function useMentions(entityType: string, entityId: string) {
  const { user } = useAuth();
  const { activeOrgId } = useOrg();
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMentions = useCallback(async () => {
    if (!entityType || !entityId) return;

    const { data, error } = await supabase
      .from('crm_mentions')
      .select(`
        id, mentioned_user_id, mentioner_user_id, entity_type, entity_id,
        entity_label, context_text, read, created_at,
        mentioner:profiles!crm_mentions_mentioner_user_id_fkey(full_name, avatar_url)
      `)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[useMentions] Failed to load mentions:', error);
      setLoading(false);
      return;
    }

    if (data) {
      setMentions(
        (data as any[]).map((row) => ({
          id: row.id,
          mentioned_user_id: row.mentioned_user_id,
          mentioner_user_id: row.mentioner_user_id,
          mentioner_name: row.mentioner?.full_name || 'Someone',
          mentioner_avatar_url: row.mentioner?.avatar_url || undefined,
          entity_type: row.entity_type,
          entity_id: row.entity_id,
          entity_label: row.entity_label,
          context_text: row.context_text,
          read: row.read,
          created_at: row.created_at,
        })),
      );
    }
    setLoading(false);
  }, [entityType, entityId]);

  useEffect(() => {
    loadMentions();
  }, [loadMentions]);

  const addMention = useCallback(
    async (mentionedUserId: string, contextText?: string, entityLabel?: string) => {
      if (!user?.id || !activeOrgId) return;

      const { error } = await supabase.from('crm_mentions').insert({
        org_id: activeOrgId,
        mentioned_user_id: mentionedUserId,
        mentioner_user_id: user.id,
        entity_type: entityType,
        entity_id: entityId,
        entity_label: entityLabel,
        context_text: contextText,
        read: false,
      });

      if (error) {
        console.error('[useMentions] Failed to add mention:', error);
      } else {
        await loadMentions();
      }
    },
    [user?.id, activeOrgId, entityType, entityId, loadMentions],
  );

  return { mentions, loading, addMention, refreshMentions: loadMentions };
}

// ---------------------------------------------------------------------------
// MentionInput
// ---------------------------------------------------------------------------

interface MentionInputProps {
  value: string;
  onChange: (value: string, mentions: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MentionInput({ value, onChange, placeholder, className }: MentionInputProps) {
  const { activeOrgId } = useOrg();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [members, setMembers] = useState<OrgMember[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPos, setCursorPos] = useState(0);

  // Fetch org members once
  useEffect(() => {
    if (!activeOrgId) return;

    const fetchMembers = async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url');

      if (!profiles) return;

      const { data: memberships } = await supabase
        .from('org_memberships')
        .select('user_id, role')
        .eq('org_id', activeOrgId)
        .in('user_id', profiles.map((p) => p.id));

      const roleMap = new Map(memberships?.map((m) => [m.user_id, m.role]) ?? []);

      setMembers(
        profiles.map((p) => ({
          id: p.id,
          full_name: p.full_name || 'Team Member',
          avatar_url: p.avatar_url || undefined,
          role: (roleMap.get(p.id) || 'member').replace(/^\w/, (c: string) => c.toUpperCase()),
        })),
      );
    };

    fetchMembers();
  }, [activeOrgId]);

  const filteredMembers = useMemo(() => {
    if (!filterText) return members;
    const lower = filterText.toLowerCase();
    return members.filter((m) => m.full_name.toLowerCase().includes(lower));
  }, [members, filterText]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const pos = e.target.selectionStart ?? 0;
      setCursorPos(pos);

      const textBeforeCursor = newValue.slice(0, pos);
      const triggerMatch = textBeforeCursor.match(TRIGGER_REGEX);

      if (triggerMatch) {
        setFilterText(triggerMatch[1] || '');
        setShowDropdown(true);
        setSelectedIndex(0);
      } else {
        setShowDropdown(false);
        setFilterText('');
      }

      const mentionIds = extractMentionIds(newValue);
      onChange(newValue, mentionIds);
    },
    [onChange],
  );

  const insertMention = useCallback(
    (member: OrgMember) => {
      if (!textareaRef.current) return;

      const textBeforeCursor = value.slice(0, cursorPos);
      const textAfterCursor = value.slice(cursorPos);
      const triggerMatch = textBeforeCursor.match(TRIGGER_REGEX);

      if (!triggerMatch) return;

      const beforeTrigger = textBeforeCursor.slice(0, triggerMatch.index);
      const mention = `@[${member.full_name}](${member.id})`;
      const newValue = beforeTrigger + mention + ' ' + textAfterCursor;
      const mentionIds = extractMentionIds(newValue);

      onChange(newValue, mentionIds);
      setShowDropdown(false);
      setFilterText('');

      requestAnimationFrame(() => {
        if (textareaRef.current) {
          const newPos = (beforeTrigger + mention + ' ').length;
          textareaRef.current.selectionStart = newPos;
          textareaRef.current.selectionEnd = newPos;
          textareaRef.current.focus();
        }
      });
    },
    [value, cursorPos, onChange],
  );

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
      if (!showDropdown || filteredMembers.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredMembers.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredMembers[selectedIndex]);
      } else if (e.key === 'Escape') {
        setShowDropdown(false);
      }
    },
    [showDropdown, filteredMembers, selectedIndex, insertMention],
  );

  // Click outside to close dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displayValue = useMemo(() => renderMentionText(value), [value]);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={displayValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || 'Type @ to mention someone…'}
        rows={3}
        className={cn(
          'w-full px-3 py-2 rounded-lg border border-th-border bg-white dark:bg-gray-900',
          'text-sm text-th-text-primary placeholder:text-th-text-tertiary',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500',
          'resize-none transition-colors',
          className,
        )}
      />

      {/* Mention dropdown */}
      {showDropdown && filteredMembers.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-th-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto"
        >
          {filteredMembers.map((member, index) => (
            <button
              key={member.id}
              onClick={() => insertMention(member)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
                index === selectedIndex
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
              )}
            >
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt={member.full_name}
                  className="h-7 w-7 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className={cn(
                  'h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0',
                  getAvatarColor(member.id),
                )}>
                  {getInitials(member.full_name)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-th-text-primary truncate">{member.full_name}</p>
                {member.role && (
                  <p className="text-[11px] text-th-text-tertiary">{member.role}</p>
                )}
              </div>
              <AtSign className="h-3.5 w-3.5 text-th-text-tertiary flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {showDropdown && filteredMembers.length === 0 && filterText && (
        <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-th-border rounded-lg shadow-lg z-50 p-3 text-center">
          <p className="text-xs text-th-text-secondary">No members matching "{filterText}"</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MentionNotifications
// ---------------------------------------------------------------------------

export function MentionNotifications() {
  const { user } = useAuth();
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const loadMentions = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('crm_mentions')
      .select(`
        id, mentioned_user_id, mentioner_user_id, entity_type, entity_id,
        entity_label, context_text, read, created_at,
        mentioner:profiles!crm_mentions_mentioner_user_id_fkey(full_name, avatar_url)
      `)
      .eq('mentioned_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('[MentionNotifications] Failed to load:', error);
      return;
    }

    if (data) {
      const mapped: Mention[] = (data as any[]).map((row) => ({
        id: row.id,
        mentioned_user_id: row.mentioned_user_id,
        mentioner_user_id: row.mentioner_user_id,
        mentioner_name: row.mentioner?.full_name || 'Someone',
        mentioner_avatar_url: row.mentioner?.avatar_url || undefined,
        entity_type: row.entity_type,
        entity_id: row.entity_id,
        entity_label: row.entity_label,
        context_text: row.context_text,
        read: row.read,
        created_at: row.created_at,
      }));
      setMentions(mapped);
      setUnreadCount(mapped.filter((m) => !m.read).length);
    }
  }, [user?.id]);

  useEffect(() => {
    loadMentions();

    if (!user?.id) return;

    const channel = supabase
      .channel(`mentions:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'crm_mentions',
          filter: `mentioned_user_id=eq.${user.id}`,
        },
        () => {
          loadMentions();
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
  }, [loadMentions, user?.id]);

  const markAsRead = useCallback(async (mentionId: string) => {
    const { error } = await supabase
      .from('crm_mentions')
      .update({ read: true })
      .eq('id', mentionId);

    if (!error) {
      setMentions((prev) =>
        prev.map((m) => (m.id === mentionId ? { ...m, read: true } : m)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    const unreadIds = mentions.filter((m) => !m.read).map((m) => m.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from('crm_mentions')
      .update({ read: true })
      .in('id', unreadIds);

    if (!error) {
      setMentions((prev) => prev.map((m) => ({ ...m, read: true })));
      setUnreadCount(0);
    }
  }, [user?.id, mentions]);

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function getEntityLink(entityType: string, entityId: string): string {
    switch (entityType) {
      case 'lead': return `/leads/${entityId}`;
      case 'deal': return `/deals/${entityId}`;
      case 'task': return `/tasks`;
      case 'note': return `/leads/${entityId}`;
      default: return `/leads/${entityId}`;
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button with badge */}
      <button
        onClick={() => setShowDropdown((v) => !v)}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          showDropdown
            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
            : 'text-th-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800',
        )}
        aria-label="Mention notifications"
      >
        <AtSign className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-th-border rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-th-border">
            <div className="flex items-center gap-2">
              <AtSign className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-semibold text-th-text-primary">Mentions</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Mention list */}
          <div className="max-h-80 overflow-y-auto">
            {mentions.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-th-text-tertiary opacity-50" />
                <p className="text-xs text-th-text-secondary">No mentions yet</p>
              </div>
            ) : (
              mentions.map((mention) => (
                <a
                  key={mention.id}
                  href={getEntityLink(mention.entity_type, mention.entity_id)}
                  onClick={() => {
                    if (!mention.read) markAsRead(mention.id);
                    setShowDropdown(false);
                  }}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 transition-colors border-b border-th-border last:border-b-0',
                    !mention.read
                      ? 'bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
                  )}
                >
                  {/* Avatar */}
                  {mention.mentioner_avatar_url ? (
                    <img
                      src={mention.mentioner_avatar_url}
                      alt={mention.mentioner_name}
                      className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0',
                      getAvatarColor(mention.mentioner_user_id),
                    )}>
                      {getInitials(mention.mentioner_name)}
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-th-text-primary">
                      <span className="font-semibold">{mention.mentioner_name}</span>
                      <span className="text-th-text-secondary"> mentioned you</span>
                      {mention.entity_label && (
                        <span className="text-th-text-secondary"> in {mention.entity_label}</span>
                      )}
                    </p>
                    {mention.context_text && (
                      <p className="text-xs text-th-text-tertiary mt-0.5 truncate">
                        "{mention.context_text}"
                      </p>
                    )}
                    <p className="text-[10px] text-th-text-tertiary mt-1">
                      {formatTimeAgo(mention.created_at)}
                    </p>
                  </div>

                  {/* Indicators */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
                    {!mention.read && (
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                    )}
                    <ExternalLink className="h-3 w-3 text-th-text-tertiary" />
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
