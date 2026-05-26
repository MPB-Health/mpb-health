import type { UTMData, WebFormConfig, FormField } from './types';
import { getUTMParams, isValidEmail } from './utils';

interface RenderOptions {
  /** CSS selector or DOM element to render the form into */
  container: string | HTMLElement;
  /** CRM web form ID */
  formId?: string;
  /** CRM web form slug — alternative to formId */
  slug?: string;
  /** Supabase project URL */
  supabaseUrl: string;
  /** Supabase anon key */
  supabaseAnonKey: string;
  /** Override source_url */
  sourceUrl?: string;
  /** Extra static data merged into every submission */
  extraData?: Record<string, string>;
  /** Callback on success */
  onSuccess?: (submissionId: string) => void;
  /** Callback on error */
  onError?: (error: string) => void;
}

/**
 * Render an MPB Health CRM web form into a DOM container.
 * For non-React sites — produces plain HTML form with built-in validation.
 */
export async function renderForm(options: RenderOptions): Promise<void> {
  const el = typeof options.container === 'string'
    ? document.querySelector<HTMLElement>(options.container)
    : options.container;

  if (!el) {
    console.error('[MPBForms] Container not found:', options.container);
    return;
  }

  el.innerHTML = '<div style="display:flex;justify-content:center;padding:2rem"><div style="width:24px;height:24px;border:3px solid #e5e7eb;border-top-color:#3b82f6;border-radius:50%;animation:mpb-spin .6s linear infinite"></div></div><style>@keyframes mpb-spin{to{transform:rotate(360deg)}}</style>';

  try {
    const form = await fetchForm(options);
    if (!form) {
      el.innerHTML = '<p style="text-align:center;color:#ef4444;padding:2rem">Form not found or is no longer active.</p>';
      return;
    }
    renderFormHTML(el, form, options);
  } catch {
    el.innerHTML = '<p style="text-align:center;color:#ef4444;padding:2rem">Failed to load form.</p>';
  }
}

async function fetchForm(options: RenderOptions): Promise<WebFormConfig | null> {
  const base = options.supabaseUrl.replace(/\/$/, '');
  const restUrl = `${base}/rest/v1/crm_web_forms`;
  const selectCols = 'id,name,slug,fields,styling,status';

  let url: string;
  if (options.formId) {
    url = `${restUrl}?select=${selectCols}&id=eq.${encodeURIComponent(options.formId)}&status=eq.active&limit=1`;
  } else if (options.slug) {
    url = `${restUrl}?select=${selectCols}&slug=eq.${encodeURIComponent(options.slug)}&status=eq.active&limit=1`;
  } else {
    return null;
  }

  const resp = await fetch(url, {
    headers: {
      apikey: options.supabaseAnonKey,
      Authorization: `Bearer ${options.supabaseAnonKey}`,
    },
  });

  if (!resp.ok) return null;
  const rows = await resp.json();
  return rows?.[0] || null;
}

