import type { ChangeEvent, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// InputField
// ---------------------------------------------------------------------------

interface InputFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'datetime-local' | 'time';
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  icon?: ReactNode;
}

export function InputField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required,
  placeholder,
  disabled,
  icon,
}: InputFieldProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-th-text-secondary mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-th-text-tertiary">
            {icon}
          </div>
        )}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent transition-colors disabled:bg-surface-secondary disabled:text-th-text-tertiary ${
            icon ? 'pl-10' : ''
          } ${error ? 'border-red-300 focus:ring-red-500' : 'border-th-border'}`}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SelectField
// ---------------------------------------------------------------------------

interface SelectFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  error?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  error,
  required,
  placeholder,
  disabled,
}: SelectFieldProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-th-text-secondary mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent transition-colors disabled:bg-surface-secondary disabled:text-th-text-tertiary ${
          error ? 'border-red-300 focus:ring-red-500' : 'border-th-border'
        }`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TextareaField
// ---------------------------------------------------------------------------

interface TextareaFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  error?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function TextareaField({
  label,
  name,
  value,
  onChange,
  rows = 3,
  error,
  required,
  placeholder,
  disabled,
}: TextareaFieldProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-th-text-secondary mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent transition-colors resize-none disabled:bg-surface-secondary disabled:text-th-text-tertiary ${
          error ? 'border-red-300 focus:ring-red-500' : 'border-th-border'
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SubmitButton
// ---------------------------------------------------------------------------

interface SubmitButtonProps {
  loading: boolean;
  label: string;
  loadingLabel?: string;
  disabled?: boolean;
}

export function SubmitButton({ loading, label, loadingLabel, disabled }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="w-full flex items-center justify-center gap-2 bg-th-accent-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-th-accent-700 focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {loading ? (loadingLabel || 'Saving...') : label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// CheckboxField
// ---------------------------------------------------------------------------

interface CheckboxFieldProps {
  label: string;
  name: string;
  checked: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  description?: string;
  disabled?: boolean;
}

export function CheckboxField({
  label,
  name,
  checked,
  onChange,
  description,
  disabled,
}: CheckboxFieldProps) {
  return (
    <label htmlFor={name} className="flex items-start gap-3 cursor-pointer">
      <input
        id={name}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="mt-0.5 h-4 w-4 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500 disabled:opacity-50"
      />
      <div>
        <span className="text-sm font-medium text-th-text-secondary">{label}</span>
        {description && <p className="text-xs text-th-text-tertiary mt-0.5">{description}</p>}
      </div>
    </label>
  );
}
