import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Trophy,
  Star,
  Flame,
  Target,
  TrendingUp,
  ThumbsUp,
  PartyPopper,
  Send,
  Plus,
  X,
} from 'lucide-react';
import { useOrg } from '../../../contexts/OrgContext';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import {
  createGamificationService,
  type WinFeedItem,
} from '@mpbhealth/crm-core/gamification';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

// ============================================================================
// Constants
// ============================================================================

type WinType = 'deal_closed' | 'achievement' | 'streak' | 'milestone' | 'stage_won';

const WIN_TYPE_CONFIG: Record<
  WinType,
  { icon: typeof Trophy; color: string; border: string; bg: string }
> = {
  deal_closed: {
    icon: Trophy,
    color: 'text-amber-600 dark:text-amber-400',
    border: 'border-l-amber-500',
    bg: 'bg-amber-100 dark:bg-amber-500/15',
  },
  achievement: {
    icon: Star,
    color: 'text-purple-600 dark:text-purple-400',
    border: 'border-l-purple-500',
    bg: 'bg-purple-100 dark:bg-purple-500/15',
  },
  streak: {
    icon: Flame,
    color: 'text-orange-600 dark:text-orange-400',
    border: 'border-l-orange-500',
    bg: 'bg-orange-100 dark:bg-orange-500/15',
  },
  milestone: {
    icon: Target,
    color: 'text-blue-600 dark:text-blue-400',
    border: 'border-l-blue-500',
    bg: 'bg-blue-100 dark:bg-blue-500/15',
  },
  stage_won: {
    icon: TrendingUp,
    color: 'text-green-600 dark:text-green-400',
    border: 'border-l-green-500',
    bg: 'bg-green-100 dark:bg-green-500/15',
  },
};

type ReactionEmoji = '👍' | '🔥' | '🎉';

const REACTION_OPTIONS: { emoji: ReactionEmoji; icon: typeof ThumbsUp; label: string }[] = [
  { emoji: '👍', icon: ThumbsUp, label: 'Like' },
  { emoji: '🔥', icon: Flame, label: 'Fire' },
  { emoji: '🎉', icon: PartyPopper, label: 'Celebrate' },
];

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

const MAX_ITEMS = 15;
const POLL_INTERVAL_MS = 60_000;

