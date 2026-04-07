import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = mode === 'production';

  // ── SECURITY GUARD ────────────────────────────────────────────────────────
  // Vite bundles ALL VITE_* env vars into the browser JS bundle.
  const FORBIDDEN_VITE_VARS = [
    'VITE_SUPABASE_SERVICE_ROLE_KEY',
    'VITE_MAILCHIMP_API_KEY',
    'VITE_RESEND_API_KEY',
    'VITE_GOOGLE_CLIENT_SECRET',
  ];
  const illegalVars = FORBIDDEN_VITE_VARS.filter((v) => env[v]);
  if (illegalVars.length > 0) {
    const msg =
      `\n🚨 SECURITY ERROR: The following secrets MUST NOT have the VITE_ prefix` +
      ` — they would be bundled into the browser JS bundle:\n` +
      illegalVars.map((v) => `  - ${v}`).join('\n') +
      `\nRemove from Vercel env vars and move to Supabase Edge Function secrets.\n`;
    if (isProd) throw new Error(msg);
    else console.error(msg);
  }
  // ─────────────────────────────────────────────────────────────────────────

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      dedupe: ['react', 'react-dom', 'react-router-dom'],
    },
    server: {
      port: 5174,
      host: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: !isProd,
      minify: isProd ? 'terser' : false,
      terserOptions: isProd ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
        },
        mangle: true,
      } : undefined,
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks: {
            // Core React
            'vendor': ['react', 'react-dom', 'react-router-dom'],
            // Supabase client
            'supabase': ['@supabase/supabase-js'],
            // Charts library
            'charts': ['recharts'],
            // Drag and drop
            'dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
            // UI libraries
            'ui-vendor': ['lucide-react'],
            // Toast notifications
            'toast': ['react-hot-toast'],
            // Date utilities
            'date-utils': ['date-fns'],
          },
        },
      },
    },
  };
});
