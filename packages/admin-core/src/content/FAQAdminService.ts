import { supabase } from '@mpbhealth/database';

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  order_index: number;
  is_published: boolean;
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
      .select('*')
      .order('order_index', { ascending: true });

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.published !== undefined) {
      query = query.eq('is_published', filters.published);
    }
    if (filters?.search) {
      query = query.or(
        `question.ilike.%${filters.search}%,answer.ilike.%${filters.search}%`,
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as FAQItem[];
  }

  async getById(id: string): Promise<FAQItem | null> {
    const { data, error } = await supabase
      .from('faq_items')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as FAQItem | null;
  }

  async create(input: FAQCreateInput): Promise<FAQItem> {
    const { data, error } = await supabase
      .from('faq_items')
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return data as FAQItem;
  }

  async update(id: string, input: FAQUpdateInput): Promise<FAQItem> {
    const { data, error } = await supabase
      .from('faq_items')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as FAQItem;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('faq_items').delete().eq('id', id);
    if (error) throw error;
  }

  async togglePublished(id: string): Promise<FAQItem> {
    const item = await this.getById(id);
    if (!item) throw new Error('FAQ item not found');
    return this.update(id, { is_published: !item.is_published });
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
      published: all.filter((i) => i.is_published).length,
      categories: cats.size,
    };
  }
}

export const faqAdminService = new FAQAdminService();
