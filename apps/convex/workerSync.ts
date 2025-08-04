import { httpAction } from './_generated/server';
import { action } from './_generated/server';
import { api } from './_generated/api';
import { v } from 'convex/values';

// Get Redis statistics without importing data
export const getRedisStats = httpAction(async (ctx, request) => {
  const workerUrl = process.env.NEXT_PUBLIC_LOG_WORKER_URL;
  if (!workerUrl) {
    return new Response(
      JSON.stringify({ error: 'NEXT_PUBLIC_LOG_WORKER_URL not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const healthResponse = await fetch(`${workerUrl}/health`);
    if (!healthResponse.ok) {
      throw new Error(`Worker health check failed: ${healthResponse.status}`);
    }

    const healthData = await healthResponse.json();
    return new Response(JSON.stringify(healthData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to fetch Redis stats:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch Redis statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// Sync all logs from Redis to Convex
export const syncAllLogs = action({
  args: {
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, { sessionToken }) => {
    const workerUrl = process.env.LOG_WORKER_URL || 'https://log-ingestion-worker.david-0b1.workers.dev';
    if (!workerUrl) {
      throw new Error('LOG_WORKER_URL not configured');
    }

    try {
      // Fetch recent traces first to get trace IDs
      const tracesResponse = await fetch(`${workerUrl}/traces/recent`);
      if (!tracesResponse.ok) {
        throw new Error(`Failed to fetch traces: ${tracesResponse.status}`);
      }
      const tracesData = await tracesResponse.json();

      let totalSynced = 0;
      const syncedAt = Date.now();

      // Sync logs for each trace
      for (const trace of tracesData.traces) {
        const logsResponse = await fetch(`${workerUrl}/logs?trace_id=${trace.trace_id}`);
        if (!logsResponse.ok) {
          console.warn(`Failed to fetch logs for trace ${trace.trace_id}: ${logsResponse.status}`);
          continue;
        }

        const logsData = await logsResponse.json();
        
        // Insert each log into debug_logs table
        for (const log of logsData.logs) {
          await ctx.runMutation(api.debugLogs.insertLog, {
            id: log.id,
            trace_id: log.trace_id,
            user_id: log.user_id,
            system: log.system,
            level: log.level,
            message: log.message,
            timestamp: log.timestamp,
            context: log.context,
            stack: log.stack,
            raw_data: log,
            synced_at: syncedAt
          });
          totalSynced++;
        }
      }

      return { success: true, totalSynced, syncedAt };
    } catch (error) {
      console.error('Failed to sync all logs:', error);
      throw new Error(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});

// Sync logs by specific trace ID
export const syncByTrace = action({
  args: { trace_id: v.string() },
  handler: async (ctx, { trace_id }) => {
    const workerUrl = process.env.LOG_WORKER_URL;
    if (!workerUrl) {
      throw new Error('LOG_WORKER_URL not configured');
    }

    try {
      const logsResponse = await fetch(`${workerUrl}/logs?trace_id=${trace_id}`);
      if (!logsResponse.ok) {
        throw new Error(`Failed to fetch logs for trace ${trace_id}: ${logsResponse.status}`);
      }

      const logsData = await logsResponse.json();
      const syncedAt = Date.now();
      let totalSynced = 0;

      // Insert each log into debug_logs table
      for (const log of logsData.logs) {
        await ctx.runMutation(api.debugLogs.insertLog, {
          id: log.id,
          trace_id: log.trace_id,
          user_id: log.user_id,
          system: log.system,
          level: log.level,
          message: log.message,
          timestamp: log.timestamp,
          context: log.context,
          stack: log.stack,
          raw_data: log,
          synced_at: syncedAt
        });
        totalSynced++;
      }

      return { success: true, trace_id, totalSynced, syncedAt };
    } catch (error) {
      console.error(`Failed to sync logs for trace ${trace_id}:`, error);
      throw new Error(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});

// Sync logs by specific user ID
export const syncByUser = action({
  args: { user_id: v.string() },
  handler: async (ctx, { user_id }) => {
    const workerUrl = process.env.LOG_WORKER_URL;
    if (!workerUrl) {
      throw new Error('LOG_WORKER_URL not configured');
    }

    try {
      // Note: Worker may not support user_id filtering directly
      // We'll fetch all logs and filter client-side for now
      const tracesResponse = await fetch(`${workerUrl}/traces/recent`);
      if (!tracesResponse.ok) {
        throw new Error(`Failed to fetch traces: ${tracesResponse.status}`);
      }
      const tracesData = await tracesResponse.json();

      let totalSynced = 0;
      const syncedAt = Date.now();

      // Check each trace for user_id match
      for (const trace of tracesData.traces) {
        const logsResponse = await fetch(`${workerUrl}/logs?trace_id=${trace.trace_id}`);
        if (!logsResponse.ok) {
          console.warn(`Failed to fetch logs for trace ${trace.trace_id}: ${logsResponse.status}`);
          continue;
        }

        const logsData = await logsResponse.json();
        
        // Filter and insert logs for specific user
        for (const log of logsData.logs) {
          if (log.user_id === user_id) {
            await ctx.runMutation(api.debugLogs.insertLog, {
              id: log.id,
              trace_id: log.trace_id,
              user_id: log.user_id,
              system: log.system,
              level: log.level,
              message: log.message,
              timestamp: log.timestamp,
              context: log.context,
              stack: log.stack,
              raw_data: log,
              synced_at: syncedAt
            });
            totalSynced++;
          }
        }
      }

      return { success: true, user_id, totalSynced, syncedAt };
    } catch (error) {
      console.error(`Failed to sync logs for user ${user_id}:`, error);
      throw new Error(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});

// Clear debug logs with optional filters
export const clearDebugLogs = action({
  args: { 
    trace_id: v.optional(v.string()),
    user_id: v.optional(v.string()),
    older_than_hours: v.optional(v.number())
  },
  handler: async (ctx, { trace_id, user_id, older_than_hours }) => {
    const cutoffTime = older_than_hours ? Date.now() - (older_than_hours * 60 * 60 * 1000) : null;
    
    let deletedCount = 0;
    
    if (trace_id) {
      deletedCount = await ctx.runMutation(api.debugLogs.clearByTrace, { trace_id });
    } else if (user_id) {
      deletedCount = await ctx.runMutation(api.debugLogs.clearByUser, { user_id });
    } else if (cutoffTime) {
      deletedCount = await ctx.runMutation(api.debugLogs.clearByAge, { cutoff_time: cutoffTime });
    } else {
      deletedCount = await ctx.runMutation(api.debugLogs.clearAll, {});
    }

    return { success: true, deletedCount };
  }
});