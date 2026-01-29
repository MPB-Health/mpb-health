import React from 'react';
import { cn } from '../utils';

export interface GradientHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
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
  children,
  className,
  size = 'md',
}: GradientHeaderProps) {
  return (
    <div
      className={cn(
        'gradient-accent rounded-2xl text-white relative overflow-hidden',
        sizeClasses[size],
        className
      )}
    >
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.07] grid-pattern-overlay" />
      {/* Glow orb */}
      <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/10 blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center gap-3">
          {icon && <div className="flex-shrink-0">{icon}</div>}
          <h1 className={cn('font-bold tracking-tight', titleSizes[size])}>
            {title}
          </h1>
        </div>
        {subtitle && (
          <p className="mt-1 text-white/75 text-sm md:text-base max-w-2xl">
            {subtitle}
          </p>
        )}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  );
}
