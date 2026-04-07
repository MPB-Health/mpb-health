import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type DragEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Star, Clock, Plus, X, GripVertical } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface FavoriteItem {
  href: string;
  name: string;
  icon?: string;
}

interface RecentItem {
  href: string;
  name: string;
  visitedAt: number;
}

interface FavoritesState {
  favorites: FavoriteItem[];
  recentlyVisited: RecentItem[];
}

interface FavoritesActions {
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (href: string) => void;
  isFavorite: (href: string) => boolean;
  recordVisit: (href: string, name: string) => void;
  reorderFavorites: (items: FavoriteItem[]) => void;
}

type FavoritesStore = FavoritesState & FavoritesActions;

const MAX_FAVORITES = 6;
const MAX_RECENT = 8;

// ============================================================================
// Store
// ============================================================================

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      recentlyVisited: [],

      addFavorite: (item) =>
        set((state) => {
          if (state.favorites.length >= MAX_FAVORITES) return state;
          if (state.favorites.some((f) => f.href === item.href)) return state;
          return { favorites: [...state.favorites, item] };
        }),

      removeFavorite: (href) =>
        set((state) => ({
          favorites: state.favorites.filter((f) => f.href !== href),
        })),

      isFavorite: (href) => get().favorites.some((f) => f.href === href),

      recordVisit: (href, name) =>
        set((state) => {
          const filtered = state.recentlyVisited.filter((r) => r.href !== href);
          const updated = [{ href, name, visitedAt: Date.now() }, ...filtered];
          return { recentlyVisited: updated.slice(0, MAX_RECENT) };
        }),

      reorderFavorites: (items) => set({ favorites: items }),
    }),
    { name: 'crm-favorites' },
  ),
);

// ============================================================================
// Helpers
// ============================================================================

const DOT_COLORS = [
  'bg-blue-400',
  'bg-emerald-400',
  'bg-amber-400',
  'bg-rose-400',
  'bg-violet-400',
  'bg-cyan-400',
];

function dotColor(index: number): string {
  return DOT_COLORS[index % DOT_COLORS.length];
}

