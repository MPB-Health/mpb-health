import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart2,
  TrendingUp,
  Users,
  Target,
  Clock,
  Award,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { SEOHead } from '../../components/SEOHead';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { AdminBreadcrumb } from '../../components/admin/AdminBreadcrumb';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { crmService } from '../../lib/crmService';
import { aiTaskClusterService } from '../../lib/aiTaskClusterService';
import { cn } from '../../lib/utils';

// ============================================================================
// Types
// ============================================================================

interface ReportStats {
  totalLeads: number;
  newLeadsThisPeriod: number;
  leadsChange: number;
  conversions: number;
  conversionRate: number;
  conversionChange: number;
  avgDaysToClose: number;
  avgDaysChange: number;
  totalTasks: number;
  tasksCompleted: number;
  taskCompletionRate: number;
}

interface LeadSourceStats {
  source: string;
  count: number;
  conversions: number;
  conversionRate: number;
}

interface StageDistribution {
  stage: string;
  count: number;
  percentage: number;
  color: string;
}

interface TeamMemberStats {
  name: string;
  email: string;
  leads: number;
  conversions: number;
  conversionRate: number;
  tasksCompleted: number;
  avgResponseTime: string;
}

type DateRange = '7d' | '30d' | '90d' | 'ytd' | 'custom';

