import React from 'react';
import { cn } from '../utils';

export interface GradientHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'px-5 py-4 md:px-6 md:py-5',
  md: 'px-6 py-5 md:px-8 md:py-6',
  lg: 'px-6 py-6 md:px-10 md:py-8',
};

const titleSizes = {
  sm: 'text-lg md:text-xl',
  md: 'text-xl md:text-2xl',
  lg: 'text-2xl md:text-3xl',
};

export function GradientHeader({
  title,
  subtitle,
  icon,
  actions,
  children,
  className,
  size = 'md',
}: GradientHeaderProps) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-surface-primary border border-th-border relative overflow-hidden',
        sizeClasses[size],
        className
      )}
    >
      {/* Subtle top accent line */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-th-accent-400 via-th-accent-500 to-th-accent-600" />

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-th-accent-50 dark:bg-th-accent-900/20 flex items-center justify-center text-th-accent-600">
                  {icon}
                </div>
              )}
              <h1 className={cn('font-semibold tracking-tight text-th-text-primary', titleSizes[size])}>
                {title}
              </h1>
            </div>
            {subtitle && (
              <p className="text-th-text-tertiary text-sm md:text-base max-w-2xl leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  );
}
