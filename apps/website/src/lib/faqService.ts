import { supabase } from './supabase';

export interface FAQItem {
  id: string;
  title: string;
  content_html: string;
  category: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getAllFAQItems(): Promise<FAQItem[]> {
  try {
    const { data, error } = await supabase
      .from('faq_items')
      .select('*')
      .eq('is_active', true)
      .order('order_index');

    if (error) {
      if (error.code === 'PGRST301' || error.message.includes('JWT')) {
        console.warn('[FAQ Service] Authentication issue - this may resolve after deployment:', error.message);
      } else {
        console.error('[FAQ Service] Error fetching FAQ items:', error);
      }
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[FAQ Service] Unexpected error fetching FAQ items:', err);
    return [];
  }
}

export async function getFAQItemsByCategory(category: string): Promise<FAQItem[]> {
  try {
    const { data, error } = await supabase
      .from('faq_items')
      .select('*')
      .eq('is_active', true)
      .eq('category', category)
      .order('order_index');

    if (error) {
      if (error.code === 'PGRST301' || error.message.includes('JWT')) {
        console.warn('[FAQ Service] Authentication issue - this may resolve after deployment:', error.message);
      } else {
        console.error('[FAQ Service] Error fetching FAQ items by category:', error);
      }
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[FAQ Service] Unexpected error fetching FAQ items by category:', err);
    return [];
  }
}

export async function getFAQCategories(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('faq_items')
      .select('category')
      .eq('is_active', true);

    if (error) {
      if (error.code === 'PGRST301' || error.message.includes('JWT')) {
        console.warn('[FAQ Service] Authentication issue - this may resolve after deployment:', error.message);
      } else {
        console.error('[FAQ Service] Error fetching FAQ categories:', error);
      }
      return [];
    }

    const uniqueCategories = [...new Set(data?.map(item => item.category) || [])];
    return uniqueCategories.sort();
  } catch (err) {
    console.error('[FAQ Service] Unexpected error fetching FAQ categories:', err);
    return [];
  }
}
