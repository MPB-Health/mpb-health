import { useState, useEffect, useCallback } from 'react';
import { Download, Clock, Users as UsersIcon, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { GradientHeader } from '@mpbhealth/ui';
import { useCRM } from '../contexts/CRMContext';
import { DateRangePicker } from '../components/DateRangePicker';
import { ConversionFunnel } from '../components/ConversionFunnel';
import type {
  ReportDateRange,
  ConversionFunnelData,
  LeadSourceBreakdown,
  ResponseTimeMetrics,
  TeamPerformanceRow,
} from '@mpbhealth/crm-core';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#22C55E', '#EF4444'];

export default function Reports() {
  const { dashboardStats, pipelineStages, reportingService } = useCRM();

  const [dateRange, setDateRange] = useState<ReportDateRange | null>(null);
  const [funnel, setFunnel] = useState<ConversionFunnelData[]>([]);
  const [sources, setSources] = useState<LeadSourceBreakdown[]>([]);
  const [responseTime, setResponseTime] = useState<ResponseTimeMetrics | null>(null);
  const [team, setTeam] = useState<TeamPerformanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
    setLoading(true);
    const range = dateRange ?? undefined;
    const [f, s, r, t] = await Promise.all([
      reportingService.getConversionFunnel(range),
      reportingService.getLeadSourceBreakdown(range),
      reportingService.getResponseTimeMetrics(range),
      reportingService.getTeamPerformance(range),
    ]);
    setFunnel(f);
    setSources(s);
    setResponseTime(r);
    setTeam(t);
    setLoading(false);
  }, [reportingService, dateRange]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Existing pipeline/priority data
  const pipelineData = pipelineStages.map((stage) => ({
    name: stage.display_name,
    count: dashboardStats?.leads_by_stage?.[stage.name] || 0,
    color: stage.color,
  }));

  const priorityData = [
    { name: 'Low', value: dashboardStats?.leads_by_priority?.low || 0 },
    { name: 'Medium', value: dashboardStats?.leads_by_priority?.medium || 0 },
    { name: 'High', value: dashboardStats?.leads_by_priority?.high || 0 },
    { name: 'Urgent', value: dashboardStats?.leads_by_priority?.urgent || 0 },
  ].filter((d) => d.value > 0);

  const handleExport = () => {
    if (team.length === 0) return;
    const headers = ['user_email', 'leads_assigned', 'leads_converted', 'conversion_rate', 'tasks_completed', 'activities_logged'];
    const csv = reportingService.exportCSV(headers, team as unknown as Record<string, unknown>[]);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crm-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <GradientHeader title="Reports" subtitle="Analytics and performance metrics" />

      {/* Date range + export */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-th-text-secondary border border-th-border rounded-lg hover:bg-surface-secondary transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <p className="text-sm text-th-text-tertiary">Total Leads</p>
          <p className="text-3xl font-bold text-th-text-primary mt-2">
            {dashboardStats?.total_leads || 0}
          </p>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <p className="text-sm text-th-text-tertiary">Conversion Rate</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {dashboardStats?.conversion_rate?.toFixed(1) || 0}%
          </p>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <p className="text-sm text-th-text-tertiary">Avg Days to Close</p>
          <p className="text-3xl font-bold text-th-text-primary mt-2">
            {dashboardStats?.avg_days_to_close?.toFixed(0) || 0}
          </p>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <p className="text-sm text-th-text-tertiary">New Today</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {dashboardStats?.new_leads || 0}
          </p>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <h2 className="text-lg font-semibold text-th-text-primary mb-6">Conversion Funnel</h2>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
          </div>
        ) : (
          <ConversionFunnel data={funnel} />
        )}
      </div>

      {/* Two-column: Sources + Response Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Sources */}
        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <h2 className="text-lg font-semibold text-th-text-primary mb-6">Lead Sources</h2>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
            </div>
          ) : sources.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sources.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <YAxis
                    dataKey="source"
                    type="category"
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    width={90}
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
            </div>
          ) : (
            <p className="text-sm text-th-text-tertiary text-center py-8">No source data available.</p>
          )}
        </div>

        {/* Response Time */}
        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <h2 className="text-lg font-semibold text-th-text-primary mb-6">Response Time</h2>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
            </div>
          ) : responseTime ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-surface-tertiary rounded-lg">
                <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-th-text-primary">{responseTime.avg_first_contact_hours}h</p>
                <p className="text-xs text-th-text-tertiary mt-1">Avg First Contact</p>
              </div>
              <div className="text-center p-4 bg-surface-tertiary rounded-lg">
                <Clock className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-th-text-primary">{responseTime.median_first_contact_hours}h</p>
                <p className="text-xs text-th-text-tertiary mt-1">Median First Contact</p>
              </div>
              <div className="text-center p-4 bg-surface-tertiary rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-th-text-primary">{responseTime.within_1h_percent}%</p>
                <p className="text-xs text-th-text-tertiary mt-1">Within 1 Hour</p>
              </div>
              <div className="text-center p-4 bg-surface-tertiary rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-th-text-primary">{responseTime.within_24h_percent}%</p>
                <p className="text-xs text-th-text-tertiary mt-1">Within 24 Hours</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Team Performance */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <div className="flex items-center gap-2 mb-6">
          <UsersIcon className="w-5 h-5 text-th-text-tertiary" />
          <h2 className="text-lg font-semibold text-th-text-primary">Team Performance</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
          </div>
        ) : team.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-th-border text-left text-th-text-tertiary">
                  <th className="py-2 pr-4 font-medium">User</th>
                  <th className="py-2 pr-4 font-medium text-right">Assigned</th>
                  <th className="py-2 pr-4 font-medium text-right">Converted</th>
                  <th className="py-2 pr-4 font-medium text-right">Conv %</th>
                  <th className="py-2 pr-4 font-medium text-right">Tasks Done</th>
                  <th className="py-2 font-medium text-right">Activities</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border-subtle">
                {team.map((row) => (
                  <tr key={row.user_id}>
                    <td className="py-2.5 pr-4 font-medium text-th-text-primary">{row.user_email}</td>
                    <td className="py-2.5 pr-4 text-right text-th-text-secondary">{row.leads_assigned}</td>
                    <td className="py-2.5 pr-4 text-right text-th-text-secondary">{row.leads_converted}</td>
                    <td className="py-2.5 pr-4 text-right text-green-600 font-medium">{row.conversion_rate}%</td>
                    <td className="py-2.5 pr-4 text-right text-th-text-secondary">{row.tasks_completed}</td>
                    <td className="py-2.5 text-right text-th-text-secondary">{row.activities_logged}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-th-text-tertiary text-center py-8">No team data available.</p>
        )}
      </div>

      {/* Existing charts: Pipeline + Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <h2 className="text-lg font-semibold text-th-text-primary mb-6">Pipeline Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#E5E7EB' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#E5E7EB' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px', color: '#F8FAFC' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <h2 className="text-lg font-semibold text-th-text-primary mb-6">Leads by Priority</h2>
          <div className="h-80">
            {priorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {priorityData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px', color: '#F8FAFC' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-th-text-tertiary">
                No priority data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline stages table */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <h2 className="text-lg font-semibold text-th-text-primary mb-6">Pipeline Stage Breakdown</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b border-th-border">
              <th className="text-left py-3 text-sm font-medium text-th-text-tertiary">Stage</th>
              <th className="text-right py-3 text-sm font-medium text-th-text-tertiary">Count</th>
              <th className="text-right py-3 text-sm font-medium text-th-text-tertiary">Percentage</th>
            </tr>
          </thead>
          <tbody>
            {pipelineStages.map((stage) => {
              const count = dashboardStats?.leads_by_stage?.[stage.name] || 0;
              const total = dashboardStats?.total_leads || 1;
              const percentage = ((count / total) * 100).toFixed(1);
              return (
                <tr key={stage.id} className="border-b border-th-border-subtle">
                  <td className="py-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                      <span className="text-sm font-medium text-th-text-primary">{stage.display_name}</span>
                    </div>
                  </td>
                  <td className="text-right py-3 text-sm text-th-text-secondary">{count}</td>
                  <td className="text-right py-3 text-sm text-th-text-secondary">{percentage}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
