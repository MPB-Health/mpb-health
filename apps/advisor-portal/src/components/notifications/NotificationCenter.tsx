// ============================================================================
// Notification Center — Dropdown panel for notifications + events
// ============================================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Bell,
  Check,
  CheckCheck,
  X,
  Trash2,
  ExternalLink,
  Loader2,
  Users,
  MessageSquare,
  CheckCircle,
  Shield,
  Calendar,
  AlertTriangle,
  Settings,
  Headphones,
  Ticket,
  Megaphone,
  AtSign,
} from 'lucide-react';
import { useNotifications, useUnreadNotificationCount } from '../../hooks/useActivity';
import { useNotificationEvents, useUnreadEventCount } from '../../hooks/useNotificationEvents';
import type { Notification, NotificationCategory } from '@mpbhealth/champion-core';
import type { NotificationEventType } from '@mpbhealth/champion-core';

const CATEGORY_ICONS: Record<NotificationCategory | 'default', typeof Bell> = {
  lead: Users,
  message: MessageSquare,
  task: CheckCircle,
  compliance: Shield,
  meeting: Calendar,
  team: Users,
  system: Bell,
  support: Headphones,
  default: Bell,
};

const CATEGORY_COLORS: Record<NotificationCategory | 'default', string> = {
  lead: 'bg-blue-100 text-blue-600',
  message: 'bg-blue-100 text-blue-600',
  task: 'bg-green-100 text-green-600',
  compliance: 'bg-yellow-100 text-yellow-600',
  meeting: 'bg-orange-100 text-orange-600',
  team: 'bg-pink-100 text-pink-600',
  system: 'bg-gray-100 text-gray-600',
  support: 'bg-purple-100 text-purple-600',
  default: 'bg-gray-100 text-gray-600',
};

const PRIORITY_INDICATORS: Record<string, string> = {
  urgent: 'border-l-4 border-red-500',
  high: 'border-l-4 border-orange-500',
  normal: '',
  low: '',
};

// ── Event type mappings ─────────────────────────────────────────────────────
const EVENT_TYPE_ICONS: Record<string, typeof Bell> = {
  chat_message: MessageSquare,
  chat_mention: AtSign,
  ticket_update: Ticket,
  ticket_reply: Ticket,
  bulletin: Megaphone,
  system: Bell,
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  chat_message: 'bg-blue-100 text-blue-600',
  chat_mention: 'bg-violet-100 text-violet-600',
  ticket_update: 'bg-orange-100 text-orange-600',
  ticket_reply: 'bg-orange-100 text-orange-600',
  bulletin: 'bg-emerald-100 text-emerald-600',
  system: 'bg-gray-100 text-gray-600',
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
}