function renderFormHTML(container: HTMLElement, form: WebFormConfig, options: RenderOptions) {
  const primaryColor = form.styling?.primaryColor || '#2563eb';
  const formData: Record<string, string> = {};

  for (const field of form.fields) {
    if (field.type === 'hidden' && field.defaultValue) {
      formData[field.id] = field.defaultValue;
    }
  }
  if (options.extraData) Object.assign(formData, options.extraData);

  let html = '';
  if (form.styling?.logoUrl) {
    html += `<img src="${esc(form.styling.logoUrl)}" alt="Logo" style="height:40px;margin-bottom:1rem" />`;
  }
  if (form.styling?.headerText) {
    html += `<h2 style="font-size:1.25rem;font-weight:700;margin-bottom:.25rem">${esc(form.styling.headerText)}</h2>`;
  }
  if (form.styling?.descriptionText) {
    html += `<p style="font-size:.875rem;color:#6b7280;margin-bottom:1.5rem">${esc(form.styling.descriptionText)}</p>`;
  }

  html += '<div id="mpb-error" style="display:none;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:.75rem;margin-bottom:1rem;color:#b91c1c;font-size:.875rem"></div>';
  html += '<form id="mpb-form" style="font-family:inherit">';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">';

  for (const field of form.fields) {
    html += renderFieldHTML(field);
  }

  html += '</div>';
  html += `<button type="submit" id="mpb-submit" style="margin-top:1.5rem;padding:.625rem 1.5rem;background:${primaryColor};color:#fff;border:none;border-radius:8px;font-size:.875rem;font-weight:500;cursor:pointer">${esc(form.styling?.buttonText || 'Submit')}</button>`;
  html += '</form>';

  container.innerHTML = html;

  const formEl = container.querySelector<HTMLFormElement>('#mpb-form');
  if (!formEl) return;

  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorDiv = container.querySelector<HTMLElement>('#mpb-error');
    const submitBtn = container.querySelector<HTMLButtonElement>('#mpb-submit');

    const inputs = formEl.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('[data-field-id]');
    const data: Record<string, string> = { ...formData };
    const errors: string[] = [];

    inputs.forEach((input) => {
      const id = input.dataset.fieldId!;
      const fieldConfig = form.fields.find((f) => f.id === id);
      let value: string;

      if (input.type === 'checkbox') {
        value = (input as HTMLInputElement).checked ? 'true' : '';
      } else if (input.type === 'radio') {
        if ((input as HTMLInputElement).checked) value = input.value;
        else return;
      } else {
        value = input.value;
      }

      data[id] = value;

      if (fieldConfig?.required && !value) {
        errors.push(`${fieldConfig.label} is required`);
        input.style.borderColor = '#f87171';
      } else if (fieldConfig?.type === 'email' && value && !isValidEmail(value)) {
        errors.push('Please enter a valid email address');
        input.style.borderColor = '#f87171';
      } else {
        input.style.borderColor = '#d1d5db';
      }
    });

    if (errors.length > 0) {
      if (errorDiv) {
        errorDiv.textContent = errors[0];
        errorDiv.style.display = 'block';
      }
      return;
    }
    if (errorDiv) errorDiv.style.display = 'none';

    const utm = getUTMParams();
    Object.assign(data, utm);

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
    }

    try {
      const base = options.supabaseUrl.replace(/\/$/, '');
      const resp = await fetch(`${base}/functions/v1/web-form-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_id: form.id,
          data,
          source_url: options.sourceUrl || window.location.href,
        }),
      });

      const result = await resp.json();

      if (!resp.ok || !result.success) {
        const errMsg = result.error || 'Submission failed.';
        if (errorDiv) {
          errorDiv.textContent = errMsg;
          errorDiv.style.display = 'block';
        }
        options.onError?.(errMsg);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = form.styling?.buttonText || 'Submit';
        }
        return;
      }

      if (result.redirect_url) {
        window.location.href = result.redirect_url;
        return;
      }

      const successMsg = form.styling?.successMessage || 'Thank you! Your submission has been received.';
      container.innerHTML = `<div style="text-align:center;padding:2rem"><svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#22c55e" stroke-width="2" style="margin:0 auto 1rem"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg><p style="font-size:1.125rem;font-weight:600">${esc(successMsg)}</p></div>`;
      options.onSuccess?.(result.submission_id);
    } catch {
      const errMsg = 'Network error. Please try again.';
      if (errorDiv) {
        errorDiv.textContent = errMsg;
        errorDiv.style.display = 'block';
      }
      options.onError?.(errMsg);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = form.styling?.buttonText || 'Submit';
      }
    }
  });
}

function renderFieldHTML(field: FormField): string {
  const span = field.width === 'half' ? '' : 'grid-column:1/-1;';
  const inputStyle = 'width:100%;padding:.5rem .75rem;border:1px solid #d1d5db;border-radius:8px;font-size:.875rem;box-sizing:border-box;outline:none';
  const req = field.required ? '<span style="color:#ef4444">*</span>' : '';

  switch (field.type) {
    case 'heading':
      return `<div style="${span}"><h3 style="font-size:1.125rem;font-weight:600">${esc(field.content || field.label)}</h3></div>`;
    case 'paragraph':
      return `<div style="${span}"><p style="font-size:.875rem;color:#6b7280">${esc(field.content || field.label)}</p></div>`;
    case 'hidden':
      return `<input type="hidden" data-field-id="${esc(field.id)}" value="${esc(field.defaultValue || '')}" />`;
    case 'textarea':
      return `<div style="${span}"><label style="display:block;font-size:.875rem;font-weight:500;margin-bottom:.25rem">${esc(field.label)} ${req}</label><textarea data-field-id="${esc(field.id)}" placeholder="${esc(field.placeholder || '')}" rows="3" style="${inputStyle}"></textarea></div>`;
    case 'select': {
      const opts = (field.options || []).map((o) => `<option value="${esc(o)}">${esc(o)}</option>`).join('');
      return `<div style="${span}"><label style="display:block;font-size:.875rem;font-weight:500;margin-bottom:.25rem">${esc(field.label)} ${req}</label><select data-field-id="${esc(field.id)}" style="${inputStyle}"><option value="">${esc(field.placeholder || 'Select...')}</option>${opts}</select></div>`;
    }
    case 'radio': {
      const radios = (field.options || []).map((o) => `<label style="display:flex;align-items:center;gap:.5rem;font-size:.875rem"><input type="radio" name="${esc(field.id)}" data-field-id="${esc(field.id)}" value="${esc(o)}" />${esc(o)}</label>`).join('');
      return `<div style="${span}"><label style="display:block;font-size:.875rem;font-weight:500;margin-bottom:.25rem">${esc(field.label)} ${req}</label><div style="display:flex;flex-direction:column;gap:.375rem">${radios}</div></div>`;
    }
    case 'checkbox':
      return `<div style="${span}"><label style="display:flex;align-items:center;gap:.5rem;font-size:.875rem"><input type="checkbox" data-field-id="${esc(field.id)}" />${esc(field.label)} ${req}</label></div>`;
    default: {
      const type = field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text';
      return `<div style="${span}"><label style="display:block;font-size:.875rem;font-weight:500;margin-bottom:.25rem">${esc(field.label)} ${req}</label><input type="${type}" data-field-id="${esc(field.id)}" placeholder="${esc(field.placeholder || '')}" style="${inputStyle}" /></div>`;
    }
  }
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
