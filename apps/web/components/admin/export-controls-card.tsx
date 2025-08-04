'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/lib/convex-api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@starter/ui';
import { Button } from '@starter/ui';
import { Input } from '@starter/ui';
import { Badge } from '@starter/ui';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@starter/ui';
import { Textarea } from '@starter/ui';
import { 
  Download, 
  Copy, 
  FileText, 
  Database,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface ExportControlsCardProps {
  refreshTrigger?: number;
}

interface ExportData {
  format: string;
  count: number;
  data: any;
}

export function ExportControlsCard({ refreshTrigger }: ExportControlsCardProps) {
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'text'>('json');
  const [filterType, setFilterType] = useState<'all' | 'trace' | 'user'>('all');
  const [filterId, setFilterId] = useState('');
  const [exportLimit, setExportLimit] = useState('1000');
  const [isExporting, setIsExporting] = useState(false);
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Build export query args
  const exportArgs = {
    format: exportFormat,
    limit: parseInt(exportLimit) || 1000,
    ...(filterType === 'trace' && filterId && { trace_id: filterId }),
    ...(filterType === 'user' && filterId && { user_id: filterId })
  };

  // Get preview data for current export settings
  const previewData = useQuery(api.debugLogs.exportLogs, exportArgs);

  const handleExport = async () => {
    if (!previewData) return;
    
    setIsExporting(true);
    setExportData(previewData);
    setIsExporting(false);
  };

  const handleCopyToClipboard = async () => {
    if (!exportData) return;

    try {
      let textToCopy = '';
      
      if (exportFormat === 'json') {
        textToCopy = JSON.stringify(exportData.data, null, 2);
      } else if (exportFormat === 'csv' || exportFormat === 'text') {
        textToCopy = exportData.data;
      }

      await navigator.clipboard.writeText(textToCopy);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleDownload = () => {
    if (!exportData) return;

    let content = '';
    let mimeType = 'text/plain';
    let filename = `debug-logs-${Date.now()}`;

    if (exportFormat === 'json') {
      content = JSON.stringify(exportData.data, null, 2);
      mimeType = 'application/json';
      filename += '.json';
    } else if (exportFormat === 'csv') {
      content = exportData.data;
      mimeType = 'text/csv';
      filename += '.csv';
    } else if (exportFormat === 'text') {
      content = exportData.data;
      mimeType = 'text/plain';
      filename += '.txt';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFormatDescription = () => {
    switch (exportFormat) {
      case 'json':
        return 'Structured JSON with full log context - ideal for programmatic analysis';
      case 'csv':
        return 'Comma-separated values for spreadsheet analysis';
      case 'text':
        return 'Human-readable chronological format - optimized for Claude Code analysis';
      default:
        return '';
    }
  };

  const getPreviewContent = () => {
    if (!previewData) return 'Loading preview...';
    
    if (exportFormat === 'json') {
      return JSON.stringify(previewData.data, null, 2).slice(0, 500) + '...';
    } else if (exportFormat === 'csv' || exportFormat === 'text') {
      return String(previewData.data).slice(0, 500) + '...';
    }
    
    return 'No preview available';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Controls
        </CardTitle>
        <CardDescription>
          Export debug logs in AI-optimized formats for analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Format Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Export Format</label>
            <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="text">Text (Claude-optimized)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter Type */}
          <div>
            <label className="text-sm font-medium mb-2 block">Filter By</label>
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Logs</SelectItem>
                <SelectItem value="trace">Specific Trace</SelectItem>
                <SelectItem value="user">Specific User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter ID Input */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {filterType === 'trace' ? 'Trace ID' : filterType === 'user' ? 'User ID' : 'Filter ID'}
            </label>
            <Input
              placeholder={
                filterType === 'trace' ? 'Enter trace ID...' :
                filterType === 'user' ? 'Enter user ID...' : 
                'No filter needed'
              }
              value={filterId}
              onChange={(e) => setFilterId(e.target.value)}
              disabled={filterType === 'all'}
            />
          </div>

          {/* Limit */}
          <div>
            <label className="text-sm font-medium mb-2 block">Limit</label>
            <Input
              type="number"
              placeholder="1000"
              value={exportLimit}
              onChange={(e) => setExportLimit(e.target.value)}
              min="1"
              max="10000"
            />
          </div>
        </div>

        {/* Format Description */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>{exportFormat.toUpperCase()}:</strong> {getFormatDescription()}
          </p>
        </div>

        {/* Export Stats Preview */}
        {previewData && (
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium flex items-center gap-2">
                <Database className="h-4 w-4" />
                Export Preview
              </h4>
              <Badge variant="outline">
                {previewData.count.toLocaleString()} logs ready
              </Badge>
            </div>
            
            <Textarea
              value={getPreviewContent()}
              readOnly
              className="font-mono text-xs"
              rows={8}
            />
            
            {previewData.count > 500 && (
              <p className="text-xs text-muted-foreground mt-2">
                Preview shows first 500 characters. Full export will include all {previewData.count.toLocaleString()} logs.
              </p>
            )}
          </div>
        )}

        {/* Export Actions */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleExport}
            disabled={isExporting || !previewData || previewData.count === 0}
            className="flex-1 md:flex-none"
          >
            {isExporting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Preparing Export...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Prepare Export
              </>
            )}
          </Button>

          {exportData && (
            <>
              <Button
                variant="outline"
                onClick={handleCopyToClipboard}
              >
                {copySuccess ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy to Clipboard
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download File
              </Button>
            </>
          )}
        </div>

        {/* Export Success */}
        {exportData && (
          <div className="border rounded-lg p-4 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium">Export Ready</span>
            </div>
            <div className="text-sm space-y-1">
              <p>
                <strong>{exportData.count.toLocaleString()}</strong> logs exported in <strong>{exportData.format.toUpperCase()}</strong> format
              </p>
              <p className="text-muted-foreground">
                Use &ldquo;Copy to Clipboard&rdquo; for quick Claude Code analysis or &ldquo;Download File&rdquo; for permanent storage
              </p>
            </div>
          </div>
        )}

        {/* Claude-Optimized Format Note */}
        {exportFormat === 'text' && (
          <div className="border rounded-lg p-4 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Claude Code Optimization</span>
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p>This text format is optimized for Claude Code analysis with:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Chronological ordering for timeline analysis</li>
                <li>Clear trace correlation markers</li>
                <li>Structured context preservation</li>
                <li>Human-readable timestamps</li>
              </ul>
            </div>
          </div>
        )}

        {/* Usage Instructions */}
        <div className="text-xs text-muted-foreground border-t pt-3 space-y-1">
          <p>• <strong>JSON format:</strong> Best for programmatic analysis and data processing</p>
          <p>• <strong>CSV format:</strong> Import into spreadsheets for manual analysis</p>
          <p>• <strong>Text format:</strong> Paste directly into Claude Code for AI-powered debugging</p>
        </div>
      </CardContent>
    </Card>
  );
}