import { useState, useEffect, useCallback } from 'react';
import { Bell, Mail, Smartphone, Loader2, RefreshCw, Filter, CheckCircle, Circle } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  notificationRuleService,
  type NotificationRule,
  type NotificationEventLog,
  type NotificationRuleStats,
} from '@mpbhealth/admin-core';

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  new_lead: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  hot_lead: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  task_reminder: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  daily_digest: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  weekly_summary: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
};

export default function NotificationRules() {
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [events, setEvents] = useState<NotificationEventLog[]>([]);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [stats, setStats] = useState<NotificationRuleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] = useState('');

  // 8s loading timeout
  useEffect(() => {
    if (!loading) { setTimedOut(false); return; }
    const timer = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, [loading]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rulesData, eventsData, typesData, statsData] = await Promise.all([
        notificationRuleService.getAllRules(),
        notificationRuleService.getRecentEvents(50),
        notificationRuleService.getEventTypes(),
        notificationRuleService.getStats(),
      ]);
      setRules(rulesData);
      setEvents(eventsData);
      setEventTypes(typesData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load notification data:', err);
      toast.error('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleToggle(rule: NotificationRule, field: string, currentValue: boolean) {
    try {
      await notificationRuleService.updateRule(rule.id, { [field]: !currentValue });
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, [field]: !currentValue, updated_at: new Date().toISOString() } : r))
      );
    } catch {
      toast.error('Failed to update notification rule');
    }
  }

  const filteredEvents = eventTypeFilter
    ? events.filter((e) => e.event_type === eventTypeFilter)
    : events;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-th-accent-600 animate-spin" />
        {timedOut && (
          <div className="mt-4 text-center">
            <p className="text-sm text-th-text-tertiary">Loading is taking longer than expected.</p>
            <button type="button" onClick={load} className="mt-2 text-sm text-th-accent-600 hover:underline">
              Retry
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Notification Rules</h1>
          <p className="text-sm text-th-text-tertiary mt-1">Manage notification preferences and view event log</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-th-text-secondary hover:bg-surface-secondary border border-th-border rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Rules', value: stats.totalRules, icon: Bell, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
            { label: 'Email Enabled', value: stats.emailEnabled, icon: Mail, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
            { label: 'Push Enabled', value: stats.pushEnabled, icon: Smartphone, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400' },
            { label: 'Events (7d)', value: stats.recentEvents, icon: Bell, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400' },
          ].map((s) => (
            <div key={s.label} className="bg-surface-primary rounded-xl border border-th-border p-4 flex items-center space-x-4">
              <div className={`p-3 rounded-xl ${s.color}`}><s.icon className="w-5 h-5" /></div>
              <div>
                <p className="text-2xl font-bold text-th-text-primary">{s.value}</p>
                <p className="text-sm text-th-text-tertiary">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Section 1: Notification Preferences */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        <div className="px-5 py-4 border-b border-th-border">
          <h2 className="text-lg font-semibold text-th-text-primary">Notification Preferences</h2>
          <p className="text-sm text-th-text-tertiary mt-0.5">Toggle notification channels per user</p>
        </div>
        {rules.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-secondary border-b border-th-border">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">User ID</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-th-text-secondary">Email</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-th-text-secondary">Push</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-th-text-secondary">Daily Digest</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-th-text-secondary">Weekly Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border-subtle">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-surface-tertiary transition-colors">
                    <td className="py-3 px-4">
                      <span className="text-sm font-mono text-th-text-primary">{rule.user_id.slice(0, 8)}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={rule.email_enabled}
                        onChange={() => handleToggle(rule, 'email_enabled', rule.email_enabled)}
                        className="rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={rule.push_enabled}
                        onChange={() => handleToggle(rule, 'push_enabled', rule.push_enabled)}
                        className="rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={rule.email_daily_digest}
                        onChange={() => handleToggle(rule, 'email_daily_digest', rule.email_daily_digest)}
                        className="rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={rule.email_weekly_summary}
                        onChange={() => handleToggle(rule, 'email_weekly_summary', rule.email_weekly_summary)}
                        className="rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
            <p className="text-th-text-tertiary">No notification rules configured</p>
          </div>
        )}
      </div>

      {/* Section 2: Recent Events */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        <div className="px-5 py-4 border-b border-th-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-th-text-primary">Recent Events</h2>
            <p className="text-sm text-th-text-tertiary mt-0.5">Last 50 notification events</p>
          </div>
          {eventTypes.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-th-text-tertiary" />
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="px-3 py-1.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm"
              >
                <option value="">All Types</option>
                {eventTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        {filteredEvents.length > 0 ? (
          <div className="divide-y divide-th-border-subtle">
            {filteredEvents.map((evt) => (
              <div key={evt.id} className="px-5 py-3 flex items-start gap-3 hover:bg-surface-tertiary transition-colors">
                <div className="pt-0.5 shrink-0">
                  {evt.is_read ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-th-text-tertiary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${EVENT_TYPE_COLORS[evt.event_type] || 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'}`}>
                      {evt.event_type}
                    </span>
                    <span className="font-medium text-th-text-primary text-sm">{evt.title}</span>
                  </div>
                  {evt.body && (
                    <p className="text-sm text-th-text-tertiary mt-0.5 line-clamp-1">{evt.body}</p>
                  )}
                </div>
                <span className="text-xs text-th-text-tertiary shrink-0 whitespace-nowrap">
                  {relativeTime(evt.created_at)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
            <p className="text-th-text-tertiary">No events found</p>
          </div>
        )}
      </div>
    </div>
  );
}
