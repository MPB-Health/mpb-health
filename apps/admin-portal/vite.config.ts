import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = mode === 'production';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      dedupe: ['react', 'react-dom', 'react-router-dom'],
    },
    server: {
      port: 5176,
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
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            // UI libraries
            'ui-vendor': ['lucide-react'],
            // Charts
            'charts': ['recharts'],
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
