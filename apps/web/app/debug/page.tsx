'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import TraceSearchForm from './components/TraceSearchForm';
import TimelineViewer from './components/TimelineViewer';
import CorrelationPanel from './components/CorrelationPanel';
import ExportControls from './components/ExportControls';
import { fetchLogsForTrace, exportDebugSession } from './lib/debug-api';
import type { DebugSession } from './lib/debug-api';

export default function DebugPage() {
  const [debugSession, setDebugSession] = useState<DebugSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [systemFilter, setSystemFilter] = useState<string[]>([]);

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

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-destructive">
              <span className="text-sm font-medium">Error:</span>
              <span className="text-sm">{error}</span>
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