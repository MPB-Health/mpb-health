import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
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
import { useAdmin } from '../contexts/AdminContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, metrics, pendingEnrollments } = useAdmin();
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
      change: '+12%',
      trend: 'up',
      icon: Users,
      color: 'blue',
    },
    {
      name: 'Active Advisors',
      value: metrics?.active_advisors || 0,
      change: '+5%',
      trend: 'up',
      icon: UserPlus,
      color: 'green',
    },
    {
      name: 'New Leads (Month)',
      value: metrics?.new_leads_this_month || 0,
      change: '+23%',
      trend: 'up',
      icon: TrendingUp,
      color: 'purple',
    },
    {
      name: 'Conversion Rate',
      value: `${(metrics?.conversion_rate || 0).toFixed(1)}%`,
      change: '-2%',
      trend: 'down',
      icon: Activity,
      color: 'yellow',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          Welcome back, {user?.first_name}
        </h1>
        <p className="text-neutral-500 text-sm mt-1">
          Here's what's happening with your platform today.
        </p>
      </div>

      {/* Pending enrollments alert */}
      {pendingEnrollments > 0 && (
        <button
          onClick={() => navigate('/enrollments')}
          className="w-full flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-xl hover:bg-yellow-100 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-yellow-800">
                {pendingEnrollments} pending enrollment{pendingEnrollments !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-yellow-600">
                Review and approve new applications
              </p>
            </div>
          </div>
          <ArrowUpRight className="w-5 h-5 text-yellow-600" />
        </button>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-xl border border-neutral-200 p-5"
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${stat.color}-100`}
              >
                <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
              </div>
              <div
                className={`flex items-center space-x-1 text-sm ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                <span>{stat.change}</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-neutral-900 mt-3">{stat.value}</p>
            <p className="text-sm text-neutral-500">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead activity chart */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="font-semibold text-neutral-900 mb-6">Lead Activity</h2>
          <div className="h-64">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={leadActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    tickFormatter={(date) =>
                      new Date(date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                    }
                  />
                  <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#F8FAFC',
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
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Lead sources chart */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="font-semibold text-neutral-900 mb-6">Top Lead Sources</h2>
          <div className="h-64">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadSources} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <YAxis
                    dataKey="source"
                    type="category"
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                    }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h2 className="font-semibold text-neutral-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/users')}
            className="flex flex-col items-center p-4 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <Users className="w-8 h-8 text-primary-600 mb-2" />
            <span className="text-sm font-medium text-neutral-700">Manage Users</span>
          </button>
          <button
            onClick={() => navigate('/enrollments')}
            className="flex flex-col items-center p-4 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <UserPlus className="w-8 h-8 text-primary-600 mb-2" />
            <span className="text-sm font-medium text-neutral-700">
              Review Enrollments
            </span>
          </button>
          <button
            onClick={() => navigate('/content/blog/new')}
            className="flex flex-col items-center p-4 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <TrendingUp className="w-8 h-8 text-primary-600 mb-2" />
            <span className="text-sm font-medium text-neutral-700">New Blog Post</span>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="flex flex-col items-center p-4 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <Activity className="w-8 h-8 text-primary-600 mb-2" />
            <span className="text-sm font-medium text-neutral-700">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
