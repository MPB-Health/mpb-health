import { useState, useEffect } from 'react';
import {
  Bell, Smartphone, Send, BarChart3,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  pushAdminService,
  type PushDevice,
  type NotificationEvent,
  type PushAdminStats,
} from '@mpbhealth/admin-core';

export default function PushNotifications() {
  const [stats, setStats] = useState<PushAdminStats | null>(null);
  const [devices, setDevices] = useState<PushDevice[]>([]);
  const [events, setEvents] = useState<NotificationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'devices' | 'events' | 'broadcast'>('overview');

  // Broadcast form
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastType, setBroadcastType] = useState('system_alert');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, d, e] = await Promise.all([
          pushAdminService.getStats(),
          pushAdminService.getDevices(50),
          pushAdminService.getNotificationEvents({ limit: 50 }),
        ]);
        setStats(s);
        setDevices(d);
        setEvents(e);
      } catch (err) {
        console.error('Failed to load push data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleBroadcast = async () => {
    if (!broadcastTitle.trim()) {
      toast.error('Title is required');
      return;
    }
    setSending(true);
    try {
      await pushAdminService.broadcastNotification({
        title: broadcastTitle,
        body: broadcastBody,
        event_type: broadcastType,
      });
      toast.success('Notification sent');
      setBroadcastTitle('');
      setBroadcastBody('');
    } catch {
      toast.error('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-th-text-primary">Push Notifications</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Smartphone} label="Devices" value={stats.total_devices} />
          <StatCard icon={Bell} label="Total Sent" value={stats.total_notifications} />
          <StatCard icon={BarChart3} label="Unread" value={stats.unread_notifications} />
          <StatCard icon={Send} label="Today" value={stats.notifications_today} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-th-border">
        {(['overview', 'devices', 'events', 'broadcast'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-th-accent-600 text-th-accent-600'
                : 'border-transparent text-th-text-tertiary hover:text-th-text-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <h2 className="text-lg font-semibold text-th-text-primary mb-4">Recent Notifications</h2>
          {events.length > 0 ? (
            <div className="divide-y divide-th-border-subtle">
              {events.slice(0, 20).map((evt) => (
                <div key={evt.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-th-text-primary text-sm">{evt.title}</p>
                    {evt.body && <p className="text-xs text-th-text-tertiary">{evt.body}</p>}
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-surface-tertiary text-th-text-secondary">
                      {evt.event_type}
                    </span>
                    <p className="text-xs text-th-text-tertiary mt-1">
                      {new Date(evt.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-th-text-tertiary">No notifications yet</p>
          )}
        </div>
      )}

      {activeTab === 'devices' && (
        <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-secondary border-b border-th-border">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">User ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">Endpoint</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-th-border-subtle">
              {devices.map((d) => (
                <tr key={d.id}>
                  <td className="py-3 px-4 text-sm text-th-text-primary font-mono">{d.user_id.slice(0, 12)}...</td>
                  <td className="py-3 px-4 text-sm text-th-text-secondary truncate max-w-xs">{d.endpoint}</td>
                  <td className="py-3 px-4 text-sm text-th-text-tertiary">{new Date(d.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {devices.length === 0 && (
            <div className="text-center py-12">
              <Smartphone className="w-10 h-10 mx-auto mb-3 text-th-text-tertiary" />
              <p className="text-th-text-tertiary">No registered devices</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'events' && (
        <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-secondary border-b border-th-border">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">Title</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">Read</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-th-border-subtle">
              {events.map((evt) => (
                <tr key={evt.id}>
                  <td className="py-3 px-4">
                    <p className="text-sm text-th-text-primary">{evt.title}</p>
                    {evt.body && <p className="text-xs text-th-text-tertiary truncate max-w-xs">{evt.body}</p>}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-surface-tertiary text-th-text-secondary">
                      {evt.event_type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`w-2 h-2 rounded-full inline-block ${evt.is_read ? 'bg-green-400' : 'bg-blue-400'}`} />
                  </td>
                  <td className="py-3 px-4 text-sm text-th-text-tertiary">{new Date(evt.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'broadcast' && (
        <div className="bg-surface-primary rounded-xl border border-th-border p-6 max-w-lg">
          <h2 className="text-lg font-semibold text-th-text-primary mb-4">Send Broadcast Notification</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">Title</label>
              <input
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="Notification title"
                className="w-full px-4 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">Body</label>
              <textarea
                value={broadcastBody}
                onChange={(e) => setBroadcastBody(e.target.value)}
                placeholder="Notification body text"
                rows={3}
                className="w-full px-4 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">Type</label>
              <select
                value={broadcastType}
                onChange={(e) => setBroadcastType(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary"
              >
                <option value="system_alert">System Alert</option>
                <option value="bulletin_published">Bulletin</option>
                <option value="email_sent">Email</option>
              </select>
            </div>
            <button
              onClick={handleBroadcast}
              disabled={sending || !broadcastTitle.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Sending...' : 'Send Broadcast'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-surface-primary rounded-xl border border-th-border p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-th-text-tertiary" />
        <span className="text-xs text-th-text-tertiary">{label}</span>
      </div>
      <p className="text-2xl font-bold text-th-text-primary">{value.toLocaleString()}</p>
    </div>
  );
}
