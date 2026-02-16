import { supabase } from '@mpbhealth/database';

export interface AdminBulletin {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  content_type: string;
  category_id: string | null;
  category?: { id: string; name: string; slug: string; description: string | null; display_order: number };
  published_date: string | null;
  featured_image_url: string | null;
  is_published: boolean;
  is_featured: boolean;
  view_count: number;
  notification_sent_at: string | null;
  notification_count: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface BulletinCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
}

export interface BulletinCreateInput {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  category_id?: string | null;
  featured_image_url?: string | null;
  is_published?: boolean;
  is_featured?: boolean;
  published_date?: string | null;
  metadata?: Record<string, unknown>;
}

export interface BulletinUpdateInput {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  category_id?: string | null;
  featured_image_url?: string | null;
  is_published?: boolean;
  is_featured?: boolean;
  published_date?: string | null;
  metadata?: Record<string, unknown>;
}

export class BulletinService {
  // Get all bulletins (admin view - includes drafts)
  async getBulletins(filters?: {
    status?: 'all' | 'published' | 'draft';
    category_id?: string;
    search?: string;
  }): Promise<AdminBulletin[]> {
    let query = supabase
      .from('advisor_content')
      .select(`
        *,
        category:advisor_content_categories(id, name, slug, description, display_order)
      `)
      .eq('content_type', 'bulletin')
      .order('created_at', { ascending: false });

    if (filters?.status === 'published') {
      query = query.eq('is_published', true);
    } else if (filters?.status === 'draft') {
      query = query.eq('is_published', false);
    }

    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id);
    }

    if (filters?.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%,content.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as AdminBulletin[];
  }

  // Get a single bulletin
  async getBulletin(id: string): Promise<AdminBulletin | null> {
    const { data, error } = await supabase
      .from('advisor_content')
      .select(`
        *,
        category:advisor_content_categories(id, name, slug, description, display_order)
      `)
      .eq('id', id)
      .eq('content_type', 'bulletin')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as AdminBulletin | null;
  }

  // Create a bulletin
  async createBulletin(input: BulletinCreateInput): Promise<AdminBulletin> {
    const slug = input.slug || this.generateSlug(input.title);

    const { data, error } = await supabase
      .from('advisor_content')
      .insert({
        title: input.title,
        slug,
        excerpt: input.excerpt || '',
        content: input.content,
        content_type: 'bulletin',
        category_id: input.category_id || null,
        featured_image_url: input.featured_image_url || null,
        is_published: input.is_published ?? false,
        is_featured: input.is_featured ?? false,
        published_date: input.is_published ? new Date().toISOString() : null,
        metadata: input.metadata || {},
      })
      .select(`
        *,
        category:advisor_content_categories(id, name, slug, description, display_order)
      `)
      .single();

    if (error) throw error;
    return data as AdminBulletin;
  }

  // Update a bulletin
  async updateBulletin(id: string, input: BulletinUpdateInput): Promise<AdminBulletin> {
    const updateData: Record<string, unknown> = {
      ...input,
      updated_at: new Date().toISOString(),
    };

    // If publishing for the first time, set published_date
    if (input.is_published !== undefined) {
      if (input.is_published && !input.published_date) {
        const existing = await this.getBulletin(id);
        if (existing && !existing.published_date) {
          updateData.published_date = new Date().toISOString();
        }
      }
    }

    const { data, error } = await supabase
      .from('advisor_content')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        category:advisor_content_categories(id, name, slug, description, display_order)
      `)
      .single();

    if (error) throw error;
    return data as AdminBulletin;
  }

  // Delete a bulletin
  async deleteBulletin(id: string): Promise<void> {
    const { error } = await supabase
      .from('advisor_content')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Toggle publish status
  async togglePublish(id: string): Promise<AdminBulletin> {
    const bulletin = await this.getBulletin(id);
    if (!bulletin) throw new Error('Bulletin not found');

    return this.updateBulletin(id, {
      is_published: !bulletin.is_published,
      published_date: !bulletin.is_published ? new Date().toISOString() : bulletin.published_date,
    });
  }

  // Toggle featured status
  async toggleFeatured(id: string): Promise<AdminBulletin> {
    const bulletin = await this.getBulletin(id);
    if (!bulletin) throw new Error('Bulletin not found');

    return this.updateBulletin(id, {
      is_featured: !bulletin.is_featured,
    });
  }

  // Get categories
  async getCategories(): Promise<BulletinCategory[]> {
    const { data, error } = await supabase
      .from('advisor_content_categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Upload featured image to Supabase Storage
  async uploadImage(file: File, slug: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${slug}-${Date.now()}.${fileExt}`;
    const filePath = `bulletin-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('public-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('public-assets')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  }

  // Get bulletin stats
  async getStats(): Promise<{
    total: number;
    published: number;
    draft: number;
    totalViews: number;
  }> {
    const { data, error } = await supabase
      .from('advisor_content')
      .select('id, is_published, view_count')
      .eq('content_type', 'bulletin');

    if (error) throw error;

    const bulletins = data || [];
    return {
      total: bulletins.length,
      published: bulletins.filter(b => b.is_published).length,
      draft: bulletins.filter(b => !b.is_published).length,
      totalViews: bulletins.reduce((sum, b) => sum + (b.view_count || 0), 0),
    };
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}

export const bulletinService = new BulletinService();
