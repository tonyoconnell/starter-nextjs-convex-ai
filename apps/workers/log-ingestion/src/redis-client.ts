// Upstash Redis client for log storage with TTL management

import { RedisLogEntry } from './types';

export class RedisClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.token = token;
  }

  private async request(command: string[]): Promise<any> {
    const response = await fetch(`${this.baseUrl}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      throw new Error(`Redis request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
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
    const response = await fetch(`${this.baseUrl}/pipeline`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
    });

    if (!response.ok) {
      throw new Error(`Redis pipeline failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Check for errors in pipeline results
    data.forEach((result: any, index: number) => {
      if (result.error) {
        throw new Error(`Redis pipeline command ${index} failed: ${result.error}`);
      }
    });

    return data.map((result: any) => result.result);
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