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

const ACCENT_GRADIENT: Record<string, string> = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-emerald-500 to-emerald-600',
  orange: 'from-orange-500 to-orange-600',
  red: 'from-red-500 to-red-600',
  gray: 'from-slate-400 to-slate-500',
};

function KPICard({ metric }: KPICardProps) {
  const Icon = metric.icon;
  const colorStyles = getColorStyles(metric.color);
  const TrendIcon = metric.trend === 'up' ? TrendingUp : metric.trend === 'down' ? TrendingDown : Minus;
  const trendColor = metric.trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : metric.trend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-th-text-tertiary';

  return (
    <div
      className={cn(
        'relative p-4 rounded-2xl border transition-all duration-200 overflow-hidden',
        'bg-surface-primary',
        'border-th-border/60',
        'hover:shadow-md hover:border-th-border hover:-translate-y-0.5',
        metric.onClick && 'cursor-pointer'
      )}
      onClick={metric.onClick}
    >
      <div className={cn('absolute top-0 left-0 w-1 h-full bg-gradient-to-b', ACCENT_GRADIENT[metric.color] || ACCENT_GRADIENT.blue)} />

      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', colorStyles.bg)}>
          <Icon className={cn('h-4.5 w-4.5', colorStyles.icon)} />
        </div>
        {metric.trend && (
          <div className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold',
            metric.trend === 'up' ? 'bg-emerald-50 dark:bg-emerald-900/20' :
            metric.trend === 'down' ? 'bg-red-50 dark:bg-red-900/20' :
            'bg-surface-tertiary',
            trendColor
          )}>
            <TrendIcon className="h-3 w-3" />
            {metric.trendValue && <span>{metric.trendValue}</span>}
          </div>
        )}
      </div>

      <p className="text-2xl font-bold text-th-text-primary tabular-nums tracking-tight">
        {metric.value}
      </p>
      <p className="text-xs font-medium text-th-text-tertiary mt-1 uppercase tracking-wider">
        {metric.label}
      </p>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getColorStyles(color: KPIMetric['color']) {
  const colors = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      icon: 'text-blue-600 dark:text-blue-400',
    },
    green: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      icon: 'text-emerald-600 dark:text-emerald-400',
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      icon: 'text-orange-600 dark:text-orange-400',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      icon: 'text-red-600 dark:text-red-400',
    },
    gray: {
      bg: 'bg-surface-tertiary',
      icon: 'text-th-text-secondary',
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
    <div className="flex items-center gap-5 px-6 py-3 bg-surface-secondary/60 border-b border-th-border/50">
      {metrics.map((metric, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className={cn(
            'text-lg font-bold tabular-nums',
            metric.color === 'green' ? 'text-emerald-600 dark:text-emerald-400' :
            metric.color === 'red' ? 'text-red-600 dark:text-red-400' :
            'text-blue-600 dark:text-blue-400'
          )}>
            {metric.value}
          </span>
          <span className="text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
            {metric.label}
          </span>
        </div>
      ))}
    </div>
  );
}
