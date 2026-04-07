import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Trophy,
  Medal,
  Flame,
  ArrowUp,
  ArrowDown,
  Crown,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useOrg } from '../../../contexts/OrgContext';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import {
  createGamificationService,
  type LeaderboardEntry,
} from '@mpbhealth/crm-core/gamification';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

// ============================================================================
// Zustand store — persists last leaderboard snapshot for rank-change arrows
// ============================================================================

interface LeaderboardSnapshot {
  entries: Record<string, number>;
  timestamp: number;
}

interface LeaderboardCacheState {
  snapshots: Record<string, LeaderboardSnapshot>;
  setSnapshot: (period: string, orgId: string, entries: LeaderboardEntry[]) => void;
  getPreviousRank: (period: string, orgId: string, userId: string) => number | null;
}

const useLeaderboardCache = create<LeaderboardCacheState>()(
  persist(
    (set, get) => ({
      snapshots: {},
      setSnapshot: (period, orgId, entries) => {
        const key = `${orgId}:${period}`;
        const map: Record<string, number> = {};
        entries.forEach((e, i) => {
          map[e.user_id] = i + 1;
        });
        set((state) => ({
          snapshots: {
            ...state.snapshots,
            [key]: { entries: map, timestamp: Date.now() },
          },
        }));
      },
      getPreviousRank: (period, orgId, userId) => {
        const key = `${orgId}:${period}`;
        const snap = get().snapshots[key];
        if (!snap) return null;
        return snap.entries[userId] ?? null;
      },
    }),
    { name: 'mpb-leaderboard-cache' }
  )
);

// ============================================================================
// Constants
// ============================================================================

type Period = 'daily' | 'weekly' | 'monthly' | 'all_time';

const PERIODS: { label: string; value: Period }[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'All Time', value: 'all_time' },
];

const LEVEL_STYLES: Record<string, { bg: string; text: string }> = {
  Rookie: { bg: 'bg-gray-100 dark:bg-gray-700/40', text: 'text-gray-600 dark:text-gray-300' },
  Closer: { bg: 'bg-blue-100 dark:bg-blue-700/30', text: 'text-blue-700 dark:text-blue-300' },
  Pro: { bg: 'bg-green-100 dark:bg-green-700/30', text: 'text-green-700 dark:text-green-300' },
  Veteran: { bg: 'bg-purple-100 dark:bg-purple-700/30', text: 'text-purple-700 dark:text-purple-300' },
  Champion: { bg: 'bg-amber-100 dark:bg-amber-700/30', text: 'text-amber-700 dark:text-amber-300' },
  Master: { bg: 'bg-rose-100 dark:bg-rose-700/30', text: 'text-rose-700 dark:text-rose-300' },
  Elite: { bg: 'bg-red-100 dark:bg-red-700/30', text: 'text-red-700 dark:text-red-300' },
  Legend: { bg: 'bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-700/30 dark:to-yellow-700/30', text: 'text-amber-700 dark:text-amber-300' },
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

const POLL_INTERVAL_MS = 30_000;
const TOP_DISPLAY_COUNT = 10;

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

function formatXP(xp: number): string {
  if (xp >= 10_000) return `${(xp / 1000).toFixed(1)}k`;
  return xp.toLocaleString();
}

// ============================================================================
// Animated XP Counter
// ============================================================================

function AnimatedXP({ value, duration = 800 }: { value: number; duration?: number }) {
  const [displayed, setDisplayed] = useState(0);
  const startRef = useRef<number | null>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    startRef.current = null;
    const animate = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * value));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, duration]);

  return <span>{formatXP(displayed)}</span>;
}

// ============================================================================
// Rank Medal
// ============================================================================

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="w-7 h-7 flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shadow-md shadow-amber-200/50 dark:shadow-amber-900/30">
        <Crown className="w-3.5 h-3.5 text-white" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-7 h-7 flex items-center justify-center rounded-full bg-gradient-to-br from-gray-200 to-gray-400 shadow-md shadow-gray-200/50 dark:shadow-gray-900/30 dark:from-gray-400 dark:to-gray-500">
        <Medal className="w-3.5 h-3.5 text-white" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-7 h-7 flex items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-orange-700 shadow-md shadow-orange-200/50 dark:shadow-orange-900/30">
        <Medal className="w-3.5 h-3.5 text-white" />
      </div>
    );
  }
  return (
    <div className="w-7 h-7 flex items-center justify-center">
      <span className="text-xs font-semibold text-th-text-tertiary">{rank}</span>
    </div>
  );
}

