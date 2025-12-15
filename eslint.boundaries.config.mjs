import boundaries from 'eslint-plugin-boundaries';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    files: ['src/**/*.ts'],
    ignores: ['**/*.spec.ts', '**/*.test.ts', '**/*.e2e-spec.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      boundaries,
    },
    settings: {
      'boundaries/elements': [
        {
          type: 'shared-kernel',
          pattern: 'src/shared/kernel/**/*',
          mode: 'folder',
        },
        {
          type: 'shared-vo',
          pattern: 'src/shared/vo/**/*',
          mode: 'folder',
        },
        {
          type: 'shared-infra',
          pattern: 'src/shared/infra/**/*',
          mode: 'folder',
        },
        {
          type: 'bc-module',
          pattern: 'src/*/*.module.ts',
          mode: 'file',
          capture: ['bc'],
        },
        {
          type: 'bc-domain-interfaces',
          pattern: 'src/*/domain/interfaces/**/*',
          mode: 'folder',
          capture: ['bc'],
        },
        {
          type: 'bc-domain-events',
          pattern: 'src/*/domain/events/**/*',
          mode: 'folder',
          capture: ['bc'],
        },
        {
          type: 'bc-domain',
          pattern: 'src/*/domain/**/*',
          mode: 'folder',
          capture: ['bc'],
        },
        {
          type: 'bc-app',
          pattern: 'src/*/app/**/*',
          mode: 'folder',
          capture: ['bc'],
        },
        {
          type: 'bc-infra',
          pattern: 'src/*/infra/**/*',
          mode: 'folder',
          capture: ['bc'],
        },
        {
          type: 'bc-presentation',
          pattern: 'src/*/presentation/**/*',
          mode: 'folder',
          capture: ['bc'],
        },
      ],
    },
    rules: {
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            {
              from: ['shared-kernel'],
              allow: [],
            },
            {
              from: ['shared-vo'],
              allow: ['shared-kernel'],
            },
            {
              from: ['shared-infra'],
              allow: ['shared-kernel', 'shared-vo'],
            },
            {
              from: ['bc-module'],
              allow: [
                'shared-kernel',
                'shared-vo',
                'bc-module',
                ['bc-domain', { bc: '${from.bc}' }],
                ['bc-app', { bc: '${from.bc}' }],
                ['bc-infra', { bc: '${from.bc}' }],
                ['bc-presentation', { bc: '${from.bc}' }],
              ],
              message: 'Modules can import other modules and their own BC layers',
            },
            {
              from: ['bc-domain'],
              allow: [
                'shared-kernel',
                'shared-vo',
                ['bc-domain', { bc: '${from.bc}' }],
              ],
              message: 'Domain can only depend on shared kernel/vo and its own domain',
            },
            {
              from: ['bc-app'],
              allow: [
                'shared-kernel',
                'shared-vo',
                'bc-domain-interfaces',
                'bc-domain-events',
                ['bc-domain', { bc: '${from.bc}' }],
                ['bc-app', { bc: '${from.bc}' }],
              ],
              message: 'Application can use domain interfaces/events from any BC (Dependency Inversion)',
            },
            {
              from: ['bc-infra'],
              allow: [
                'shared-kernel',
                'shared-vo',
                'shared-infra',
                ['bc-domain', { bc: '${from.bc}' }],
                ['bc-app', { bc: '${from.bc}' }],
                ['bc-infra', { bc: '${from.bc}' }],
              ],
              message: 'Infrastructure can only depend on its own BC layers',
            },
            {
              from: ['bc-presentation'],
              allow: [
                'shared-kernel',
                'shared-vo',
                ['bc-domain', { bc: '${from.bc}' }],
                ['bc-app', { bc: '${from.bc}' }],
                ['bc-presentation', { bc: '${from.bc}' }],
              ],
              message: 'Presentation can only depend on its own BC layers',
            },
          ],
        },
      ],
      'boundaries/external': [
        'error',
        {
          default: 'allow',
          rules: [
            {
              from: ['bc-domain'],
              disallow: ['@nestjs/common', '@nestjs/typeorm', 'typeorm', 'axios'],
              message: 'Domain layer cannot depend on infrastructure frameworks',
            },
          ],
        },
      ],
    },
  },
];
