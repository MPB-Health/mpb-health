// ============================================================================
// Analytics Dashboard — KPIs, charts, and performance metrics
// ============================================================================

import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  RefreshCw,
  Download,
  Users,
  MessageSquare,
  CheckCircle,
  Shield,
  Target,
  Loader2,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { useAnalyticsSummary, useDateRange, usePerformanceGoals } from '../hooks/useAnalytics';
import type { KPIMetric, MetricType } from '@mpbhealth/champion-core';

const DATE_PRESETS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'this_year', label: 'This Year' },
];

const METRIC_ICONS: Record<MetricType, typeof TrendingUp> = {
  leads_total: Users,
  leads_new: Users,
  leads_converted: CheckCircle,
  leads_lost: Users,
  conversion_rate: Target,
  messages_sent: MessageSquare,
  messages_received: MessageSquare,
  response_time_avg: RefreshCw,
  response_time_median: RefreshCw,
  compliance_score: Shield,
  tasks_completed: CheckCircle,
  tasks_overdue: AlertCircle,
  calls_made: MessageSquare,
  meetings_held: Calendar,
  revenue_potential: TrendingUp,
  revenue_closed: TrendingUp,
};

function formatMetricValue(value: number, format: string): string {
  switch (format) {
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(value);
    case 'duration':
      if (value < 60) return `${Math.round(value)}m`;
      return `${Math.round(value / 60)}h`;
    default:
      return value.toLocaleString();
  }
}

