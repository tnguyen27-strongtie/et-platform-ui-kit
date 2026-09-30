import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'dist-showcase', 'node_modules', 'test-results', 'playwright-report'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    // Components use design tokens, never raw hex (CONTRIBUTING.md, "Changing tokens"). Pure white/black are allowed.
    files: ['src/components/**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^#(?!(fff|ffffff|000|000000)$)[0-9a-fA-F]{3,8}$/i]',
          message: 'Use a token from tokens.ts instead of a hex color.',
        },
      ],
    },
  },
  {
    files: ['scripts/**', 'tests/**', '*.config.ts', '*.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    // Skill scripts run in Node; preview.mjs also passes callbacks that run in the page (Playwright evaluate).
    files: ['.claude/skills/*/scripts/**'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
);
