import { defineConfig } from 'eslint/config';
import { nodeJsConfig } from '@mono/eslint-config/node';

export default defineConfig([
  ...nodeJsConfig,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
]);
