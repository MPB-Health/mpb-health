// ============================================================================
// Notification Ticker Component
// Real-time scrolling ticker for CRM activity and alerts
// Championship-level design with smooth animations
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  UserCog,
  GitBranch,
  Briefcase,
  FileEdit,
  Trophy,
  XCircle,
  ListTodo,
  CheckCircle,
  AlertTriangle,
  Activity,
  Building,
  FileText,
  DollarSign,
  FileCheck,
  ThumbsUp,
  Megaphone,
  Mail,
  Calendar,
  Bell,
  Info,
  ChevronRight,
  X,
  Pause,
  Play,
} from 'lucide-react';
import { useCRM } from '../contexts/CRMContext';
import type { TickerItem, TickerEventType } from '@mpbhealth/crm-core';
import { TICKER_EVENT_CONFIG } from '@mpbhealth/crm-core';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

// ============================================================================
// Icon Map
// ============================================================================

const ICON_MAP: Record<string, React.ElementType> = {
  UserPlus,
  UserCog,
  GitBranch,
  Briefcase,
  FileEdit,
  Trophy,
  XCircle,
  ListTodo,
  CheckCircle,
  AlertTriangle,
  Activity,
  Building,
  FileText,
  DollarSign,
  FileCheck,
  ThumbsUp,
  Megaphone,
  Mail,
  Calendar,
  Bell,
  Info,
};

// ============================================================================
// Color Utilities
// ============================================================================

const getColorClasses = (color: string) => {
  const colors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    green: { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', border: 'border-green-500/20', dot: 'bg-green-500' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20', dot: 'bg-blue-500' },
    emerald: { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', border: 'border-green-500/20', dot: 'bg-green-500' },
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

const getPriorityGlow = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse';
    case 'high':
      return 'shadow-[0_0_8px_rgba(249,115,22,0.3)]';
    default:
      return '';
  }
};

// ============================================================================
// Time Formatting
// ============================================================================

const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = Math.floor((now.getTime() - time.getTime()) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// ============================================================================
// Single Ticker Item Component
// ============================================================================

interface TickerItemProps {
  item: TickerItem;
  onClick?: () => void;
  isNew?: boolean;
}

function TickerItemCard({ item, onClick, isNew }: TickerItemProps) {
  const config = TICKER_EVENT_CONFIG[item.type] || TICKER_EVENT_CONFIG.system;
  const Icon = ICON_MAP[item.icon || config.icon] || Bell;
  const colors = getColorClasses(item.color || config.color);
  const priorityGlow = getPriorityGlow(item.priority);

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200',
        'hover:scale-[1.02] hover:shadow-md cursor-pointer',
        'shrink-0 min-w-fit',
        colors.bg,
        colors.border,
        priorityGlow,
        isNew && 'animate-[slideIn_0.3s_ease-out]'
      )}
    >
      {/* Priority dot for urgent/high */}
      {(item.priority === 'urgent' || item.priority === 'high') && (
        <span className={cn(
          'w-2 h-2 rounded-full shrink-0',
          item.priority === 'urgent' ? 'bg-red-500 animate-pulse' : 'bg-orange-500'
        )} />
      )}

      {/* Icon */}
      <Icon className={cn('w-4 h-4 shrink-0', colors.text)} />

      {/* Content */}
      <span className={cn('text-sm font-medium whitespace-nowrap', colors.text)}>
        {item.title}
      </span>
      <span className="text-sm text-th-text-tertiary whitespace-nowrap truncate max-w-[200px]">
        {item.message}
      </span>

      {/* Time */}
      <span className="text-xs text-th-text-tertiary whitespace-nowrap">
        {formatTimeAgo(item.timestamp)}
      </span>

      {/* Arrow */}
      <ChevronRight className="w-3 h-3 text-th-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

// ============================================================================
// Main Notification Ticker Component
// ============================================================================

export function NotificationTicker() {
  const { tickerService } = useCRM();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<TickerItem[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [newItemIds, setNewItemIds] = useState<Set<string>>(new Set());

  // Load initial items
  useEffect(() => {
    if (!tickerService) return;

    const loadItems = async () => {
      setIsLoading(true);
      try {
        const recentItems = await tickerService.getRecentItems({ limit: 30 });
        setItems(recentItems);
      } catch (error) {
        console.error('[NotificationTicker] Error loading items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadItems();

    // Subscribe to real-time updates
    const unsubscribe = tickerService.subscribeToTicker((newItem) => {
      setItems((prev) => {
        // Add new item at the beginning, keep max 50
        const updated = [newItem, ...prev.filter((i) => i.id !== newItem.id)].slice(0, 50);
        return updated;
      });
      // Mark as new for animation
      setNewItemIds((prev) => new Set(prev).add(newItem.id));
      // Remove new marker after animation
      setTimeout(() => {
        setNewItemIds((prev) => {
          const next = new Set(prev);
          next.delete(newItem.id);
          return next;
        });
      }, 2000);
    });

    return () => {
      unsubscribe();
    };
  }, [tickerService]);

  // Auto-scroll animation
  useEffect(() => {
    if (isPaused || items.length === 0 || !scrollRef.current) return;

    let animationId: number;
    let scrollPosition = 0;
    const scrollSpeed = 0.5; // pixels per frame

    const animate = () => {
      if (!scrollRef.current || isPaused) return;

      scrollPosition += scrollSpeed;
      const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;

      if (scrollPosition >= maxScroll) {
        scrollPosition = 0;
      }

      scrollRef.current.scrollLeft = scrollPosition;
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isPaused, items.length]);

  // Handle item click - navigate to entity
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
    if (route) {
      navigate(route);
    }
  }, [navigate]);

  if (!isVisible) return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full overflow-hidden',
        'bg-gradient-to-r from-surface-primary via-surface-secondary to-surface-primary',
        'border-b border-th-border/50',
        'shadow-sm'
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Live indicator */}
      <div className="absolute left-0 top-0 bottom-0 flex items-center z-10 pl-3 pr-6 bg-gradient-to-r from-surface-primary via-surface-primary to-transparent">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-400">
            Live
          </span>
        </div>
      </div>

      {/* Scrolling ticker content */}
      <div
        ref={scrollRef}
        className="flex items-center gap-3 px-20 py-2 overflow-x-hidden"
        style={{ scrollBehavior: 'auto' }}
      >
        {isLoading ? (
          <div className="flex items-center gap-2 text-th-text-tertiary text-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-th-accent-600" />
            <span>Loading activity feed...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex items-center gap-2 text-th-text-tertiary text-sm">
            <Activity className="w-4 h-4" />
            <span>No recent activity - new events will appear here in real-time</span>
          </div>
        ) : (
          /* Duplicate items for seamless loop */
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

      {/* Controls */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center z-10 pr-3 pl-6 bg-gradient-to-l from-surface-primary via-surface-primary to-transparent">
        <div className="flex items-center gap-1">
          {/* Pause/Play */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1.5 rounded-md hover:bg-surface-tertiary text-th-text-tertiary hover:text-th-text-secondary transition-colors"
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          {/* Close */}
          <button
            onClick={() => setIsVisible(false)}
            className="p-1.5 rounded-md hover:bg-surface-tertiary text-th-text-tertiary hover:text-th-text-secondary transition-colors"
            title="Hide ticker"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Gradient fades for smooth edges */}
      <div className="absolute inset-y-0 left-16 w-8 bg-gradient-to-r from-surface-primary to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-16 w-8 bg-gradient-to-l from-surface-primary to-transparent pointer-events-none" />

      {/* Custom animation keyframes */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

export default NotificationTicker;
