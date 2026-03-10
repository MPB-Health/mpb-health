import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  TrendingUp,
  Activity,
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
import { analyticsService, type ActivityMetric } from '@mpbhealth/admin-core';
import { GradientHeader, MetricCard, useChartTheme } from '@mpbhealth/ui';
import { useAdmin } from '../contexts/AdminContext';
import CRMOverviewCard from '../components/CRMOverviewCard';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, metrics, pendingEnrollments } = useAdmin();
  const chartTheme = useChartTheme();
  const [leadActivity, setLeadActivity] = useState<ActivityMetric[]>([]);
  const [leadSources, setLeadSources] = useState<{ source: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChartData = async () => {
      try {
        const [activity, sources] = await Promise.all([
          analyticsService.getActivityOverTime('leads', 14),
          analyticsService.getLeadSources(),
        ]);
        setLeadActivity(activity);
        setLeadSources(sources.slice(0, 5));
      } catch (err) {
        console.error('Failed to load chart data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadChartData();
  }, []);

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
  ];

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="space-y-8">
      {/* Premium welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[rgb(var(--accent-600))] via-[rgb(var(--accent-700))] to-[rgb(var(--accent-900))] p-8 text-white">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_40%,white_0%,transparent_60%)]" />
        <div className="relative z-10">
          <p className="text-sm font-medium text-white/70 mb-1 tracking-wide uppercase">
            {greeting}
          </p>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {user?.first_name} {user?.last_name}
          </h1>
          <p className="text-white/60 text-sm max-w-lg">
            Here's what's happening with your platform today.
          </p>
        </div>
      </div>

      {/* Pending enrollments alert */}
      {pendingEnrollments > 0 && (
        <button
          type="button"
          onClick={() => navigate('/enrollments')}
          className="w-full flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/40 rounded-2xl hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all shadow-sm"
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
          <TrendingUp className="w-5 h-5 text-amber-500 dark:text-amber-400" />
        </button>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <MetricCard
            key={stat.name}
            label={stat.name}
            value={stat.value}
            icon={<stat.icon className="w-5 h-5" />}
            trend={{ value: stat.change }}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead activity chart */}
        <div className="card-premium p-6">
          <h2 className="font-semibold text-th-text-primary mb-1">Lead Activity</h2>
          <p className="text-xs text-th-text-tertiary mb-6">Last 14 days</p>
          <div className="h-64">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600"></div>
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600"></div>
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

      {/* CRM Overview */}
      <CRMOverviewCard />

      {/* Quick actions */}
      <div className="card-premium p-6">
        <h2 className="font-semibold text-th-text-primary mb-1">Quick Actions</h2>
        <p className="text-xs text-th-text-tertiary mb-5">Common tasks at a glance</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Users, label: 'Manage Users', href: '/users' },
            { icon: UserPlus, label: 'Review Enrollments', href: '/enrollments' },
            { icon: TrendingUp, label: 'New Blog Post', href: '/content/blog/new' },
            { icon: Activity, label: 'Settings', href: '/settings' },
          ].map((action) => (
            <button
              type="button"
              key={action.href}
              onClick={() => navigate(action.href)}
              className="group flex flex-col items-center p-5 rounded-2xl border border-th-border/60 hover:border-th-accent-300 hover:bg-th-accent-50 dark:hover:bg-th-accent-900/20 transition-all hover:shadow-md"
            >
              <div className="w-12 h-12 rounded-xl bg-th-accent-50 dark:bg-th-accent-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <action.icon className="w-6 h-6 text-th-accent-600" />
              </div>
              <span className="text-sm font-medium text-th-text-secondary group-hover:text-th-text-primary transition-colors">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
