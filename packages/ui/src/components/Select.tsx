import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, id, children, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-th-text-primary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            className={cn(
              'flex h-10 w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm text-th-text-primary ring-offset-surface-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-th-accent-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none transition-colors duration-150',
              error && 'border-error-500 focus-visible:ring-error-500',
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-th-text-tertiary pointer-events-none" />
        </div>
        {error && (
          <p className="text-xs text-error-500 mt-1">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-xs text-th-text-tertiary mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
