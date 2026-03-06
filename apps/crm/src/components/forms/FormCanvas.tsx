import { useState } from 'react';
import { GripVertical, Trash2 } from 'lucide-react';
import type { FormField, FormFieldType, FormStyling } from '@mpbhealth/crm-core';

interface FormCanvasProps {
  fields: FormField[];
  styling: FormStyling;
  selectedFieldId: string | null;
  onSelectField: (id: string | null) => void;
  onReorderFields: (fields: FormField[]) => void;
  onRemoveField: (id: string) => void;
  onAddFieldAtIndex: (type: FormFieldType, index: number) => void;
}

export function FormCanvas({
  fields,
  styling,
  selectedFieldId,
  onSelectField,
  onReorderFields,
  onRemoveField,
  onAddFieldAtIndex,
}: FormCanvasProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.setData('reorderIndex', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = e.dataTransfer.types.includes('fieldtype') ? 'copy' : 'move';
    setDropIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();

    // Check if this is a new field from the palette
    const newFieldType = e.dataTransfer.getData('fieldType') as FormFieldType;
    if (newFieldType) {
      onAddFieldAtIndex(newFieldType, index);
      setDragIndex(null);
      setDropIndex(null);
      return;
    }

    // Reorder existing field
    const fromIndex = parseInt(e.dataTransfer.getData('reorderIndex'), 10);
    if (isNaN(fromIndex) || fromIndex === index) {
      setDragIndex(null);
      setDropIndex(null);
      return;
    }

    const newFields = [...fields];
    const [moved] = newFields.splice(fromIndex, 1);
    newFields.splice(index > fromIndex ? index - 1 : index, 0, moved);
    onReorderFields(newFields);
    setDragIndex(null);
    setDropIndex(null);
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const newFieldType = e.dataTransfer.getData('fieldType') as FormFieldType;
    if (newFieldType) {
      onAddFieldAtIndex(newFieldType, fields.length);
    }
    setDragIndex(null);
    setDropIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDropIndex(null);
  };

  const renderFieldPreview = (field: FormField) => {
    const widthClass = field.width === 'half' ? 'w-1/2' : 'w-full';

    switch (field.type) {
      case 'heading':
        return (
          <div className={widthClass}>
            <h3 className="text-lg font-semibold text-th-text-primary">
              {field.content || field.label || 'Heading'}
            </h3>
          </div>
        );

      case 'paragraph':
        return (
          <div className={widthClass}>
            <p className="text-sm text-th-text-secondary">
              {field.content || field.label || 'Paragraph text'}
            </p>
          </div>
        );

      case 'hidden':
        return (
          <div className={widthClass}>
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-400">
              Hidden: {field.label} = {field.defaultValue || '(empty)'}
            </div>
          </div>
        );

      case 'textarea':
        return (
          <div className={widthClass}>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              placeholder={field.placeholder || ''}
              className="w-full border border-th-border rounded-lg px-3 py-2 text-sm pointer-events-none bg-white"
              rows={3}
              readOnly
            />
          </div>
        );

      case 'select':
        return (
          <div className={widthClass}>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <select className="w-full border border-th-border rounded-lg px-3 py-2 text-sm pointer-events-none bg-white">
              <option>{field.placeholder || 'Select...'}</option>
              {field.options?.map((opt, i) => (
                <option key={i}>{opt}</option>
              ))}
            </select>
          </div>
        );

      case 'radio':
        return (
          <div className={widthClass}>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="space-y-1">
              {(field.options || ['Option 1']).map((opt, i) => (
                <label key={i} className="flex items-center gap-2 text-sm text-th-text-secondary">
                  <input type="radio" name={field.id} disabled className="pointer-events-none" />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div className={widthClass}>
            <label className="flex items-center gap-2 text-sm text-th-text-secondary">
              <input type="checkbox" disabled className="pointer-events-none" />
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
          </div>
        );

      default:
        return (
          <div className={widthClass}>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
              placeholder={field.placeholder || ''}
              className="w-full border border-th-border rounded-lg px-3 py-2 text-sm pointer-events-none bg-white"
              readOnly
            />
          </div>
        );
    }
  };

  return (
    <div
      className="bg-white rounded-xl border border-th-border p-6 min-h-[400px]"
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
      onDrop={handleCanvasDrop}
    >
      {/* Form header preview */}
      {(styling.headerText || styling.descriptionText) && (
        <div className="mb-6">
          {styling.headerText && (
            <h2 className="text-xl font-bold text-th-text-primary">{styling.headerText}</h2>
          )}
          {styling.descriptionText && (
            <p className="text-sm text-th-text-tertiary mt-1">{styling.descriptionText}</p>
          )}
        </div>
      )}

      {fields.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-th-text-tertiary border-2 border-dashed border-th-border rounded-xl">
          <p className="text-sm">Drag fields here or click to add</p>
          <p className="text-xs mt-1">Build your form by adding fields from the left panel</p>
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onClick={(e) => {
                e.stopPropagation();
                onSelectField(field.id);
              }}
              className={`group flex items-start gap-2 p-3 rounded-lg border transition-all cursor-pointer ${
                selectedFieldId === field.id
                  ? 'border-th-accent-500 bg-th-accent-50 ring-1 ring-th-accent-200'
                  : 'border-transparent hover:border-th-border hover:bg-surface-secondary'
              } ${
                dropIndex === index && dragIndex !== index
                  ? 'border-t-2 border-t-th-accent-500'
                  : ''
              }`}
            >
              <div className="flex-shrink-0 pt-1 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-4 h-4 text-th-text-tertiary" />
              </div>

              <div className="flex-1 min-w-0">
                {renderFieldPreview(field)}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveField(field.id);
                }}
                className="flex-shrink-0 p-1 rounded hover:bg-red-100 text-th-text-tertiary hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Submit button preview */}
      {fields.length > 0 && (
        <div className="mt-6">
          <button
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: styling.primaryColor || '#2563eb' }}
            disabled
          >
            {styling.buttonText || 'Submit'}
          </button>
        </div>
      )}
    </div>
  );
}
