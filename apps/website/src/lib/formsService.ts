/**
 * Forms Service - Manages Cognito Forms from database with static fallback
 */

import { supabase } from './supabase';
import { FORMS, type FormEntry, type FormCategory } from '../config/forms.config';

// ============================================================================
// Types
// ============================================================================

export interface CognitoFormRecord {
  id: string;
  slug: string;
  label: string;
  category: FormCategory;
  description: string | null;
  icon: string;
  estimated_minutes: number;
  cognito_embed: string | null;
  is_active: boolean;
  requires_auth: boolean;
  sort_order: number;
  show_in_menu: boolean;
  menu_section: string;
  menu_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateFormInput {
  slug: string;
  label: string;
  category: FormCategory;
  description?: string;
  icon?: string;
  estimated_minutes?: number;
  cognito_embed?: string;
  is_active?: boolean;
  requires_auth?: boolean;
  sort_order?: number;
  show_in_menu?: boolean;
  menu_section?: string;
  menu_order?: number;
}

export interface UpdateFormInput {
  slug?: string;
  label?: string;
  category?: FormCategory;
  description?: string;
  icon?: string;
  estimated_minutes?: number;
  cognito_embed?: string;
  is_active?: boolean;
  requires_auth?: boolean;
  sort_order?: number;
  show_in_menu?: boolean;
  menu_section?: string;
  menu_order?: number;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// Cache
// ============================================================================

let formsCache: CognitoFormRecord[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function isCacheValid(): boolean {
  return formsCache !== null && Date.now() - cacheTimestamp < CACHE_TTL;
}

function invalidateCache(): void {
  formsCache = null;
  cacheTimestamp = 0;
}

// ============================================================================
// Read Operations
// ============================================================================

/**
 * Get all forms from database, fallback to static config
 */
export async function getAllForms(): Promise<CognitoFormRecord[]> {
  if (isCacheValid() && formsCache) {
    return formsCache;
  }

  try {
    const { data, error } = await supabase
      .from('cognito_forms')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.warn('Failed to fetch forms from database, using static fallback:', error);
      return convertStaticToRecords();
    }

    if (data && data.length > 0) {
      // Normalize data to ensure all fields have defaults (handles missing columns gracefully)
      const normalizedData = data.map((form: Record<string, unknown>) => ({
        id: form.id as string,
        slug: form.slug as string,
        label: form.label as string,
        category: form.category as FormCategory,
        description: (form.description as string) || null,
        icon: (form.icon as string) || 'FileText',
        estimated_minutes: (form.estimated_minutes as number) || 5,
        cognito_embed: (form.cognito_embed as string) || null,
        is_active: form.is_active !== false,
        requires_auth: form.requires_auth === true,
        sort_order: (form.sort_order as number) || 0,
        show_in_menu: form.show_in_menu === true,
        menu_section: (form.menu_section as string) || 'member-forms',
        menu_order: (form.menu_order as number) || 99,
        created_at: (form.created_at as string) || new Date().toISOString(),
        updated_at: (form.updated_at as string) || new Date().toISOString(),
      })) as CognitoFormRecord[];
      
      formsCache = normalizedData;
      cacheTimestamp = Date.now();
      return normalizedData;
    }

    // Empty table, return static
    return convertStaticToRecords();
  } catch (error) {
    console.error('Error fetching forms:', error);
    return convertStaticToRecords();
  }
}

/**
 * Get forms filtered by category
 */
export async function getFormsByCategory(category: FormCategory): Promise<CognitoFormRecord[]> {
  const allForms = await getAllForms();
  return allForms.filter(form => form.category === category);
}

/**
 * Get active forms only (for public pages)
 */
export async function getActiveForms(): Promise<CognitoFormRecord[]> {
  const allForms = await getAllForms();
  return allForms.filter(form => form.is_active);
}

/**
 * Get forms that should appear in navigation menu
 * Returns empty array if menu columns don't exist yet (graceful fallback)
 */
export async function getMenuForms(): Promise<CognitoFormRecord[]> {
  try {
    // First check if the show_in_menu column exists by doing a simple query
    const { data, error } = await supabase
      .from('cognito_forms')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.warn('Failed to fetch menu forms:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Check if show_in_menu column exists in the data
    const hasMenuColumns = 'show_in_menu' in data[0];
    
    if (!hasMenuColumns) {
      // Column doesn't exist yet, return empty array
      console.warn('Menu columns not yet added to database');
      return [];
    }

    // Filter and sort forms that should show in menu
    return data
      .filter((form: CognitoFormRecord) => form.show_in_menu === true)
      .sort((a: CognitoFormRecord, b: CognitoFormRecord) => {
        if (a.menu_section !== b.menu_section) {
          return (a.menu_section || '').localeCompare(b.menu_section || '');
        }
        return (a.menu_order || 99) - (b.menu_order || 99);
      });
  } catch (error) {
    console.error('Error fetching menu forms:', error);
    return [];
  }
}

/**
 * Get forms for a specific menu section
 */
export async function getFormsByMenuSection(section: string): Promise<CognitoFormRecord[]> {
  const menuForms = await getMenuForms();
  return menuForms.filter(form => form.menu_section === section);
}

/**
 * Get a single form by slug
 */
export async function getFormBySlug(slug: string): Promise<CognitoFormRecord | null> {
  // Normalize slug
  const normalizedSlug = slug.endsWith('/') ? slug : `${slug}/`;
  const alternateSlug = slug.endsWith('/') ? slug.slice(0, -1) : slug;

  const allForms = await getAllForms();
  return allForms.find(form => 
    form.slug === normalizedSlug || form.slug === alternateSlug
  ) || null;
}

/**
 * Get a single form by ID
 */
export async function getFormById(id: string): Promise<CognitoFormRecord | null> {
  try {
    const { data, error } = await supabase
      .from('cognito_forms')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching form by ID:', error);
    return null;
  }
}

// ============================================================================
// Write Operations
// ============================================================================

/**
 * Create a new form
 */
export async function createForm(input: CreateFormInput): Promise<ServiceResult<CognitoFormRecord>> {
  try {
    // Normalize slug
    const slug = input.slug.startsWith('/') ? input.slug : `/${input.slug}`;
    const normalizedSlug = slug.endsWith('/') ? slug : `${slug}/`;

    // Check if menu columns exist in database by testing a simple query
    let menuColumnsExist = true;
    try {
      const { data: testData } = await supabase
        .from('cognito_forms')
        .select('show_in_menu')
        .limit(1);
      menuColumnsExist = testData !== null;
    } catch (_error) {
      menuColumnsExist = false;
    }

    // Build insert data, excluding menu fields if columns don't exist
    const insertData: Record<string, unknown> = {
      slug: normalizedSlug,
      label: input.label,
      category: input.category,
      description: input.description,
      icon: input.icon || 'FileText',
      estimated_minutes: input.estimated_minutes || 5,
      cognito_embed: input.cognito_embed,
      is_active: input.is_active ?? true,
      requires_auth: input.requires_auth ?? false,
      sort_order: input.sort_order ?? 999,
    };

    // Only add menu fields if columns exist
    if (menuColumnsExist) {
      insertData.show_in_menu = input.show_in_menu ?? false;
      insertData.menu_section = input.menu_section ?? 'member-forms';
      insertData.menu_order = input.menu_order ?? 99;
    }

    const { data, error } = await supabase
      .from('cognito_forms')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    invalidateCache();
    return { success: true, data };
  } catch (_error) {
    return { success: false, error: 'Failed to create form' };
  }
}

/**
 * Update an existing form
 */
export async function updateForm(id: string, input: UpdateFormInput): Promise<ServiceResult<CognitoFormRecord>> {
  try {
    // Normalize slug if provided
    if (input.slug) {
      const slug = input.slug.startsWith('/') ? input.slug : `/${input.slug}`;
      input.slug = slug.endsWith('/') ? slug : `${slug}/`;
    }

    // Check if menu columns exist in database by testing a simple query
    let menuColumnsExist = true;
    try {
      const { data: testData } = await supabase
        .from('cognito_forms')
        .select('show_in_menu')
        .limit(1);
      menuColumnsExist = testData !== null;
    } catch (_error) {
      menuColumnsExist = false;
    }

    // Strip menu-related fields if columns don't exist
    const updateData = { ...input };
    if (!menuColumnsExist) {
      delete updateData.show_in_menu;
      delete updateData.menu_section;
      delete updateData.menu_order;
    }

    const { data, error } = await supabase
      .from('cognito_forms')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    invalidateCache();
    return { success: true, data };
  } catch (_error) {
    return { success: false, error: 'Failed to update form' };
  }
}

/**
 * Delete a form
 */
export async function deleteForm(id: string): Promise<ServiceResult<void>> {
  try {
    const { error } = await supabase
      .from('cognito_forms')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    invalidateCache();
    return { success: true };
  } catch (_error) {
    return { success: false, error: 'Failed to delete form' };
  }
}

/**
 * Reorder forms
 */
export async function reorderForms(orderedIds: string[]): Promise<ServiceResult<void>> {
  try {
    const updates = orderedIds.map((id, index) => ({
      id,
      sort_order: index + 1,
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('cognito_forms')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id);

      if (error) {
        return { success: false, error: error.message };
      }
    }

    invalidateCache();
    return { success: true };
  } catch (_error) {
    return { success: false, error: 'Failed to reorder forms' };
  }
}

/**
 * Toggle form active status
 */
export async function toggleFormActive(id: string, isActive: boolean): Promise<ServiceResult<CognitoFormRecord>> {
  return updateForm(id, { is_active: isActive });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert static config to record format for fallback
 */
function convertStaticToRecords(): CognitoFormRecord[] {
  return FORMS.map((form, index) => ({
    id: `static-${index}`,
    slug: form.slug,
    label: form.label,
    category: form.category,
    description: form.description,
    icon: form.icon,
    estimated_minutes: form.estimatedMinutes || 5,
    cognito_embed: form.cognitoEmbed || null,
    is_active: true,
    requires_auth: form.requiresAuth || false,
    sort_order: index + 1,
    show_in_menu: false,
    menu_section: 'member-forms',
    menu_order: index + 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
}

/**
 * Convert database record to FormEntry format (for backward compatibility)
 */
export function recordToFormEntry(record: CognitoFormRecord): FormEntry {
  return {
    slug: record.slug,
    label: record.label,
    category: record.category,
    description: record.description || '',
    icon: record.icon,
    estimatedMinutes: record.estimated_minutes,
    requiresAuth: record.requires_auth,
    cognitoEmbed: record.cognito_embed || undefined,
  };
}

/**
 * Check if database table exists and is accessible
 */
export async function isFormsTableAvailable(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('cognito_forms')
      .select('id')
      .limit(1);

    return !error;
  } catch (_error) {
    return false;
  }
}

// ============================================================================
// Available Icons for Forms
// ============================================================================

export const AVAILABLE_FORM_ICONS = [
  'FileText', 'Briefcase', 'Users', 'UserPlus', 'UserMinus', 'UserCheck',
  'Shield', 'XCircle', 'MessageSquare', 'Edit', 'Edit3', 'RefreshCw',
  'Pill', 'Calendar', 'CreditCard', 'Phone', 'Mail', 'Heart', 'Star',
  'CheckCircle', 'AlertCircle', 'Info', 'HelpCircle', 'Settings',
  'Home', 'Building', 'Clipboard', 'ClipboardList', 'ClipboardCheck',
  'Send', 'Download', 'Upload', 'Link', 'ExternalLink', 'Share2',
];

// Menu section options for the CMS
export const MENU_SECTIONS = [
  { value: 'member-forms', label: 'Member Forms' },
  { value: 'requests-scheduling', label: 'Requests & Scheduling' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'employer-forms', label: 'Employer Forms' },
];

// Export service object for easier imports
export const formsService = {
  getAllForms,
  getFormsByCategory,
  getActiveForms,
  getMenuForms,
  getFormsByMenuSection,
  getFormBySlug,
  getFormById,
  createForm,
  updateForm,
  deleteForm,
  reorderForms,
  toggleFormActive,
  recordToFormEntry,
  isFormsTableAvailable,
  invalidateCache,
};

export default formsService;

