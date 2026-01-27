import React from 'react';
import { cn } from '../utils';

export interface StatusDotProps {
  status: 'online' | 'offline' | 'warning' | 'busy' | 'idle';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

const statusColors = {
  online: 'bg-success-500',
  offline: 'bg-neutral-400 dark:bg-neutral-600',
  warning: 'bg-warning-500',
  busy: 'bg-error-500',
  idle: 'bg-warning-400',
};

const pulseColors = {
  online: 'bg-success-400',
  offline: 'bg-neutral-400',
  warning: 'bg-warning-400',
  busy: 'bg-error-400',
  idle: 'bg-warning-300',
};

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
};

const pulseSizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
};

export function StatusDot({
  status,
  size = 'md',
  pulse = false,
  className,
}: StatusDotProps) {
  return (
    <span className={cn('relative inline-flex', className)}>
      {pulse && status !== 'offline' && (
        <span
          className={cn(
            'absolute inline-flex rounded-full opacity-75 animate-ping',
            pulseColors[status],
            pulseSizeClasses[size]
          )}
        />
      )}
      <span
        className={cn(
          'relative inline-flex rounded-full',
          statusColors[status],
          sizeClasses[size]
        )}
      />
    </span>
  );
}
