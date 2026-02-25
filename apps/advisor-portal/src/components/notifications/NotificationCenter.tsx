// ============================================================================
// Notification Center — Dropdown panel for notifications
// ============================================================================

import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import { useNotifications, useUnreadNotificationCount } from '../../hooks/useActivity';
import type { Notification, NotificationCategory } from '@mpbhealth/champion-core';

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

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { count, decrement, reset } = useUnreadNotificationCount();
  const { notifications, loading, markAsRead, dismiss, dismissAll } = useNotifications({
    limit: 20,
  });

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
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-surface-primary rounded-xl border border-th-border-primary shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-th-border-primary">
            <h3 className="font-semibold text-th-text-primary">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadNotifications.length > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-th-accent-600 hover:text-th-accent-700 flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
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

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-th-accent-600" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-10 h-10 text-th-text-muted mx-auto mb-3" />
                <p className="text-th-text-secondary">No notifications</p>
                <p className="text-xs text-th-text-muted mt-1">You're all caught up!</p>
              </div>
            ) : (
              <>
                {/* Unread Section */}
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

                {/* Read Section */}
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
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
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
