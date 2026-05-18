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
      // Resolve `@mpbhealth/ui` from source so Vite shares one React instance with the app.
      // The published `dist` entry is prebundled tsup output; when Vite serves it via `/@fs/…`,
      // dependency optimization can pull in a second React (invalid hook call in ThemeProvider).
      alias: [
        {
          find: /^@mpbhealth\/ui$/,
          replacement: path.resolve(__dirname, '../../packages/ui/src/index.ts'),
        },
        { find: '@', replacement: path.resolve(__dirname, './src') },
      ],
      dedupe: ['react', 'react-dom', 'react-router-dom'],
    },
    server: {
      port: 5175,
      host: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: isProd ? 'esbuild' : false,
      cssMinify: isProd,
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react-dom') || id.includes('react-router-dom') || id.includes('/react/')) {
                return 'vendor-react';
              }
              if (id.includes('@supabase') || id.includes('gotrue-js')) {
                return 'vendor-supabase';
              }
              if (id.includes('lucide-react') || id.includes('date-fns')) {
                return 'vendor-ui';
              }
              if (id.includes('@tanstack/react-query')) {
                return 'vendor-query';
              }
            }
          },
        },
      },
    },
  };
});
