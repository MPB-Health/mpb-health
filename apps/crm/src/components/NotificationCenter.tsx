import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Users, CheckSquare, Calendar, Check } from 'lucide-react';
import { useCRM } from '../contexts/CRMContext';
import { formatTimeAgo } from '@mpbhealth/crm-core';
import type { UnifiedNotification } from '@mpbhealth/crm-core';

const ICON_MAP = {
  lead: Users,
  task: CheckSquare,
  event: Calendar,
};

const PRIORITY_COLORS = {
  normal: '',
  high: 'border-l-2 border-l-orange-400',
  critical: 'border-l-2 border-l-red-500',
};

export function NotificationCenter() {
  const navigate = useNavigate();
  const { notificationCenterService } = useCRM();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<UnifiedNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load unread count on mount and periodically
  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30_000); // Every 30s
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
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
    const count = await notificationCenterService.getUnreadCount();
    setUnreadCount(count);
  };

  const loadNotifications = async () => {
    setLoading(true);
    const data = await notificationCenterService.getNotifications(20);
    setNotifications(data);
    setLoading(false);
  };

  const handleToggle = () => {
    if (!open) {
      loadNotifications();
    }
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

  // Group notifications
  const leadNotifs = notifications.filter((n) => n.type === 'lead');
  const taskNotifs = notifications.filter((n) => n.type === 'task');
  const eventNotifs = notifications.filter((n) => n.type === 'event');

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={handleToggle}
        className="relative p-2 text-th-text-tertiary hover:text-th-text-secondary"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-surface-primary border border-th-border rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-th-border">
            <h3 className="text-sm font-semibold text-th-text-primary">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-th-accent-600 hover:text-th-accent-700 flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-th-accent-600" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="w-8 h-8 text-th-text-tertiary mx-auto mb-2" />
                <p className="text-sm text-th-text-tertiary">No notifications</p>
              </div>
            ) : (
              <>
                {leadNotifs.length > 0 && (
                  <NotificationGroup label="New Leads" notifications={leadNotifs} onClick={handleClick} />
                )}
                {taskNotifs.length > 0 && (
                  <NotificationGroup label="Tasks Due" notifications={taskNotifs} onClick={handleClick} />
                )}
                {eventNotifs.length > 0 && (
                  <NotificationGroup label="Upcoming Events" notifications={eventNotifs} onClick={handleClick} />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationGroup({
  label,
  notifications,
  onClick,
}: {
  label: string;
  notifications: UnifiedNotification[];
  onClick: (n: UnifiedNotification) => void;
}) {
  return (
    <div>
      <div className="px-4 py-1.5 bg-surface-secondary">
        <span className="text-[10px] font-semibold text-th-text-tertiary uppercase tracking-wider">
          {label}
        </span>
      </div>
      {notifications.map((notification) => {
        const Icon = ICON_MAP[notification.type];
        return (
          <button
            key={notification.id}
            onClick={() => onClick(notification)}
            className={`w-full text-left px-4 py-3 hover:bg-surface-secondary flex items-start gap-3 ${
              !notification.read ? 'bg-blue-50/50' : ''
            } ${PRIORITY_COLORS[notification.priority]}`}
          >
            <div className="mt-0.5">
              <Icon className="w-4 h-4 text-th-text-tertiary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${!notification.read ? 'font-medium text-th-text-primary' : 'text-th-text-secondary'}`}>
                {notification.title}
              </p>
              {notification.body && (
                <p className="text-xs text-th-text-tertiary mt-0.5">{notification.body}</p>
              )}
              <p className="text-[10px] text-th-text-tertiary mt-0.5">
                {formatTimeAgo(notification.created_at)}
              </p>
            </div>
            {!notification.read && (
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
}
