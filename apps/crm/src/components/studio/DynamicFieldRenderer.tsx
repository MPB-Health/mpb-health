import { useState, useEffect } from 'react';
import type { StudioField, PicklistOption } from '@mpbhealth/crm-core';
import { Search, X, Calendar, Clock, Mail, Phone, Link, Percent, DollarSign } from 'lucide-react';

interface DynamicFieldRendererProps {
  field: StudioField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

export function DynamicFieldRenderer({
  field,
  value,
  onChange,
  error,
  disabled,
  readOnly,
}: DynamicFieldRendererProps) {
  const isDisabled = disabled || readOnly;

  // Error styling
  const errorClass = error ? 'border-red-300 focus:ring-red-500' : 'border-th-border';

  // Base input class
  const baseInputClass = `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent transition-colors disabled:bg-surface-secondary disabled:text-th-text-tertiary ${errorClass}`;

  const renderLabel = () => (
    <label
      htmlFor={field.api_name}
      className="block text-sm font-medium text-th-text-secondary mb-1"
    >
      {field.label}
      {field.is_required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );

  const renderHelperText = () => {
    if (error) {
      return <p className="mt-1 text-xs text-red-600">{error}</p>;
    }
    if (field.help_text) {
      return <p className="mt-1 text-xs text-th-text-tertiary">{field.help_text}</p>;
    }
    return null;
  };

  switch (field.field_type) {
    case 'text':
    case 'auto_number':
      return (
        <div>
          {renderLabel()}
          <input
            id={field.api_name}
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || undefined}
            disabled={isDisabled || field.field_type === 'auto_number'}
            className={baseInputClass}
          />
          {renderHelperText()}
        </div>
      );

    case 'textarea':
      return (
        <div>
          {renderLabel()}
          <textarea
            id={field.api_name}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || undefined}
            disabled={isDisabled}
            rows={4}
            className={`${baseInputClass} resize-none`}
          />
          {renderHelperText()}
        </div>
      );

    case 'number':
      return (
        <div>
          {renderLabel()}
          <input
            id={field.api_name}
            type="number"
            value={value !== null && value !== undefined ? String(value) : ''}
            onChange={(e) => onChange(e.target.value ? parseInt(e.target.value, 10) : null)}
            placeholder={field.placeholder || undefined}
            disabled={isDisabled}
            min={field.config?.min}
            max={field.config?.max}
            className={baseInputClass}
          />
          {renderHelperText()}
        </div>
      );

    case 'decimal':
    case 'currency':
      return (
        <div>
          {renderLabel()}
          <div className="relative">
            {field.field_type === 'currency' && (
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-th-text-tertiary">
                <DollarSign className="w-4 h-4" />
              </div>
            )}
            <input
              id={field.api_name}
              type="number"
              step={field.config?.precision ? Math.pow(10, -field.config.precision) : 0.01}
              value={value !== null && value !== undefined ? String(value) : ''}
              onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
              placeholder={field.placeholder || undefined}
              disabled={isDisabled}
              className={`${baseInputClass} ${field.field_type === 'currency' ? 'pl-9' : ''}`}
            />
          </div>
          {renderHelperText()}
        </div>
      );

    case 'percent':
      return (
        <div>
          {renderLabel()}
          <div className="relative">
            <input
              id={field.api_name}
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={value !== null && value !== undefined ? String(value) : ''}
              onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
              placeholder={field.placeholder || undefined}
              disabled={isDisabled}
              className={`${baseInputClass} pr-9`}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-th-text-tertiary">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          {renderHelperText()}
        </div>
      );

    case 'email':
      return (
        <div>
          {renderLabel()}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-th-text-tertiary">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id={field.api_name}
              type="email"
              value={(value as string) || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder || 'email@example.com'}
              disabled={isDisabled}
              className={`${baseInputClass} pl-9`}
            />
          </div>
          {renderHelperText()}
        </div>
      );

    case 'phone':
      return (
        <div>
          {renderLabel()}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-th-text-tertiary">
              <Phone className="w-4 h-4" />
            </div>
            <input
              id={field.api_name}
              type="tel"
              value={(value as string) || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder || undefined}
              disabled={isDisabled}
              className={`${baseInputClass} pl-9`}
            />
          </div>
          {renderHelperText()}
        </div>
      );

    case 'url':
      return (
        <div>
          {renderLabel()}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-th-text-tertiary">
              <Link className="w-4 h-4" />
            </div>
            <input
              id={field.api_name}
              type="url"
              value={(value as string) || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder || 'https://example.com'}
              disabled={isDisabled}
              className={`${baseInputClass} pl-9`}
            />
          </div>
          {renderHelperText()}
        </div>
      );

    case 'date':
      return (
        <div>
          {renderLabel()}
          <div className="relative">
            <input
              id={field.api_name}
              type="date"
              value={(value as string) || ''}
              onChange={(e) => onChange(e.target.value)}
              disabled={isDisabled}
              className={baseInputClass}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-th-text-tertiary">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          {renderHelperText()}
        </div>
      );

    case 'datetime':
      return (
        <div>
          {renderLabel()}
          <div className="relative">
            <input
              id={field.api_name}
              type="datetime-local"
              value={(value as string) || ''}
              onChange={(e) => onChange(e.target.value)}
              disabled={isDisabled}
              className={baseInputClass}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-th-text-tertiary">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          {renderHelperText()}
        </div>
      );

    case 'checkbox':
      return (
        <div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              id={field.api_name}
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
              disabled={isDisabled}
              className="mt-0.5 h-4 w-4 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500 disabled:opacity-50"
            />
            <div>
              <span className="text-sm font-medium text-th-text-secondary">{field.label}</span>
              {field.help_text && (
                <p className="text-xs text-th-text-tertiary mt-0.5">{field.help_text}</p>
              )}
            </div>
          </label>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
      );

    case 'picklist':
      const picklistOptions: PicklistOption[] = field.config?.options || [];
      return (
        <div>
          {renderLabel()}
          <select
            id={field.api_name}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={isDisabled}
            className={baseInputClass}
          >
            <option value="">{field.placeholder || 'Select...'}</option>
            {picklistOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {renderHelperText()}
        </div>
      );

    case 'multi_picklist':
      const multiOptions: PicklistOption[] = field.config?.options || [];
      const selectedValues = (value as string[]) || [];
      return (
        <div>
          {renderLabel()}
          <MultiPicklistSelector
            options={multiOptions}
            selectedValues={selectedValues}
            onChange={onChange}
            disabled={isDisabled}
            placeholder={field.placeholder}
          />
          {renderHelperText()}
        </div>
      );

    case 'lookup':
      return (
        <div>
          {renderLabel()}
          <LookupField
            field={field}
            value={value as string}
            onChange={onChange}
            disabled={isDisabled}
          />
          {renderHelperText()}
        </div>
      );

    case 'multi_lookup':
      return (
        <div>
          {renderLabel()}
          <MultiLookupField
            field={field}
            value={(value as string[]) || []}
            onChange={onChange}
            disabled={isDisabled}
          />
          {renderHelperText()}
        </div>
      );

    case 'formula':
      // Formula fields are read-only computed values
      return (
        <div>
          {renderLabel()}
          <input
            id={field.api_name}
            type="text"
            value={value !== null && value !== undefined ? String(value) : ''}
            disabled
            className={`${baseInputClass} bg-surface-secondary`}
          />
          <p className="mt-1 text-xs text-th-text-tertiary">Calculated field</p>
        </div>
      );

    default:
      // Fallback to text input
      return (
        <div>
          {renderLabel()}
          <input
            id={field.api_name}
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || undefined}
            disabled={isDisabled}
            className={baseInputClass}
          />
          {renderHelperText()}
        </div>
      );
  }
}