// ============================================================================
// Rank Change Indicator
// ============================================================================

function RankChange({ current, previous }: { current: number; previous: number | null }) {
  if (previous === null || previous === current) return null;
  const diff = previous - current;
  if (diff > 0) {
    return (
      <span className="flex items-center text-[10px] font-medium text-green-600 dark:text-green-400 animate-bounce-once">
        <ArrowUp className="w-2.5 h-2.5" />
        {diff}
      </span>
    );
  }
  return (
    <span className="flex items-center text-[10px] font-medium text-red-500 dark:text-red-400">
      <ArrowDown className="w-2.5 h-2.5" />
      {Math.abs(diff)}
    </span>
  );
}

// ============================================================================
// Leaderboard Row
// ============================================================================

interface RowProps {
  entry: LeaderboardEntry;
  rank: number;
  isCurrentUser: boolean;
  previousRank: number | null;
  isFirstLoad: boolean;
}

function LeaderboardRow({ entry, rank, isCurrentUser, previousRank, isFirstLoad }: RowProps) {
  const isTop3 = rank <= 3;
  const levelStyle = LEVEL_STYLES[entry.level_name] || LEVEL_STYLES.Rookie;

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-xl px-3 transition-all duration-300',
        isTop3 ? 'py-3' : 'py-2',
        isCurrentUser && 'bg-blue-50/80 dark:bg-blue-500/10 ring-1 ring-blue-200 dark:ring-blue-500/30',
        !isCurrentUser && 'hover:bg-surface-secondary',
        rank === 1 && !isCurrentUser && 'bg-amber-50/50 dark:bg-amber-500/5',
      )}
    >
      <div className="flex items-center gap-1 w-10 flex-shrink-0">
        <RankBadge rank={rank} />
        <RankChange current={rank} previous={previousRank} />
      </div>

      <div
        className={cn(
          'flex-shrink-0 rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-white',
          getGradient(entry.user_id),
          isTop3 ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs',
        )}
      >
        {getInitials(entry.user_name)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={cn('font-medium truncate', isTop3 ? 'text-sm' : 'text-xs', 'text-th-text-primary')}>
            {entry.user_name}
          </span>
          {isCurrentUser && (
            <span className="text-[9px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20 px-1.5 py-0.5 rounded-full">
              You
            </span>
          )}
        </div>
        <span className={cn('inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5', levelStyle.bg, levelStyle.text)}>
          {entry.level_name}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {entry.streak > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] font-medium text-orange-600 dark:text-orange-400">
            <Flame className="w-3 h-3" />
            {entry.streak}
          </span>
        )}
        <div className="text-right min-w-[50px]">
          <p className={cn('font-bold tabular-nums', isTop3 ? 'text-sm' : 'text-xs', 'text-th-text-primary')}>
            {isFirstLoad ? <AnimatedXP value={entry.period_xp} /> : formatXP(entry.period_xp)}
          </p>
          <p className="text-[9px] text-th-text-tertiary">XP</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Skeleton
// ============================================================================

function SkeletonRow({ isTop }: { isTop: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5 px-3 animate-pulse', isTop ? 'py-3' : 'py-2')}>
      <div className="w-7 h-7 rounded-full bg-surface-tertiary" />
      <div className={cn('rounded-full bg-surface-tertiary', isTop ? 'w-10 h-10' : 'w-8 h-8')} />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-surface-tertiary rounded w-24" />
        <div className="h-2.5 bg-surface-tertiary rounded w-14" />
      </div>
      <div className="w-12 h-4 bg-surface-tertiary rounded" />
    </div>
  );
}

// ============================================================================
// Main Widget
// ============================================================================

const gamificationService = createGamificationService(supabase);

