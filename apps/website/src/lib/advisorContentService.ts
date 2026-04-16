import { supabase } from './supabase';

export interface AdvisorContentCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface AdvisorContent {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  content_type: 'bulletin' | 'resource' | 'guideline' | 'form';
  category_id: string | null;
  published_date: string;
  featured_image_url: string | null;
  is_published: boolean;
  view_count: number;
  wordpress_id: number | null;
  metadata: any;
  created_at: string;
  updated_at: string;
  category?: AdvisorContentCategory;
}

export interface AdvisorContentBookmark {
  id: string;
  content_id: string;
  advisor_id: string;
  created_at: string;
}

export interface ContentFilters {
  category?: string;
  contentType?: string;
  search?: string;
}

export const advisorContentService = {
  async getCategories(): Promise<AdvisorContentCategory[]> {
    const { data, error } = await supabase
      .from('advisor_content_categories')
      .select('id, name, slug, description, display_order, created_at, updated_at')
      .order('display_order');

    if (error) throw error;
    return (data || []) as any;
  },

  async getContent(filters?: ContentFilters): Promise<AdvisorContent[]> {
    let query = supabase
      .from('advisor_content')
      .select(`
        *,
        category:advisor_content_categories(*)
      `)
      .eq('is_published', true)
      .order('published_date', { ascending: false });

    if (filters?.category) {
      const { data: category } = await supabase
        .from('advisor_content_categories')
        .select('id')
        .eq('slug', filters.category)
        .maybeSingle();

      if (category) {
        query = query.eq('category_id', category.id);
      }
    }

    if (filters?.contentType) {
      query = query.eq('content_type', filters.contentType);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as any;
  },

  async getContentBySlug(slug: string): Promise<AdvisorContent | null> {
    const { data, error } = await supabase
      .from('advisor_content')
      .select(`
        *,
        category:advisor_content_categories(*)
      `)
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (error) throw error;
    return data as any;
  },

  async incrementViewCount(contentId: string, advisorId: string): Promise<void> {
    await supabase
      .from('advisor_content_views')
      .insert({
        content_id: contentId,
        advisor_id: advisorId
      });

    try {
      await supabase.rpc('increment', {
        table_name: 'advisor_content',
        row_id: contentId,
        column_name: 'view_count'
      });
    } catch {
      // Fallback if increment function doesn't exist
      supabase
        .from('advisor_content')
        .select('view_count')
        .eq('id', contentId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            supabase
              .from('advisor_content')
              .update({ view_count: (data.view_count || 0) + 1 })
              .eq('id', contentId)
              .then(() => {});
          }
        });
    }
  },

  async getBookmarks(advisorId: string): Promise<AdvisorContent[]> {
    const { data, error } = await supabase
      .from('advisor_content_bookmarks')
      .select(`
        content:advisor_content(
          *,
          category:advisor_content_categories(*)
        )
      `)
      .eq('advisor_id', advisorId);

    if (error) throw error;
    return data?.map((item: any) => item.content).filter(Boolean) || [];
  },

  async isBookmarked(contentId: string, advisorId: string): Promise<boolean> {
    const { data } = await supabase
      .from('advisor_content_bookmarks')
      .select('id')
      .eq('content_id', contentId)
      .eq('advisor_id', advisorId)
      .maybeSingle();

    return !!data;
  },

  async toggleBookmark(contentId: string, advisorId: string): Promise<boolean> {
    const isBookmarked = await this.isBookmarked(contentId, advisorId);

    if (isBookmarked) {
      await supabase
        .from('advisor_content_bookmarks')
        .delete()
        .eq('content_id', contentId)
        .eq('advisor_id', advisorId);
      return false;
    } else {
      await supabase
        .from('advisor_content_bookmarks')
        .insert({
          content_id: contentId,
          advisor_id: advisorId
        });
      return true;
    }
  },

  async getLatestBulletins(limit: number = 5): Promise<AdvisorContent[]> {
    const { data, error } = await supabase
      .from('advisor_content')
      .select(`
        *,
        category:advisor_content_categories(*)
      `)
      .eq('content_type', 'bulletin')
      .eq('is_published', true)
      .order('published_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as any;
  },

  async createContent(content: Partial<AdvisorContent>): Promise<AdvisorContent> {
    const { data, error } = await supabase
      .from('advisor_content')
      .insert(content)
      .select()
      .single();

    if (error) throw error;
    return data as any;
  },

  async updateContent(id: string, updates: Partial<AdvisorContent>): Promise<AdvisorContent> {
    const { data, error } = await supabase
      .from('advisor_content')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as any;
  },

  async deleteContent(id: string): Promise<void> {
    const { error } = await supabase
      .from('advisor_content')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
