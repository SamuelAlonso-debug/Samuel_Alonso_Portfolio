// @ts-check
import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      'dist/',
      '.astro/',
      '.wrangler/',
      'node_modules/',
      'playwright-report/',
      'test-results/',
      '.lighthouseci/',
    ],
  },
  js.configs.recommended,
  tseslint.configs.strict,
  astro.configs.recommended,
  // Accessibility rules for .astro templates (eslint-plugin-jsx-a11y-x).
  astro.configs['jsx-a11y-strict'],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        // Injected by `vite.define` in astro.config.mjs.
        __BUILD_SHA__: 'readonly',
        __BUILD_DATE__: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },
);
