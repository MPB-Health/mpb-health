import { supabase } from '@mpbhealth/database';
import type { BlogPost, Resource } from '../types';

const BLOG_SELECT = 'id, title, slug, content, excerpt, featured_image_url, author_id, author, is_published, category, tags, published_date, view_count, read_time, scheduled_publish_at, created_at, updated_at';
const RESOURCE_SELECT = 'id, title, slug, description, content, resource_type, target_audience, topics, featured_image_url, file_url, is_featured, is_published, published_date, view_count, download_count, metadata, created_at, updated_at';

export class ContentService {
  // ========== Blog Posts (table: blog_articles) ==========

  async getBlogPosts(filters?: {
    status?: string;
    category?: string;
    search?: string;
  }): Promise<BlogPost[]> {
    let query = supabase
      .from('blog_articles')
      .select(BLOG_SELECT)
      .order('created_at', { ascending: false });

    if (filters?.status === 'published') {
      query = query.eq('is_published', true);
    } else if (filters?.status === 'draft') {
      query = query.eq('is_published', false);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as any;
  }

  async getPublishedPosts(): Promise<BlogPost[]> {
    return this.getBlogPosts({ status: 'published' });
  }

  async getBlogPost(postId: string): Promise<BlogPost | null> {
    const { data, error } = await supabase
      .from('blog_articles')
      .select(BLOG_SELECT)
      .eq('id', postId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as any;
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    const { data, error } = await supabase
      .from('blog_articles')
      .select(BLOG_SELECT)
      .eq('slug', slug)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as any;
  }

  async createBlogPost(
    post: Omit<BlogPost, 'id' | 'created_at' | 'updated_at' | 'view_count'>
  ): Promise<BlogPost> {
    const slug = post.slug || this.generateSlug(post.title);

    const { data, error } = await supabase
      .from('blog_articles')
      .insert({ ...post, slug, view_count: 0 })
      .select(BLOG_SELECT)
      .single();

    if (error) throw error;
    return data as any;
  }

  async updateBlogPost(
    postId: string,
    updates: Partial<Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<BlogPost> {
    const { data, error } = await supabase
      .from('blog_articles')
      .update(updates)
      .eq('id', postId)
      .select(BLOG_SELECT)
      .single();

    if (error) throw error;
    return data as any;
  }

  async publishPost(postId: string): Promise<BlogPost> {
    return this.updateBlogPost(postId, {
      is_published: true,
      published_date: new Date().toISOString(),
    });
  }

  async unpublishPost(postId: string): Promise<BlogPost> {
    return this.updateBlogPost(postId, {
      is_published: false,
      published_date: null,
    });
  }

  async archivePost(postId: string): Promise<BlogPost> {
    return this.updateBlogPost(postId, { is_published: false });
  }

  async deleteBlogPost(postId: string): Promise<void> {
    const { error } = await supabase
      .from('blog_articles')
      .delete()
      .eq('id', postId);

    if (error) throw error;
  }

  async getBlogCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('blog_articles')
      .select('category');

    if (error) throw error;

    const categories = [...new Set(data?.map((p) => p.category) || [])];
    return categories.filter(Boolean).sort();
  }

  // ========== Resources (table: resource_library) ==========

  async getResources(filters?: {
    category?: string;
    isPublic?: boolean;
    search?: string;
  }): Promise<Resource[]> {
    let query = supabase
      .from('resource_library')
      .select(RESOURCE_SELECT)
      .order('created_at', { ascending: false });

    if (filters?.category) {
      query = query.eq('resource_type', filters.category);
    }
    if (filters?.isPublic !== undefined) {
      query = query.eq('is_published', filters.isPublic);
    }
    if (filters?.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as any;
  }

  async getResource(resourceId: string): Promise<Resource | null> {
    const { data, error } = await supabase
      .from('resource_library')
      .select(RESOURCE_SELECT)
      .eq('id', resourceId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as any;
  }

  async uploadResource(
    file: File,
    metadata: {
      title: string;
      description?: string;
      resource_type: string;
      isPublic: boolean;
    }
  ): Promise<Resource> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `resources/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('resources')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('resources')
      .getPublicUrl(filePath);

    const { data, error } = await supabase
      .from('resource_library')
      .insert({
        title: metadata.title,
        description: metadata.description || null,
        resource_type: metadata.resource_type,
        file_url: urlData.publicUrl,
        is_published: metadata.isPublic,
        download_count: 0,
        view_count: 0,
      })
      .select(RESOURCE_SELECT)
      .single();

    if (error) throw error;
    return data as any;
  }

  async updateResource(
    resourceId: string,
    updates: Partial<Omit<Resource, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<Resource> {
    const { data, error } = await supabase
      .from('resource_library')
      .update(updates)
      .eq('id', resourceId)
      .select(RESOURCE_SELECT)
      .single();

    if (error) throw error;
    return data as any;
  }

  async deleteResource(resourceId: string): Promise<void> {
    const resource = await this.getResource(resourceId);
    if (!resource) throw new Error('Resource not found');

    if (resource.file_url) {
      const filePath = resource.file_url.split('/').slice(-2).join('/');
      await supabase.storage.from('resources').remove([filePath]);
    }

    const { error } = await supabase
      .from('resource_library')
      .delete()
      .eq('id', resourceId);

    if (error) throw error;
  }

  async trackDownload(resourceId: string): Promise<void> {
    await supabase.rpc('increment_resource_download_count', {
      resource_id: resourceId,
    });
  }

  async getResourceCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('resource_library')
      .select('resource_type');

    if (error) throw error;

    const categories = [...new Set(data?.map((r) => r.resource_type) || [])];
    return categories.filter(Boolean).sort();
  }

  // ========== Helpers ==========

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}

export const contentService = new ContentService();
