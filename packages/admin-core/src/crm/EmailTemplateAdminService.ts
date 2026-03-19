import { supabase } from '@mpbhealth/database';

export interface EmailTemplate {
  id: string;
  name: string;
  description: string | null;
  template_type: string;
  category: string | null;
  subject: string;
  body: string;
  variables: string[];
  is_ai_generated: boolean;
  is_active: boolean;
  performance_score: number | null;
  total_sent: number;
  open_rate: number | null;
  click_rate: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type EmailTemplateCreateInput = Pick<
  EmailTemplate,
  'name' | 'subject' | 'body'
> &
  Partial<
    Pick<
      EmailTemplate,
      'description' | 'template_type' | 'category' | 'variables' | 'is_active'
    >
  >;
export type EmailTemplateUpdateInput = Partial<EmailTemplateCreateInput>;

export interface EmailTemplateStats {
  total: number;
  active: number;
  categories: number;
}

export class EmailTemplateAdminService {
  async getAll(filters?: {
    category?: string;
    search?: string;
    active?: boolean;
  }): Promise<EmailTemplate[]> {
    let query = supabase
      .from('crm_templates')
      .select('*')
      .order('updated_at', { ascending: false });

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.active !== undefined) {
      query = query.eq('is_active', filters.active);
    }
    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`,
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as EmailTemplate[];
  }

  async getById(id: string): Promise<EmailTemplate | null> {
    const { data, error } = await supabase
      .from('crm_templates')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data as EmailTemplate;
  }

  async create(input: EmailTemplateCreateInput): Promise<EmailTemplate> {
    const { data, error } = await supabase
      .from('crm_templates')
      .insert({
        ...input,
        template_type: input.template_type || 'email',
        is_active: input.is_active ?? true,
      })
      .select()
      .single();
    if (error) throw error;
    return data as EmailTemplate;
  }

  async update(
    id: string,
    input: EmailTemplateUpdateInput,
  ): Promise<EmailTemplate> {
    const { data, error } = await supabase
      .from('crm_templates')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as EmailTemplate;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_templates')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async toggleActive(id: string): Promise<EmailTemplate> {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Template not found');
    return this.update(id, { is_active: !existing.is_active });
  }

  async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('crm_templates')
      .select('category')
      .not('category', 'is', null);
    if (error) return [];
    return [
      ...new Set(
        (data || [])
          .map((d: { category: string }) => d.category)
          .filter(Boolean),
      ),
    ];
  }

  async getStats(): Promise<EmailTemplateStats> {
    const all = await this.getAll();
    return {
      total: all.length,
      active: all.filter((t) => t.is_active).length,
      categories: new Set(all.map((t) => t.category).filter(Boolean)).size,
    };
  }
}

export const emailTemplateAdminService = new EmailTemplateAdminService();
