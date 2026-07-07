import { defineConfig } from 'vitest/config';

// utils is mostly pure TypeScript, but sanitizer (DOMPurify) and safeStorage
// (window.localStorage) need a DOM, so tests run under jsdom.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    globals: false,
    css: false,
  },
  css: {
    postcss: { plugins: [] },
  },
});
