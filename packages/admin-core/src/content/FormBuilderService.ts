import { supabase } from '@mpbhealth/database';

// ── Types ────────────────────────────────────────────────────────────────────
// These types preserve the admin-portal-facing interface while mapping to the
// CRM's crm_web_forms / crm_web_form_submissions tables under the hood.

export type FormFieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'file'
  | 'date'
  | 'hidden'
  | 'number'
  | 'heading'
  | 'paragraph'
  | 'product_selector'
  | 'product_quantity'
  | 'product_config';

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  name: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  width?: 'full' | 'half';
  defaultValue?: string;
  content?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
}

export interface CmsForm {
  id: string;
  name: string;
  slug: string | null;
  fields: FormField[];
  settings: {
    success_message?: string;
    redirect_url?: string;
    lead_source?: string;
  };
  notification_emails: string[];
  status: 'draft' | 'active' | 'archived';
  entity_type: 'lead' | 'contact' | 'quote_request';
  description: string | null;
  styling: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  submission_count?: number;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  data: Record<string, unknown>;
  source_url: string | null;
  ip_address: string | null;
  user_agent: string | null;
  lead_id: string | null;
  status: 'new' | 'converted' | 'duplicate' | 'spam';
  created_at: string;
}

export interface FormCreateInput {
  name: string;
  slug?: string;
  fields?: FormField[];
  settings?: CmsForm['settings'];
  notification_emails?: string[];
  status?: CmsForm['status'];
  entity_type?: CmsForm['entity_type'];
  description?: string;
  styling?: Record<string, unknown>;
  created_by?: string | null;
}

export interface FormUpdateInput {
  name?: string;
  slug?: string;
  fields?: FormField[];
  settings?: CmsForm['settings'];
  notification_emails?: string[];
  status?: CmsForm['status'];
  entity_type?: CmsForm['entity_type'];
  description?: string;
  styling?: Record<string, unknown>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const CRM_FORM_COLUMNS =
  'id, org_id, name, description, slug, entity_type, status, fields, settings, styling, submit_count, last_submission_at, created_by, created_at, updated_at';

/**
 * Map a crm_web_forms row into the CmsForm shape the admin portal expects.
 * The CRM stores notification_email as a single string in settings; we expose
 * it as an array for backward compat with the DnD builder UI.
 */
function toCmsForm(row: Record<string, unknown>): CmsForm {
  const settings = (row.settings ?? {}) as Record<string, unknown>;
  const styling = (row.styling ?? {}) as Record<string, unknown>;

  const notificationEmail = settings.notificationEmail;
  const notificationEmails: string[] = notificationEmail
    ? String(notificationEmail).split(',').map((e) => e.trim()).filter(Boolean)
    : [];

  const fields = (row.fields ?? []) as FormField[];
  const mapped: FormField[] = fields.map((f) => ({
    ...f,
    name: f.name || f.id,
  }));

  return {
    id: row.id as string,
    name: row.name as string,
    slug: (row.slug as string) || null,
    description: (row.description as string) || null,
    entity_type: (row.entity_type as CmsForm['entity_type']) || 'lead',
    status: (row.status as CmsForm['status']) || 'draft',
    fields: mapped,
    settings: {
      success_message: styling.successMessage as string | undefined,
      redirect_url: settings.redirectUrl as string | undefined,
      lead_source: settings.lead_source as string | undefined,
    },
    styling,
    notification_emails: notificationEmails,
    created_by: (row.created_by as string) || null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    submission_count: (row.submit_count as number) ?? 0,
  };
}

/**
 * Map admin-portal form data back to the crm_web_forms column shape.
 */
function toCrmPayload(
  input: FormCreateInput | FormUpdateInput,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if ('name' in input && input.name !== undefined) payload.name = input.name;
  if ('slug' in input && input.slug !== undefined) payload.slug = input.slug || null;
  if ('description' in input && input.description !== undefined)
    payload.description = input.description || null;
  if ('entity_type' in input && input.entity_type !== undefined)
    payload.entity_type = input.entity_type;
  if ('status' in input && input.status !== undefined) payload.status = input.status;

  if ('fields' in input && input.fields !== undefined) {
    payload.fields = input.fields as unknown as Record<string, unknown>[];
  }

  if ('settings' in input || 'notification_emails' in input) {
    const settings: Record<string, unknown> = {};
    if (input.settings?.redirect_url !== undefined)
      settings.redirectUrl = input.settings.redirect_url;
    if (input.settings?.lead_source !== undefined)
      settings.lead_source = input.settings.lead_source;
    if ('notification_emails' in input && input.notification_emails?.length) {
      settings.notificationEmail = input.notification_emails.join(', ');
    }
    payload.settings = settings;
  }

  if ('styling' in input && input.styling !== undefined) {
    const styling = { ...input.styling };
    if (input.settings?.success_message !== undefined) {
      styling.successMessage = input.settings.success_message;
    }
    payload.styling = styling;
  } else if (input.settings?.success_message !== undefined) {
    payload.styling = { successMessage: input.settings.success_message };
  }

  return payload;
}

// ── Service ──────────────────────────────────────────────────────────────────

export class FormBuilderService {
  async getForms(): Promise<CmsForm[]> {
    const { data: forms, error } = await supabase
      .from('crm_web_forms')
      .select(CRM_FORM_COLUMNS)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return ((forms || []) as unknown as Record<string, unknown>[]).map(toCmsForm);
  }

