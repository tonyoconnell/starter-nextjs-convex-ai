/**
 * Mock for Convex generated server module
 */

// Jest is already available globally, no need to re-declare

// Mock database context with comprehensive CRUD operations
const createMockDb = () => {
  const mockData = new Map();
  let idCounter = 0;

  return {
    query: jest.fn((tableName) => ({
      withIndex: jest.fn((_indexName, _callback) => ({
        first: jest.fn(async () => mockData.get(`${tableName}_first`) || null),
        collect: jest.fn(async () => mockData.get(`${tableName}_collect`) || []),
        order: jest.fn(() => ({
          take: jest.fn(async (limit) => 
            (mockData.get(`${tableName}_collect`) || []).slice(0, limit)
          ),
        })),
        take: jest.fn(async (limit) => 
          (mockData.get(`${tableName}_collect`) || []).slice(0, limit)
        ),
      })),
      order: jest.fn(() => ({
        take: jest.fn(async (limit) => 
          (mockData.get(`${tableName}_collect`) || []).slice(0, limit)
        ),
      })),
    })),
    insert: jest.fn(async (tableName, data) => {
      const id = `${tableName}_${++idCounter}`;
      const record = { _id: id, ...data, _creationTime: Date.now() };
      
      // Store in collections
      const existing = mockData.get(`${tableName}_collect`) || [];
      existing.push(record);
      mockData.set(`${tableName}_collect`, existing);
      
      // Store as first result for single queries
      mockData.set(`${tableName}_first`, record);
      
      return id;
    }),
    patch: jest.fn(async (id, updates) => {
      // Update mock data
      const tableName = id.split('_')[0];
      const collection = mockData.get(`${tableName}_collect`) || [];
      const index = collection.findIndex(item => item._id === id);
      if (index >= 0) {
        collection[index] = { ...collection[index], ...updates };
        mockData.set(`${tableName}_collect`, collection);
      }
    }),
    delete: jest.fn(async (id) => {
      const tableName = id.split('_')[0];
      const collection = mockData.get(`${tableName}_collect`) || [];
      const filtered = collection.filter(item => item._id !== id);
      mockData.set(`${tableName}_collect`, filtered);
    }),
    
    // Helper methods for tests
    _setMockData: (tableName, data) => mockData.set(tableName, data),
    _getMockData: (tableName) => mockData.get(tableName),
    _clearMockData: () => mockData.clear(),
  };
};

// Mock context with comprehensive functionality
const createMockCtx = () => ({
  db: createMockDb(),
  runQuery: jest.fn(),
  runMutation: jest.fn(),
  runAction: jest.fn(),
});

// Export mock functions
module.exports = {
  query: jest.fn((config) => config.handler),
  mutation: jest.fn((config) => config.handler),
  internalMutation: jest.fn((config) => config.handler),
  action: jest.fn((config) => config.handler),
  httpAction: jest.fn((config) => config.handler),
  
  // Helper to create mock context for tests
  createMockCtx,
};