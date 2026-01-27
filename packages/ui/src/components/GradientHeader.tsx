import React from 'react';
import { cn } from '../utils';

export interface GradientHeaderProps {
  title: string;
  subtitle?: string;
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
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      {/* Glow orb */}
      <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/10 blur-3xl" />

      <div className="relative z-10">
        <h1 className={cn('font-bold tracking-tight', titleSizes[size])}>
          {title}
        </h1>
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
