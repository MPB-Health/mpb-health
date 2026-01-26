import { Link } from 'react-router-dom';
import {
  Users,
  TrendingUp,
  CheckSquare,
  Clock,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import { useCRM } from '../contexts/CRMContext';
import { formatTimeAgo } from '@mpbhealth/crm-core';

export default function Dashboard() {
  const {
    dashboardStats,
    pipelineStages,
    recentLeads,
    tasksDueToday,
    overdueTasks,
    recentActivities,
    loading,
    refreshing,
    refreshDashboard,
  } = useCRM();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Overview of your CRM performance
          </p>
        </div>
        <button
          onClick={refreshDashboard}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">Total Leads</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">
                {dashboardStats?.total_leads || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">New Today</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">
                {dashboardStats?.new_leads || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">Tasks Due Today</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">
                {tasksDueToday.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">Overdue Tasks</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">
                {overdueTasks.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline overview and Recent leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline overview */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-neutral-900">Pipeline</h2>
            <Link
              to="/pipeline"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center"
            >
              View all
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-4">
            {pipelineStages.slice(0, 5).map((stage) => {
              const count = dashboardStats?.leads_by_stage?.[stage.name] || 0;
              const total = dashboardStats?.total_leads || 1;
              const percentage = Math.round((count / total) * 100);

              return (
                <div key={stage.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-neutral-700">
                      {stage.display_name}
                    </span>
                    <span className="text-sm text-neutral-500">{count}</span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: stage.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent leads */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-neutral-900">Recent Leads</h2>
            <Link
              to="/leads"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center"
            >
              View all
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-4">
            {recentLeads.slice(0, 5).map((lead) => (
              <Link
                key={lead.id}
                to={`/leads/${lead.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-700 font-medium text-sm">
                      {lead.first_name.charAt(0)}
                      {lead.last_name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {lead.first_name} {lead.last_name}
                    </p>
                    <p className="text-xs text-neutral-500">{lead.email}</p>
                  </div>
                </div>
                <span className="text-xs text-neutral-400">
                  {formatTimeAgo(lead.created_at)}
                </span>
              </Link>
            ))}
            {recentLeads.length === 0 && (
              <p className="text-sm text-neutral-500 text-center py-4">
                No leads yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-6">
          Recent Activity
        </h2>
        <div className="activity-timeline">
          {recentActivities.slice(0, 5).map((activity) => (
            <div key={activity.id} className="activity-item">
              <p className="text-sm font-medium text-neutral-900">
                {activity.title}
              </p>
              {activity.description && (
                <p className="text-sm text-neutral-500 mt-1">
                  {activity.description}
                </p>
              )}
              <p className="text-xs text-neutral-400 mt-1">
                {formatTimeAgo(activity.created_at)}
              </p>
            </div>
          ))}
          {recentActivities.length === 0 && (
            <p className="text-sm text-neutral-500 text-center py-4">
              No recent activity
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
