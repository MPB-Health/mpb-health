import React from 'react';
import { cn } from '../utils';

// ============================================================================
// SkeletonLine — single line placeholder
// ============================================================================

export interface SkeletonLineProps {
  width?: string;
  className?: string;
}

export function SkeletonLine({ width = 'w-full', className }: SkeletonLineProps) {
  return (
    <div
      className={cn('h-4 animate-pulse bg-surface-tertiary rounded', width, className)}
    />
  );
}

// ============================================================================
// SkeletonAvatar — circular avatar placeholder
// ============================================================================

export interface SkeletonAvatarProps {
  size?: string;
  className?: string;
}

export function SkeletonAvatar({ size = 'w-10 h-10', className }: SkeletonAvatarProps) {
  return (
    <div
      className={cn('animate-pulse bg-surface-tertiary rounded-full flex-shrink-0', size, className)}
    />
  );
}

// ============================================================================
// SkeletonMetric — metric card skeleton (number + label)
// ============================================================================

export interface SkeletonMetricProps {
  className?: string;
}

export function SkeletonMetric({ className }: SkeletonMetricProps) {
  return (
    <div
      className={cn(
        'relative bg-surface-primary border border-th-border rounded-xl p-5 overflow-hidden',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-3 animate-pulse bg-surface-tertiary rounded w-24" />
          <div className="h-7 animate-pulse bg-surface-tertiary rounded w-16 mt-2" />
        </div>
        <div className="w-10 h-10 animate-pulse bg-surface-tertiary rounded-xl ml-4 flex-shrink-0" />
      </div>
    </div>
  );
}

// ============================================================================
// SkeletonCard — card-shaped placeholder
// ============================================================================

export interface SkeletonCardProps {
  lines?: number;
  className?: string;
}

export function SkeletonCard({ lines = 3, className }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'bg-surface-primary border border-th-border rounded-xl p-5 space-y-3',
        className
      )}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 animate-pulse bg-surface-tertiary rounded',
            i === 0 ? 'w-1/2' : i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

// ============================================================================
// SkeletonTable — table with N rows of skeleton data
// ============================================================================

export interface SkeletonTableProps {
  rows?: number;
  cols?: number;
  className?: string;
}

export function SkeletonTable({ rows = 5, cols = 4, className }: SkeletonTableProps) {
  const widths = ['w-1/4', 'w-1/3', 'w-1/2', 'w-2/5', 'w-3/5', 'w-1/3'];

  return (
    <div className={cn('overflow-hidden', className)}>
      <div className="divide-y divide-th-border">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex items-center gap-4 px-6 py-4">
            {Array.from({ length: cols }).map((_, colIdx) => (
              <div
                key={colIdx}
                className={cn(
                  'h-4 animate-pulse bg-surface-tertiary rounded flex-1',
                  widths[(rowIdx + colIdx) % widths.length]
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
