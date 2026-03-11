// ============================================================================
// Alerts Widget
// Shows notifications and high-priority items
// ============================================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, AlertTriangle, Clock, User, ArrowRight, Check, X } from 'lucide-react';
import { useCRM } from '../../../contexts/CRMContext';
import type { BaseWidgetProps } from '../types';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

// ============================================================================
// Alert Types
// ============================================================================

interface Alert {
  id: string;
  type: 'overdue_task' | 'high_priority_lead' | 'upcoming_deadline' | 'system' | 'mention';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
}

// ============================================================================
// Alerts Widget Component
// ============================================================================

export default function AlertsWidget({ config, size }: BaseWidgetProps) {
  const { tasksDueToday, overdueTasks, recentLeads } = useCRM();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const showOnlyUrgent = config.showOnlyUrgent === true;

  useEffect(() => {
    // Generate alerts from CRM data
    const generatedAlerts: Alert[] = [];

    // Overdue tasks
    overdueTasks.forEach((task) => {
      generatedAlerts.push({
        id: `overdue-${task.id}`,
        type: 'overdue_task',
        title: 'Overdue Task',
        message: task.title,
        timestamp: task.due_date || new Date().toISOString(),
        read: false,
        link: '/tasks',
        priority: 'urgent',
      });
    });

    // High priority leads
    recentLeads
      .filter((lead) => lead.priority === 'urgent' || lead.priority === 'high')
      .forEach((lead) => {
        generatedAlerts.push({
          id: `lead-${lead.id}`,
          type: 'high_priority_lead',
          title: 'High Priority Lead',
          message: `${lead.first_name} ${lead.last_name} needs attention`,
          timestamp: lead.created_at || new Date().toISOString(),
          read: false,
          link: `/leads/${lead.id}`,
          priority: lead.priority === 'urgent' ? 'urgent' : 'high',
        });
      });

    // Tasks due today
    tasksDueToday.slice(0, 3).forEach((task) => {
      generatedAlerts.push({
        id: `due-${task.id}`,
        type: 'upcoming_deadline',
        title: 'Due Today',
        message: task.title,
        timestamp: task.due_date || new Date().toISOString(),
        read: false,
        link: '/tasks',
        priority: 'medium',
      });
    });

    // Filter and sort
    let filtered = generatedAlerts.filter((a) => !dismissedIds.has(a.id));
    if (showOnlyUrgent) {
      filtered = filtered.filter((a) => a.priority === 'urgent' || a.priority === 'high');
    }

    // Sort by priority then timestamp
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    filtered.sort((a, b) => {
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (pDiff !== 0) return pDiff;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    setAlerts(filtered.slice(0, 10));
  }, [tasksDueToday, overdueTasks, recentLeads, showOnlyUrgent, dismissedIds]);

  const handleDismiss = (alertId: string) => {
    setDismissedIds((prev) => new Set([...prev, alertId]));
  };

  const handleMarkRead = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, read: true } : a))
    );
  };

  const urgentCount = alerts.filter((a) => a.priority === 'urgent').length;
  const unreadCount = alerts.filter((a) => !a.read).length;

  if (alerts.length === 0) {
    return (
      <div className="p-4 text-center text-th-text-secondary">
        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No alerts</p>
        <p className="text-xs text-th-text-tertiary mt-1">You&apos;re all caught up!</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Summary */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-th-border">
        {urgentCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full text-sm font-medium">
            <AlertTriangle className="h-4 w-4" />
            {urgentCount} urgent
          </div>
        )}
        {unreadCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full text-sm font-medium">
            <Bell className="h-4 w-4" />
            {unreadCount} unread
          </div>
        )}
      </div>

      {/* Alerts List */}
      <div className="space-y-2">
        {alerts.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onDismiss={() => handleDismiss(alert.id)}
            onMarkRead={() => handleMarkRead(alert.id)}
          />
        ))}
      </div>

      <Link
        to="/notifications"
        className="flex items-center justify-center gap-1 mt-4 pt-4 border-t border-th-border text-sm text-blue-600 hover:text-blue-700 transition-colors"
      >
        View all notifications
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

// ============================================================================
// Alert Card Component
// ============================================================================

interface AlertCardProps {
  alert: Alert;
  onDismiss: () => void;
  onMarkRead: () => void;
}

const ALERT_ICONS: Record<string, typeof Bell> = {
  overdue_task: Clock,
  high_priority_lead: User,
  upcoming_deadline: Clock,
  system: Bell,
  mention: User,
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'border-l-red-500 bg-red-50 dark:bg-red-900/10',
  high: 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/10',
  medium: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10',
  low: 'border-l-gray-400 bg-gray-50 dark:bg-gray-700/30',
};

const ICON_COLORS: Record<string, string> = {
  urgent: 'text-red-500',
  high: 'text-orange-500',
  medium: 'text-blue-500',
  low: 'text-gray-500',
};

function AlertCard({ alert, onDismiss, onMarkRead }: AlertCardProps) {
  const Icon = ALERT_ICONS[alert.type] || Bell;

  const content = (
    <>
      <p className={cn('text-sm font-medium', !alert.read && 'text-th-text-primary')}>
        {alert.title}
      </p>
      <p className="text-sm text-th-text-secondary truncate">{alert.message}</p>
      <p className="text-xs text-th-text-tertiary mt-1">{formatTimeAgo(alert.timestamp)}</p>
    </>
  );

  return (
    <div
      className={cn(
        'flex gap-3 p-3 rounded-lg border-l-4 group',
        PRIORITY_COLORS[alert.priority],
        !alert.read && 'ring-1 ring-inset ring-th-border'
      )}
    >
      <div className={cn('mt-0.5', ICON_COLORS[alert.priority])}>
        <Icon className="h-4 w-4" />
      </div>
      {alert.link ? (
        <Link to={alert.link} className="flex-1 min-w-0">
          {content}
        </Link>
      ) : (
        <div className="flex-1 min-w-0">
          {content}
        </div>
      )}
      <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!alert.read && (
          <button
            onClick={(e) => { e.preventDefault(); onMarkRead(); }}
            className="p-1 rounded hover:bg-white/50 text-green-600"
            title="Mark as read"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={(e) => { e.preventDefault(); onDismiss(); }}
          className="p-1 rounded hover:bg-white/50 text-gray-500"
          title="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
