/**
 * Root ESLint config — prevents config lookup from escaping the monorepo
 * and loading the user's home eslint.config.mjs (which can cause resolution errors).
 * Uses FlatCompat to apply the shared eslint-config for the whole workspace.
 */
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

const sharedConfig = compat.extends('@mpbhealth/eslint-config');

export default [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**', '**/coverage/**', '**/public/sw.js'] },
  ...sharedConfig,
  // Node globals for config files (vite.config.js, etc.)
  {
    files: ['**/*.config.js', '**/*.config.mjs', '**/*.config.cjs'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
  },
];
