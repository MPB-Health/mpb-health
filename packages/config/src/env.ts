interface Env {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_GA_MEASUREMENT_ID?: string;
  VITE_FB_PIXEL_ID?: string;
  NODE_ENV: string;
}

export function getEnv<K extends keyof Env>(key: K): Env[K] | undefined {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] as Env[K];
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] as Env[K];
  }
  return undefined;
}

export const env = {
  supabaseUrl: getEnv('VITE_SUPABASE_URL') || '',
  supabaseAnonKey: getEnv('VITE_SUPABASE_ANON_KEY') || '',
  gaMeasurementId: getEnv('VITE_GA_MEASUREMENT_ID'),
  fbPixelId: getEnv('VITE_FB_PIXEL_ID'),
  nodeEnv: getEnv('NODE_ENV') || 'development',
};

export const isProduction = env.nodeEnv === 'production';
export const isDevelopment = env.nodeEnv === 'development';
