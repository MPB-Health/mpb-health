// ============================================================================
// Admin Notification Ticker Component
// Real-time scrolling ticker for CRM activity and alerts in Admin Portal
// Syncs with CRM app for unified notification experience
// ============================================================================

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { supabase } from '../../lib/supabase';
import { createTickerService, type TickerItem, TICKER_EVENT_CONFIG } from '@mpbhealth/crm-core';
import { createClientLogger } from '@mpbhealth/utils';
import { cn } from '../../lib/utils';

const log = createClientLogger('AdminNotificationTicker');

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
    green: { bg: 'bg-green-500/10', text: 'text-green-600', border: 'border-green-500/20', dot: 'bg-green-500' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20', dot: 'bg-blue-500' },
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-600', border: 'border-violet-500/20', dot: 'bg-violet-500' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
    yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-600', border: 'border-yellow-500/20', dot: 'bg-yellow-500' },
    red: { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/20', dot: 'bg-red-500' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-600', border: 'border-orange-500/20', dot: 'bg-orange-500' },
    indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-600', border: 'border-indigo-500/20', dot: 'bg-indigo-500' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-600', border: 'border-cyan-500/20', dot: 'bg-cyan-500' },
    teal: { bg: 'bg-teal-500/10', text: 'text-teal-600', border: 'border-teal-500/20', dot: 'bg-teal-500' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-600', border: 'border-purple-500/20', dot: 'bg-purple-500' },
    pink: { bg: 'bg-pink-500/10', text: 'text-pink-600', border: 'border-pink-500/20', dot: 'bg-pink-500' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/20', dot: 'bg-amber-500' },
    sky: { bg: 'bg-sky-500/10', text: 'text-sky-600', border: 'border-sky-500/20', dot: 'bg-sky-500' },
    slate: { bg: 'bg-slate-500/10', text: 'text-slate-600', border: 'border-slate-500/20', dot: 'bg-slate-500' },
    gray: { bg: 'bg-gray-500/10', text: 'text-gray-600', border: 'border-gray-500/20', dot: 'bg-gray-500' },
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
      <span className="text-sm text-slate-500 whitespace-nowrap truncate max-w-[200px]">
        {item.message}
      </span>

      {/* Time */}
      <span className="text-xs text-slate-400 whitespace-nowrap">
        {formatTimeAgo(item.timestamp)}
      </span>

      {/* Arrow */}
      <ChevronRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

// ============================================================================
// Main Admin Notification Ticker Component
// ============================================================================

export const AdminNotificationTicker: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Create ticker service instance
  const tickerService = useMemo(() => createTickerService(supabase), []);

  const [items, setItems] = useState<TickerItem[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [newItemIds, setNewItemIds] = useState<Set<string>>(new Set());

  // Load initial items
  useEffect(() => {
    const loadItems = async () => {
      setIsLoading(true);
      try {
        const recentItems = await tickerService.getRecentItems({ limit: 30 });
        setItems(recentItems);
      } catch (error) {
        console.error('[AdminNotificationTicker] Error loading items:', error);
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
      tickerService.cleanup();
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

  // Handle item click
  const handleItemClick = useCallback((item: TickerItem) => {
    // In admin portal, we could open a modal or navigate to the CRM
    // For now, just log and potentially open CRM in new tab
    log.info('Item clicked:', item);

    if (item.entityType && item.entityId) {
      // Could open CRM link
      // window.open(`/crm/leads/${item.entityId}`, '_blank');
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden',
        'bg-gradient-to-r from-white via-slate-50 to-white',
        'border-b border-slate-200',
        'shadow-sm'
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Live indicator */}
      <div className="absolute left-0 top-0 bottom-0 flex items-center z-10 pl-3 pr-6 bg-gradient-to-r from-white via-white to-transparent">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-green-600">
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
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400" />
            <span>Loading activity feed...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
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
      <div className="absolute right-0 top-0 bottom-0 flex items-center z-10 pr-3 pl-6 bg-gradient-to-l from-white via-white to-transparent">
        <div className="flex items-center gap-1">
          {/* Pause/Play */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          {/* Close */}
          <button
            onClick={() => setIsVisible(false)}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title="Hide ticker"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Gradient fades for smooth edges */}
      <div className="absolute inset-y-0 left-16 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-16 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />

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
};

export default AdminNotificationTicker;
