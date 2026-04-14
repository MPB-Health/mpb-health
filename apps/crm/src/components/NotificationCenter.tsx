import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Users, CheckSquare, Calendar, Check,
  AlertCircle, AlertTriangle, Eye, CheckCircle2,
  Info, Sparkles,
} from 'lucide-react';
import { useCRM } from '../contexts/CRMContext';
import { formatTimeAgo } from '@mpbhealth/crm-core';
import type { UnifiedNotification } from '@mpbhealth/crm-core';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  lead: Users,
  task: CheckSquare,
  event: Calendar,
};

const PRIORITY_COLORS = {
  normal: '',
  high: 'border-l-2 border-l-orange-400',
  critical: 'border-l-2 border-l-red-500',
};

type SmartCategory = 'attention' | 'fyi' | 'completed';

interface CategorizedNotification extends UnifiedNotification {
  category: SmartCategory;
}

function categorizeNotification(n: UnifiedNotification): SmartCategory {
  if (n.priority === 'critical' || n.priority === 'high') return 'attention';
  if (!n.read && (n.type === 'task' || n.type === 'lead')) return 'attention';

  if (n.read) return 'completed';

  return 'fyi';
}

const CATEGORY_CONFIG: Record<SmartCategory, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string }> = {
  attention: {
    label: 'Needs Your Attention',
    icon: AlertTriangle,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/5',
  },
  fyi: {
    label: 'For Your Information',
    icon: Eye,
    color: 'text-sky-600 dark:text-sky-400',
    bgColor: 'bg-sky-500/5',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-500/5',
  },
};

type ViewMode = 'smart' | 'all';

export function NotificationCenter() {
  const navigate = useNavigate();
  const { notificationCenterService, loading: crmLoading } = useCRM();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<UnifiedNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('smart');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (crmLoading) return;
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30_000);
    return () => clearInterval(interval);
  }, [crmLoading]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const count = await notificationCenterService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to load unread count:', err);
    }
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationCenterService.getNotifications(30);
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!open) loadNotifications();
    setOpen(!open);
  };

  const handleClick = async (notification: UnifiedNotification) => {
    if (!notification.read) {
      await notificationCenterService.markAsRead(notification.id);
      loadUnreadCount();
    }
    if (notification.lead_id) {
      navigate(`/leads/${notification.lead_id}`);
    } else if (notification.type === 'task') {
      navigate('/tasks');
    } else if (notification.type === 'event') {
      navigate('/calendar');
    }
    setOpen(false);
  };

  const handleMarkAllRead = async () => {
    await notificationCenterService.markAllAsRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const categorized = useMemo<Record<SmartCategory, CategorizedNotification[]>>(() => {
    const result: Record<SmartCategory, CategorizedNotification[]> = { attention: [], fyi: [], completed: [] };
    for (const n of notifications) {
      const cat = categorizeNotification(n);
      result[cat].push({ ...n, category: cat });
    }
    return result;
  }, [notifications]);

  const attentionCount = categorized.attention.length;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={handleToggle}
        className="relative p-2 text-th-text-tertiary hover:text-th-text-secondary transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-surface-primary border border-th-border/60 rounded-2xl shadow-2xl dark:shadow-[0_20px_50px_rgb(0_0_0/0.4)] z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-th-border/50">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-th-text-primary">Notifications</h3>
              {attentionCount > 0 && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 tabular-nums">
                  {attentionCount} need action
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex items-center bg-surface-secondary rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('smart')}
                  className={cn(
                    'px-2 py-1 rounded-md text-[10px] font-medium transition-all',
                    viewMode === 'smart' ? 'bg-surface-primary text-th-text-primary shadow-sm' : 'text-th-text-tertiary'
                  )}
                >
                  <Sparkles className="w-3 h-3 inline mr-0.5" />
                  Smart
                </button>
                <button
                  onClick={() => setViewMode('all')}
                  className={cn(
                    'px-2 py-1 rounded-md text-[10px] font-medium transition-all',
                    viewMode === 'all' ? 'bg-surface-primary text-th-text-primary shadow-sm' : 'text-th-text-tertiary'
                  )}
                >
                  All
                </button>
              </div>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-[10px] text-th-accent-500 hover:text-th-accent-600 flex items-center gap-0.5">
                  <Check className="w-3 h-3" /> Read all
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-th-accent-500" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="w-8 h-8 text-th-text-tertiary mx-auto mb-2" />
                <p className="text-sm text-th-text-tertiary">No notifications</p>
              </div>
            ) : viewMode === 'smart' ? (
              <>
                {(['attention', 'fyi', 'completed'] as SmartCategory[]).map((cat) => {
                  const items = categorized[cat];
                  if (items.length === 0) return null;
                  const config = CATEGORY_CONFIG[cat];
                  const CatIcon = config.icon;
                  return (
                    <div key={cat}>
                      <div className={cn('px-4 py-2 flex items-center gap-2', config.bgColor)}>
                        <CatIcon className={cn('w-3.5 h-3.5', config.color)} />
                        <span className={cn('text-[10px] font-semibold uppercase tracking-wider', config.color)}>
                          {config.label}
                        </span>
                        <span className="text-[10px] text-th-text-tertiary tabular-nums">({items.length})</span>
                      </div>
                      {items.map((notification) => (
                        <NotificationItem key={notification.id} notification={notification} onClick={handleClick} />
                      ))}
                    </div>
                  );
                })}
              </>
            ) : (
              notifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} onClick={handleClick} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  notification,
  onClick,
}: {
  notification: UnifiedNotification;
  onClick: (n: UnifiedNotification) => void;
}) {
  const Icon = ICON_MAP[notification.type] || AlertCircle;
  return (
    <button
      onClick={() => onClick(notification)}
      className={cn(
        'w-full text-left px-4 py-3 hover:bg-surface-secondary/60 flex items-start gap-3 transition-colors',
        !notification.read && 'bg-th-accent-500/5',
        PRIORITY_COLORS[notification.priority]
      )}
    >
      <div className={cn(
        'mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0',
        notification.priority === 'critical' ? 'bg-red-500/10' :
        notification.priority === 'high' ? 'bg-amber-500/10' : 'bg-surface-tertiary'
      )}>
        <Icon className={cn(
          'w-4 h-4',
          notification.priority === 'critical' ? 'text-red-500' :
          notification.priority === 'high' ? 'text-amber-500' : 'text-th-text-tertiary'
        )} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', !notification.read ? 'font-medium text-th-text-primary' : 'text-th-text-secondary')}>
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-xs text-th-text-tertiary mt-0.5 line-clamp-2">{notification.body}</p>
        )}
        <p className="text-[10px] text-th-text-tertiary mt-1">
          {formatTimeAgo(notification.created_at)}
        </p>
      </div>
      {!notification.read && (
        <span className="w-2 h-2 bg-th-accent-500 rounded-full mt-2 flex-shrink-0" />
      )}
    </button>
  );
}
