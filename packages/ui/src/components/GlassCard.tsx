import React from 'react';
import { cn } from '../utils';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
  intensity?: 'light' | 'medium' | 'heavy';
}

const intensityClasses = {
  light: 'bg-surface-primary/60 dark:bg-surface-primary/40 backdrop-blur-sm',
  medium: 'bg-surface-primary/75 dark:bg-surface-primary/50 backdrop-blur-md',
  heavy: 'bg-surface-primary/90 dark:bg-surface-primary/70 backdrop-blur-xl',
};

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, children, hover = false, intensity = 'medium', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border border-white/20 dark:border-white/10 shadow-glass dark:shadow-glass-dark transition-all duration-200',
          intensityClasses[intensity],
          hover && 'hover:shadow-lg hover:border-white/30 dark:hover:border-white/15 cursor-pointer hover:scale-[1.01]',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

export { GlassCard };
