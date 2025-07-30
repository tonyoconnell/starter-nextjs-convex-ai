// Load testing for rate limiting effectiveness under burst conditions
// Tests system behavior under high traffic and validates rate limiting accuracy

import worker from '../src/index';
import { RateLimiterDO } from '../src/rate-limiter';
import { createMockEnvironment, setupRedisMock, RedisMockResponses, MockDurableObjectState } from './setup';
import { WorkerLogRequest } from '../src/types';

describe('Load Testing: Rate Limiting Under Burst Conditions', () => {
  let mockEnv: ReturnType<typeof createMockEnvironment>;
  let mockCtx: ExecutionContext;

  beforeEach(() => {
    mockEnv = createMockEnvironment();
    mockCtx = new ExecutionContext();
    jest.clearAllMocks();
  });

  describe('Burst Traffic Rate Limiting', () => {
    it('should handle burst traffic and enforce global limits accurately', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      const burstSize = 1200; // Exceeds global limit of 1000
      const tracePrefix = 'burst-global';
      const promises = [];

      // Create burst of requests across different traces to avoid per-trace limiting
      for (let i = 0; i < burstSize; i++) {
        const logRequest: WorkerLogRequest = {
          trace_id: `${tracePrefix}-${Math.floor(i / 10)}`, // Spread across 120 traces
          message: `Burst test message ${i + 1}`,
          level: 'info',
          system: 'browser',
          context: { burst_index: i },
        };

        const request = new Request('https://worker.example.com/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://localhost:3000',
          },
          body: JSON.stringify(logRequest),
        });

        promises.push(worker.fetch(request, mockEnv, mockCtx));
      }

      // Execute all requests concurrently
      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const results = await Promise.all(responses.map(r => r.json()));

      // Analyze results
      const successful = results.filter(r => r.success);
      const globalLimited = results.filter(r => !r.success && r.error?.includes('Global rate limit'));
      const systemLimited = results.filter(r => !r.success && r.error?.includes('browser system rate limit'));

      // Performance metrics
      const totalTime = endTime - startTime;
      const avgResponseTime = totalTime / burstSize;

      console.info(`Burst Load Test Results:
        - Total requests: ${burstSize}
        - Successful: ${successful.length}
        - Global rate limited: ${globalLimited.length}
        - System rate limited: ${systemLimited.length}
        - Total time: ${totalTime}ms
        - Average response time: ${avgResponseTime.toFixed(2)}ms`);

      // Verify rate limiting accuracy
      expect(successful.length).toBeLessThanOrEqual(1000); // Global limit
      expect(successful.length + globalLimited.length + systemLimited.length).toBe(burstSize);

      // Verify performance under load
      expect(avgResponseTime).toBeLessThan(50); // Should handle burst efficiently

      // Verify rate limiting kicked in
      expect(globalLimited.length + systemLimited.length).toBeGreaterThan(0);
    });

    it('should enforce system-specific limits under mixed burst traffic', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      const systemLimits = { browser: 400, convex: 300, worker: 300 };
      const burstMultiplier = 1.3; // 30% over each system limit
      const results: Record<string, any[]> = { browser: [], convex: [], worker: [] };

      // Test each system with burst traffic
      for (const [system, limit] of Object.entries(systemLimits)) {
        const systemBurstSize = Math.floor(limit * burstMultiplier);
        const promises = [];

        for (let i = 0; i < systemBurstSize; i++) {
          const logRequest: WorkerLogRequest = {
            trace_id: `${system}-burst-${Math.floor(i / 20)}`, // Multiple traces per system
            message: `${system} burst message ${i + 1}`,
            level: 'info',
            system: system as any,
            context: { system_burst_index: i },
          };

          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };

          // Set system-specific headers for auto-detection testing
          switch (system) {
            case 'browser':
              headers['Origin'] = 'https://localhost:3000';
              headers['User-Agent'] = 'Mozilla/5.0 (Test Browser)';
              break;
            case 'convex':
              headers['User-Agent'] = 'Convex-Internal-Logger/1.0';
              break;
            case 'worker':
              headers['User-Agent'] = 'CloudFlare-Workers-Runtime/1.0';
              break;
          }

          const request = new Request('https://worker.example.com/log', {
            method: 'POST',
            headers,
            body: JSON.stringify(logRequest),
          });

          promises.push(worker.fetch(request, mockEnv, mockCtx));
        }

        // Execute system burst
        const responses = await Promise.all(promises);
        const systemResults = await Promise.all(responses.map(r => r.json()));

        results[system] = systemResults.map((result, index) => ({
          index,
          success: result.success,
          error: result.error,
          remaining_quota: result.remaining_quota,
        }));
      }

      // Analyze each system's rate limiting
      for (const [system, limit] of Object.entries(systemLimits)) {
        const systemResults = results[system];
        const successful = systemResults.filter(r => r.success);
        const rateLimited = systemResults.filter(r => !r.success);

        console.info(`${system} System Load Test:
          - Burst size: ${systemResults.length}
          - Successful: ${successful.length}
          - Rate limited: ${rateLimited.length}
          - Expected limit: ${limit}`);

        // Verify system-specific rate limiting
        expect(successful.length).toBeLessThanOrEqual(limit);
        expect(successful.length).toBeGreaterThan(limit * 0.8); // At least 80% of limit should be allowed

        // Verify rate limited requests have appropriate error messages
        rateLimited.forEach(result => {
          expect(result.error).toContain(`${system} system rate limit exceeded`);
        });

        // Verify quota counting accuracy
        if (successful.length > 0) {
          const firstRequest = successful[0];
          const lastRequest = successful[successful.length - 1];
          expect(firstRequest.remaining_quota).toBeGreaterThan(lastRequest.remaining_quota);
        }
      }
    });

    it('should enforce per-trace limits under high-frequency single trace bursts', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      const traceId = 'high-frequency-trace';
      const burstSize = 150; // Exceeds per-trace limit of 100
      const promises = [];

      // Create burst for single trace
      for (let i = 0; i < burstSize; i++) {
        const logRequest: WorkerLogRequest = {
          trace_id: traceId,
          message: `High-frequency message ${i + 1}`,
          level: 'info',
          system: 'browser',
          context: { frequency_index: i },
        };

        const request = new Request('https://worker.example.com/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://localhost:3000',
          },
          body: JSON.stringify(logRequest),
        });

        promises.push(worker.fetch(request, mockEnv, mockCtx));
      }

      // Execute concurrent burst
      const responses = await Promise.all(promises);
      const results = await Promise.all(responses.map(r => r.json()));

      // Analyze per-trace limiting
      const successful = results.filter(r => r.success);
      const traceLimited = results.filter(r => !r.success && r.error?.includes('Per-trace rate limit'));

      console.info(`Per-Trace Load Test Results:
        - Burst size: ${burstSize}
        - Successful: ${successful.length}
        - Trace limited: ${traceLimited.length}
        - Per-trace limit: 100`);

      // Verify per-trace rate limiting accuracy
      expect(successful.length).toBe(100); // Exact per-trace limit
      expect(traceLimited.length).toBe(50); // Remaining requests

      // Verify error messages
      traceLimited.forEach(result => {
        expect(result.error).toBe(`Per-trace rate limit exceeded for ${traceId}`);
        expect(result.remaining_quota).toBe(0);
      });

      // Verify all rate-limited requests have the same trace_id
      traceLimited.forEach(result => {
        expect(result.trace_id).toBe(traceId);
      });
    });
  });

  describe('Concurrent System Load Testing', () => {
    it('should maintain isolation between systems under concurrent load', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      const concurrentSystems = ['browser', 'convex', 'worker'] as const;
      const requestsPerSystem = 150; // Mix of allowed and rate-limited
      const allPromises: Promise<Response>[] = [];

      // Create concurrent load across all systems
      concurrentSystems.forEach(system => {
        for (let i = 0; i < requestsPerSystem; i++) {
          const logRequest: WorkerLogRequest = {
            trace_id: `concurrent-${system}-${Math.floor(i / 25)}`, // Multiple traces per system
            message: `Concurrent ${system} message ${i + 1}`,
            level: 'info',
            system,
            context: { concurrent_index: i, system },
          };

          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };

          // System-specific headers
          switch (system) {
            case 'browser':
              headers['Origin'] = 'https://localhost:3000';
              break;
            case 'convex':
              headers['User-Agent'] = 'Convex-Internal-Logger/1.0';
              break;
            case 'worker':
              headers['User-Agent'] = 'CloudFlare-Workers-Runtime/1.0';
              break;
          }

          const request = new Request('https://worker.example.com/log', {
            method: 'POST',
            headers,
            body: JSON.stringify(logRequest),
          });

          allPromises.push(worker.fetch(request, mockEnv, mockCtx));
        }
      });

      // Execute all requests concurrently
      const startTime = Date.now();
      const responses = await Promise.all(allPromises);
      const endTime = Date.now();
      const results = await Promise.all(responses.map(r => r.json()));

      // Analyze results by system
      const systemResults: Record<string, any[]> = { browser: [], convex: [], worker: [] };
      
      results.forEach((result, index) => {
        const systemIndex = Math.floor(index / requestsPerSystem);
        const system = concurrentSystems[systemIndex];
        systemResults[system].push(result);
      });

      // Performance metrics
      const totalTime = endTime - startTime;
      const totalRequests = concurrentSystems.length * requestsPerSystem;

      console.info(`Concurrent Systems Load Test:
        - Total requests: ${totalRequests}
        - Total time: ${totalTime}ms
        - Average response time: ${(totalTime / totalRequests).toFixed(2)}ms`);

      // Verify system isolation
      const systemLimits = { browser: 400, convex: 300, worker: 300 };
      
      concurrentSystems.forEach(system => {
        const results = systemResults[system];
        const successful = results.filter(r => r.success);
        const limit = systemLimits[system];

        console.info(`${system} concurrent results:
          - Successful: ${successful.length}/${requestsPerSystem}
          - Expected limit: ${limit}`);

        // Each system should respect its own limit regardless of other system load
        expect(successful.length).toBeLessThanOrEqual(limit);
        
        // Should get reasonable portion of requests through (at least 60% of limit)
        expect(successful.length).toBeGreaterThan(limit * 0.6);
      });

      // Verify reasonable performance under concurrent load
      expect(totalTime / totalRequests).toBeLessThan(100); // Average under 100ms per request
    });

    it('should handle sustained load over time windows', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      const sustainedDuration = 5; // 5 time periods
      const requestsPerPeriod = 200;
      const periodGap = 100; // 100ms between periods
      const results: any[][] = [];

      // Simulate sustained load over multiple time periods
      for (let period = 0; period < sustainedDuration; period++) {
        const periodPromises = [];

        for (let i = 0; i < requestsPerPeriod; i++) {
          const logRequest: WorkerLogRequest = {
            trace_id: `sustained-period${period}-${Math.floor(i / 40)}`,
            message: `Sustained load period ${period + 1}, message ${i + 1}`,
            level: 'info',
            system: 'browser',
            context: {
              period,
              period_index: i,
              timestamp: Date.now(),
            },
          };

          const request = new Request('https://worker.example.com/log', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Origin': 'https://localhost:3000',
            },
            body: JSON.stringify(logRequest),
          });

          periodPromises.push(worker.fetch(request, mockEnv, mockCtx));
        }

        // Execute period requests
        const periodResponses = await Promise.all(periodPromises);
        const periodResults = await Promise.all(periodResponses.map(r => r.json()));
        results.push(periodResults);

        console.info(`Sustained load period ${period + 1} completed:
          - Requests: ${requestsPerPeriod}
          - Successful: ${periodResults.filter(r => r.success).length}
          - Rate limited: ${periodResults.filter(r => !r.success).length}`);

        // Wait between periods
        if (period < sustainedDuration - 1) {
          await new Promise(resolve => setTimeout(resolve, periodGap));
        }
      }

      // Analyze sustained load patterns
      const allResults = results.flat();
      const totalSuccessful = allResults.filter(r => r.success).length;
      const totalRateLimited = allResults.filter(r => !r.success).length;
      const totalRequests = sustainedDuration * requestsPerPeriod;

      console.info(`Sustained Load Test Summary:
        - Total periods: ${sustainedDuration}
        - Total requests: ${totalRequests}
        - Total successful: ${totalSuccessful}
        - Total rate limited: ${totalRateLimited}
        - Success rate: ${((totalSuccessful / totalRequests) * 100).toFixed(1)}%`);

      // Verify sustained load handling
      expect(totalSuccessful).toBeGreaterThan(0);
      expect(totalSuccessful).toBeLessThanOrEqual(1000); // Global limit should be enforced

      // Verify consistent behavior across periods
      const periodSuccessRates = results.map(periodResults => 
        periodResults.filter(r => r.success).length / requestsPerPeriod
      );

      // Success rates should be somewhat consistent (within 50% variation)
      const avgSuccessRate = periodSuccessRates.reduce((a, b) => a + b, 0) / periodSuccessRates.length;
      periodSuccessRates.forEach(rate => {
        expect(rate).toBeGreaterThan(avgSuccessRate * 0.5);
        expect(rate).toBeLessThan(avgSuccessRate * 1.5);
      });
    });
  });

  describe('Rate Limiting Accuracy and Consistency', () => {
    it('should maintain accurate rate limiting state under race conditions', async () => {
      // Create a fresh rate limiter for precise testing
      const mockState = new MockDurableObjectState();
      const rateLimiter = new RateLimiterDO(mockState as any);

      const concurrentRequests = 200;
      const traceId = 'race-condition-trace';
      const promises = [];

      // Create concurrent requests to test race conditions
      for (let i = 0; i < concurrentRequests; i++) {
        const request = new Request('http://localhost/check', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ system: 'browser', trace_id: traceId }),
        });

        promises.push(rateLimiter.fetch(request));
      }

      // Execute all requests concurrently
      const responses = await Promise.all(promises);
      const results = await Promise.all(responses.map(r => r.json()));

      // Analyze race condition handling
      const allowed = results.filter(r => r.allowed);
      const denied = results.filter(r => !r.allowed);

      console.info(`Race Condition Test Results:
        - Concurrent requests: ${concurrentRequests}
        - Allowed: ${allowed.length}
        - Denied: ${denied.length}
        - Per-trace limit: 100`);

      // Verify race condition safety - should not exceed limits
      expect(allowed.length).toBeLessThanOrEqual(100); // Per-trace limit
      expect(allowed.length).toBeGreaterThan(90); // Should allow most within limit

      // Verify denied requests have proper reasons
      denied.forEach(result => {
        expect(result.allowed).toBe(false);
        expect(result.reason).toBeTruthy();
      });

      // Check final state consistency
      const statusRequest = new Request('http://localhost/status', { method: 'GET' });
      const statusResponse = await rateLimiter.fetch(statusRequest);
      const statusData = await statusResponse.json();

      expect(statusData.current_state.trace_counts[traceId]).toBe(allowed.length);
      expect(statusData.current_state.global_current).toBe(allowed.length);
      expect(statusData.current_state.system_current.browser).toBe(allowed.length);
    });

    it('should handle quota exhaustion gracefully across multiple traces', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      const numberOfTraces = 15;
      const requestsPerTrace = 80; // Total: 1200 requests (exceeds global limit)
      const allPromises: Promise<Response>[] = [];

      // Create requests across multiple traces
      for (let traceIndex = 0; traceIndex < numberOfTraces; traceIndex++) {
        for (let reqIndex = 0; reqIndex < requestsPerTrace; reqIndex++) {
          const logRequest: WorkerLogRequest = {
            trace_id: `quota-trace-${traceIndex.toString().padStart(2, '0')}`,
            message: `Quota test T${traceIndex} R${reqIndex}`,
            level: 'info',
            system: 'browser',
            context: { trace_index: traceIndex, request_index: reqIndex },
          };

          const request = new Request('https://worker.example.com/log', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Origin': 'https://localhost:3000',
            },
            body: JSON.stringify(logRequest),
          });

          allPromises.push(worker.fetch(request, mockEnv, mockCtx));
        }
      }

      // Execute all requests
      const responses = await Promise.all(allPromises);
      const results = await Promise.all(responses.map(r => r.json()));

      // Analyze quota exhaustion behavior
      const successful = results.filter(r => r.success);
      const globalLimited = results.filter(r => !r.success && r.error?.includes('Global rate limit'));
      const systemLimited = results.filter(r => !r.success && r.error?.includes('browser system rate limit'));
      const traceLimited = results.filter(r => !r.success && r.error?.includes('Per-trace rate limit'));

      console.info(`Quota Exhaustion Test Results:
        - Total requests: ${allPromises.length}
        - Successful: ${successful.length}
        - Global limited: ${globalLimited.length}
        - System limited: ${systemLimited.length}
        - Trace limited: ${traceLimited.length}`);

      // Verify quota limits are enforced correctly
      expect(successful.length).toBeLessThanOrEqual(1000); // Global limit
      expect(successful.length).toBeLessThanOrEqual(400);  // Browser system limit

      // Should have a mix of different rate limiting reasons as quotas exhaust
      const totalLimited = globalLimited.length + systemLimited.length + traceLimited.length;
      expect(totalLimited).toBeGreaterThan(0);
      expect(successful.length + totalLimited).toBe(allPromises.length);

      // Verify distribution across traces
      const traceResults: Record<string, any[]> = {};
      results.forEach(result => {
        const traceId = result.trace_id;
        if (!traceResults[traceId]) traceResults[traceId] = [];
        traceResults[traceId].push(result);
      });

      // Each trace should respect per-trace limits
      Object.entries(traceResults).forEach(([traceId, traceResults]) => {
        const traceSuccessful = traceResults.filter(r => r.success);
        expect(traceSuccessful.length).toBeLessThanOrEqual(100); // Per-trace limit
      });
    });

    it('should recover and reset limits after time window expiry', async () => {
      // This test simulates time window reset behavior
      const mockState = new MockDurableObjectState();
      const rateLimiter = new RateLimiterDO(mockState as any);

      // Mock time to control window expiry
      const originalNow = Date.now;
      let currentTime = Date.now();
      Date.now = jest.fn(() => currentTime);

      try {
        // Fill up rate limits
        const fillRequests = [];
        for (let i = 0; i < 100; i++) {
          const request = new Request('http://localhost/check', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ system: 'browser', trace_id: `fill-trace-${i % 10}` }),
          });
          fillRequests.push(rateLimiter.fetch(request));
        }

        const fillResponses = await Promise.all(fillRequests);
        const fillResults = await Promise.all(fillResponses.map(r => r.json()));
        const initialAllowed = fillResults.filter(r => r.allowed).length;

        console.info(`Initial fill phase: ${initialAllowed} requests allowed`);

        // Verify limits are being enforced
        expect(initialAllowed).toBeGreaterThan(0);
        expect(initialAllowed).toBeLessThanOrEqual(100);

        // Test that further requests are denied
        const testRequest = new Request('http://localhost/check', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ system: 'browser', trace_id: 'test-trace' }),
        });

        const testResponse = await rateLimiter.fetch(testRequest);
        const testResult = await testResponse.json();

        // Should be denied due to limits
        const shouldBeDenied = initialAllowed >= 100;
        if (shouldBeDenied) {
          expect(testResult.allowed).toBe(false);
        }

        // Advance time past window expiry (1 hour + 1 second)
        currentTime += (60 * 60 * 1000) + 1000;

        // Test that limits are reset
        const resetRequest = new Request('http://localhost/check', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ system: 'browser', trace_id: 'reset-trace' }),
        });

        const resetResponse = await rateLimiter.fetch(resetRequest);
        const resetResult = await resetResponse.json();

        expect(resetResult.allowed).toBe(true);
        expect(resetResult.remaining_quota).toBe(399); // Full quota minus this request

        console.info('Rate limit window reset successfully verified');

      } finally {
        Date.now = originalNow;
      }
    });
  });

  describe('Performance and Resource Usage', () => {
    it('should maintain acceptable response times under high load', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      const loadSize = 500;
      const responseTimes: number[] = [];
      const promises = [];

      // Create high load with timing measurements
      for (let i = 0; i < loadSize; i++) {
        const logRequest: WorkerLogRequest = {
          trace_id: `performance-trace-${Math.floor(i / 50)}`,
          message: `Performance test message ${i + 1}`,
          level: 'info',
          system: 'browser',
        };

        const request = new Request('https://worker.example.com/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://localhost:3000',
          },
          body: JSON.stringify(logRequest),
        });

        const startTime = Date.now();
        const promise = worker.fetch(request, mockEnv, mockCtx).then(response => {
          const endTime = Date.now();
          responseTimes.push(endTime - startTime);
          return response;
        });

        promises.push(promise);
      }

      // Execute and measure
      const responses = await Promise.all(promises);
      const results = await Promise.all(responses.map(r => r.json()));

      // Calculate performance metrics
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);
      const p95ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];

      console.info(`Performance Test Results:
        - Total requests: ${loadSize}
        - Average response time: ${avgResponseTime.toFixed(2)}ms
        - Min response time: ${minResponseTime}ms
        - Max response time: ${maxResponseTime}ms
        - P95 response time: ${p95ResponseTime}ms
        - Successful requests: ${results.filter(r => r.success).length}`);

      // Verify performance requirements
      expect(avgResponseTime).toBeLessThan(100); // Average under 100ms
      expect(p95ResponseTime).toBeLessThan(200); // 95% under 200ms
      expect(maxResponseTime).toBeLessThan(1000); // Max under 1 second

      // Verify system remained functional under load
      const successfulRequests = results.filter(r => r.success).length;
      expect(successfulRequests).toBeGreaterThan(loadSize * 0.5); // At least 50% success rate
    });

    it('should handle memory pressure from large request batches', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      const batchSize = 1000;
      const largeMessageSize = 5000; // 5KB messages
      const batches = 3;

      for (let batch = 0; batch < batches; batch++) {
        const batchPromises = [];

        for (let i = 0; i < batchSize; i++) {
          const largeMessage = `Large message batch ${batch + 1} item ${i + 1}: ${'A'.repeat(largeMessageSize)}`;
          const logRequest: WorkerLogRequest = {
            trace_id: `memory-trace-b${batch}-${Math.floor(i / 100)}`,
            message: largeMessage,
            level: 'info',
            system: 'browser',
            context: {
              batch,
              item: i,
              message_size: largeMessageSize,
              large_data: 'B'.repeat(1000), // Additional context data
            },
          };

          const request = new Request('https://worker.example.com/log', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Origin': 'https://localhost:3000',
            },
            body: JSON.stringify(logRequest),
          });

          batchPromises.push(worker.fetch(request, mockEnv, mockCtx));
        }

        // Process batch
        const startTime = Date.now();
        const batchResponses = await Promise.all(batchPromises);
        const endTime = Date.now();
        const batchResults = await Promise.all(batchResponses.map(r => r.json()));

        const batchSuccessful = batchResults.filter(r => r.success).length;
        const batchTime = endTime - startTime;

        console.info(`Memory pressure batch ${batch + 1}:
          - Requests: ${batchSize}
          - Successful: ${batchSuccessful}
          - Time: ${batchTime}ms
          - Rate: ${(batchSuccessful / batchTime * 1000).toFixed(1)} req/sec`);

        // Verify system handles large payloads
        expect(batchSuccessful).toBeGreaterThan(0);
        expect(batchTime).toBeLessThan(30000); // Under 30 seconds per batch

        // Brief pause between batches to allow cleanup
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.info(`Memory pressure test completed successfully across ${batches} batches`);
    });
  });
});