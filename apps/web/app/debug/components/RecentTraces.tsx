'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { Button } from '@starter/ui/button';
import { Badge } from '@starter/ui/badge';
import { Clock, Search } from 'lucide-react';

interface RecentTracesProps {
  onSelectTrace: (traceId: string) => void;
  loading: boolean;
}

// Mock recent traces for demo purposes
// In a real implementation, this would come from an API
const generateMockTraces = () => {
  const traces = [];
  const now = Date.now();
  
  // Generate some realistic trace IDs based on the format used in console-override.ts
  for (let i = 0; i < 8; i++) {
    const timestamp = now - (i * 300000); // 5 minutes apart
    const randomSuffix = Math.random().toString(36).substr(2, 9);
    traces.push({
      id: `trace_${timestamp}_${randomSuffix}`,
      timestamp,
      logCount: Math.floor(Math.random() * 50) + 5,
      systems: ['browser', 'convex', 'worker'].slice(0, Math.floor(Math.random() * 3) + 1),
      hasErrors: Math.random() > 0.7
    });
  }
  
  return traces;
};

export default function RecentTraces({ onSelectTrace, loading }: RecentTracesProps) {
  const [recentTraces, setRecentTraces] = useState<ReturnType<typeof generateMockTraces>>([]);

  useEffect(() => {
    // For demo purposes, generate mock data
    // In production, this would fetch from your backend
    setRecentTraces(generateMockTraces());
  }, []);

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (recentTraces.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Recent Traces</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">No recent traces found</p>
            <p className="text-xs">Generate some logs to see traces here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Recent Traces</span>
          </CardTitle>
          <Badge variant="secondary">{recentTraces.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {recentTraces.map((trace) => (
            <div 
              key={trace.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="text-xs font-mono text-muted-foreground truncate">
                    {trace.id}
                  </p>
                  {trace.hasErrors && (
                    <Badge variant="destructive" className="text-xs">Error</Badge>
                  )}
                </div>
                <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                  <span>{formatTimestamp(trace.timestamp)}</span>
                  <span>{trace.logCount} logs</span>
                  <div className="flex space-x-1">
                    {trace.systems.map(system => (
                      <Badge key={system} variant="outline" className="text-xs">
                        {system}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onSelectTrace(trace.id)}
                disabled={loading}
                className="ml-2 h-8 w-8 p-0"
              >
                <Search className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
        
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            💡 Tip: Click the search icon to debug a specific trace, or use "Debug Now" 
            for your current browser session above.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}