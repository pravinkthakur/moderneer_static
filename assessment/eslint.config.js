export default {
  env: { browser: true, es2022: true },
  extends: ['eslint:recommended','plugin:import/recommended','eslint-config-prettier'],
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  rules: {
    'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
    'import/no-unresolved': 'off'
  }
};
