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
      port: 5175,
      host: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      // esbuild minification is ~20x faster than terser and equally effective
      minify: isProd ? 'esbuild' : false,
      cssMinify: isProd,
      // Raise warning threshold — we're actively splitting chunks
      chunkSizeWarningLimit: 400,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // 1. Core React runtime + router (include transitive deps to avoid circular chunks)
            if (id.includes('node_modules/react/') ||
                id.includes('node_modules/react-dom/') ||
                id.includes('node_modules/scheduler/') ||
                id.includes('node_modules/react-router-dom/') ||
                id.includes('node_modules/react-router/') ||
                id.includes('node_modules/@remix-run/')) {
              return 'react-vendor';
            }
            // 2. Tiptap rich-text editor — large, rarely changes
            if (id.includes('node_modules/@tiptap') ||
                id.includes('node_modules/prosemirror') ||
                id.includes('node_modules/@prosemirror') ||
                id.includes('node_modules/lowlight') ||
                id.includes('node_modules/highlight.js')) {
              return 'tiptap';
            }
            // 3. lucide-react icons
            if (id.includes('node_modules/lucide-react')) {
              return 'lucide';
            }
            // 4. Supabase client
            if (id.includes('node_modules/@supabase')) {
              return 'supabase';
            }
            // 5. Internal monorepo UI package
            if (id.includes('packages/ui/src') || id.includes('@mpbhealth/ui')) {
              return 'mpb-ui';
            }
            // 6. Internal advisor-core service layer
            if (id.includes('packages/advisor-core') || id.includes('@mpbhealth/advisor-core')) {
              return 'advisor-core';
            }
            // 7. Date utilities
            if (id.includes('node_modules/date-fns')) {
              return 'date-utils';
            }
            // 8. Remaining node_modules → vendor catch-all
            if (id.includes('node_modules/')) {
              return 'vendor';
            }
          },
        },
      },
    },
  };
});
