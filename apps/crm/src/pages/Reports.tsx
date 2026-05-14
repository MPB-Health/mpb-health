import { useState, useEffect, useCallback, useMemo } from 'react';
import { Download, Clock, Users as UsersIcon, TrendingUp, Shield, UserCheck, AlertTriangle, Phone, XCircle, Briefcase } from 'lucide-react';
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
import { useOrg } from '../contexts/OrgContext';
import { supabase } from '../lib/supabase';
import { DateRangePicker } from '../components/DateRangePicker';
import { ConversionFunnel } from '../components/ConversionFunnel';
import { PLAN_TYPE_LABELS } from '@mpbhealth/crm-core';
import { HelpBanner } from '../components/help';
import type {
  ReportDateRange,
  ConversionFunnelData,
  LeadSourceBreakdown,
  ResponseTimeMetrics,
  TeamPerformanceRow,
} from '@mpbhealth/crm-core';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#22C55E', '#EF4444'];

interface PlanTypeStat {
  plan_type: string;
  total_count: number;
  new_today: number;
  new_this_week: number;
  new_this_month: number;
}

interface AdvisorStat {
  advisor_id: string;
  advisor_email: string;
  advisor_name: string;
  total_leads: number;
  new_leads_this_month: number;
  converted_leads: number;
  open_tasks: number;
  overdue_tasks: number;
  activities_this_month: number;
}

const PLAN_COLORS: Record<string, string> = {
  healthshare: '#10B981',
  traditional: '#3B82F6',
  unspecified: '#9CA3AF',
};

