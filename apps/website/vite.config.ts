import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { copyFileSync, existsSync } from 'fs';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const hasSupabaseConfig = Boolean(
    env.VITE_SUPABASE_URL &&
    env.VITE_SUPABASE_ANON_KEY
  );

  if (!hasSupabaseConfig && mode !== 'test') {
    console.warn(
      '\n⚠️  Warning: Supabase environment variables not found in .env file',
      '\n   Required variables:',
      '\n   - VITE_SUPABASE_URL',
      '\n   - VITE_SUPABASE_ANON_KEY\n'
    );
  }

  return {
    plugins: [
      react(),
      {
        name: 'copy-htaccess',
        closeBundle() {
          try {
            if (existsSync('.htaccess')) {
              copyFileSync('.htaccess', 'dist/.htaccess');
              console.log('✓ Copied .htaccess to dist/');
            } else {
              console.log('ℹ️  No .htaccess file found, skipping copy');
            }
          } catch (err) {
            console.warn('⚠️  Failed to copy .htaccess:', err);
          }
        }
      }
    ],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      dedupe: ['react', 'react-dom'],
    },
    assetsInclude: ['**/*.csv'],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
    },
    build: {
      sourcemap: mode !== 'production',
      chunkSizeWarningLimit: 300,
      minify: mode === 'production' ? 'terser' : false,
      terserOptions: mode === 'production' ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info'],
        },
        mangle: true,
      } : undefined,
      assetsInlineLimit: 4096,
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.');
            const ext = info?.[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico|webp|avif/i.test(ext || '')) {
              return `assets/images/[name]-[hash][extname]`;
            }
            if (/woff2?|eot|ttf|otf/i.test(ext || '')) {
              return `assets/fonts/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          manualChunks: {
            'react-vendor': [
              'react',
              'react-dom',
              'react-router-dom',
              'react-helmet-async',
              'react-hook-form',
              '@hookform/resolvers',
            ],
            'animations': ['framer-motion'],
            'icons': ['lucide-react'],
            'supabase': ['@supabase/supabase-js'],
            'validation': ['zod'],
            'editor': [
              '@tiptap/react',
              '@tiptap/starter-kit',
              '@tiptap/extension-link',
              '@tiptap/extension-image',
              '@tiptap/extension-table',
              '@tiptap/extension-table-row',
              '@tiptap/extension-table-cell',
              '@tiptap/extension-table-header',
              '@tiptap/extension-code-block-lowlight',
              '@tiptap/extension-text-align',
              '@tiptap/extension-color',
              '@tiptap/extension-text-style',
              '@tiptap/extension-highlight',
              '@tiptap/extension-underline',
              '@tiptap/extension-task-list',
              '@tiptap/extension-task-item',
            ],
          },
        },
      },
    },
    preview: {
      port: 4173,
      strictPort: true,
    },
    server: {
      port: 3000,
      strictPort: false,
      open: false,
    },
  };
});
