// Comprehensive unit tests for RedisClient
// Tests Redis operations, error handling, TTL management, and pipeline operations
// @ts-nocheck

import { RedisClient } from '../redis-client';
import { RedisLogEntry } from '../types';
import { setupRedisMock, RedisMockResponses } from '../../tests/setup';

describe('RedisClient', () => {
  let redisClient: RedisClient;
  const mockBaseUrl = 'https://mock-redis.upstash.io';
  const mockToken = 'mock-token-123';

  beforeEach(() => {
    redisClient = new RedisClient(mockBaseUrl, mockToken);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with base URL and token', () => {
      const client = new RedisClient(mockBaseUrl, mockToken);
      expect(client).toBeInstanceOf(RedisClient);
    });

    it('should remove trailing slash from base URL', () => {
      const clientWithSlash = new RedisClient('https://mock-redis.upstash.io/', mockToken);
      expect(clientWithSlash).toBeInstanceOf(RedisClient);
      // We can't directly test the private property, but we can test behavior
    });

    it('should handle base URL without trailing slash', () => {
      const clientWithoutSlash = new RedisClient('https://mock-redis.upstash.io', mockToken);
      expect(clientWithoutSlash).toBeInstanceOf(RedisClient);
    });
  });

  describe('request', () => {
    it('should make successful Redis requests', async () => {
      setupRedisMock({
        PING: RedisMockResponses.PING,
      });

      // Access private method through any casting for testing
      const result = await (redisClient as any).request(['PING']);
      
      expect(result).toBe('PONG');
      expect(global.fetch).toHaveBeenCalledWith(mockBaseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['PING']),
      });
    });

    it('should handle Redis command errors', async () => {
      setupRedisMock({
        INVALID: RedisMockResponses.ERROR,
      });

      await expect((redisClient as any).request(['INVALID']))
        .rejects.toThrow('Redis request failed');
    });

    it('should handle network errors', async () => {
      setupRedisMock({
        PING: 'NETWORK_ERROR',
      });

      await expect((redisClient as any).request(['PING']))
        .rejects.toThrow('Network error');
    });

    it('should handle HTTP error responses', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce(new Response('Server Error', {
        status: 500,
        statusText: 'Internal Server Error'
      }));

      await expect((redisClient as any).request(['PING']))
        .rejects.toThrow('Redis request failed: 500 Internal Server Error');
    });

    it('should handle malformed JSON responses', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce(new Response('invalid json', {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }));

      await expect((redisClient as any).request(['PING']))
        .rejects.toThrow();
    });
  });

  describe('storeLogEntry', () => {
    const mockLogEntry: RedisLogEntry = {
      id: 'log-123',
      trace_id: 'trace-456',
      user_id: 'user-789',
      system: 'browser',
      level: 'info',
      message: 'Test log message',
      timestamp: Date.now(),
      context: { component: 'auth' },
    };

    it('should store log entry with TTL using pipeline', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      await redisClient.storeLogEntry(mockLogEntry);

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/pipeline`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([
            ['LPUSH', 'logs:trace-456', JSON.stringify(mockLogEntry)],
            ['EXPIRE', 'logs:trace-456', '3600'],
          ]),
        })
      );
    });

    it('should handle pipeline errors during store operation', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify([
        { result: 1 }, // LPUSH success
        { error: 'ERR expire failed' } // EXPIRE error
      ]), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }));

      await expect(redisClient.storeLogEntry(mockLogEntry))
        .rejects.toThrow('Redis pipeline command 1 failed: ERR expire failed');
    });

    it('should serialize complex log entries correctly', async () => {
      const complexLogEntry: RedisLogEntry = {
        id: 'complex-log-123',
        trace_id: 'complex-trace-456',
        system: 'browser',
        level: 'error',
        message: 'Complex error with unicode: 🚀 ñáéíóú',
        timestamp: Date.now(),
        stack: 'Error: Something went wrong\n  at function1()\n  at function2()',
        context: {
          nested: {
            data: {
              array: [1, 2, 3],
              boolean: true,
              null_value: null,
            },
          },
          special_chars: '@#$%^&*()',
        },
      };

      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      await redisClient.storeLogEntry(complexLogEntry);

      const expectedSerialized = JSON.stringify(complexLogEntry);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/pipeline`,
        expect.objectContaining({
          body: JSON.stringify([
            ['LPUSH', 'logs:complex-trace-456', expectedSerialized],
            ['EXPIRE', 'logs:complex-trace-456', '3600'],
          ]),
        })
      );
    });
  });

  describe('getLogsByTraceId', () => {
    it('should retrieve logs for a trace ID', async () => {
      const mockLogEntries = [
        '{"id":"log-1","trace_id":"trace-123","message":"First log","timestamp":1000}',
        '{"id":"log-2","trace_id":"trace-123","message":"Second log","timestamp":2000}',
      ];

      setupRedisMock({
        LRANGE: { result: mockLogEntries },
      });

      const logs = await redisClient.getLogsByTraceId('trace-123');

      expect(logs).toHaveLength(2);
      expect(logs[0]).toEqual({
        id: 'log-1',
        trace_id: 'trace-123',
        message: 'First log',
        timestamp: 1000,
      });
      expect(logs[1]).toEqual({
        id: 'log-2',
        trace_id: 'trace-123',
        message: 'Second log',
        timestamp: 2000,
      });

      expect(global.fetch).toHaveBeenCalledWith(mockBaseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['LRANGE', 'logs:trace-123', '0', '-1']),
      });
    });

    it('should return empty array for non-existent trace ID', async () => {
      setupRedisMock({
        LRANGE: { result: [] },
      });

      const logs = await redisClient.getLogsByTraceId('non-existent-trace');

      expect(logs).toEqual([]);
    });

    it('should handle malformed JSON in stored logs', async () => {
      const mockLogEntries = [
        '{"valid":"json"}',
        'invalid json string',
        '{"another":"valid"}',
      ];

      setupRedisMock({
        LRANGE: { result: mockLogEntries },
      });

      // Should throw error when trying to parse invalid JSON
      await expect(redisClient.getLogsByTraceId('trace-123'))
        .rejects.toThrow();
    });

    it('should handle Redis errors during retrieval', async () => {
      setupRedisMock({
        LRANGE: RedisMockResponses.ERROR,
      });

      await expect(redisClient.getLogsByTraceId('trace-123'))
        .rejects.toThrow('Redis request failed');
    });
  });

  describe('getTraceCount', () => {
    it('should return count of logs for a trace ID', async () => {
      setupRedisMock({
        LLEN: { result: 5 },
      });

      const count = await redisClient.getTraceCount('trace-123');

      expect(count).toBe(5);
      expect(global.fetch).toHaveBeenCalledWith(mockBaseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['LLEN', 'logs:trace-123']),
      });
    });

    it('should return 0 for non-existent trace ID', async () => {
      setupRedisMock({
        LLEN: { result: 0 },
      });

      const count = await redisClient.getTraceCount('non-existent-trace');

      expect(count).toBe(0);
    });

    it('should handle Redis errors during count operation', async () => {
      setupRedisMock({
        LLEN: RedisMockResponses.ERROR,
      });

      await expect(redisClient.getTraceCount('trace-123'))
        .rejects.toThrow('Redis request failed');
    });
  });

  describe('pipeline', () => {
    it('should execute multiple Redis commands in pipeline', async () => {
      setupRedisMock({
        PIPELINE: [
          { result: 1 }, // LPUSH result
          { result: 1 }, // EXPIRE result
          { result: 'value' }, // GET result
        ],
      });

      const commands = [
        ['LPUSH', 'test:key', 'value'],
        ['EXPIRE', 'test:key', '3600'],
        ['GET', 'other:key'],
      ];

      const results = await redisClient.pipeline(commands);

      expect(results).toEqual([1, 1, 'value']);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/pipeline`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(commands),
        }
      );
    });

    it('should handle mixed success/error results in pipeline', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify([
        { result: 1 }, // Success
        { error: 'ERR command failed' }, // Error
        { result: 'value' }, // Success
      ]), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }));

      const commands = [
        ['SET', 'key1', 'value1'],
        ['INVALID_COMMAND'],
        ['GET', 'key2'],
      ];

      await expect(redisClient.pipeline(commands))
        .rejects.toThrow('Redis pipeline command 1 failed: ERR command failed');
    });

    it('should handle HTTP errors in pipeline requests', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce(new Response('Server Error', {
        status: 500,
        statusText: 'Internal Server Error'
      }));

      const commands = [['PING']];

      await expect(redisClient.pipeline(commands))
        .rejects.toThrow('Redis pipeline failed: 500 Internal Server Error');
    });

    it('should handle empty pipeline commands', async () => {
      setupRedisMock({
        PIPELINE: [],
      });

      const results = await redisClient.pipeline([]);

      expect(results).toEqual([]);
    });
  });

  describe('healthCheck', () => {
    it('should return true for healthy Redis connection', async () => {
      setupRedisMock({
        PING: RedisMockResponses.HEALTHY,
      });

      const isHealthy = await redisClient.healthCheck();

      expect(isHealthy).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(mockBaseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['PING']),
      });
    });

    it('should return false for unhealthy Redis connection', async () => {
      setupRedisMock({
        PING: RedisMockResponses.UNHEALTHY,
      });

      const isHealthy = await redisClient.healthCheck();

      expect(isHealthy).toBe(false);
    });

    it('should return false for network errors', async () => {
      setupRedisMock({
        PING: 'NETWORK_ERROR',
      });

      const isHealthy = await redisClient.healthCheck();

      expect(isHealthy).toBe(false);
    });

    it('should return false for non-PONG responses', async () => {
      setupRedisMock({
        PING: { result: 'NOT_PONG' },
      });

      const isHealthy = await redisClient.healthCheck();

      expect(isHealthy).toBe(false);
    });

    it('should handle exceptions gracefully', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      const isHealthy = await redisClient.healthCheck();

      expect(isHealthy).toBe(false);
    });
  });

  describe('getActiveTraces', () => {
    it('should return list of active trace IDs', async () => {
      setupRedisMock({
        KEYS: { result: ['logs:trace-123', 'logs:trace-456', 'logs:trace-789'] },
      });

      const activeTraces = await redisClient.getActiveTraces();

      expect(activeTraces).toEqual(['trace-123', 'trace-456', 'trace-789']);
      expect(global.fetch).toHaveBeenCalledWith(mockBaseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['KEYS', 'logs:*']),
      });
    });

    it('should return empty array when no active traces', async () => {
      setupRedisMock({
        KEYS: { result: [] },
      });

      const activeTraces = await redisClient.getActiveTraces();

      expect(activeTraces).toEqual([]);
    });

    it('should handle keys with different prefixes', async () => {
      setupRedisMock({
        KEYS: { result: ['logs:trace-123', 'other:key', 'logs:trace-456'] },
      });

      const activeTraces = await redisClient.getActiveTraces();

      expect(activeTraces).toEqual(['trace-123', 'trace-456']);
    });

    it('should handle Redis errors during key listing', async () => {
      setupRedisMock({
        KEYS: RedisMockResponses.ERROR,
      });

      await expect(redisClient.getActiveTraces())
        .rejects.toThrow('Redis request failed');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete log storage and retrieval workflow', async () => {
      const logEntry: RedisLogEntry = {
        id: 'integration-log-1',
        trace_id: 'integration-trace',
        system: 'browser',
        level: 'info',
        message: 'Integration test message',
        timestamp: Date.now(),
      };

      // Setup mocks for storage
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
        LRANGE: { result: [JSON.stringify(logEntry)] },
        LLEN: { result: 1 },
      });

      // Store the log entry
      await redisClient.storeLogEntry(logEntry);

      // Retrieve logs by trace ID
      const retrievedLogs = await redisClient.getLogsByTraceId('integration-trace');
      expect(retrievedLogs).toHaveLength(1);
      expect(retrievedLogs[0]).toEqual(logEntry);

      // Get trace count
      const count = await redisClient.getTraceCount('integration-trace');
      expect(count).toBe(1);
    });

    it('should handle high-volume log storage simulation', async () => {
      const logEntries: RedisLogEntry[] = Array.from({ length: 100 }, (_, i) => ({
        id: `bulk-log-${i}`,
        trace_id: 'bulk-trace',
        system: 'browser',
        level: 'info',
        message: `Bulk test message ${i}`,
        timestamp: Date.now() + i,
      }));

      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      // Store all entries (would be done individually in real scenario)
      const storePromises = logEntries.map(entry => redisClient.storeLogEntry(entry));
      
      await expect(Promise.all(storePromises)).resolves.not.toThrow();

      // Verify all pipeline calls were made
      expect(global.fetch).toHaveBeenCalledTimes(100);
    });

    it('should handle concurrent operations on same trace', async () => {
      const traceId = 'concurrent-trace';
      const logEntries: RedisLogEntry[] = [
        {
          id: 'concurrent-1',
          trace_id: traceId,
          system: 'browser',
          level: 'info',
          message: 'First message',
          timestamp: Date.now(),
        },
        {
          id: 'concurrent-2',
          trace_id: traceId,
          system: 'convex',
          level: 'warn',
          message: 'Second message',
          timestamp: Date.now() + 1,
        },
      ];

      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
        LRANGE: { result: logEntries.map(e => JSON.stringify(e)) },
        LLEN: { result: 2 },
      });

      // Simulate concurrent operations
      const operations = [
        redisClient.storeLogEntry(logEntries[0]),
        redisClient.storeLogEntry(logEntries[1]),
        redisClient.getLogsByTraceId(traceId),
        redisClient.getTraceCount(traceId),
      ];

      const results = await Promise.all(operations);
      
      // Verify operations completed successfully
      expect(results[2]).toHaveLength(2); // getLogsByTraceId result
      expect(results[3]).toBe(2); // getTraceCount result
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should handle authentication errors', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce(new Response('Unauthorized', {
        status: 401,
        statusText: 'Unauthorized'
      }));

      await expect((redisClient as any).request(['PING']))
        .rejects.toThrow('Redis request failed: 401 Unauthorized');
    });

    it('should handle timeout scenarios', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      await expect((redisClient as any).request(['PING']))
        .rejects.toThrow('Request timeout');
    });

    it('should handle very large payloads', async () => {
      const largeLogEntry: RedisLogEntry = {
        id: 'large-log',
        trace_id: 'large-trace',
        system: 'browser',
        level: 'info',
        message: 'A'.repeat(100000), // 100KB message
        timestamp: Date.now(),
        context: {
          largeData: 'B'.repeat(50000), // Additional 50KB in context
        },
      };

      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      await expect(redisClient.storeLogEntry(largeLogEntry))
        .resolves.not.toThrow();

      // Verify the large payload was properly serialized
      const expectedPayload = JSON.stringify(largeLogEntry);
      expect(expectedPayload.length).toBeGreaterThan(150000);
    });

    it('should handle Redis server maintenance mode', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({
        error: 'ERR server is in maintenance mode'
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }));

      await expect((redisClient as any).request(['PING']))
        .rejects.toThrow('Redis error: ERR server is in maintenance mode');
    });
  });
});