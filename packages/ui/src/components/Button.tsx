import React from 'react';
import { cn } from '../utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'gradient' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    children,
    ...props
  }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-th-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary disabled:pointer-events-none disabled:opacity-50 rounded-lg',
          {
            'bg-th-accent-600 text-white hover:bg-th-accent-700 active:bg-th-accent-800 shadow-lg hover:shadow-xl': variant === 'primary',
            'bg-surface-secondary text-th-text-primary hover:bg-surface-tertiary active:bg-surface-inset border border-th-border': variant === 'secondary',
            'text-th-text-secondary hover:text-th-text-primary hover:bg-surface-tertiary active:bg-surface-inset': variant === 'ghost',
            'border border-th-border bg-surface-primary text-th-text-primary hover:bg-surface-secondary active:bg-surface-tertiary shadow-sm': variant === 'outline',
            'gradient-accent text-white shadow-lg hover:shadow-xl hover:brightness-110 active:brightness-95': variant === 'gradient',
            'glass text-th-text-primary hover:bg-surface-primary/90 shadow-sm': variant === 'glass',
          },
          {
            'h-8 px-3 text-sm gap-1.5': size === 'sm',
            'h-10 px-4 text-sm gap-2': size === 'md',
            'h-12 px-6 text-base gap-2.5': size === 'lg',
            'h-14 px-8 text-lg gap-3': size === 'xl',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
