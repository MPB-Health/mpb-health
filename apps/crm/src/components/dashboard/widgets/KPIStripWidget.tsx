// ============================================================================
// KPI Strip Widget
// Horizontal strip of key metrics for dashboard header
// ============================================================================

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  DollarSign,
  Percent,
  Clock,
  CheckSquare,
  AlertTriangle,
  Target,
  GitBranch,
} from 'lucide-react';
import { useCRM } from '../../../contexts/CRMContext';
import { useOrg } from '../../../contexts/OrgContext';
import type { BaseWidgetProps } from '../types';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

// ============================================================================
// Types
// ============================================================================

interface KPIMetric {
  id: string;
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'blue' | 'orange' | 'red' | 'gray';
  onClick?: () => void;
}

// ============================================================================
// KPI Strip Widget Component
// ============================================================================

export default function KPIStripWidget({ config, size }: BaseWidgetProps) {
  const { dashboardStats, tasksDueToday, overdueTasks, pipelineStages } = useCRM();

  // Calculate metrics
  const totalLeads = dashboardStats?.total_leads || 0;
  const newLeadsToday = dashboardStats?.new_leads || 0;
  const pipelineValue = pipelineStages.reduce((sum, stage) => sum + (stage.count || 0), 0);
  const tasksDue = tasksDueToday.length;
  const overdueCount = overdueTasks.length;
  
  // Calculate conversion rate (mock for now)
  const conversionRate = dashboardStats?.conversion_rate || 0;

  const metrics: KPIMetric[] = [
    {
      id: 'new-leads',
      label: 'New Today',
      value: newLeadsToday,
      trend: newLeadsToday > 0 ? 'up' : 'flat',
      trendValue: newLeadsToday > 0 ? `+${newLeadsToday}` : '0',
      icon: Users,
      color: 'green',
    },
    {
      id: 'pipeline',
      label: 'In Pipeline',
      value: totalLeads,
      trend: 'flat',
      icon: GitBranch,
      color: 'blue',
    },
    {
      id: 'conversion',
      label: 'Conversion',
      value: `${conversionRate.toFixed(1)}%`,
      trend: conversionRate >= 10 ? 'up' : conversionRate >= 5 ? 'flat' : 'down',
      icon: Percent,
      color: conversionRate >= 10 ? 'green' : conversionRate >= 5 ? 'blue' : 'orange',
    },
    {
      id: 'tasks-due',
      label: 'Tasks Due',
      value: tasksDue,
      trend: tasksDue === 0 ? 'up' : 'flat',
      icon: CheckSquare,
      color: tasksDue === 0 ? 'green' : 'blue',
    },
    {
      id: 'overdue',
      label: 'Overdue',
      value: overdueCount,
      trend: overdueCount > 0 ? 'down' : 'up',
      icon: AlertTriangle,
      color: overdueCount === 0 ? 'green' : 'red',
    },
  ];

  // Determine how many metrics to show based on size
  const visibleCount = size === 'full' ? metrics.length : size === 'lg' ? 5 : size === 'md' ? 4 : 3;
  const visibleMetrics = metrics.slice(0, visibleCount);

  return (
    <div className="p-4">
      <div className={cn(
        'grid gap-4',
        size === 'full' ? 'grid-cols-5' : size === 'lg' ? 'grid-cols-5' : size === 'md' ? 'grid-cols-4' : 'grid-cols-3'
      )}>
        {visibleMetrics.map((metric) => (
          <KPICard key={metric.id} metric={metric} />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// KPI Card Component
// ============================================================================

interface KPICardProps {
  metric: KPIMetric;
}

function KPICard({ metric }: KPICardProps) {
  const Icon = metric.icon;
  const colorStyles = getColorStyles(metric.color);
  const TrendIcon = metric.trend === 'up' ? TrendingUp : metric.trend === 'down' ? TrendingDown : Minus;
  const trendColor = metric.trend === 'up' ? 'text-green-500' : metric.trend === 'down' ? 'text-red-500' : 'text-gray-400';

  return (
    <div
      className={cn(
        'relative p-4 rounded-xl border transition-all',
        'bg-white dark:bg-gray-800',
        'border-gray-200 dark:border-gray-700',
        'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600',
        metric.onClick && 'cursor-pointer'
      )}
      onClick={metric.onClick}
    >
      {/* Icon */}
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', colorStyles.bg)}>
        <Icon className={cn('h-5 w-5', colorStyles.icon)} />
      </div>

      {/* Value */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {metric.value}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {metric.label}
          </p>
        </div>

        {/* Trend */}
        {metric.trend && (
          <div className={cn('flex items-center gap-1', trendColor)}>
            <TrendIcon className="h-4 w-4" />
            {metric.trendValue && (
              <span className="text-xs font-medium">{metric.trendValue}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getColorStyles(color: KPIMetric['color']) {
  const colors = {
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      icon: 'text-blue-600 dark:text-blue-400',
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      icon: 'text-green-600 dark:text-green-400',
    },
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      icon: 'text-blue-600 dark:text-blue-400',
    },
    orange: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      icon: 'text-orange-600 dark:text-orange-400',
    },
    red: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      icon: 'text-red-600 dark:text-red-400',
    },
    gray: {
      bg: 'bg-gray-100 dark:bg-gray-700',
      icon: 'text-gray-600 dark:text-gray-400',
    },
  };
  return colors[color];
}

// ============================================================================
// Compact KPI Strip for Dashboard Header
// ============================================================================

export function KPIStrip() {
  const { dashboardStats, tasksDueToday, overdueTasks } = useCRM();

  const metrics = [
    {
      label: 'New Today',
      value: dashboardStats?.new_leads || 0,
      color: 'green' as const,
    },
    {
      label: 'Pipeline',
      value: dashboardStats?.total_leads || 0,
      color: 'blue' as const,
    },
    {
      label: 'Tasks Due',
      value: tasksDueToday.length,
      color: tasksDueToday.length === 0 ? 'green' as const : 'blue' as const,
    },
    {
      label: 'Overdue',
      value: overdueTasks.length,
      color: overdueTasks.length === 0 ? 'green' as const : 'red' as const,
    },
  ];

  return (
    <div className="flex items-center gap-6 px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
      {metrics.map((metric, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className={cn(
            'text-lg font-bold',
            metric.color === 'green' ? 'text-green-600' :
            metric.color === 'red' ? 'text-red-600' :
            metric.color === 'blue' ? 'text-blue-600' :
            'text-blue-600'
          )}>
            {metric.value}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {metric.label}
          </span>
        </div>
      ))}
    </div>
  );
}
