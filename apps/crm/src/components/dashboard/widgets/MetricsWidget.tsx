// ============================================================================
// Metrics Widget
// Displays key performance indicators
// ============================================================================

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Users, Clock, CheckSquare, AlertTriangle } from 'lucide-react';
import { useCRM } from '../../../contexts/CRMContext';
import type { BaseWidgetProps } from '../types';

// Utility for merging class names
const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

// ============================================================================
// Metric Configuration
// ============================================================================

interface MetricConfig {
  key: string;
  label: string;
  icon: typeof Users;
  color: string;
  getValue: (stats: Record<string, number>) => number;
  format?: (value: number) => string;
}

const METRICS: Record<string, MetricConfig> = {
  total_leads: {
    key: 'total_leads',
    label: 'Total Leads',
    icon: Users,
    color: 'blue',
    getValue: (stats) => stats.total_leads || 0,
  },
  new_leads: {
    key: 'new_leads',
    label: 'New Today',
    icon: TrendingUp,
    color: 'green',
    getValue: (stats) => stats.new_leads || 0,
  },
  tasks_due: {
    key: 'tasks_due',
    label: 'Tasks Due Today',
    icon: CheckSquare,
    color: 'blue',
    getValue: (stats) => stats.tasks_due_today || 0,
  },
  overdue_tasks: {
    key: 'overdue_tasks',
    label: 'Overdue Tasks',
    icon: AlertTriangle,
    color: 'red',
    getValue: (stats) => stats.overdue_tasks || 0,
  },
  conversion_rate: {
    key: 'conversion_rate',
    label: 'Conversion Rate',
    icon: TrendingUp,
    color: 'green',
    getValue: (stats) => stats.conversion_rate || 0,
    format: (value) => `${value.toFixed(1)}%`,
  },
  avg_days_to_close: {
    key: 'avg_days_to_close',
    label: 'Avg Days to Close',
    icon: Clock,
    color: 'amber',
    getValue: (stats) => stats.avg_days_to_close || 0,
    format: (value) => `${value.toFixed(0)} days`,
  },
};

const COLOR_CLASSES: Record<string, { bg: string; text: string; icon: string; accent: string }> = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', icon: 'text-blue-600 dark:text-blue-400', accent: 'from-blue-500 to-blue-600' },
  green: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', icon: 'text-emerald-600 dark:text-emerald-400', accent: 'from-emerald-500 to-emerald-600' },
  red: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', icon: 'text-red-600 dark:text-red-400', accent: 'from-red-500 to-red-600' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', icon: 'text-emerald-600 dark:text-emerald-400', accent: 'from-emerald-500 to-emerald-600' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', icon: 'text-amber-600 dark:text-amber-400', accent: 'from-amber-500 to-amber-600' },
};

// ============================================================================
// Metrics Widget Component
// ============================================================================

export default function MetricsWidget({ config, size }: BaseWidgetProps) {
  const { dashboardStats } = useCRM();

  const metricKey = (config.metric as string) || 'total_leads';
  const showTrend = config.showTrend !== false;

  const metricConfig = METRICS[metricKey] || METRICS.total_leads;
  const colors = COLOR_CLASSES[metricConfig.color] || COLOR_CLASSES.blue;

  const value = useMemo(() => {
    return metricConfig.getValue((dashboardStats as unknown) as Record<string, number>);
  }, [dashboardStats, metricConfig]);

  const formattedValue = metricConfig.format
    ? metricConfig.format(value)
    : value.toLocaleString();

  const Icon = metricConfig.icon;

  // Determine trend (mock for now - would need historical data)
  const trend = useMemo(() => {
    if (!showTrend) return null;
    // In a real implementation, compare to previous period
    return { direction: 'up', percentage: 12 };
  }, [showTrend]);

  if (size === 'sm') {
    return (
      <div className="p-4 relative overflow-hidden">
        <div className={cn('absolute top-0 left-0 w-1 h-full bg-gradient-to-b', colors.accent)} />
        <div className="flex items-center justify-between">
          <div className={cn('p-2 rounded-xl', colors.bg)}>
            <Icon className={cn('h-4.5 w-4.5', colors.icon)} />
          </div>
          {trend && (
            <TrendIndicator direction={trend.direction} percentage={trend.percentage} />
          )}
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold tabular-nums tracking-tight">{formattedValue}</p>
          <p className="text-xs font-medium text-th-text-tertiary mt-1 uppercase tracking-wider">{metricConfig.label}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 relative overflow-hidden">
      <div className={cn('absolute top-0 left-0 w-1 h-full bg-gradient-to-b', colors.accent)} />
      <div className="flex items-start justify-between mb-4">
        <div className={cn('p-3 rounded-xl', colors.bg)}>
          <Icon className={cn('h-6 w-6', colors.icon)} />
        </div>
        {trend && (
          <TrendIndicator direction={trend.direction} percentage={trend.percentage} />
        )}
      </div>
      <div>
        <p className="text-3xl font-bold tabular-nums tracking-tight">{formattedValue}</p>
        <p className="text-xs font-medium text-th-text-tertiary mt-1.5 uppercase tracking-wider">{metricConfig.label}</p>
      </div>
      {size !== 'md' && (
        <div className="mt-4 pt-3 border-t border-th-border/40">
          <p className="text-[11px] text-th-text-tertiary tabular-nums">
            Updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Trend Indicator
// ============================================================================

function TrendIndicator({ direction, percentage }: { direction: string; percentage: number }) {
  const isUp = direction === 'up';
  const isDown = direction === 'down';

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold tabular-nums',
        isUp && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        isDown && 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        !isUp && !isDown && 'bg-surface-tertiary text-th-text-secondary'
      )}
    >
      {isUp && <TrendingUp className="h-3 w-3" />}
      {isDown && <TrendingDown className="h-3 w-3" />}
      {!isUp && !isDown && <Minus className="h-3 w-3" />}
      <span>{isUp ? '+' : ''}{percentage}%</span>
    </div>
  );
}
