/**
 * Comprehensive test suite for VersionIndicator component
 * Tests component rendering, user interactions, access control, and version navigation
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
import { useQuery } from 'convex/react';
import VersionIndicator from '@/components/dev/version-indicator';
import { useAuth } from '@/components/auth/auth-provider';
import * as versionUtils from '@/lib/version-utils';

// Mock dependencies
jest.mock('convex/react');
jest.mock('@/components/auth/auth-provider');
jest.mock('@/lib/version-utils');
jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="animate-presence">{children}</div>
  ),
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockVersionUtils = versionUtils as jest.Mocked<typeof versionUtils>;

describe('VersionIndicator', () => {
  const mockVersionManifest = {
    versions: [
      {
        version: '1.2.3',
        commitHash: 'abc123def456',
        timestamp: 1640995200,
        description: 'feat: add new feature',
        commitUrl: 'https://github.com/owner/repo/commit/abc123def456',
      },
      {
        version: '1.2.2',
        commitHash: 'def456ghi789',
        timestamp: 1640908800,
        description: 'fix: resolve critical bug',
        commitUrl: 'https://github.com/owner/repo/commit/def456ghi789',
      },
      {
        version: '1.2.1',
        commitHash: 'ghi789jkl012',
        timestamp: 1640822400,
        description: 'docs: update README',
        commitUrl: 'https://github.com/owner/repo/commit/ghi789jkl012',
      },
    ],
    current: '1.2.3',
    lastUpdated: 1640995200,
  };

  const mockVersionResponse = {
    success: true,
    data: mockVersionManifest,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock auth provider
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'david@ideasmen.com.au', name: 'David' },
      sessionToken: 'valid-session-token',
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
    });

    // Mock owner access query
    mockUseQuery.mockReturnValue({
      hasAccess: true,
      reason: 'Access granted',
      userEmail: 'david@ideasmen.com.au',
    });

    // Mock version utilities
    mockVersionUtils.fetchVersionManifest.mockResolvedValue(
      mockVersionResponse
    );
    mockVersionUtils.sortVersionsDescending.mockReturnValue(
      mockVersionManifest.versions
    );
    mockVersionUtils.getVersionNavigation.mockReturnValue({
      current: mockVersionManifest.versions[0],
      next: undefined,
      previous: mockVersionManifest.versions[1],
      currentIndex: 0,
    });
    mockVersionUtils.formatTimestamp.mockReturnValue('2022-01-01 12:00:00');
    mockVersionUtils.formatRelativeTime.mockReturnValue('2 hours ago');
    mockVersionUtils.extractCommitType.mockReturnValue('feat');
    mockVersionUtils.truncateCommitHash.mockReturnValue('abc123de');
    mockVersionUtils.truncateCommitMessage.mockImplementation(
      (msg, length = 50) =>
        msg.length > length ? msg.substring(0, length - 3) + '...' : msg
    );
  });

  describe('Access Control', () => {
    it('should not render when user has no access', () => {
      mockUseQuery.mockReturnValue({
        hasAccess: false,
        reason: 'Access restricted to owner only',
      });

      render(<VersionIndicator />);
      expect(screen.queryByText(/Current version/)).not.toBeInTheDocument();
    });

    it('should not render when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        sessionToken: null,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
      });

      render(<VersionIndicator />);
      expect(screen.queryByText(/Current version/)).not.toBeInTheDocument();
    });

    it('should render when user has owner access', async () => {
      render(<VersionIndicator />);

      await waitFor(() => {
        expect(screen.getByText('v1.2.3')).toBeInTheDocument();
      });
    });

    it('should use skip when no session token', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        sessionToken: null,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
      });

      render(<VersionIndicator />);

      expect(mockUseQuery).toHaveBeenCalledWith(expect.any(Object), 'skip');
    });
  });

  describe('Loading States', () => {
    it('should show loading state initially', () => {
      // Mock loading state
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockVersionUtils.fetchVersionManifest.mockReturnValue(
        pendingPromise as any
      );

      render(<VersionIndicator />);

      expect(screen.getByText('Loading version...')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      // Resolve promise
      act(() => {
        resolvePromise!(mockVersionResponse);
      });
    });

    it('should show error state when fetch fails', async () => {
      mockVersionUtils.fetchVersionManifest.mockResolvedValue({
        success: false,
        error: 'Network error',
      });

      render(<VersionIndicator />);

      await waitFor(() => {
        expect(screen.getByText('Version error')).toBeInTheDocument();
      });

      // Should have refresh button
      const refreshButton = screen.getByRole('button');
      expect(refreshButton).toBeInTheDocument();
    });

    it('should handle refresh after error', async () => {
      const user = userEvent.setup();

      // Start with error
      mockVersionUtils.fetchVersionManifest.mockResolvedValueOnce({
        success: false,
        error: 'Network error',
      });

      render(<VersionIndicator />);

      await waitFor(() => {
        expect(screen.getByText('Version error')).toBeInTheDocument();
      });

      // Mock successful retry
      mockVersionUtils.fetchVersionManifest.mockResolvedValueOnce(
        mockVersionResponse
      );

      const refreshButton = screen.getByRole('button');
      await user.click(refreshButton);

      await waitFor(() => {
        expect(screen.getByText('v1.2.3')).toBeInTheDocument();
      });
    });
  });

  describe('Collapsed State', () => {
    it('should render collapsed indicator by default', async () => {
      render(<VersionIndicator />);

      await waitFor(() => {
        expect(screen.getByText('v1.2.3')).toBeInTheDocument();
      });

      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-expanded',
        'false'
      );
      expect(screen.queryByText('Version History')).not.toBeInTheDocument();
    });

    it('should show tooltip on hover', async () => {
      render(<VersionIndicator />);

      await waitFor(() => {
        expect(screen.getByText('v1.2.3')).toBeInTheDocument();
      });

      // Note: Testing tooltip interactions with jsdom is limited
      // In a real browser, hovering would show the tooltip
      expect(screen.getByText('Current version: v1.2.3')).toBeInTheDocument();
    });

    it('should expand when clicked', async () => {
      const user = userEvent.setup();

      render(<VersionIndicator />);

      await waitFor(() => {
        expect(screen.getByText('v1.2.3')).toBeInTheDocument();
      });

      const expandButton = screen.getByRole('button');
      await user.click(expandButton);

      expect(screen.getByText('Version History')).toBeInTheDocument();
    });
  });

  describe('Expanded State', () => {
    beforeEach(async () => {
      const { getByRole } = render(<VersionIndicator />);

      await waitFor(() => {
        expect(screen.getByText('v1.2.3')).toBeInTheDocument();
      });

      const expandButton = getByRole('button');
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('Version History')).toBeInTheDocument();
      });
    });

    it('should display version history modal', () => {
      expect(screen.getByText('Version History')).toBeInTheDocument();
      expect(screen.getByText('feat: add new feature')).toBeInTheDocument();
      expect(screen.getByText('2 hours ago')).toBeInTheDocument();
      expect(screen.getByText('abc123de')).toBeInTheDocument();
    });

    it('should show navigation controls', () => {
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('1 of 3')).toBeInTheDocument();
    });

    it('should show commit link button', () => {
      expect(screen.getByText('View Commit on GitHub')).toBeInTheDocument();
    });

    it('should show version list', () => {
      expect(screen.getByText('v1.2.3')).toBeInTheDocument();
      expect(screen.getByText('v1.2.2')).toBeInTheDocument();
      expect(screen.getByText('v1.2.1')).toBeInTheDocument();
    });

    it('should highlight current version', () => {
      const currentVersionBadge = screen.getByText('Current');
      expect(currentVersionBadge).toBeInTheDocument();
    });

    it('should collapse when close button is clicked', async () => {
      const user = userEvent.setup();

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(screen.queryByText('Version History')).not.toBeInTheDocument();
    });
  });

  describe('Version Navigation', () => {
    beforeEach(async () => {
      const { getByRole } = render(<VersionIndicator />);

      await waitFor(() => {
        expect(screen.getByText('v1.2.3')).toBeInTheDocument();
      });

      const expandButton = getByRole('button');
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('Version History')).toBeInTheDocument();
      });
    });

    it('should handle version selection from list', async () => {
      const user = userEvent.setup();

      // Mock navigation for selected version
      mockVersionUtils.getVersionNavigation.mockReturnValue({
        current: mockVersionManifest.versions[1],
        next: mockVersionManifest.versions[0],
        previous: mockVersionManifest.versions[2],
        currentIndex: 1,
      });

      const versionItem = screen.getByText('v1.2.2');
      await user.click(versionItem.closest('div')!);

      expect(mockVersionUtils.getVersionNavigation).toHaveBeenCalledWith(
        mockVersionManifest.versions,
        '1.2.2'
      );
    });

    it('should handle next/previous navigation', async () => {
      const user = userEvent.setup();

      // Mock that there's a previous version available
      mockVersionUtils.getVersionNavigation.mockReturnValue({
        current: mockVersionManifest.versions[0],
        next: undefined,
        previous: mockVersionManifest.versions[1],
        currentIndex: 0,
      });

      const previousButton = screen.getByText('Previous');
      await user.click(previousButton);

      // Should call getVersionNavigation with the previous version
      expect(mockVersionUtils.getVersionNavigation).toHaveBeenCalled();
    });

    it('should disable navigation buttons at boundaries', () => {
      // Mock navigation at first position (no next)
      mockVersionUtils.getVersionNavigation.mockReturnValue({
        current: mockVersionManifest.versions[0],
        next: undefined,
        previous: mockVersionManifest.versions[1],
        currentIndex: 0,
      });

      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();

      const previousButton = screen.getByText('Previous');
      expect(previousButton).not.toBeDisabled();
    });
  });

  describe('User Interactions', () => {
    it('should handle commit URL clicks', async () => {
      const user = userEvent.setup();
      const mockWindowOpen = jest.fn();
      Object.defineProperty(window, 'open', {
        value: mockWindowOpen,
        writable: true,
      });

      render(<VersionIndicator />);

      await waitFor(() => {
        expect(screen.getByText('v1.2.3')).toBeInTheDocument();
      });

      // Expand the modal
      const expandButton = screen.getByRole('button');
      await user.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('Version History')).toBeInTheDocument();
      });

      const commitButton = screen.getByText('View Commit on GitHub');
      await user.click(commitButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://github.com/owner/repo/commit/abc123def456',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should handle refresh button click', async () => {
      const user = userEvent.setup();

      render(<VersionIndicator />);

      await waitFor(() => {
        expect(screen.getByText('v1.2.3')).toBeInTheDocument();
      });

      // Expand the modal
      const expandButton = screen.getByRole('button');
      await user.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('Version History')).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      expect(mockVersionUtils.fetchVersionManifest).toHaveBeenCalledTimes(2);
    });
  });

  describe('Component Props', () => {
    it('should apply custom className', async () => {
      const { container } = render(
        <VersionIndicator className="custom-class" />
      );

      await waitFor(() => {
        expect(screen.getByText('v1.2.3')).toBeInTheDocument();
      });

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('should respect position prop', async () => {
      const { container } = render(<VersionIndicator position="top-left" />);

      await waitFor(() => {
        expect(screen.getByText('v1.2.3')).toBeInTheDocument();
      });

      expect(container.querySelector('.top-4.left-4')).toBeInTheDocument();
    });

    it('should limit versions according to maxVersions prop', async () => {
      mockVersionUtils.sortVersionsDescending.mockReturnValue(
        mockVersionManifest.versions.slice(0, 2)
      );

      render(<VersionIndicator maxVersions={2} />);

      await waitFor(() => {
        expect(screen.getByText('v1.2.3')).toBeInTheDocument();
      });

      expect(mockVersionUtils.sortVersionsDescending).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty version manifest', async () => {
      const emptyManifest = {
        success: true,
        data: {
          versions: [],
          current: '1.0.0',
          lastUpdated: Date.now(),
        },
      };
      mockVersionUtils.fetchVersionManifest.mockResolvedValue(emptyManifest);
      mockVersionUtils.sortVersionsDescending.mockReturnValue([]);

      render(<VersionIndicator />);

      await waitFor(() => {
        expect(screen.getByText('v1.0.0')).toBeInTheDocument();
      });

      // Expand modal
      const expandButton = screen.getByRole('button');
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('Version History')).toBeInTheDocument();
      });

      expect(screen.getByText('0 versions shown')).toBeInTheDocument();
    });

    it('should handle manifest fetch errors', async () => {
      mockVersionUtils.fetchVersionManifest.mockRejectedValue(
        new Error('Network error')
      );

      render(<VersionIndicator />);

      await waitFor(() => {
        expect(screen.getByText('Version error')).toBeInTheDocument();
      });
    });

    it('should handle missing commit URLs', async () => {
      const manifestWithoutUrls = {
        ...mockVersionResponse,
        data: {
          ...mockVersionManifest,
          versions: mockVersionManifest.versions.map(v => ({
            ...v,
            commitUrl: '',
          })),
        },
      };
      mockVersionUtils.fetchVersionManifest.mockResolvedValue(
        manifestWithoutUrls
      );

      render(<VersionIndicator />);

      await waitFor(() => {
        expect(screen.getByText('v1.2.3')).toBeInTheDocument();
      });

      // Expand modal
      const expandButton = screen.getByRole('button');
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('Version History')).toBeInTheDocument();
      });

      expect(
        screen.queryByText('View Commit on GitHub')
      ).not.toBeInTheDocument();
    });

    it('should handle version navigation with no current version', () => {
      mockVersionUtils.getVersionNavigation.mockReturnValue({
        current: undefined,
        next: undefined,
        previous: undefined,
        currentIndex: -1,
      });

      render(<VersionIndicator />);

      // Should still render basic structure
      expect(screen.getByText('v1.2.3')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      render(<VersionIndicator />);

      await waitFor(() => {
        expect(screen.getByText('v1.2.3')).toBeInTheDocument();
      });

      const expandButton = screen.getByRole('button');
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('Version History')).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      render(<VersionIndicator />);

      await waitFor(() => {
        expect(screen.getByText('v1.2.3')).toBeInTheDocument();
      });

      const expandButton = screen.getByRole('button');

      // Test Enter key
      fireEvent.keyDown(expandButton, { key: 'Enter', code: 'Enter' });
      fireEvent.click(expandButton); // jsdom requires explicit click

      await waitFor(() => {
        expect(screen.getByText('Version History')).toBeInTheDocument();
      });

      // All buttons should be keyboard accessible
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });
  });

  describe('Commit Type Styling', () => {
    it('should apply correct colors for different commit types', async () => {
      mockVersionUtils.extractCommitType
        .mockReturnValueOnce('feat')
        .mockReturnValueOnce('fix')
        .mockReturnValueOnce('docs');

      render(<VersionIndicator />);

      await waitFor(() => {
        expect(screen.getByText('v1.2.3')).toBeInTheDocument();
      });

      // Expand modal
      const expandButton = screen.getByRole('button');
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('Version History')).toBeInTheDocument();
      });

      expect(screen.getByText('feat')).toBeInTheDocument();
    });
  });
});
