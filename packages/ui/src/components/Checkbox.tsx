import React from 'react';
import { cn } from '../utils';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  error?: string;
  helperText?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, onChange, label, error, helperText, id, ...props }, ref) => {
    const reactId = React.useId();
    const checkboxId = id || reactId;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={checkboxId}
            ref={ref}
            checked={checked}
            onChange={handleChange}
            className={cn(
              'h-4 w-4 rounded border-neutral-300 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors cursor-pointer',
              error && 'border-error-500 focus:ring-error-500',
              className
            )}
            {...props}
          />
          {label && (
            <label
              htmlFor={checkboxId}
              className="text-sm font-medium text-th-text-primary cursor-pointer select-none"
            >
              {label}
            </label>
          )}
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

Checkbox.displayName = 'Checkbox';

export { Checkbox };
export type { CheckboxProps };
