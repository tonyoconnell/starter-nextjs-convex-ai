// @ts-nocheck
/**
 * Comprehensive tests for DebugLogsTable component
 * Tests: filtering, sorting, expandable rows, badge categorization, query integration
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DebugLogsTable } from '@/components/debug-logs/debug-logs-table';

// Mock Convex hooks
const mockUseQuery = jest.fn();
jest.mock('convex/react', () => ({
  useQuery: mockUseQuery,
}));

// Mock Convex API
jest.mock('@/lib/convex-api', () => ({
  api: {
    debugLogs: {
      listLogs: 'debugLogs/listLogs',
      getLogStats: 'debugLogs/getLogStats',
    },
  },
}));

// Mock UI components
jest.mock('@starter/ui', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div data-testid="card-content" {...props}>{children}</div>,
  CardDescription: ({ children, ...props }: any) => <div data-testid="card-description" {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div data-testid="card-header" {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div data-testid="card-title" {...props}>{children}</div>,
  Button: ({ children, onClick, variant, size, disabled, title, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      title={title}
      data-variant={variant} 
      data-size={size} 
      {...props}
    >
      {children}
    </button>
  ),
  Input: ({ value, onChange, placeholder, className, ...props }: any) => (
    <input 
      value={value || ''} 
      onChange={onChange} 
      placeholder={placeholder} 
      className={className}
      {...props}
    />
  ),
  Badge: ({ children, variant, className, ...props }: any) => (
    <span data-variant={variant} className={className} {...props}>{children}</span>
  ),
  Select: ({ value, onValueChange, children }: any) => (
    <select 
      value={value} 
      onChange={(e) => onValueChange(e.target.value)}
      data-testid="select"
    >
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => children,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  Table: ({ children, ...props }: any) => <table {...props}>{children}</table>,
  TableBody: ({ children, ...props }: any) => <tbody {...props}>{children}</tbody>,
  TableCell: ({ children, colSpan, className, ...props }: any) => (
    <td colSpan={colSpan} className={className} {...props}>{children}</td>
  ),
  TableHead: ({ children, className, ...props }: any) => (
    <th className={className} {...props}>{children}</th>
  ),
  TableHeader: ({ children, ...props }: any) => <thead {...props}>{children}</thead>,
  TableRow: ({ children, className, ...props }: any) => (
    <tr className={className} {...props}>{children}</tr>
  ),
  Collapsible: ({ children }: any) => <>{children}</>,
  CollapsibleContent: ({ children }: any) => <div data-testid="collapsible-content">{children}</div>,
  CollapsibleTrigger: ({ children }: any) => children,
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Search: ({ className }: any) => <span className={className} data-testid="search-icon" />,
  Filter: ({ className }: any) => <span className={className} data-testid="filter-icon" />,
  ChevronDown: ({ className }: any) => <span className={className} data-testid="chevron-down-icon" />,
  ChevronRight: ({ className }: any) => <span className={className} data-testid="chevron-right-icon" />,
  RefreshCw: ({ className }: any) => <span className={className} data-testid="refresh-icon" />,
  Calendar: ({ className }: any) => <span className={className} data-testid="calendar-icon" />,
  User: ({ className }: any) => <span className={className} data-testid="user-icon" />,
  Activity: ({ className }: any) => <span className={className} data-testid="activity-icon" />,
  ArrowUp: ({ className }: any) => <span className={className} data-testid="arrow-up-icon" />,
  ArrowDown: ({ className }: any) => <span className={className} data-testid="arrow-down-icon" />,
}));

describe('DebugLogsTable', () => {
  const user = userEvent.setup();

  const mockLogData = [
    {
      _id: 'log1',
      id: 'log1',
      trace_id: 'trace_123456789',
      user_id: 'user@example.com',
      system: 'browser' as const,
      level: 'error' as const,
      message: 'This is an error message',
      timestamp: 1703980800000, // Dec 30, 2023
      context: { url: 'http://localhost:3000' },
      stack: 'Error: Test error\\n  at test:1:1',
      raw_data: { original: 'data' },
      synced_at: 1703980900000,
    },
    {
      _id: 'log2',
      id: 'log2',
      trace_id: 'trace_987654321',
      user_id: 'admin@example.com',
      system: 'convex' as const,
      level: 'warn' as const,
      message: 'This is a warning message',
      timestamp: 1703980700000,
      context: { function: 'testMutation' },
      raw_data: { original: 'data' },
      synced_at: 1703980800000,
    },
    {
      _id: 'log3',
      id: 'log3',
      trace_id: 'trace_111222333',
      system: 'worker' as const,
      level: 'info' as const,
      message: 'This is an info message',
      timestamp: 1703980600000,
      raw_data: { original: 'data' },
      synced_at: 1703980700000,
    },
  ];

  const mockStats = {
    totalLogs: 150,
    bySystem: { browser: 60, convex: 50, worker: 30, manual: 10 },
    byLevel: { log: 80, info: 30, warn: 25, error: 15 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockUseQuery.mockImplementation((api) => {
      if (api === 'debugLogs/listLogs') {
        return mockLogData;
      }
      if (api === 'debugLogs/getLogStats') {
        return mockStats;
      }
      return undefined;
    });
  });

  describe('Initial Rendering', () => {
    it('should render table header with correct title and stats', () => {
      render(<DebugLogsTable />);

      expect(screen.getByText('Debug Logs Table')).toBeInTheDocument();
      expect(screen.getByText('150 total logs')).toBeInTheDocument();
      expect(screen.getByTestId('activity-icon')).toBeInTheDocument();
    });

    it('should render filter controls', () => {
      render(<DebugLogsTable />);

      expect(screen.getByPlaceholderText('Search messages...')).toBeInTheDocument();
      expect(screen.getByText('All Systems')).toBeInTheDocument();
      expect(screen.getByText('All Levels')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Trace ID...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('User ID...')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(<DebugLogsTable />);

      expect(screen.getByText('Newest')).toBeInTheDocument();
      expect(screen.getByText('App Only')).toBeInTheDocument();
      expect(screen.getByText('Clear')).toBeInTheDocument();
    });

    it('should render table headers', () => {
      render(<DebugLogsTable />);

      expect(screen.getByText('Timestamp')).toBeInTheDocument();
      expect(screen.getByText('System')).toBeInTheDocument();
      expect(screen.getByText('Level')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('Trace ID')).toBeInTheDocument();
      expect(screen.getByText('Message')).toBeInTheDocument();
    });
  });

  describe('Log Data Display', () => {
    it('should display log entries with correct data', () => {
      render(<DebugLogsTable />);

      expect(screen.getByText('This is an error message')).toBeInTheDocument();
      expect(screen.getByText('This is a warning message')).toBeInTheDocument();
      expect(screen.getByText('This is an info message')).toBeInTheDocument();
    });

    it('should format timestamps correctly', () => {
      render(<DebugLogsTable />);

      // Check that timestamps are displayed (exact format may vary by locale)
      const timestampElements = screen.getAllByText(/Dec|12\/30|2023/);
      expect(timestampElements.length).toBeGreaterThan(0);
    });

    it('should display system badges with correct variants', () => {
      render(<DebugLogsTable />);

      const systemBadges = screen.getAllByText(/browser|convex|worker/);
      expect(systemBadges.length).toBe(3);
    });

    it('should display level badges with correct variants', () => {
      render(<DebugLogsTable />);

      const levelBadges = screen.getAllByText(/error|warn|info/);
      expect(levelBadges.length).toBe(3);
    });

    it('should truncate long user IDs and trace IDs', () => {
      render(<DebugLogsTable />);

      // Check for truncated trace IDs (first 8 chars + ...)
      expect(screen.getByText('trace_12...')).toBeInTheDocument();
      expect(screen.getByText('trace_98...')).toBeInTheDocument();
    });

    it('should handle missing user IDs', () => {
      render(<DebugLogsTable />);

      // Log3 has no user_id, should show "—"
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('Row Expansion', () => {
    it('should expand row when chevron is clicked', async () => {
      render(<DebugLogsTable />);

      const expandButtons = screen.getAllByTestId('chevron-right-icon');
      await user.click(expandButtons[0].parentElement);

      // Should show expanded content
      expect(screen.getByTestId('collapsible-content')).toBeInTheDocument();
    });

    it('should collapse row when chevron is clicked again', async () => {
      render(<DebugLogsTable />);

      const expandButtons = screen.getAllByTestId('chevron-right-icon');
      const firstButton = expandButtons[0].parentElement;
      
      // Expand
      await user.click(firstButton);
      expect(screen.getByTestId('collapsible-content')).toBeInTheDocument();

      // Collapse (icon should change to chevron-down)
      const collapseButton = screen.getByTestId('chevron-down-icon').parentElement;
      await user.click(collapseButton);
    });

    it('should track multiple expanded rows independently', async () => {
      render(<DebugLogsTable />);

      const expandButtons = screen.getAllByTestId('chevron-right-icon');
      
      // Expand first row
      await user.click(expandButtons[0].parentElement);
      
      // Expand second row
      await user.click(expandButtons[1].parentElement);

      // Both should be expanded
      const expandedContent = screen.getAllByTestId('collapsible-content');
      expect(expandedContent).toHaveLength(2);
    });
  });

  describe('Filtering Functionality', () => {
    it('should update search term and query parameters', async () => {
      render(<DebugLogsTable />);

      const searchInput = screen.getByPlaceholderText('Search messages...');
      await user.type(searchInput, 'error');

      expect(searchInput).toHaveValue('error');
      
      // Should call query with search parameter
      await waitFor(() => {
        expect(mockUseQuery).toHaveBeenCalledWith('debugLogs/listLogs', 
          expect.objectContaining({ search: 'error' }));
      });
    });

    it('should filter by system', async () => {
      render(<DebugLogsTable />);

      const systemSelect = screen.getAllByTestId('select')[0];
      fireEvent.change(systemSelect, { target: { value: 'browser' } });

      await waitFor(() => {
        expect(mockUseQuery).toHaveBeenCalledWith('debugLogs/listLogs', 
          expect.objectContaining({ system: 'browser' }));
      });
    });

    it('should filter by level', async () => {
      render(<DebugLogsTable />);

      const levelSelect = screen.getAllByTestId('select')[1];
      fireEvent.change(levelSelect, { target: { value: 'error' } });

      await waitFor(() => {
        expect(mockUseQuery).toHaveBeenCalledWith('debugLogs/listLogs', 
          expect.objectContaining({ level: 'error' }));
      });
    });

    it('should filter by trace ID', async () => {
      render(<DebugLogsTable />);

      const traceInput = screen.getByPlaceholderText('Trace ID...');
      await user.type(traceInput, 'trace_123');

      await waitFor(() => {
        expect(mockUseQuery).toHaveBeenCalledWith('debugLogs/listLogs', 
          expect.objectContaining({ trace_id: 'trace_123' }));
      });
    });

    it('should filter by user ID', async () => {
      render(<DebugLogsTable />);

      const userInput = screen.getByPlaceholderText('User ID...');
      await user.type(userInput, 'user@example.com');

      await waitFor(() => {
        expect(mockUseQuery).toHaveBeenCalledWith('debugLogs/listLogs', 
          expect.objectContaining({ user_id: 'user@example.com' }));
      });
    });

    it('should clear all filters when clear button is clicked', async () => {
      render(<DebugLogsTable />);

      // Set some filters
      const searchInput = screen.getByPlaceholderText('Search messages...');
      await user.type(searchInput, 'test');

      const systemSelect = screen.getAllByTestId('select')[0];
      fireEvent.change(systemSelect, { target: { value: 'browser' } });

      // Clear filters
      const clearButton = screen.getByText('Clear');
      await user.click(clearButton);

      expect(searchInput).toHaveValue('');
      expect(systemSelect).toHaveValue('all');
    });

    it('should disable clear button when no filters are active', () => {
      render(<DebugLogsTable />);

      const clearButton = screen.getByText('Clear');
      expect(clearButton).toBeDisabled();
    });

    it('should enable clear button when filters are active', async () => {
      render(<DebugLogsTable />);

      const searchInput = screen.getByPlaceholderText('Search messages...');
      await user.type(searchInput, 'test');

      const clearButton = screen.getByText('Clear');
      expect(clearButton).not.toBeDisabled();
    });
  });

  describe('Sorting Functionality', () => {
    it('should toggle sort order when sort button is clicked', async () => {
      render(<DebugLogsTable />);

      const sortButton = screen.getByText('Newest');
      await user.click(sortButton);

      expect(screen.getByText('Oldest')).toBeInTheDocument();
      expect(screen.getByTestId('arrow-up-icon')).toBeInTheDocument();

      await waitFor(() => {
        expect(mockUseQuery).toHaveBeenCalledWith('debugLogs/listLogs', 
          expect.objectContaining({ chronological: true }));
      });
    });

    it('should show correct sort indicators', () => {
      render(<DebugLogsTable />);

      // Initially newest first (chronological: false)
      expect(screen.getByText('Newest')).toBeInTheDocument();
      expect(screen.getByTestId('arrow-down-icon')).toBeInTheDocument();
    });

    it('should update description based on sort order', async () => {
      render(<DebugLogsTable />);

      expect(screen.getByText(/Reverse chronological view/)).toBeInTheDocument();

      const sortButton = screen.getByText('Newest');
      await user.click(sortButton);

      expect(screen.getByText(/Chronological view/)).toBeInTheDocument();
    });
  });

  describe('Quick Filter Actions', () => {
    it('should set browser filter when App Only is clicked', async () => {
      render(<DebugLogsTable />);

      const appOnlyButton = screen.getByText('App Only');
      await user.click(appOnlyButton);

      await waitFor(() => {
        expect(mockUseQuery).toHaveBeenCalledWith('debugLogs/listLogs', 
          expect.objectContaining({ system: 'browser' }));
      });
    });

    it('should disable App Only button when browser filter is active', async () => {
      render(<DebugLogsTable />);

      const systemSelect = screen.getAllByTestId('select')[0];
      fireEvent.change(systemSelect, { target: { value: 'browser' } });

      const appOnlyButton = screen.getByText('App Only');
      expect(appOnlyButton).toBeDisabled();
    });
  });

  describe('Loading and Empty States', () => {
    it('should show loading state when logs are undefined', () => {
      mockUseQuery.mockImplementation((api) => {
        if (api === 'debugLogs/listLogs') {
          return undefined;
        }
        if (api === 'debugLogs/getLogStats') {
          return mockStats;
        }
        return undefined;
      });

      render(<DebugLogsTable />);

      expect(screen.getByText('Loading logs...')).toBeInTheDocument();
      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
    });

    it('should show empty state when no logs exist', () => {
      mockUseQuery.mockImplementation((api) => {
        if (api === 'debugLogs/listLogs') {
          return [];
        }
        if (api === 'debugLogs/getLogStats') {
          return mockStats;
        }
        return undefined;
      });

      render(<DebugLogsTable />);

      expect(screen.getByText('No logs synced yet')).toBeInTheDocument();
    });

    it('should show filtered empty state when filters return no results', async () => {
      mockUseQuery.mockImplementation((api) => {
        if (api === 'debugLogs/listLogs') {
          return [];
        }
        if (api === 'debugLogs/getLogStats') {
          return mockStats;
        }
        return undefined;
      });

      render(<DebugLogsTable />);

      // Set a filter to make hasActiveFilters true
      const searchInput = screen.getByPlaceholderText('Search messages...');
      await user.type(searchInput, 'nonexistent');

      expect(screen.getByText('No logs match your filters')).toBeInTheDocument();
    });
  });

  describe('Badge Variant Logic', () => {
    it('should use correct variants for level badges', () => {
      render(<DebugLogsTable />);

      // Check that badges have correct data-variant attributes
      const badges = screen.getAllByText(/error|warn|info/);
      badges.forEach(badge => {
        expect(badge).toHaveAttribute('data-variant');
      });
    });

    it('should use correct variants for system badges', () => {
      render(<DebugLogsTable />);

      const badges = screen.getAllByText(/browser|convex|worker/);
      badges.forEach(badge => {
        expect(badge).toHaveAttribute('data-variant');
      });
    });
  });

  describe('Query Parameter Management', () => {
    it('should build query args correctly with all filters', async () => {
      render(<DebugLogsTable />);

      // Set multiple filters
      const searchInput = screen.getByPlaceholderText('Search messages...');
      await user.type(searchInput, 'test message');

      const systemSelect = screen.getAllByTestId('select')[0];
      fireEvent.change(systemSelect, { target: { value: 'browser' } });

      const levelSelect = screen.getAllByTestId('select')[1];
      fireEvent.change(levelSelect, { target: { value: 'error' } });

      const traceInput = screen.getByPlaceholderText('Trace ID...');
      await user.type(traceInput, 'trace_123');

      const userInput = screen.getByPlaceholderText('User ID...');
      await user.type(userInput, 'user@example.com');

      await waitFor(() => {
        expect(mockUseQuery).toHaveBeenCalledWith('debugLogs/listLogs', {
          limit: 100,
          chronological: false,
          search: 'test message',
          system: 'browser',
          level: 'error',
          trace_id: 'trace_123',
          user_id: 'user@example.com',
        });
      });
    });

    it('should exclude empty filter values from query args', () => {
      render(<DebugLogsTable />);

      // Initial call should only have default parameters
      expect(mockUseQuery).toHaveBeenCalledWith('debugLogs/listLogs', {
        limit: 100,
        chronological: false,
      });
    });
  });

  describe('Accessibility and UX', () => {
    it('should have appropriate button titles for tooltips', () => {
      render(<DebugLogsTable />);

      const sortButton = screen.getByText('Newest');
      expect(sortButton).toHaveAttribute('title', 
        'Sort: Newest First (click for Oldest First)');

      const appOnlyButton = screen.getByText('App Only');
      expect(appOnlyButton).toHaveAttribute('title', 
        'Show only browser/application logs (exclude system logs)');
    });

    it('should show full message in title attribute for truncated messages', () => {
      render(<DebugLogsTable />);

      const messageElements = screen.getAllByTitle(/This is .* message/);
      expect(messageElements.length).toBeGreaterThan(0);
    });

    it('should have proper semantic table structure', () => {
      render(<DebugLogsTable />);

      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });
});