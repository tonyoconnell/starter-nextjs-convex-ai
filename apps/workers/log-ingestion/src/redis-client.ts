// Upstash Redis client for log storage with TTL management

import type { RedisLogEntry } from './types';

export class RedisClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    // Validate required configuration
    if (!baseUrl || baseUrl.trim() === '') {
      throw new Error('Redis base URL is required and cannot be empty');
    }
    if (!token || token.trim() === '') {
      throw new Error('Redis token is required and cannot be empty');
    }
    
    // Validate URL format
    try {
      new URL(baseUrl);
    } catch {
      throw new Error('Redis base URL must be a valid URL');
    }
    
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.token = token;
  }

  private async request(command: string[]): Promise<any> {
    let response: Response | undefined;
    
    try {
      response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
      });
    } catch (error) {
      throw new Error(`Redis request failed: Network error - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (!response) {
      throw new Error('Redis request failed: No response received');
    }

    if (!response.ok) {
      throw new Error(`Redis request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as any;
    if (data.error) {
      throw new Error(`Redis error: ${data.error}`);
    }

    return data.result;
  }

  async storeLogEntry(entry: RedisLogEntry): Promise<void> {
    const key = `logs:${entry.trace_id}`;
    const metaKey = `meta:${entry.trace_id}`;
    const serializedEntry = JSON.stringify(entry);
    
    // Use pipeline for atomic operations with metadata caching
    await this.pipeline([
      ['LPUSH', key, serializedEntry],
      ['EXPIRE', key, '3600'], // 1 hour TTL
      ['ZADD', 'recent_traces', entry.timestamp.toString(), entry.trace_id], // Sorted set for recent traces
      ['EXPIRE', 'recent_traces', '3600'], // 1 hour TTL for the sorted set
      ['HSET', metaKey, 'system', entry.system, 'level', entry.level, 'timestamp', entry.timestamp.toString()], // Metadata
      ['EXPIRE', metaKey, '3600'], // 1 hour TTL for metadata
    ]);
  }

  async getLogsByTraceId(traceId: string): Promise<RedisLogEntry[]> {
    const key = `logs:${traceId}`;
    const entries = await this.request(['LRANGE', key, '0', '-1']);
    
    return entries.map((entry: string) => JSON.parse(entry));
  }

  async getTraceCount(traceId: string): Promise<number> {
    const key = `logs:${traceId}`;
    return await this.request(['LLEN', key]);
  }

  async pipeline(commands: string[][]): Promise<any[]> {
    let response: Response | undefined;
    
    try {
      response = await fetch(`${this.baseUrl}/pipeline`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commands),
      });
    } catch (error) {
      throw new Error(`Redis pipeline failed: Network error - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (!response) {
      throw new Error('Redis pipeline failed: No response received');
    }

    if (!response.ok) {
      throw new Error(`Redis pipeline failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as any;
    
    // Check for errors in pipeline results
    (data as any).forEach((result: any, index: number) => {
      if (result.error) {
        throw new Error(`Redis pipeline command ${index} failed: ${result.error}`);
      }
    });

    return (data as any).map((result: any) => result.result);
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.request(['PING']);
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  // Get active traces from cached sorted set (much faster than KEYS)
  async getActiveTraces(): Promise<string[]> {
    try {
      // Get all trace IDs from the sorted set, sorted by timestamp (most recent first)
      const traceIds = await this.request(['ZREVRANGE', 'recent_traces', '0', '-1']);
      return traceIds || [];
    } catch {
      // Fallback to KEYS if recent_traces doesn't exist (backward compatibility)
      const keys = await this.request(['KEYS', 'logs:*']);
      return keys
        .filter((key: string) => key.startsWith('logs:'))
        .map((key: string) => key.replace('logs:', ''));
    }
  }

  async clearAllLogs(): Promise<{ deleted: number; message: string }> {
    try {
      // Get all log and metadata keys
      const [logKeys, metaKeys] = await Promise.all([
        this.request(['KEYS', 'logs:*']),
        this.request(['KEYS', 'meta:*'])
      ]);
      
      const allKeys = [...(logKeys || []), ...(metaKeys || []), 'recent_traces'];
      
      if (allKeys.length === 0) {
        return { deleted: 0, message: 'No logs found to delete' };
      }

      // Delete all keys in batch
      const deleteCommands = allKeys.map((key: string) => ['DEL', key]);
      const results = await this.pipeline(deleteCommands);
      
      // Count successful deletions
      const deleted = results.reduce((sum: number, result: number) => sum + result, 0);
      
      return { 
        deleted, 
        message: `Successfully deleted ${deleted} keys (logs, metadata, and trace index)` 
      };
    } catch (error) {
      throw new Error(`Failed to clear logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async clearLogsByTraceId(traceId: string): Promise<{ deleted: boolean; message: string }> {
    try {
      const logKey = `logs:${traceId}`;
      const metaKey = `meta:${traceId}`;
      
      // Delete logs, metadata, and remove from recent traces in one pipeline
      const results = await this.pipeline([
        ['DEL', logKey],
        ['DEL', metaKey],
        ['ZREM', 'recent_traces', traceId]
      ]);
      
      const deletedLogs = results[0];
      const deletedMeta = results[1];
      const removedFromIndex = results[2];
      
      if (deletedLogs === 1 || deletedMeta === 1 || removedFromIndex === 1) {
        return { deleted: true, message: `Deleted logs and metadata for trace: ${traceId}` };
      } else {
        return { deleted: false, message: `No logs found for trace: ${traceId}` };
      }
    } catch (error) {
      throw new Error(`Failed to clear trace logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRecentTraces(limit: number = 10): Promise<Array<{
    id: string;
    timestamp: number;
    logCount: number;
    systems: string[];
    hasErrors: boolean;
  }>> {
    try {
      // Get recent trace IDs from sorted set (already sorted by timestamp)
      const traceIds = await this.request(['ZREVRANGE', 'recent_traces', '0', (limit - 1).toString()]);
      
      if (!traceIds || traceIds.length === 0) {
        return [];
      }

      // Batch all Redis operations for maximum efficiency
      const commands: string[][] = [];
      
      traceIds.forEach((traceId: string) => {
        commands.push(
          ['LLEN', `logs:${traceId}`], // Get log count
          ['HGETALL', `meta:${traceId}`], // Get cached metadata
          ['LRANGE', `logs:${traceId}`, '0', '4'] // Get first 5 logs to check for multiple systems/errors
        );
      });

      const results = await this.pipeline(commands);
      
      const traces: Array<{
        id: string;
        timestamp: number;
        logCount: number;
        systems: string[];
        hasErrors: boolean;
      }> = [];

      // Process results in chunks of 3 (logCount, metadata, sampleLogs)
      for (let i = 0; i < traceIds.length; i++) {
        try {
          const traceId = traceIds[i];
          const logCount = results[i * 3] || 0;
          const metadata = results[i * 3 + 1] || {};
          const sampleLogs = results[i * 3 + 2] || [];

          if (logCount === 0) continue;

          // Extract systems and error status from sample logs
          const parsedLogs: RedisLogEntry[] = sampleLogs.map((log: string) => {
            try {
              return JSON.parse(log);
            } catch {
              return null;
            }
          }).filter(Boolean);

          const systems = [...new Set([
            metadata.system, // Include system from metadata
            ...parsedLogs.map(log => log.system)
          ])].filter(Boolean);

          const hasErrors = metadata.level === 'error' || parsedLogs.some(log => log.level === 'error');

          const timestamp = metadata.timestamp ? parseInt(metadata.timestamp) : 
                          (parsedLogs[0]?.timestamp || Date.now());

          traces.push({
            id: traceId,
            timestamp,
            logCount,
            systems,
            hasErrors
          });
        } catch (error) {
          // Skip traces that can't be processed
          continue;
        }
      }

      return traces.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      throw new Error(`Failed to get recent traces: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}