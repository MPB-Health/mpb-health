/// <reference types="vite/client" />

// Type declarations for Node.js process
declare const process: { env: Record<string, string | undefined> } | undefined;

interface Env {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_GA_MEASUREMENT_ID?: string;
  VITE_FB_PIXEL_ID?: string;
  NODE_ENV: string;
}

export function getEnv<K extends keyof Env>(key: K): Env[K] | undefined {
  // Try Vite's import.meta.env first (browser/Vite)
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env[key] as Env[K];
  }

  // Fall back to process.env (Node.js)
  if (typeof process !== 'undefined' && process?.env) {
    return process.env[key] as Env[K];
  }

  return undefined;
}

export const env = {
  supabaseUrl: (getEnv('VITE_SUPABASE_URL') || '').trim(),
  supabaseAnonKey: (getEnv('VITE_SUPABASE_ANON_KEY') || '').trim(),
  gaMeasurementId: getEnv('VITE_GA_MEASUREMENT_ID'),
  fbPixelId: getEnv('VITE_FB_PIXEL_ID'),
  nodeEnv: getEnv('NODE_ENV') || 'development',
};

export const isProduction = env.nodeEnv === 'production';
export const isDevelopment = env.nodeEnv === 'development';
