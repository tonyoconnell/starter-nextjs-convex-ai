export interface RedisLogEntry {
  id: string;
  trace_id: string;
  user_id?: string;
  system: 'browser' | 'convex' | 'worker' | 'manual';
  level: 'log' | 'info' | 'warn' | 'error';
  message: string;
  stack?: string;
  timestamp: number;
  context?: Record<string, unknown>;
}

export interface ErrorChain {
  entries: RedisLogEntry[];
  pattern: string;
}

export interface PerformanceInsight {
  metric: string;
  value: number;
  context: string;
}

export interface SystemFlow {
  system: string;
  timestamp: number;
  duration?: number;
}

export interface CorrelationAnalysis {
  errorChains: ErrorChain[];
  performanceInsights: PerformanceInsight[];
  systemFlow: SystemFlow[];
}

export interface ExportData {
  structured: object;
  markdown: string;
}

export interface DebugSession {
  traceId: string;
  logs: RedisLogEntry[];
  correlationAnalysis: CorrelationAnalysis;
  exportData: ExportData;
  fetchTime: number;
}

export interface ClaudeDebugExport {
  metadata: {
    traceId: string;
    exportTime: string;
    logCount: number;
    systems: string[];
    timeRange: { start: number; end: number };
  };
  timeline: Array<{
    timestamp: string;
    system: string;
    level: string;
    message: string;
    context?: Record<string, unknown>;
  }>;
  analysis: {
    errorChains: Array<{
      description: string;
      entries: Array<{ timestamp: string; system: string; message: string }>;
    }>;
    performanceIssues: Array<{
      issue: string;
      evidence: string;
      recommendation: string;
    }>;
    systemFlow: Array<{
      system: string;
      actions: string[];
      duration: string;
    }>;
  };
  summary: string;
}

// Session-based caching for debug interface
const DEBUG_CACHE_TTL = 300_000; // 5 minutes
const debugSessions = new Map<string, DebugSession>();

export const getCachedDebugSession = (traceId: string): DebugSession | null => {
  const cached = debugSessions.get(traceId);
  if (cached && Date.now() - cached.fetchTime < DEBUG_CACHE_TTL) {
    return cached;
  }
  return null;
};

export const setCachedDebugSession = (session: DebugSession): void => {
  debugSessions.set(session.traceId, session);
};

export const clearDebugSessionCache = (): void => {
  debugSessions.clear();
};

export const fetchLogsForTrace = async (
  traceId: string,
  systemFilter?: string[]
): Promise<DebugSession> => {
  // Check cache first
  const cached = getCachedDebugSession(traceId);
  if (cached) {
    return cached;
  }

  // Import convex client dynamically to avoid SSR issues
  const { convex } = await import('@/lib/convex');
  const { api } = await import('@/lib/convex-api');
  
  try {
    // Fetch debug session from Convex action
    const session = await convex.action(api.debugActions.fetchLogsForTrace, {
      traceId,
      systemFilter,
      includeContext: true
    });

    // Cache the session locally
    setCachedDebugSession(session);

    return session;
  } catch (error) {
    throw new Error(`Failed to fetch logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const exportDebugSession = async (
  traceId: string,
  format: 'json' | 'markdown' | 'claude-format'
): Promise<{ exportContent: string; metadata: Record<string, unknown> }> => {
  // Import convex client dynamically to avoid SSR issues
  const { convex } = await import('@/lib/convex');
  const { api } = await import('@/lib/convex-api');
  
  try {
    const result = await convex.action(api.debugActions.exportSession, {
      traceId,
      format,
      includeAnalysis: true
    });

    return result;
  } catch (error) {
    throw new Error(`Failed to export session: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const clearDebugCache = async (traceId?: string): Promise<{ success: boolean; message: string }> => {
  // Import convex client dynamically to avoid SSR issues
  const { convex } = await import('@/lib/convex');
  const { api } = await import('@/lib/convex-api');
  
  try {
    const result = await convex.action(api.debugActions.clearDebugCache, {
      traceId
    });

    // Also clear local cache
    if (traceId) {
      debugSessions.delete(traceId);
    } else {
      debugSessions.clear();
    }

    return result;
  } catch (error) {
    throw new Error(`Failed to clear cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};