function relativeTime(timestamp: number): string {
  const diff = Math.max(0, Date.now() - timestamp);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ============================================================================
// FavoritesBar
// ============================================================================

interface FavoritesBarProps {
  currentHref?: string;
  currentName?: string;
}

export function FavoritesBar({ currentHref, currentName }: FavoritesBarProps) {
  const { favorites, addFavorite, removeFavorite, reorderFavorites } =
    useFavoritesStore();

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    href: string;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contextMenu) return;
    function close(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [contextMenu]);

  const handleDragStart = useCallback(
    (e: DragEvent<HTMLDivElement>, index: number) => {
      setDragIndex(index);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    },
    [],
  );

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setOverIndex(index);
    },
    [],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>, targetIndex: number) => {
      e.preventDefault();
      if (dragIndex === null || dragIndex === targetIndex) {
        setDragIndex(null);
        setOverIndex(null);
        return;
      }
      const reordered = [...favorites];
      const [moved] = reordered.splice(dragIndex, 1);
      reordered.splice(targetIndex, 0, moved);
      reorderFavorites(reordered);
      setDragIndex(null);
      setOverIndex(null);
    },
    [dragIndex, favorites, reorderFavorites],
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  const handleContextMenu = useCallback(
    (e: ReactMouseEvent, href: string) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, href });
    },
    [],
  );

  const handleAddCurrent = useCallback(() => {
    if (currentHref && currentName) {
      addFavorite({ href: currentHref, name: currentName });
    }
  }, [currentHref, currentName, addFavorite]);

  const alreadyFavorited =
    currentHref != null && favorites.some((f) => f.href === currentHref);
  const canAdd =
    currentHref != null &&
    currentName != null &&
    !alreadyFavorited &&
    favorites.length < MAX_FAVORITES;

  return (
    <div className="px-3 py-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {favorites.length === 0 && (
          <span className="text-[11px] italic text-gray-400 select-none">
            Pin your favorite pages here
          </span>
        )}

        {favorites.map((fav, index) => (
          <div
            key={fav.href}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            onContextMenu={(e) => handleContextMenu(e, fav.href)}
            className={`
              group flex items-center gap-1.5 rounded-full border px-2.5 py-1
              text-[11px] font-medium transition-all duration-150 cursor-grab
              active:cursor-grabbing select-none
              ${
                dragIndex === index
                  ? 'opacity-40 scale-95 border-dashed border-gray-300'
                  : overIndex === index && dragIndex !== null
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
              }
            `}
          >
            <GripVertical className="hidden h-3 w-3 shrink-0 text-gray-300 group-hover:block dark:text-gray-600" />
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor(index)}`} />
            <a
              href={fav.href}
              onClick={(e) => e.stopPropagation()}
              className="truncate text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
              title={fav.name}
            >
              {fav.name}
            </a>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeFavorite(fav.href);
              }}
              className="hidden h-3.5 w-3.5 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 group-hover:flex dark:hover:bg-gray-700 dark:hover:text-gray-300"
              aria-label={`Remove ${fav.name} from favorites`}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ))}

        {canAdd && (
          <button
            type="button"
            onClick={handleAddCurrent}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-400 transition-colors hover:border-gray-400 hover:bg-gray-50 hover:text-gray-500 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-400"
            title="Pin current page"
            aria-label="Pin current page to favorites"
          >
            <Plus className="h-3 w-3" />
          </button>
        )}
      </div>

      {contextMenu && (
        <div
          ref={menuRef}
          className="fixed z-50 min-w-[160px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
            onClick={() => {
              removeFavorite(contextMenu.href);
              setContextMenu(null);
            }}
          >
            <X className="h-3.5 w-3.5" />
            Remove from favorites
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// RecentlyVisited
// ============================================================================

interface RecentlyVisitedProps {
  currentHref?: string;
  maxItems?: number;
}

export function RecentlyVisited({
  currentHref,
  maxItems = 5,
}: RecentlyVisitedProps) {
  const recentlyVisited = useFavoritesStore((s) => s.recentlyVisited);
  const [, setTick] = useState(0);

  // Re-render every 30s so relative times stay fresh
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const visible = recentlyVisited
    .filter((r) => r.href !== currentHref)
    .slice(0, maxItems);

  if (visible.length === 0) return null;

  return (
    <div className="px-3 py-2">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Clock className="h-3 w-3 text-gray-400" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Recent
        </span>
      </div>
      <ul className="space-y-0.5">
        {visible.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              className="flex items-center justify-between rounded px-1.5 py-1 text-[12px] transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span className="truncate text-gray-600 dark:text-gray-400">
                {item.name}
              </span>
              <span className="ml-2 shrink-0 text-[10px] text-gray-400 dark:text-gray-500">
                {relativeTime(item.visitedAt)}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// FavoriteToggle
// ============================================================================

interface FavoriteToggleProps {
  href: string;
  name: string;
  className?: string;
}

export function FavoriteToggle({ href, name, className = '' }: FavoriteToggleProps) {
  const { addFavorite, removeFavorite, isFavorite, favorites } =
    useFavoritesStore();
  const favorited = isFavorite(href);
  const [bouncing, setBouncing] = useState(false);

  const toggle = useCallback(() => {
    if (favorited) {
      removeFavorite(href);
    } else {
      addFavorite({ href, name });
    }
    setBouncing(true);
  }, [favorited, href, name, addFavorite, removeFavorite]);

  useEffect(() => {
    if (!bouncing) return;
    const id = setTimeout(() => setBouncing(false), 300);
    return () => clearTimeout(id);
  }, [bouncing]);

  const atLimit = !favorited && favorites.length >= MAX_FAVORITES;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={atLimit}
      className={`
        inline-flex items-center justify-center rounded-md p-1.5
        transition-colors duration-150
        ${favorited ? 'text-amber-500 hover:text-amber-600' : 'text-gray-400 hover:text-gray-500'}
        ${atLimit ? 'cursor-not-allowed opacity-40' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
        ${bouncing ? 'animate-[bounce-star_300ms_ease-out]' : ''}
        ${className}
      `}
      title={
        atLimit
          ? 'Favorites limit reached (max 6)'
          : favorited
            ? 'Remove from favorites'
            : 'Add to favorites'
      }
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={favorited ? 'true' : 'false'}
    >
      <Star
        className="h-4 w-4"
        fill={favorited ? 'currentColor' : 'none'}
        strokeWidth={favorited ? 1.5 : 2}
      />
      <style>{`
        @keyframes bounce-star {
          0% { transform: scale(1); }
          40% { transform: scale(1.35); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
      `}</style>
    </button>
  );
}
