import { supabase } from '@mpbhealth/database';

export interface AdminForm {
  id: string;
  label: string;
  slug: string | null;
  category: string | null;
  cognito_embed: string | null;
  is_active: boolean;
  show_in_menu: boolean;
  sort_order: number;
  menu_section: string | null;
  menu_order: number | null;
  created_at: string;
  updated_at: string;
}

export type FormCreateInput = Omit<AdminForm, 'id' | 'created_at' | 'updated_at'>;
export type FormUpdateInput = Partial<Omit<AdminForm, 'id' | 'created_at' | 'updated_at'>>;

export class FormsAdminService {
  async getForms(category?: string): Promise<AdminForm[]> {
    let query = supabase
      .from('cognito_forms')
      .select('id, label, slug, category, cognito_embed, is_active, show_in_menu, sort_order, menu_section, menu_order, created_at, updated_at')
      .order('sort_order', { ascending: true });

    if (category) query = query.eq('category', category);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as any;
  }

  async getForm(id: string): Promise<AdminForm | null> {
    const { data, error } = await supabase
      .from('cognito_forms')
      .select('id, label, slug, category, cognito_embed, is_active, show_in_menu, sort_order, menu_section, menu_order, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as any;
  }

  async createForm(input: FormCreateInput): Promise<AdminForm> {
    const { data, error } = await supabase
      .from('cognito_forms')
      .insert(input)
      .select('id, label, slug, category, cognito_embed, is_active, show_in_menu, sort_order, menu_section, menu_order, created_at, updated_at')
      .single();

    if (error) throw error;
    return data as any;
  }

  async updateForm(id: string, input: FormUpdateInput): Promise<AdminForm> {
    const { data, error } = await supabase
      .from('cognito_forms')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, label, slug, category, cognito_embed, is_active, show_in_menu, sort_order, menu_section, menu_order, created_at, updated_at')
      .single();

    if (error) throw error;
    return data as any;
  }

  async deleteForm(id: string): Promise<void> {
    const { error } = await supabase
      .from('cognito_forms')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async toggleActive(id: string): Promise<AdminForm> {
    const form = await this.getForm(id);
    if (!form) throw new Error('Form not found');
    return this.updateForm(id, { is_active: !form.is_active });
  }

  async reorderForms(formIds: string[]): Promise<void> {
    const updates = formIds.map((id, index) =>
      supabase.from('cognito_forms').update({ sort_order: index }).eq('id', id),
    );
    await Promise.all(updates);
  }

  async getStats(): Promise<{ total: number; active: number; inMenu: number }> {
    const { data, error } = await supabase
      .from('cognito_forms')
      .select('is_active, show_in_menu');

    if (error) throw error;
    const forms = data || [];
    return {
      total: forms.length,
      active: forms.filter((f) => f.is_active).length,
      inMenu: forms.filter((f) => f.show_in_menu).length,
    };
  }

  async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('cognito_forms')
      .select('category')
      .not('category', 'is', null);

    if (error) throw error;
    return [...new Set((data || []).map((f) => f.category).filter(Boolean))].sort();
  }
}

export const formsAdminService = new FormsAdminService();
