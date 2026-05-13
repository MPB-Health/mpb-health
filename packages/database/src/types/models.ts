// ============================================================================
// Hand-crafted domain model types.
// These are NOT auto-generated — edit freely.
// Auto-generated Supabase types live in ./database.ts (via `pnpm db:generate`).
// ============================================================================

// Blog Types
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

// Resource Types
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

// Healthcare Plan Types
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

// Event Types
export interface CmsEvent {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image_url: string;
  event_date: string;
  event_end_date: string | null;
  location: string;
  location_type: 'in_person' | 'virtual' | 'hybrid';
  registration_url: string | null;
  event_type: 'conference' | 'webinar' | 'training' | 'networking' | 'celebration' | 'community' | 'other';
  organizer: string;
  max_attendees: number | null;
  is_published: boolean;
  is_featured: boolean;
  tags: string[];
  video_url: string | null;
  gallery_images: string[] | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------
// CMS Pages (page-builder)
//
// Each row is a public-facing page identified by its URL path. The block
// layout is a JSONB array stored under `sections`. See
// apps/website/src/components/cms-blocks/index.ts for the supported `kind`
// values and the props each accepts.
// ----------------------------------------------------------------------------

export type CmsBlockKind =
  | 'hero'
  | 'rich_text'
  | 'image'
  | 'image_grid'
  | 'cta_band'
  | 'stats'
  | 'two_column'
  | 'faq'
  | 'embed'
  | 'spacer';

export interface CmsBlockBase<K extends CmsBlockKind, P> {
  id: string;
  kind: K;
  props: P;
}

export interface CmsHeroProps {
  title: string;
  subtitle?: string;
  background_image?: string;
  primary_cta?: { label: string; href: string };
  secondary_cta?: { label: string; href: string };
  alignment?: 'left' | 'center';
}

export interface CmsRichTextProps {
  html: string;
  max_width?: 'prose' | 'wide';
}

export interface CmsImageProps {
  src: string;
  alt: string;
  caption?: string;
  aspect_ratio?: '16:9' | '4:3' | '1:1' | 'auto';
}

export interface CmsImageGridProps {
  columns?: 2 | 3 | 4;
  items: Array<{ src: string; alt: string; caption?: string }>;
}

export interface CmsCtaBandProps {
  title: string;
  subtitle?: string;
  cta: { label: string; href: string };
  variant?: 'primary' | 'subtle';
}

export interface CmsStatsProps {
  items: Array<{ value: string; label: string }>;
}

export interface CmsTwoColumnProps {
  title?: string;
  body_html: string;
  image_src: string;
  image_alt: string;
  image_position?: 'left' | 'right';
}

export interface CmsFaqProps {
  title?: string;
  items: Array<{ question: string; answer_html: string }>;
}

export interface CmsEmbedProps {
  url: string;
  title?: string;
  aspect_ratio?: '16:9' | '4:3' | '1:1';
}

export interface CmsSpacerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export type CmsBlock =
  | CmsBlockBase<'hero', CmsHeroProps>
  | CmsBlockBase<'rich_text', CmsRichTextProps>
  | CmsBlockBase<'image', CmsImageProps>
  | CmsBlockBase<'image_grid', CmsImageGridProps>
  | CmsBlockBase<'cta_band', CmsCtaBandProps>
  | CmsBlockBase<'stats', CmsStatsProps>
  | CmsBlockBase<'two_column', CmsTwoColumnProps>
  | CmsBlockBase<'faq', CmsFaqProps>
  | CmsBlockBase<'embed', CmsEmbedProps>
  | CmsBlockBase<'spacer', CmsSpacerProps>;

export interface CmsPageMeta {
  og_image?: string;
  og_description?: string;
  twitter_card?: 'summary' | 'summary_large_image';
  canonical_url?: string;
  noindex?: boolean;
}

export interface CmsPage {
  id: string;
  path: string;
  slug: string;
  title: string;
  description: string | null;
  sections: CmsBlock[];
  is_published: boolean;
  meta: CmsPageMeta;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Profile Types
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: 'super_admin' | 'admin' | 'advisor' | 'member' | 'guest';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// User Session Types
export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  device_fingerprint?: string;
  ip_address: string;
  user_agent: string;
  last_activity: string;
  expires_at: string;
  revoked: boolean;
  created_at: string;
}
