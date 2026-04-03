import { supabase } from './supabase';
import { generateBlogPost, type GenerateBlogPostRequest, type GenerateBlogPostResponse } from './geminiService';

export interface BlogPostData {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  featured_image_url?: string;
  category?: string;
  author?: string;
  is_published?: boolean;
  scheduled_publish_at?: string;
  tags?: string[];
}

export interface BulkImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
  createdPosts: Array<{ id: string; title: string; slug: string }>;
}

export interface CreatePostOptions {
  publishImmediately?: boolean;
  scheduleFor?: string;
}

/**
 * Generate a unique slug from a title
 */
export function generateSlug(title: string, timestamp?: boolean): string {
  let slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (timestamp) {
    slug = `${slug}-${Date.now()}`;
  }

  return slug;
}

/**
 * Calculate estimated read time based on content
 */
export function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const text = content.replace(/<[^>]*>/g, '');
  const wordCount = text.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Validate blog post data
 */
export function validateBlogPost(post: BlogPostData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!post.title || post.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (!post.excerpt || post.excerpt.trim().length === 0) {
    errors.push('Excerpt is required');
  }

  if (!post.content || post.content.trim().length === 0) {
    errors.push('Content is required');
  }

  if (post.content && post.content.length < 100) {
    errors.push('Content must be at least 100 characters');
  }

  if (post.slug && !/^[a-z0-9-]+$/.test(post.slug)) {
    errors.push('Slug must contain only lowercase letters, numbers, and hyphens');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create a single blog post
 */
export async function createBlogPost(
  postData: BlogPostData,
  options: CreatePostOptions = {}
): Promise<{ success: boolean; postId?: string; slug?: string; error?: string }> {
  try {
    const validation = validateBlogPost(postData);
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    const slug = postData.slug || generateSlug(postData.title, true);

    const { data: existingPost } = await supabase
      .from('blog_articles')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existingPost) {
      throw new Error(`A post with slug "${slug}" already exists`);
    }

    const readTime = calculateReadTime(postData.content);

    const insertData = {
      title: postData.title,
      slug,
      excerpt: postData.excerpt,
      content: postData.content,
      featured_image_url: postData.featured_image_url || '',
      category: postData.category || 'Healthcare',
      author: postData.author || 'MPB Health',
      is_published: options.publishImmediately ?? postData.is_published ?? false,
      scheduled_publish_at: options.scheduleFor || postData.scheduled_publish_at || null,
      read_time: readTime,
      published_date: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('blog_articles')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      postId: data.id,
      slug: data.slug,
    };
  } catch (error) {
    console.error('Create blog post error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate blog post using AI and save to database
 */
export async function generateAndCreateBlogPost(
  request: GenerateBlogPostRequest,
  additionalData?: Partial<BlogPostData>,
  options: CreatePostOptions = {}
): Promise<GenerateBlogPostResponse & { postId?: string; slug?: string }> {
  try {
    const genResult = await generateBlogPost({
      ...request,
      saveToBlog: false,
    });

    if (!genResult.success || !genResult.content) {
      return genResult;
    }

    const postData: BlogPostData = {
      title: request.variables.topic || 'AI Generated Post',
      excerpt: genResult.content.replace(/<[^>]*>/g, '').substring(0, 200) + '...',
      content: genResult.content,
      featured_image_url: request.variables.featured_image || additionalData?.featured_image_url,
      category: request.variables.category || additionalData?.category,
      author: request.variables.author || additionalData?.author,
      ...additionalData,
    };

    const createResult = await createBlogPost(postData, options);

    return {
      ...genResult,
      ...createResult,
    };
  } catch (error) {
    console.error('Generate and create blog post error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Parse CSV data into blog post objects
 */
export function parseCSVToBlogPosts(csvData: string): BlogPostData[] {
  const lines = csvData.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must contain headers and at least one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const posts: BlogPostData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const post: any = {};

    headers.forEach((header, index) => {
      if (values[index]) {
        post[header] = values[index];
      }
    });

    if (post.title && post.content) {
      posts.push({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || post.content.substring(0, 200),
        content: post.content,
        featured_image_url: post.featured_image_url || post.image,
        category: post.category,
        author: post.author,
        is_published: post.is_published === 'true' || post.is_published === '1',
      });
    }
  }

  return posts;
}

/**
 * Parse JSON data into blog post objects
 */
export function parseJSONToBlogPosts(jsonData: string): BlogPostData[] {
  const data = JSON.parse(jsonData);

  if (!Array.isArray(data)) {
    throw new Error('JSON must be an array of blog post objects');
  }

  return data.map((item: any) => ({
    title: item.title,
    slug: item.slug,
    excerpt: item.excerpt || item.content?.substring(0, 200),
    content: item.content,
    featured_image_url: item.featured_image_url || item.image || item.featured_image,
    category: item.category,
    author: item.author,
    is_published: Boolean(item.is_published),
    scheduled_publish_at: item.scheduled_publish_at || item.schedule_for,
    tags: item.tags,
  }));
}

/**
 * Bulk import blog posts from CSV or JSON
 */
export async function bulkImportBlogPosts(
  fileContent: string,
  fileType: 'csv' | 'json',
  options: CreatePostOptions = {}
): Promise<BulkImportResult> {
  const result: BulkImportResult = {
    success: false,
    imported: 0,
    failed: 0,
    errors: [],
    createdPosts: [],
  };

  try {
    let posts: BlogPostData[];

    if (fileType === 'csv') {
      posts = parseCSVToBlogPosts(fileContent);
    } else {
      posts = parseJSONToBlogPosts(fileContent);
    }

    if (posts.length === 0) {
      throw new Error('No valid blog posts found in file');
    }

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const createResult = await createBlogPost(post, options);

      if (createResult.success) {
        result.imported++;
        result.createdPosts.push({
          id: createResult.postId!,
          title: post.title,
          slug: createResult.slug!,
        });
      } else {
        result.failed++;
        result.errors.push({
          row: i + 1,
          error: createResult.error || 'Unknown error',
        });
      }
    }

    result.success = result.imported > 0;
    return result;
  } catch (error) {
    console.error('Bulk import error:', error);
    result.errors.push({
      row: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return result;
  }
}

/**
 * Update existing blog post
 */
export async function updateBlogPost(
  postId: string,
  updates: Partial<BlogPostData>
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = { ...updates };

    if (updates.content) {
      updateData.read_time = calculateReadTime(updates.content);
    }

    updateData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('blog_articles')
      .update(updateData)
      .eq('id', postId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Update blog post error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Publish a draft blog post
 */
export async function publishBlogPost(
  postId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error: updateError } = await supabase
      .from('blog_articles')
      .update({
        is_published: true,
        published_date: new Date().toISOString(),
      })
      .eq('id', postId);

    if (updateError) throw updateError;

    return { success: true };
  } catch (error) {
    console.error('Publish blog post error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete a blog post
 */
export async function deleteBlogPost(postId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('blog_articles')
      .delete()
      .eq('id', postId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Delete blog post error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get scheduled posts
 */
export async function getScheduledPosts(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('blog_articles')
      .select('*')
      .eq('is_published', false)
      .not('scheduled_publish_at', 'is', null)
      .order('scheduled_publish_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get scheduled posts error:', error);
    return [];
  }
}