// ---------------------------------------------------------------------------
// Multi-Picklist Selector
// ---------------------------------------------------------------------------

interface MultiPicklistSelectorProps {
  options: PicklistOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  placeholder?: string | null;
}

function MultiPicklistSelector({
  options,
  selectedValues,
  onChange,
  disabled,
  placeholder,
}: MultiPicklistSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleValue = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const getLabel = (val: string) => {
    const opt = options.find((o) => o.value === val);
    return opt?.label || val;
  };

  return (
    <div className="relative">
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full border rounded-lg px-3 py-2 text-sm cursor-pointer flex flex-wrap gap-1 min-h-[38px] ${
          disabled ? 'bg-surface-secondary cursor-not-allowed' : 'bg-white'
        } border-th-border`}
      >
        {selectedValues.length === 0 ? (
          <span className="text-th-text-tertiary">{placeholder || 'Select options...'}</span>
        ) : (
          selectedValues.map((val) => (
            <span
              key={val}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-th-accent-100 text-th-accent-700 text-xs"
            >
              {getLabel(val)}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleValue(val);
                  }}
                  className="hover:bg-th-accent-200 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))
        )}
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-th-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 px-3 py-2 hover:bg-surface-secondary cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedValues.includes(opt.value)}
                onChange={() => toggleValue(opt.value)}
                className="h-4 w-4 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
              />
              <span className="text-sm">{opt.label}</span>
              {opt.color && (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: opt.color }}
                />
              )}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lookup Field (simplified - would need integration with actual search)
// ---------------------------------------------------------------------------

interface LookupFieldProps {
  field: StudioField;
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

function LookupField({ field, value, onChange, disabled }: LookupFieldProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // In a real implementation, this would search the target module
  // For now, we show a simple text input for the ID

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-th-text-tertiary">
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder={`Search ${field.config?.target_module || 'records'}...`}
        disabled={disabled}
        className="w-full border border-th-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent disabled:bg-surface-secondary"
      />
      {value && !disabled && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-th-text-tertiary hover:text-th-text-secondary"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Multi-Lookup Field
// ---------------------------------------------------------------------------

interface MultiLookupFieldProps {
  field: StudioField;
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

function MultiLookupField({ field, value, onChange, disabled }: MultiLookupFieldProps) {
  const [inputValue, setInputValue] = useState('');

  const addValue = () => {
    if (inputValue && !value.includes(inputValue)) {
      onChange([...value, inputValue]);
      setInputValue('');
    }
  };

  const removeValue = (val: string) => {
    onChange(value.filter((v) => v !== val));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-2">
        {value.map((val) => (
          <span
            key={val}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-th-accent-100 text-th-accent-700 text-xs"
          >
            {val}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeValue(val)}
                className="hover:bg-th-accent-200 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}
      </div>

      {!disabled && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-th-text-tertiary">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addValue())}
              placeholder={`Search ${field.config?.target_module || 'records'}...`}
              className="w-full border border-th-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
            />
          </div>
          <button
            type="button"
            onClick={addValue}
            className="px-3 py-2 bg-th-accent-600 text-white rounded-lg text-sm hover:bg-th-accent-700"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Display Value Renderer (for read-only/list views)
// ---------------------------------------------------------------------------

interface DynamicFieldDisplayProps {
  field: StudioField;
  value: unknown;
}

export function DynamicFieldDisplay({ field, value }: DynamicFieldDisplayProps) {
  if (value === null || value === undefined) {
    return <span className="text-th-text-tertiary">-</span>;
  }

  switch (field.field_type) {
    case 'checkbox':
      return (
        <span className={value ? 'text-green-600' : 'text-th-text-tertiary'}>
          {value ? 'Yes' : 'No'}
        </span>
      );

    case 'currency':
      return (
        <span>
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(value as number)}
        </span>
      );

    case 'percent':
      return <span>{String(value)}%</span>;

    case 'date':
      return <span>{new Date(value as string).toLocaleDateString()}</span>;

    case 'datetime':
      return <span>{new Date(value as string).toLocaleString()}</span>;

    case 'picklist':
      const opt = field.config?.options?.find((o) => o.value === value);
      if (opt?.color) {
        return (
          <span
            className="px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: opt.color + '20', color: opt.color }}
          >
            {opt.label}
          </span>
        );
      }
      return <span>{opt?.label || String(value)}</span>;

    case 'multi_picklist':
      const values = value as string[];
      return (
        <div className="flex flex-wrap gap-1">
          {values.map((v) => {
            const o = field.config?.options?.find((opt) => opt.value === v);
            return (
              <span
                key={v}
                className="px-2 py-0.5 rounded bg-surface-secondary text-xs"
              >
                {o?.label || v}
              </span>
            );
          })}
        </div>
      );

    case 'url':
      return (
        <a
          href={value as string}
          target="_blank"
          rel="noopener noreferrer"
          className="text-th-accent-600 hover:underline"
        >
          {value as string}
        </a>
      );

    case 'email':
      return (
        <a href={`mailto:${value}`} className="text-th-accent-600 hover:underline">
          {value as string}
        </a>
      );

    case 'phone':
      return (
        <a href={`tel:${value}`} className="text-th-accent-600 hover:underline">
          {value as string}
        </a>
      );

    default:
      return <span>{String(value)}</span>;
  }
}

export default DynamicFieldRenderer;
