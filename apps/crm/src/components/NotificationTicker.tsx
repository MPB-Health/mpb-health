import type React from 'react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus, UserCog, GitBranch, Briefcase, FileEdit, Trophy,
  XCircle, ListTodo, CheckCircle, AlertTriangle, Activity,
  Building, FileText, DollarSign, FileCheck, ThumbsUp,
  Megaphone, Mail, Calendar, Bell, Info, ChevronRight,
  ChevronDown, ChevronUp, X, Pause, Play, Zap,
} from 'lucide-react';
import { useCRM } from '../contexts/CRMContext';
import type { TickerItem } from '@mpbhealth/crm-core';
import { TICKER_EVENT_CONFIG } from '@mpbhealth/crm-core';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

const ICON_MAP: Record<string, React.ElementType> = {
  UserPlus, UserCog, GitBranch, Briefcase, FileEdit, Trophy,
  XCircle, ListTodo, CheckCircle, AlertTriangle, Activity,
  Building, FileText, DollarSign, FileCheck, ThumbsUp,
  Megaphone, Mail, Calendar, Bell, Info,
};

const getColorClasses = (color: string) => {
  const colors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    green: { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', border: 'border-green-500/20', dot: 'bg-green-500' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20', dot: 'bg-blue-500' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
    yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-500/20', dot: 'bg-yellow-500' },
    red: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/20', dot: 'bg-red-500' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/20', dot: 'bg-orange-500' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/20', dot: 'bg-cyan-500' },
    teal: { bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-500/20', dot: 'bg-teal-500' },
    pink: { bg: 'bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-500/20', dot: 'bg-pink-500' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20', dot: 'bg-amber-500' },
    sky: { bg: 'bg-sky-500/10', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-500/20', dot: 'bg-sky-500' },
    slate: { bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-500/20', dot: 'bg-slate-500' },
    gray: { bg: 'bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-500/20', dot: 'bg-gray-500' },
  };
  return colors[color] || colors.gray;
};

const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = Math.floor((now.getTime() - time.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

interface GroupedEvent {
  type: string;
  label: string;
  count: number;
  icon: string;
  color: string;
  latestItem: TickerItem;
  items: TickerItem[];
}

function groupEvents(items: TickerItem[]): GroupedEvent[] {
  const groups = new Map<string, GroupedEvent>();
  for (const item of items) {
    const config = TICKER_EVENT_CONFIG[item.type] || TICKER_EVENT_CONFIG.system;
    const existing = groups.get(item.type);
    if (existing) {
      existing.count++;
      existing.items.push(item);
      if (new Date(item.timestamp) > new Date(existing.latestItem.timestamp)) {
        existing.latestItem = item;
      }
    } else {
      groups.set(item.type, {
        type: item.type,
        label: config.label,
        count: 1,
        icon: config.icon,
        color: item.color || config.color,
        latestItem: item,
        items: [item],
      });
    }
  }
  return Array.from(groups.values()).sort(
    (a, b) => new Date(b.latestItem.timestamp).getTime() - new Date(a.latestItem.timestamp).getTime()
  );
}

interface TickerItemProps {
  item: TickerItem;
  onClick?: () => void;
  isNew?: boolean;
}

function TickerItemCard({ item, onClick, isNew }: TickerItemProps) {
  const config = TICKER_EVENT_CONFIG[item.type] || TICKER_EVENT_CONFIG.system;
  const Icon = ICON_MAP[item.icon || config.icon] || Bell;
  const colors = getColorClasses(item.color || config.color);

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200',
        'hover:scale-[1.02] hover:shadow-md cursor-pointer',
        'shrink-0 min-w-fit',
        colors.bg, colors.border,
        item.priority === 'urgent' && 'shadow-[0_0_12px_rgba(239,68,68,0.3)]',
        item.priority === 'high' && 'shadow-[0_0_8px_rgba(249,115,22,0.2)]',
        isNew && 'animate-[tickerSlideIn_0.3s_ease-out]'
      )}
    >
      {(item.priority === 'urgent' || item.priority === 'high') && (
        <span className={cn(
          'w-2 h-2 rounded-full shrink-0',
          item.priority === 'urgent' ? 'bg-red-500 animate-pulse' : 'bg-orange-500'
        )} />
      )}
      <Icon className={cn('w-4 h-4 shrink-0', colors.text)} />
      <span className={cn('text-sm font-medium whitespace-nowrap', colors.text)}>
        {item.title}
      </span>
      <span className="text-sm text-th-text-tertiary whitespace-nowrap truncate max-w-[200px]">
        {item.message}
      </span>
      <span className="text-xs text-th-text-tertiary whitespace-nowrap">
        {formatTimeAgo(item.timestamp)}
      </span>
      <ChevronRight className="w-3 h-3 text-th-text-tertiary" />
    </button>
  );
}

export function NotificationTicker() {
  const { tickerService } = useCRM();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<TickerItem[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newItemIds, setNewItemIds] = useState<Set<string>>(new Set());

  const urgentItems = useMemo(
    () => items.filter((i) => i.priority === 'urgent' || i.priority === 'high'),
    [items]
  );

  const grouped = useMemo(() => groupEvents(items), [items]);

  // Auto-expand for urgent items
  useEffect(() => {
    if (urgentItems.length > 0 && !isExpanded) {
      setIsExpanded(true);
      const timer = setTimeout(() => setIsExpanded(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [urgentItems.length, isExpanded]);

  // Keyboard shortcut: T to toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 't' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        if ((e.target as HTMLElement)?.isContentEditable) return;
        setIsVisible((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (!tickerService) return;

    const loadItems = async () => {
      setIsLoading(true);
      try {
        const recentItems = await tickerService.getRecentItems({ limit: 30 });
        setItems(recentItems);
      } catch {
        // silently fail
      } finally {
        setIsLoading(false);
      }
    };

    loadItems();

    const unsubscribe = tickerService.subscribeToTicker((newItem) => {
      setItems((prev) => [newItem, ...prev.filter((i) => i.id !== newItem.id)].slice(0, 50));
      setNewItemIds((prev) => new Set(prev).add(newItem.id));
      setTimeout(() => {
        setNewItemIds((prev) => {
          const next = new Set(prev);
          next.delete(newItem.id);
          return next;
        });
      }, 2000);
    });

    return () => { unsubscribe(); };
  }, [tickerService]);

  // Auto-scroll when expanded
  useEffect(() => {
    if (!isExpanded || isPaused || items.length === 0 || !scrollRef.current) return;

    let animationId: number;
    let scrollPosition = 0;

    const animate = () => {
      if (!scrollRef.current || isPaused) return;
      scrollPosition += 0.5;
      const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
      if (scrollPosition >= maxScroll) scrollPosition = 0;
      scrollRef.current.scrollLeft = scrollPosition;
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isExpanded, isPaused, items.length]);

  const handleItemClick = useCallback((item: TickerItem) => {
    if (!item.entityType || !item.entityId) return;
    const routes: Record<string, string> = {
      lead: `/leads/${item.entityId}`,
      task: `/tasks`,
      deal: `/deals/${item.entityId}`,
      contact: `/contacts/${item.entityId}`,
      account: `/accounts/${item.entityId}`,
      calendar_event: `/calendar`,
      activity: `/leads/${item.metadata?.leadId || ''}`,
    };
    const route = routes[item.entityType];
    if (route) navigate(route);
  }, [navigate]);

  if (!isVisible) return null;

  const unreadCount = items.filter((i) => !i.read).length;

  // Collapsed state: thin summary bar
  if (!isExpanded) {
    return (
      <div className="relative w-full border-b border-th-border/30">
        <button
          onClick={() => setIsExpanded(true)}
          className={cn(
            'w-full flex items-center justify-between px-4 py-1.5',
            'bg-surface-primary/80 hover:bg-surface-secondary/60 transition-colors',
            'group cursor-pointer'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <Zap className="w-3.5 h-3.5 text-th-accent-500" />
              <span className="text-xs font-semibold text-th-text-secondary">
                Activity Pulse
              </span>
            </div>

            {isLoading ? (
              <span className="text-xs text-th-text-tertiary">Loading...</span>
            ) : (
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <span className="text-xs font-medium text-th-accent-500 bg-th-accent-500/10 px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
                {grouped.slice(0, 3).map((g) => {
                  const Icon = ICON_MAP[g.icon] || Bell;
                  const colors = getColorClasses(g.color);
                  return (
                    <span key={g.type} className={cn('flex items-center gap-1 text-xs', colors.text)}>
                      <Icon className="w-3 h-3" />
                      <span className="tabular-nums">{g.count}</span>
                    </span>
                  );
                })}
                {grouped.length > 3 && (
                  <span className="text-xs text-th-text-tertiary">+{grouped.length - 3} more</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {urgentItems.length > 0 && (
              <span className="flex items-center gap-1 text-xs font-medium text-red-500 animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                {urgentItems.length} urgent
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-th-text-tertiary group-hover:text-th-text-secondary transition-colors" />
            <button
              onClick={(e) => { e.stopPropagation(); setIsVisible(false); }}
              className="p-1 rounded hover:bg-surface-tertiary text-th-text-tertiary hover:text-th-text-secondary transition-colors"
              title="Hide (press T to toggle)"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </button>
      </div>
    );
  }

  // Expanded state: full scrolling ticker
  return (
    <div
      className={cn(
        'relative w-full overflow-hidden',
        'bg-gradient-to-r from-surface-primary via-surface-secondary/50 to-surface-primary',
        'border-b border-th-border/40',
        'shadow-sm'
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="absolute left-0 top-0 bottom-0 flex items-center z-10 pl-3 pr-8 bg-gradient-to-r from-surface-primary via-surface-primary to-transparent">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <Zap className="w-3.5 h-3.5 text-th-accent-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-th-accent-600 dark:text-th-accent-400">
            Live
          </span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex items-center gap-3 px-24 py-2 overflow-x-hidden"
        style={{ scrollBehavior: 'auto' }}
      >
        {isLoading ? (
          <div className="flex items-center gap-2 text-th-text-tertiary text-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-th-accent-500" />
            <span>Loading activity feed...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex items-center gap-2 text-th-text-tertiary text-sm">
            <Activity className="w-4 h-4" />
            <span>No recent activity - new events will appear here in real-time</span>
          </div>
        ) : (
          [...items, ...items].map((item, index) => (
            <TickerItemCard
              key={`${item.id}-${index}`}
              item={item}
              onClick={() => handleItemClick(item)}
              isNew={newItemIds.has(item.id) && index < items.length}
            />
          ))
        )}
      </div>

      <div className="absolute right-0 top-0 bottom-0 flex items-center z-10 pr-3 pl-8 bg-gradient-to-l from-surface-primary via-surface-primary to-transparent">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1.5 rounded-md hover:bg-surface-tertiary text-th-text-tertiary hover:text-th-text-secondary transition-colors"
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1.5 rounded-md hover:bg-surface-tertiary text-th-text-tertiary hover:text-th-text-secondary transition-colors"
            title="Collapse"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1.5 rounded-md hover:bg-surface-tertiary text-th-text-tertiary hover:text-th-text-secondary transition-colors"
            title="Hide (press T to toggle)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="absolute inset-y-0 left-20 w-8 bg-gradient-to-r from-surface-primary to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-20 w-8 bg-gradient-to-l from-surface-primary to-transparent pointer-events-none" />

      <style>{`
        @keyframes tickerSlideIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

export default NotificationTicker;
