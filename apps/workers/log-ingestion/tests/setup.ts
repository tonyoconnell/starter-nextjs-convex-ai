// Jest setup for Cloudflare Worker testing environment
// Sets up Worker globals, mocks, and test utilities

import { jest } from '@jest/globals';

// Mock Cloudflare Worker globals
global.Request = class MockRequest {
  url: string;
  method: string;
  headers: Map<string, string>;
  body: any;

  constructor(url: string, init?: RequestInit) {
    this.url = url;
    this.method = init?.method || 'GET';
    this.headers = new Map();
    this.body = init?.body;

    // Set headers from init
    if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((value, key) => {
          this.headers.set(key.toLowerCase(), value);
        });
      } else if (Array.isArray(init.headers)) {
        init.headers.forEach(([key, value]) => {
          this.headers.set(key.toLowerCase(), value);
        });
      } else {
        Object.entries(init.headers).forEach(([key, value]) => {
          this.headers.set(key.toLowerCase(), value);
        });
      }
    }
  }

  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }

  async text() {
    return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
  }
} as any;

global.Response = class MockResponse {
  status: number;
  statusText: string;
  headers: Map<string, string>;
  body: any;
  ok: boolean;

  constructor(body?: any, init?: ResponseInit) {
    this.body = body;
    this.status = init?.status || 200;
    this.statusText = init?.statusText || 'OK';
    this.ok = this.status >= 200 && this.status < 300;
    this.headers = new Map();

    if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((value, key) => {
          this.headers.set(key.toLowerCase(), value);
        });
      } else if (Array.isArray(init.headers)) {
        init.headers.forEach(([key, value]) => {
          this.headers.set(key.toLowerCase(), value);
        });
      } else {
        Object.entries(init.headers).forEach(([key, value]) => {
          this.headers.set(key.toLowerCase(), value);
        });
      }
    }
  }

  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }

  async text() {
    return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
  }

  static json(body: any, init?: ResponseInit) {
    return new MockResponse(JSON.stringify(body), {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...init?.headers,
      },
    });
  }
} as any;

global.Headers = class MockHeaders {
  private headers: Map<string, string>;

  constructor(init?: HeadersInit) {
    this.headers = new Map();
    
    if (init) {
      if (init instanceof Headers) {
        init.forEach((value, key) => {
          this.headers.set(key.toLowerCase(), value);
        });
      } else if (Array.isArray(init)) {
        init.forEach(([key, value]) => {
          this.headers.set(key.toLowerCase(), value);
        });
      } else {
        Object.entries(init).forEach(([key, value]) => {
          this.headers.set(key.toLowerCase(), value);
        });
      }
    }
  }

  get(name: string) {
    return this.headers.get(name.toLowerCase()) || null;
  }

  set(name: string, value: string) {
    this.headers.set(name.toLowerCase(), value);
  }

  has(name: string) {
    return this.headers.has(name.toLowerCase());
  }

  delete(name: string) {
    this.headers.delete(name.toLowerCase());
  }

  forEach(callback: (value: string, key: string) => void) {
    this.headers.forEach(callback);
  }
} as any;

