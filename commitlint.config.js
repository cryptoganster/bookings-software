module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'refactor', // Code refactoring
        'test',     // Tests
        'docs',     // Documentation
        'style',    // Code style (formatting)
        'perf',     // Performance improvement
        'chore',    // Maintenance
        'ci',       // CI/CD changes
        'revert',   // Revert previous commit
      ],
    ],
    'scope-case': [2, 'always', 'kebab-case'],
    'subject-case': [2, 'never', ['upper-case']],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
  },
};
