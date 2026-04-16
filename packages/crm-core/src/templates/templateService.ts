import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CRMTemplate,
  TemplateCreateInput,
  TemplateUpdateInput,
  TemplateFilters,
} from './types';

export class TemplateService {
  constructor(private supabase: SupabaseClient) {}

  async listTemplates(filters?: TemplateFilters): Promise<CRMTemplate[]> {
    try {
      let query = this.supabase
        .from('crm_templates')
        .select('id, name, description, template_type, category, subject, body, variables, usage_count, last_used_at, is_ai_generated, ai_performance_score, is_active, is_default, created_by, created_at, updated_at')
        .order('updated_at', { ascending: false });

      if (filters?.template_type) {
        query = query.eq('template_type', filters.template_type);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error listing templates:', error);
        return [];
      }
      return (data || []) as any;
    } catch (error) {
      console.error('Error listing templates:', error);
      return [];
    }
  }

  async getTemplate(id: string): Promise<CRMTemplate | null> {
    try {
      const { data, error } = await this.supabase
        .from('crm_templates')
        .select('id, name, description, template_type, category, subject, body, variables, usage_count, last_used_at, is_ai_generated, ai_performance_score, is_active, is_default, created_by, created_at, updated_at')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching template:', error);
        return null;
      }
      return data as any;
    } catch (error) {
      console.error('Error fetching template:', error);
      return null;
    }
  }

  async createTemplate(
    input: TemplateCreateInput
  ): Promise<{ success: boolean; template?: CRMTemplate; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('crm_templates')
        .insert({
          name: input.name,
          description: input.description || null,
          template_type: input.template_type,
          category: input.category || 'general',
          subject: input.subject || null,
          body: input.body,
          variables: input.variables || [],
          is_ai_generated: input.is_ai_generated || false,
          is_active: input.is_active !== undefined ? input.is_active : true,
        })
        .select('id, name, description, template_type, category, subject, body, variables, usage_count, last_used_at, is_ai_generated, ai_performance_score, is_active, is_default, created_by, created_at, updated_at')
        .single();

      if (error) {
        console.error('Error creating template:', error);
        return { success: false, error: error.message };
      }
      return { success: true, template: data };
    } catch (error) {
      console.error('Error creating template:', error);
      return { success: false, error: 'Unexpected error' };
    }
  }

  async updateTemplate(
    id: string,
    updates: TemplateUpdateInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_templates')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error updating template:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      console.error('Error updating template:', error);
      return { success: false, error: 'Unexpected error' };
    }
  }

  async deleteTemplate(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_templates')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting template:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      console.error('Error deleting template:', error);
      return { success: false, error: 'Unexpected error' };
    }
  }

  async duplicateTemplate(
    id: string
  ): Promise<{ success: boolean; template?: CRMTemplate; error?: string }> {
    try {
      const original = await this.getTemplate(id);
      if (!original) return { success: false, error: 'Template not found' };

      return this.createTemplate({
        name: `${original.name} (Copy)`,
        description: original.description || undefined,
        template_type: original.template_type,
        category: original.category,
        subject: original.subject || undefined,
        body: original.body,
        variables: original.variables,
        is_ai_generated: false,
        is_active: true,
      });
    } catch (error) {
      console.error('Error duplicating template:', error);
      return { success: false, error: 'Unexpected error' };
    }
  }

  renderTemplate(body: string, variables: Record<string, string>): string {
    let rendered = body;
    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    return rendered;
  }

  async trackUsage(id: string): Promise<void> {
    try {
      const { data } = await this.supabase
        .from('crm_templates')
        .select('usage_count')
        .eq('id', id)
        .single();

      if (data) {
        await this.supabase
          .from('crm_templates')
          .update({
            usage_count: (data.usage_count || 0) + 1,
            last_used_at: new Date().toISOString(),
          })
          .eq('id', id);
      }
    } catch (error) {
      console.error('Error tracking template usage:', error);
    }
  }
}

export function createTemplateService(supabase: SupabaseClient): TemplateService {
  return new TemplateService(supabase);
}
