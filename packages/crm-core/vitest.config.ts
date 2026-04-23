import { defineConfig } from 'vitest/config';

// crm-core is a pure TypeScript service package — no CSS / JSX. We disable CSS
// handling so vitest does not attempt to resolve PostCSS/Tailwind plugins that
// only apply to Vite-built apps.
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
