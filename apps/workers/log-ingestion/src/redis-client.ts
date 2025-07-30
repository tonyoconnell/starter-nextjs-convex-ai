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
    const serializedEntry = JSON.stringify(entry);
    
    // Use pipeline for atomic operations
    await this.pipeline([
      ['LPUSH', key, serializedEntry],
      ['EXPIRE', key, '3600'], // 1 hour TTL
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

  // Cleanup expired keys (not needed with TTL, but useful for monitoring)
  async getActiveTraces(): Promise<string[]> {
    const keys = await this.request(['KEYS', 'logs:*']);
    return keys
      .filter((key: string) => key.startsWith('logs:'))
      .map((key: string) => key.replace('logs:', ''));
  }
}