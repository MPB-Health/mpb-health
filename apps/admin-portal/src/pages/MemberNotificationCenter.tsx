import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Bell, Search, Filter, Clock, Eye, EyeOff, Settings,
  RefreshCw, BarChart3, AlertCircle,
  CheckCircle, ArrowUpRight, Inbox, Activity, Shield,
} from 'lucide-react';
import {
  memberNotificationService,
  getDepartmentLabel,
  DEPARTMENT_OPTIONS,
  EVENT_TYPE_LABELS,
  type MemberNotificationAdmin,
  type MemberAccountEvent,
  type MemberNotificationRule,
  type MemberNotificationStats,
  type AccountEventType,
} from '@mpbhealth/admin-core';

type Tab = 'notifications' | 'events' | 'rules';

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  normal: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  low: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
};

const CATEGORY_STYLES: Record<string, string> = {
  membership: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  billing: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  profile: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  eligibility: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  dependents: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  documents: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  coverage: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  claims: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  support: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  account: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  general: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
};

export default function MemberNotificationCenter() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('notifications');

  const [notifications, setNotifications] = useState<MemberNotificationAdmin[]>([]);
  const [notifTotal, setNotifTotal] = useState(0);
  const [events, setEvents] = useState<MemberAccountEvent[]>([]);
  const [eventTotal, setEventTotal] = useState(0);
  const [rules, setRules] = useState<MemberNotificationRule[]>([]);
  const [stats, setStats] = useState<MemberNotificationStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [readFilter, setReadFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const { notifications: data, total } = await memberNotificationService.getMemberNotifications({
        category: categoryFilter || undefined,
        priority: priorityFilter || undefined,
        is_read: readFilter === '' ? undefined : readFilter === 'read',
        limit: 50,
      });
      setNotifications(data);
      setNotifTotal(total);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, [categoryFilter, priorityFilter, readFilter]);

  const loadEvents = useCallback(async () => {
    try {
      const { events: data, total } = await memberNotificationService.getAccountEvents({
        actor_department: departmentFilter || undefined,
        limit: 50,
      });
      setEvents(data);
      setEventTotal(total);
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  }, [departmentFilter]);

  const loadRules = useCallback(async () => {
    try {
      const data = await memberNotificationService.getRules();
      setRules(data);
    } catch (err) {
      console.error('Failed to load rules:', err);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await memberNotificationService.getNotificationStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadNotifications(), loadEvents(), loadRules(), loadStats()]);
    setLoading(false);
  }, [loadNotifications, loadEvents, loadRules, loadStats]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleToggleRule = async (rule: MemberNotificationRule) => {
    try {
      await memberNotificationService.updateRule(rule.id, { is_enabled: !rule.is_enabled });
      toast.success(`Rule ${rule.is_enabled ? 'disabled' : 'enabled'}`);
      await loadRules();
    } catch {
      toast.error('Failed to update rule');
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { key: 'notifications', label: 'Member Notifications', icon: Bell, count: notifTotal },
    { key: 'events', label: 'Account Events', icon: Activity, count: eventTotal },
    { key: 'rules', label: 'Notification Rules', icon: Settings, count: rules.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Member Notification Center</h1>
          <p className="text-sm text-th-text-tertiary mt-1">
            Manage member-facing notifications generated from account changes
          </p>
        </div>
        <button
          onClick={loadAll}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-surface-primary border border-th-border rounded-lg hover:bg-surface-secondary transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Bell} label="Total Notifications" value={stats.total} color="text-th-text-primary" />
          <StatCard icon={EyeOff} label="Unread by Members" value={stats.unread} color="text-blue-600" />
          <StatCard icon={Clock} label="Last 24 Hours" value={stats.recent_24h} color="text-green-600" />
          <StatCard
            icon={BarChart3}
            label="Top Category"
            value={Object.entries(stats.by_category).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
            color="text-purple-600"
            isText
          />
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-th-border">
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-th-accent-600 text-th-accent-600'
                  : 'border-transparent text-th-text-tertiary hover:text-th-text-primary hover:border-th-border'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-surface-tertiary text-th-text-secondary">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'notifications' && (
        <NotificationsTab
          notifications={notifications}
          total={notifTotal}
          loading={loading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          readFilter={readFilter}
          setReadFilter={setReadFilter}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          onNavigateToMember={(memberId: string) => navigate(`/members/${memberId}`)}
        />
      )}

      {activeTab === 'events' && (
        <EventsTab
          events={events}
          total={eventTotal}
          loading={loading}
          departmentFilter={departmentFilter}
          setDepartmentFilter={setDepartmentFilter}
          onNavigateToMember={(memberId: string) => navigate(`/members/${memberId}`)}
        />
      )}

      {activeTab === 'rules' && (
        <RulesTab rules={rules} onToggle={handleToggleRule} />
      )}
    </div>
  );
}

// ── Notifications Tab ──────────────────────────────────────────────

function NotificationsTab({
  notifications, total, loading, searchQuery, setSearchQuery,
  categoryFilter, setCategoryFilter, priorityFilter, setPriorityFilter,
  readFilter, setReadFilter, showFilters, setShowFilters,
  onNavigateToMember,
}: {
  notifications: MemberNotificationAdmin[];
  total: number;
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  priorityFilter: string;
  setPriorityFilter: (v: string) => void;
  readFilter: string;
  setReadFilter: (v: string) => void;
  showFilters: boolean;
  setShowFilters: (v: boolean) => void;
  onNavigateToMember: (id: string) => void;
}) {
  const filtered = searchQuery
    ? notifications.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : notifications;

  return (
    <div className="space-y-4">
      {/* Search + Filter toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-th-text-tertiary" />
          <input
            type="text"
            placeholder="Search notifications by title or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm border rounded-lg transition-colors ${
            showFilters
              ? 'bg-th-accent-50 border-th-accent-200 text-th-accent-700'
              : 'bg-surface-primary border-th-border text-th-text-secondary hover:bg-surface-secondary'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {(categoryFilter || priorityFilter || readFilter) && (
            <span className="w-2 h-2 rounded-full bg-th-accent-500" />
          )}
        </button>
      </div>

      {/* Filter row */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 bg-surface-secondary rounded-lg">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
            className="px-3 py-2 text-sm bg-surface-primary border border-th-border rounded-lg text-th-text-primary"
          >
            <option value="">All Categories</option>
            {Object.keys(CATEGORY_STYLES).map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            aria-label="Filter by priority"
            className="px-3 py-2 text-sm bg-surface-primary border border-th-border rounded-lg text-th-text-primary"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
          <select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value)}
            aria-label="Filter by read status"
            className="px-3 py-2 text-sm bg-surface-primary border border-th-border rounded-lg text-th-text-primary"
          >
            <option value="">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
          <button
            onClick={() => { setCategoryFilter(''); setPriorityFilter(''); setReadFilter(''); }}
            className="px-3 py-2 text-sm text-th-text-tertiary hover:text-th-text-primary transition-colors"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Results summary */}
      <p className="text-sm text-th-text-tertiary">
        Showing {filtered.length} of {total} notifications
      </p>

      {/* Notification list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-th-text-tertiary">
          <Inbox className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-lg font-medium">No notifications found</p>
          <p className="text-sm mt-1">Notifications will appear here when account changes are made</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notif) => (
            <div
              key={notif.id}
              className="flex items-start gap-4 p-4 bg-surface-primary border border-th-border rounded-xl hover:shadow-sm transition-shadow"
            >
              <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${notif.is_read ? 'bg-neutral-300 dark:bg-neutral-600' : 'bg-blue-500'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-semibold text-th-text-primary">{notif.title}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${PRIORITY_STYLES[notif.priority] || PRIORITY_STYLES.normal}`}>
                    {notif.priority}
                  </span>
                  {notif.category && (
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full capitalize ${CATEGORY_STYLES[notif.category] || CATEGORY_STYLES.general}`}>
                      {notif.category}
                    </span>
                  )}
                </div>
                <p className="text-sm text-th-text-secondary mb-2">{notif.message}</p>
                <div className="flex items-center gap-4 text-xs text-th-text-tertiary flex-wrap">
                  {notif.actor_department && (
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      {notif.actor_department}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(notif.created_at).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    {notif.is_read ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {notif.is_read ? `Read ${notif.read_at ? new Date(notif.read_at).toLocaleDateString() : ''}` : 'Unread'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onNavigateToMember(notif.member_id)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-th-accent-600 hover:bg-th-accent-50 rounded-lg transition-colors flex-shrink-0"
              >
                View Member
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Events Tab ─────────────────────────────────────────────────────

function EventsTab({
  events, total, loading, departmentFilter, setDepartmentFilter, onNavigateToMember,
}: {
  events: MemberAccountEvent[];
  total: number;
  loading: boolean;
  departmentFilter: string;
  setDepartmentFilter: (v: string) => void;
  onNavigateToMember: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          aria-label="Filter by department"
          className="px-3 py-2 text-sm bg-surface-primary border border-th-border rounded-lg text-th-text-primary"
        >
          <option value="">All Departments</option>
          {DEPARTMENT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <p className="text-sm text-th-text-tertiary ml-auto">
          {total} event{total !== 1 ? 's' : ''}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-th-text-tertiary">
          <Activity className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-lg font-medium">No account events yet</p>
          <p className="text-sm mt-1">Events are recorded when staff make changes to member accounts</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-th-border">
                <th className="text-left py-3 px-4 text-th-text-tertiary font-medium">Event Type</th>
                <th className="text-left py-3 px-4 text-th-text-tertiary font-medium">Department</th>
                <th className="text-left py-3 px-4 text-th-text-tertiary font-medium">Entity</th>
                <th className="text-center py-3 px-4 text-th-text-tertiary font-medium">Notified</th>
                <th className="text-left py-3 px-4 text-th-text-tertiary font-medium">When</th>
                <th className="text-right py-3 px-4 text-th-text-tertiary font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-th-border-subtle">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-surface-secondary transition-colors">
                  <td className="py-3 px-4">
                    <span className="text-th-text-primary font-medium">
                      {EVENT_TYPE_LABELS[event.event_type as AccountEventType] || event.event_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-th-text-secondary">
                    {getDepartmentLabel(event.actor_department)}
                  </td>
                  <td className="py-3 px-4 text-th-text-tertiary text-xs font-mono">
                    {event.entity_type || '-'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {event.notification_generated ? (
                      <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                    ) : event.should_notify_member ? (
                      <AlertCircle className="w-4 h-4 text-yellow-500 mx-auto" />
                    ) : (
                      <span className="text-xs text-th-text-tertiary">Skipped</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-th-text-tertiary text-xs">
                    {new Date(event.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onNavigateToMember(event.member_id)}
                      className="text-xs text-th-accent-600 hover:underline"
                    >
                      View Member
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Rules Tab ──────────────────────────────────────────────────────

function RulesTab({
  rules, onToggle,
}: {
  rules: MemberNotificationRule[];
  onToggle: (rule: MemberNotificationRule) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-th-text-tertiary">
          {rules.length} notification rule{rules.length !== 1 ? 's' : ''} configured.
          Rules determine which account changes trigger member notifications.
        </p>
      </div>

      {rules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-th-text-tertiary">
          <Settings className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-lg font-medium">No rules configured</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`p-4 bg-surface-primary border rounded-xl transition-all ${
                rule.is_enabled ? 'border-th-border' : 'border-th-border opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-semibold text-th-text-primary">
                      {EVENT_TYPE_LABELS[rule.event_type as AccountEventType] || rule.event_type}
                    </span>
                    {rule.category && (
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full capitalize ${CATEGORY_STYLES[rule.category] || CATEGORY_STYLES.general}`}>
                        {rule.category}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${PRIORITY_STYLES[rule.priority] || PRIORITY_STYLES.normal}`}>
                      {rule.priority}
                    </span>
                    <span className="text-[10px] text-th-text-tertiary">
                      Dept: {rule.department === '*' ? 'All' : getDepartmentLabel(rule.department)}
                    </span>
                  </div>
                  <p className="text-xs text-th-text-secondary mt-1">
                    <strong>Title:</strong> {rule.title_template}
                  </p>
                  <p className="text-xs text-th-text-tertiary mt-0.5 line-clamp-2">
                    <strong>Message:</strong> {rule.message_template}
                  </p>
                </div>
                <button
                  onClick={() => onToggle(rule)}
                  aria-label={`${rule.is_enabled ? 'Disable' : 'Enable'} ${rule.event_type} rule`}
                  className={`flex-shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    rule.is_enabled ? 'bg-green-500' : 'bg-neutral-300 dark:bg-neutral-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      rule.is_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  isText,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  color: string;
  isText?: boolean;
}) {
  return (
    <div className="bg-surface-primary rounded-xl border border-th-border p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-th-text-tertiary">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color} ${isText ? '!text-base' : ''}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  );
}
