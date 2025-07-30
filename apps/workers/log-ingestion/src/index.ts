// Main Cloudflare Worker entry point for log ingestion

import { RedisClient } from './redis-client';
import { RateLimiterDO, checkRateLimit } from './rate-limiter';
import { LogProcessor } from './log-processor';
import type { WorkerLogRequest, WorkerLogResponse, Environment } from './types';

// Export the Durable Object class
export { RateLimiterDO };

export default {
  async fetch(request: Request, env: Environment, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Origin, User-Agent, Authorization',
      'Content-Type': 'application/json',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Route handlers
    if (url.pathname === '/' && request.method === 'GET') {
      return new Response(JSON.stringify({
        service: 'log-ingestion-worker',
        status: 'running',
        endpoints: {
          'POST /log': 'Log ingestion endpoint',
          'GET /health': 'Health check with full system status',
          'GET /logs?trace_id=xxx': 'Retrieve logs by trace ID'
        },
        usage: {
          'Log ingestion': 'POST /log with JSON payload',
          'Health check': 'GET /health',
          'Retrieve logs': 'GET /logs?trace_id=your_trace_id'
        }
      }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (url.pathname === '/log' && request.method === 'POST') {
      return handleLogIngestion(request, env, corsHeaders);
    }
    
    if (url.pathname === '/health' && request.method === 'GET') {
      return handleHealthCheck(env, corsHeaders);
    }
    
    if (url.pathname === '/logs' && request.method === 'GET') {
      return handleLogRetrieval(request, env, corsHeaders);
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: corsHeaders,
    });
  },
};

async function handleLogIngestion(
  request: Request, 
  env: Environment, 
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const requestData: WorkerLogRequest = await request.json();
    
    
    // Validate request
    const validation = LogProcessor.validateRequest(requestData);
    if (!validation.valid) {
      return new Response(JSON.stringify({
        success: false,
        error: validation.error,
      } as WorkerLogResponse), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Process the log entry
    const { processedEntry, shouldProcess } = LogProcessor.processLogRequest(
      requestData, 
      request.headers
    );

    if (!shouldProcess) {
      return new Response(JSON.stringify({
        success: true,
        trace_id: requestData.trace_id,
        message: 'Log suppressed (noise filtering)',
      } as WorkerLogResponse), {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Check rate limits using Durable Object
    const rateLimiterId = env.RATE_LIMIT_STATE.idFromName('global');
    const rateLimiterStub = env.RATE_LIMIT_STATE.get(rateLimiterId);
    
    const rateLimitCheck = await checkRateLimit(
      rateLimiterStub,
      processedEntry.system,
      processedEntry.trace_id
    );

    if (!rateLimitCheck.allowed) {
      return new Response(JSON.stringify({
        success: false,
        trace_id: requestData.trace_id,
        error: rateLimitCheck.reason,
        remaining_quota: rateLimitCheck.remaining_quota,
      } as WorkerLogResponse), {
        status: 429,
        headers: corsHeaders,
      });
    }

    // Store in Redis
    const redis = new RedisClient(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN);
    await redis.storeLogEntry(processedEntry);

    return new Response(JSON.stringify({
      success: true,
      trace_id: requestData.trace_id,
      remaining_quota: rateLimitCheck.remaining_quota,
    } as WorkerLogResponse), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Log ingestion error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
    } as WorkerLogResponse), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

async function handleHealthCheck(
  env: Environment, 
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    // Check Redis configuration and connectivity
    let redisHealthy = false;
    let redisConfigured = false;
    
    try {
      // Check if Redis is configured
      if (!env.UPSTASH_REDIS_REST_URL || env.UPSTASH_REDIS_REST_URL.trim() === '' ||
          !env.UPSTASH_REDIS_REST_TOKEN || env.UPSTASH_REDIS_REST_TOKEN.trim() === '') {
        redisConfigured = false;
        redisHealthy = false;
      } else {
        redisConfigured = true;
        const redis = new RedisClient(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN);
        redisHealthy = await redis.healthCheck();
      }
    } catch (error) {
      // Redis configuration or connection error
      redisHealthy = false;
    }
    
    // Get rate limiter status
    const rateLimiterId = env.RATE_LIMIT_STATE.idFromName('global');
    const rateLimiterStub = env.RATE_LIMIT_STATE.get(rateLimiterId);
    const rateLimiterResponse = await rateLimiterStub.fetch('http://localhost/status');
    const rateLimiterStatus = await rateLimiterResponse.json();
    
    // Get log processor status
    const processorStatus = LogProcessor.generateHealthReport();

    const healthStatus = {
      status: redisHealthy ? 'healthy' : 'degraded',
      service: 'log-ingestion-worker',
      timestamp: Date.now(),
      components: {
        redis: {
          status: redisHealthy ? 'healthy' : 'unhealthy',
          url: redisConfigured ? 'configured' : 'missing',
        },
        rate_limiter: {
          status: 'healthy',
          ...(rateLimiterStatus as any),
        },
        log_processor: processorStatus,
      },
      endpoints: {
        log_ingestion: '/log',
        health_check: '/health',
        log_retrieval: '/logs?trace_id={trace_id}',
      },
      cost_model: {
        estimated_monthly_cost: '$2',
        savings_vs_convex: '80%',
        redis_ttl: '1 hour',
        rate_limits: {
          global: '1000/hour',
          browser: '400/hour',
          convex: '300/hour',
          worker: '300/hour',
          per_trace: '100/hour',
        },
      },
    };

    return new Response(JSON.stringify(healthStatus), {
      status: redisHealthy ? 200 : 503,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Health check error:', error);
    
    return new Response(JSON.stringify({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: Date.now(),
    }), {
      status: 503,
      headers: corsHeaders,
    });
  }
}

async function handleLogRetrieval(
  request: Request, 
  env: Environment, 
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const traceId = url.searchParams.get('trace_id');
    
    if (!traceId) {
      return new Response(JSON.stringify({
        error: 'trace_id parameter is required',
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Retrieve logs from Redis
    const redis = new RedisClient(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN);
    const logs = await redis.getLogsByTraceId(traceId);

    return new Response(JSON.stringify({
      trace_id: traceId,
      logs: logs.sort((a, b) => a.timestamp - b.timestamp), // Sort by timestamp
      count: logs.length,
      retrieved_at: Date.now(),
    }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Log retrieval error:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to retrieve logs',
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}