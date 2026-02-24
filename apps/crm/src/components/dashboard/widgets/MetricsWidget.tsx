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

const COLOR_CLASSES: Record<string, { bg: string; text: string; icon: string }> = {
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600', icon: 'text-blue-500' },
  green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600', icon: 'text-green-500' },
  red: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600', icon: 'text-red-500' },
  emerald: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600', icon: 'text-green-500' },
  amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600', icon: 'text-amber-500' },
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

  // Compact view for small size
  if (size === 'sm') {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className={cn('p-2 rounded-lg', colors.bg)}>
            <Icon className={cn('h-5 w-5', colors.icon)} />
          </div>
          {trend && (
            <TrendIndicator direction={trend.direction} percentage={trend.percentage} />
          )}
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold">{formattedValue}</p>
          <p className="text-sm text-gray-500 mt-1">{metricConfig.label}</p>
        </div>
      </div>
    );
  }

  // Standard view
  return (
    <div className="p-4">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('p-3 rounded-xl', colors.bg)}>
          <Icon className={cn('h-6 w-6', colors.icon)} />
        </div>
        {trend && (
          <TrendIndicator direction={trend.direction} percentage={trend.percentage} />
        )}
      </div>
      <div>
        <p className="text-3xl font-bold">{formattedValue}</p>
        <p className="text-sm text-gray-500 mt-1">{metricConfig.label}</p>
      </div>
      {size !== 'md' && (
        <div className="mt-4 pt-4 border-t dark:border-gray-700">
          <p className="text-xs text-gray-400">
            Last updated: {new Date().toLocaleTimeString()}
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
        'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
        isUp && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        isDown && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        !isUp && !isDown && 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
      )}
    >
      {isUp && <TrendingUp className="h-3 w-3" />}
      {isDown && <TrendingDown className="h-3 w-3" />}
      {!isUp && !isDown && <Minus className="h-3 w-3" />}
      <span>{percentage}%</span>
    </div>
  );
}
