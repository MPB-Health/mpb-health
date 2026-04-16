import type { SupabaseClient } from '@supabase/supabase-js';
import type { QuoteTemplate, QuoteTemplateCreateInput, QuoteTemplateUpdateInput } from './quoteTemplateTypes';

export class QuoteTemplateService {
  constructor(private supabase: SupabaseClient) {}

  async getTemplates(): Promise<QuoteTemplate[]> {
    try {
      const { data, error } = await this.supabase
        .from('crm_quote_templates')
        .select('id, org_id, name, description, content, variables, is_default, is_active, created_by, created_at, updated_at')
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('name');

      if (error) {
        console.error('Failed to get quote templates:', error);
        return [];
      }
      return (data || []) as unknown as QuoteTemplate[];
    } catch (error) {
      console.error('Get quote templates error:', error);
      return [];
    }
  }

  async getTemplate(id: string): Promise<QuoteTemplate | null> {
    try {
      const { data, error } = await this.supabase
        .from('crm_quote_templates')
        .select('id, org_id, name, description, content, variables, is_default, is_active, created_by, created_at, updated_at')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to get quote template:', error);
        return null;
      }
      return data as unknown as QuoteTemplate;
    } catch (error) {
      console.error('Get quote template error:', error);
      return null;
    }
  }

  async createTemplate(input: QuoteTemplateCreateInput): Promise<{ success: boolean; templateId?: string; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) return { success: false, error: 'Not authenticated' };

      if (input.is_default) {
        await this.supabase
          .from('crm_quote_templates')
          .update({ is_default: false })
          .eq('is_default', true);
      }

      const { data, error } = await this.supabase
        .from('crm_quote_templates')
        .insert({ ...input, created_by: user.user.id })
        .select('id')
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, templateId: data?.id };
    } catch (error) {
      console.error('Create quote template error:', error);
      return { success: false, error: 'Failed to create template' };
    }
  }

  async updateTemplate(id: string, updates: QuoteTemplateUpdateInput): Promise<{ success: boolean; error?: string }> {
    try {
      if (updates.is_default) {
        await this.supabase
          .from('crm_quote_templates')
          .update({ is_default: false })
          .eq('is_default', true);
      }

      const { error } = await this.supabase
        .from('crm_quote_templates')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      console.error('Update quote template error:', error);
      return { success: false, error: 'Failed to update template' };
    }
  }

  async deleteTemplate(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_quote_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      console.error('Delete quote template error:', error);
      return { success: false, error: 'Failed to delete template' };
    }
  }

  async duplicateTemplate(id: string): Promise<{ success: boolean; templateId?: string; error?: string }> {
    try {
      const template = await this.getTemplate(id);
      if (!template) return { success: false, error: 'Template not found' };

      return this.createTemplate({
        name: `${template.name} (Copy)`,
        description: template.description || undefined,
        layout: template.layout,
        branding: template.branding,
        content_blocks: template.content_blocks,
      });
    } catch (error) {
      console.error('Duplicate quote template error:', error);
      return { success: false, error: 'Failed to duplicate template' };
    }
  }
}

export function createQuoteTemplateService(supabase: SupabaseClient): QuoteTemplateService {
  return new QuoteTemplateService(supabase);
}
