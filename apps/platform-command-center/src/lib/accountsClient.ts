import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_ARYX_ACCOUNTS_URL?.trim() ?? '';
const anonKey = import.meta.env.VITE_ARYX_ACCOUNTS_ANON_KEY?.trim() ?? '';

export const isAccountsConfigured = Boolean(url && anonKey);

/**
 * Single Supabase client for ARYX Accounts only.
 * Do not add EnrollFlow or MPB MonoRepo clients to this app.
 */
export const accounts: SupabaseClient = createClient(
  url || 'https://nubejeaijuivdhggewkl.supabase.co',
  anonKey || 'missing-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'aryx-accounts-pcc-auth',
    },
  },
);

export const ACCOUNTS_PROJECT_REF = 'nubejeaijuivdhggewkl';
export const ACCOUNTS_URL = url || 'https://nubejeaijuivdhggewkl.supabase.co';
