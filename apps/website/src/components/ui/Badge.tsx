import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'accent' | 'outline' | 'destructive';
  children: React.ReactNode;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          {
            'bg-slate-100 text-slate-800': variant === 'default',
            'bg-primary text-primary-foreground': variant === 'primary',
            'bg-secondary text-secondary-foreground': variant === 'secondary',
            'bg-success text-success-foreground': variant === 'success',
            'bg-accent text-accent-foreground': variant === 'accent',
            'border border-current bg-transparent': variant === 'outline',
            'bg-red-100 text-red-800': variant === 'destructive',
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