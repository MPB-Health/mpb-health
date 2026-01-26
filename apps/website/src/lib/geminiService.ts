import { supabase } from './supabase';

export interface GeminiPrompt {
  id: string;
  name: string;
  template: string;
  variables: string[];
  category: string;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface BlogGenerationLog {
  id: string;
  prompt_id?: string;
  prompt_used: string;
  tokens_used: number;
  content_generated?: string;
  success: boolean;
  error_message?: string;
  generation_time_ms?: number;
  metadata?: Record<string, any>;
  created_by?: string;
  created_at: string;
}

export interface GenerateBlogPostRequest {
  promptId?: string;
  customPrompt?: string;
  variables: Record<string, string>;
  geminiEndpoint: string;
  saveToBlog?: boolean;
}

export interface GenerateBlogPostResponse {
  success: boolean;
  content?: string;
  tokensUsed?: number;
  generationTime?: number;
  logId?: string;
  blogPostId?: string;
  error?: string;
}

/**
 * Generate a blog post using Gemini AI
 */
export async function generateBlogPost(
  request: GenerateBlogPostRequest
): Promise<GenerateBlogPostResponse> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Authentication required');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const response = await fetch(
      `${supabaseUrl}/functions/v1/generate-blog-post`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate blog post');
    }

    return await response.json();
  } catch (error) {
    console.error('Generate blog post error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all available Gemini prompts
 */
export async function getGeminiPrompts(category?: string): Promise<GeminiPrompt[]> {
  try {
    let query = supabase
      .from('gemini_prompts')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get prompts error:', error);
    return [];
  }
}

/**
 * Get a specific prompt by ID
 */
export async function getGeminiPrompt(promptId: string): Promise<GeminiPrompt | null> {
  try {
    const { data, error } = await supabase
      .from('gemini_prompts')
      .select('*')
      .eq('id', promptId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Get prompt error:', error);
    return null;
  }
}

/**
 * Create a new Gemini prompt template
 */
export async function createGeminiPrompt(
  prompt: Omit<GeminiPrompt, 'id' | 'created_at' | 'updated_at' | 'usage_count'>
): Promise<GeminiPrompt | null> {
  try {
    const { data, error } = await supabase
      .from('gemini_prompts')
      .insert({
        ...prompt,
        usage_count: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Create prompt error:', error);
    return null;
  }
}

/**
 * Update an existing prompt
 */
export async function updateGeminiPrompt(
  promptId: string,
  updates: Partial<Omit<GeminiPrompt, 'id' | 'created_at' | 'updated_at'>>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('gemini_prompts')
      .update(updates)
      .eq('id', promptId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Update prompt error:', error);
    return false;
  }
}

/**
 * Get generation logs with optional filters
 */
export async function getBlogGenerationLogs(
  filters?: {
    success?: boolean;
    limit?: number;
    promptId?: string;
  }
): Promise<BlogGenerationLog[]> {
  try {
    let query = supabase
      .from('blog_generation_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.success !== undefined) {
      query = query.eq('success', filters.success);
    }

    if (filters?.promptId) {
      query = query.eq('prompt_id', filters.promptId);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get generation logs error:', error);
    return [];
  }
}

/**
 * Get generation statistics
 */
export async function getGenerationStats(): Promise<{
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  totalTokensUsed: number;
  averageGenerationTime: number;
}> {
  try {
    const { data, error } = await supabase
      .from('blog_generation_logs')
      .select('success, tokens_used, generation_time_ms');

    if (error) throw error;

    const stats = {
      totalGenerations: data?.length || 0,
      successfulGenerations: data?.filter((log) => log.success).length || 0,
      failedGenerations: data?.filter((log) => !log.success).length || 0,
      totalTokensUsed: data?.reduce((sum, log) => sum + (log.tokens_used || 0), 0) || 0,
      averageGenerationTime: 0,
    };

    const timeLogs = data?.filter((log) => log.generation_time_ms);
    if (timeLogs && timeLogs.length > 0) {
      stats.averageGenerationTime =
        timeLogs.reduce((sum, log) => sum + (log.generation_time_ms || 0), 0) / timeLogs.length;
    }

    return stats;
  } catch (error) {
    console.error('Get generation stats error:', error);
    return {
      totalGenerations: 0,
      successfulGenerations: 0,
      failedGenerations: 0,
      totalTokensUsed: 0,
      averageGenerationTime: 0,
    };
  }
}

/**
 * Replace variables in a prompt template
 */
export function replacePromptVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}

/**
 * Extract variables from a prompt template
 */
export function extractPromptVariables(template: string): string[] {
  const matches = template.match(/\{\{([^}]+)\}\}/g);
  if (!matches) return [];

  return matches.map((match) => match.replace(/\{\{|\}\}/g, '').trim());
}
