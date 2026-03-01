module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
    browser: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  extends: ['eslint:recommended'],
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true }],
    'no-undef': 'error',
    'no-unreachable': 'error',
    'no-empty': ['warn', { allowEmptyCatch: true }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    eqeqeq: ['error', 'always'],
    curly: ['error', 'all'],
    'no-var': 'error',
    'prefer-const': 'error',
    'object-shorthand': ['error', 'always'],
  },
  overrides: [
    {
      files: ['*.cjs', '*.config.js'],
      parserOptions: {
        sourceType: 'script',
      },
    },
  ],
};
