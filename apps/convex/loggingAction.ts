import { action, mutation } from './_generated/server';
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
  handler: async (ctx, args) => {
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

// Public action to process browser logs
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
    ctx,
    args
  ): Promise<{
    success: boolean;
    result?: { logQueueId: string; recentLogId: string };
    error?: string;
  }> => {
    // Rate limiting is handled at frontend level to avoid wasting function calls
    // Frontend limits: 50 logs/minute + duplicate detection
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

    return { success: true, result };
  },
});
