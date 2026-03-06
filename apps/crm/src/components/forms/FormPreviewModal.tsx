import { X } from 'lucide-react';
import type { FormField, FormStyling } from '@mpbhealth/crm-core';

interface FormPreviewModalProps {
  open: boolean;
  onClose: () => void;
  fields: FormField[];
  styling: FormStyling;
}

export function FormPreviewModal({ open, onClose, fields, styling }: FormPreviewModalProps) {
  if (!open) return null;

  const renderField = (field: FormField) => {
    const widthClass = field.width === 'half' ? 'w-1/2 inline-block px-2' : 'w-full';

    switch (field.type) {
      case 'heading':
        return (
          <div key={field.id} className={widthClass}>
            <h3 className="text-lg font-semibold">{field.content || field.label}</h3>
          </div>
        );
      case 'paragraph':
        return (
          <div key={field.id} className={widthClass}>
            <p className="text-sm text-gray-600">{field.content || field.label}</p>
          </div>
        );
      case 'hidden':
        return null;
      case 'textarea':
        return (
          <div key={field.id} className={`${widthClass} mb-4`}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              placeholder={field.placeholder}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              rows={3}
            />
          </div>
        );
      case 'select':
        return (
          <div key={field.id} className={`${widthClass} mb-4`}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option>{field.placeholder || 'Select...'}</option>
              {field.options?.map((opt, i) => <option key={i}>{opt}</option>)}
            </select>
          </div>
        );
      case 'radio':
        return (
          <div key={field.id} className={`${widthClass} mb-4`}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="space-y-1">
              {(field.options || []).map((opt, i) => (
                <label key={i} className="flex items-center gap-2 text-sm">
                  <input type="radio" name={field.id} /> {opt}
                </label>
              ))}
            </div>
          </div>
        );
      case 'checkbox':
        return (
          <div key={field.id} className={`${widthClass} mb-4`}>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" /> {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>
          </div>
        );
      default:
        return (
          <div key={field.id} className={`${widthClass} mb-4`}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
              placeholder={field.placeholder}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 z-10"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="p-8" style={{ backgroundColor: styling.backgroundColor || '#ffffff' }}>
          {styling.logoUrl && (
            <img src={styling.logoUrl} alt="Logo" className="h-10 mb-4" />
          )}
          {styling.headerText && (
            <h2 className="text-xl font-bold text-gray-900 mb-1">{styling.headerText}</h2>
          )}
          {styling.descriptionText && (
            <p className="text-sm text-gray-600 mb-6">{styling.descriptionText}</p>
          )}

          <div className="flex flex-wrap -mx-2">
            {fields.filter((f) => f.type !== 'hidden').map(renderField)}
          </div>

          <button
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-white mt-2"
            style={{ backgroundColor: styling.primaryColor || '#2563eb' }}
          >
            {styling.buttonText || 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
