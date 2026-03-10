import { supabase } from './supabase';

export interface GeoStateSetting {
  state_code: string;
  state_name: string;
  is_supported: boolean;
  is_restricted: boolean;
  restriction_message?: string;
  not_supported_message?: string;
  notes?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface StateEligibility {
  state_code: string;
  state_name: string;
  is_eligible: boolean;
  is_restricted: boolean;
  message?: string;
}

// Cache for state settings to reduce DB calls
let stateSettingsCache: GeoStateSetting[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Track if table was found in last query
let lastTableExistsStatus: boolean | null = null;

export interface GeoStateSettingsResult {
  data: GeoStateSetting[];
  tableExists: boolean;
}

/**
 * Helper to check if an error indicates missing table
 */
function isTableNotFoundError(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  return (
    error.message?.includes('schema cache') ||
    error.code === 'PGRST204' ||
    error.code === 'PGRST205' ||
    error.message?.includes('does not exist') ||
    false
  );
}

/**
 * Get all state settings from database with explicit table existence status
 */
export async function getAllStateSettingsWithStatus(): Promise<GeoStateSettingsResult> {
  // Return cache if valid
  if (stateSettingsCache && Date.now() - cacheTimestamp < CACHE_TTL && lastTableExistsStatus !== null) {
    return { data: stateSettingsCache, tableExists: lastTableExistsStatus };
  }

  try {
    const { data, error } = await supabase
      .from('geo_state_settings')
      .select('*')
      .order('state_name', { ascending: true });

    // Handle missing table gracefully
    if (isTableNotFoundError(error)) {
      console.warn('geo_state_settings table not found - run migrations to enable geo settings');
      lastTableExistsStatus = false;
      return { data: [], tableExists: false };
    }

    if (error) throw error;

    stateSettingsCache = data as GeoStateSetting[];
    cacheTimestamp = Date.now();
    lastTableExistsStatus = true;

    return { data: stateSettingsCache, tableExists: true };
  } catch (error) {
    console.error('Error fetching state settings:', error);
    // On unknown error, assume table exists but query failed
    return { data: [], tableExists: lastTableExistsStatus ?? true };
  }
}

/**
 * Get all state settings from database (legacy - for backward compatibility)
 */
export async function getAllStateSettings(): Promise<GeoStateSetting[]> {
  const result = await getAllStateSettingsWithStatus();
  return result.data;
}

/**
 * Get settings for a specific state
 */
export async function getStateSetting(stateCode: string): Promise<GeoStateSetting | null> {
  const normalizedCode = stateCode.toUpperCase().trim();

  try {
    const { data, error } = await supabase
      .from('geo_state_settings')
      .select('*')
      .eq('state_code', normalizedCode)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // State not found
      }
      throw error;
    }

    return data as GeoStateSetting;
  } catch (error) {
    console.error('Error fetching state setting:', error);
    return null;
  }
}

/**
 * Check eligibility for a state
 */
export async function checkStateEligibilityFromDB(stateCode: string): Promise<StateEligibility> {
  const normalizedCode = stateCode.toUpperCase().trim();
  const setting = await getStateSetting(normalizedCode);

  if (!setting) {
    return {
      state_code: normalizedCode,
      state_name: normalizedCode,
      is_eligible: false,
      is_restricted: false,
      message: `State "${normalizedCode}" not found in our system. Please contact us at (855) 816-4650.`
    };
  }

  if (!setting.is_supported) {
    return {
      state_code: setting.state_code,
      state_name: setting.state_name,
      is_eligible: false,
      is_restricted: false,
      message: setting.not_supported_message || 
        `We're sorry, but MPB Health services are currently not available in ${setting.state_name}. Please contact us at (855) 816-4650 to discuss alternative options.`
    };
  }

  if (setting.is_restricted) {
    return {
      state_code: setting.state_code,
      state_name: setting.state_name,
      is_eligible: true,
      is_restricted: true,
      message: setting.restriction_message || 
        `Health sharing services in ${setting.state_name} have specific requirements. Please contact us at (855) 816-4650 for more information.`
    };
  }

  return {
    state_code: setting.state_code,
    state_name: setting.state_name,
    is_eligible: true,
    is_restricted: false
  };
}

/**
 * Get list of supported states
 */
export async function getSupportedStates(): Promise<GeoStateSetting[]> {
  try {
    const { data, error } = await supabase
      .from('geo_state_settings')
      .select('*')
      .eq('is_supported', true)
      .order('state_name', { ascending: true });

    if (error) throw error;
    return data as GeoStateSetting[];
  } catch (error) {
    console.error('Error fetching supported states:', error);
    return [];
  }
}

/**
 * Get list of restricted states
 */
export async function getRestrictedStates(): Promise<GeoStateSetting[]> {
  try {
    const { data, error } = await supabase
      .from('geo_state_settings')
      .select('*')
      .eq('is_restricted', true)
      .order('state_name', { ascending: true });

    if (error) throw error;
    return data as GeoStateSetting[];
  } catch (error) {
    console.error('Error fetching restricted states:', error);
    return [];
  }
}

/**
 * Update a state's settings (admin only)
 */
export async function updateStateSetting(
  stateCode: string,
  updates: Partial<Omit<GeoStateSetting, 'state_code' | 'state_name' | 'created_at' | 'updated_at'>>,
  updatedBy?: string
): Promise<GeoStateSetting | null> {
  try {
    const { data, error } = await supabase
      .from('geo_state_settings')
      .update({
        ...updates,
        updated_by: updatedBy,
        updated_at: new Date().toISOString()
      })
      .eq('state_code', stateCode.toUpperCase())
      .select()
      .single();

    // Handle missing table gracefully
    if (isTableNotFoundError(error)) {
      console.warn('geo_state_settings table not found - run migrations to enable geo settings');
      lastTableExistsStatus = false;
      return null;
    }

    if (error) throw error;

    // Invalidate cache
    stateSettingsCache = null;
    lastTableExistsStatus = true;

    return data as GeoStateSetting;
  } catch (error) {
    console.error('Error updating state setting:', error);
    return null;
  }
}

/**
 * Bulk update multiple states (admin only)
 */
export async function bulkUpdateStateSettings(
  updates: Array<{
    state_code: string;
    is_supported?: boolean;
    is_restricted?: boolean;
    restriction_message?: string;
    not_supported_message?: string;
    notes?: string;
  }>,
  updatedBy?: string
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const update of updates) {
    const result = await updateStateSetting(
      update.state_code,
      {
        is_supported: update.is_supported,
        is_restricted: update.is_restricted,
        restriction_message: update.restriction_message,
        not_supported_message: update.not_supported_message,
        notes: update.notes
      },
      updatedBy
    );

    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}

/**
 * Clear the settings cache (useful after bulk updates)
 */
export function clearStateSettingsCache(): void {
  stateSettingsCache = null;
  cacheTimestamp = 0;
}

/**
 * Get statistics about state coverage
 */
export async function getStateStats(): Promise<{
  total: number;
  supported: number;
  restricted: number;
  unsupported: number;
}> {
  const settings = await getAllStateSettings();

  return {
    total: settings.length,
    supported: settings.filter(s => s.is_supported && !s.is_restricted).length,
    restricted: settings.filter(s => s.is_supported && s.is_restricted).length,
    unsupported: settings.filter(s => !s.is_supported).length
  };
}

