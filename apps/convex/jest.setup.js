// Mock Convex environment for testing
process.env.CONVEX_URL = 'https://test.convex.cloud'

// Global test utilities for Convex
global.testHelpers = {
  createMockContext: () => ({
    auth: {
      getUserIdentity: jest.fn(),
    },
    db: {
      query: jest.fn(),
      insert: jest.fn(),
      patch: jest.fn(),
      replace: jest.fn(),
      delete: jest.fn(),
    },
  }),
}