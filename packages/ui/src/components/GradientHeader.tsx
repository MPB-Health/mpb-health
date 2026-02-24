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
  sm: 'p-4 md:p-5',
  md: 'p-5 md:p-8',
  lg: 'p-6 md:p-10',
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
        'rounded-2xl text-white relative overflow-hidden bg-gradient-to-br from-[#0A4E8E] via-[#0C71C3] to-[#0E2D41]',
        sizeClasses[size],
        className
      )}
    >
      <div className="absolute inset-0 opacity-[0.04] grid-pattern-overlay" />
      <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-[#A4CC43]/20 blur-[100px]" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-white/5 blur-[80px]" />

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              {icon && <div className="flex-shrink-0">{icon}</div>}
              <h1 className={cn('font-bold tracking-tight', titleSizes[size])}>
                {title}
              </h1>
            </div>
            {subtitle && (
              <p className="text-white/60 text-sm md:text-base max-w-2xl">
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
