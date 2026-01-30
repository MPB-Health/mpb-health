import { supabase } from '@mpbhealth/database';
import type { AdvisorForm, FormSubmission } from '../types';

// Helper to map cognito_forms to AdvisorForm with backward compatible fields
function mapCognitoFormToAdvisorForm(data: Record<string, unknown>): AdvisorForm {
  return {
    ...data,
    // Backward compatibility mappings
    name: data.label as string,
    embed_url: data.cognito_embed as string || '',
  } as AdvisorForm;
}

export class FormsService {
  // Get all available forms (from cognito_forms table - CMS managed)
  async getForms(category?: string): Promise<AdvisorForm[]> {
    let query = supabase
      .from('cognito_forms')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapCognitoFormToAdvisorForm);
  }

  // Get a single form
  async getForm(formId: string): Promise<AdvisorForm | null> {
    const { data, error } = await supabase
      .from('cognito_forms')
      .select('*')
      .eq('id', formId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? mapCognitoFormToAdvisorForm(data) : null;
  }

  // Get form by slug
  async getFormBySlug(slug: string): Promise<AdvisorForm | null> {
    const { data, error } = await supabase
      .from('cognito_forms')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? mapCognitoFormToAdvisorForm(data) : null;
  }

  // Get form categories
  async getFormCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('cognito_forms')
      .select('category')
      .eq('is_active', true);

    if (error) throw error;

    const categories = [...new Set(data?.map(f => f.category) || [])];
    return categories.filter(Boolean).sort();
  }

  // Get menu sections for forms
  async getMenuSections(): Promise<string[]> {
    const { data, error } = await supabase
      .from('cognito_forms')
      .select('menu_section')
      .eq('is_active', true)
      .eq('show_in_menu', true);

    if (error) throw error;

    const sections = [...new Set(data?.map(f => f.menu_section) || [])];
    return sections.filter(Boolean).sort();
  }

  // Get forms for menu display
  async getMenuForms(): Promise<AdvisorForm[]> {
    const { data, error } = await supabase
      .from('cognito_forms')
      .select('*')
      .eq('is_active', true)
      .eq('show_in_menu', true)
      .order('menu_order', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapCognitoFormToAdvisorForm);
  }

  // Get advisor's form submissions
  async getSubmissions(
    advisorId: string,
    formId?: string
  ): Promise<FormSubmission[]> {
    let query = supabase
      .from('form_submissions')
      .select('*')
      .eq('advisor_id', advisorId)
      .order('submitted_at', { ascending: false });

    if (formId) {
      query = query.eq('form_id', formId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Get a single submission
  async getSubmission(submissionId: string): Promise<FormSubmission | null> {
    const { data, error } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Record a form submission (called by Cognito webhook)
  async recordSubmission(
    formId: string,
    advisorId: string,
    cognitoEntryId: string,
    data: Record<string, unknown>
  ): Promise<FormSubmission> {
    const { data: submission, error } = await supabase
      .from('form_submissions')
      .insert({
        form_id: formId,
        advisor_id: advisorId,
        cognito_entry_id: cognitoEntryId,
        data,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Update form submission count
    await supabase.rpc('increment_form_submission_count', { form_id: formId });

    return submission;
  }

  // Update submission status
  async updateSubmissionStatus(
    submissionId: string,
    status: FormSubmission['status']
  ): Promise<FormSubmission> {
    const updates: Partial<FormSubmission> = { status };
    if (status === 'completed' || status === 'rejected') {
      updates.processed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('form_submissions')
      .update(updates)
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get pending submissions count
  async getPendingSubmissionsCount(advisorId: string): Promise<number> {
    const { count, error } = await supabase
      .from('form_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('advisor_id', advisorId)
      .in('status', ['submitted', 'processing']);

    if (error) throw error;
    return count || 0;
  }

  // Get required forms for onboarding (forms in 'onboarding' menu section)
  async getRequiredForms(): Promise<AdvisorForm[]> {
    const { data, error } = await supabase
      .from('cognito_forms')
      .select('*')
      .eq('is_active', true)
      .eq('menu_section', 'onboarding')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapCognitoFormToAdvisorForm);
  }

  // Check if advisor has submitted required forms
  async checkRequiredFormsStatus(advisorId: string): Promise<{
    total: number;
    completed: number;
    pending: AdvisorForm[];
  }> {
    const [requiredForms, submissions] = await Promise.all([
      this.getRequiredForms(),
      this.getSubmissions(advisorId),
    ]);

    const submittedFormIds = new Set(submissions.map(s => s.form_id));
    const pending = requiredForms.filter(f => !submittedFormIds.has(f.id));

    return {
      total: requiredForms.length,
      completed: requiredForms.length - pending.length,
      pending,
    };
  }

  // Generate Cognito form embed URL
  getEmbedUrl(form: AdvisorForm, prefillData?: Record<string, string>): string {
    // Use embed_url (mapped) or cognito_embed directly
    let url = form.embed_url || form.cognito_embed || '';

    if (prefillData && Object.keys(prefillData).length > 0) {
      const params = new URLSearchParams();
      Object.entries(prefillData).forEach(([key, value]) => {
        params.set(`entry.${key}`, value);
      });
      url = `${url}${url.includes('?') ? '&' : '?'}${params.toString()}`;
    }

    return url;
  }

  // Get embed HTML (cognito_embed contains full iframe/script tag)
  getEmbedHtml(form: AdvisorForm): string {
    return form.cognito_embed || '';
  }

  // Subscribe to submission updates
  subscribeToSubmissions(
    advisorId: string,
    callback: (submission: FormSubmission) => void
  ) {
    return supabase
      .channel(`submissions:${advisorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'form_submissions',
          filter: `advisor_id=eq.${advisorId}`,
        },
        (payload) => {
          callback(payload.new as FormSubmission);
        }
      )
      .subscribe();
  }
}

export const formsService = new FormsService();
