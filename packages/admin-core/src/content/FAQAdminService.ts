import { supabase } from '@mpbhealth/database';

export interface FAQItem {
  id: string;
  title: string;
  content_html: string;
  category: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type FAQCreateInput = Omit<FAQItem, 'id' | 'created_at' | 'updated_at'>;
export type FAQUpdateInput = Partial<Omit<FAQItem, 'id' | 'created_at' | 'updated_at'>>;

export interface FAQStats {
  total: number;
  published: number;
  categories: number;
}

export class FAQAdminService {
  async getAll(filters?: {
    category?: string;
    search?: string;
    published?: boolean;
  }): Promise<FAQItem[]> {
    let query = supabase
      .from('faq_items')
      .select('id, title, content_html, category, order_index, is_active, created_at, updated_at')
      .order('category', { ascending: true })
      .order('order_index', { ascending: true });

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.published !== undefined) {
      query = query.eq('is_active', filters.published);
    }
    if (filters?.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,content_html.ilike.%${filters.search}%`,
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as FAQItem[];
  }

  async getById(id: string): Promise<FAQItem | null> {
    const { data, error } = await supabase
      .from('faq_items')
      .select('id, title, content_html, category, order_index, is_active, created_at, updated_at')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as unknown as FAQItem | null;
  }

  async create(input: FAQCreateInput): Promise<FAQItem> {
    const { data, error } = await supabase
      .from('faq_items')
      .insert({
        title: input.title,
        content_html: input.content_html,
        category: input.category,
        order_index: input.order_index,
        is_active: input.is_active,
      })
      .select('id, title, content_html, category, order_index, is_active, created_at, updated_at')
      .single();
    if (error) throw error;
    return data as unknown as FAQItem;
  }

  async update(id: string, input: FAQUpdateInput): Promise<FAQItem> {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (input.title !== undefined) payload.title = input.title;
    if (input.content_html !== undefined) payload.content_html = input.content_html;
    if (input.category !== undefined) payload.category = input.category;
    if (input.order_index !== undefined) payload.order_index = input.order_index;
    if (input.is_active !== undefined) payload.is_active = input.is_active;

    const { data, error } = await supabase
      .from('faq_items')
      .update(payload)
      .eq('id', id)
      .select('id, title, content_html, category, order_index, is_active, created_at, updated_at')
      .single();
    if (error) throw error;
    return data as unknown as FAQItem;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('faq_items').delete().eq('id', id);
    if (error) throw error;
  }

  async togglePublished(id: string): Promise<FAQItem> {
    const item = await this.getById(id);
    if (!item) throw new Error('FAQ item not found');
    return this.update(id, { is_active: !item.is_active });
  }

  async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('faq_items')
      .select('category')
      .not('category', 'is', null);
    if (error) throw error;
    return [...new Set((data || []).map((r) => r.category as string).filter(Boolean))].sort();
  }

  async getStats(): Promise<FAQStats> {
    const all = await this.getAll();
    const cats = new Set(all.map((i) => i.category).filter(Boolean));
    return {
      total: all.length,
      published: all.filter((i) => i.is_active).length,
      categories: cats.size,
    };
  }

  async reorder(id: string, newIndex: number): Promise<void> {
    const { error } = await supabase
      .from('faq_items')
      .update({ order_index: newIndex, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }

  async swapOrder(id1: string, order1: number, id2: string, order2: number): Promise<void> {
    await supabase
      .from('faq_items')
      .update({ order_index: order2, updated_at: new Date().toISOString() })
      .eq('id', id1);
    await supabase
      .from('faq_items')
      .update({ order_index: order1, updated_at: new Date().toISOString() })
      .eq('id', id2);
  }
}

export const faqAdminService = new FAQAdminService();
