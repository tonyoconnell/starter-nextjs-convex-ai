/* eslint-disable no-console, no-restricted-syntax */
'use client';

// Store original console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
};

// Generate unique trace ID for session
const generateTraceId = () =>
  `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Current trace context
let currentTraceId = generateTraceId();
let currentUserId = 'anonymous';
let isInitialized = false;

// Adaptive rate limiting - gets stricter over time
let logCount = 0;
let rateLimitResetTime = Date.now() + 60000; // 1 minute from now
let consecutiveHighVolumeMinutes = 0; // Track sustained high volume
const BASE_LIMIT = 50; // Starting limit

// Loop detection - track recent identical messages
const recentMessages = new Map<string, { count: number; lastSeen: number }>();
const DUPLICATE_WINDOW = 1000; // 1 second
const MAX_DUPLICATES = 5; // Max identical messages in window

// Message suppression - client-side filtering
const suppressedPatterns = new Set([
  // Hot Module Reload noise
  '[HMR]',
  'unexpected require',
  'disposed module',

  // Development-only noise
  'webpack-internal',
  'webpack-hot-middleware',
  'hot-update',
  '[Fast Refresh]',

  // React DevTools noise
  'React DevTools',
  'DevTools detected',

  // Common browser noise
  'Received an error',
  'Non-Error promise rejection',

  // Add more patterns as discovered
]);

// Sensitive data patterns for redaction
const sensitivePatterns = [
  {
    pattern: /access_token["']\s*:\s*["']([^"']+)["']/gi,
    replacement: 'access_token": "[REDACTED]"',
  },
  {
    pattern: /client_secret["']\s*:\s*["']([^"']+)["']/gi,
    replacement: 'client_secret": "[REDACTED]"',
  },
  {
    pattern: /refresh_token["']\s*:\s*["']([^"']+)["']/gi,
    replacement: 'refresh_token": "[REDACTED]"',
  },
  {
    pattern: /token["']\s*:\s*["']([^"']+)["']/gi,
    replacement: 'token": "[REDACTED]"',
  },
  {
    pattern: /password["']\s*:\s*["']([^"']+)["']/gi,
    replacement: 'password": "[REDACTED]"',
  },
  {
    pattern: /secret["']\s*:\s*["']([^"']+)["']/gi,
    replacement: 'secret": "[REDACTED]"',
  },
];

function redactSensitiveData(args: unknown[]): unknown[] {
  return args.map(arg => {
    let stringArg = typeof arg === 'object' ? JSON.stringify(arg) : String(arg);

    // Apply all redaction patterns
    sensitivePatterns.forEach(({ pattern, replacement }) => {
      stringArg = stringArg.replace(pattern, replacement);
    });

    // Try to parse back to object if it was originally an object
    if (typeof arg === 'object') {
      try {
        return JSON.parse(stringArg);
      } catch {
        return stringArg; // Return as string if parsing fails
      }
    }

    return stringArg;
  });
}

function shouldSuppressMessage(level: string, args: unknown[]): boolean {
  const message = args
    .map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
    .join(' ');

  // Check against suppression patterns
  for (const pattern of suppressedPatterns) {
    if (message.includes(pattern)) {
      // Log suppression locally for debugging
      originalConsole.debug(
        `🔇 Suppressed log: ${pattern} in "${message.substring(0, 100)}..."`
      );
      return true;
    }
  }

  return false;
}

// Declare global window interface for TypeScript
declare global {
  interface Window {
    CLAUDE_LOGGING_ENABLED?: string;
  }
}

export function initializeConsoleOverride() {
  // Prevent double initialization
  if (isInitialized) return;

  // Check if we're in browser environment
  if (typeof window === 'undefined') return;

  // Check if logging is enabled
  if (window.CLAUDE_LOGGING_ENABLED !== 'true') return;

  // Make ConsoleLogger globally available for UAT testing
  (window as unknown as Record<string, unknown>).ConsoleLogger = ConsoleLogger;

  // Override each console method
  ['log', 'error', 'warn', 'info'].forEach(level => {
    (console as unknown as Record<string, (...args: unknown[]) => void>)[
      level
    ] = (...args: unknown[]) => {
      // Call original console method first (always preserve local console)
      (
        originalConsole as unknown as Record<
          string,
          (...args: unknown[]) => void
        >
      )[level](...args);

      // Check if message should be suppressed
      if (shouldSuppressMessage(level, args)) {
        return; // Skip sending to Convex, but keep local console output
      }

      // Redact sensitive data before sending to Convex
      const redactedArgs = redactSensitiveData(args);

      // Send redacted data to Convex (async, non-blocking)
      sendToConvex(level, redactedArgs).catch(err => {
        // Fail silently to avoid console loops
        originalConsole.error('Console override error:', err);
      });
    };
  });

  isInitialized = true;
  originalConsole.log(
    'Claude logging initialized with trace ID:',
    currentTraceId
  );
}

// Calculate adaptive rate limit based on sustained volume
function getAdaptiveLimit(): number {
  if (consecutiveHighVolumeMinutes === 0) return BASE_LIMIT; // First minute: full limit

  // Logarithmic decay: each consecutive minute reduces limit
  const reduction = Math.floor(
    BASE_LIMIT * 0.7 ** consecutiveHighVolumeMinutes
  );
  const adaptiveLimit = Math.max(5, reduction); // Never go below 5 logs/minute

  return adaptiveLimit;
}

async function sendToConvex(level: string, args: unknown[]) {
  // Adaptive frontend rate limiting
  const now = Date.now();
  const currentLimit = getAdaptiveLimit();

  if (now > rateLimitResetTime) {
    // Check if previous minute was high volume
    const wasHighVolume = logCount >= BASE_LIMIT * 0.8; // 80% of base limit

    if (wasHighVolume) {
      consecutiveHighVolumeMinutes++;
      originalConsole.warn(
        `High volume logging detected (minute ${consecutiveHighVolumeMinutes}). Reducing limit to ${getAdaptiveLimit()}/min`
      );
    } else {
      // Reset if we had a low-volume minute
      if (consecutiveHighVolumeMinutes > 0) {
        consecutiveHighVolumeMinutes = Math.max(
          0,
          consecutiveHighVolumeMinutes - 1
        );
        originalConsole.log(
          `Volume decreased. Rate limit recovering: ${getAdaptiveLimit()}/min`
        );
      }
    }

    // Reset rate limit window
    logCount = 0;
    rateLimitResetTime = now + 60000;
    recentMessages.clear(); // Clear duplicate tracking on reset
  }

  if (logCount >= currentLimit) {
    originalConsole.warn(
      `Adaptive rate limit exceeded (${currentLimit}/min), dropping log`
    );
    return;
  }

  // Loop detection - prevent duplicate messages
  const messageKey = `${level}:${args
    .map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
    .join(' ')}`;

  const existing = recentMessages.get(messageKey);
  if (existing) {
    if (now - existing.lastSeen < DUPLICATE_WINDOW) {
      existing.count++;
      existing.lastSeen = now;

      if (existing.count > MAX_DUPLICATES) {
        originalConsole.warn(
          `Dropping duplicate log message (${existing.count} times):`,
          messageKey
        );
        return;
      }
    } else {
      // Outside window, reset count
      recentMessages.set(messageKey, { count: 1, lastSeen: now });
    }
  } else {
    recentMessages.set(messageKey, { count: 1, lastSeen: now });
  }

  logCount++;

  const payload = {
    level,
    args: args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ),
    trace_id: currentTraceId,
    user_id: currentUserId,
    system_area: 'browser',
    timestamp: Date.now(),
    stack_trace: new Error().stack,
  };

  try {
    // Import Convex client and API dynamically to avoid issues during server-side rendering
    const { ConvexHttpClient } = await import('convex/browser');
    const { api } = await import('../../convex/_generated/api');

    // Get Convex URL from environment
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      originalConsole.error('NEXT_PUBLIC_CONVEX_URL not configured');
      return;
    }

    const client = new ConvexHttpClient(convexUrl);

    // Call the processLogs action
    await client.action(api.loggingAction.processLogs, payload);
  } catch (error) {
    // Log to original console only
    originalConsole.error('Failed to send log to Convex:', error);
  }
}

// Public API for trace management
export const ConsoleLogger = {
  setTraceId: (traceId: string) => {
    currentTraceId = traceId;
    originalConsole.log('Trace ID updated to:', traceId);
  },

  setUserId: (userId: string) => {
    currentUserId = userId;
    originalConsole.log('User ID updated to:', userId);
  },

  newTrace: () => {
    currentTraceId = generateTraceId();
    originalConsole.log('New trace created:', currentTraceId);
    return currentTraceId;
  },

  getTraceId: () => currentTraceId,

  getUserId: () => currentUserId,

  isEnabled: () =>
    typeof window !== 'undefined' && window.CLAUDE_LOGGING_ENABLED === 'true',

  getStatus: () => ({
    initialized: isInitialized,
    enabled:
      typeof window !== 'undefined'
        ? window.CLAUDE_LOGGING_ENABLED === 'true'
        : false,
    traceId: currentTraceId,
    userId: currentUserId,
    rateLimiting: {
      currentLimit: getAdaptiveLimit(),
      baseLimit: BASE_LIMIT,
      logsThisMinute: logCount,
      consecutiveHighVolumeMinutes,
      timeUntilReset: Math.max(0, rateLimitResetTime - Date.now()),
    },
  }),

  // Reset console to original methods
  reset: () => {
    if (!isInitialized) return;

    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;

    isInitialized = false;
    originalConsole.log('Console override reset');
  },

  // Suppression management
  getSuppressedPatterns: () => Array.from(suppressedPatterns),

  addSuppressionPattern: (pattern: string) => {
    suppressedPatterns.add(pattern);
    originalConsole.log(`Added suppression pattern: ${pattern}`);
  },

  removeSuppressionPattern: (pattern: string) => {
    suppressedPatterns.delete(pattern);
    originalConsole.log(`Removed suppression pattern: ${pattern}`);
  },

  // Redaction management
  getSensitivePatterns: () => sensitivePatterns.map(p => p.pattern.source),

  addRedactionPattern: (pattern: string, replacement = '[REDACTED]') => {
    sensitivePatterns.push({
      pattern: new RegExp(pattern, 'gi'),
      replacement,
    });
    originalConsole.log(
      `Added redaction pattern: ${pattern} -> ${replacement}`
    );
  },

  testRedaction: (testString: string) => {
    const result = redactSensitiveData([testString]);
    originalConsole.log('Redaction test:', {
      original: testString,
      redacted: result[0],
    });
    return result[0];
  },
};
