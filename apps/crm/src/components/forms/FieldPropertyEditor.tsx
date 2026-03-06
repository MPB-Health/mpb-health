import { Plus, Trash2 } from 'lucide-react';
import type { FormField } from '@mpbhealth/crm-core';

interface FieldPropertyEditorProps {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
}

export function FieldPropertyEditor({ field, onUpdate }: FieldPropertyEditorProps) {
  const isLayoutField = field.type === 'heading' || field.type === 'paragraph';
  const hasOptions = field.type === 'select' || field.type === 'radio';
  const isHidden = field.type === 'hidden';

  const handleAddOption = () => {
    const options = [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`];
    onUpdate({ options });
  };

  const handleRemoveOption = (index: number) => {
    const options = [...(field.options || [])];
    options.splice(index, 1);
    onUpdate({ options });
  };

  const handleUpdateOption = (index: number, value: string) => {
    const options = [...(field.options || [])];
    options[index] = value;
    onUpdate({ options });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-th-text-tertiary uppercase tracking-wider">
        Field Properties
      </h3>

      <div className="space-y-3">
        {/* Label */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            {isLayoutField ? 'Content' : 'Label'}
          </label>
          <input
            type="text"
            value={isLayoutField ? (field.content || '') : field.label}
            onChange={(e) =>
              onUpdate(isLayoutField ? { content: e.target.value, label: e.target.value } : { label: e.target.value })
            }
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          />
        </div>

        {/* Placeholder (not for layout/hidden/checkbox/radio) */}
        {!isLayoutField && !isHidden && field.type !== 'checkbox' && field.type !== 'radio' && (
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              Placeholder
            </label>
            <input
              type="text"
              value={field.placeholder || ''}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            />
          </div>
        )}

        {/* Default value (for hidden fields) */}
        {isHidden && (
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              Default Value
            </label>
            <input
              type="text"
              value={field.defaultValue || ''}
              onChange={(e) => onUpdate({ defaultValue: e.target.value })}
              className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            />
          </div>
        )}

        {/* Required toggle */}
        {!isLayoutField && (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-th-text-secondary">Required</label>
            <button
              onClick={() => onUpdate({ required: !field.required })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                field.required ? 'bg-th-accent-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  field.required ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        )}

        {/* Width */}
        {!isLayoutField && (
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">Width</label>
            <div className="flex gap-2">
              <button
                onClick={() => onUpdate({ width: 'full' })}
                className={`flex-1 px-3 py-1.5 text-sm rounded-lg border ${
                  (field.width || 'full') === 'full'
                    ? 'border-th-accent-500 bg-th-accent-50 text-th-accent-700'
                    : 'border-th-border text-th-text-secondary hover:bg-surface-secondary'
                }`}
              >
                Full
              </button>
              <button
                onClick={() => onUpdate({ width: 'half' })}
                className={`flex-1 px-3 py-1.5 text-sm rounded-lg border ${
                  field.width === 'half'
                    ? 'border-th-accent-500 bg-th-accent-50 text-th-accent-700'
                    : 'border-th-border text-th-text-secondary hover:bg-surface-secondary'
                }`}
              >
                Half
              </button>
            </div>
          </div>
        )}

        {/* Options (for select/radio) */}
        {hasOptions && (
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">Options</label>
            <div className="space-y-2">
              {(field.options || []).map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleUpdateOption(index, e.target.value)}
                    className="flex-1 border border-th-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  />
                  <button
                    onClick={() => handleRemoveOption(index)}
                    className="p-1 rounded hover:bg-red-100 text-th-text-tertiary hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={handleAddOption}
                className="flex items-center gap-1.5 text-sm text-th-accent-600 hover:text-th-accent-700"
              >
                <Plus className="w-3.5 h-3.5" /> Add Option
              </button>
            </div>
          </div>
        )}

        {/* Validation */}
        {!isLayoutField && !isHidden && field.type !== 'checkbox' && (
          <div className="border-t border-th-border pt-3">
            <p className="text-xs font-semibold text-th-text-tertiary uppercase tracking-wider mb-2">
              Validation
            </p>

            {(field.type === 'text' || field.type === 'textarea' || field.type === 'email' || field.type === 'phone') && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-th-text-tertiary mb-0.5">Min Length</label>
                  <input
                    type="number"
                    value={field.validation?.minLength || ''}
                    onChange={(e) =>
                      onUpdate({
                        validation: {
                          ...field.validation,
                          minLength: e.target.value ? parseInt(e.target.value) : undefined,
                        },
                      })
                    }
                    className="w-full border border-th-border rounded-lg px-2 py-1.5 text-sm"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-xs text-th-text-tertiary mb-0.5">Max Length</label>
                  <input
                    type="number"
                    value={field.validation?.maxLength || ''}
                    onChange={(e) =>
                      onUpdate({
                        validation: {
                          ...field.validation,
                          maxLength: e.target.value ? parseInt(e.target.value) : undefined,
                        },
                      })
                    }
                    className="w-full border border-th-border rounded-lg px-2 py-1.5 text-sm"
                    min={0}
                  />
                </div>
              </div>
            )}

            {field.type === 'number' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-th-text-tertiary mb-0.5">Min</label>
                  <input
                    type="number"
                    value={field.validation?.min ?? ''}
                    onChange={(e) =>
                      onUpdate({
                        validation: {
                          ...field.validation,
                          min: e.target.value ? parseFloat(e.target.value) : undefined,
                        },
                      })
                    }
                    className="w-full border border-th-border rounded-lg px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-th-text-tertiary mb-0.5">Max</label>
                  <input
                    type="number"
                    value={field.validation?.max ?? ''}
                    onChange={(e) =>
                      onUpdate({
                        validation: {
                          ...field.validation,
                          max: e.target.value ? parseFloat(e.target.value) : undefined,
                        },
                      })
                    }
                    className="w-full border border-th-border rounded-lg px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Field type info */}
        <div className="border-t border-th-border pt-3">
          <p className="text-xs text-th-text-tertiary">
            Type: <span className="font-medium text-th-text-secondary">{field.type}</span>
          </p>
          <p className="text-xs text-th-text-tertiary">
            ID: <span className="font-mono text-th-text-secondary">{field.id}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
