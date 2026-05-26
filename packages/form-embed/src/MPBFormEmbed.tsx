import { useState, useEffect, useCallback, type FormEvent } from 'react';
import type { MPBFormEmbedProps, WebFormConfig, FormField } from './types';
import { getUTMParams, isValidEmail } from './utils';

/**
 * Embeddable React component that renders an MPB Health CRM web form,
 * handles client-side validation, and submits via the web-form-submit
 * Edge Function so submissions flow into the CRM lead pipeline.
 */
export function MPBFormEmbed({
  formId,
  slug,
  supabaseUrl,
  supabaseAnonKey,
  sourceUrl,
  extraData,
  onSuccess,
  onError,
  className,
}: MPBFormEmbedProps) {
  const [form, setForm] = useState<WebFormConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const fetchForm = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const base = supabaseUrl.replace(/\/$/, '');
      const restUrl = `${base}/rest/v1/crm_web_forms`;
      const selectCols = 'id,name,slug,fields,styling,status';

      let url: string;
      if (formId) {
        url = `${restUrl}?select=${selectCols}&id=eq.${encodeURIComponent(formId)}&status=eq.active&limit=1`;
      } else if (slug) {
        url = `${restUrl}?select=${selectCols}&slug=eq.${encodeURIComponent(slug)}&status=eq.active&limit=1`;
      } else {
        setError('Either formId or slug is required.');
        setLoading(false);
        return;
      }

      const resp = await fetch(url, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
      });

      if (!resp.ok) {
        setError('Failed to load form.');
        setLoading(false);
        return;
      }

      const rows = await resp.json();
      if (!rows || rows.length === 0) {
        setError('Form not found or is no longer active.');
        setLoading(false);
        return;
      }

      const data = rows[0] as WebFormConfig;
      setForm(data);

      const defaults: Record<string, string> = {};
      for (const field of data.fields || []) {
        if (field.type === 'hidden' && field.defaultValue) {
          defaults[field.id] = field.defaultValue;
        }
      }
      if (extraData) Object.assign(defaults, extraData);
      setFormData(defaults);
    } catch {
      setError('Failed to load form. Please try again.');
    }

    setLoading(false);
  }, [formId, slug, supabaseUrl, supabaseAnonKey, extraData]);

  useEffect(() => {
    fetchForm();
  }, [fetchForm]);

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
            if (!new RegExp(field.validation.pattern).test(value)) {
              errors[field.id] = `${field.label} format is invalid`;
            }
          } catch { /* ignore bad patterns */ }
        }
      }
      if (field.type === 'email' && value && !isValidEmail(value)) {
        errors[field.id] = 'Please enter a valid email address';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form || !validate()) return;

    setSubmitting(true);
    setError(null);

    try {
      const utm = getUTMParams();
      const submissionData = { ...formData, ...utm };

      const base = supabaseUrl.replace(/\/$/, '');
      const resp = await fetch(`${base}/functions/v1/web-form-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_id: form.id,
          data: submissionData,
          source_url: sourceUrl || (typeof window !== 'undefined' ? window.location.href : ''),
        }),
      });

      const result = await resp.json();

      if (!resp.ok || !result.success) {
        const errMsg = result.error || 'Submission failed. Please try again.';
        setError(errMsg);
        onError?.(errMsg);
        setSubmitting(false);
        return;
      }

      if (result.redirect_url) {
        window.location.href = result.redirect_url;
        return;
      }

      setSubmitted(true);
      onSuccess?.(result.submission_id);
    } catch {
      const errMsg = 'Network error. Please check your connection and try again.';
      setError(errMsg);
      onError?.(errMsg);
    }

    setSubmitting(false);
  };

  // ── Render ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={className} style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <div style={{
          width: 24, height: 24,
          border: '3px solid #e5e7eb', borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'mpb-spin 0.6s linear infinite',
        }} />
        <style>{`@keyframes mpb-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className={className} style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
        <p>{error}</p>
      </div>
    );
  }

  if (submitted) {
    const msg = form?.styling?.successMessage || 'Thank you! Your submission has been received.';
    return (
      <div className={className} style={{ textAlign: 'center', padding: '2rem' }}>
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke={form?.styling?.primaryColor || '#22c55e'} strokeWidth="2" style={{ margin: '0 auto 1rem' }}>
          <circle cx="12" cy="12" r="10" />
          <path d="M9 12l2 2 4-4" />
        </svg>
        <p style={{ fontSize: '1.125rem', fontWeight: 600 }}>{msg}</p>
      </div>
    );
  }

  if (!form) return null;

  const primaryColor = form.styling?.primaryColor || '#2563eb';

  return (
    <div className={className} style={{ fontFamily: form.styling?.fontFamily || 'inherit' }}>
      {form.styling?.logoUrl && (
        <img src={form.styling.logoUrl} alt="Logo" style={{ height: 40, marginBottom: '1rem' }} />
      )}
      {form.styling?.headerText && (
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          {form.styling.headerText}
        </h2>
      )}
      {form.styling?.descriptionText && (
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
          {form.styling.descriptionText}
        </p>
      )}

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: 8, padding: '0.75rem', marginBottom: '1rem',
          color: '#b91c1c', fontSize: '0.875rem',
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {form.fields.map((field) => (
            <FormFieldRenderer
              key={field.id}
              field={field}
              value={formData[field.id] || ''}
              error={fieldErrors[field.id]}
              onChange={(val) => handleChange(field.id, val)}
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={{
            marginTop: '1.5rem',
            padding: '0.625rem 1.5rem',
            backgroundColor: primaryColor,
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? 'Submitting...' : (form.styling?.buttonText || 'Submit')}
        </button>
      </form>
    </div>
  );
}

// ── Field Renderer ────────────────────────────────────────────────────────────

function FormFieldRenderer({
  field,
  value,
  error,
  onChange,
}: {
  field: FormField;
  value: string;
  error?: string;
  onChange: (val: string) => void;
}) {
  const spanFull = field.width !== 'half';
  const wrapStyle: React.CSSProperties = {
    gridColumn: spanFull ? '1 / -1' : undefined,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    border: `1px solid ${error ? '#f87171' : '#d1d5db'}`,
    borderRadius: 8,
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: 500,
    marginBottom: '0.25rem',
  };

  switch (field.type) {
    case 'heading':
      return (
        <div style={{ ...wrapStyle }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{field.content || field.label}</h3>
        </div>
      );
    case 'paragraph':
      return (
        <div style={{ ...wrapStyle }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{field.content || field.label}</p>
        </div>
      );
    case 'hidden':
      return <input type="hidden" value={value} />;
    case 'textarea':
      return (
        <div style={wrapStyle}>
          <label style={labelStyle}>
            {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
          </label>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            style={inputStyle}
          />
          {error && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{error}</p>}
        </div>
      );
    case 'select':
      return (
        <div style={wrapStyle}>
          <label style={labelStyle}>
            {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
          </label>
          <select value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
            <option value="">{field.placeholder || 'Select...'}</option>
            {field.options?.map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
          {error && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{error}</p>}
        </div>
      );
    case 'radio':
      return (
        <div style={wrapStyle}>
          <label style={labelStyle}>
            {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {(field.options || []).map((opt, i) => (
              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <input type="radio" name={field.id} value={opt} checked={value === opt} onChange={() => onChange(opt)} />
                {opt}
              </label>
            ))}
          </div>
          {error && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{error}</p>}
        </div>
      );
    case 'checkbox':
      return (
        <div style={wrapStyle}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <input type="checkbox" checked={value === 'true'} onChange={(e) => onChange(e.target.checked ? 'true' : '')} />
            {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
          </label>
          {error && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{error}</p>}
        </div>
      );
    default: {
      const inputType = field.type === 'email' ? 'email'
        : field.type === 'phone' ? 'tel'
        : field.type === 'number' ? 'number'
        : field.type === 'date' ? 'date'
        : 'text';
      return (
        <div style={wrapStyle}>
          <label style={labelStyle}>
            {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
          </label>
          <input
            type={inputType}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            maxLength={field.validation?.maxLength}
            style={inputStyle}
          />
          {error && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{error}</p>}
        </div>
      );
    }
  }
}
