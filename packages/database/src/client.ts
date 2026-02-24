/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createClientLogger } from '@mpbhealth/utils';

const log = createClientLogger('Database');

export const supabaseUrl = ((import.meta as any).env?.VITE_SUPABASE_URL as string | undefined) || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;

const hasValidConfig = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabaseAnonKey !== 'placeholder-key' &&
  supabaseUrl.includes('.supabase.co')
);

if (!hasValidConfig) {
  const isDevelopment = (import.meta as any).env?.DEV;
  const isProduction = (import.meta as any).env?.PROD;

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
  log.info('[Supabase] Configuration valid:', {
    url: supabaseUrl,
    hasAnonKey: Boolean(supabaseAnonKey)
  });
}

// No-op lock function to bypass Web Locks API issues
// The Web Locks API can cause deadlocks on some devices (especially Chrome Android)
// when locks are not properly released, causing "signal is aborted without reason" errors.
// This workaround skips the locking mechanism entirely.
// See: https://github.com/supabase/supabase-js/issues/1594
const noOpLock = async <R>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<R>
): Promise<R> => {
  return await fn();
};

// When Supabase is not configured, intercept all fetch calls to prevent
// ERR_NAME_NOT_RESOLVED errors from hitting placeholder.supabase.co
const noOpFetch = async (_url: RequestInfo | URL, _options?: RequestInit): Promise<Response> => {
  return new Response(JSON.stringify({
    message: 'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    msg: 'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    error: 'service_unavailable',
    error_description: 'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: hasValidConfig,
      autoRefreshToken: hasValidConfig,
      detectSessionInUrl: hasValidConfig,
      storageKey: 'mpb-auth-token',
      lock: noOpLock,
    },
    global: {
      headers: {
        'X-Client-Info': 'mpb-health-web'
      },
      ...(hasValidConfig ? {} : { fetch: noOpFetch }),
    }
  }
);

export const isSupabaseConfigured = hasValidConfig;

export function getSupabase(): SupabaseClient {
  return supabase;
}

// Health check functionality
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
