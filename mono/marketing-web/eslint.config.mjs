import { defineConfig } from 'eslint/config';
import { nextJsConfig } from '@mono/eslint-config/next';

export default defineConfig([
  ...nextJsConfig,
  {
    rules: {
      'no-constant-condition': 'warn',
      'no-dupe-keys': 'warn',
      'no-case-declarations': 'warn',
      'no-useless-escape': 'warn',
      'no-undef': 'warn',
      'no-constant-binary-expression': 'warn',
      'no-misleading-character-class': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
]);
