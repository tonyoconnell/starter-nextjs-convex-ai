'use client';

import { useState } from 'react';
import { Button } from '@starter/ui/button';
import { Input } from '@starter/ui/input';
import { Label } from '@starter/ui/label';
import { Checkbox } from '@starter/ui/checkbox';
import { Card } from '@starter/ui/card';

interface TraceSearchFormProps {
  onSearch: (traceId: string, systemFilters: string[]) => void;
  loading: boolean;
}

const SYSTEM_OPTIONS = [
  { id: 'browser', label: 'Browser', color: 'bg-blue-500' },
  { id: 'convex', label: 'Convex', color: 'bg-green-500' },
  { id: 'worker', label: 'Worker', color: 'bg-purple-500' },
  { id: 'manual', label: 'Manual', color: 'bg-orange-500' }
];

export default function TraceSearchForm({ onSearch, loading }: TraceSearchFormProps) {
  const [traceId, setTraceId] = useState('');
  const [systemFilters, setSystemFilters] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (traceId.trim()) {
      onSearch(traceId.trim(), systemFilters);
    }
  };

  const handleSystemFilterChange = (systemId: string, checked: boolean) => {
    setSystemFilters(prev => 
      checked 
        ? [...prev, systemId]
        : prev.filter(id => id !== systemId)
    );
  };

  const clearFilters = () => {
    setSystemFilters([]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="traceId">Trace ID</Label>
          <Input
            id="traceId"
            type="text"
            placeholder="Enter trace ID to search logs..."
            value={traceId}
            onChange={(e) => setTraceId(e.target.value)}
            disabled={loading}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Enter the correlation ID from your logs to fetch related entries
          </p>
        </div>

        <div className="space-y-2">
          <Label>System Filters</Label>
          <Card className="p-3">
            <div className="grid grid-cols-2 gap-2">
              {SYSTEM_OPTIONS.map((system) => (
                <div key={system.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={system.id}
                    checked={systemFilters.includes(system.id)}
                    onCheckedChange={(checked) => 
                      handleSystemFilterChange(system.id, !!checked)
                    }
                    disabled={loading}
                  />
                  <Label 
                    htmlFor={system.id}
                    className="flex items-center space-x-2 text-sm cursor-pointer"
                  >
                    <div className={`w-3 h-3 rounded-full ${system.color}`} />
                    <span>{system.label}</span>
                  </Label>
                </div>
              ))}
            </div>
            {systemFilters.length > 0 && (
              <div className="mt-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  disabled={loading}
                  className="text-xs"
                >
                  Clear Filters ({systemFilters.length})
                </Button>
              </div>
            )}
          </Card>
          <p className="text-xs text-muted-foreground">
            Filter logs by system origin (leave empty for all systems)
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button 
          type="submit" 
          disabled={loading || !traceId.trim()}
          className="min-w-[120px]"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Searching...
            </>
          ) : (
            'Search Logs'
          )}
        </Button>
        
        {traceId && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setTraceId('')}
            disabled={loading}
          >
            Clear
          </Button>
        )}
      </div>

      {systemFilters.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Filtering by: {systemFilters.join(', ')}
        </div>
      )}
    </form>
  );
}