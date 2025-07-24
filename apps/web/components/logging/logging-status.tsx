'use client';

import { useState, useEffect } from 'react';
import { ConsoleLogger } from '../../lib/console-override';

export function LoggingStatus() {
  const [status, setStatus] = useState<{
    initialized: boolean;
    enabled: boolean;
    traceId: string;
    userId: string;
  } | null>(null);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return;
    
    const updateStatus = () => setStatus(ConsoleLogger.getStatus());
    
    // Initial status
    updateStatus();
    
    // Update status periodically
    const interval = setInterval(updateStatus, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Don't render in production
  if (process.env.NODE_ENV !== 'development' || !status) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white text-xs p-2 rounded shadow-lg font-mono z-50">
      <div className="font-semibold mb-1">Claude Logging Status</div>
      <div className={`w-2 h-2 rounded-full inline-block mr-2 ${
        status.enabled && status.initialized ? 'bg-green-400' : 'bg-red-400'
      }`}></div>
      <span>{status.enabled && status.initialized ? 'Active' : 'Inactive'}</span>
      <div className="mt-1 space-y-1">
        <div>Trace: {status.traceId.substring(0, 12)}...</div>
        <div>User: {status.userId}</div>
      </div>
      <button
        onClick={() => ConsoleLogger.newTrace()}
        className="mt-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
      >
        New Trace
      </button>
    </div>
  );
}