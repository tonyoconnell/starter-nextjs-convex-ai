// @ts-nocheck
/**
 * Comprehensive tests for debug-logs page component
 * Tests: NODE_ENV restrictions, sidebar state management, refresh triggers, Redis integration
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DebugLogsPage from '@/app/debug-logs/page';

// Mock all child components
jest.mock('@/components/debug-logs/redis-stats-card', () => ({
  RedisStatsCard: ({ refreshTrigger, onStatsUpdate }: any) => {
    // Simulate stats update after refresh
    if (refreshTrigger > 0 && onStatsUpdate) {
      setTimeout(() => onStatsUpdate({ totalKeys: 100, memory: '1.2MB' }), 100);
    }
    return <div data-testid="redis-stats-card">Redis Stats (trigger: {refreshTrigger})</div>;
  },
}));

jest.mock('@/components/debug-logs/sync-controls-card', () => ({
  SyncControlsCard: ({ onSyncComplete, redisStats }: any) => (
    <div data-testid="sync-controls-card">
      Sync Controls (stats: {redisStats ? 'loaded' : 'none'})
      <button onClick={onSyncComplete} data-testid="mock-sync-button">
        Sync Complete
      </button>
    </div>
  ),
}));

jest.mock('@/components/debug-logs/debug-logs-table', () => ({
  DebugLogsTable: ({ refreshTrigger }: any) => (
    <div data-testid="debug-logs-table">Debug Logs Table (trigger: {refreshTrigger})</div>
  ),
}));

jest.mock('@/components/debug-logs/export-controls-card', () => ({
  ExportControlsCard: ({ refreshTrigger }: any) => (
    <div data-testid="export-controls-card">Export Controls (trigger: {refreshTrigger})</div>
  ),
}));

jest.mock('@/components/debug-logs/suppression-rules-panel', () => ({
  SuppressionRulesPanel: () => <div data-testid="suppression-rules-panel">Suppression Rules</div>,
}));

jest.mock('@starter/ui', () => ({
  Button: ({ children, onClick, variant, size, title, ...props }: any) => (
    <button onClick={onClick} title={title} data-variant={variant} data-size={size} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  RefreshCw: ({ className }: any) => <span className={className} data-testid="refresh-icon" />,
  PanelLeft: ({ className }: any) => <span className={className} data-testid="panel-left-icon" />,
  PanelLeftClose: ({ className }: any) => <span className={className} data-testid="panel-left-close-icon" />,
  AlertTriangle: ({ className }: any) => <span className={className} data-testid="alert-triangle-icon" />,
}));

describe('DebugLogsPage', () => {
  let originalEnv: string | undefined;
  const user = userEvent.setup();

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.NODE_ENV = originalEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  });

  describe('Environment Restrictions', () => {
    it('should show development-only message in production', () => {
      process.env.NODE_ENV = 'production';

      render(<DebugLogsPage />);

      expect(screen.getByText('Development Only')).toBeInTheDocument();
      expect(screen.getByText('Debug logs are only available in development environment.')).toBeInTheDocument();
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
      expect(screen.getByText('Return to Home')).toBeInTheDocument();
    });

    it('should show development-only message in test environment', () => {
      process.env.NODE_ENV = 'test';

      render(<DebugLogsPage />);

      expect(screen.getByText('Development Only')).toBeInTheDocument();
      expect(screen.queryByText('Debug Logs Dashboard')).not.toBeInTheDocument();
    });

    it('should render full dashboard in development environment', () => {
      process.env.NODE_ENV = 'development';

      render(<DebugLogsPage />);

      expect(screen.getByText('Debug Logs Dashboard')).toBeInTheDocument();
      expect(screen.queryByText('Development Only')).not.toBeInTheDocument();
    });

    it('should handle undefined NODE_ENV as production', () => {
      delete process.env.NODE_ENV;

      render(<DebugLogsPage />);

      expect(screen.getByText('Development Only')).toBeInTheDocument();
    });
  });

  describe('Sidebar State Management', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should render sidebar open by default', () => {
      render(<DebugLogsPage />);

      const sidebar = screen.getByText('CONTROLS').closest('div').parentElement;
      expect(sidebar).toHaveClass('w-[420px]');
      expect(screen.getByTestId('panel-left-close-icon')).toBeInTheDocument();
    });

    it('should close sidebar when close button clicked', async () => {
      render(<DebugLogsPage />);

      const closeButton = screen.getByTitle('Close sidebar');
      await user.click(closeButton);

      const sidebar = screen.getByText('CONTROLS').closest('div').parentElement;
      expect(sidebar).toHaveClass('w-0');
    });

    it('should open sidebar when open button clicked', async () => {
      render(<DebugLogsPage />);

      // First close the sidebar
      const closeButton = screen.getByTitle('Close sidebar');
      await user.click(closeButton);

      // Then open it
      const openButton = screen.getByTitle('Open sidebar');
      await user.click(openButton);

      const sidebar = screen.getByText('CONTROLS').closest('div').parentElement;
      expect(sidebar).toHaveClass('w-[420px]');
    });

    it('should show open button only when sidebar is closed', async () => {
      render(<DebugLogsPage />);

      // Initially sidebar is open, no open button
      expect(screen.queryByTitle('Open sidebar')).not.toBeInTheDocument();

      // Close sidebar
      const closeButton = screen.getByTitle('Close sidebar');
      await user.click(closeButton);

      // Now open button should be visible
      expect(screen.getByTitle('Open sidebar')).toBeInTheDocument();
    });
  });

  describe('Refresh Functionality', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should initialize with refresh key of 0', () => {
      render(<DebugLogsPage />);

      expect(screen.getByText('Redis Stats (trigger: 0)')).toBeInTheDocument();
      expect(screen.getByText('Debug Logs Table (trigger: 0)')).toBeInTheDocument();
      expect(screen.getByText('Export Controls (trigger: 0)')).toBeInTheDocument();
    });

    it('should increment refresh key when refresh button clicked', async () => {
      render(<DebugLogsPage />);

      const refreshButton = screen.getByText('Refresh All');
      await user.click(refreshButton);

      expect(screen.getByText('Redis Stats (trigger: 1)')).toBeInTheDocument();
      expect(screen.getByText('Debug Logs Table (trigger: 1)')).toBeInTheDocument();
      expect(screen.getByText('Export Controls (trigger: 1)')).toBeInTheDocument();
    });

    it('should increment refresh key multiple times', async () => {
      render(<DebugLogsPage />);

      const refreshButton = screen.getByText('Refresh All');
      
      await user.click(refreshButton);
      expect(screen.getByText('Redis Stats (trigger: 1)')).toBeInTheDocument();

      await user.click(refreshButton);
      expect(screen.getByText('Redis Stats (trigger: 2)')).toBeInTheDocument();
    });

    it('should trigger refresh when sync completes', async () => {
      render(<DebugLogsPage />);

      const syncButton = screen.getByTestId('mock-sync-button');
      await user.click(syncButton);

      expect(screen.getByText('Redis Stats (trigger: 1)')).toBeInTheDocument();
      expect(screen.getByText('Debug Logs Table (trigger: 1)')).toBeInTheDocument();
    });
  });

  describe('Redis Stats Integration', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should initialize with no Redis stats', () => {
      render(<DebugLogsPage />);

      expect(screen.getByText('Sync Controls (stats: none)')).toBeInTheDocument();
    });

    it('should update Redis stats when callback is triggered', async () => {
      render(<DebugLogsPage />);

      // Trigger refresh to simulate stats update
      const refreshButton = screen.getByText('Refresh All');
      await user.click(refreshButton);

      // Wait for the mocked stats update
      await waitFor(() => {
        expect(screen.getByText('Sync Controls (stats: loaded)')).toBeInTheDocument();
      });
    });

    it('should pass stats to sync controls component', async () => {
      render(<DebugLogsPage />);

      const refreshButton = screen.getByText('Refresh All');
      await user.click(refreshButton);

      await waitFor(() => {
        expect(screen.getByText('Sync Controls (stats: loaded)')).toBeInTheDocument();
      });
    });
  });

  describe('Component Structure and Layout', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should render all required sidebar components', () => {
      render(<DebugLogsPage />);

      expect(screen.getByTestId('redis-stats-card')).toBeInTheDocument();
      expect(screen.getByTestId('sync-controls-card')).toBeInTheDocument();
      expect(screen.getByTestId('suppression-rules-panel')).toBeInTheDocument();
    });

    it('should render all required main content components', () => {
      render(<DebugLogsPage />);

      expect(screen.getByTestId('debug-logs-table')).toBeInTheDocument();
      expect(screen.getByTestId('export-controls-card')).toBeInTheDocument();
    });

    it('should render navigation elements', () => {
      render(<DebugLogsPage />);

      expect(screen.getByText('Debug Logs Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Back to Home')).toBeInTheDocument();
      expect(screen.getByText('Refresh All')).toBeInTheDocument();
    });

    it('should have proper accessibility attributes', () => {
      render(<DebugLogsPage />);

      const closeButton = screen.getByTitle('Close sidebar');
      expect(closeButton).toHaveAttribute('title', 'Close sidebar');
    });
  });

  describe('User Interactions', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should handle rapid sidebar toggle', async () => {
      render(<DebugLogsPage />);

      const closeButton = screen.getByTitle('Close sidebar');
      
      // Rapid toggle test
      await user.click(closeButton);
      const openButton = screen.getByTitle('Open sidebar');
      await user.click(openButton);
      await user.click(screen.getByTitle('Close sidebar'));

      const sidebar = screen.getByText('CONTROLS').closest('div').parentElement;
      expect(sidebar).toHaveClass('w-0');
    });

    it('should handle multiple refresh triggers', async () => {
      render(<DebugLogsPage />);

      // Refresh multiple times quickly
      const refreshButton = screen.getByText('Refresh All');
      await user.click(refreshButton);
      await user.click(refreshButton);
      
      const syncButton = screen.getByTestId('mock-sync-button');
      await user.click(syncButton);

      // Should have accumulated refresh triggers
      expect(screen.getByText('Redis Stats (trigger: 3)')).toBeInTheDocument();
    });
  });
});