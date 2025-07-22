module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ['eslint:recommended', '@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['react', '@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-empty-object-type': 'off',
    'no-undef': 'off', // TypeScript handles this, avoid conflicts with DOM types
  },
  globals: {
    HTMLButtonElement: 'readonly',
    HTMLDivElement: 'readonly',
    HTMLInputElement: 'readonly',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
