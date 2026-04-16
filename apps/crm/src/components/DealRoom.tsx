import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  Pin,
  Users,
  Send,
  Paperclip,
  Plus,
  X,
  ChevronRight,
  ChevronLeft,
  FileText,
  Mail,
  StickyNote,
  DollarSign,
  Activity,
  Search,
  MoreHorizontal,
  Settings,
  UserPlus,
  Trash2,
  ExternalLink,
  ThumbsUp,
  Heart,
  Flame,
  PartyPopper,
  Clock,
  ArrowDownCircle,
  Loader2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useOrg } from '../contexts/OrgContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

// ============================================================================
// Types
// ============================================================================

type MessageType = 'text' | 'file' | 'system' | 'action';
type ParticipantRole = 'owner' | 'collaborator' | 'viewer';
type PinnedItemType = 'document' | 'quote' | 'email' | 'note';
type ReactionEmoji = '👍' | '❤️' | '🔥' | '🎉';

interface DealRoomMessage {
  id: string;
  room_id: string;
  user_id: string;
  user_name: string;
  user_avatar_url?: string;
  message_type: MessageType;
  content: string;
  file_url?: string;
  file_name?: string;
  action_label?: string;
  action_entity_id?: string;
  reactions: Record<ReactionEmoji, string[]>;
  mentions: string[];
  created_at: string;
}

interface DealRoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_avatar_url?: string;
  role: ParticipantRole;
  is_online: boolean;
  last_seen_at: string;
}

interface PinnedItem {
  id: string;
  room_id: string;
  item_type: PinnedItemType;
  title: string;
  entity_id?: string;
  url?: string;
  pinned_by: string;
  pinned_at: string;
}

interface DealRoomData {
  id: string;
  deal_id: string;
  deal_name: string;
  status: 'active' | 'archived';
  created_at: string;
}

interface DealActivityEntry {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

interface DealRoomProps {
  dealId: string;
  dealName?: string;
}

// ============================================================================
// Constants
// ============================================================================

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

const REACTION_OPTIONS: { emoji: ReactionEmoji; icon: typeof ThumbsUp; label: string }[] = [
  { emoji: '👍', icon: ThumbsUp, label: 'Like' },
  { emoji: '❤️', icon: Heart, label: 'Love' },
  { emoji: '🔥', icon: Flame, label: 'Fire' },
  { emoji: '🎉', icon: PartyPopper, label: 'Celebrate' },
];

const PINNED_ITEM_ICONS: Record<PinnedItemType, typeof FileText> = {
  document: FileText,
  quote: DollarSign,
  email: Mail,
  note: StickyNote,
};

const ROLE_COLORS: Record<ParticipantRole, string> = {
  owner: 'text-amber-600 dark:text-amber-400',
  collaborator: 'text-blue-600 dark:text-blue-400',
  viewer: 'text-th-text-tertiary',
};

const ONLINE_DOTS: Record<string, string> = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  offline: 'bg-gray-400',
};

const AVATAR_GRADIENTS = [
  'from-blue-500 to-cyan-400',
  'from-purple-500 to-pink-400',
  'from-green-500 to-emerald-400',
  'from-orange-500 to-amber-400',
  'from-rose-500 to-red-400',
  'from-teal-500 to-cyan-400',
  'from-indigo-500 to-violet-400',
  'from-fuchsia-500 to-pink-400',
];

const MESSAGES_PAGE_SIZE = 30;

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function getGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// ============================================================================
// Avatar Component
// ============================================================================

function Avatar({ name, userId, size = 'md', avatarUrl }: {
  name: string;
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  avatarUrl?: string;
}) {
  const sizeMap = { sm: 'w-6 h-6 text-[9px]', md: 'w-8 h-8 text-xs', lg: 'w-10 h-10 text-sm' };

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn(sizeMap[size], 'rounded-full object-cover flex-shrink-0')}
      />
    );
  }

  return (
    <div
      className={cn(
        sizeMap[size],
        'rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-white flex-shrink-0',
        getGradient(userId),
      )}
    >
      {getInitials(name)}
    </div>
  );
}

// ============================================================================
// Message Bubble
// ============================================================================

interface MessageBubbleProps {
  message: DealRoomMessage;
  currentUserId: string | undefined;
  onReact: (messageId: string, emoji: ReactionEmoji) => void;
}

