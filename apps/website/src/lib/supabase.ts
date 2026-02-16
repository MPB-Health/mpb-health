import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const hasValidConfig = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabaseAnonKey !== 'placeholder-key' &&
  supabaseUrl.includes('.supabase.co')
);

if (!hasValidConfig) {
  const isDevelopment = import.meta.env.DEV;
  const isProduction = import.meta.env.PROD;

  if (isProduction) {
    console.error(
      '❌ CRITICAL: Supabase configuration missing in production.',
      '\nRequired environment variables:',
      '\n  - VITE_SUPABASE_URL',
      '\n  - VITE_SUPABASE_ANON_KEY',
      '\nPlease configure these in your deployment settings.',
      '\nCurrent values:',
      '\n  VITE_SUPABASE_URL:', supabaseUrl || '(not set)',
      '\n  VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '(set but invalid)' : '(not set)'
    );
  } else if (isDevelopment) {
    console.warn(
      '⚠️ Supabase environment variables not configured.',
      '\nRequired in .env file:',
      '\n  VITE_SUPABASE_URL=your_supabase_url',
      '\n  VITE_SUPABASE_ANON_KEY=your_anon_key',
      '\nUsing placeholder values for development.'
    );
  }
} else {
  console.log('[Supabase] Configuration valid:', {
    url: supabaseUrl,
    hasAnonKey: Boolean(supabaseAnonKey)
  });
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'X-Client-Info': 'mpb-health-web'
      }
    }
  }
);

export const isSupabaseConfigured = hasValidConfig;

let healthCheckCache: { healthy: boolean; timestamp: number } | null = null;
const HEALTH_CHECK_CACHE_TTL = 60000;

export async function checkSupabaseHealth(): Promise<boolean> {
  if (!hasValidConfig) {
    return false;
  }

  if (healthCheckCache && Date.now() - healthCheckCache.timestamp < HEALTH_CHECK_CACHE_TTL) {
    return healthCheckCache.healthy;
  }

  try {
    const { error } = await supabase.from('profiles').select('id').limit(1).maybeSingle();

    const healthy = !error || error.code === 'PGRST116';

    healthCheckCache = {
      healthy,
      timestamp: Date.now(),
    };

    return healthy;
  } catch (error) {
    console.warn('[Supabase] Health check failed:', error);
    healthCheckCache = {
      healthy: false,
      timestamp: Date.now(),
    };
    return false;
  }
}

export function invalidateHealthCheck(): void {
  healthCheckCache = null;
}

export interface BlogAuthor {
  id: string;
  name: string;
  slug: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
  role?: string;
  social_linkedin?: string;
  social_twitter?: string;
  social_website?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image_url: string;
  category: string;
  author: string;
  author_id?: string;
  tags?: string[];
  published_date: string;
  is_published: boolean;
  read_time?: number;
  view_count?: number;
  created_at: string;
  updated_at: string;
}

export interface BlogArticleWithAuthor extends BlogArticle {
  author_details?: BlogAuthor;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  created_at: string;
}

export type ResourceType = 'Guide' | 'Webinar' | 'Checklist' | 'Marketing' | 'Form' | 'Document';
export type TargetAudience = 'Members' | 'Employers' | 'Advisors' | 'All';
export type SortOption = 'newest' | 'oldest' | 'most-viewed' | 'title-asc' | 'title-desc';

export interface ResourceTopic {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  created_at: string;
}

export interface Resource {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  resource_type: ResourceType;
  target_audience: TargetAudience;
  topics: string[];
  featured_image_url: string;
  file_url: string | null;
  is_featured: boolean;
  published_date: string;
  view_count: number;
  download_count: number;
  metadata: Record<string, unknown>;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResourceFilters {
  search: string;
  types: ResourceType[];
  audiences: TargetAudience[];
  topics: string[];
  sortBy: SortOption;
}

export interface HealthcarePlanCategory {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  gradient: string;
  icon_bg: string;
  image_url: string;
  image_alt: string;
  recommendations: string;
  best_for: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanCategoryProfile {
  id: string;
  category_id: string;
  profile_text: string;
  order_index: number;
  created_at: string;
}

export interface PlanCategoryFeature {
  id: string;
  category_id: string;
  feature_text: string;
  feature_type: 'included' | 'excluded';
  order_index: number;
  created_at: string;
}

export interface HealthcarePlanCategoryWithDetails extends HealthcarePlanCategory {
  profiles: PlanCategoryProfile[];
  included_features: PlanCategoryFeature[];
  excluded_features: PlanCategoryFeature[];
}