function NotificationItem({ notification, onMarkRead, onDismiss }: NotificationItemProps) {
  const category = (notification.category as NotificationCategory) || 'default';
  const Icon = CATEGORY_ICONS[category] || Bell;
  const colorClass = CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
  const priorityClass = PRIORITY_INDICATORS[notification.priority] || '';

  return (
    <div
      className={`p-3 hover:bg-surface-secondary transition-colors ${priorityClass} ${
        !notification.is_read ? 'bg-th-accent-50/50' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`p-2 rounded-lg flex-shrink-0 ${colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm ${!notification.is_read ? 'font-semibold' : 'font-medium'} text-th-text-primary line-clamp-2`}>
              {notification.title}
            </p>
            {!notification.is_read && (
              <span className="w-2 h-2 bg-th-accent-600 rounded-full flex-shrink-0 mt-1.5" />
            )}
          </div>

          {notification.body && (
            <p className="text-xs text-th-text-secondary mt-0.5 line-clamp-2">
              {notification.body}
            </p>
          )}

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-th-text-muted">
              {formatRelativeTime(notification.created_at)}
            </span>

            <div className="flex items-center gap-1">
              {notification.action_url && (
                <Link
                  to={notification.action_url}
                  className="p-1 text-th-text-muted hover:text-th-accent-600 rounded transition-colors"
                  title="View"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
              {!notification.is_read && (
                <button
                  onClick={() => onMarkRead(notification.id)}
                  className="p-1 text-th-text-muted hover:text-green-600 rounded transition-colors"
                  title="Mark as read"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => onDismiss(notification.id)}
                className="p-1 text-th-text-muted hover:text-red-600 rounded transition-colors"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Event Item ──────────────────────────────────────────────────────────────
interface EventItemProps {
  event: { id: string; event_type: string; title: string; body: string | null; action_url: string | null; is_read: boolean; created_at: string; actor_name?: string | null };
  onMarkRead: (id: string) => void;
  onNavigate: (url: string) => void;
}

function EventItem({ event, onMarkRead, onNavigate }: EventItemProps) {
  const Icon = EVENT_TYPE_ICONS[event.event_type] || Bell;
  const colorClass = EVENT_TYPE_COLORS[event.event_type] || 'bg-gray-100 text-gray-600';

  return (
    <div
      className={`p-3 hover:bg-surface-secondary transition-colors cursor-pointer ${
        !event.is_read ? 'bg-th-accent-50/50' : ''
      }`}
      onClick={() => {
        if (!event.is_read) onMarkRead(event.id);
        if (event.action_url) onNavigate(event.action_url);
      }}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg flex-shrink-0 ${colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm ${!event.is_read ? 'font-semibold' : 'font-medium'} text-th-text-primary line-clamp-2`}>
              {event.title}
            </p>
            {!event.is_read && (
              <span className="w-2 h-2 bg-th-accent-600 rounded-full flex-shrink-0 mt-1.5" />
            )}
          </div>
          {event.body && (
            <p className="text-xs text-th-text-secondary mt-0.5 line-clamp-2">{event.body}</p>
          )}
          <span className="text-xs text-th-text-muted mt-1 block">
            {formatRelativeTime(event.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
}

type Tab = 'notifications' | 'events';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('notifications');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { count, decrement, reset } = useUnreadNotificationCount();
  const { notifications, loading, markAsRead, dismiss, dismissAll } = useNotifications({
    limit: 20,
  });

  // Toast on new realtime event
  const handleNewEvent = useCallback((event: { title: string; body: string | null; action_url: string | null }) => {
    toast(
      (t) => (
        <div
          className="cursor-pointer"
          onClick={() => {
            toast.dismiss(t.id);
            if (event.action_url) navigate(event.action_url);
          }}
        >
          <p className="font-semibold text-sm">{event.title}</p>
          {event.body && <p className="text-xs text-gray-600 mt-0.5">{event.body}</p>}
        </div>
      ),
      { duration: 8000, icon: '\uD83D\uDD14' },
    );
  }, [navigate]);

  // Events tab data
  const { events, loading: eventsLoading, markAsRead: markEventRead, markAllRead: markAllEventsRead } = useNotificationEvents({ limit: 30, onNewEvent: handleNewEvent });
  const { count: eventCount, decrement: decrementEvent, reset: resetEvents } = useUnreadEventCount();

  const totalBadge = count + eventCount;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (notificationId: string) => {
    await markAsRead([notificationId]);
    decrement(1);
  };

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    await markAsRead(unreadIds);
    reset();
  };

  const handleDismiss = async (notificationId: string) => {
    const notification = notifications.find((n) => n.id === notificationId);
    if (notification && !notification.is_read) {
      decrement(1);
    }
    await dismiss(notificationId);
  };

  const handleDismissAll = async () => {
    await dismissAll();
    reset();
  };

  const unreadNotifications = notifications.filter((n) => !n.is_read);
  const readNotifications = notifications.filter((n) => n.is_read);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-th-text-secondary hover:text-th-text-primary rounded-lg hover:bg-surface-tertiary transition-colors"
      >
        <Bell className="w-5 h-5" />
        {totalBadge > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
            {totalBadge > 99 ? '99+' : totalBadge}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-surface-primary rounded-xl border border-th-border-primary shadow-xl z-50">
          {/* Header with Tabs */}
          <div className="border-b border-th-border-primary">
            <div className="flex items-center justify-between px-4 pt-3 pb-0">
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors relative ${
                    activeTab === 'notifications'
                      ? 'text-th-accent-600 bg-surface-secondary'
                      : 'text-th-text-muted hover:text-th-text-primary'
                  }`}
                >
                  Alerts
                  {count > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('events')}
                  className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors relative ${
                    activeTab === 'events'
                      ? 'text-th-accent-600 bg-surface-secondary'
                      : 'text-th-text-muted hover:text-th-text-primary'
                  }`}
                >
                  Activity
                  {eventCount > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] bg-blue-500 text-white text-[10px] font-bold rounded-full px-1">
                      {eventCount > 99 ? '99+' : eventCount}
                    </span>
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2 pb-2">
                {activeTab === 'notifications' && unreadNotifications.length > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-xs text-th-accent-600 hover:text-th-accent-700 flex items-center gap-1"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                )}
                {activeTab === 'events' && eventCount > 0 && (
                  <button
                    type="button"
                    onClick={async () => { await markAllEventsRead(); resetEvents(); }}
                    className="text-xs text-th-accent-600 hover:text-th-accent-700 flex items-center gap-1"
                    title="Mark all events as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                )}
                <Link
                  to="/settings/notifications"
                  className="p-1 text-th-text-muted hover:text-th-text-primary rounded transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Settings className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {activeTab === 'notifications' ? (
              /* ── Notifications Tab ──────────────────────────────────── */
              loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-th-accent-600" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="w-10 h-10 text-th-text-muted mx-auto mb-3" />
                  <p className="text-th-text-secondary">No notifications</p>
                  <p className="text-xs text-th-text-muted mt-1">You&apos;re all caught up!</p>
                </div>
              ) : (
                <>
                  {unreadNotifications.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-surface-secondary">
                        <span className="text-xs font-medium text-th-text-muted uppercase tracking-wider">
                          New ({unreadNotifications.length})
                        </span>
                      </div>
                      <div className="divide-y divide-th-border-primary">
                        {unreadNotifications.map((notification) => (
                          <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onMarkRead={handleMarkRead}
                            onDismiss={handleDismiss}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {readNotifications.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-surface-secondary">
                        <span className="text-xs font-medium text-th-text-muted uppercase tracking-wider">
                          Earlier
                        </span>
                      </div>
                      <div className="divide-y divide-th-border-primary">
                        {readNotifications.slice(0, 10).map((notification) => (
                          <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onMarkRead={handleMarkRead}
                            onDismiss={handleDismiss}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )
            ) : (
              /* ── Events Tab ─────────────────────────────────────────── */
              eventsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-th-accent-600" />
                </div>
              ) : events.length === 0 ? (
                <div className="py-12 text-center">
                  <MessageSquare className="w-10 h-10 text-th-text-muted mx-auto mb-3" />
                  <p className="text-th-text-secondary">No activity yet</p>
                  <p className="text-xs text-th-text-muted mt-1">Chat messages and ticket updates will appear here</p>
                </div>
              ) : (
                <div className="divide-y divide-th-border-primary">
                  {events.map((event) => (
                    <EventItem
                      key={event.id}
                      event={event}
                      onMarkRead={(id) => {
                        markEventRead([id]);
                        decrementEvent(1);
                      }}
                      onNavigate={(url) => {
                        setIsOpen(false);
                        navigate(url);
                      }}
                    />
                  ))}
                </div>
              )
            )}
          </div>

          {/* Footer */}
          {activeTab === 'notifications' && notifications.length > 0 && (
            <div className="flex items-center justify-end px-4 py-3 border-t border-th-border-primary">
              <button
                onClick={handleDismissAll}
                className="text-xs text-th-text-muted hover:text-red-600 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
