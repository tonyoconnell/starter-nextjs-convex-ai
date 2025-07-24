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
    (console as unknown as Record<string, (...args: unknown[]) => void>)[level] = (...args: unknown[]) => {
      // Call original console method first
      (originalConsole as unknown as Record<string, (...args: unknown[]) => void>)[level](...args);
      
      // Send to Convex (async, non-blocking)
      sendToConvex(level, args).catch(err => {
        // Fail silently to avoid console loops
        originalConsole.error('Console override error:', err);
      });
    };
  });
  
  isInitialized = true;
  originalConsole.log('Claude logging initialized with trace ID:', currentTraceId);
}

async function sendToConvex(level: string, args: unknown[]) {
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
  
  isEnabled: () => typeof window !== 'undefined' && window.CLAUDE_LOGGING_ENABLED === 'true',
  
  getStatus: () => ({
    initialized: isInitialized,
    enabled: typeof window !== 'undefined' ? window.CLAUDE_LOGGING_ENABLED === 'true' : false,
    traceId: currentTraceId,
    userId: currentUserId,
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
};