// ============================================================================
// Helpers
// ============================================================================

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function getGradient(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function formatTimeAgo(timestamp: string): string {
  const now = Date.now();
  const date = new Date(timestamp).getTime();
  const diff = now - date;
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}

function formatValue(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

// ============================================================================
// Win Card
// ============================================================================

interface WinCardProps {
  item: WinFeedItem;
  currentUserId: string | undefined;
  onReact: (winId: string, emoji: ReactionEmoji) => void;
  isNew: boolean;
}

function WinCard({ item, currentUserId, onReact, isNew }: WinCardProps) {
  const config = WIN_TYPE_CONFIG[item.win_type as WinType] || WIN_TYPE_CONFIG.deal_closed;
  const Icon = config.icon;

  const reactions = (item.reactions ?? {}) as Record<ReactionEmoji, string[]>;
  const userReactions = new Set(
    Object.entries(reactions).flatMap(([emoji, users]) =>
      users.includes(currentUserId ?? '') ? [emoji] : []
    )
  );

  return (
    <div
      className={cn(
        'border-l-[3px] rounded-lg p-3 transition-all duration-500',
        config.border,
        'bg-surface-secondary hover:bg-surface-tertiary/60',
        isNew && 'animate-slide-in-top',
      )}
    >
      <div className="flex gap-2.5">
        <div
          className={cn(
            'w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-xs font-bold text-white flex-shrink-0',
            getGradient(item.user_id),
          )}
        >
          {getInitials(item.user?.full_name ?? 'Team member')}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-th-text-primary truncate">
                  {item.user?.full_name ?? 'Team member'}
                </span>
                <div className={cn('p-0.5 rounded', config.bg)}>
                  <Icon className={cn('w-3 h-3', config.color)} />
                </div>
              </div>
              <p className="text-sm font-medium text-th-text-primary mt-0.5 leading-snug">
                {item.title}
              </p>
              {item.value != null && item.value > 0 && (
                <p className="text-sm font-bold text-green-600 dark:text-green-400 mt-0.5">
                  {formatValue(item.value)}
                </p>
              )}
            </div>
            <span className="text-[10px] text-th-text-tertiary whitespace-nowrap flex-shrink-0">
              {formatTimeAgo(item.created_at)}
            </span>
          </div>

          {/* Reactions */}
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            {REACTION_OPTIONS.map(({ emoji, icon: RIcon }) => {
              const count = reactions[emoji]?.length ?? 0;
              const hasReacted = userReactions.has(emoji);
              return (
                <button
                  key={emoji}
                  onClick={() => onReact(item.id, emoji)}
                  className={cn(
                    'flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-all duration-200',
                    hasReacted
                      ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-300 dark:ring-blue-500/40'
                      : 'bg-surface-tertiary text-th-text-tertiary hover:bg-surface-primary hover:text-th-text-secondary',
                  )}
                >
                  <span className="text-xs">{emoji}</span>
                  {count > 0 && <span>{count}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Post Win Form
// ============================================================================

interface PostWinFormProps {
  onSubmit: (title: string, value?: number) => Promise<void>;
  onCancel: () => void;
}

function PostWinForm({ onSubmit, onCancel }: PostWinFormProps) {
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(title.trim(), value ? parseFloat(value) : undefined);
      setTitle('');
      setValue('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-3 rounded-xl bg-surface-secondary border border-th-border space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-th-text-secondary">Post a Win</span>
        <button onClick={onCancel} aria-label="Close form" className="p-0.5 rounded hover:bg-surface-tertiary transition-colors">
          <X className="w-3.5 h-3.5 text-th-text-tertiary" />
        </button>
      </div>
      <input
        ref={inputRef}
        type="text"
        placeholder="What did you win? e.g. Closed ABC Corp deal"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        className="w-full text-sm px-3 py-2 rounded-lg bg-surface-primary border border-th-border text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      />
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="$ Value (optional)"
          value={value}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9.]/g, '');
            setValue(v);
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          className="flex-1 text-sm px-3 py-1.5 rounded-lg bg-surface-primary border border-th-border text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
        <button
          onClick={handleSubmit}
          disabled={!title.trim() || submitting}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            title.trim() && !submitting
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
              : 'bg-surface-tertiary text-th-text-tertiary cursor-not-allowed',
          )}
        >
          <Send className="w-3 h-3" />
          Post
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Skeleton
// ============================================================================

function WinSkeleton() {
  return (
    <div className="border-l-[3px] border-l-surface-tertiary rounded-lg p-3 animate-pulse">
      <div className="flex gap-2.5">
        <div className="w-8 h-8 rounded-full bg-surface-tertiary flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-surface-tertiary rounded w-20" />
          <div className="h-4 bg-surface-tertiary rounded w-40" />
          <div className="flex gap-1.5">
            <div className="h-5 w-10 bg-surface-tertiary rounded-full" />
            <div className="h-5 w-10 bg-surface-tertiary rounded-full" />
            <div className="h-5 w-10 bg-surface-tertiary rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Widget
// ============================================================================

const gamificationService = createGamificationService(supabase);

export default function WinFeedWidget() {
  const { activeOrgId } = useOrg();
  const { user } = useAuth();
  const [items, setItems] = useState<WinFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newItemIds, setNewItemIds] = useState<Set<string>>(new Set());
  const previousIdsRef = useRef<Set<string>>(new Set());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchWins = useCallback(
    async (silent = false) => {
      if (!activeOrgId) return;
      if (!silent) setIsLoading(true);

      try {
        const data = await gamificationService.getWinFeed(activeOrgId, MAX_ITEMS);
        const currentIds = new Set(items.map((i) => i.id));
        const incoming = new Set(data.map((d) => d.id));
        const fresh = new Set<string>();

        if (currentIds.size > 0) {
          incoming.forEach((id) => {
            if (!currentIds.has(id)) fresh.add(id);
          });
        }

        setItems(data);
        previousIdsRef.current = incoming;

        if (fresh.size > 0) {
          setNewItemIds(fresh);
          setTimeout(() => setNewItemIds(new Set()), 600);
        }
      } catch (err) {
        console.error('[WinFeedWidget] Failed to fetch wins:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [activeOrgId, items]
  );

  useEffect(() => {
    fetchWins();
  }, [activeOrgId]);

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => fetchWins(true), POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchWins]);

  const handleReact = useCallback(
    async (winId: string, emoji: ReactionEmoji) => {
      if (!user?.id || !activeOrgId) return;

      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== winId) return item;
          const reactions = { ...(item.reactions as Record<string, string[]> ?? {}) };
          const users = reactions[emoji] ? [...reactions[emoji]] : [];
          const idx = users.indexOf(user.id);
          if (idx >= 0) {
            users.splice(idx, 1);
          } else {
            users.push(user.id);
          }
          reactions[emoji] = users;
          return { ...item, reactions };
        })
      );

      try {
        await gamificationService.reactToWin(winId, emoji);
      } catch (err) {
        console.error('[WinFeedWidget] Failed to toggle reaction:', err);
        fetchWins(true);
      }
    },
    [user?.id, activeOrgId, fetchWins]
  );

  const handlePostWin = useCallback(
    async (title: string, value?: number) => {
      if (!activeOrgId || !user?.id) return;

      try {
        await gamificationService.postWin(activeOrgId, 'deal_closed', title, undefined, value);
        setShowForm(false);
        await fetchWins();
      } catch (err) {
        console.error('[WinFeedWidget] Failed to post win:', err);
      }
    },
    [activeOrgId, user?.id, fetchWins]
  );

  return (
    <div className="space-y-3">
      {/* Post Win Button / Form */}
      {showForm ? (
        <PostWinForm onSubmit={handlePostWin} onCancel={() => setShowForm(false)} />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border border-dashed border-th-border text-xs font-medium text-th-text-secondary hover:text-blue-600 hover:border-blue-300 dark:hover:border-blue-500/40 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Post a Win
        </button>
      )}

      {/* Feed */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <WinSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center mb-3">
            <Trophy className="w-7 h-7 text-amber-500" />
          </div>
          <p className="text-sm font-medium text-th-text-secondary">No wins yet today</p>
          <p className="text-xs text-th-text-tertiary mt-1">
            Close a deal to get the party started!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <WinCard
              key={item.id}
              item={item}
              currentUserId={user?.id}
              onReact={handleReact}
              isNew={newItemIds.has(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
