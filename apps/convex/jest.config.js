module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>', '<rootDir>/../../tests/convex'],
  testMatch: [
    '../../tests/convex/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/_generated/**',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/jest.config.js',
  ],
  // Move coverage outside convex functions directory to avoid conflicts
  coverageDirectory: '../../test-coverage/convex',
  coverageReporters: ['text', 'lcov', 'html'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/_generated/',
    '/coverage/',
    '/test-coverage/',
  ],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  // Setup file for test configuration
  setupFilesAfterEnv: ['<rootDir>/../../tests/convex/setup.ts'],
  
  // Prevent watch mode from automatically starting
  watchman: false,
};