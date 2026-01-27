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

  return (
    <div className="space-y-6">
      {/* Header */}
      <GradientHeader
        title={`Welcome back, ${user?.first_name}`}
        subtitle="Here's what's happening with your platform today."
      />

      {/* Pending enrollments alert */}
      {pendingEnrollments > 0 && (
        <button
          onClick={() => navigate('/enrollments')}
          className="w-full flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-xl hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-800/40 rounded-full flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="text-left">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                {pendingEnrollments} pending enrollment{pendingEnrollments !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                Review and approve new applications
              </p>
            </div>
          </div>
          <TrendingUp className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        </button>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <h2 className="font-semibold text-th-text-primary mb-6">Lead Activity</h2>
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
                      borderRadius: '8px',
                      color: chartTheme.tooltipText,
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
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Lead sources chart */}
        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <h2 className="font-semibold text-th-text-primary mb-6">Top Lead Sources</h2>
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
                      borderRadius: '8px',
                      color: chartTheme.tooltipText,
                    }}
                  />
                  <Bar dataKey="count" fill={chartTheme.colors[1]} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* CRM Overview */}
      <CRMOverviewCard />

      {/* Quick actions */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <h2 className="font-semibold text-th-text-primary mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/users')}
            className="flex flex-col items-center p-4 rounded-lg border border-th-border hover:border-th-accent-300 hover:bg-th-accent-50 dark:hover:bg-th-accent-900/20 transition-colors"
          >
            <Users className="w-8 h-8 text-th-accent-600 mb-2" />
            <span className="text-sm font-medium text-th-text-secondary">Manage Users</span>
          </button>
          <button
            onClick={() => navigate('/enrollments')}
            className="flex flex-col items-center p-4 rounded-lg border border-th-border hover:border-th-accent-300 hover:bg-th-accent-50 dark:hover:bg-th-accent-900/20 transition-colors"
          >
            <UserPlus className="w-8 h-8 text-th-accent-600 mb-2" />
            <span className="text-sm font-medium text-th-text-secondary">
              Review Enrollments
            </span>
          </button>
          <button
            onClick={() => navigate('/content/blog/new')}
            className="flex flex-col items-center p-4 rounded-lg border border-th-border hover:border-th-accent-300 hover:bg-th-accent-50 dark:hover:bg-th-accent-900/20 transition-colors"
          >
            <TrendingUp className="w-8 h-8 text-th-accent-600 mb-2" />
            <span className="text-sm font-medium text-th-text-secondary">New Blog Post</span>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="flex flex-col items-center p-4 rounded-lg border border-th-border hover:border-th-accent-300 hover:bg-th-accent-50 dark:hover:bg-th-accent-900/20 transition-colors"
          >
            <Activity className="w-8 h-8 text-th-accent-600 mb-2" />
            <span className="text-sm font-medium text-th-text-secondary">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
