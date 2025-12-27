import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import localRules from './eslint-local-rules.cjs';

export default [
  {
    files: ['src/**/*.ts'],
    ignores: [
      '**/*.spec.ts',
      '**/*.test.ts',
      '**/*.e2e-spec.ts',
      'src/test-utils/examples/**', // Example files are templates with intentional incomplete code
      'dist/**',
      'node_modules/**',
      '**/*.backup',
      '**/*.backup.*',
      '**/*.backup/**',
      '**/dtos.backup/**',
      '**/__tests__.backup/**',
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'local-rules': {
        rules: localRules,
      },
    },
    rules: {
      // Reglas personalizadas de arquitectura
      'local-rules/enforce-path-aliases': 'error',
      'local-rules/no-cross-boundary-imports': 'error',
      
      // Reglas de TypeScript
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];
