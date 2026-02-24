// Re-export Supabase client and utilities from shared database package
// This ensures all apps use the same singleton client instance
export { supabase, supabaseUrl, isSupabaseConfigured } from '@mpbhealth/database';
