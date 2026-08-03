import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = mode === 'production';

  const FORBIDDEN_VITE_VARS = [
    'VITE_SUPABASE_SERVICE_ROLE_KEY',
    'VITE_ARYX_ACCOUNTS_SERVICE_ROLE_KEY',
  ];
  const illegalVars = FORBIDDEN_VITE_VARS.filter((v) => env[v]);
  if (illegalVars.length > 0) {
    const msg =
      `\nSECURITY ERROR: The following secrets MUST NOT have the VITE_ prefix` +
      ` — they would be bundled into the browser:\n` +
      illegalVars.map((v) => `  - ${v}`).join('\n');
    if (isProd) throw new Error(msg);
    else console.error(msg);
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      dedupe: ['react', 'react-dom', 'react-router-dom'],
    },
    server: {
      port: 5180,
      host: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: !isProd,
    },
  };
});
