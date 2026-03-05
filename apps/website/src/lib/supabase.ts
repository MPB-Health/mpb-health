// Re-export Supabase client and utilities from shared database package
// This ensures all apps use the same singleton client instance
export {
  supabase,
  isSupabaseConfigured,
  checkSupabaseHealth,
  invalidateHealthCheck,
} from '@mpbhealth/database';

// Re-export types used throughout the website app
export type {
  BlogAuthor,
  BlogArticle,
  BlogArticleWithAuthor,
  BlogCategory,
  ResourceType,
  TargetAudience,
  SortOption,
  ResourceTopic,
  Resource,
  ResourceFilters,
  HealthcarePlanCategory,
  PlanCategoryProfile,
  PlanCategoryFeature,
  HealthcarePlanCategoryWithDetails,
  CmsEvent,
} from '@mpbhealth/database';
