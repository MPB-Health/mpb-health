import { useState, useMemo } from 'react';
import { Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import type {
  StudioModule,
  StudioLayout,
  StudioField,
  DynamicRecord,
  ValidationError,
} from '@mpbhealth/crm-core';
import { DynamicFieldRenderer } from './DynamicFieldRenderer';

interface DynamicFormProps {
  module: StudioModule;
  layout: StudioLayout;
  fields: StudioField[];
  record?: DynamicRecord;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  validationErrors?: ValidationError[];
}

export function DynamicForm({
  module,
  layout,
  fields,
  record,
  onSubmit,
  onCancel,
  loading = false,
  validationErrors = [],
}: DynamicFormProps) {
  // Build initial form data from record or defaults
  const initialData = useMemo(() => {
    const data: Record<string, unknown> = {};

    // System field
    data.name = record?.name || '';

    // Custom fields
    for (const field of fields) {
      if (!field.is_system) {
        data[field.api_name] = record?.[field.api_name] ?? field.default_value ?? null;
      }
    }

    return data;
  }, [fields, record]);

  const [formData, setFormData] = useState<Record<string, unknown>>(initialData);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Build field lookup
  const fieldMap = useMemo(() => {
    const map = new Map<string, StudioField>();
    for (const field of fields) {
      map.set(field.id, field);
    }
    return map;
  }, [fields]);

  // Build validation error lookup
  const errorMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const error of validationErrors) {
      if (error.field_api_name) {
        map.set(error.field_api_name, error.message);
      } else if (error.field_id) {
        const field = fieldMap.get(error.field_id);
        if (field) {
          map.set(field.api_name, error.message);
        }
      }
    }
    return map;
  }, [validationErrors, fieldMap]);

  const handleFieldChange = (apiName: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [apiName]: value }));
  };

  const toggleSection = (sectionName: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionName)) {
        next.delete(sectionName);
      } else {
        next.add(sectionName);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  // Render the name field at the top (always present)
  const renderNameField = () => {
    const nameField = fields.find((f) => f.api_name === 'name');
    return (
      <div className="mb-6">
        <label
          htmlFor="name"
          className="block text-sm font-medium text-th-text-secondary mb-1"
        >
          {nameField?.label || 'Name'}
          <span className="text-red-500 ml-0.5">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={(formData.name as string) || ''}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          placeholder={nameField?.placeholder || `Enter ${module.singular_name} name`}
          disabled={loading}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent transition-colors disabled:bg-surface-secondary ${
            errorMap.has('name') ? 'border-red-300' : 'border-th-border'
          }`}
        />
        {errorMap.has('name') && (
          <p className="mt-1 text-xs text-red-600">{errorMap.get('name')}</p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name field always at top */}
      {renderNameField()}

      {/* Layout sections */}
      {layout.sections.map((section, sectionIndex) => {
        const isCollapsed = collapsedSections.has(section.name);
        const columns = section.columns || 2;

        return (
          <div
            key={`${section.name}-${sectionIndex}`}
            className="border border-th-border rounded-lg overflow-hidden"
          >
            {/* Section header */}
            <button
              type="button"
              onClick={() => toggleSection(section.name)}
              className="w-full px-4 py-3 bg-surface-secondary flex items-center justify-between text-left hover:bg-surface-tertiary transition-colors"
            >
              <span className="font-medium text-th-text-primary">{section.name}</span>
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5 text-th-text-tertiary" />
              ) : (
                <ChevronDown className="w-5 h-5 text-th-text-tertiary" />
              )}
            </button>

            {/* Section fields */}
            {!isCollapsed && (
              <div className="p-4">
                <div
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                  }}
                >
                  {section.fields
                    .filter((fieldRef) => {
                      const field = fieldMap.get(fieldRef.field_id);
                      // Skip the name field since we render it at the top
                      return field && field.api_name !== 'name';
                    })
                    .map((fieldRef) => {
                      const field = fieldMap.get(fieldRef.field_id);
                      if (!field) return null;

                      const span = fieldRef.span || 1;

                      return (
                        <div
                          key={field.id}
                          style={{ gridColumn: `span ${Math.min(span, columns)}` }}
                        >
                          <DynamicFieldRenderer
                            field={field}
                            value={formData[field.api_name]}
                            onChange={(value) => handleFieldChange(field.api_name, value)}
                            error={errorMap.get(field.api_name)}
                            disabled={loading}
                            readOnly={fieldRef.read_only}
                          />
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Show any fields not in layout */}
      {(() => {
        const fieldsInLayout = new Set<string>();
        for (const section of layout.sections) {
          for (const fieldRef of section.fields) {
            fieldsInLayout.add(fieldRef.field_id);
          }
        }

        const orphanFields = fields.filter(
          (f) => !fieldsInLayout.has(f.id) && !f.is_system && f.api_name !== 'name'
        );

        if (orphanFields.length === 0) return null;

        return (
          <div className="border border-th-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-surface-secondary">
              <span className="font-medium text-th-text-primary">Additional Fields</span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              {orphanFields.map((field) => (
                <div key={field.id}>
                  <DynamicFieldRenderer
                    field={field}
                    value={formData[field.api_name]}
                    onChange={(value) => handleFieldChange(field.api_name, value)}
                    error={errorMap.get(field.api_name)}
                    disabled={loading}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Global validation errors */}
      {validationErrors.filter((e) => !e.field_api_name && !e.field_id).length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <ul className="text-sm text-red-600 space-y-1">
            {validationErrors
              .filter((e) => !e.field_api_name && !e.field_id)
              .map((error, idx) => (
                <li key={idx}>{error.message}</li>
              ))}
          </ul>
        </div>
      )}

      {/* Form actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-th-border">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg text-sm font-medium hover:bg-th-accent-700 transition-colors disabled:opacity-50"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Saving...' : record ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}

export default DynamicForm;
