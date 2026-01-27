import React from 'react';
import { cn } from '../utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label?: string;
  };
  className?: string;
  accentBorder?: boolean;
}

export function MetricCard({
  label,
  value,
  icon,
  trend,
  className,
  accentBorder = true,
}: MetricCardProps) {
  const trendDirection = trend
    ? trend.value > 0 ? 'up' : trend.value < 0 ? 'down' : 'flat'
    : null;

  return (
    <div
      className={cn(
        'relative bg-surface-primary border border-th-border rounded-xl p-5 transition-all duration-200 hover:shadow-lg group overflow-hidden',
        className
      )}
    >
      {/* Accent top border */}
      {accentBorder && (
        <div className="absolute top-0 left-0 right-0 h-0.5 gradient-accent opacity-60 group-hover:opacity-100 transition-opacity" />
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-th-text-secondary truncate">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-th-text-primary tracking-tight">
            {value}
          </p>
          {trend && (
            <div className="mt-2 flex items-center gap-1.5">
              {trendDirection === 'up' && (
                <TrendingUp className="w-3.5 h-3.5 text-success-500" />
              )}
              {trendDirection === 'down' && (
                <TrendingDown className="w-3.5 h-3.5 text-error-500" />
              )}
              {trendDirection === 'flat' && (
                <Minus className="w-3.5 h-3.5 text-th-text-tertiary" />
              )}
              <span
                className={cn('text-xs font-medium', {
                  'text-success-600 dark:text-success-400': trendDirection === 'up',
                  'text-error-600 dark:text-error-400': trendDirection === 'down',
                  'text-th-text-tertiary': trendDirection === 'flat',
                })}
              >
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
              {trend.label && (
                <span className="text-xs text-th-text-tertiary">{trend.label}</span>
              )}
            </div>
          )}
        </div>

        {icon && (
          <div className="flex-shrink-0 ml-4 p-2.5 rounded-xl bg-th-accent-50 dark:bg-th-accent-900/20 text-th-accent-600 dark:text-th-accent-400 transition-colors duration-150">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
