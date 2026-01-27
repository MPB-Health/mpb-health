import { Link } from 'react-router-dom';
import {
  Users,
  TrendingUp,
  CheckSquare,
  Clock,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import { GradientHeader, MetricCard } from '@mpbhealth/ui';
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <GradientHeader
          title="Dashboard"
          subtitle="Overview of your CRM performance"
        />
        <button
          onClick={refreshDashboard}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Leads"
          value={dashboardStats?.total_leads || 0}
          icon={<Users className="w-5 h-5" />}
        />
        <MetricCard
          label="New Today"
          value={dashboardStats?.new_leads || 0}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <MetricCard
          label="Tasks Due Today"
          value={tasksDueToday.length}
          icon={<CheckSquare className="w-5 h-5" />}
        />
        <MetricCard
          label="Overdue Tasks"
          value={overdueTasks.length}
          icon={<Clock className="w-5 h-5" />}
        />
      </div>

      {/* Pipeline overview and Recent leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline overview */}
        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-th-text-primary">Pipeline</h2>
            <Link
              to="/pipeline"
              className="text-sm text-th-accent-600 hover:text-th-accent-700 font-medium flex items-center"
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
                    <span className="text-sm font-medium text-th-text-secondary">
                      {stage.display_name}
                    </span>
                    <span className="text-sm text-th-text-tertiary">{count}</span>
                  </div>
                  <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
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
        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-th-text-primary">Recent Leads</h2>
            <Link
              to="/leads"
              className="text-sm text-th-accent-600 hover:text-th-accent-700 font-medium flex items-center"
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
                className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-secondary transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-th-accent-100 rounded-full flex items-center justify-center">
                    <span className="text-th-accent-700 font-medium text-sm">
                      {lead.first_name.charAt(0)}
                      {lead.last_name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-th-text-primary">
                      {lead.first_name} {lead.last_name}
                    </p>
                    <p className="text-xs text-th-text-tertiary">{lead.email}</p>
                  </div>
                </div>
                <span className="text-xs text-th-text-tertiary">
                  {formatTimeAgo(lead.created_at)}
                </span>
              </Link>
            ))}
            {recentLeads.length === 0 && (
              <p className="text-sm text-th-text-tertiary text-center py-4">
                No leads yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <h2 className="text-lg font-semibold text-th-text-primary mb-6">
          Recent Activity
        </h2>
        <div className="activity-timeline">
          {recentActivities.slice(0, 5).map((activity) => (
            <div key={activity.id} className="activity-item">
              <p className="text-sm font-medium text-th-text-primary">
                {activity.title}
              </p>
              {activity.description && (
                <p className="text-sm text-th-text-tertiary mt-1">
                  {activity.description}
                </p>
              )}
              <p className="text-xs text-th-text-tertiary mt-1">
                {formatTimeAgo(activity.created_at)}
              </p>
            </div>
          ))}
          {recentActivities.length === 0 && (
            <p className="text-sm text-th-text-tertiary text-center py-4">
              No recent activity
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