function KPICard({ kpi }: { kpi: KPIMetric }) {
  const Icon = METRIC_ICONS[kpi.metric] || TrendingUp;
  const TrendIcon =
    kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    kpi.trend === 'up' ? 'text-green-600' : kpi.trend === 'down' ? 'text-red-600' : 'text-gray-500';

  return (
    <div className="bg-surface-primary rounded-xl border border-th-border-primary p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 bg-th-accent-100 rounded-lg">
          <Icon className="w-5 h-5 text-th-accent-600" />
        </div>
        {kpi.changePercent !== null && (
          <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            <span>{Math.abs(kpi.changePercent).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-th-text-primary">
        {formatMetricValue(kpi.value, kpi.format)}
      </p>
      <p className="text-sm text-th-text-secondary mt-1">{kpi.label}</p>
    </div>
  );
}

function MiniChart({ data }: { data: { value: number }[] }) {
  if (data.length < 2) return null;

  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const range = maxValue - minValue || 1;

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((d.value - minValue) / range) * 80 - 10;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox="0 0 100 100" className="w-full h-16" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-th-accent-500"
      />
    </svg>
  );
}

function GoalProgress({ goal }: { goal: { name: string; progress_percent: number; target_value: number; current_value: number } }) {
  const progressColor =
    goal.progress_percent >= 100
      ? 'bg-green-500'
      : goal.progress_percent >= 75
      ? 'bg-th-accent-500'
      : goal.progress_percent >= 50
      ? 'bg-yellow-500'
      : 'bg-red-500';

  return (
    <div className="p-4 bg-surface-secondary rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <p className="font-medium text-th-text-primary">{goal.name}</p>
        <span className="text-sm text-th-text-secondary">
          {goal.current_value} / {goal.target_value}
        </span>
      </div>
      <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
        <div
          className={`h-full ${progressColor} transition-all duration-500`}
          style={{ width: `${Math.min(goal.progress_percent, 100)}%` }}
        />
      </div>
      <p className="text-xs text-th-text-muted mt-1.5">
        {goal.progress_percent.toFixed(0)}% complete
      </p>
    </div>
  );
}

export default function Analytics() {
  const { preset, dateRange, setPresetRange } = useDateRange('last_30_days');
  const { summary, loading, error, refresh } = useAnalyticsSummary(dateRange);
  const { goals } = usePerformanceGoals();
  const [showDatePicker, setShowDatePicker] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-th-accent-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-th-text-secondary">{error}</p>
          <button
            onClick={refresh}
            className="mt-4 text-th-accent-600 hover:text-th-accent-700 font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const currentPreset = DATE_PRESETS.find((p) => p.value === preset);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-th-text-primary">Analytics</h1>
            <p className="text-th-text-secondary mt-1">
              Track your performance and key metrics
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Date Range Picker */}
            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center gap-2 px-4 py-2 bg-surface-secondary rounded-lg text-th-text-primary hover:bg-surface-tertiary transition-colors"
              >
                <Calendar className="w-4 h-4 text-th-text-muted" />
                {currentPreset?.label || 'Select Period'}
                <ChevronDown className="w-4 h-4 text-th-text-muted" />
              </button>

              {showDatePicker && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-surface-primary rounded-lg border border-th-border-primary shadow-lg z-10">
                  <div className="p-2">
                    {DATE_PRESETS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setPresetRange(option.value);
                          setShowDatePicker(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                          preset === option.value
                            ? 'bg-th-accent-100 text-th-accent-700'
                            : 'text-th-text-primary hover:bg-surface-secondary'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={refresh}
              className="p-2 text-th-text-muted hover:text-th-text-primary hover:bg-surface-secondary rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            <button className="flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {summary?.kpis.map((kpi) => (
            <KPICard key={kpi.metric} kpi={kpi} />
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Leads Chart */}
          <div className="bg-surface-primary rounded-xl border border-th-border-primary p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-th-text-primary">New Leads</h2>
              <span className="text-sm text-th-text-muted">Last 30 days</span>
            </div>
            {summary?.charts[0]?.timeSeries && (
              <MiniChart data={summary.charts[0].timeSeries} />
            )}
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xl font-bold text-th-text-primary">
                  {summary?.charts[0]?.timeSeries.reduce((sum, d) => sum + d.value, 0) || 0}
                </p>
                <p className="text-xs text-th-text-muted">Total</p>
              </div>
              <div>
                <p className="text-xl font-bold text-th-text-primary">
                  {Math.round(
                    (summary?.charts[0]?.timeSeries.reduce((sum, d) => sum + d.value, 0) || 0) /
                      (summary?.charts[0]?.timeSeries.length || 1)
                  )}
                </p>
                <p className="text-xs text-th-text-muted">Daily Avg</p>
              </div>
              <div>
                <p className="text-xl font-bold text-th-text-primary">
                  {Math.max(...(summary?.charts[0]?.timeSeries.map((d) => d.value) || [0]))}
                </p>
                <p className="text-xs text-th-text-muted">Peak</p>
              </div>
            </div>
          </div>

          {/* Messages Chart */}
          <div className="bg-surface-primary rounded-xl border border-th-border-primary p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-th-text-primary">Messages Sent</h2>
              <span className="text-sm text-th-text-muted">Last 30 days</span>
            </div>
            {summary?.charts[1]?.timeSeries && (
              <MiniChart data={summary.charts[1].timeSeries} />
            )}
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xl font-bold text-th-text-primary">
                  {summary?.charts[1]?.timeSeries.reduce((sum, d) => sum + d.value, 0) || 0}
                </p>
                <p className="text-xs text-th-text-muted">Total</p>
              </div>
              <div>
                <p className="text-xl font-bold text-th-text-primary">
                  {Math.round(
                    (summary?.charts[1]?.timeSeries.reduce((sum, d) => sum + d.value, 0) || 0) /
                      (summary?.charts[1]?.timeSeries.length || 1)
                  )}
                </p>
                <p className="text-xs text-th-text-muted">Daily Avg</p>
              </div>
              <div>
                <p className="text-xl font-bold text-th-text-primary">
                  {Math.max(...(summary?.charts[1]?.timeSeries.map((d) => d.value) || [0]))}
                </p>
                <p className="text-xs text-th-text-muted">Peak</p>
              </div>
            </div>
          </div>
        </div>

        {/* Goals Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Goals Progress */}
          <div className="lg:col-span-2 bg-surface-primary rounded-xl border border-th-border-primary p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-th-text-primary">Goals Progress</h2>
              <button className="text-sm text-th-accent-600 hover:text-th-accent-700">
                Manage Goals
              </button>
            </div>

            {goals.length > 0 ? (
              <div className="space-y-4">
                {goals.slice(0, 4).map((goal) => (
                  <GoalProgress key={goal.id} goal={goal} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-th-text-muted mx-auto mb-3" />
                <p className="text-th-text-secondary">No goals set</p>
                <button className="mt-3 text-th-accent-600 hover:text-th-accent-700 font-medium">
                  Create your first goal
                </button>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-surface-primary rounded-xl border border-th-border-primary p-6">
            <h2 className="text-lg font-semibold text-th-text-primary mb-4">Quick Stats</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-th-border-primary">
                <span className="text-th-text-secondary">Conversion Rate</span>
                <span className="font-semibold text-th-text-primary">
                  {summary?.kpis.find((k) => k.metric === 'conversion_rate')?.value.toFixed(1) || 0}%
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-th-border-primary">
                <span className="text-th-text-secondary">Compliance Score</span>
                <span className="font-semibold text-th-text-primary">
                  {summary?.kpis.find((k) => k.metric === 'compliance_score')?.value.toFixed(0) || 0}%
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-th-border-primary">
                <span className="text-th-text-secondary">Tasks Completed</span>
                <span className="font-semibold text-th-text-primary">
                  {summary?.kpis.find((k) => k.metric === 'tasks_completed')?.value || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-th-text-secondary">Messages Sent</span>
                <span className="font-semibold text-th-text-primary">
                  {summary?.kpis.find((k) => k.metric === 'messages_sent')?.value || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
