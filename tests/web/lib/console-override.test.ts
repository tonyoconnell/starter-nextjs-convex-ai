// @ts-nocheck
/**
 * Comprehensive tests for console-override system
 * Tests: suppression patterns, rate limiting, user tracking, message redaction, system detection
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock console methods before importing module
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
};

// Mock window.location and navigator
Object.defineProperty(global, 'window', {
  value: {
    location: {
      href: 'http://localhost:3000/test',
      origin: 'http://localhost:3000',
    },
    CLAUDE_LOGGING_ENABLED: 'true',
  },
  writable: true,
});

Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Test Browser)',
  },
  writable: true,
});

// Import the module after mocking
import { initializeConsoleOverride, ConsoleLogger } from '@/lib/console-override';

describe('Console Override System', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv };
    
    // Reset console
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;
    
    // Reset module state
    ConsoleLogger.reset();
    
    // Clear mocks
    jest.clearAllMocks();
    mockFetch.mockClear();
    
    // Set default worker URL
    process.env.NEXT_PUBLIC_LOG_WORKER_URL = 'https://test-worker.dev';
    
    // Mock successful fetch response
    mockFetch.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ success: true }),
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    ConsoleLogger.reset();
  });

  describe('Initialization', () => {
    it('should not initialize without window object', () => {
      const originalWindow = global.window;
      delete global.window;

      initializeConsoleOverride();
      
      expect(ConsoleLogger.getStatus().initialized).toBe(false);
      
      global.window = originalWindow;
    });

    it('should not initialize when logging is disabled', () => {
      global.window.CLAUDE_LOGGING_ENABLED = 'false';

      initializeConsoleOverride();
      
      expect(ConsoleLogger.getStatus().initialized).toBe(false);
    });

    it('should initialize when logging is enabled', () => {
      global.window.CLAUDE_LOGGING_ENABLED = 'true';

      initializeConsoleOverride();
      
      expect(ConsoleLogger.getStatus().initialized).toBe(true);
    });

    it('should prevent double initialization', () => {
      global.window.CLAUDE_LOGGING_ENABLED = 'true';
      
      initializeConsoleOverride();
      const firstStatus = ConsoleLogger.getStatus();
      
      initializeConsoleOverride();
      const secondStatus = ConsoleLogger.getStatus();
      
      expect(firstStatus.traceId).toBe(secondStatus.traceId);
    });

    it('should make ConsoleLogger globally available', () => {
      global.window.CLAUDE_LOGGING_ENABLED = 'true';
      
      initializeConsoleOverride();
      
      expect(global.window.ConsoleLogger).toBeDefined();
      expect(global.window.ConsoleLogger).toBe(ConsoleLogger);
    });
  });

  describe('Trace and User Management', () => {
    beforeEach(() => {
      global.window.CLAUDE_LOGGING_ENABLED = 'true';
      initializeConsoleOverride();
    });

    it('should generate initial trace ID', () => {
      const traceId = ConsoleLogger.getTraceId();
      
      expect(traceId).toMatch(/^trace_\d+_[a-z0-9]+$/);
    });

    it('should set custom trace ID', () => {
      const customTraceId = 'custom-trace-123';
      
      ConsoleLogger.setTraceId(customTraceId);
      
      expect(ConsoleLogger.getTraceId()).toBe(customTraceId);
    });

    it('should generate new trace ID', () => {
      const originalTraceId = ConsoleLogger.getTraceId();
      
      const newTraceId = ConsoleLogger.newTrace();
      
      expect(newTraceId).not.toBe(originalTraceId);
      expect(newTraceId).toMatch(/^trace_\d+_[a-z0-9]+$/);
      expect(ConsoleLogger.getTraceId()).toBe(newTraceId);
    });

    it('should initialize with anonymous user', () => {
      expect(ConsoleLogger.getUserId()).toBe('anonymous');
    });

    it('should set custom user ID', () => {
      const userId = 'user-123';
      
      ConsoleLogger.setUserId(userId);
      
      expect(ConsoleLogger.getUserId()).toBe(userId);
    });
  });

  describe('Console Method Override', () => {
    beforeEach(() => {
      global.window.CLAUDE_LOGGING_ENABLED = 'true';
      initializeConsoleOverride();
    });

    it('should override all console methods', () => {
      expect(console.log).not.toBe(originalConsole.log);
      expect(console.error).not.toBe(originalConsole.error);
      expect(console.warn).not.toBe(originalConsole.warn);
      expect(console.info).not.toBe(originalConsole.info);
    });

    it('should call original console methods', () => {
      const logSpy = jest.fn();
      originalConsole.log = logSpy;

      console.log('test message');

      expect(logSpy).toHaveBeenCalledWith('test message');
    });

    it('should send logs to worker', async () => {
      console.log('test message');

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-worker.dev/log',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: 'http://localhost:3000',
          },
        })
      );
    });

    it('should include correct payload structure', async () => {
      ConsoleLogger.setUserId('test-user');
      console.log('test message');

      await new Promise(resolve => setTimeout(resolve, 10));

      const callArgs = mockFetch.mock.calls[0];
      const payload = JSON.parse(callArgs[1].body);

      expect(payload).toMatchObject({
        message: 'test message',
        level: 'log',
        system: 'browser',
        user_id: 'test-user',
        context: {
          timestamp: expect.any(Number),
          url: 'http://localhost:3000/test',
          userAgent: 'Mozilla/5.0 (Test Browser)',
        },
      });
      expect(payload.trace_id).toMatch(/^trace_\d+_[a-z0-9]+$/);
    });
  });

  describe('System Detection', () => {
    beforeEach(() => {
      global.window.CLAUDE_LOGGING_ENABLED = 'true';
      initializeConsoleOverride();
    });

    it('should detect browser system for regular logs', async () => {
      console.log('regular browser message');

      await new Promise(resolve => setTimeout(resolve, 10));

      const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(payload.system).toBe('browser');
    });

    it('should detect convex system for convex logs', async () => {
      console.log('[CONVEX A(mutations:testMutation)]', 'test convex message');

      await new Promise(resolve => setTimeout(resolve, 10));

      const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(payload.system).toBe('convex');
    });

    it('should detect convex system for Redis operations', async () => {
      console.log('Clearing Redis logs for trace test-123');

      await new Promise(resolve => setTimeout(resolve, 10));

      const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(payload.system).toBe('convex');
    });

    it('should detect convex system for sync operations', async () => {
      console.log('Syncing current Redis state for user test');

      await new Promise(resolve => setTimeout(resolve, 10));

      const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(payload.system).toBe('convex');
    });
  });

  describe('Message Suppression', () => {
    beforeEach(() => {
      global.window.CLAUDE_LOGGING_ENABLED = 'true';
      initializeConsoleOverride();
    });

    it('should suppress HMR noise', async () => {
      console.log('[HMR] Connected');

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should suppress webpack noise', async () => {
      console.log('webpack-internal: some internal message');

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should suppress React DevTools noise', async () => {
      console.log('React DevTools detected');

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should suppress Claude logging meta-logs', async () => {
      console.log('Claude logging provider initialized');

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should suppress sync operation noise', async () => {
      console.log('Clearing existing debug logs');

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should allow non-suppressed messages', async () => {
      console.log('This is a regular user message');

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should manage suppression patterns dynamically', () => {
      const initialPatterns = ConsoleLogger.getSuppressedPatterns();
      const newPattern = 'custom-test-pattern';
      
      ConsoleLogger.addSuppressionPattern(newPattern);
      expect(ConsoleLogger.getSuppressedPatterns()).toContain(newPattern);
      
      ConsoleLogger.removeSuppressionPattern(newPattern);
      expect(ConsoleLogger.getSuppressedPatterns()).not.toContain(newPattern);
    });
  });

  describe('Sensitive Data Redaction', () => {
    beforeEach(() => {
      global.window.CLAUDE_LOGGING_ENABLED = 'true';
      initializeConsoleOverride();
    });

    it('should redact access tokens', async () => {
      console.log('User login with access_token: "secret-token-123"');

      await new Promise(resolve => setTimeout(resolve, 10));

      const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(payload.message).toContain('[REDACTED]');
      expect(payload.message).not.toContain('secret-token-123');
    });

    it('should redact passwords', async () => {
      console.log('Login attempt with password: "mysecretpass"');

      await new Promise(resolve => setTimeout(resolve, 10));

      const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(payload.message).toContain('[REDACTED]');
      expect(payload.message).not.toContain('mysecretpass');
    });

    it('should redact multiple sensitive patterns', async () => {
      const sensitiveData = {
        access_token: 'secret-123',
        password: 'mypass',
        client_secret: 'client-secret-456',
      };
      console.log('Auth data:', sensitiveData);

      await new Promise(resolve => setTimeout(resolve, 10));

      const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(payload.message).not.toContain('secret-123');
      expect(payload.message).not.toContain('mypass');
      expect(payload.message).not.toContain('client-secret-456');
      expect(payload.message).toContain('[REDACTED]');
    });

    it('should provide redaction testing functionality', () => {
      const testString = 'Login with password: "secret123"';
      const redacted = ConsoleLogger.testRedaction(testString);
      
      expect(redacted).toContain('[REDACTED]');
      expect(redacted).not.toContain('secret123');
    });

    it('should allow custom redaction patterns', () => {
      ConsoleLogger.addRedactionPattern('custom_field["\']\s*:\s*["\']([^"\']+)["\'', 'custom_field": "[CUSTOM_REDACTED]"');
      
      const testString = 'Data with custom_field: "sensitive-data"';
      const redacted = ConsoleLogger.testRedaction(testString);
      
      expect(redacted).toContain('[CUSTOM_REDACTED]');
      expect(redacted).not.toContain('sensitive-data');
    });
  });

  describe('Rate Limiting and Duplicate Detection', () => {
    beforeEach(() => {
      global.window.CLAUDE_LOGGING_ENABLED = 'true';
      initializeConsoleOverride();
    });

    it('should detect and limit duplicate messages', async () => {
      const message = 'Repeated test message';
      
      // Send same message multiple times quickly
      for (let i = 0; i < 10; i++) {
        console.log(message);
      }

      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should not send all 10 messages due to duplicate detection
      expect(mockFetch.mock.calls.length).toBeLessThan(10);
      expect(mockFetch.mock.calls.length).toBeGreaterThan(0);
    });

    it('should handle rate limit responses from worker', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 429,
        json: () => Promise.resolve({
          success: false,
          error: 'Rate limit exceeded',
          remaining_quota: 0,
        }),
      });

      const warnSpy = jest.fn();
      originalConsole.warn = warnSpy;

      console.log('test message');

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(warnSpy).toHaveBeenCalledWith('Worker rate limit exceeded:', 'Rate limit exceeded');
    });

    it('should handle worker errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const errorSpy = jest.fn();
      originalConsole.error = errorSpy;

      console.log('test message');

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(errorSpy).toHaveBeenCalledWith('Failed to send log to Worker:', expect.any(Error));
    });
  });

  describe('Stack Trace Handling', () => {
    beforeEach(() => {
      global.window.CLAUDE_LOGGING_ENABLED = 'true';
      initializeConsoleOverride();
    });

    it('should include stack trace for errors', async () => {
      console.error('test error');

      await new Promise(resolve => setTimeout(resolve, 10));

      const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(payload.stack).toBeDefined();
      expect(typeof payload.stack).toBe('string');
    });

    it('should include stack trace for warnings', async () => {
      console.warn('test warning');

      await new Promise(resolve => setTimeout(resolve, 10));

      const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(payload.stack).toBeDefined();
    });

    it('should not include stack trace for info logs', async () => {
      console.info('test info');

      await new Promise(resolve => setTimeout(resolve, 10));

      const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(payload.stack).toBeUndefined();
    });

    it('should not include stack trace for regular logs', async () => {
      console.log('test log');

      await new Promise(resolve => setTimeout(resolve, 10));

      const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(payload.stack).toBeUndefined();
    });
  });

  describe('Status and Configuration', () => {
    it('should provide comprehensive status information', () => {
      global.window.CLAUDE_LOGGING_ENABLED = 'true';
      initializeConsoleOverride();
      ConsoleLogger.setUserId('test-user-123');

      const status = ConsoleLogger.getStatus();

      expect(status).toMatchObject({
        initialized: true,
        enabled: true,
        userId: 'test-user-123',
        rateLimiting: {
          note: 'Now using Worker-based rate limiting with Redis backend',
          currentLimit: 50,
          baseLimit: 50,
          timeUntilReset: expect.any(Number),
        },
      });
      expect(status.traceId).toMatch(/^trace_\d+_[a-z0-9]+$/);
    });

    it('should provide sensitive patterns information', () => {
      const patterns = ConsoleLogger.getSensitivePatterns();
      
      expect(patterns).toBeInstanceOf(Array);
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns).toContain('access_token["\']\s*:\s*["\']([^"\']+)["\'');
    });

    it('should check if logging is enabled', () => {
      global.window.CLAUDE_LOGGING_ENABLED = 'true';
      expect(ConsoleLogger.isEnabled()).toBe(true);
      
      global.window.CLAUDE_LOGGING_ENABLED = 'false';
      expect(ConsoleLogger.isEnabled()).toBe(false);
    });
  });

  describe('Console Reset', () => {
    it('should reset console methods to original', () => {
      global.window.CLAUDE_LOGGING_ENABLED = 'true';
      initializeConsoleOverride();
      
      expect(console.log).not.toBe(originalConsole.log);
      
      ConsoleLogger.reset();
      
      expect(console.log).toBe(originalConsole.log);
      expect(ConsoleLogger.getStatus().initialized).toBe(false);
    });

    it('should handle reset when not initialized', () => {
      expect(() => ConsoleLogger.reset()).not.toThrow();
    });
  });

  describe('Environment Configuration', () => {
    beforeEach(() => {
      global.window.CLAUDE_LOGGING_ENABLED = 'true';
      initializeConsoleOverride();
    });

    it('should use environment worker URL', async () => {
      process.env.NEXT_PUBLIC_LOG_WORKER_URL = 'https://custom-worker.dev';
      
      console.log('test message');

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom-worker.dev/log',
        expect.any(Object)
      );
    });

    it('should use default worker URL when env var not set', async () => {
      delete process.env.NEXT_PUBLIC_LOG_WORKER_URL;
      
      console.log('test message');

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockFetch).toHaveBeenCalledWith(
        'https://log-ingestion.your-worker-domain.workers.dev/log',
        expect.any(Object)
      );
    });
  });

  describe('Complex Object Handling', () => {
    beforeEach(() => {
      global.window.CLAUDE_LOGGING_ENABLED = 'true';
      initializeConsoleOverride();
    });

    it('should handle complex objects in console output', async () => {
      const complexObject = {
        user: { id: 123, name: 'Test User' },
        data: [1, 2, 3],
        nested: { deep: { value: 'test' } },
      };

      console.log('Complex data:', complexObject);

      await new Promise(resolve => setTimeout(resolve, 10));

      const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(payload.message).toContain('Complex data:');
      expect(payload.message).toContain('Test User');
    });

    it('should handle mixed argument types', async () => {
      console.log('Mixed args:', 123, { key: 'value' }, null, undefined, true);

      await new Promise(resolve => setTimeout(resolve, 10));

      const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(payload.message).toContain('Mixed args:');
      expect(payload.message).toContain('123');
      expect(payload.message).toContain('value');
    });
  });
});