import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import type { ForecastSummary, DealStageMetrics } from '@mpbhealth/crm-core';

interface ForecastChartsProps {
  summary: ForecastSummary;
  stageMetrics: DealStageMetrics[];
  loading?: boolean;
}

const COLORS = ['#10B981', '#8B5CF6', '#3B82F6', '#6B7280'];

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

export function ForecastCharts({ summary, stageMetrics, loading }: ForecastChartsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface-primary border border-th-border rounded-xl p-6 animate-pulse">
            <div className="h-5 bg-surface-tertiary rounded w-40 mb-4" />
            <div className="h-48 bg-surface-tertiary rounded" />
          </div>
        ))}
      </div>
    );
  }

  // Pipeline funnel data
  const funnelData = [
    { name: 'Pipeline', value: summary.pipeline, fill: '#3B82F6' },
    { name: 'Best Case', value: summary.best_case, fill: '#8B5CF6' },
    { name: 'Committed', value: summary.committed, fill: '#10B981' },
    { name: 'Closed Won', value: summary.closed_won, fill: '#059669' },
  ].filter((d) => d.value > 0);

  // Pipeline by stage
  const stageData = stageMetrics
    .filter((m) => !m.is_won_stage && !m.is_lost_stage)
    .map((m) => ({
      name: m.stage_display_name || m.stage_name,
      deals: m.total_deals,
      avgSize: m.avg_deal_size,
    }));

  // Win rate by stage
  const winRateData = stageMetrics
    .filter((m) => m.total_deals > 0)
    .map((m) => ({
      name: m.stage_display_name || m.stage_name,
      winRate: m.win_rate,
      deals: m.total_deals,
    }));

  // Forecast breakdown bar data
  const breakdownData = [
    { name: 'Committed', amount: summary.committed },
    { name: 'Best Case', amount: summary.best_case },
    { name: 'Pipeline', amount: summary.pipeline },
    { name: 'Omitted', amount: summary.omitted },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Forecast Breakdown */}
      <div className="bg-surface-primary border border-th-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-th-text-primary mb-4">Forecast Breakdown</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={breakdownData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
            <XAxis
              type="number"
              tickFormatter={(v) => formatCurrency(v)}
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
            />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fontSize: 12, fill: '#6B7280' }}
              width={80}
            />
            <Tooltip
              formatter={(v: number) => formatCurrency(v)}
              contentStyle={{
                background: 'var(--color-surface-primary, #fff)',
                border: '1px solid var(--color-border, #e5e7eb)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
              {breakdownData.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pipeline Funnel */}
      <div className="bg-surface-primary border border-th-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-th-text-primary mb-4">Pipeline Funnel</h3>
        {funnelData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <FunnelChart>
              <Tooltip
                formatter={(v: number) => formatCurrency(v)}
                contentStyle={{
                  background: 'var(--color-surface-primary, #fff)',
                  border: '1px solid var(--color-border, #e5e7eb)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Funnel dataKey="value" data={funnelData} isAnimationActive>
                <LabelList
                  position="right"
                  fill="#374151"
                  stroke="none"
                  dataKey="name"
                  fontSize={12}
                />
                {funnelData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} />
                ))}
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-sm text-th-text-tertiary">
            No pipeline data available
          </div>
        )}
      </div>

      {/* Pipeline by Stage */}
      <div className="bg-surface-primary border border-th-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-th-text-primary mb-4">Pipeline by Stage</h3>
        {stageData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#6B7280' }}
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface-primary, #fff)',
                  border: '1px solid var(--color-border, #e5e7eb)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend />
              <Bar dataKey="deals" name="Deals" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-sm text-th-text-tertiary">
            No stage data available
          </div>
        )}
      </div>

      {/* Win Rate by Stage */}
      <div className="bg-surface-primary border border-th-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-th-text-primary mb-4">Win Rate by Stage</h3>
        {winRateData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={winRateData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#6B7280' }}
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                formatter={(v: number) => `${v}%`}
                contentStyle={{
                  background: 'var(--color-surface-primary, #fff)',
                  border: '1px solid var(--color-border, #e5e7eb)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="winRate"
                name="Win Rate"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-sm text-th-text-tertiary">
            No win rate data available
          </div>
        )}
      </div>
    </div>
  );
}
