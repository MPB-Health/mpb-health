import React from 'react';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { Card } from '../../ui/Card';
import { formatNumber, formatDuration, formatPercentChange } from '../../../lib/analyticsComparisonService';

interface MetricCardProps {
  title: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  trend?: 'up' | 'down' | 'neutral';
  format?: 'number' | 'percent' | 'duration' | 'currency';
  icon?: LucideIcon;
  iconColor?: string;
  bgGradient?: string;
  subtitle?: string;
  loading?: boolean;
  invertTrend?: boolean; // For metrics where down is good (e.g., bounce rate)
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  previousValue,
  change,
  changePercent,
  trend = 'neutral',
  format = 'number',
  icon: Icon,
  iconColor = 'text-blue-600',
  bgGradient = 'from-white to-neutral-50',
  subtitle,
  loading = false,
  invertTrend = false,
}) => {
  // Format the value based on type
  const formatValue = (val: number): string => {
    switch (format) {
      case 'percent':
        return `${val.toFixed(1)}%`;
      case 'duration':
        return formatDuration(val);
      case 'currency':
        return `$${formatNumber(val)}`;
      case 'number':
      default:
        return formatNumber(val);
    }
  };

  // Determine trend colors
  const getTrendColors = () => {
    const isPositive = invertTrend ? trend === 'down' : trend === 'up';
    const isNegative = invertTrend ? trend === 'up' : trend === 'down';

    if (isPositive) {
      return {
        bg: 'bg-green-100',
        text: 'text-green-700',
        icon: TrendingUp,
      };
    }
    if (isNegative) {
      return {
        bg: 'bg-red-100',
        text: 'text-red-700',
        icon: TrendingDown,
      };
    }
    return {
      bg: 'bg-neutral-100',
      text: 'text-neutral-600',
      icon: Minus,
    };
  };

  const trendColors = getTrendColors();
  const TrendIcon = trendColors.icon;

  if (loading) {
    return (
      <Card className={`p-6 bg-gradient-to-br ${bgGradient} animate-pulse`}>
        <div className="h-4 bg-neutral-200 rounded w-24 mb-3"></div>
        <div className="h-8 bg-neutral-200 rounded w-16 mb-2"></div>
        <div className="h-3 bg-neutral-200 rounded w-20"></div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 bg-gradient-to-br ${bgGradient} border-neutral-200 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-medium text-neutral-600">{title}</span>
        {Icon && <Icon className={`h-5 w-5 ${iconColor}`} />}
      </div>

      <div className="flex items-end gap-3">
        <div className="text-3xl font-bold text-neutral-900">
          {formatValue(value)}
        </div>

        {changePercent !== undefined && trend !== 'neutral' && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${trendColors.bg} ${trendColors.text}`}
          >
            <TrendIcon className="h-3 w-3" />
            {formatPercentChange(changePercent)}
          </div>
        )}
      </div>

      {/* Comparison info */}
      {previousValue !== undefined && (
        <div className="mt-2 text-xs text-neutral-500">
          {change !== undefined && change !== 0 && (
            <span className={change > 0 ? 'text-green-600' : 'text-red-600'}>
              {change > 0 ? '+' : ''}
              {formatValue(change)}
            </span>
          )}{' '}
          vs {formatValue(previousValue)} previous
        </div>
      )}

      {subtitle && !previousValue && (
        <div className="mt-2 text-xs text-neutral-500">{subtitle}</div>
      )}
    </Card>
  );
};

// Compact version for grids
interface CompactMetricCardProps {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  invertTrend?: boolean;
}

export const CompactMetricCard: React.FC<CompactMetricCardProps> = ({
  label,
  value,
  change,
  trend = 'neutral',
  invertTrend = false,
}) => {
  const isPositive = invertTrend ? trend === 'down' : trend === 'up';
  const isNegative = invertTrend ? trend === 'up' : trend === 'down';

  return (
    <div className="p-4 bg-neutral-50 rounded-lg">
      <div className="text-xs text-neutral-500 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-neutral-900">{value}</span>
        {change !== undefined && trend !== 'neutral' && (
          <span
            className={`text-xs font-medium ${
              isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-neutral-500'
            }`}
          >
            {change > 0 ? '+' : ''}
            {change.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
};

