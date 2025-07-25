import { action, mutation, httpAction, MutationCtx, ActionCtx } from './_generated/server';
import { v } from 'convex/values';
import { api } from './_generated/api';

// Internal mutation to store log entry
export const createLogEntry = mutation({
  args: {
    level: v.string(),
    message: v.string(),
    trace_id: v.string(),
    user_id: v.string(),
    system_area: v.string(),
    timestamp: v.number(),
    raw_args: v.array(v.string()),
    stack_trace: v.optional(v.string()),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      level: string;
      message: string;
      trace_id: string;
      user_id: string;
      system_area: string;
      timestamp: number;
      raw_args: string[];
      stack_trace?: string;
    }
  ) => {
    const now = Date.now();
    const expiresAt = now + 60 * 60 * 1000; // 1 hour from now

    // Store in log queue
    const logQueueId = await ctx.db.insert('log_queue', {
      level: args.level,
      message: args.message,
      trace_id: args.trace_id,
      user_id: args.user_id,
      system_area: args.system_area,
      timestamp: args.timestamp,
      raw_args: args.raw_args,
      stack_trace: args.stack_trace,
      processed: false,
    });

    // Also store in recent entries for real-time UI
    const recentLogId = await ctx.db.insert('recent_log_entries', {
      level: args.level,
      message: args.message,
      trace_id: args.trace_id,
      user_id: args.user_id,
      system_area: args.system_area,
      timestamp: args.timestamp,
      raw_args: args.raw_args,
      stack_trace: args.stack_trace,
      expires_at: expiresAt,
    });

    return { logQueueId, recentLogId };
  },
});

// Rate limiting removed from backend - handled at frontend level only
// This maximizes Convex function call efficiency

// Public action to process logs from multiple systems (browser, worker, manual)
export const processLogs = action({
  args: {
    level: v.string(),
    args: v.array(v.any()),
    trace_id: v.optional(v.string()),
    user_id: v.optional(v.string()),
    system_area: v.optional(v.string()),
    timestamp: v.number(),
    stack_trace: v.optional(v.string()),
  },
  handler: async (
    ctx: ActionCtx,
    args: {
      level: string;
      args: unknown[];
      trace_id?: string;
      user_id?: string;
      system_area?: string;
      timestamp: number;
      stack_trace?: string;
    }
  ): Promise<{
    success: boolean;
    result?: { logQueueId: string; recentLogId: string };
    error?: string;
    rateLimitInfo?: any;
  }> => {
    // Create message fingerprint for duplicate detection
    const messageContent = Array.isArray(args.args) ? args.args.join(' ') : String(args.args);
    const messageFingerprint = `${args.level}:${messageContent}`.substring(0, 100); // Simple string-based fingerprint

    // Check centralized rate limiting
    const rateLimitCheck = await ctx.runMutation(api.rateLimiter.checkAndUpdateRateLimit, {
      system: (args.system_area as 'browser' | 'worker' | 'backend') || 'browser',
      messageFingerprint,
      traceId: args.trace_id,
    });

    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        error: `Rate limited: ${rateLimitCheck.reason}`,
        rateLimitInfo: rateLimitCheck.rateLimitInfo,
      };
    }

    // Prepare log entry data
    const logEntry = {
      level: args.level,
      message: Array.isArray(args.args)
        ? args.args.join(' ')
        : String(args.args),
      trace_id: args.trace_id || 'unknown',
      user_id: args.user_id || 'anonymous',
      system_area: args.system_area || 'browser',
      timestamp: args.timestamp,
      raw_args: Array.isArray(args.args)
        ? args.args.map((arg: unknown) => String(arg))
        : [String(args.args)],
      stack_trace: args.stack_trace,
    };

    // Store the log entry
    const result = await ctx.runMutation(
      api.loggingAction.createLogEntry,
      logEntry
    );

    return { 
      success: true, 
      result,
      rateLimitInfo: rateLimitCheck.rateLimitInfo,
    };
  },
});

// HTTP Action wrapper with explicit CORS support for multi-system logging
export const processLogsHttp = httpAction(async (ctx, request) => {
  // Set CORS headers for cross-origin requests
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Origin, User-Agent',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.level || !body.args || !body.timestamp) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required fields: level, args, timestamp' 
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Determine system area from origin or body
    const origin = request.headers.get('origin') || 'unknown';
    const userAgent = request.headers.get('user-agent') || '';
    
    let systemArea = body.system_area;
    if (!systemArea) {
      // Auto-detect system based on request characteristics (case-insensitive)
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        systemArea = 'browser';
      } else if (userAgent.toLowerCase().includes('worker') || userAgent.toLowerCase().includes('cloudflare')) {
        systemArea = 'worker';
      } else if (userAgent.toLowerCase().includes('convex')) {
        systemArea = 'convex';
      } else {
        systemArea = 'browser'; // Default fallback
      }
    }

    // Process the log using the existing action
    const result = await ctx.runAction(api.loggingAction.processLogs, {
      level: body.level,
      args: body.args,
      trace_id: body.trace_id,
      user_id: body.user_id,
      system_area: systemArea,
      timestamp: body.timestamp,
      stack_trace: body.stack_trace,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('HTTP logging action error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});

// Health check endpoint for monitoring
export const loggingHealthCheck = httpAction(async (ctx, request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  return new Response(JSON.stringify({
    status: 'healthy',
    service: 'multi-system-logging',
    timestamp: Date.now(),
    endpoints: {
      processLogs: '/api/actions/loggingAction/processLogs',
      processLogsHttp: '/api/actions/loggingAction/processLogsHttp',
      healthCheck: '/api/actions/loggingAction/loggingHealthCheck',
    },
    supportedSystems: ['browser', 'worker', 'convex', 'manual'],
  }), {
    status: 200,
    headers: corsHeaders,
  });
});
