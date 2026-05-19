import { supabase } from '@mpbhealth/database';

// ── Types ────────────────────────────────────────────────────────────────────

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
  | 'hidden';

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  name: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
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
  };
  notification_emails: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
  submission_count?: number;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  data: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface FormCreateInput {
  name: string;
  slug?: string;
  fields?: FormField[];
  settings?: CmsForm['settings'];
  notification_emails?: string[];
  created_by?: string | null;
}

export interface FormUpdateInput {
  name?: string;
  slug?: string;
  fields?: FormField[];
  settings?: CmsForm['settings'];
  notification_emails?: string[];
}

// ── Service ──────────────────────────────────────────────────────────────────

const FORM_COLUMNS =
  'id, name, slug, fields, settings, notification_emails, created_by, created_at, updated_at';

export class FormBuilderService {
  async getForms(): Promise<CmsForm[]> {
    const { data: forms, error } = await supabase
      .from('cms_forms')
      .select(FORM_COLUMNS)
      .order('created_at', { ascending: false });

    if (error) throw error;
    const rows = (forms || []) as unknown as CmsForm[];

    const { data: counts, error: countError } = await supabase
      .from('cms_form_submissions')
      .select('form_id');

    if (!countError && counts) {
      const countMap = new Map<string, number>();
      for (const row of counts as unknown as { form_id: string }[]) {
        countMap.set(row.form_id, (countMap.get(row.form_id) || 0) + 1);
      }
      for (const form of rows) {
        form.submission_count = countMap.get(form.id) || 0;
      }
    }

    return rows;
  }

  async getForm(id: string): Promise<CmsForm | null> {
    const { data, error } = await supabase
      .from('cms_forms')
      .select(FORM_COLUMNS)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return (data as unknown as CmsForm | null) ?? null;
  }

  async createForm(input: FormCreateInput): Promise<CmsForm> {
    const { data, error } = await supabase
      .from('cms_forms')
      .insert({
        name: input.name,
        slug: input.slug || null,
        fields: (input.fields || []) as unknown as Record<string, unknown>[],
        settings: (input.settings || {}) as unknown as Record<string, unknown>,
        notification_emails: input.notification_emails || [],
        created_by: input.created_by || null,
      })
      .select(FORM_COLUMNS)
      .single();

    if (error) throw error;
    return data as unknown as CmsForm;
  }

  async updateForm(id: string, input: FormUpdateInput): Promise<CmsForm> {
    const updates: Record<string, unknown> = {};
    if (input.name !== undefined) updates.name = input.name;
    if (input.slug !== undefined) updates.slug = input.slug || null;
    if (input.fields !== undefined) updates.fields = input.fields as unknown as Record<string, unknown>[];
    if (input.settings !== undefined) updates.settings = input.settings as unknown as Record<string, unknown>;
    if (input.notification_emails !== undefined) updates.notification_emails = input.notification_emails;

    const { data, error } = await supabase
      .from('cms_forms')
      .update(updates)
      .eq('id', id)
      .select(FORM_COLUMNS)
      .single();

    if (error) throw error;
    return data as unknown as CmsForm;
  }

  async deleteForm(id: string): Promise<void> {
    const { error } = await supabase
      .from('cms_forms')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async getSubmissions(formId: string): Promise<FormSubmission[]> {
    const { data, error } = await supabase
      .from('cms_form_submissions')
      .select('id, form_id, data, ip_address, user_agent, created_at')
      .eq('form_id', formId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as FormSubmission[];
  }

  async deleteSubmission(id: string): Promise<void> {
    const { error } = await supabase
      .from('cms_form_submissions')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async exportSubmissionsCsv(formId: string): Promise<string> {
    const form = await this.getForm(formId);
    if (!form) throw new Error('Form not found');

    const submissions = await this.getSubmissions(formId);
    if (submissions.length === 0) return '';

    const fieldNames = form.fields.map((f) => f.name);
    const headers = ['Submitted At', ...fieldNames, 'IP Address', 'User Agent'];

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
      ];
      return cells.join(',');
    });

    return [headers.map(escCsv).join(','), ...rows].join('\n');
  }
}

export const formBuilderService = new FormBuilderService();
