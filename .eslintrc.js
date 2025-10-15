/**
 * ESLint Configuration for Playwright Tests
 * Provides linting rules specifically for test files
 */
module.exports = {
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:playwright/playwright-test'
  ],
  plugins: [
    'playwright'
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  rules: {
    // General rules
    'no-console': 'off', // Allow console.log in tests
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    
    // Playwright-specific rules
    'playwright/expect-expect': 'error',
    'playwright/max-nested-describe': ['warn', { max: 3 }],
    'playwright/no-conditional-in-test': 'warn',
    'playwright/no-duplicate-hooks': 'error',
    'playwright/no-eval': 'error',
    'playwright/no-focused-test': 'error',
    'playwright/no-force-option': 'warn',
    'playwright/no-nested-step': 'error',
    'playwright/no-networkidle': 'warn',
    'playwright/no-page-pause': 'error',
    'playwright/no-restricted-matchers': 'off',
    'playwright/no-skipped-test': 'warn',
    'playwright/no-useless-await': 'error',
    'playwright/no-wait-for-timeout': 'warn',
    'playwright/prefer-web-first-assertions': 'error',
    'playwright/valid-expect': 'error',
    'playwright/valid-title': 'error',
    
    // Code style
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'never']
  },
  overrides: [
    {
      // Specific rules for test files
      files: ['tests/**/*.js', '*.spec.js', '*.test.js'],
      rules: {
        'no-console': 'off',
        'max-len': 'off'
      }
    },
    {
      // Specific rules for page object models
      files: ['tests/page-objects/**/*.js'],
      rules: {
        'class-methods-use-this': 'off'
      }
    },
    {
      // Specific rules for configuration files
      files: ['playwright.config.js', 'eslint.config.js'],
      env: {
        node: true
      },
      rules: {
        'no-console': 'off'
      }
    }
  ],
  ignorePatterns: [
    'node_modules/',
    'test-results/',
    'playwright-report/',
    'coverage/',
    '*.min.js',
    'dist/',
    'build/'
  ]
};