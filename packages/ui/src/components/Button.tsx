import React from 'react';
import { cn } from '../utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
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
          'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 rounded-lg',
          {
            'bg-primary text-white hover:bg-primary/90 active:bg-primary/95 shadow-lg hover:shadow-xl': variant === 'primary',
            'bg-accent-red text-white hover:bg-accent-red/90 active:bg-accent-red/95 shadow-lg hover:shadow-xl': variant === 'secondary',
            'hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-200': variant === 'ghost',
            'border border-neutral-300 bg-white hover:bg-neutral-50 active:bg-neutral-100 shadow-sm hover:shadow-md': variant === 'outline',
          },
          {
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4 text-sm': size === 'md',
            'h-12 px-6 text-base': size === 'lg',
            'h-14 px-8 text-lg': size === 'xl',
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