export default function LeaderboardWidget() {
  const { activeOrgId } = useOrg();
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('weekly');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { setSnapshot, getPreviousRank } = useLeaderboardCache();

  const fetchLeaderboard = useCallback(
    async (silent = false) => {
      if (!activeOrgId) return;
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);

      try {
        const data = await gamificationService.getLeaderboard(activeOrgId, period);
        setSnapshot(period, activeOrgId, entries);
        setEntries(data);
        if (!silent) setIsFirstLoad(true);
      } catch (err) {
        console.error('[LeaderboardWidget] Failed to fetch leaderboard:', err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [activeOrgId, period, entries, setSnapshot]
  );

  useEffect(() => {
    fetchLeaderboard();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeOrgId, period]);

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => fetchLeaderboard(true), POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchLeaderboard]);

  useEffect(() => {
    if (isFirstLoad && entries.length > 0) {
      const t = setTimeout(() => setIsFirstLoad(false), 1200);
      return () => clearTimeout(t);
    }
  }, [isFirstLoad, entries]);

  const currentUserId = user?.id;
  const topEntries = entries.slice(0, TOP_DISPLAY_COUNT);
  const currentUserInTop = topEntries.some((e) => e.user_id === currentUserId);
  const currentUserEntry = !currentUserInTop
    ? entries.find((e) => e.user_id === currentUserId)
    : null;
  const currentUserRank = currentUserEntry
    ? entries.findIndex((e) => e.user_id === currentUserId) + 1
    : null;

  return (
    <div className="space-y-3">
      {/* Period Tabs */}
      <div className="flex items-center gap-1 bg-surface-tertiary rounded-lg p-0.5">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={cn(
              'flex-1 text-[11px] font-medium py-1.5 rounded-md transition-all duration-200',
              period === p.value
                ? 'bg-surface-primary text-th-text-primary shadow-sm'
                : 'text-th-text-tertiary hover:text-th-text-secondary',
            )}
          >
            {p.label}
          </button>
        ))}
        {isRefreshing && (
          <RefreshCw className="w-3 h-3 text-th-text-tertiary animate-spin flex-shrink-0 mr-1" />
        )}
      </div>

      {/* Leaderboard */}
      {isLoading ? (
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} isTop={i < 3} />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center mb-3">
            <Sparkles className="w-7 h-7 text-amber-500" />
          </div>
          <p className="text-sm font-medium text-th-text-secondary">No activity this period yet</p>
          <p className="text-xs text-th-text-tertiary mt-1">Be the first to earn XP!</p>
        </div>
      ) : (
        <div className="space-y-1">
          {topEntries.map((entry, i) => {
            const rank = i + 1;
            return (
              <LeaderboardRow
                key={entry.user_id}
                entry={entry}
                rank={rank}
                isCurrentUser={entry.user_id === currentUserId}
                previousRank={
                  activeOrgId ? getPreviousRank(period, activeOrgId, entry.user_id) : null
                }
                isFirstLoad={isFirstLoad}
              />
            );
          })}

          {currentUserEntry && currentUserRank && (
            <>
              <div className="flex items-center gap-2 px-3 py-1">
                <div className="flex-1 border-t border-dashed border-th-border" />
                <span className="text-[10px] text-th-text-tertiary">···</span>
                <div className="flex-1 border-t border-dashed border-th-border" />
              </div>
              <LeaderboardRow
                entry={currentUserEntry}
                rank={currentUserRank}
                isCurrentUser
                previousRank={
                  activeOrgId
                    ? getPreviousRank(period, activeOrgId, currentUserEntry.user_id)
                    : null
                }
                isFirstLoad={isFirstLoad}
              />
            </>
          )}
        </div>
      )}

      {/* Podium Summary for top 3 */}
      {!isLoading && entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-th-border">
          {[entries[1], entries[0], entries[2]].map((entry, i) => {
            const displayRank = [2, 1, 3][i];
            const heights = ['h-12', 'h-16', 'h-10'];
            const gradients = [
              'from-gray-300 to-gray-400 dark:from-gray-500 dark:to-gray-600',
              'from-yellow-300 to-amber-400 dark:from-yellow-500 dark:to-amber-600',
              'from-amber-600 to-orange-600 dark:from-amber-700 dark:to-orange-700',
            ];
            return (
              <div key={entry.user_id} className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-6 h-6 rounded-full bg-gradient-to-br flex items-center justify-center text-[10px] font-bold text-white mb-1',
                    getGradient(entry.user_id),
                  )}
                >
                  {getInitials(entry.user_name)}
                </div>
                <p className="text-[10px] font-medium text-th-text-primary truncate max-w-full">
                  {entry.user_name.split(' ')[0]}
                </p>
                <div
                  className={cn(
                    'w-full rounded-t-lg bg-gradient-to-t mt-1 flex items-end justify-center pb-1',
                    heights[i],
                    gradients[i],
                  )}
                >
                  <span className="text-[10px] font-bold text-white">#{displayRank}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
