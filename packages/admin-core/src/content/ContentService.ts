import { supabase } from '@mpbhealth/database';
import type { BlogPost, Resource } from '../types';

export class ContentService {
  // ========== Blog Posts ==========

  // Get all blog posts
  async getBlogPosts(filters?: {
    status?: string;
    category?: string;
    search?: string;
  }): Promise<BlogPost[]> {
    let query = supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
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
    return data || [];
  }

  // Get published posts
  async getPublishedPosts(): Promise<BlogPost[]> {
    return this.getBlogPosts({ status: 'published' });
  }

  // Get a single post
  async getBlogPost(postId: string): Promise<BlogPost | null> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Get post by slug
  async getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Create a blog post
  async createBlogPost(
    post: Omit<BlogPost, 'id' | 'created_at' | 'updated_at' | 'view_count'>
  ): Promise<BlogPost> {
    // Generate slug from title if not provided
    const slug = post.slug || this.generateSlug(post.title);

    const { data, error } = await supabase
      .from('blog_posts')
      .insert({ ...post, slug, view_count: 0 })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update a blog post
  async updateBlogPost(
    postId: string,
    updates: Partial<Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<BlogPost> {
    const { data, error } = await supabase
      .from('blog_posts')
      .update(updates)
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Publish a post
  async publishPost(postId: string): Promise<BlogPost> {
    return this.updateBlogPost(postId, {
      status: 'published',
      published_at: new Date().toISOString(),
    });
  }

  // Unpublish a post
  async unpublishPost(postId: string): Promise<BlogPost> {
    return this.updateBlogPost(postId, {
      status: 'draft',
      published_at: null,
    });
  }

  // Archive a post
  async archivePost(postId: string): Promise<BlogPost> {
    return this.updateBlogPost(postId, { status: 'archived' });
  }

  // Delete a post
  async deleteBlogPost(postId: string): Promise<void> {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;
  }

  // Get blog categories
  async getBlogCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('category');

    if (error) throw error;

    const categories = [...new Set(data?.map((p) => p.category) || [])];
    return categories.filter(Boolean).sort();
  }

  // ========== Resources ==========

  // Get all resources
  async getResources(filters?: {
    category?: string;
    isPublic?: boolean;
    search?: string;
  }): Promise<Resource[]> {
    let query = supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.isPublic !== undefined) {
      query = query.eq('is_public', filters.isPublic);
    }
    if (filters?.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Get a single resource
  async getResource(resourceId: string): Promise<Resource | null> {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('id', resourceId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Upload a resource
  async uploadResource(
    file: File,
    metadata: {
      title: string;
      description?: string;
      category: string;
      isPublic: boolean;
      uploadedBy: string;
    }
  ): Promise<Resource> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `resources/${fileName}`;

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from('resources')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('resources')
      .getPublicUrl(filePath);

    // Create resource record
    const { data, error } = await supabase
      .from('resources')
      .insert({
        title: metadata.title,
        description: metadata.description || null,
        category: metadata.category,
        file_url: urlData.publicUrl,
        file_type: file.type,
        file_size: file.size,
        is_public: metadata.isPublic,
        download_count: 0,
        uploaded_by: metadata.uploadedBy,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update a resource
  async updateResource(
    resourceId: string,
    updates: Partial<Omit<Resource, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<Resource> {
    const { data, error } = await supabase
      .from('resources')
      .update(updates)
      .eq('id', resourceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete a resource
  async deleteResource(resourceId: string): Promise<void> {
    const resource = await this.getResource(resourceId);
    if (!resource) throw new Error('Resource not found');

    // Delete from storage
    const filePath = resource.file_url.split('/').slice(-2).join('/');
    await supabase.storage.from('resources').remove([filePath]);

    // Delete record
    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', resourceId);

    if (error) throw error;
  }

  // Track download
  async trackDownload(resourceId: string): Promise<void> {
    await supabase.rpc('increment_resource_download_count', {
      resource_id: resourceId,
    });
  }

  // Get resource categories
  async getResourceCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('resources')
      .select('category');

    if (error) throw error;

    const categories = [...new Set(data?.map((r) => r.category) || [])];
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
