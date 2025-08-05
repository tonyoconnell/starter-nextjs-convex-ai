/**
 * Comprehensive test suite for VersionFlashNotification component
 * Tests component rendering, user interactions, auto-hide behavior, and edge cases
 */

import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VersionFlashNotification from '@/components/dev/version-flash-notification';
import * as versionStorage from '@/lib/version-storage';
import * as versionUtils from '@/lib/version-utils';

// Mock the dependencies
jest.mock('@/lib/version-storage');
jest.mock('@/lib/version-utils');
jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="animate-presence">{children}</div>
  ),
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

const mockVersionStorage = versionStorage as jest.Mocked<typeof versionStorage>;
const mockVersionUtils = versionUtils as jest.Mocked<typeof versionUtils>;

describe('VersionFlashNotification', () => {
  const mockVersionManifest = {
    success: true,
    data: {
      versions: [
        {
          version: '1.2.3',
          commitHash: 'abc123def456',
          timestamp: 1640995200,
          description: 'feat: add new feature',
          commitUrl: 'https://github.com/owner/repo/commit/abc123def456',
        },
      ],
      current: '1.2.3',
      lastUpdated: 1640995200,
    },
  };

  const mockVersionCheck = {
    hasNewVersion: true,
    previousVersion: '1.2.2',
    shouldShowFlash: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock version utilities
    mockVersionUtils.fetchVersionManifest.mockResolvedValue(
      mockVersionManifest
    );
    mockVersionUtils.formatRelativeTime.mockReturnValue('2 hours ago');
    mockVersionUtils.extractCommitType.mockReturnValue('feat');
    mockVersionUtils.truncateCommitMessage.mockImplementation(
      (msg, length = 50) =>
        msg.length > length ? msg.substring(0, length - 3) + '...' : msg
    );
    mockVersionUtils.getVersionIncrementType.mockReturnValue('minor');

    // Mock version storage
    mockVersionStorage.checkForNewVersion.mockReturnValue(mockVersionCheck);
    mockVersionStorage.markFlashNotificationShown.mockReturnValue(true);
    mockVersionStorage.markVersionAsSeen.mockReturnValue(true);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Component Rendering', () => {
    it('should not render when no new version is available', async () => {
      mockVersionStorage.checkForNewVersion.mockReturnValue({
        hasNewVersion: false,
        previousVersion: null,
        shouldShowFlash: false,
      });

      render(<VersionFlashNotification />);

      // Wait for async operations
      await act(async () => {
        jest.runAllTimers();
      });

      expect(
        screen.queryByText('New Version Deployed!')
      ).not.toBeInTheDocument();
    });

    it('should not render when shouldShowFlash is false', async () => {
      mockVersionStorage.checkForNewVersion.mockReturnValue({
        hasNewVersion: true,
        previousVersion: '1.2.2',
        shouldShowFlash: false,
      });

      render(<VersionFlashNotification />);

      await act(async () => {
        jest.runAllTimers();
      });

      expect(
        screen.queryByText('New Version Deployed!')
      ).not.toBeInTheDocument();
    });

    it('should render notification for new versions', async () => {
      render(<VersionFlashNotification />);

      await waitFor(() => {
        expect(screen.getByText('New Version Deployed!')).toBeInTheDocument();
      });

      // Check version display
      expect(screen.getByText('v1.2.3')).toBeInTheDocument();
      expect(screen.getByText('minor')).toBeInTheDocument();
      expect(screen.getByText('2 hours ago')).toBeInTheDocument();
      expect(screen.getByText('feat')).toBeInTheDocument();
      expect(screen.getByText('feat: add new feature')).toBeInTheDocument();
    });

    it('should show previous version when available', async () => {
      render(<VersionFlashNotification />);

      await waitFor(() => {
        expect(screen.getByText('Updated from v1.2.2')).toBeInTheDocument();
      });
    });

    it('should not show previous version when unknown', async () => {
      mockVersionStorage.checkForNewVersion.mockReturnValue({
        hasNewVersion: true,
        previousVersion: null,
        shouldShowFlash: true,
      });

      render(<VersionFlashNotification />);

      await waitFor(() => {
        expect(screen.getByText('New Version Deployed!')).toBeInTheDocument();
      });

      expect(screen.queryByText(/Updated from/)).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle dismiss button click', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const onDismiss = jest.fn();

      render(<VersionFlashNotification onDismiss={onDismiss} />);

      await waitFor(() => {
        expect(screen.getByText('New Version Deployed!')).toBeInTheDocument();
      });

      const dismissButton = screen.getByRole('button', { name: /close/i });
      await user.click(dismissButton);

      expect(mockVersionStorage.markVersionAsSeen).toHaveBeenCalledWith(
        '1.2.3'
      );
      expect(onDismiss).toHaveBeenCalled();
    });

    it('should handle view details button click', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const onViewDetails = jest.fn();

      render(<VersionFlashNotification onViewDetails={onViewDetails} />);

      await waitFor(() => {
        expect(screen.getByText('New Version Deployed!')).toBeInTheDocument();
      });

      const viewDetailsButton = screen.getByText('View Details');
      await user.click(viewDetailsButton);

      expect(onViewDetails).toHaveBeenCalledWith('1.2.3');
      expect(mockVersionStorage.markVersionAsSeen).toHaveBeenCalledWith(
        '1.2.3'
      );
    });

    it('should handle commit URL click', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const mockWindowOpen = jest.fn();
      Object.defineProperty(window, 'open', {
        value: mockWindowOpen,
        writable: true,
      });

      render(<VersionFlashNotification />);

      await waitFor(() => {
        expect(screen.getByText('New Version Deployed!')).toBeInTheDocument();
      });

      const commitButton = screen.getByText('View Commit');
      await user.click(commitButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://github.com/owner/repo/commit/abc123def456',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should not render commit button when no URL is available', async () => {
      const manifestWithoutUrl = {
        ...mockVersionManifest,
        data: {
          ...mockVersionManifest.data!,
          versions: [
            {
              ...mockVersionManifest.data!.versions[0],
              commitUrl: '',
            },
          ],
        },
      };
      mockVersionUtils.fetchVersionManifest.mockResolvedValue(
        manifestWithoutUrl
      );

      render(<VersionFlashNotification />);

      await waitFor(() => {
        expect(screen.getByText('New Version Deployed!')).toBeInTheDocument();
      });

      expect(screen.queryByText('View Commit')).not.toBeInTheDocument();
    });
  });

  describe('Auto-hide Behavior', () => {
    it('should auto-hide after default delay', async () => {
      const onDismiss = jest.fn();

      render(<VersionFlashNotification onDismiss={onDismiss} />);

      await waitFor(() => {
        expect(screen.getByText('New Version Deployed!')).toBeInTheDocument();
      });

      // Fast-forward past default auto-hide delay (8000ms)
      act(() => {
        jest.advanceTimersByTime(8000);
      });

      expect(mockVersionStorage.markVersionAsSeen).toHaveBeenCalledWith(
        '1.2.3'
      );
      expect(onDismiss).toHaveBeenCalled();
    });

    it('should auto-hide after custom delay', async () => {
      const onDismiss = jest.fn();

      render(
        <VersionFlashNotification autoHideDelay={5000} onDismiss={onDismiss} />
      );

      await waitFor(() => {
        expect(screen.getByText('New Version Deployed!')).toBeInTheDocument();
      });

      // Fast-forward past custom auto-hide delay (5000ms)
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(onDismiss).toHaveBeenCalled();
    });

    it('should not auto-hide when disabled', async () => {
      const onDismiss = jest.fn();

      render(
        <VersionFlashNotification autoHide={false} onDismiss={onDismiss} />
      );

      await waitFor(() => {
        expect(screen.getByText('New Version Deployed!')).toBeInTheDocument();
      });

      // Fast-forward past default delay
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(onDismiss).not.toHaveBeenCalled();
    });

    it('should clear timeout on unmount', async () => {
      const { unmount } = render(<VersionFlashNotification />);

      await waitFor(() => {
        expect(screen.getByText('New Version Deployed!')).toBeInTheDocument();
      });

      // Unmount before auto-hide triggers
      unmount();

      // This should not throw or cause issues
      act(() => {
        jest.advanceTimersByTime(10000);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle manifest fetch errors gracefully', async () => {
      const consoleSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {});
      mockVersionUtils.fetchVersionManifest.mockResolvedValue({
        success: false,
        error: 'Network error',
      });

      render(<VersionFlashNotification />);

      await act(async () => {
        jest.runAllTimers();
      });

      expect(
        screen.queryByText('New Version Deployed!')
      ).not.toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch version manifest:',
        'Network error'
      );

      consoleSpy.mockRestore();
    });

    it('should handle missing version entry', async () => {
      const manifestWithoutCurrentVersion = {
        ...mockVersionManifest,
        data: {
          ...mockVersionManifest.data!,
          versions: [],
          current: '2.0.0',
        },
      };
      mockVersionUtils.fetchVersionManifest.mockResolvedValue(
        manifestWithoutCurrentVersion
      );

      render(<VersionFlashNotification />);

      await act(async () => {
        jest.runAllTimers();
      });

      expect(
        screen.queryByText('New Version Deployed!')
      ).not.toBeInTheDocument();
    });

    it('should handle async errors during version check', async () => {
      const consoleSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {});
      mockVersionUtils.fetchVersionManifest.mockRejectedValue(
        new Error('Async error')
      );

      render(<VersionFlashNotification />);

      await act(async () => {
        jest.runAllTimers();
      });

      expect(
        screen.queryByText('New Version Deployed!')
      ).not.toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error checking for new version:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Component Props', () => {
    it('should apply custom className', async () => {
      const { container } = render(
        <VersionFlashNotification className="custom-class" />
      );

      await waitFor(() => {
        expect(screen.getByText('New Version Deployed!')).toBeInTheDocument();
      });

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('should call callbacks when provided', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const onDismiss = jest.fn();
      const onViewDetails = jest.fn();

      render(
        <VersionFlashNotification
          onDismiss={onDismiss}
          onViewDetails={onViewDetails}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('New Version Deployed!')).toBeInTheDocument();
      });

      const viewDetailsButton = screen.getByText('View Details');
      await user.click(viewDetailsButton);

      expect(onViewDetails).toHaveBeenCalledWith('1.2.3');
      expect(onDismiss).toHaveBeenCalled();
    });

    it('should work without callbacks', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(<VersionFlashNotification />);

      await waitFor(() => {
        expect(screen.getByText('New Version Deployed!')).toBeInTheDocument();
      });

      // Should not throw errors when clicking without callbacks
      const dismissButton = screen.getByRole('button', { name: /close/i });
      await user.click(dismissButton);

      const viewDetailsButton = screen.getByText('View Details');
      await user.click(viewDetailsButton);
    });
  });

  describe('Version Information Display', () => {
    it('should display commit type with correct styling', async () => {
      mockVersionUtils.extractCommitType
        .mockReturnValueOnce('feat')
        .mockReturnValueOnce('fix')
        .mockReturnValueOnce('docs');

      const { rerender } = render(<VersionFlashNotification />);

      await waitFor(() => {
        expect(screen.getByText('feat')).toBeInTheDocument();
      });

      // Test different commit types by changing the manifest
      const fixManifest = {
        ...mockVersionManifest,
        data: {
          ...mockVersionManifest.data!,
          versions: [
            {
              ...mockVersionManifest.data!.versions[0],
              description: 'fix: resolve bug',
            },
          ],
        },
      };
      mockVersionUtils.fetchVersionManifest.mockResolvedValue(fixManifest);

      rerender(<VersionFlashNotification />);

      await waitFor(() => {
        expect(screen.getByText('fix')).toBeInTheDocument();
      });
    });

    it('should display increment type badge when available', async () => {
      render(<VersionFlashNotification />);

      await waitFor(() => {
        expect(screen.getByText('minor')).toBeInTheDocument();
      });
    });

    it('should handle missing increment type', async () => {
      mockVersionStorage.checkForNewVersion.mockReturnValue({
        hasNewVersion: true,
        previousVersion: null,
        shouldShowFlash: true,
      });
      mockVersionUtils.getVersionIncrementType.mockReturnValue('unknown');

      render(<VersionFlashNotification />);

      await waitFor(() => {
        expect(screen.getByText('New Version Deployed!')).toBeInTheDocument();
      });

      expect(screen.queryByText('unknown')).not.toBeInTheDocument();
    });

    it('should truncate long commit messages', async () => {
      const longMessage =
        'This is a very long commit message that should be truncated for display purposes';
      mockVersionUtils.truncateCommitMessage.mockReturnValue(
        'This is a very long commit message...'
      );

      const longMessageManifest = {
        ...mockVersionManifest,
        data: {
          ...mockVersionManifest.data!,
          versions: [
            {
              ...mockVersionManifest.data!.versions[0],
              description: longMessage,
            },
          ],
        },
      };
      mockVersionUtils.fetchVersionManifest.mockResolvedValue(
        longMessageManifest
      );

      render(<VersionFlashNotification />);

      await waitFor(() => {
        expect(
          screen.getByText('This is a very long commit message...')
        ).toBeInTheDocument();
      });

      expect(mockVersionUtils.truncateCommitMessage).toHaveBeenCalledWith(
        longMessage,
        40
      );
    });
  });

  describe('Storage Integration', () => {
    it('should mark flash notification as shown immediately', async () => {
      render(<VersionFlashNotification />);

      await waitFor(() => {
        expect(screen.getByText('New Version Deployed!')).toBeInTheDocument();
      });

      expect(mockVersionStorage.markFlashNotificationShown).toHaveBeenCalled();
    });

    it('should mark version as seen when dismissed', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(<VersionFlashNotification />);

      await waitFor(() => {
        expect(screen.getByText('New Version Deployed!')).toBeInTheDocument();
      });

      const dismissButton = screen.getByRole('button', { name: /close/i });
      await user.click(dismissButton);

      expect(mockVersionStorage.markVersionAsSeen).toHaveBeenCalledWith(
        '1.2.3'
      );
    });

    it('should mark version as seen on auto-hide', async () => {
      render(<VersionFlashNotification autoHideDelay={1000} />);

      await waitFor(() => {
        expect(screen.getByText('New Version Deployed!')).toBeInTheDocument();
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockVersionStorage.markVersionAsSeen).toHaveBeenCalledWith(
        '1.2.3'
      );
    });
  });

  describe('Loading States', () => {
    it('should not render during loading', () => {
      // Don't resolve the promise immediately
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockVersionUtils.fetchVersionManifest.mockReturnValue(
        pendingPromise as any
      );

      render(<VersionFlashNotification />);

      expect(
        screen.queryByText('New Version Deployed!')
      ).not.toBeInTheDocument();

      // Resolve the promise
      act(() => {
        resolvePromise!(mockVersionManifest);
      });
    });

    it('should handle loading state properly', async () => {
      // Mock a delayed response
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockVersionUtils.fetchVersionManifest.mockReturnValue(
        pendingPromise as any
      );

      render(<VersionFlashNotification />);

      // Should not be visible during loading
      expect(
        screen.queryByText('New Version Deployed!')
      ).not.toBeInTheDocument();

      // Resolve the promise
      act(() => {
        resolvePromise!(mockVersionManifest);
      });

      await waitFor(() => {
        expect(screen.getByText('New Version Deployed!')).toBeInTheDocument();
      });
    });
  });
});
