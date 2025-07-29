// Root-level Jest configuration for Convex tests
// Tests are located in tests/convex/ to avoid conflicts with Convex dev server
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  
  // Test discovery - only look in tests/convex directory
  testMatch: [
    '<rootDir>/tests/convex/**/*.test.ts',
    '<rootDir>/tests/convex/**/*.test.js'
  ],
  
  // Set roots to include test directory
  roots: ['<rootDir>/tests/convex'],
  
  // Coverage collection from source files in apps/convex
  collectCoverageFrom: [
    'apps/convex/**/*.ts',
    '!apps/convex/**/*.d.ts',
    '!apps/convex/_generated/**',
    '!apps/convex/node_modules/**',
    '!apps/convex/coverage/**',
    '!apps/convex/jest.config.js',
  ],
  
  // Coverage output to project root (avoids Convex conflicts)
  coverageDirectory: 'test-coverage/convex',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/_generated/',
    '/coverage/',
    '/test-coverage/',
  ],
  
  // File extensions
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // TypeScript transformation for ESM
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          verbatimModuleSyntax: false,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
  
  // Setup file for global test configuration
  setupFilesAfterEnv: ['<rootDir>/tests/convex/setup.ts'],
  
  // Prevent watch mode from automatically starting
  watchman: false,
};