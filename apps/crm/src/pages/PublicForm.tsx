import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase, supabaseUrl } from '../lib/supabase';
import type { WebForm, FormField } from '@mpbhealth/crm-core';

export default function PublicForm() {
  const { slug } = useParams();
  const [form, setForm] = useState<WebForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!slug) return;

    const loadForm = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('crm_web_forms')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        setError('Form not found or is no longer active.');
      } else {
        setForm(data as WebForm);
        // Initialize default values for hidden fields
        const defaults: Record<string, string> = {};
        for (const field of (data.fields || []) as FormField[]) {
          if (field.type === 'hidden' && field.defaultValue) {
            defaults[field.id] = field.defaultValue;
          }
        }
        setFormData(defaults);
      }
      setLoading(false);
    };

    loadForm();
  }, [slug]);

  const handleChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    if (fieldErrors[fieldId]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    if (!form) return false;

    const errors: Record<string, string> = {};
    for (const field of form.fields) {
      if (field.type === 'heading' || field.type === 'paragraph') continue;

      const value = formData[field.id] || '';
      if (field.required && !value) {
        errors[field.id] = `${field.label} is required`;
      }
      if (field.validation) {
        if (field.validation.minLength && value.length < field.validation.minLength) {
          errors[field.id] = `Minimum ${field.validation.minLength} characters`;
        }
        if (field.validation.maxLength && value.length > field.validation.maxLength) {
          errors[field.id] = `Maximum ${field.validation.maxLength} characters`;
        }
        if (field.validation.pattern && value) {
          try {
            const re = new RegExp(field.validation.pattern);
            if (!re.test(value)) {
              errors[field.id] = `${field.label} format is invalid`;
            }
          } catch {
            /* ignore invalid pattern in builder */
          }
        }
      }
      if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors[field.id] = 'Please enter a valid email address';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !validate()) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/web-form-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_id: form.id,
          data: formData,
          source_url: window.location.href,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to submit form. Please try again.');
        setSubmitting(false);
        return;
      }

      // Redirect or show success
      if (result.redirect_url) {
        window.location.href = result.redirect_url;
      } else {
        setSubmitted(true);
      }
    } catch {
      setError('Failed to submit form. Please check your connection and try again.');
    }

    setSubmitting(false);
  };

  const styling = form?.styling || {};
  const primaryColor = styling.primaryColor || '#2563eb';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-th-text-primary mb-2">Form Not Available</h1>
          <p className="text-th-text-secondary">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary p-4">
        <div className="text-center max-w-md">
          <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: primaryColor }} />
          <h1 className="text-xl font-semibold text-th-text-primary mb-2">
            {styling.successMessage || 'Thank you! Your submission has been received.'}
          </h1>
        </div>
      </div>
    );
  }

  if (!form) return null;

  const hasHeadingField = form.fields.some((f) => f.type === 'heading');

  const renderField = (field: FormField) => {
    const hasError = Boolean(fieldErrors[field.id]);
    const inputClass = `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
      hasError
        ? 'border-red-400 focus:ring-red-300'
        : 'border-th-border focus:ring-blue-300'
    }`;

    switch (field.type) {
      case 'heading':
        return (
          <div key={field.id} className="col-span-full">
            <h3 className="text-lg font-semibold text-th-text-primary">{field.content || field.label}</h3>
          </div>
        );
      case 'paragraph':
        return (
          <div key={field.id} className="col-span-full">
            <p className="text-sm text-th-text-secondary">{field.content || field.label}</p>
          </div>
        );
      case 'hidden':
        return (
          <input key={field.id} type="hidden" value={formData[field.id] || ''} />
        );
      case 'textarea':
        return (
          <div key={field.id} className={field.width === 'half' ? '' : 'col-span-full'}>
            <label className="block text-sm font-medium text-th-text-primary mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              placeholder={field.placeholder}
              value={formData[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              className={inputClass}
              rows={3}
            />
            {hasError && <p className="text-xs text-red-500 mt-1">{fieldErrors[field.id]}</p>}
          </div>
        );
      case 'select':
        return (
          <div key={field.id} className={field.width === 'half' ? '' : 'col-span-full'}>
            <label className="block text-sm font-medium text-th-text-primary mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <select
              value={formData[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              className={inputClass}
            >
              <option value="">{field.placeholder || 'Select...'}</option>
              {field.options?.map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
            {hasError && <p className="text-xs text-red-500 mt-1">{fieldErrors[field.id]}</p>}
          </div>
        );
      case 'radio':
        return (
          <div key={field.id} className={field.width === 'half' ? '' : 'col-span-full'}>
            <label className="block text-sm font-medium text-th-text-primary mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="space-y-1.5">
              {(field.options || []).map((opt, i) => (
                <label key={i} className="flex items-center gap-2 text-sm text-th-text-primary">
                  <input
                    type="radio"
                    name={field.id}
                    value={opt}
                    checked={formData[field.id] === opt}
                    onChange={() => handleChange(field.id, opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
            {hasError && <p className="text-xs text-red-500 mt-1">{fieldErrors[field.id]}</p>}
          </div>
        );
      case 'checkbox':
        return (
          <div key={field.id} className={field.width === 'half' ? '' : 'col-span-full'}>
            <label className="flex items-center gap-2 text-sm text-th-text-primary">
              <input
                type="checkbox"
                checked={formData[field.id] === 'true'}
                onChange={(e) => handleChange(field.id, e.target.checked ? 'true' : '')}
              />
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {hasError && <p className="text-xs text-red-500 mt-1">{fieldErrors[field.id]}</p>}
          </div>
        );
      default:
        return (
          <div key={field.id} className={field.width === 'half' ? '' : 'col-span-full'}>
            <label className="block text-sm font-medium text-th-text-primary mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
              placeholder={field.placeholder}
              value={formData[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              maxLength={field.validation?.maxLength}
              className={inputClass}
            />
            {hasError && <p className="text-xs text-red-500 mt-1">{fieldErrors[field.id]}</p>}
          </div>
        );
    }
  };

  return (
    <div
      className="min-h-screen flex items-start justify-center py-12 px-4"
      style={{ backgroundColor: styling.backgroundColor || '#f9fafb' }}
    >
      <div className="w-full max-w-lg bg-surface-primary rounded-xl shadow-lg p-8">
        {styling.logoUrl && (
          <img src={styling.logoUrl} alt="Logo" className="h-10 mb-4" />
        )}
        {styling.headerText && !hasHeadingField && (
          <h1 className="text-xl font-bold text-th-text-primary mb-1">{styling.headerText}</h1>
        )}
        {styling.descriptionText && !form.fields.some((f) => f.type === 'paragraph') && (
          <p className="text-sm text-th-text-secondary mb-6">{styling.descriptionText}</p>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            {form.fields.map(renderField)}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 px-6 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50 flex items-center gap-2"
            style={{ backgroundColor: primaryColor }}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {styling.buttonText || 'Submit'}
          </button>
        </form>

        <p className="text-xs text-th-text-tertiary mt-6 text-center">
          Powered by MPB Health CRM
        </p>
      </div>
    </div>
  );
}
