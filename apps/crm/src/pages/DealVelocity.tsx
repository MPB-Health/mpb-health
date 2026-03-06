import { useState, useEffect, useCallback } from 'react';
import { ArrowRight, AlertTriangle, Clock, TrendingUp, Gauge } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  Cell,
} from 'recharts';
import { GradientHeader } from '@mpbhealth/ui';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import type { DealStageMetrics, PipelineHealth } from '@mpbhealth/crm-core';

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

const STAGE_COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EC4899', '#EF4444', '#06B6D4'];

export default function DealVelocity() {
  const { forecastingService } = useCRM();
  const { activeOrgId } = useOrg();

  const [stageMetrics, setStageMetrics] = useState<DealStageMetrics[]>([]);
  const [pipelineHealth, setPipelineHealth] = useState<PipelineHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!activeOrgId) return;
    setLoading(true);
    const [metrics, health] = await Promise.all([
      forecastingService.getDealStageMetrics(activeOrgId),
      forecastingService.getPipelineHealth(activeOrgId),
    ]);
    setStageMetrics(metrics);
    setPipelineHealth(health);
    setLoading(false);
  }, [activeOrgId, forecastingService]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeStages = stageMetrics.filter((m) => !m.is_won_stage && !m.is_lost_stage);

  // Avg days per stage chart data
  const velocityData = activeStages.map((m) => ({
    name: m.stage_display_name || m.stage_name,
    days: m.avg_days_in_stage,
  }));

  // Conversion rate between stages (using win rate as proxy)
  const conversionData = activeStages.map((m, idx) => ({
    name: m.stage_display_name || m.stage_name,
    rate: m.win_rate,
    deals: m.total_deals,
    nextStage: idx < activeStages.length - 1
      ? activeStages[idx + 1].stage_display_name || activeStages[idx + 1].stage_name
      : 'Won',
  }));

  // Identify bottlenecks (stages with highest avg days or lowest conversion)
  const bottlenecks = activeStages
    .filter((m) => m.avg_days_in_stage > 0 || m.total_deals > 0)
    .sort((a, b) => b.avg_days_in_stage - a.avg_days_in_stage)
    .slice(0, 3);

  if (loading) {
    return (
      <div className="space-y-6">
        <GradientHeader title="Deal Velocity" subtitle="Analyze pipeline speed and conversion rates" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface-primary border border-th-border rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-surface-tertiary rounded w-20 mb-3" />
              <div className="h-7 bg-surface-tertiary rounded w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GradientHeader
        title="Deal Velocity"
        subtitle="Analyze pipeline speed, conversion rates, and bottlenecks"
      />

      {/* Pipeline Health KPIs */}
      {pipelineHealth && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-surface-primary border border-th-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg text-blue-600 bg-blue-50">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-th-text-tertiary uppercase">Pipeline</span>
            </div>
            <div className="text-xl font-bold text-th-text-primary">
              {formatCurrency(pipelineHealth.total_pipeline_value)}
            </div>
          </div>

          <div className="bg-surface-primary border border-th-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg text-green-600 bg-green-50">
                <Gauge className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-th-text-tertiary uppercase">Coverage</span>
            </div>
            <div className="text-xl font-bold text-th-text-primary">
              {pipelineHealth.coverage_ratio}x
            </div>
          </div>

          <div className="bg-surface-primary border border-th-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg text-purple-600 bg-purple-50">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-th-text-tertiary uppercase">Avg Velocity</span>
            </div>
            <div className="text-xl font-bold text-th-text-primary">
              {pipelineHealth.avg_deal_velocity_days}d
            </div>
          </div>

          <div className="bg-surface-primary border border-th-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg text-amber-600 bg-amber-50">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-th-text-tertiary uppercase">At Risk</span>
            </div>
            <div className="text-xl font-bold text-th-text-primary">
              {pipelineHealth.deals_at_risk}
            </div>
          </div>

          <div className="bg-surface-primary border border-th-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg text-emerald-600 bg-emerald-50">
                <ArrowRight className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-th-text-tertiary uppercase">Closing Soon</span>
            </div>
            <div className="text-xl font-bold text-th-text-primary">
              {pipelineHealth.deals_closing_this_month}
            </div>
          </div>

          <div className="bg-surface-primary border border-th-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg text-green-600 bg-green-50">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-th-text-tertiary uppercase">Committed</span>
            </div>
            <div className="text-xl font-bold text-th-text-primary">
              {formatCurrency(pipelineHealth.committed_value)}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Average Days per Stage */}
        <div className="bg-surface-primary border border-th-border rounded-xl p-6">
          <h3 className="text-sm font-semibold text-th-text-primary mb-4">Average Days per Stage</h3>
          {velocityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={velocityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  angle={-30}
                  textAnchor="end"
                  height={70}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  label={{ value: 'Days', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#9CA3AF' }}
                />
                <Tooltip
                  formatter={(v: number) => [`${v} days`, 'Avg Days']}
                  contentStyle={{
                    background: 'var(--color-surface-primary, #fff)',
                    border: '1px solid var(--color-border, #e5e7eb)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="days" radius={[4, 4, 0, 0]}>
                  {velocityData.map((_, idx) => (
                    <Cell key={idx} fill={STAGE_COLORS[idx % STAGE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-sm text-th-text-tertiary">
              No velocity data available
            </div>
          )}
        </div>

        {/* Conversion Rate Between Stages */}
        <div className="bg-surface-primary border border-th-border rounded-xl p-6">
          <h3 className="text-sm font-semibold text-th-text-primary mb-4">Stage Conversion Rate</h3>
          {conversionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  angle={-30}
                  textAnchor="end"
                  height={70}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  formatter={(v: number, name: string) => [`${v}%`, name]}
                  contentStyle={{
                    background: 'var(--color-surface-primary, #fff)',
                    border: '1px solid var(--color-border, #e5e7eb)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="rate"
                  name="Win Rate"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{ fill: '#8B5CF6', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-sm text-th-text-tertiary">
              No conversion data available
            </div>
          )}
        </div>
      </div>

      {/* Bottleneck Identification */}
      <div className="bg-surface-primary border border-th-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-th-text-primary mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Bottleneck Identification
          </div>
        </h3>
        {bottlenecks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bottlenecks.map((stage, idx) => (
              <div
                key={stage.stage_id}
                className={`border rounded-lg p-4 ${
                  idx === 0
                    ? 'border-red-200 bg-red-50/50'
                    : idx === 1
                    ? 'border-amber-200 bg-amber-50/50'
                    : 'border-yellow-200 bg-yellow-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-th-text-primary">
                    {stage.stage_display_name || stage.stage_name}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      idx === 0
                        ? 'bg-red-100 text-red-700'
                        : idx === 1
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    #{idx + 1} Slowest
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-th-text-tertiary">Avg Days</span>
                    <span className="font-medium text-th-text-primary">
                      {stage.avg_days_in_stage > 0 ? `${stage.avg_days_in_stage}d` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-th-text-tertiary">Win Rate</span>
                    <span className="font-medium text-th-text-primary">{stage.win_rate}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-th-text-tertiary">Active Deals</span>
                    <span className="font-medium text-th-text-primary">{stage.total_deals}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-th-text-tertiary">Avg Deal Size</span>
                    <span className="font-medium text-th-text-primary">
                      {formatCurrency(stage.avg_deal_size)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-th-text-tertiary">
            Not enough data to identify bottlenecks. Create more deals and move them through stages.
          </div>
        )}
      </div>

      {/* Full Stage Metrics Table */}
      <div>
        <h2 className="text-lg font-semibold text-th-text-primary mb-3">Detailed Stage Metrics</h2>
        <div className="bg-surface-primary border border-th-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-secondary text-left text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3 text-center">Total Deals</th>
                  <th className="px-4 py-3 text-center">Won</th>
                  <th className="px-4 py-3 text-center">Lost</th>
                  <th className="px-4 py-3 text-center">Win Rate</th>
                  <th className="px-4 py-3 text-center">Avg Deal Size</th>
                  <th className="px-4 py-3 text-center">Avg Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border">
                {stageMetrics.map((m) => (
                  <tr key={m.stage_id} className="hover:bg-surface-secondary transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-th-text-primary">
                      {m.stage_display_name || m.stage_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-th-text-secondary text-center">{m.total_deals}</td>
                    <td className="px-4 py-3 text-sm text-green-600 text-center">{m.won_deals}</td>
                    <td className="px-4 py-3 text-sm text-red-600 text-center">{m.lost_deals}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          m.win_rate >= 50
                            ? 'bg-green-50 text-green-700'
                            : m.win_rate >= 25
                            ? 'bg-amber-50 text-amber-700'
                            : m.win_rate > 0
                            ? 'bg-red-50 text-red-700'
                            : 'bg-gray-50 text-gray-500'
                        }`}
                      >
                        {m.win_rate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-th-text-secondary text-center">
                      {formatCurrency(m.avg_deal_size)}
                    </td>
                    <td className="px-4 py-3 text-sm text-th-text-secondary text-center">
                      {m.avg_days_in_stage > 0 ? `${m.avg_days_in_stage}d` : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {stageMetrics.length === 0 && (
            <div className="px-6 py-8 text-center text-sm text-th-text-tertiary">
              No stage metrics available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
