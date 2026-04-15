/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createClientLogger } from '@mpbhealth/utils';

const log = createClientLogger('Database');

// .trim() removes accidental trailing CRLF/LF from copy-pasted env vars (Vercel, etc.)
// Without trim, WebSocket URLs get %0D%0A and fail to connect
const rawUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const rawKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;
export const supabaseUrl = (rawUrl || '').trim();
const supabaseAnonKey = (rawKey || '').trim() || undefined;

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
    realtime: {
      heartbeatIntervalMs: 15_000,
      reconnectAfterMs: (tries: number) =>
        Math.min(1000 * 2 ** tries, 30_000),
      timeout: 20_000,
      params: { eventsPerSecond: 10 },
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

/**
 * Safely remove a realtime channel without triggering
 * "WebSocket is closed before the connection is established" errors.
 */
export function safeRemoveChannel(channel: import('@supabase/supabase-js').RealtimeChannel | null | undefined): void {
  if (!channel) return;
  try {
    supabase.removeChannel(channel);
  } catch {
    // Swallow errors from closing a channel that's still connecting
  }
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
