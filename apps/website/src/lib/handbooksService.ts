/**
 * Handbooks Service - Manages Member Handbooks from database with static fallback
 */

import { supabase } from './supabase';

// ============================================================================
// Types
// ============================================================================

export type PlanType = 'individual' | 'family' | 'employer' | 'hsa' | 'general';

export interface HandbookRecord {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  pdf_path: string;
  plan_type: PlanType;
  color: string;
  icon: string;
  features: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateHandbookInput {
  slug: string;
  name: string;
  description?: string;
  pdf_path: string;
  plan_type: PlanType;
  color?: string;
  icon?: string;
  features?: string[];
  is_active?: boolean;
  sort_order?: number;
}

export interface UpdateHandbookInput {
  slug?: string;
  name?: string;
  description?: string;
  pdf_path?: string;
  plan_type?: PlanType;
  color?: string;
  icon?: string;
  features?: string[];
  is_active?: boolean;
  sort_order?: number;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// Static Fallback Data
// ============================================================================

const STATIC_HANDBOOKS: HandbookRecord[] = [
  {
    id: 'static-careplus',
    slug: 'careplus',
    name: 'Care+ Handbook',
    description: 'Comprehensive membership for individuals and families seeking enhanced care options.',
    pdf_path: '/docs/Care+ Handbook-New Members (3).pdf',
    plan_type: 'family',
    color: 'blue',
    icon: 'Heart',
    features: ['Enhanced benefits', 'Telehealth included', 'Prescription membership'],
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'static-direct',
    slug: 'direct-handbook',
    name: 'Direct Handbook',
    description: 'Streamlined healthcare access with direct provider relationships.',
    pdf_path: '/docs/Direct Handbook-New Members (2).pdf',
    plan_type: 'individual',
    color: 'green',
    icon: 'Zap',
    features: ['Direct access', 'No referrals needed', 'Fast appointments'],
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'static-secure-hsa',
    slug: 'secure-hsa',
    name: 'Secure HSA Handbook',
    description: 'Health Savings Account compatible plan with tax advantages.',
    pdf_path: '/docs/Secure HSA Handbook-New Members.pdf',
    plan_type: 'hsa',
    color: 'emerald',
    icon: 'Shield',
    features: ['HSA compatible', 'Tax benefits', 'Rollover savings'],
    is_active: true,
    sort_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'static-premium-hsa',
    slug: 'premium-hsa',
    name: 'Premium HSA Handbook',
    description: 'Premium Health Savings Account compatible plan with enhanced benefits.',
    pdf_path: '/docs/Secure HSA Handbook-New Members.pdf',
    plan_type: 'hsa',
    color: 'emerald',
    icon: 'Shield',
    features: ['HSA compatible', 'Premium benefits', 'Tax advantages'],
    is_active: true,
    sort_order: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'static-essentials',
    slug: 'essentials',
    name: 'Essentials Handbook',
    description: 'Essential membership for basic healthcare needs at an affordable price.',
    pdf_path: '/docs/Essentials Handbook-New Members 1.pdf',
    plan_type: 'individual',
    color: 'sky',
    icon: 'Star',
    features: ['Affordable', 'Basic membership', 'Preventive care'],
    is_active: true,
    sort_order: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'static-mec',
    slug: 'mecessentials-handbook',
    name: 'MEC+ Essentials Handbook',
    description: 'Minimum Essential Coverage plus additional benefits for comprehensive protection.',
    pdf_path: '/docs/MEC+Essentials Handbook-New Members 1.pdf',
    plan_type: 'employer',
    color: 'purple',
    icon: 'Building2',
    features: ['ACA compliant', 'Employer plans', 'Group rates'],
    is_active: true,
    sort_order: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'static-zion',
    slug: 'zion-guidelines',
    name: 'Zion Member Guidelines',
    description: 'Comprehensive member guidelines for Zion HealthShare participants.',
    pdf_path: '/docs/Zion Member Guidelines.pdf',
    plan_type: 'general',
    color: 'slate',
    icon: 'BookOpen',
    features: ['Member guidelines', 'Sharing rules', 'Eligibility info'],
    is_active: true,
    sort_order: 7,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'static-sedera',
    slug: 'sedera-guidelines',
    name: 'Sedera Community Guidelines',
    description: 'Community guidelines for Sedera HealthShare members.',
    pdf_path: '/docs/Sedera-Community-Guidelines-2 (1).pdf',
    plan_type: 'general',
    color: 'teal',
    icon: 'Users',
    features: ['Community guidelines', 'Sharing rules', 'Membership info'],
    is_active: true,
    sort_order: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ============================================================================
// Cache
// ============================================================================

let handbooksCache: HandbookRecord[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function isCacheValid(): boolean {
  return handbooksCache !== null && Date.now() - cacheTimestamp < CACHE_TTL;
}

function invalidateCache(): void {
  handbooksCache = null;
  cacheTimestamp = 0;
}

// ============================================================================
// Available Icons for Handbooks
// ============================================================================

export const AVAILABLE_HANDBOOK_ICONS = [
  'BookOpen',
  'Heart',
  'Shield',
  'Star',
  'Zap',
  'Building2',
  'Users',
  'FileText',
  'Briefcase',
  'Award',
  'CheckCircle',
  'Sparkles',
] as const;

// ============================================================================
// Available Colors
// ============================================================================

export const AVAILABLE_COLORS = [
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'emerald', label: 'Emerald' },
  { value: 'sky', label: 'Sky' },
  { value: 'purple', label: 'Purple' },
  { value: 'amber', label: 'Amber' },
  { value: 'indigo', label: 'Indigo' },
  { value: 'slate', label: 'Slate' },
  { value: 'teal', label: 'Teal' },
  { value: 'pink', label: 'Pink' },
  { value: 'rose', label: 'Rose' },
  { value: 'orange', label: 'Orange' },
] as const;

// ============================================================================
// Plan Types
// ============================================================================

export const PLAN_TYPES: { value: PlanType; label: string }[] = [
  { value: 'individual', label: 'Individual' },
  { value: 'family', label: 'Family' },
  { value: 'employer', label: 'Employer' },
  { value: 'hsa', label: 'HSA' },
  { value: 'general', label: 'General' },
];

// ============================================================================
// Read Operations
// ============================================================================

/**
 * Check if the handbooks table exists and is accessible
 */
export async function isHandbooksTableAvailable(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('handbooks')
      .select('id')
      .limit(1);
    return !error;
  } catch (_error) {
    return false;
  }
}

/**
 * Get all handbooks from database, fallback to static config
 */
export async function getAllHandbooks(): Promise<HandbookRecord[]> {
  if (isCacheValid() && handbooksCache) {
    return handbooksCache;
  }

  try {
    const { data, error } = await supabase
      .from('handbooks')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.warn('Failed to fetch handbooks from database, using static fallback:', error);
      return STATIC_HANDBOOKS;
    }

    if (!data || data.length === 0) {
      return STATIC_HANDBOOKS;
    }

    // Parse features from JSONB if it's a string
    const handbooks = data.map((h) => ({
      ...h,
      features: Array.isArray(h.features) ? h.features : JSON.parse(h.features || '[]'),
    }));

    handbooksCache = handbooks;
    cacheTimestamp = Date.now();
    return handbooks;
  } catch (error) {
    console.error('Error fetching handbooks:', error);
    return STATIC_HANDBOOKS;
  }
}

/**
 * Get active handbooks only (for public pages)
 */
export async function getActiveHandbooks(): Promise<HandbookRecord[]> {
  const allHandbooks = await getAllHandbooks();
  return allHandbooks.filter((h) => h.is_active);
}

/**
 * Get a single handbook by slug
 */
export async function getHandbookBySlug(slug: string): Promise<HandbookRecord | null> {
  const allHandbooks = await getAllHandbooks();
  return allHandbooks.find((h) => h.slug === slug) || null;
}

/**
 * Get a single handbook by ID
 */
export async function getHandbookById(id: string): Promise<HandbookRecord | null> {
  try {
    const { data, error } = await supabase
      .from('handbooks')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      ...data,
      features: Array.isArray(data.features) ? data.features : JSON.parse(data.features || '[]'),
    };
  } catch (error) {
    console.error('Error fetching handbook by ID:', error);
    return null;
  }
}

/**
 * Get handbooks by plan type
 */
export async function getHandbooksByPlanType(planType: PlanType): Promise<HandbookRecord[]> {
  const allHandbooks = await getAllHandbooks();
  return allHandbooks.filter((h) => h.plan_type === planType && h.is_active);
}

// ============================================================================
// Write Operations
// ============================================================================

/**
 * Create a new handbook
 */
export async function createHandbook(input: CreateHandbookInput): Promise<ServiceResult<HandbookRecord>> {
  try {
    // Normalize slug (no leading/trailing slashes)
    const slug = input.slug.replace(/^\/+|\/+$/g, '');

    const { data, error } = await supabase
      .from('handbooks')
      .insert({
        slug,
        name: input.name,
        description: input.description || null,
        pdf_path: input.pdf_path,
        plan_type: input.plan_type,
        color: input.color || 'blue',
        icon: input.icon || 'BookOpen',
        features: input.features || [],
        is_active: input.is_active ?? true,
        sort_order: input.sort_order ?? 999,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    invalidateCache();
    return {
      success: true,
      data: {
        ...data,
        features: Array.isArray(data.features) ? data.features : JSON.parse(data.features || '[]'),
      },
    };
  } catch (_error) {
    return { success: false, error: 'Failed to create handbook' };
  }
}

/**
 * Update an existing handbook
 */
export async function updateHandbook(id: string, input: UpdateHandbookInput): Promise<ServiceResult<HandbookRecord>> {
  try {
    // Normalize slug if provided
    const updateData = { ...input };
    if (updateData.slug) {
      updateData.slug = updateData.slug.replace(/^\/+|\/+$/g, '');
    }

    const { data, error } = await supabase
      .from('handbooks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    invalidateCache();
    return {
      success: true,
      data: {
        ...data,
        features: Array.isArray(data.features) ? data.features : JSON.parse(data.features || '[]'),
      },
    };
  } catch (_error) {
    return { success: false, error: 'Failed to update handbook' };
  }
}

/**
 * Delete a handbook
 */
export async function deleteHandbook(id: string): Promise<ServiceResult<void>> {
  try {
    const { error } = await supabase
      .from('handbooks')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    invalidateCache();
    return { success: true };
  } catch (_error) {
    return { success: false, error: 'Failed to delete handbook' };
  }
}

/**
 * Toggle handbook visibility
 */
export async function toggleHandbookVisibility(id: string, isActive: boolean): Promise<ServiceResult<HandbookRecord>> {
  return updateHandbook(id, { is_active: isActive });
}

/**
 * Reorder handbooks
 */
export async function reorderHandbooks(orderedIds: string[]): Promise<ServiceResult<void>> {
  try {
    const updates = orderedIds.map((id, index) => ({
      id,
      sort_order: index + 1,
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('handbooks')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id);

      if (error) {
        return { success: false, error: error.message };
      }
    }

    invalidateCache();
    return { success: true };
  } catch (_error) {
    return { success: false, error: 'Failed to reorder handbooks' };
  }
}

// ============================================================================
// Export as namespace for convenience
// ============================================================================

export const handbooksService = {
  isHandbooksTableAvailable,
  getAllHandbooks,
  getActiveHandbooks,
  getHandbookBySlug,
  getHandbookById,
  getHandbooksByPlanType,
  createHandbook,
  updateHandbook,
  deleteHandbook,
  toggleHandbookVisibility,
  reorderHandbooks,
  invalidateCache,
};
