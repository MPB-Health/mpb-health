// ============================================================================
// Template Service — Manages message templates
// ============================================================================

import { supabase } from '@mpbhealth/database';
import type { MessageTemplate, CreateTemplateInput } from './types';

export class TemplateService {
  /**
   * Get all templates for an org
   */
  async getTemplates(
    orgId: string,
    options: {
      channel?: 'sms' | 'email' | 'both';
      category?: string;
      activeOnly?: boolean;
      search?: string;
    } = {}
  ): Promise<MessageTemplate[]> {
    let query = supabase
      .from('message_templates')
      .select('id, org_id, name, description, channel, category, subject, body_text, body_html, variables, times_used, last_used_at, is_active, created_by, is_shared, created_at, updated_at')
      .eq('org_id', orgId)
      .order('times_used', { ascending: false });

    if (options.channel) {
      query = query.or(`channel.eq.${options.channel},channel.eq.both`);
    }

    if (options.category) {
      query = query.eq('category', options.category);
    }

    if (options.activeOnly !== false) {
      query = query.eq('is_active', true);
    }

    if (options.search) {
      query = query.or(
        `name.ilike.%${options.search}%,body_text.ilike.%${options.search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('[TemplateService] Failed to get templates:', error);
      throw error;
    }

    return (data || []) as any;
  }

  /**
   * Get a single template by ID
   */
  async getTemplate(templateId: string): Promise<MessageTemplate | null> {
    const { data, error } = await supabase
      .from('message_templates')
      .select('id, org_id, name, description, channel, category, subject, body_text, body_html, variables, times_used, last_used_at, is_active, created_by, is_shared, created_at, updated_at')
      .eq('id', templateId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[TemplateService] Failed to get template:', error);
      throw error;
    }

    return data as any;
  }

  /**
   * Create a new template
   */
  async createTemplate(orgId: string, input: CreateTemplateInput): Promise<MessageTemplate> {
    const { data, error } = await supabase
      .from('message_templates')
      .insert({
        org_id: orgId,
        name: input.name,
        description: input.description,
        channel: input.channel,
        category: input.category || 'general',
        subject: input.subject,
        body_text: input.body_text,
        body_html: input.body_html,
        variables: input.variables || [],
        is_shared: input.is_shared ?? true,
      })
      .select('id, org_id, name, description, channel, category, subject, body_text, body_html, variables, times_used, last_used_at, is_active, created_by, is_shared, created_at, updated_at')
      .single();

    if (error) {
      console.error('[TemplateService] Failed to create template:', error);
      throw error;
    }

    return data as any;
  }

  /**
   * Update a template
   */
  async updateTemplate(
    templateId: string,
    input: Partial<CreateTemplateInput>
  ): Promise<MessageTemplate> {
    const { data, error } = await supabase
      .from('message_templates')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', templateId)
      .select('id, org_id, name, description, channel, category, subject, body_text, body_html, variables, times_used, last_used_at, is_active, created_by, is_shared, created_at, updated_at')
      .single();

    if (error) {
      console.error('[TemplateService] Failed to update template:', error);
      throw error;
    }

    return data as any;
  }

  /**
   * Delete a template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    const { error } = await supabase
      .from('message_templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      console.error('[TemplateService] Failed to delete template:', error);
      throw error;
    }
  }

  /**
   * Toggle template active status
   */
  async toggleActive(templateId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('message_templates')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', templateId);

    if (error) {
      console.error('[TemplateService] Failed to toggle template:', error);
      throw error;
    }
  }

  /**
   * Record template usage
   */
  async recordUsage(templateId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_message_template_times_used', {
      template_id: templateId,
    });

    if (error) {
      // Fallback: fetch current count and update
      const { data } = await supabase
        .from('message_templates')
        .select('times_used')
        .eq('id', templateId)
        .single();
      const newCount = (data?.times_used ?? 0) + 1;
      await supabase
        .from('message_templates')
        .update({
          times_used: newCount,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', templateId);
    }
  }

  /**
   * Get template categories for an org
   */
  async getCategories(orgId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('message_templates')
      .select('category')
      .eq('org_id', orgId)
      .eq('is_active', true);

    if (error) {
      console.error('[TemplateService] Failed to get categories:', error);
      return [];
    }

    const categories = new Set((data || []).map((t) => t.category).filter(Boolean));
    return Array.from(categories).sort();
  }

  /**
   * Render a template with variables
   */
  renderTemplate(
    template: MessageTemplate,
    variables: Record<string, string>
  ): { subject: string | null; body: string } {
    let body = template.body_text;
    let subject = template.subject;

    // Replace variables in body
    for (const variable of template.variables) {
      const value = variables[variable.name] || variable.default;
      const regex = new RegExp(`\\{\\{\\s*${variable.name}\\s*\\}\\}`, 'g');
      body = body.replace(regex, value);
      if (subject) {
        subject = subject.replace(regex, value);
      }
    }

    return { subject, body };
  }
}

export const templateService = new TemplateService();
