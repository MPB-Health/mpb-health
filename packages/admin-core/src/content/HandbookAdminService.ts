import { supabase } from '@mpbhealth/database';

export interface AdminHandbook {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  pdf_path: string;
  flipbook_url: string | null;
  plan_type: 'individual' | 'family' | 'employer' | 'hsa' | 'general';
  color: string;
  icon: string;
  features: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type HandbookCreateInput = Omit<AdminHandbook, 'id' | 'created_at' | 'updated_at'>;
export type HandbookUpdateInput = Partial<Omit<AdminHandbook, 'id' | 'created_at' | 'updated_at'>>;

export class HandbookAdminService {
  async getAll(): Promise<AdminHandbook[]> {
    const { data, error } = await supabase
      .from('handbooks')
      .select('id, slug, name, description, pdf_path, flipbook_url, plan_type, color, icon, features, is_active, sort_order, created_at, updated_at')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data || []) as unknown as AdminHandbook[];
  }

  async getById(id: string): Promise<AdminHandbook | null> {
    const { data, error } = await supabase
      .from('handbooks')
      .select('id, slug, name, description, pdf_path, flipbook_url, plan_type, color, icon, features, is_active, sort_order, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as unknown as AdminHandbook | null;
  }

  async create(input: HandbookCreateInput): Promise<AdminHandbook> {
    const { data, error } = await supabase
      .from('handbooks')
      .insert(input)
      .select('id, slug, name, description, pdf_path, flipbook_url, plan_type, color, icon, features, is_active, sort_order, created_at, updated_at')
      .single();

    if (error) throw error;
    return data as unknown as AdminHandbook;
  }

  async update(id: string, input: HandbookUpdateInput): Promise<AdminHandbook> {
    const { data, error } = await supabase
      .from('handbooks')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, slug, name, description, pdf_path, flipbook_url, plan_type, color, icon, features, is_active, sort_order, created_at, updated_at')
      .single();

    if (error) throw error;
    return data as unknown as AdminHandbook;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('handbooks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async toggleActive(id: string): Promise<AdminHandbook> {
    const handbook = await this.getById(id);
    if (!handbook) throw new Error('Handbook not found');
    return this.update(id, { is_active: !handbook.is_active });
  }

  async reorder(ids: string[]): Promise<void> {
    const updates = ids.map((id, index) =>
      supabase.from('handbooks').update({ sort_order: index }).eq('id', id),
    );
    await Promise.all(updates);
  }

  async getStats(): Promise<{ total: number; active: number }> {
    const { data, error } = await supabase
      .from('handbooks')
      .select('is_active');

    if (error) throw error;
    const items = data || [];
    return { total: items.length, active: items.filter((h) => h.is_active).length };
  }
}

export const handbookAdminService = new HandbookAdminService();
