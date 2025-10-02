export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation only changes
        'style', // Changes that don't affect the meaning of the code
        'refactor', // Code change that neither fixes a bug nor adds a feature
        'perf', // Performance improvements
        'test', // Adding missing tests or correcting existing tests
        'chore', // Changes to the build process or auxiliary tools
        'ci', // CI configuration changes
        'build', // Changes that affect the build system or external dependencies
        'revert', // Reverts a previous commit
      ],
    ],
    'subject-case': [2, 'never', ['upper-case']],
    'subject-empty': [2, 'never'],
    'type-empty': [2, 'never'],
  },
};