  async getForm(id: string): Promise<CmsForm | null> {
    const { data, error } = await supabase
      .from('crm_web_forms')
      .select(CRM_FORM_COLUMNS)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return toCmsForm(data as unknown as Record<string, unknown>);
  }

  async createForm(input: FormCreateInput): Promise<CmsForm> {
    const payload = toCrmPayload(input);
    payload.entity_type = payload.entity_type || 'lead';
    payload.status = payload.status || 'draft';
    payload.fields = payload.fields || [];
    payload.settings = payload.settings || {};
    payload.styling = payload.styling || {};
    payload.submit_count = 0;
    if (input.created_by) payload.created_by = input.created_by;

    const { data, error } = await supabase
      .from('crm_web_forms')
      .insert(payload)
      .select(CRM_FORM_COLUMNS)
      .single();

    if (error) throw error;
    return toCmsForm(data as unknown as Record<string, unknown>);
  }

  async updateForm(id: string, input: FormUpdateInput): Promise<CmsForm> {
    const payload = toCrmPayload(input);

    const { data, error } = await supabase
      .from('crm_web_forms')
      .update(payload)
      .eq('id', id)
      .select(CRM_FORM_COLUMNS)
      .single();

    if (error) throw error;
    return toCmsForm(data as unknown as Record<string, unknown>);
  }

  async deleteForm(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_web_forms')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async getSubmissions(formId: string): Promise<FormSubmission[]> {
    const { data, error } = await supabase
      .from('crm_web_form_submissions')
      .select('id, form_id, data, source_url, ip_address, user_agent, lead_id, status, created_at')
      .eq('form_id', formId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as FormSubmission[];
  }

  async deleteSubmission(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_web_form_submissions')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async exportSubmissionsCsv(formId: string): Promise<string> {
    const form = await this.getForm(formId);
    if (!form) throw new Error('Form not found');

    const submissions = await this.getSubmissions(formId);
    if (submissions.length === 0) return '';

    const fieldNames = form.fields.map((f) => f.name || f.id);
    const headers = ['Submitted At', ...fieldNames, 'IP Address', 'User Agent', 'Status', 'Lead ID'];

    const escCsv = (v: unknown): string => {
      const s = v == null ? '' : String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const rows = submissions.map((sub) => {
      const cells: string[] = [
        new Date(sub.created_at).toISOString(),
        ...fieldNames.map((n) => escCsv(sub.data[n])),
        escCsv(sub.ip_address),
        escCsv(sub.user_agent),
        escCsv(sub.status),
        escCsv(sub.lead_id),
      ];
      return cells.join(',');
    });

    return [headers.map(escCsv).join(','), ...rows].join('\n');
  }

  /**
   * Generate embed code snippets for a form.
   * Uses slug in public URLs since `/forms/:slug` resolves by slug.
   */
  generateEmbedCode(
    form: { id: string; slug: string | null },
    baseUrl: string,
  ): { iframe: string; script: string; react: string } {
    const slug = form.slug || form.id;
    const formUrl = `${baseUrl}/forms/${slug}`;

    const iframe = `<iframe
  src="${formUrl}"
  width="100%"
  height="600"
  frameborder="0"
  style="border: none; max-width: 640px;"
  title="Contact Form"
></iframe>`;

    const script = `<div id="mpb-form-${form.id}"></div>
<script>
(function() {
  var container = document.getElementById('mpb-form-${form.id}');
  var iframe = document.createElement('iframe');
  iframe.src = '${formUrl}?embed=1';
  iframe.width = '100%';
  iframe.height = '600';
  iframe.frameBorder = '0';
  iframe.style.border = 'none';
  iframe.style.maxWidth = '640px';
  iframe.title = 'Contact Form';
  container.appendChild(iframe);

  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'mpb-form-resize' && e.data.formId === '${form.id}') {
      iframe.height = e.data.height;
    }
  });
})();
</script>`;

    const react = `import { MPBFormEmbed } from '@mpbhealth/form-embed';

<MPBFormEmbed
  formId="${form.id}"
  supabaseUrl="YOUR_SUPABASE_URL"
  supabaseAnonKey="YOUR_SUPABASE_ANON_KEY"
/>`;

    return { iframe, script, react };
  }
}

export const formBuilderService = new FormBuilderService();
