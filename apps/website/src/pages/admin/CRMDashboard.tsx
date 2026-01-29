import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Phone,
  Mail,
  Calendar,
  Download,
  RefreshCw,
  Plus,
  ChevronRight,
  Target,
  Activity,
  Settings
} from 'lucide-react';
import { SEOHead } from '../../components/SEOHead';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { AdminBreadcrumb } from '../../components/admin/AdminBreadcrumb';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { LeadCard } from '../../components/admin/crm/LeadCard';
import { ExportModal } from '../../components/admin/crm/ExportModal';
import { ZohoSettingsPanel } from '../../components/admin/crm/ZohoSettingsPanel';
import { crmService, type Lead, type CRMDashboardStats, type LeadActivity, type LeadTask, type PipelineStage } from '../../lib/crmService';
import { cn } from '../../lib/utils';

const CRMDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<CRMDashboardStats | null>(null);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [recentActivities, setRecentActivities] = useState<LeadActivity[]>([]);
  const [tasksDueToday, setTasksDueToday] = useState<LeadTask[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<LeadTask[]>([]);
  const [leadsByStage, setLeadsByStage] = useState<Record<string, Lead[]>>({});
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showZohoSettings, setShowZohoSettings] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [
        statsData,
        stagesData,
        leadsData,
        activitiesData,
        dueTodayData,
        overdueData,
        leadsByStageData,
      ] = await Promise.all([
        crmService.getDashboardStats(),
        crmService.getPipelineStages(),
        crmService.getLeads({}, 5),
        crmService.getRecentActivities(10),
        crmService.getTasksDueToday(),
        crmService.getOverdueTasks(),
        crmService.getLeadsByStage(),
      ]);

      setStats(statsData);
      setStages(stagesData);
      setRecentLeads(leadsData.leads);
      setRecentActivities(activitiesData);
      setTasksDueToday(dueTodayData);
      setOverdueTasks(overdueData);
      setLeadsByStage(leadsByStageData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatActivityTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const activityIcons: Record<string, React.ElementType> = {
    note: Mail,
    call: Phone,
    email: Mail,
    meeting: Calendar,
    status_change: ArrowRight,
    task_completed: CheckCircle,
  };

  return (
    <AdminLayout activeView="crm-dashboard" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <SEOHead
        title="CRM Dashboard | MPB Health Admin"
        description="Manage leads and track conversions"
      />

      <div className="p-6">
        <AdminBreadcrumb
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'CRM', href: '/admin/crm' },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between mt-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">CRM Dashboard</h1>
            <p className="text-neutral-500">Manage your leads and track conversions</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setShowZohoSettings(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Zoho Settings
            </Button>
            <Button variant="outline" onClick={() => setShowExportModal(true)}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button onClick={loadDashboardData} variant="outline">
              <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
              Refresh
            </Button>
            <Link to="/admin/crm/pipeline">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                View Pipeline
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-500">Total Leads</p>
                      <p className="text-3xl font-bold text-neutral-900">{stats?.total_leads || 0}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center text-sm">
                    <span className="text-green-600 font-medium">+{stats?.new_leads || 0}</span>
                    <span className="text-neutral-500 ml-1">new this period</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-500">Conversion Rate</p>
                      <p className="text-3xl font-bold text-neutral-900">{stats?.conversion_rate || 0}%</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <Target className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center text-sm">
                    <span className="text-neutral-500">Avg. {(stats?.avg_days_to_close || 0).toFixed(1)} days to close</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-500">Tasks Due Today</p>
                      <p className="text-3xl font-bold text-neutral-900">{stats?.tasks_due_today || 0}</p>
                    </div>
                    <div className="p-3 bg-amber-100 rounded-full">
                      <Clock className="h-6 w-6 text-amber-600" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center text-sm">
                    <span className={cn(
                      'font-medium',
                      (stats?.overdue_tasks || 0) > 0 ? 'text-red-600' : 'text-green-600'
                    )}>
                      {stats?.overdue_tasks || 0} overdue
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-500">Pipeline Health</p>
                      <p className="text-3xl font-bold text-neutral-900">
                        {Object.keys(leadsByStage).filter(s => !['won', 'lost'].includes(s)).reduce((sum, stage) => sum + (leadsByStage[stage]?.length || 0), 0)}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <Activity className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center text-sm text-neutral-500">
                    Active leads in pipeline
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pipeline Overview */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pipeline Overview</CardTitle>
                  <Link to="/admin/crm/pipeline" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                    View Full Pipeline <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-4 h-32">
                  {stages.map((stage) => {
                    const count = leadsByStage[stage.name]?.length || 0;
                    const maxCount = Math.max(...Object.values(leadsByStage).map(l => l?.length || 0), 1);
                    const height = (count / maxCount) * 100;

                    return (
                      <div key={stage.name} className="flex-1 flex flex-col items-center">
                        <span className="text-sm font-medium text-neutral-900 mb-1">{count}</span>
                        <div
                          className="w-full rounded-t-lg transition-all"
                          style={{
                            backgroundColor: stage.color,
                            height: `${Math.max(height, 8)}%`,
                            minHeight: '8px',
                          }}
                        />
                        <span className="text-xs text-neutral-500 mt-2 text-center">
                          {stage.display_name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Leads */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Leads</CardTitle>
                    <Link to="/admin/crm/leads" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                      View All <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {recentLeads.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500">
                      <Users className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
                      <p>No leads yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentLeads.map((lead) => (
                        <LeadCard key={lead.id} lead={lead} variant="compact" />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tasks & Activities */}
              <div className="space-y-6">
                {/* Overdue Tasks Alert */}
                {overdueTasks.length > 0 && (
                  <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="h-5 w-5" />
                        <CardTitle className="text-red-700">Overdue Tasks ({overdueTasks.length})</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {overdueTasks.slice(0, 3).map((task) => (
                          <div key={task.id} className="flex items-center justify-between p-2 bg-white rounded-lg">
                            <div>
                              <p className="font-medium text-neutral-900">{task.title}</p>
                              <p className="text-xs text-red-600">
                                Due: {new Date(task.due_date).toLocaleDateString()}
                              </p>
                            </div>
                            <Link
                              to={`/admin/crm/leads/${task.lead_id}`}
                              className="text-sm text-primary-600 hover:text-primary-700"
                            >
                              View Lead
                            </Link>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Tasks Due Today */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-amber-500" />
                      <CardTitle>Due Today ({tasksDueToday.length})</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {tasksDueToday.length === 0 ? (
                      <div className="text-center py-6 text-neutral-500">
                        <CheckCircle className="h-10 w-10 mx-auto mb-2 text-green-500" />
                        <p>All caught up!</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {tasksDueToday.slice(0, 5).map((task) => (
                          <div key={task.id} className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg">
                            <div>
                              <p className="font-medium text-neutral-900">{task.title}</p>
                              <p className="text-xs text-neutral-500">
                                {task.task_type?.replace(/_/g, ' ')}
                              </p>
                            </div>
                            <Link
                              to={`/admin/crm/leads/${task.lead_id}`}
                              className="text-sm text-primary-600 hover:text-primary-700"
                            >
                              View
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentActivities.length === 0 ? (
                      <div className="text-center py-6 text-neutral-500">
                        <Activity className="h-10 w-10 mx-auto mb-2 text-neutral-300" />
                        <p>No recent activity</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentActivities.slice(0, 6).map((activity) => {
                          const Icon = activityIcons[activity.activity_type] || Activity;
                          return (
                            <div key={activity.id} className="flex items-start gap-3">
                              <div className="p-1.5 bg-neutral-100 rounded-full">
                                <Icon className="h-4 w-4 text-neutral-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-neutral-900 truncate">
                                  {activity.title}
                                </p>
                                <p className="text-xs text-neutral-500">
                                  {formatActivityTime(activity.created_at)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && stats && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          exportType="pipeline"
          stats={stats}
          stages={stages}
          leadsByStage={leadsByStage}
        />
      )}

      {/* Zoho Settings Modal */}
      <ZohoSettingsPanel
        isOpen={showZohoSettings}
        onClose={() => setShowZohoSettings(false)}
      />
    </AdminLayout>
  );
};

export default CRMDashboard;
