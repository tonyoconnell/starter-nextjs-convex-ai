/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Test file patterns
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],

  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Mock Convex generated modules
    '^\\./_generated/server$': '<rootDir>/__tests__/__mocks__/_generated/server.js',
    '^\\./_generated/api$': '<rootDir>/__tests__/__mocks__/_generated/api.js',
    '^convex/values$': '<rootDir>/__tests__/__mocks__/convex/values.js',
  },

  // Transform configuration
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: false,
        tsconfig: {
          module: 'commonjs',
          target: 'es2020',
        },
      },
    ],
  },

  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(convex)/)',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/_generated/**',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/jest.config.js',
    '!**/*.test.ts',
    '!**/__mocks__/**',
  ],

  // Test timeout
  testTimeout: 10000,

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/_generated/', '/coverage/'],

  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],

  // Simple setup
  verbose: true,
};
