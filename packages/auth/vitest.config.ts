import { defineConfig } from 'vitest/config';

// Tests target pure-logic seams (password policy, role constants); no DOM and
// no live Supabase — the client falls back to its unconfigured placeholder.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: false,
    css: false,
  },
  css: {
    postcss: { plugins: [] },
  },
});