// ============================================================================
// Stat Card Component
// ============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor,
  iconBg,
}) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {change >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              )}
              <span className={cn(
                'text-sm font-medium',
                change >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {Math.abs(change)}%
              </span>
              {changeLabel && (
                <span className="text-sm text-gray-500">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', iconBg)}>
          <Icon className={cn('h-6 w-6', iconColor)} />
        </div>
      </div>
    </CardContent>
  </Card>
);

// ============================================================================
// Conversion Funnel Component
// ============================================================================

interface FunnelProps {
  stages: StageDistribution[];
}

const ConversionFunnel: React.FC<FunnelProps> = ({ stages }) => {
  const maxCount = Math.max(...stages.map(s => s.count));

  return (
    <div className="space-y-3">
      {stages.map((stage, i) => (
        <div key={stage.stage} className="relative">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">{stage.stage}</span>
            <span className="text-sm text-gray-500">
              {stage.count} ({stage.percentage.toFixed(1)}%)
            </span>
          </div>
          <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
            <div
              className="h-full rounded-lg transition-all duration-500"
              style={{
                width: `${(stage.count / maxCount) * 100}%`,
                backgroundColor: stage.color,
              }}
            />
          </div>
          {i < stages.length - 1 && (
            <div className="absolute left-1/2 -bottom-2 transform -translate-x-1/2 text-gray-400">
              ↓
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// Team Leaderboard Component
// ============================================================================

interface LeaderboardProps {
  members: TeamMemberStats[];
}

const TeamLeaderboard: React.FC<LeaderboardProps> = ({ members }) => {
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Rank</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Team Member</th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Leads</th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Conversions</th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Rate</th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Tasks</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member, i) => (
            <tr key={member.email} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-4">
                <span className="text-lg">{medals[i] || `#${i + 1}`}</span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{member.name}</div>
                    <div className="text-xs text-gray-500">{member.avgResponseTime} avg response</div>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4 text-center">
                <span className="font-semibold text-blue-600">{member.leads}</span>
              </td>
              <td className="py-3 px-4 text-center">
                <span className="font-semibold text-green-600">{member.conversions}</span>
              </td>
              <td className="py-3 px-4 text-center">
                <span className={cn(
                  'px-2 py-1 rounded-full text-xs font-medium',
                  member.conversionRate >= 30 ? 'bg-green-100 text-green-700' :
                  member.conversionRate >= 20 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                )}>
                  {member.conversionRate.toFixed(1)}%
                </span>
              </td>
              <td className="py-3 px-4 text-center text-gray-600">{member.tasksCompleted}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================================
// Lead Sources Chart Component
// ============================================================================

interface SourcesChartProps {
  sources: LeadSourceStats[];
}

const LeadSourcesChart: React.FC<SourcesChartProps> = ({ sources }) => {
  const maxCount = Math.max(...sources.map(s => s.count));
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-4">
      {sources.map((source, i) => (
        <div key={source.source}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">{source.source}</span>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-500">{source.count} leads</span>
              <span className={cn(
                'px-2 py-0.5 rounded text-xs font-medium',
                source.conversionRate >= 25 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              )}>
                {source.conversionRate.toFixed(1)}% CVR
              </span>
            </div>
          </div>
          <div className="h-6 bg-gray-100 rounded overflow-hidden flex">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${(source.count / maxCount) * 100}%`,
                backgroundColor: colors[i % colors.length],
              }}
            />
            {source.conversions > 0 && (
              <div
                className="h-full bg-green-500"
                style={{
                  width: `${(source.conversions / source.count) * (source.count / maxCount) * 100}%`,
                }}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// Main CRM Reports Page
// ============================================================================

const CRMReports: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [stats, setStats] = useState<ReportStats>({
    totalLeads: 0,
    newLeadsThisPeriod: 0,
    leadsChange: 0,
    conversions: 0,
    conversionRate: 0,
    conversionChange: 0,
    avgDaysToClose: 0,
    avgDaysChange: 0,
    totalTasks: 0,
    tasksCompleted: 0,
    taskCompletionRate: 0,
  });
  const [stageDistribution, setStageDistribution] = useState<StageDistribution[]>([]);
  const [leadSources, setLeadSources] = useState<LeadSourceStats[]>([]);
  const [teamStats, setTeamStats] = useState<TeamMemberStats[]>([]);
  const [aiInsights, setAiInsights] = useState({
    averageScore: 0,
    hotLeads: 0,
    urgentFollowUps: 0,
    scoreDistribution: {} as Record<string, number>,
  });

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      // Get date range
      const endDate = new Date();
      const startDate = new Date();
      switch (dateRange) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case 'ytd':
          startDate.setMonth(0, 1);
          break;
      }

      // Load all data in parallel
      const [
        dashboardStats,
        stages,
        leadsByStage,
        allLeads,
        aiSummary,
      ] = await Promise.all([
        crmService.getDashboardStats(),
        crmService.getPipelineStages(),
        crmService.getLeadsByStage(),
        crmService.getLeads({
          dateFrom: startDate.toISOString(),
          dateTo: endDate.toISOString(),
        }, 1000),
        aiTaskClusterService.getInsightsSummary(),
      ]);

      // Calculate stats
      const leads = allLeads.leads;
      const wonLeads = leads.filter(l => l.pipeline_stage === 'won');
      const conversions = wonLeads.length;
      const conversionRate = leads.length > 0 ? (conversions / leads.length) * 100 : 0;

      setStats({
        totalLeads: dashboardStats?.total_leads || 0,
        newLeadsThisPeriod: leads.length,
        leadsChange: 12, // Mock - would calculate from previous period
        conversions,
        conversionRate,
        conversionChange: 5, // Mock
        avgDaysToClose: dashboardStats?.avg_days_to_close || 0,
        avgDaysChange: -8, // Mock (negative is good)
        totalTasks: (dashboardStats?.tasks_due_today || 0) + (dashboardStats?.overdue_tasks || 0),
        tasksCompleted: 0, // Would need separate query
        taskCompletionRate: 75, // Mock
      });

      // Calculate stage distribution
      const totalInPipeline = Object.values(leadsByStage).flat().length;
      const distribution = stages.map(stage => ({
        stage: stage.display_name,
        count: leadsByStage[stage.name]?.length || 0,
        percentage: totalInPipeline > 0 
          ? ((leadsByStage[stage.name]?.length || 0) / totalInPipeline) * 100 
          : 0,
        color: stage.color,
      }));
      setStageDistribution(distribution);

      // Calculate lead sources
      const sourceMap = new Map<string, { count: number; conversions: number }>();
      leads.forEach(lead => {
        const source = lead.source_cta || 'Direct';
        if (!sourceMap.has(source)) {
          sourceMap.set(source, { count: 0, conversions: 0 });
        }
        const current = sourceMap.get(source)!;
        current.count++;
        if (lead.pipeline_stage === 'won') {
          current.conversions++;
        }
      });

      const sources = Array.from(sourceMap.entries())
        .map(([source, data]) => ({
          source,
          count: data.count,
          conversions: data.conversions,
          conversionRate: data.count > 0 ? (data.conversions / data.count) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
      setLeadSources(sources);

      // Mock team stats (would come from actual user data)
      setTeamStats([
        {
          name: 'Leonardo Moraes',
          email: 'leonardo@mympb.com',
          leads: 45,
          conversions: 12,
          conversionRate: 26.7,
          tasksCompleted: 89,
          avgResponseTime: '2.3h',
        },
        {
          name: 'Team Member 2',
          email: 'team2@mympb.com',
          leads: 38,
          conversions: 9,
          conversionRate: 23.7,
          tasksCompleted: 67,
          avgResponseTime: '3.1h',
        },
        {
          name: 'Team Member 3',
          email: 'team3@mympb.com',
          leads: 32,
          conversions: 8,
          conversionRate: 25.0,
          tasksCompleted: 54,
          avgResponseTime: '2.8h',
        },
      ]);

      setAiInsights(aiSummary);
    } catch (error) {
      console.error('Failed to load report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Generate CSV export
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Leads', stats.totalLeads],
      ['New Leads (Period)', stats.newLeadsThisPeriod],
      ['Conversions', stats.conversions],
      ['Conversion Rate', `${stats.conversionRate.toFixed(1)}%`],
      ['Avg Days to Close', stats.avgDaysToClose],
      ['Task Completion Rate', `${stats.taskCompletionRate}%`],
    ];

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crm-report-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <AdminLayout activeView="crm-reports" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <SEOHead
        title="CRM Reports | MPB Health Admin"
        description="Analytics and performance reports for CRM"
      />

      <div className="p-6">
        <AdminBreadcrumb
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'CRM', href: '/admin/crm' },
            { label: 'Reports' },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between mt-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CRM Reports</h1>
            <p className="text-gray-500">Analytics and performance insights</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="ytd">Year to date</option>
            </select>
            <Button variant="outline" onClick={loadReportData}>
              <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                title="Total Leads"
                value={stats.totalLeads}
                change={stats.leadsChange}
                changeLabel="vs last period"
                icon={Users}
                iconColor="text-blue-600"
                iconBg="bg-blue-100"
              />
              <StatCard
                title="Conversion Rate"
                value={`${stats.conversionRate.toFixed(1)}%`}
                change={stats.conversionChange}
                changeLabel="vs last period"
                icon={Target}
                iconColor="text-green-600"
                iconBg="bg-green-100"
              />
              <StatCard
                title="Avg Days to Close"
                value={stats.avgDaysToClose.toFixed(1)}
                change={stats.avgDaysChange}
                changeLabel="days"
                icon={Clock}
                iconColor="text-amber-600"
                iconBg="bg-amber-100"
              />
              <StatCard
                title="AI Hot Leads"
                value={aiInsights.hotLeads}
                icon={TrendingUp}
                iconColor="text-red-600"
                iconBg="bg-red-100"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Conversion Funnel */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-primary-600" />
                    Conversion Funnel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ConversionFunnel stages={stageDistribution} />
                </CardContent>
              </Card>

              {/* Lead Sources */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Lead Sources Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {leadSources.length > 0 ? (
                    <LeadSourcesChart sources={leadSources} />
                  ) : (
                    <div className="flex items-center justify-center h-48 text-gray-400">
                      No source data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* AI Insights */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  AI Lead Score Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {Object.entries(aiInsights.scoreDistribution).map(([tier, count]) => (
                    <div key={tier} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{count}</div>
                      <div className="text-sm text-gray-500 capitalize">
                        {tier.replace(/[()]/g, '').replace(/\d+-?\d*/g, '').trim()}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{tier}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-primary-600">
                      {aiInsights.averageScore}
                    </div>
                    <div className="text-sm text-gray-500">Avg Score</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-red-600">
                      {aiInsights.hotLeads}
                    </div>
                    <div className="text-sm text-gray-500">Hot Leads</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-amber-600">
                      {aiInsights.urgentFollowUps}
                    </div>
                    <div className="text-sm text-gray-500">Urgent Follow-ups</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-600" />
                  Team Performance Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                {teamStats.length > 0 ? (
                  <TeamLeaderboard members={teamStats} />
                ) : (
                  <div className="flex items-center justify-center h-48 text-gray-400">
                    No team data available
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default CRMReports;

