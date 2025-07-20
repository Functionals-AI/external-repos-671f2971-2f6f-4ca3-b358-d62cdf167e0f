import { defineConfig } from 'eslint/config';
import { nextJsConfig } from '@mono/eslint-config/next';

export default defineConfig([
  ...nextJsConfig,
  {
    rules: {
      'eqeqeq': 'warn',
      'no-empty': 'warn',
      'no-empty-pattern': 'warn',
      'prefer-rest-params': 'warn',
      'no-extra-boolean-cast': 'warn',
      'no-case-declarations': 'warn',
      'no-useless-escape': 'warn',
      'prefer-const': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', {
        'argsIgnorePattern': '^_'
      }],
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/no-namespace': 'warn',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'warn',
      'react-hooks/rules-of-hooks': 'warn',
    },
  },
]);