function MessageBubble({ message, currentUserId, onReact }: MessageBubbleProps) {
  const [showReactions, setShowReactions] = useState(false);
  const isOwn = message.user_id === currentUserId;

  if (message.message_type === 'system') {
    return (
      <div className="flex items-center gap-2 py-2 px-4">
        <div className="flex-1 h-px bg-th-border-subtle" />
        <div className="flex items-center gap-1.5 text-[11px] text-th-text-tertiary">
          <Activity className="w-3 h-3" />
          <span>{message.content}</span>
        </div>
        <div className="flex-1 h-px bg-th-border-subtle" />
      </div>
    );
  }

  const reactions = message.reactions ?? {};
  const userReactions = new Set(
    Object.entries(reactions).flatMap(([emoji, users]) =>
      users.includes(currentUserId ?? '') ? [emoji] : [],
    ),
  );

  return (
    <div
      className={cn('group flex gap-2.5 px-4 py-1.5 hover:bg-surface-secondary/50 transition-colors', isOwn && 'flex-row-reverse')}
      onMouseEnter={() => setShowReactions(true)}
      onMouseLeave={() => setShowReactions(false)}
    >
      <Avatar name={message.user_name} userId={message.user_id} avatarUrl={message.user_avatar_url} />

      <div className={cn('flex-1 min-w-0', isOwn && 'flex flex-col items-end')}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-th-text-primary">{message.user_name}</span>
          <span className="text-[10px] text-th-text-tertiary">{formatTimestamp(message.created_at)}</span>
        </div>

        <div className={cn(
          'mt-1 rounded-xl px-3 py-2 text-sm max-w-[85%] inline-block',
          isOwn
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-surface-secondary text-th-text-primary rounded-tl-sm',
        )}>
          {message.message_type === 'file' ? (
            <a
              href={message.file_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex items-center gap-2',
                isOwn ? 'text-blue-100 hover:text-white' : 'text-blue-600 dark:text-blue-400 hover:underline',
              )}
            >
              <Paperclip className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{message.file_name || 'Attachment'}</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
          ) : message.message_type === 'action' ? (
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
              <span>{message.content}</span>
              {message.action_label && (
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-full',
                  isOwn ? 'bg-blue-500/30' : 'bg-th-accent-100 dark:bg-th-accent-500/20 text-th-accent-600 dark:text-th-accent-400',
                )}>
                  {message.action_label}
                </span>
              )}
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words">{renderMentions(message.content)}</p>
          )}
        </div>

        {/* Reactions */}
        <div className="flex items-center gap-1 mt-1 flex-wrap">
          {REACTION_OPTIONS.map(({ emoji }) => {
            const count = reactions[emoji]?.length ?? 0;
            if (count === 0 && !showReactions) return null;
            const hasReacted = userReactions.has(emoji);
            return (
              <button
                key={emoji}
                onClick={() => onReact(message.id, emoji)}
                className={cn(
                  'flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-medium transition-all duration-200',
                  hasReacted
                    ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-300 dark:ring-blue-500/40'
                    : 'bg-surface-tertiary text-th-text-tertiary hover:bg-surface-primary hover:text-th-text-secondary',
                  count === 0 && 'opacity-0 group-hover:opacity-100',
                )}
              >
                <span>{emoji}</span>
                {count > 0 && <span>{count}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function renderMentions(content: string): React.ReactNode {
  const parts = content.split(/(@\w+)/g);
  return parts.map((part, i) =>
    part.startsWith('@') ? (
      <span key={i} className="text-blue-400 dark:text-blue-300 font-medium">{part}</span>
    ) : (
      part
    ),
  );
}

// ============================================================================
// Pinned Items Panel
// ============================================================================

interface PinnedPanelProps {
  items: PinnedItem[];
  onPin: (type: PinnedItemType, title: string, entityId?: string, url?: string) => void;
  onUnpin: (itemId: string) => void;
}

function PinnedPanel({ items, onPin, onUnpin }: PinnedPanelProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState<PinnedItemType>('document');
  const [addTitle, setAddTitle] = useState('');
  const [addUrl, setAddUrl] = useState('');

  const handleAdd = () => {
    if (!addTitle.trim()) return;
    onPin(addType, addTitle.trim(), undefined, addUrl.trim() || undefined);
    setAddTitle('');
    setAddUrl('');
    setShowAdd(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-th-border">
        <div className="flex items-center gap-1.5">
          <Pin className="w-3.5 h-3.5 text-th-text-secondary" />
          <span className="text-xs font-semibold text-th-text-primary">Pinned Items</span>
          <span className="text-[10px] text-th-text-tertiary bg-surface-tertiary px-1.5 py-0.5 rounded-full">
            {items.length}
          </span>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="p-1 rounded-md hover:bg-surface-tertiary transition-colors"
        >
          {showAdd ? <X className="w-3.5 h-3.5 text-th-text-tertiary" /> : <Plus className="w-3.5 h-3.5 text-th-text-tertiary" />}
        </button>
      </div>

      {showAdd && (
        <div className="p-3 border-b border-th-border bg-surface-secondary space-y-2">
          <select
            aria-label="Pinned item type"
            value={addType}
            onChange={(e) => setAddType(e.target.value as PinnedItemType)}
            className="block w-full text-xs rounded-lg border border-th-border bg-surface-primary px-2 py-1.5 text-th-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="document">Document</option>
            <option value="quote">Quote</option>
            <option value="email">Email</option>
            <option value="note">Note</option>
          </select>
          <input
            type="text"
            value={addTitle}
            onChange={(e) => setAddTitle(e.target.value)}
            placeholder="Title..."
            className="block w-full text-xs rounded-lg border border-th-border bg-surface-primary px-2 py-1.5 text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <input
            type="text"
            value={addUrl}
            onChange={(e) => setAddUrl(e.target.value)}
            placeholder="URL (optional)..."
            className="block w-full text-xs rounded-lg border border-th-border bg-surface-primary px-2 py-1.5 text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <button
            onClick={handleAdd}
            disabled={!addTitle.trim()}
            className={cn(
              'w-full text-xs font-medium py-1.5 rounded-lg transition-all',
              addTitle.trim()
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-surface-tertiary text-th-text-tertiary cursor-not-allowed',
            )}
          >
            Pin Item
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {items.length === 0 && (
          <p className="text-xs text-th-text-tertiary text-center py-4">No pinned items yet</p>
        )}
        {items.map((item) => {
          const Icon = PINNED_ITEM_ICONS[item.item_type] || FileText;
          return (
            <div
              key={item.id}
              className="group flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-surface-secondary transition-colors"
            >
              <div className="p-1 rounded bg-surface-tertiary flex-shrink-0">
                <Icon className="w-3.5 h-3.5 text-th-text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline truncate block"
                  >
                    {item.title}
                  </a>
                ) : (
                  <span className="text-xs font-medium text-th-text-primary truncate block">
                    {item.title}
                  </span>
                )}
                <span className="text-[10px] text-th-text-tertiary">{formatTimeAgo(item.pinned_at)}</span>
              </div>
              <button
                onClick={() => onUnpin(item.id)}
                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all"
                title="Unpin"
              >
                <Trash2 className="w-3 h-3 text-red-500" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Participants Panel
// ============================================================================

interface ParticipantsPanelProps {
  participants: DealRoomParticipant[];
  currentUserId: string | undefined;
  onAdd: (email: string, role: ParticipantRole) => void;
  onRemove: (participantId: string) => void;
  onRoleChange: (participantId: string, role: ParticipantRole) => void;
}

function ParticipantsPanel({ participants, currentUserId, onAdd, onRemove, onRoleChange }: ParticipantsPanelProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState<ParticipantRole>('collaborator');

  const handleAdd = () => {
    if (!addEmail.trim()) return;
    onAdd(addEmail.trim(), addRole);
    setAddEmail('');
    setShowAdd(false);
  };

  return (
    <div className="border-t border-th-border">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-th-text-secondary" />
          <span className="text-xs font-semibold text-th-text-primary">Participants</span>
          <span className="text-[10px] text-th-text-tertiary bg-surface-tertiary px-1.5 py-0.5 rounded-full">
            {participants.length}
          </span>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="p-1 rounded-md hover:bg-surface-tertiary transition-colors"
        >
          {showAdd ? <X className="w-3.5 h-3.5 text-th-text-tertiary" /> : <UserPlus className="w-3.5 h-3.5 text-th-text-tertiary" />}
        </button>
      </div>

      {showAdd && (
        <div className="px-3 pb-2 space-y-2">
          <input
            type="email"
            value={addEmail}
            onChange={(e) => setAddEmail(e.target.value)}
            placeholder="Enter email..."
            className="block w-full text-xs rounded-lg border border-th-border bg-surface-primary px-2 py-1.5 text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <div className="flex gap-2">
            <select
              aria-label="Participant role"
              value={addRole}
              onChange={(e) => setAddRole(e.target.value as ParticipantRole)}
              className="flex-1 text-xs rounded-lg border border-th-border bg-surface-primary px-2 py-1.5 text-th-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="collaborator">Collaborator</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              onClick={handleAdd}
              disabled={!addEmail.trim()}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                addEmail.trim()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-surface-tertiary text-th-text-tertiary cursor-not-allowed',
              )}
            >
              Add
            </button>
          </div>
        </div>
      )}

      <div className="px-2 pb-2 space-y-0.5">
        {participants.map((p) => {
          const onlineStatus = p.is_online ? 'online' : 'offline';
          return (
            <div key={p.id} className="group flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-secondary transition-colors">
              <div className="relative flex-shrink-0">
                <Avatar name={p.user_name} userId={p.user_id} size="sm" avatarUrl={p.user_avatar_url} />
                <div className={cn('absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface-primary', ONLINE_DOTS[onlineStatus])} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-th-text-primary truncate block">{p.user_name}</span>
                <span className={cn('text-[10px] capitalize', ROLE_COLORS[p.role])}>{p.role}</span>
              </div>
              {p.user_id !== currentUserId && (
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <select
                    aria-label={`Change role for ${p.user_name}`}
                    value={p.role}
                    onChange={(e) => onRoleChange(p.id, e.target.value as ParticipantRole)}
                    className="text-[10px] rounded border border-th-border bg-surface-primary px-1 py-0.5 text-th-text-secondary focus:outline-none"
                  >
                    <option value="collaborator">Collaborator</option>
                    <option value="viewer">Viewer</option>
                    <option value="owner">Owner</option>
                  </select>
                  <button
                    onClick={() => onRemove(p.id)}
                    className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                    title="Remove"
                  >
                    <X className="w-3 h-3 text-red-500" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Activity Summary Panel
// ============================================================================

function ActivitySummary({ activities, winProbability }: {
  activities: DealActivityEntry[];
  winProbability?: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-t border-th-border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-3 py-2 hover:bg-surface-secondary transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-th-text-secondary" />
          <span className="text-xs font-semibold text-th-text-primary">Activity</span>
        </div>
        {expanded ? (
          <ChevronLeft className="w-3.5 h-3.5 text-th-text-tertiary rotate-90" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-th-text-tertiary rotate-90" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {winProbability !== undefined && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-secondary">
              <div className="flex-1">
                <span className="text-[10px] text-th-text-tertiary">Win Probability</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex-1 h-1.5 rounded-full bg-surface-tertiary overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        winProbability >= 70
                          ? 'bg-green-500'
                          : winProbability >= 40
                            ? 'bg-amber-500'
                            : 'bg-red-500',
                      )}
                      style={{ width: `${winProbability}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-th-text-primary">{winProbability}%</span>
                </div>
              </div>
            </div>
          )}

          {activities.length === 0 ? (
            <p className="text-xs text-th-text-tertiary text-center py-2">No recent activity</p>
          ) : (
            activities.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-th-border mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-th-text-secondary">{a.description}</p>
                  <span className="text-[10px] text-th-text-tertiary">{formatTimeAgo(a.timestamp)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Create Room View
// ============================================================================

function CreateRoomPrompt({ dealName, onCreate }: { dealName: string; onCreate: () => void }) {
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await onCreate();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-surface-primary p-8">
      <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center mb-4">
        <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400" />
      </div>
      <h3 className="text-lg font-semibold text-th-text-primary mb-1">
        Create Deal Room
      </h3>
      <p className="text-sm text-th-text-secondary text-center max-w-sm mb-6">
        Start a collaborative space for <span className="font-medium text-th-text-primary">{dealName}</span>.
        Share files, discuss strategy, and track progress with your team.
      </p>
      <button
        onClick={handleCreate}
        disabled={creating}
        className={cn(
          'flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all',
          creating
            ? 'bg-surface-tertiary text-th-text-tertiary cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
        )}
      >
        {creating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
        {creating ? 'Creating...' : 'Create Deal Room'}
      </button>
    </div>
  );
}

// ============================================================================
// Main DealRoom Component
// ============================================================================

export function DealRoom({ dealId, dealName }: DealRoomProps) {
  const { activeOrgId } = useOrg();
  const { user } = useAuth();

  const [room, setRoom] = useState<DealRoomData | null>(null);
  const [roomLoading, setRoomLoading] = useState(true);
  const [roomNotFound, setRoomNotFound] = useState(false);

  const [messages, setMessages] = useState<DealRoomMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  const [participants, setParticipants] = useState<DealRoomParticipant[]>([]);
  const [pinnedItems, setPinnedItems] = useState<PinnedItem[]>([]);
  const [activities, setActivities] = useState<DealActivityEntry[]>([]);
  const [winProbability, setWinProbability] = useState<number | undefined>();

  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mentionSearch, setMentionSearch] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<DealRoomParticipant[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const displayName = room?.deal_name || dealName || 'Deal Room';

  // ---- Load room ----
  useEffect(() => {
    if (!dealId || !activeOrgId) return;

    const loadRoom = async () => {
      setRoomLoading(true);
      try {
        const { data, error } = await supabase
          .from('crm_deal_rooms')
          .select('id, deal_id, deal_name, status, created_at')
          .eq('deal_id', dealId)
          .eq('org_id', activeOrgId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setRoom(data as unknown as DealRoomData);
          setRoomNotFound(false);
        } else {
          setRoomNotFound(true);
        }
      } catch (err) {
        console.error('Failed to load deal room:', err);
        toast.error('Failed to load deal room');
      } finally {
        setRoomLoading(false);
      }
    };

    loadRoom();
  }, [dealId, activeOrgId]);

  // ---- Load room data when room is available ----
  useEffect(() => {
    if (!room) return;

    const loadAll = async () => {
      await Promise.all([
        loadMessages(true),
        loadParticipants(),
        loadPinnedItems(),
        loadActivities(),
      ]);
    };

    loadAll();
  }, [room?.id]);

  // ---- Realtime subscription ----
  useEffect(() => {
    if (!room) return;

    const channel = supabase
      .channel(`deal-room-${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'crm_deal_room_messages',
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          const newMsg = payload.new as unknown as DealRoomMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          scrollToBottom();
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'crm_deal_room_messages',
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          const updated = payload.new as unknown as DealRoomMessage;
          setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crm_deal_room_participants',
          filter: `room_id=eq.${room.id}`,
        },
        () => { loadParticipants(); },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [room?.id]);

  // ---- Data loaders ----
  const loadMessages = useCallback(async (initial = false) => {
    if (!room) return;
    setMessagesLoading(true);
    try {
      const offset = initial ? 0 : messages.length;
      const { data, error } = await supabase
        .from('crm_deal_room_messages')
        .select('id, room_id, user_id, user_name, user_avatar_url, message_type, content, file_url, file_name, action_label, action_entity_id, reactions, mentions, created_at')
        .eq('room_id', room.id)
        .order('created_at', { ascending: true })
        .range(offset > 0 ? 0 : 0, offset > 0 ? offset + MESSAGES_PAGE_SIZE - 1 : MESSAGES_PAGE_SIZE - 1);

      if (error) throw error;

      const msgs = (data || []) as unknown as DealRoomMessage[];

      if (initial) {
        setMessages(msgs);
        setHasMoreMessages(msgs.length >= MESSAGES_PAGE_SIZE);
        setTimeout(scrollToBottom, 100);
      } else {
        setMessages(msgs);
        setHasMoreMessages(msgs.length >= messages.length + MESSAGES_PAGE_SIZE);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  }, [room, messages.length]);

  const loadOlderMessages = useCallback(async () => {
    if (!room || !hasMoreMessages || messagesLoading) return;
    setMessagesLoading(true);
    try {
      const oldestMsg = messages[0];
      if (!oldestMsg) return;

      const { data, error } = await supabase
        .from('crm_deal_room_messages')
        .select('id, room_id, user_id, user_name, user_avatar_url, message_type, content, file_url, file_name, action_label, action_entity_id, reactions, mentions, created_at')
        .eq('room_id', room.id)
        .lt('created_at', oldestMsg.created_at)
        .order('created_at', { ascending: false })
        .limit(MESSAGES_PAGE_SIZE);

      if (error) throw error;

      const older = ((data || []) as unknown as DealRoomMessage[]).reverse();
      setMessages((prev) => [...older, ...prev]);
      setHasMoreMessages(older.length >= MESSAGES_PAGE_SIZE);
    } catch (err) {
      console.error('Failed to load older messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  }, [room, messages, hasMoreMessages, messagesLoading]);

  const loadParticipants = useCallback(async () => {
    if (!room) return;
    try {
      const { data, error } = await supabase
        .from('crm_deal_room_participants')
        .select('id, room_id, user_id, user_name, user_email, user_avatar_url, role, is_online, last_seen_at')
        .eq('room_id', room.id)
        .order('role', { ascending: true });

      if (error) throw error;
      setParticipants((data || []) as unknown as DealRoomParticipant[]);
    } catch (err) {
      console.error('Failed to load participants:', err);
    }
  }, [room]);

  const loadPinnedItems = useCallback(async () => {
    if (!room) return;
    try {
      const { data, error } = await supabase
        .from('crm_deal_room_pinned_items')
        .select('id, room_id, item_type, title, entity_id, url, pinned_by, pinned_at')
        .eq('room_id', room.id)
        .order('pinned_at', { ascending: false });

      if (error) throw error;
      setPinnedItems((data || []) as unknown as PinnedItem[]);
    } catch (err) {
      console.error('Failed to load pinned items:', err);
    }
  }, [room]);

  const loadActivities = useCallback(async () => {
    if (!room) return;
    try {
      const { data: dealData } = await supabase
        .from('crm_deals')
        .select('win_probability')
        .eq('id', dealId)
        .single();

      if (dealData) {
        setWinProbability((dealData as Record<string, unknown>).win_probability as number | undefined);
      }

      const { data, error } = await supabase
        .from('crm_activities')
        .select('id, type, description, created_at')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setActivities(
        (data || []).map((a: Record<string, unknown>) => ({
          id: a.id as string,
          type: a.type as string,
          description: a.description as string,
          timestamp: a.created_at as string,
        })),
      );
    } catch (err) {
      console.error('Failed to load activities:', err);
    }
  }, [room, dealId]);

  // ---- Actions ----
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !room || !user || sending) return;

    const content = messageInput.trim();
    setMessageInput('');
    setSending(true);

    try {
      const mentions = Array.from(content.matchAll(/@(\w+)/g)).map((m) => m[1]);

      const { error } = await supabase.from('crm_deal_room_messages').insert({
        room_id: room.id,
        user_id: user.id,
        user_name: user.user_metadata?.full_name || user.email || 'Unknown',
        user_avatar_url: user.user_metadata?.avatar_url || null,
        message_type: 'text',
        content,
        reactions: {},
        mentions,
      });

      if (error) throw error;
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error('Failed to send message');
      setMessageInput(content);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleReaction = async (messageId: string, emoji: ReactionEmoji) => {
    if (!user) return;

    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;

    const currentReactions = { ...msg.reactions };
    const users = currentReactions[emoji] || [];
    const idx = users.indexOf(user.id);

    if (idx >= 0) {
      users.splice(idx, 1);
    } else {
      users.push(user.id);
    }
    currentReactions[emoji] = users;

    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, reactions: currentReactions } : m)),
    );

    try {
      const { error } = await supabase
        .from('crm_deal_room_messages')
        .update({ reactions: currentReactions })
        .eq('id', messageId);

      if (error) throw error;
    } catch (err) {
      console.error('Failed to update reaction:', err);
    }
  };

  const handleCreateRoom = async () => {
    if (!activeOrgId || !user) return;

    try {
      const { data, error } = await supabase
        .from('crm_deal_rooms')
        .insert({
          deal_id: dealId,
          deal_name: dealName || 'Deal Room',
          org_id: activeOrgId,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('crm_deal_room_participants').insert({
        room_id: (data as Record<string, unknown>).id,
        user_id: user.id,
        user_name: user.user_metadata?.full_name || user.email || 'Unknown',
        user_email: user.email || '',
        role: 'owner',
        is_online: true,
        last_seen_at: new Date().toISOString(),
      });

      await supabase.from('crm_deal_room_messages').insert({
        room_id: (data as Record<string, unknown>).id,
        user_id: user.id,
        user_name: 'System',
        message_type: 'system',
        content: `Deal room created by ${user.user_metadata?.full_name || user.email}`,
        reactions: {},
        mentions: [],
      });

      setRoom(data as unknown as DealRoomData);
      setRoomNotFound(false);
      toast.success('Deal room created');
    } catch (err) {
      console.error('Failed to create deal room:', err);
      toast.error('Failed to create deal room');
    }
  };

  const handlePinItem = async (type: PinnedItemType, title: string, entityId?: string, url?: string) => {
    if (!room || !user) return;

    try {
      const { error } = await supabase.from('crm_deal_room_pinned_items').insert({
        room_id: room.id,
        item_type: type,
        title,
        entity_id: entityId || null,
        url: url || null,
        pinned_by: user.id,
        pinned_at: new Date().toISOString(),
      });

      if (error) throw error;
      await loadPinnedItems();
      toast.success('Item pinned');
    } catch (err) {
      console.error('Failed to pin item:', err);
      toast.error('Failed to pin item');
    }
  };

  const handleUnpinItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('crm_deal_room_pinned_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      setPinnedItems((prev) => prev.filter((i) => i.id !== itemId));
      toast.success('Item unpinned');
    } catch (err) {
      console.error('Failed to unpin item:', err);
      toast.error('Failed to unpin item');
    }
  };

  const handleAddParticipant = async (email: string, role: ParticipantRole) => {
    if (!room) return;

    try {
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        toast.error('User not found');
        return;
      }

      const profile = userData as Record<string, unknown>;

      const { error } = await supabase.from('crm_deal_room_participants').insert({
        room_id: room.id,
        user_id: profile.id,
        user_name: (profile.full_name as string) || (profile.email as string) || email,
        user_email: (profile.email as string) || email,
        user_avatar_url: profile.avatar_url || null,
        role,
        is_online: false,
        last_seen_at: new Date().toISOString(),
      });

      if (error) throw error;
      await loadParticipants();
      toast.success('Participant added');
    } catch (err) {
      console.error('Failed to add participant:', err);
      toast.error('Failed to add participant');
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    try {
      const { error } = await supabase
        .from('crm_deal_room_participants')
        .delete()
        .eq('id', participantId);

      if (error) throw error;
      setParticipants((prev) => prev.filter((p) => p.id !== participantId));
      toast.success('Participant removed');
    } catch (err) {
      console.error('Failed to remove participant:', err);
      toast.error('Failed to remove participant');
    }
  };

  const handleRoleChange = async (participantId: string, role: ParticipantRole) => {
    try {
      const { error } = await supabase
        .from('crm_deal_room_participants')
        .update({ role })
        .eq('id', participantId);

      if (error) throw error;
      setParticipants((prev) =>
        prev.map((p) => (p.id === participantId ? { ...p, role } : p)),
      );
    } catch (err) {
      console.error('Failed to update role:', err);
      toast.error('Failed to update role');
    }
  };

  // @mention handling in input
  const handleInputChange = (value: string) => {
    setMessageInput(value);

    const cursorPos = inputRef.current?.selectionStart ?? value.length;
    const textBeforeCursor = value.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const search = mentionMatch[1].toLowerCase();
      setMentionSearch(search);
      setMentionResults(
        participants.filter((p) => p.user_name.toLowerCase().includes(search)).slice(0, 5),
      );
    } else {
      setMentionSearch(null);
      setMentionResults([]);
    }
  };

  const handleMentionSelect = (participant: DealRoomParticipant) => {
    const cursorPos = inputRef.current?.selectionStart ?? messageInput.length;
    const textBeforeCursor = messageInput.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const beforeMention = textBeforeCursor.slice(0, mentionMatch.index);
      const afterCursor = messageInput.slice(cursorPos);
      const mentionText = `@${participant.user_name.replace(/\s/g, '')} `;
      setMessageInput(beforeMention + mentionText + afterCursor);
    }

    setMentionSearch(null);
    setMentionResults([]);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (mentionResults.length > 0 && mentionSearch !== null) {
        handleMentionSelect(mentionResults[0]);
      } else {
        handleSendMessage();
      }
    }
  };

  // ---- Render ----
  if (roomLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-surface-primary">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  if (roomNotFound) {
    return <CreateRoomPrompt dealName={displayName} onCreate={handleCreateRoom} />;
  }

  if (!room) return null;

  const onlineCount = participants.filter((p) => p.is_online).length;
  const displayParticipants = participants.slice(0, 5);
  const overflowCount = Math.max(0, participants.length - 5);

  return (
    <div className="flex flex-col h-full bg-surface-primary">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-th-border bg-surface-secondary">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-th-text-primary truncate">
              Deal Room: {displayName}
            </h2>
            <span className={cn(
              'text-[10px] font-medium px-2 py-0.5 rounded-full',
              room.status === 'active'
                ? 'bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-500/15 text-gray-600 dark:text-gray-400',
            )}>
              {room.status === 'active' ? 'Active' : 'Archived'}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex -space-x-1.5">
              {displayParticipants.map((p) => (
                <Avatar key={p.id} name={p.user_name} userId={p.user_id} size="sm" avatarUrl={p.user_avatar_url} />
              ))}
              {overflowCount > 0 && (
                <div className="w-6 h-6 rounded-full bg-surface-tertiary border-2 border-surface-secondary flex items-center justify-center text-[9px] font-bold text-th-text-secondary">
                  +{overflowCount}
                </div>
              )}
            </div>
            <span className="text-[10px] text-th-text-tertiary">
              {participants.length} participant{participants.length !== 1 ? 's' : ''}
              {onlineCount > 0 && ` · ${onlineCount} online`}
            </span>
          </div>
        </div>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={cn(
            'p-2 rounded-lg transition-colors',
            sidebarOpen
              ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
              : 'hover:bg-surface-tertiary text-th-text-secondary',
          )}
          title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto">
            {/* Load more */}
            {hasMoreMessages && (
              <div className="flex justify-center py-3">
                <button
                  onClick={loadOlderMessages}
                  disabled={messagesLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-th-text-secondary hover:bg-surface-secondary transition-colors"
                >
                  {messagesLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <ArrowDownCircle className="w-3 h-3 rotate-180" />
                  )}
                  Load earlier messages
                </button>
              </div>
            )}

            {/* Message list */}
            <div className="py-2">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  currentUserId={user?.id}
                  onReact={handleReaction}
                />
              ))}
            </div>

            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <div className="border-t border-th-border bg-surface-secondary p-3">
            {/* Mention dropdown */}
            {mentionSearch !== null && mentionResults.length > 0 && (
              <div className="mb-2 bg-surface-primary border border-th-border rounded-xl shadow-lg p-1 max-h-40 overflow-y-auto">
                {mentionResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleMentionSelect(p)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-th-text-primary hover:bg-surface-secondary rounded-lg transition-colors"
                  >
                    <Avatar name={p.user_name} userId={p.user_id} size="sm" avatarUrl={p.user_avatar_url} />
                    <span className="font-medium">{p.user_name}</span>
                    <span className="text-xs text-th-text-tertiary">{p.role}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2">
              <button
                className="p-2 rounded-lg hover:bg-surface-tertiary transition-colors text-th-text-tertiary"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={messageInput}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message... (@ to mention)"
                  rows={1}
                  className="block w-full text-sm rounded-xl border border-th-border bg-surface-primary px-3 py-2 text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none max-h-32 overflow-y-auto"
                  style={{ minHeight: '38px' }}
                />
              </div>

              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || sending}
                className={cn(
                  'p-2 rounded-xl transition-all',
                  messageInput.trim() && !sending
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                    : 'bg-surface-tertiary text-th-text-tertiary cursor-not-allowed',
                )}
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        {sidebarOpen && (
          <div className="w-[280px] border-l border-th-border bg-surface-primary flex flex-col overflow-y-auto">
            <PinnedPanel
              items={pinnedItems}
              onPin={handlePinItem}
              onUnpin={handleUnpinItem}
            />

            <ParticipantsPanel
              participants={participants}
              currentUserId={user?.id}
              onAdd={handleAddParticipant}
              onRemove={handleRemoveParticipant}
              onRoleChange={handleRoleChange}
            />

            <ActivitySummary
              activities={activities}
              winProbability={winProbability}
            />
          </div>
        )}
      </div>
    </div>
  );
}
