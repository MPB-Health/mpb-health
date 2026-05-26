import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  WebForm,
  WebFormCreateInput,
  WebFormUpdateInput,
  WebFormSubmission,
  SubmissionFilters,
  FormAnalytics,
  FormStatus,
} from './types';

export class FormService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all forms for the current org
   */
  async getForms(
    filters: { status?: FormStatus; search?: string } = {},
    limit = 50,
    offset = 0
  ): Promise<{ forms: WebForm[]; total: number }> {
    try {
      let query = this.supabase
        .from('crm_web_forms')
        .select('id, org_id, name, description, slug, entity_type, status, fields, settings, styling, submit_count, last_submission_at, created_by, created_at, updated_at', { count: 'exact' });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Failed to get forms:', error);
        return { forms: [], total: 0 };
      }

      return { forms: data as unknown as WebForm[], total: count || 0 };
    } catch (error) {
      console.error('Get forms error:', error);
      return { forms: [], total: 0 };
    }
  }

  /**
   * Get a single form by ID
   */
  async getForm(id: string): Promise<WebForm | null> {
    try {
      const { data, error } = await this.supabase
        .from('crm_web_forms')
        .select('id, org_id, name, description, slug, entity_type, status, fields, settings, styling, submit_count, last_submission_at, created_by, created_at, updated_at')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to get form:', error);
        return null;
      }

      return data as unknown as WebForm;
    } catch (error) {
      console.error('Get form error:', error);
      return null;
    }
  }

  /**
   * Get a form by slug (for public form renderer)
   */
  async getFormBySlug(slug: string): Promise<WebForm | null> {
    try {
      const { data, error } = await this.supabase
        .from('crm_web_forms')
        .select('id, org_id, name, description, slug, entity_type, status, fields, settings, styling, submit_count, last_submission_at, created_by, created_at, updated_at')
        .eq('slug', slug)
        .eq('status', 'active')
        .single();

      if (error) {
        console.error('Failed to get form by slug:', error);
        return null;
      }

      return data as unknown as WebForm;
    } catch (error) {
      console.error('Get form by slug error:', error);
      return null;
    }
  }

  /**
   * Create a new form
   */
  async createForm(
    input: WebFormCreateInput
  ): Promise<{ success: boolean; formId?: string; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'Not authenticated' };
      }

      const { data, error } = await this.supabase
        .from('crm_web_forms')
        .insert({
          ...input,
          entity_type: input.entity_type || 'lead',
          status: input.status || 'draft',
          fields: input.fields || [],
          settings: input.settings || {},
          styling: input.styling || {},
          submit_count: 0,
          created_by: user.user.id,
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, formId: data?.id };
    } catch (error) {
      console.error('Create form error:', error);
      return { success: false, error: 'Failed to create form' };
    }
  }

  /**
   * Update a form
   */
  async updateForm(
    id: string,
    updates: WebFormUpdateInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_web_forms')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Update form error:', error);
      return { success: false, error: 'Failed to update form' };
    }
  }

  /**
   * Delete a form
   */
  async deleteForm(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_web_forms')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete form error:', error);
      return { success: false, error: 'Failed to delete form' };
    }
  }

  /**
   * Duplicate a form
   */
  async duplicateForm(
    id: string
  ): Promise<{ success: boolean; formId?: string; error?: string }> {
    try {
      const form = await this.getForm(id);
      if (!form) {
        return { success: false, error: 'Form not found' };
      }

      const timestamp = Date.now().toString(36);
      return this.createForm({
        name: `${form.name} (Copy)`,
        description: form.description || undefined,
        slug: `${form.slug}-copy-${timestamp}`,
        entity_type: form.entity_type,
        status: 'draft',
        fields: form.fields,
        settings: form.settings,
        styling: form.styling,
      });
    } catch (error) {
      console.error('Duplicate form error:', error);
      return { success: false, error: 'Failed to duplicate form' };
    }
  }

  /**
   * Get submissions for a form
   */
  async getSubmissions(
    formId: string,
    filters: SubmissionFilters = {},
    limit = 50,
    offset = 0
  ): Promise<{ submissions: WebFormSubmission[]; total: number }> {
    try {
      let query = this.supabase
        .from('crm_web_form_submissions')
        .select('id, form_id, data, source_url, ip_address, user_agent, lead_id, status, created_at', { count: 'exact' })
        .eq('form_id', formId);

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Failed to get submissions:', error);
        return { submissions: [], total: 0 };
      }

      return { submissions: data as unknown as WebFormSubmission[], total: count || 0 };
    } catch (error) {
      console.error('Get submissions error:', error);
      return { submissions: [], total: 0 };
    }
  }

  /**
   * Get a single submission
   */
  async getSubmission(id: string): Promise<WebFormSubmission | null> {
    try {
      const { data, error } = await this.supabase
        .from('crm_web_form_submissions')
        .select('id, form_id, data, source_url, ip_address, user_agent, lead_id, status, created_at')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to get submission:', error);
        return null;
      }

      return data as unknown as WebFormSubmission;
    } catch (error) {
      console.error('Get submission error:', error);
      return null;
    }
  }

  /**
   * Convert a submission to a lead.
   *
   * The `lead_source` resolution order is:
   *   1. Explicit `options.leadSource` argument (operator override).
   *   2. `form.settings.lead_source` (form-level default chosen at form creation).
   *   3. Trigger-level default `'inhouse_round_robin'` applied by
   *      `crm_validate_lead_source` (see 20260423100000 migration).
   *
   * Sales Plan 2026 requires every lead to carry an accurate `lead_source` so
   * the Inhouse vs Self-Generated split in every report is reliable.
   */
  async convertSubmission(
    id: string,
    options: { leadSource?: string; outsideAdvisorId?: string; referralPartnerId?: string } = {}
  ): Promise<{ success: boolean; leadId?: string; error?: string }> {
    try {
      const submission = await this.getSubmission(id);
      if (!submission) {
        return { success: false, error: 'Submission not found' };
      }

      // Get the form to know field mappings
      const form = await this.getForm(submission.form_id);
      if (!form) {
        return { success: false, error: 'Form not found' };
      }

      // Map submission data to lead fields
      const submissionData = submission.data as Record<string, string>;
      const formSettings = (form.settings ?? {}) as Record<string, unknown>;
      const resolvedSource =
        options.leadSource ??
        (typeof formSettings.lead_source === 'string' ? (formSettings.lead_source as string) : undefined) ??
        'inhouse_round_robin';

      const leadData: Record<string, unknown> = {
        source: 'web_form',
        lead_source: resolvedSource,
        outside_advisor_id: options.outsideAdvisorId ?? formSettings.outside_advisor_id ?? null,
        referral_partner_id: options.referralPartnerId ?? formSettings.referral_partner_id ?? null,
        metadata: {
          web_form_id: form.id,
          web_form_name: form.name,
          submission_id: submission.id,
        },
      };

      // Try to map common field labels to lead fields
      for (const field of form.fields) {
        const value = submissionData[field.id];
        if (!value) continue;

        const label = field.label.toLowerCase();
        if (field.type === 'email' || label.includes('email')) {
          leadData.email = value;
        } else if (field.type === 'phone' || label.includes('phone')) {
          leadData.phone = value;
        } else if (label.includes('first') && label.includes('name')) {
          leadData.first_name = value;
        } else if (label.includes('last') && label.includes('name')) {
          leadData.last_name = value;
        } else if (label === 'name' || label === 'full name') {
          const parts = String(value).split(' ');
          leadData.first_name = parts[0];
          leadData.last_name = parts.slice(1).join(' ') || '';
        } else if (label.includes('company') || label.includes('organization')) {
          leadData.company = value;
        }
      }

      // Insert into lead_submissions (the CRM leads table)
      const { data, error } = await this.supabase
        .from('lead_submissions')
        .insert(leadData)
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Update submission status
      await this.supabase
        .from('crm_web_form_submissions')
        .update({ status: 'converted', lead_id: data.id })
        .eq('id', id);

      return { success: true, leadId: data.id };
    } catch (error) {
      console.error('Convert submission error:', error);
      return { success: false, error: 'Failed to convert submission' };
    }
  }

  /**
   * Get form analytics
   */
  async getFormAnalytics(formId: string): Promise<FormAnalytics> {
    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [totalResult, weekResult, monthResult, convertedResult] = await Promise.all([
        this.supabase
          .from('crm_web_form_submissions')
          .select('id, form_id, data, source_url, ip_address, user_agent, lead_id, status, created_at', { count: 'exact', head: true })
          .eq('form_id', formId),
        this.supabase
          .from('crm_web_form_submissions')
          .select('id, form_id, data, source_url, ip_address, user_agent, lead_id, status, created_at', { count: 'exact', head: true })
          .eq('form_id', formId)
          .gte('created_at', weekAgo),
        this.supabase
          .from('crm_web_form_submissions')
          .select('id, form_id, data, source_url, ip_address, user_agent, lead_id, status, created_at', { count: 'exact', head: true })
          .eq('form_id', formId)
          .gte('created_at', monthAgo),
        this.supabase
          .from('crm_web_form_submissions')
          .select('id, form_id, data, source_url, ip_address, user_agent, lead_id, status, created_at', { count: 'exact', head: true })
          .eq('form_id', formId)
          .eq('status', 'converted'),
      ]);

      const totalSubmissions = totalResult.count || 0;
      const convertedCount = convertedResult.count || 0;

      // Get submissions by day (last 30 days)
      const { data: recentSubmissions } = await this.supabase
        .from('crm_web_form_submissions')
        .select('created_at')
        .eq('form_id', formId)
        .gte('created_at', monthAgo)
        .order('created_at', { ascending: true });

      const dayMap = new Map<string, number>();
      for (const sub of recentSubmissions || []) {
        const day = sub.created_at.split('T')[0];
        dayMap.set(day, (dayMap.get(day) || 0) + 1);
      }

      const submissionsByDay = Array.from(dayMap.entries()).map(([date, count]) => ({
        date,
        count,
      }));

      return {
        totalSubmissions,
        submissionsThisWeek: weekResult.count || 0,
        submissionsThisMonth: monthResult.count || 0,
        conversionRate: totalSubmissions > 0 ? (convertedCount / totalSubmissions) * 100 : 0,
        submissionsByDay,
      };
    } catch (error) {
      console.error('Get form analytics error:', error);
      return {
        totalSubmissions: 0,
        submissionsThisWeek: 0,
        submissionsThisMonth: 0,
        conversionRate: 0,
        submissionsByDay: [],
      };
    }
  }

  /**
   * Generate embed code for a form
   */
  /**
   * Generate embed code for a form.
   * Uses slug in public URLs since the `/forms/:slug` route resolves by slug.
   */
  generateEmbedCode(
    form: { id: string; slug: string },
    baseUrl: string
  ): { iframe: string; script: string; react: string } {
    const formUrl = `${baseUrl}/forms/${form.slug}`;

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

// Factory function
export function createFormService(supabase: SupabaseClient): FormService {
  return new FormService(supabase);
}
