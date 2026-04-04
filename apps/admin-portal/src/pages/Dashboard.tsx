import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  TrendingUp,
  Activity,
  Heart,
  LifeBuoy,
  Server,
  FileText,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Clock,
  Shield,
  BarChart3,
  Megaphone,
  Video,
  BookOpen,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import {
  analyticsService,
  auditService,
  memberService,
  systemHealthService,
  crmBridgeService,
  analyticsHubService,
  type ActivityMetric,
  type SystemHealthSummary,
  type MemberStats,
  type CRMSummary,
  type AuditLog,
  type CombinedAnalytics,
} from '@mpbhealth/admin-core';
import { MetricCard, useChartTheme } from '@mpbhealth/ui';
import { Smartphone, Globe } from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ContentStats {
  bulletins: number;
  videos: number;
  sops: number;
  handbooks: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const SYSTEM_STATUS_CONFIG = {
  healthy: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30', label: 'All Systems Operational' },
  degraded: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Degraded Performance' },
  down: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30', label: 'System Issues Detected' },
};

function getOverallStatus(health: SystemHealthSummary | null) {
  if (!health) return 'healthy';
  const statuses = health.edgeFunctions.map((f) => f.status);
  if (statuses.some((s) => s === 'down')) return 'down';
  if (statuses.some((s) => s === 'degraded')) return 'degraded';
  return 'healthy';
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, metrics, pendingEnrollments } = useAdmin();
  const chartTheme = useChartTheme();

  const [leadActivity, setLeadActivity] = useState<ActivityMetric[]>([]);
  const [leadSources, setLeadSources] = useState<{ source: string; count: number }[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealthSummary | null>(null);
  const [memberStats, setMemberStats] = useState<MemberStats | null>(null);
  const [crmSummary, setCrmSummary] = useState<CRMSummary | null>(null);
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);
  const [contentStats, setContentStats] = useState<ContentStats | null>(null);
  const [externalAnalytics, setExternalAnalytics] = useState<CombinedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Fire all requests in parallel — each one is independent
      const results = await Promise.allSettled([
        analyticsService.getActivityOverTime('leads', 14),
        analyticsService.getLeadSources(),
        systemHealthService.getHealthSummary(),
        memberService.getStats(),
        crmBridgeService.getCRMSummary(),
        auditService.getLogs({ limit: 8 }),
        loadContentStats(),
        analyticsHubService.getCombinedSummary(),
      ]);

      if (results[0].status === 'fulfilled') setLeadActivity(results[0].value);
      if (results[1].status === 'fulfilled') setLeadSources(results[1].value.slice(0, 5));
      if (results[2].status === 'fulfilled') setSystemHealth(results[2].value);
      if (results[3].status === 'fulfilled') setMemberStats(results[3].value);
      if (results[4].status === 'fulfilled') setCrmSummary(results[4].value);
      if (results[5].status === 'fulfilled') setRecentActivity(results[5].value.logs);
      if (results[6].status === 'fulfilled') setContentStats(results[6].value);
      if (results[7].status === 'fulfilled') setExternalAnalytics(results[7].value);

      setLoading(false);
    };

    load();
  }, []);

  const overallStatus = useMemo(() => getOverallStatus(systemHealth), [systemHealth]);
  const statusConfig = SYSTEM_STATUS_CONFIG[overallStatus];
  const StatusIcon = statusConfig.icon;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  // ── Top-level KPI stats ───────────────────────────────────────────────
  const stats = [
    {
      name: 'Total Users',
      value: metrics?.total_users || 0,
      change: 12,
      icon: Users,
    },
    {
      name: 'Active Advisors',
      value: metrics?.active_advisors || 0,
      change: 5,
      icon: UserPlus,
    },
    {
      name: 'Active Members',
      value: memberStats?.active || 0,
      change: memberStats?.new_this_month || 0,
      icon: Heart,
    },
    {
      name: 'New Leads (Month)',
      value: metrics?.new_leads_this_month || 0,
      change: 23,
      icon: TrendingUp,
    },
    {
      name: 'Conversion Rate',
      value: `${(metrics?.conversion_rate || 0).toFixed(1)}%`,
      change: -2,
      icon: Activity,
    },
    {
      name: 'Pending Enrollments',
      value: pendingEnrollments,
      change: 0,
      icon: Clock,
    },
  ];

  // ── Command center section cards ──────────────────────────────────────
  const commandSections = [
    {
      title: 'CRM Pipeline',
      icon: TrendingUp,
      href: '/crm/dashboard',
      color: 'from-blue-500 to-blue-600',
      metrics: [
        { label: 'Total Leads', value: crmSummary?.total_leads ?? '—' },
        { label: 'New Today', value: crmSummary?.new_today ?? '—' },
        { label: 'Conversion', value: crmSummary ? `${crmSummary.conversion_rate}%` : '—' },
      ],
    },
    {
      title: 'Members',
      icon: Heart,
      href: '/members',
      color: 'from-rose-500 to-rose-600',
      metrics: [
        { label: 'Total', value: memberStats?.total ?? '—' },
        { label: 'Active', value: memberStats?.active ?? '—' },
        { label: 'New This Month', value: memberStats?.new_this_month ?? '—' },
      ],
    },
    {
      title: 'Support',
      icon: LifeBuoy,
      href: '/support/tickets',
      color: 'from-amber-500 to-amber-600',
      metrics: [
        { label: 'Pending Tasks', value: crmSummary?.pending_tasks ?? '—' },
      ],
    },
    {
      title: 'Content',
      icon: FileText,
      href: '/content/bulletins',
      color: 'from-emerald-500 to-emerald-600',
      metrics: [
        { label: 'Bulletins', value: contentStats?.bulletins ?? '—' },
        { label: 'Videos', value: contentStats?.videos ?? '—' },
        { label: 'SOPs', value: contentStats?.sops ?? '—' },
      ],
    },
    {
      title: 'Messaging',
      icon: MessageSquare,
      href: '/messaging/chat',
      color: 'from-purple-500 to-purple-600',
      metrics: [],
    },
    {
      title: 'Champion Enrollment',
      icon: Shield,
      href: '/analytics/unified',
      color: 'from-indigo-500 to-indigo-600',
      metrics: externalAnalytics?.champion_enrollment?.configured
        ? [
            { label: 'Users', value: externalAnalytics.champion_enrollment.total_users },
            { label: 'Agents', value: externalAnalytics.champion_enrollment.total_agents },
            { label: 'Enrollments', value: externalAnalytics.champion_enrollment.total_enrollments },
          ]
        : [{ label: 'Status', value: 'Not configured' }],
    },
    {
      title: 'Mobile App',
      icon: Smartphone,
      href: '/analytics/unified',
      color: 'from-cyan-500 to-cyan-600',
      metrics: externalAnalytics?.mobile_app?.configured
        ? [
            { label: 'Users', value: externalAnalytics.mobile_app.total_users },
            { label: 'Active', value: externalAnalytics.mobile_app.active_users },
            { label: 'Sessions (30d)', value: externalAnalytics.mobile_app.recent_sessions_30d },
          ]
        : [{ label: 'Status', value: 'Not configured' }],
    },
    {
      title: 'Web Traffic',
      icon: Globe,
      href: '/analytics/unified',
      color: 'from-green-500 to-green-600',
      metrics: externalAnalytics?.ga4?.configured
        ? [
            { label: 'Sessions', value: externalAnalytics.ga4.total_sessions.toLocaleString() },
            { label: 'Page Views', value: externalAnalytics.ga4.total_page_views.toLocaleString() },
            { label: 'Bounce', value: `${externalAnalytics.ga4.bounce_rate.toFixed(1)}%` },
          ]
        : [{ label: 'Status', value: 'Not configured' }],
    },
    {
      title: 'System Health',
      icon: Server,
      href: '/system/health',
      color: overallStatus === 'healthy'
        ? 'from-green-500 to-green-600'
        : overallStatus === 'degraded'
          ? 'from-yellow-500 to-yellow-600'
          : 'from-red-500 to-red-600',
      metrics: [
        {
          label: 'Status',
          value: systemHealth
            ? `${systemHealth.edgeFunctions.filter((f) => f.status === 'healthy').length}/${systemHealth.edgeFunctions.length} healthy`
            : '—',
        },
        { label: 'Database', value: systemHealth?.database.connected ? 'Connected' : '—' },
        { label: 'Storage', value: systemHealth ? `${systemHealth.storage.bucketCount} buckets` : '—' },
      ],
    },
  ];

  // ── Quick actions (expanded) ──────────────────────────────────────────
  const quickActions = [
    { icon: Users, label: 'Manage Users', href: '/users' },
    { icon: UserPlus, label: 'Review Enrollments', href: '/enrollments' },
    { icon: TrendingUp, label: 'CRM Leads', href: '/crm/leads' },
    { icon: Heart, label: 'Members', href: '/members' },
    { icon: LifeBuoy, label: 'Support Tickets', href: '/support/tickets' },
    { icon: Megaphone, label: 'New Bulletin', href: '/content/bulletins/new' },
    { icon: FileText, label: 'New Blog Post', href: '/content/blog/new' },
    { icon: Video, label: 'Video Library', href: '/content/videos' },
    { icon: BookOpen, label: 'SOPs', href: '/content/sops' },
    { icon: BarChart3, label: 'Reports', href: '/reports' },
    { icon: Server, label: 'System Health', href: '/system/health' },
    { icon: Shield, label: 'Audit Logs', href: '/audit-logs' },
  ];

  return (
    <div className="space-y-8">
      {/* ── Welcome banner ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[rgb(var(--accent-600))] via-[rgb(var(--accent-700))] to-[rgb(var(--accent-900))] p-8 text-white">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_40%,white_0%,transparent_60%)]" />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-white/70 mb-1 tracking-wide uppercase">
              {greeting}
            </p>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {user?.first_name} {user?.last_name}
            </h1>
            <p className="text-white/60 text-sm max-w-lg">
              Command Center — your unified view across all systems.
            </p>
          </div>

          {/* System status pill */}
          <button
            type="button"
            onClick={() => navigate('/system/health')}
            className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 ${
              overallStatus === 'healthy'
                ? 'bg-green-500/20 text-green-100'
                : overallStatus === 'degraded'
                  ? 'bg-yellow-500/20 text-yellow-100'
                  : 'bg-red-500/20 text-red-100'
            }`}
          >
            <StatusIcon className="w-4 h-4" />
            {statusConfig.label}
          </button>
        </div>
      </div>

      {/* ── Action items alert ─────────────────────────────────────────── */}
      {(pendingEnrollments > 0 || overallStatus !== 'healthy') && (
        <div className="flex flex-col sm:flex-row gap-3">
          {pendingEnrollments > 0 && (
            <button
              type="button"
              onClick={() => navigate('/enrollments')}
              className="flex-1 flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/40 rounded-2xl hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all shadow-sm"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-800/40 rounded-xl flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-amber-800 dark:text-amber-200">
                    {pendingEnrollments} pending enrollment{pendingEnrollments !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Review and approve new applications
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            </button>
          )}

          {overallStatus !== 'healthy' && (
            <button
              type="button"
              onClick={() => navigate('/system/health')}
              className={`flex-1 flex items-center justify-between p-4 rounded-2xl border transition-all shadow-sm ${
                overallStatus === 'degraded'
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200/60 dark:border-yellow-700/40 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200/60 dark:border-red-700/40 hover:bg-red-100 dark:hover:bg-red-900/30'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  overallStatus === 'degraded'
                    ? 'bg-yellow-100 dark:bg-yellow-800/40'
                    : 'bg-red-100 dark:bg-red-800/40'
                }`}>
                  <AlertTriangle className={`w-5 h-5 ${
                    overallStatus === 'degraded'
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                  }`} />
                </div>
                <div className="text-left">
                  <p className={`font-semibold ${
                    overallStatus === 'degraded'
                      ? 'text-yellow-800 dark:text-yellow-200'
                      : 'text-red-800 dark:text-red-200'
                  }`}>
                    {statusConfig.label}
                  </p>
                  <p className={`text-sm ${
                    overallStatus === 'degraded'
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {systemHealth?.edgeFunctions.filter((f) => f.status !== 'healthy').length} service{systemHealth && systemHealth.edgeFunctions.filter((f) => f.status !== 'healthy').length !== 1 ? 's' : ''} affected
                  </p>
                </div>
              </div>
              <ArrowRight className={`w-5 h-5 ${
                overallStatus === 'degraded' ? 'text-yellow-500' : 'text-red-500'
              }`} />
            </button>
          )}
        </div>
      )}

      {/* ── KPI Stats grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {stats.map((stat) => (
          <MetricCard
            key={stat.name}
            label={stat.name}
            value={stat.value}
            icon={<stat.icon className="w-6 h-6" />}
            trend={stat.change !== 0 ? { value: stat.change } : undefined}
          />
        ))}
      </div>

      {/* ── Command Center Grid ────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-th-text-primary mb-5">Command Center</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {commandSections.map((section) => (
            <button
              key={section.title}
              type="button"
              onClick={() => navigate(section.href)}
              className="group text-left bg-surface-primary rounded-2xl border border-th-border hover:border-th-accent-300 dark:hover:border-th-accent-700 transition-all hover:shadow-lg overflow-hidden"
            >
              {/* Colored header strip */}
              <div className={`bg-gradient-to-r ${section.color} px-6 py-4 flex items-center justify-between`}>
                <div className="flex items-center gap-2.5 text-white">
                  <section.icon className="w-5 h-5" />
                  <span className="font-semibold">{section.title}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-white/60 group-hover:translate-x-1 transition-transform" />
              </div>
              {/* Metrics body */}
              <div className="px-6 py-5">
                {section.metrics.length > 0 ? (
                  <div className="flex flex-wrap gap-x-8 gap-y-3">
                    {section.metrics.map((m) => (
                      <div key={m.label}>
                        <p className="text-xs font-medium text-th-text-tertiary mb-1">{m.label}</p>
                        <p className="text-xl font-bold text-th-text-primary">{m.value}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-th-text-tertiary">View details &rarr;</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Charts ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead activity chart */}
        <div className="card-premium p-6">
          <h2 className="font-semibold text-th-text-primary mb-1">Lead Activity</h2>
          <p className="text-xs text-th-text-tertiary mb-6">Last 14 days</p>
          <div className="h-64">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={leadActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: chartTheme.textColor }}
                    tickFormatter={(date) =>
                      new Date(date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                    }
                  />
                  <YAxis tick={{ fontSize: 12, fill: chartTheme.textColor }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartTheme.tooltipBg,
                      border: `1px solid ${chartTheme.tooltipBorder}`,
                      borderRadius: '12px',
                      color: chartTheme.tooltipText,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    }}
                    labelFormatter={(date) =>
                      new Date(date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={chartTheme.colors[1]}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 2, fill: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Lead sources chart */}
        <div className="card-premium p-6">
          <h2 className="font-semibold text-th-text-primary mb-1">Top Lead Sources</h2>
          <p className="text-xs text-th-text-tertiary mb-6">All time</p>
          <div className="h-64">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadSources} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: chartTheme.textColor }} />
                  <YAxis
                    dataKey="source"
                    type="category"
                    tick={{ fontSize: 12, fill: chartTheme.textColor }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartTheme.tooltipBg,
                      border: `1px solid ${chartTheme.tooltipBorder}`,
                      borderRadius: '12px',
                      color: chartTheme.tooltipText,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Bar dataKey="count" fill={chartTheme.colors[1]} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── CRM Pipeline + Recent Activity ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CRM Pipeline Breakdown */}
        {crmSummary && crmSummary.leads_by_stage.length > 0 && (
          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-th-text-primary">CRM Pipeline</h2>
              <button
                type="button"
                onClick={() => navigate('/crm/dashboard')}
                className="text-sm text-th-accent-600 hover:text-th-accent-700 flex items-center gap-1"
              >
                View CRM <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {(() => {
              const totalInPipeline = crmSummary.leads_by_stage.reduce((sum, s) => sum + s.count, 0);
              if (totalInPipeline === 0) return null;
              return (
                <>
                  <div className="flex h-6 rounded-lg overflow-hidden mb-3">
                    {crmSummary.leads_by_stage
                      .filter((s) => s.count > 0)
                      .map((stage) => (
                        <div
                          key={stage.stage}
                          className="relative group"
                          style={{
                            width: `${(stage.count / totalInPipeline) * 100}%`,
                            backgroundColor: stage.color,
                            minWidth: '2px',
                          }}
                        >
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                            <div className="bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-800 text-xs rounded px-2 py-1 whitespace-nowrap">
                              {stage.stage}: {stage.count}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {crmSummary.leads_by_stage
                      .filter((s) => s.count > 0)
                      .map((stage) => (
                        <div key={stage.stage} className="flex items-center gap-1.5 text-xs text-th-text-secondary">
                          <span
                            className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                            style={{ backgroundColor: stage.color }}
                          />
                          {stage.stage} ({stage.count})
                        </div>
                      ))}
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Recent Activity Feed */}
        <div className="card-premium p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-th-text-primary">Recent Activity</h2>
            <button
              type="button"
              onClick={() => navigate('/audit-logs')}
              className="text-sm text-th-accent-600 hover:text-th-accent-700 flex items-center gap-1"
            >
              All Logs <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-th-text-tertiary py-6 text-center">No recent activity</p>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {recentActivity.map((log) => (
                <div key={log.id} className="flex items-start gap-3 py-2 border-b border-th-border/50 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-th-accent-50 dark:bg-th-accent-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Activity className="w-4 h-4 text-th-accent-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-th-text-primary truncate">
                      <span className="font-medium">{log.action}</span>
                      {log.entity_type && (
                        <span className="text-th-text-tertiary"> on {log.entity_type}</span>
                      )}
                    </p>
                    <p className="text-xs text-th-text-tertiary">
                      {timeAgo(log.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Actions ──────────────────────────────────────────────── */}
      <div className="card-premium p-6">
        <h2 className="font-semibold text-th-text-primary mb-1">Quick Actions</h2>
        <p className="text-xs text-th-text-tertiary mb-5">Jump to any area of the platform</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <button
              type="button"
              key={action.href}
              onClick={() => navigate(action.href)}
              className="group flex flex-col items-center p-4 rounded-2xl border border-th-border/60 hover:border-th-accent-300 hover:bg-th-accent-50 dark:hover:bg-th-accent-900/20 transition-all hover:shadow-md"
            >
              <div className="w-10 h-10 rounded-xl bg-th-accent-50 dark:bg-th-accent-900/30 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <action.icon className="w-5 h-5 text-th-accent-600" />
              </div>
              <span className="text-xs font-medium text-th-text-secondary group-hover:text-th-text-primary transition-colors text-center leading-tight">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Content stats loader (counts from multiple tables) ────────────────────────

async function loadContentStats(): Promise<ContentStats> {
  const { supabase } = await import('@mpbhealth/database');

  const [bulletins, videos, sops, handbooks] = await Promise.all([
    supabase
      .from('advisor_content')
      .select('id', { count: 'exact', head: true })
      .eq('content_type', 'bulletin')
      .eq('is_published', true)
      .then((r) => r.count || 0),
    supabase
      .from('advisor_videos')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .then((r) => r.count || 0),
    supabase
      .from('sop_documents')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true)
      .then((r) => r.count || 0),
    supabase
      .from('handbooks')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .then((r) => r.count || 0),
  ]);

  return { bulletins, videos, sops, handbooks };
}
