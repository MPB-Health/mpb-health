import React from 'react';
import { cn } from '../utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'accent';
  children: React.ReactNode;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors duration-150',
          {
            'bg-surface-tertiary text-th-text-primary': variant === 'default',
            'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300': variant === 'primary',
            'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300': variant === 'success',
            'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300': variant === 'warning',
            'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-300': variant === 'error',
            'bg-th-accent-100 text-th-accent-800 dark:bg-th-accent-900/30 dark:text-th-accent-300': variant === 'accent',
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
export type { BadgeProps };