// Mock URL constructor for Worker environment - enhanced version
global.URL = class MockURL {
  protocol: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  href: string;
  origin: string;

  constructor(url: string, base?: string) {
    // Handle relative URLs with base
    let fullUrl = url;
    if (base && !url.startsWith('http')) {
      const baseUrl = base.endsWith('/') ? base.slice(0, -1) : base;
      fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
    }
    
    // Simple but robust URL parsing
    this.href = fullUrl;
    
    // Extract protocol
    const protocolMatch = fullUrl.match(/^(https?:)/);
    this.protocol = protocolMatch ? protocolMatch[1] : 'http:';
    
    // Extract hostname and port
    const hostMatch = fullUrl.match(/https?:\/\/([^\/\?#]+)/);
    if (hostMatch) {
      const hostPart = hostMatch[1];
      const portMatch = hostPart.match(/^([^:]+):(\d+)$/);
      if (portMatch) {
        this.hostname = portMatch[1];
        this.port = portMatch[2];
      } else {
        this.hostname = hostPart;
        this.port = this.protocol === 'https:' ? '443' : '80';
      }
    } else {
      this.hostname = 'localhost';
      this.port = '3000';
    }
    
    this.origin = `${this.protocol}//${this.hostname}${this.port !== '80' && this.port !== '443' ? ':' + this.port : ''}`;
    
    // Extract pathname
    const pathMatch = fullUrl.match(/https?:\/\/[^\/]+(\/?[^?#]*)/);
    this.pathname = pathMatch ? pathMatch[1] || '/' : '/';
    
    // Extract search
    const searchMatch = fullUrl.match(/\?([^#]*)/);
    this.search = searchMatch ? `?${searchMatch[1]}` : '';
    
    // Extract hash
    const hashMatch = fullUrl.match(/#(.*)$/);
    this.hash = hashMatch ? `#${hashMatch[1]}` : '';
  }
} as any;

// Mock fetch with comprehensive Redis simulation
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Mock ExecutionContext
global.ExecutionContext = class MockExecutionContext {
  waitUntil(promise: Promise<any>) {
    return promise;
  }
  
  passThroughOnException() {
    // No-op for testing
  }
} as any;

// Mock DurableObjectState for rate limiter testing
export class MockDurableObjectState {
  private storageMap: Map<string, any> = new Map();
  public storage: any;
  
  constructor() {
    this.storage = {
      get: jest.fn().mockImplementation((key: string) => {
        return Promise.resolve(this.storageMap.get(key));
      }),
      put: jest.fn().mockImplementation((key: string, value: any) => {
        this.storageMap.set(key, value);
        return Promise.resolve();
      }),
      delete: jest.fn().mockImplementation((key: string) => {
        this.storageMap.delete(key);
        return Promise.resolve();
      }),
      list: jest.fn().mockImplementation(() => {
        return Promise.resolve(this.storageMap);
      }),
    };
  }

  // Reset storage between tests
  reset() {
    this.storageMap.clear();
  }
}

global.DurableObjectState = MockDurableObjectState as any;

// Mock DurableObjectStub for main worker testing
export class MockDurableObjectStub {
  private responses: Map<string, any> = new Map();
  
  constructor() {
    // Set default responses
    this.setResponse('/status', { 
      config: {
        global_limit: 1000,
        system_quotas: { browser: 400, convex: 300, worker: 300 },
        per_trace_limit: 100,
        window_ms: 3600000
      },
      current_state: {
        global_current: 0,
        system_current: { browser: 0, convex: 0, worker: 0 },
        trace_counts: {},
        window_start: Date.now()
      },
      window_remaining_ms: 3600000
    });
    
    this.setResponse('/check', {
      allowed: true,
      remaining_quota: 100
    });
  }
  
  async fetch(url: string, init?: RequestInit): Promise<Response> {
    const urlObj = new URL(url);
    const key = urlObj.pathname;
    
    if (this.responses.has(key)) {
      const responseData = this.responses.get(key);
      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'content-type': 'application/json' }
    });
  }
  
  setResponse(path: string, data: any) {
    this.responses.set(path, data);
  }
  
  // Simulate rate limit exceeded
  simulateRateLimit(system: string) {
    this.setResponse('/check', {
      allowed: false,
      reason: `${system} system rate limit exceeded`,
      remaining_quota: 0
    });
  }
  
  reset() {
    this.responses.clear();
  }
}

global.DurableObjectStub = MockDurableObjectStub as any;

// Mock Environment for testing
export interface MockEnvironment {
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  RATE_LIMIT_STATE: {
    idFromName: (name: string) => any;
    get: (id: any) => MockDurableObjectStub;
  };
}

export function createMockEnvironment(): MockEnvironment {
  const mockDurableObjectStub = new MockDurableObjectStub();
  
  return {
    UPSTASH_REDIS_REST_URL: 'https://mock-redis.upstash.io',
    UPSTASH_REDIS_REST_TOKEN: 'mock-token-123',
    RATE_LIMIT_STATE: {
      idFromName: jest.fn().mockReturnValue('mock-id'),
      get: jest.fn().mockReturnValue(mockDurableObjectStub),
    },
  };
}

// Redis mock responses for different scenarios
export const RedisMockResponses = {
  // Successful operations
  PING: { result: 'PONG' },
  LPUSH: { result: 1 },
  EXPIRE: { result: 1 },
  LRANGE: { result: ['{"id":"test-1","message":"test"}'] },
  LLEN: { result: 1 },
  KEYS: { result: ['logs:trace-123', 'logs:trace-456'] },
  
  // Pipeline responses
  PIPELINE_SUCCESS: [
    { result: 1 }, // LPUSH
    { result: 1 }  // EXPIRE
  ],
  
  // Error responses
  ERROR: { error: 'ERR mock redis error' },
  NETWORK_ERROR: 'NETWORK_ERROR', // Special marker for network errors
  
  // Health check responses
  HEALTHY: { result: 'PONG' },
  UNHEALTHY: { error: 'Connection refused' },
};

// Setup Redis mock responses helper
export function setupRedisMock(scenarios: Record<string, any>) {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  
  mockFetch.mockImplementation(async (url: string, init?: RequestInit) => {
    const urlString = url.toString();
    
    // Parse Redis command from request body
    let command = '';
    if (init?.body) {
      try {
        const body = JSON.parse(init.body as string);
        command = Array.isArray(body) ? body[0] : '';
      } catch {
        command = '';
      }
    }
    
    // Check for pipeline requests
    if (urlString.includes('/pipeline')) {
      return new Response(JSON.stringify(scenarios.PIPELINE || RedisMockResponses.PIPELINE_SUCCESS), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }
    
    // Handle specific Redis commands
    const responseData = scenarios[command] || RedisMockResponses[command];
    
    if (responseData === 'NETWORK_ERROR') {
      throw new Error('Network error');
    }
    
    if (responseData?.error) {
      return new Response(JSON.stringify(responseData), {
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify(responseData || { result: null }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  });
}

// Test utilities
export const TestUtils = {
  // Create mock log request
  mockLogRequest: (overrides = {}) => ({
    trace_id: 'test-trace-123',
    message: 'Test log message',
    level: 'info' as const,
    system: 'browser' as const,
    timestamp: Date.now(),
    ...overrides,
  }),
  
  // Create mock headers
  mockHeaders: (overrides = {}) => new Headers({
    'content-type': 'application/json',
    'origin': 'https://localhost:3000',
    'user-agent': 'Mozilla/5.0 (Test Browser)',
    ...overrides,
  }),
  
  // Wait for async operations
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Assert response structure
  assertSuccessResponse: (response: any) => {
    expect(response).toHaveProperty('success', true);
    expect(response).toHaveProperty('trace_id');
    expect(typeof response.trace_id).toBe('string');
  },
  
  assertErrorResponse: (response: any, expectedError?: string) => {
    expect(response).toHaveProperty('success', false);
    expect(response).toHaveProperty('error');
    if (expectedError) {
      expect(response.error).toContain(expectedError);
    }
  },
};

// Global test cleanup
beforeEach(() => {
  jest.clearAllMocks();
  // Reset mock environment state
  (global.fetch as jest.MockedFunction<typeof fetch>).mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

console.log('Worker testing environment setup complete');