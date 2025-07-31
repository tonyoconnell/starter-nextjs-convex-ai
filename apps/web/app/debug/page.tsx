'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import TraceSearchForm from './components/TraceSearchForm';
import TimelineViewer from './components/TimelineViewer';
import CorrelationPanel from './components/CorrelationPanel';
import ExportControls from './components/ExportControls';
import RecentTraces from './components/RecentTraces';
import { fetchLogsForTrace, exportDebugSession } from './lib/debug-api';
import type { DebugSession } from './lib/debug-api';

export default function DebugPage() {
  const [debugSession, setDebugSession] = useState<DebugSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [systemFilter, setSystemFilter] = useState<string[]>([]);

  const handleTraceSelect = (traceId: string) => {
    handleTraceSearch(traceId, systemFilter);
  };

  const handleTraceSearch = async (traceId: string, systemFilters: string[]) => {
    setLoading(true);
    setError(null);
    setSystemFilter(systemFilters);
    
    try {
      const session = await fetchLogsForTrace(traceId, systemFilters);
      setDebugSession(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'markdown' | 'claude-format') => {
    if (!debugSession) return;
    
    try {
      const { exportContent } = await exportDebugSession(debugSession.traceId, format);
      
      // Create and download the file
      const fileExtension = format === 'json' ? 'json' : 'md';
      const fileName = `debug-${format === 'claude-format' ? 'claude-' : ''}${debugSession.traceId.slice(0, 8)}.${fileExtension}`;
      
      if (typeof Blob !== 'undefined' && typeof document !== 'undefined') {
        const blob = new Blob([exportContent], { 
          type: format === 'json' ? 'application/json' : 'text/markdown' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export logs');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Debug Interface</h1>
          <p className="text-muted-foreground">
            Search and analyze logs across all systems with trace correlation
          </p>
        </div>
        {debugSession && (
          <ExportControls 
            onExport={handleExport}
            traceId={debugSession.traceId}
            logCount={debugSession.logs.length}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Trace Search</CardTitle>
            </CardHeader>
            <CardContent>
              <TraceSearchForm 
                onSearch={handleTraceSearch}
                loading={loading}
              />
            </CardContent>
          </Card>
        </div>
        
        <div>
          <RecentTraces 
            onSelectTrace={handleTraceSelect}
            loading={loading}
          />
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-destructive">
                <span className="text-sm font-medium">Debug Error:</span>
                <span className="text-sm">{error}</span>
              </div>
              
              {error.includes('Log ingestion worker URL not configured') && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 font-medium mb-2">⚙️ Configuration Required</p>
                  <div className="text-xs text-amber-700 space-y-1">
                    <p>The debug interface requires the log ingestion worker to be configured.</p>
                    <p className="font-mono bg-amber-100 px-2 py-1 rounded">
                      Add LOG_INGESTION_WORKER_URL to your environment variables
                    </p>
                    <p>Example: <code>LOG_INGESTION_WORKER_URL=https://your-worker.workers.dev</code></p>
                  </div>
                </div>
              )}
              
              {error.includes('Failed to fetch logs') && !error.includes('worker URL') && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium mb-2">💡 Troubleshooting Tips</p>
                  <div className="text-xs text-blue-700 space-y-1">
                    <p>• Check if the trace ID exists and has logs</p>
                    <p>• Verify the log ingestion worker is running</p>
                    <p>• Try generating some logs first (console.log, console.error, etc.)</p>
                    <p>• Use the "Debug Now" button for your current browser session</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">Fetching logs...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {debugSession && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TimelineViewer 
              logs={debugSession.logs}
              systemFilter={systemFilter}
              onSystemFilterChange={setSystemFilter}
            />
          </div>
          <div>
            <CorrelationPanel 
              correlationAnalysis={debugSession.correlationAnalysis}
              traceId={debugSession.traceId}
            />
          </div>
        </div>
      )}
    </div>
  );
}