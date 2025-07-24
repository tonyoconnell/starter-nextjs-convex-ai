import { query } from './_generated/server';

// Monitor database size and log volume (simplified to avoid pagination limits)
export const usage = query({
  args: {},
  handler: async ctx => {
    // Get sample counts from most recent entries
    const recentLogQueue = await ctx.db
      .query('log_queue')
      .order('desc')
      .take(5000);
    const recentLogEntries = await ctx.db
      .query('recent_log_entries')
      .order('desc')
      .take(5000);
    const users = await ctx.db.query('users').collect();
    const sessions = await ctx.db.query('sessions').collect();

    // Calculate approximate storage usage (rough estimate)
    const avgLogSize = 500; // bytes per log entry
    const avgUserSize = 200; // bytes per user
    const avgSessionSize = 100; // bytes per session

    const logQueueCount = recentLogQueue.length;
    const recentLogsCount = recentLogEntries.length;
    const usersCount = users.length;
    const sessionsCount = sessions.length;

    const estimatedStorage =
      (logQueueCount + recentLogsCount) * avgLogSize +
      usersCount * avgUserSize +
      sessionsCount * avgSessionSize;

    return {
      recordCounts: {
        log_queue_sample: logQueueCount,
        recent_log_entries_sample: recentLogsCount,
        users: usersCount,
        sessions: sessionsCount,
        note: 'Log counts are samples (max 5000 each), actual totals may be higher',
      },
      estimatedStorageBytes: estimatedStorage,
      estimatedStorageMB:
        Math.round((estimatedStorage / (1024 * 1024)) * 100) / 100,
      warnings: [
        ...(logQueueCount >= 5000
          ? ['log_queue sample maxed out - likely many more records']
          : []),
        ...(recentLogsCount >= 5000
          ? ['recent_log_entries sample maxed out - likely many more records']
          : []),
        ...(estimatedStorage > 50 * 1024 * 1024
          ? ['Estimated storage approaching 50MB limit']
          : []),
      ],
    };
  },
});

// Get recent high-volume traces for investigation (simplified to avoid memory limits)
export const traces = query({
  args: {},
  handler: async ctx => {
    // Sample recent logs instead of loading all
    const recentLogs = await ctx.db
      .query('recent_log_entries')
      .order('desc')
      .take(5000); // Sample last 5000 logs

    // Group by trace_id and count
    const traceCounts = recentLogs.reduce(
      (acc, log) => {
        acc[log.trace_id] = (acc[log.trace_id] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Sort by count and return top offenders
    const sortedTraces = Object.entries(traceCounts)
      .map(([trace_id, count]) => ({ trace_id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      highVolumeTraces: sortedTraces,
      totalTraces: Object.keys(traceCounts).length,
      sampledLogs: recentLogs.length,
      note: 'Showing analysis of most recent 5000 log entries only',
    };
  },
});
