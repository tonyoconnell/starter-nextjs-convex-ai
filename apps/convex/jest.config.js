/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Modern ts-jest transform configuration
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        target: 'es2020',
        strict: false,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        skipLibCheck: true,
        allowJs: true,
      },
      // Disable Babel processing
      babelConfig: false,
      isolatedModules: false,
    }],
  },
  
  // Module name mapping for mocks
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^\\./_generated/server$': '<rootDir>/__tests__/__mocks__/_generated/server.js',
    '^\\./_generated/api$': '<rootDir>/__tests__/__mocks__/_generated/api.js',
    '^convex/values$': '<rootDir>/__tests__/__mocks__/convex/values.js',
  },

  // Test patterns
  testMatch: ['**/__tests__/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/_generated/', '/coverage/', '/__tests_disabled/'],

  // Coverage settings
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/_generated/**',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/jest.config.js',
    '!**/*.test.ts',
    '!**/__mocks__/**',
    '!**/__tests_disabled/**',
  ],

  // Setup and timeouts
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  testTimeout: 30000,
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Disable Babel entirely
  transformIgnorePatterns: [
    'node_modules/(?!(convex)/)',
  ],
  
  // Verbose output
  verbose: true,
  
  // Clear mocks automatically
  clearMocks: true,
  restoreMocks: true,
};