export default function Reports() {
  const { dashboardStats, pipelineStages, reportingService } = useCRM();
  const { activeOrgId } = useOrg();

  const [dateRange, setDateRange] = useState<ReportDateRange | null>(null);
  const [funnel, setFunnel] = useState<ConversionFunnelData[]>([]);
  const [sources, setSources] = useState<LeadSourceBreakdown[]>([]);
  const [responseTime, setResponseTime] = useState<ResponseTimeMetrics | null>(null);
  const [team, setTeam] = useState<TeamPerformanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [planTypeStats, setPlanTypeStats] = useState<PlanTypeStat[]>([]);
  const [advisorStats, setAdvisorStats] = useState<AdvisorStat[]>([]);
  const [callBreakdown, setCallBreakdown] = useState<{ regular: number; cancel: number }>({
    regular: 0,
    cancel: 0,
  });
  // Section 12 / Round 6 Addendum lock: Special Projects time feeds
  // per-rep AND per-project rollups in Reports. The view
  // crm_v_special_project_rollup (Round 7) aggregates by (org_id, user_id,
  // project_label, project_type_id, log_date) so we can do both rollups
  // on the client.
  const [projectRollupRows, setProjectRollupRows] = useState<
    Array<{
      user_id: string;
      project_label: string;
      project_type_id: string | null;
      log_date: string;
      total_minutes: number;
      entry_count: number;
    }>
  >([]);
  const [repNameLookup, setRepNameLookup] = useState<Map<string, string>>(new Map());

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

    if (activeOrgId) {
      const [planRes, advisorRes] = await Promise.all([
        supabase.rpc('crm_plan_type_stats', { p_org_id: activeOrgId }),
        supabase.rpc('crm_advisor_performance', { p_org_id: activeOrgId }),
      ]);
      if (planRes.data) setPlanTypeStats(planRes.data as unknown as PlanTypeStat[]);
      if (advisorRes.data) setAdvisorStats(advisorRes.data as unknown as AdvisorStat[]);

      // Round 7 — Cancellation Calls counted separately in every report
      // (Daily Log, Weekly, Monthly, Activity Analytics — Sec 2/3/4).
      // Pull from crm_v_call_breakdown so the figure stays in lockstep
      // with the Daily Log Admin View.
      const fromDate = dateRange?.from ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const toDate = dateRange?.to ?? new Date().toISOString().slice(0, 10);
      const callRes = await supabase
        .from('crm_v_call_breakdown')
        .select('regular_calls,cancellation_calls')
        .eq('org_id', activeOrgId)
        .gte('log_date', fromDate)
        .lte('log_date', toDate);
      if (callRes.data) {
        let regular = 0;
        let cancel = 0;
        for (const r of callRes.data as Array<{
          regular_calls: number;
          cancellation_calls: number;
        }>) {
          regular += r.regular_calls ?? 0;
          cancel += r.cancellation_calls ?? 0;
        }
        setCallBreakdown({ regular, cancel });
      }

      // Section 12 / Round 10: Special Projects rollups (per-rep + per-project).
      // Pulls every row in the date range; the per-rep and per-project tiles
      // are derived from this set with useMemo below so we only hit the DB
      // once per date-range change.
      const projRes = await supabase
        .from('crm_v_special_project_rollup')
        .select('user_id,project_label,project_type_id,log_date,total_minutes,entry_count')
        .eq('org_id', activeOrgId)
        .gte('log_date', fromDate)
        .lte('log_date', toDate);
      if (projRes.data) {
        const rows = projRes.data as Array<{
          user_id: string;
          project_label: string;
          project_type_id: string | null;
          log_date: string;
          total_minutes: number;
          entry_count: number;
        }>;
        setProjectRollupRows(rows);

        // Hydrate a quick id → display-name map for the per-rep tile so
        // we can show "Jane Doe — 2h 15m" rather than a raw UUID.
        const ids = Array.from(new Set(rows.map((r) => r.user_id)));
        if (ids.length) {
          const profRes = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', ids);
          if (profRes.data) {
            const map = new Map<string, string>();
            for (const p of profRes.data as Array<{ id: string; full_name: string | null; email: string | null }>) {
              map.set(p.id, p.full_name?.trim() || p.email || p.id);
            }
            setRepNameLookup(map);
          }
        } else {
          setRepNameLookup(new Map());
        }
      } else {
        setProjectRollupRows([]);
        setRepNameLookup(new Map());
      }
    }
    setLoading(false);
  }, [reportingService, dateRange, activeOrgId]);

  // Per-rep and per-project rollups derived from crm_v_special_project_rollup.
  const projectByRep = useMemo(() => {
    const m = new Map<string, { user_id: string; minutes: number; entries: number }>();
    for (const r of projectRollupRows) {
      const cur = m.get(r.user_id) ?? { user_id: r.user_id, minutes: 0, entries: 0 };
      cur.minutes += r.total_minutes ?? 0;
      cur.entries += r.entry_count ?? 0;
      m.set(r.user_id, cur);
    }
    return Array.from(m.values()).sort((a, b) => b.minutes - a.minutes);
  }, [projectRollupRows]);

  const projectByLabel = useMemo(() => {
    const m = new Map<string, { label: string; minutes: number; entries: number }>();
    for (const r of projectRollupRows) {
      const key = r.project_label || 'Untitled';
      const cur = m.get(key) ?? { label: key, minutes: 0, entries: 0 };
      cur.minutes += r.total_minutes ?? 0;
      cur.entries += r.entry_count ?? 0;
      m.set(key, cur);
    }
    return Array.from(m.values()).sort((a, b) => b.minutes - a.minutes);
  }, [projectRollupRows]);

  const totalProjectMinutes = useMemo(
    () => projectRollupRows.reduce((sum, r) => sum + (r.total_minutes ?? 0), 0),
    [projectRollupRows],
  );

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

      <HelpBanner
        pageKey="reports"
        title="Welcome to Reports"
        tip="Access all your CRM analytics from here. Click on any report card to dive into detailed metrics. Use date filters to compare performance across different time periods."
      />

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

      {/* Round 10 / Section 12 — Special Projects rollup (per-rep + per-project) */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div>
            <p className="text-sm font-semibold text-th-text-primary flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-th-text-tertiary" />
              Special Projects — time rollup
            </p>
            <p className="text-xs text-th-text-tertiary mt-0.5">
              Per-rep and per-project breakdown of Special Projects time logged in the Daily Log.
              Spec lock (Section 12 / Round 6 Addendum): project work is non-pipeline and does NOT
              count toward the Performance Lag activity score.
            </p>
          </div>
          <div className="bg-surface-secondary border border-th-border rounded-lg px-3 py-2 text-center min-w-[120px]">
            <p className="text-[10px] uppercase tracking-wider text-th-text-tertiary">Total time</p>
            <p className="text-lg font-bold text-th-text-primary tabular-nums">
              {formatMinutes(totalProjectMinutes)}
            </p>
          </div>
        </div>
        {projectRollupRows.length === 0 ? (
          <p className="text-sm text-th-text-tertiary py-4">
            No Special Projects logged in this date range yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-th-text-tertiary mb-2">
                Per-rep
              </p>
              <div className="border border-th-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-surface-secondary">
                    <tr className="text-left text-th-text-tertiary">
                      <th className="px-3 py-2 font-medium">Rep</th>
                      <th className="px-3 py-2 font-medium text-right">Entries</th>
                      <th className="px-3 py-2 font-medium text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-th-border-subtle">
                    {projectByRep.map((row) => (
                      <tr key={row.user_id}>
                        <td className="px-3 py-2 text-th-text-primary">
                          {repNameLookup.get(row.user_id) ?? row.user_id.slice(0, 8) + '…'}
                        </td>
                        <td className="px-3 py-2 text-th-text-secondary text-right tabular-nums">
                          {row.entries}
                        </td>
                        <td className="px-3 py-2 text-th-text-primary text-right tabular-nums font-medium">
                          {formatMinutes(row.minutes)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-th-text-tertiary mb-2">
                Per-project
              </p>
              <div className="border border-th-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-surface-secondary">
                    <tr className="text-left text-th-text-tertiary">
                      <th className="px-3 py-2 font-medium">Project</th>
                      <th className="px-3 py-2 font-medium text-right">Entries</th>
                      <th className="px-3 py-2 font-medium text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-th-border-subtle">
                    {projectByLabel.map((row) => (
                      <tr key={row.label}>
                        <td className="px-3 py-2 text-th-text-primary">{row.label}</td>
                        <td className="px-3 py-2 text-th-text-secondary text-right tabular-nums">
                          {row.entries}
                        </td>
                        <td className="px-3 py-2 text-th-text-primary text-right tabular-nums font-medium">
                          {formatMinutes(row.minutes)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Round 7 — Calls breakdown (regular vs cancellation) */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-th-text-primary">Calls — regular vs cancellation</p>
            <p className="text-xs text-th-text-tertiary mt-0.5">
              Cancellation calls count separately from regular calls in every report. Range
              follows the date filter above (defaults to last 30 days).
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 min-w-[280px]">
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-center">
              <Phone className="w-4 h-4 text-emerald-600 mx-auto" />
              <p className="text-[10px] uppercase tracking-wider text-emerald-700 mt-1">Regular</p>
              <p className="text-xl font-bold text-emerald-700 tabular-nums">
                {callBreakdown.regular}
              </p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-center">
              <XCircle className="w-4 h-4 text-red-600 mx-auto" />
              <p className="text-[10px] uppercase tracking-wider text-red-700 mt-1">Cancellation</p>
              <p className="text-xl font-bold text-red-700 tabular-nums">{callBreakdown.cancel}</p>
            </div>
            <div className="bg-surface-secondary border border-th-border rounded-lg p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-th-text-tertiary mt-5">Total</p>
              <p className="text-xl font-bold text-th-text-primary tabular-nums">
                {callBreakdown.regular + callBreakdown.cancel}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-th-text-tertiary" />
            <h2 className="text-lg font-semibold text-th-text-primary">Plan Type Distribution</h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
            </div>
          ) : planTypeStats.length > 0 ? (
            <div className="space-y-4">
              {planTypeStats.map((stat) => {
                const totalAll = planTypeStats.reduce((s, p) => s + p.total_count, 0);
                const pct = totalAll > 0 ? (stat.total_count / totalAll) * 100 : 0;
                const label = PLAN_TYPE_LABELS[stat.plan_type as keyof typeof PLAN_TYPE_LABELS] || stat.plan_type;
                const color = PLAN_COLORS[stat.plan_type] || PLAN_COLORS.unspecified;
                return (
                  <div key={stat.plan_type}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-th-text-primary">{String(label)}</span>
                      <div className="flex items-center gap-3 text-xs text-th-text-tertiary">
                        <span className="font-semibold text-th-text-primary">{stat.total_count.toLocaleString()}</span>
                        <span>{pct.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-th-text-tertiary">
                      <span>{stat.new_today} today</span>
                      <span>{stat.new_this_week} this week</span>
                      <span>{stat.new_this_month} this month</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-th-text-tertiary text-center py-8">No plan type data available</p>
          )}
        </div>

        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-th-text-tertiary" />
            <h2 className="text-lg font-semibold text-th-text-primary">Plan Type by Volume</h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
            </div>
          ) : planTypeStats.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planTypeStats.map((s) => ({
                      name: String(PLAN_TYPE_LABELS[s.plan_type as keyof typeof PLAN_TYPE_LABELS] || s.plan_type),
                      value: s.total_count,
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {planTypeStats.map((s) => (
                      <Cell key={s.plan_type} fill={PLAN_COLORS[s.plan_type] || PLAN_COLORS.unspecified} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px', color: '#F8FAFC' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-th-text-tertiary text-center py-8">No plan type data available</p>
          )}
        </div>
      </div>

      {/* Advisor Performance */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <div className="flex items-center gap-2 mb-6">
          <UserCheck className="w-5 h-5 text-th-text-tertiary" />
          <h2 className="text-lg font-semibold text-th-text-primary">Advisor Performance</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
          </div>
        ) : advisorStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-th-border text-left text-th-text-tertiary">
                  <th className="py-2.5 pr-4 font-medium">Advisor</th>
                  <th className="py-2.5 pr-4 font-medium text-right">Total Leads</th>
                  <th className="py-2.5 pr-4 font-medium text-right">New (Month)</th>
                  <th className="py-2.5 pr-4 font-medium text-right">Converted</th>
                  <th className="py-2.5 pr-4 font-medium text-right">Conv %</th>
                  <th className="py-2.5 pr-4 font-medium text-right">Open Tasks</th>
                  <th className="py-2.5 pr-4 font-medium text-right">Overdue</th>
                  <th className="py-2.5 font-medium text-right">Activities</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border-subtle">
                {advisorStats.map((a) => {
                  const convRate = a.total_leads > 0 ? ((a.converted_leads / a.total_leads) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={a.advisor_id}>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-th-accent-100 rounded-lg flex items-center justify-center shrink-0">
                            <span className="text-th-accent-700 font-semibold text-xs">{a.advisor_name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-th-text-primary truncate">{a.advisor_name}</p>
                            <p className="text-xs text-th-text-tertiary truncate">{a.advisor_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-right font-medium text-th-text-primary">{a.total_leads}</td>
                      <td className="py-3 pr-4 text-right text-th-text-secondary">{a.new_leads_this_month}</td>
                      <td className="py-3 pr-4 text-right text-th-text-secondary">{a.converted_leads}</td>
                      <td className="py-3 pr-4 text-right font-medium text-emerald-600">{convRate}%</td>
                      <td className="py-3 pr-4 text-right text-th-text-secondary">{a.open_tasks}</td>
                      <td className="py-3 pr-4 text-right">
                        {a.overdue_tasks > 0 ? (
                          <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                            <AlertTriangle className="w-3 h-3" />
                            {a.overdue_tasks}
                          </span>
                        ) : (
                          <span className="text-th-text-tertiary">0</span>
                        )}
                      </td>
                      <td className="py-3 text-right text-th-text-secondary">{a.activities_this_month}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-th-text-tertiary text-center py-8">No advisor data available.</p>
        )}
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
                <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
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

// Section 12 / Round 10 — shared minute formatter for the Special
// Projects rollup tiles. Renders 0–59 as "Nm", everything else as
// "Hh Mm" so admins can read totals at a glance.
function formatMinutes(total: number): string {
  if (!total || total <= 0) return '—';
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
