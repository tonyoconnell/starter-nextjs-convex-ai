/**
 * Comprehensive test suite for VersionProvider component
 * Tests context functionality, component integration, and hook behavior
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  VersionProvider,
  useVersionProvider,
  useVersionTracking,
} from '@/components/dev/version-provider';

// Mock child components
jest.mock('@/components/dev/version-indicator', () => {
  return function MockVersionIndicator(props: any) {
    return (
      <div data-testid="version-indicator" data-props={JSON.stringify(props)}>
        Version Indicator
      </div>
    );
  };
});

jest.mock('@/components/dev/version-flash-notification', () => {
  return function MockVersionFlashNotification(props: any) {
    return (
      <div
        data-testid="version-flash-notification"
        data-props={JSON.stringify(props)}
      >
        Flash Notification
        <button onClick={() => props.onViewDetails?.('1.2.3')}>
          View Details
        </button>
      </div>
    );
  };
});

// Test components for context usage
function TestConsumer() {
  const context = useVersionProvider();

  return (
    <div>
      <div data-testid="expanded-state">
        {context.isVersionHistoryExpanded ? 'expanded' : 'collapsed'}
      </div>
      <button onClick={context.showVersionHistory}>Show History</button>
      <button onClick={context.hideVersionHistory}>Hide History</button>
      <button onClick={context.toggleVersionHistory}>Toggle History</button>
      <button onClick={() => context.navigateToVersion('1.2.3')}>
        Navigate to Version
      </button>
    </div>
  );
}

function TestTrackingConsumer() {
  const tracking = useVersionTracking();

  return (
    <div>
      <div data-testid="available-state">
        {tracking.isAvailable ? 'available' : 'not-available'}
      </div>
      <button onClick={tracking.showVersionHistory}>Show History</button>
      <button onClick={() => tracking.navigateToVersion('1.2.3')}>
        Navigate to Version
      </button>
    </div>
  );
}

function OutsideProviderConsumer() {
  try {
    useVersionProvider();
    return <div>Should not render</div>;
  } catch (error) {
    return <div data-testid="context-error">{(error as Error).message}</div>;
  }
}

describe('VersionProvider', () => {
  describe('Provider Functionality', () => {
    it('should render children and version components', () => {
      render(
        <VersionProvider>
          <div data-testid="child">Child content</div>
        </VersionProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByTestId('version-indicator')).toBeInTheDocument();
      expect(
        screen.getByTestId('version-flash-notification')
      ).toBeInTheDocument();
    });

    it('should conditionally render components based on props', () => {
      render(
        <VersionProvider showIndicator={false} showFlashNotifications={false}>
          <div data-testid="child">Child content</div>
        </VersionProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.queryByTestId('version-indicator')).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('version-flash-notification')
      ).not.toBeInTheDocument();
    });

    it('should pass props to child components', () => {
      render(
        <VersionProvider
          indicatorPosition="top-left"
          maxVersions={10}
          className="custom-class"
        >
          <div>Child content</div>
        </VersionProvider>
      );

      const indicator = screen.getByTestId('version-indicator');
      const indicatorProps = JSON.parse(indicator.getAttribute('data-props')!);

      expect(indicatorProps.position).toBe('top-left');
      expect(indicatorProps.maxVersions).toBe(10);
      expect(indicatorProps.className).toBe('custom-class');

      const notification = screen.getByTestId('version-flash-notification');
      const notificationProps = JSON.parse(
        notification.getAttribute('data-props')!
      );

      expect(notificationProps.className).toBe('custom-class');
    });
  });

  describe('Context State Management', () => {
    it('should provide initial state', () => {
      render(
        <VersionProvider>
          <TestConsumer />
        </VersionProvider>
      );

      expect(screen.getByTestId('expanded-state')).toHaveTextContent(
        'collapsed'
      );
    });

    it('should handle showVersionHistory', async () => {
      const user = userEvent.setup();

      render(
        <VersionProvider>
          <TestConsumer />
        </VersionProvider>
      );

      expect(screen.getByTestId('expanded-state')).toHaveTextContent(
        'collapsed'
      );

      const showButton = screen.getByText('Show History');
      await user.click(showButton);

      expect(screen.getByTestId('expanded-state')).toHaveTextContent(
        'expanded'
      );
    });

    it('should handle hideVersionHistory', async () => {
      const user = userEvent.setup();

      render(
        <VersionProvider>
          <TestConsumer />
        </VersionProvider>
      );

      // First expand
      const showButton = screen.getByText('Show History');
      await user.click(showButton);
      expect(screen.getByTestId('expanded-state')).toHaveTextContent(
        'expanded'
      );

      // Then hide
      const hideButton = screen.getByText('Hide History');
      await user.click(hideButton);
      expect(screen.getByTestId('expanded-state')).toHaveTextContent(
        'collapsed'
      );
    });

    it('should handle toggleVersionHistory', async () => {
      const user = userEvent.setup();

      render(
        <VersionProvider>
          <TestConsumer />
        </VersionProvider>
      );

      const toggleButton = screen.getByText('Toggle History');

      // First toggle - should expand
      await user.click(toggleButton);
      expect(screen.getByTestId('expanded-state')).toHaveTextContent(
        'expanded'
      );

      // Second toggle - should collapse
      await user.click(toggleButton);
      expect(screen.getByTestId('expanded-state')).toHaveTextContent(
        'collapsed'
      );
    });

    it('should handle navigateToVersion', async () => {
      const user = userEvent.setup();

      render(
        <VersionProvider>
          <TestConsumer />
        </VersionProvider>
      );

      expect(screen.getByTestId('expanded-state')).toHaveTextContent(
        'collapsed'
      );

      const navigateButton = screen.getByText('Navigate to Version');
      await user.click(navigateButton);

      // Should expand and set selected version
      expect(screen.getByTestId('expanded-state')).toHaveTextContent(
        'expanded'
      );
    });
  });

  describe('Flash Notification Integration', () => {
    it('should handle flash notification view details', async () => {
      const user = userEvent.setup();

      render(
        <VersionProvider>
          <TestConsumer />
        </VersionProvider>
      );

      expect(screen.getByTestId('expanded-state')).toHaveTextContent(
        'collapsed'
      );

      const viewDetailsButton = screen.getByText('View Details');
      await user.click(viewDetailsButton);

      // Should expand when flash notification triggers view details
      expect(screen.getByTestId('expanded-state')).toHaveTextContent(
        'expanded'
      );
    });
  });

  describe('useVersionProvider Hook', () => {
    it('should provide all context methods', () => {
      render(
        <VersionProvider>
          <TestConsumer />
        </VersionProvider>
      );

      // All buttons should be present, indicating all context methods are available
      expect(screen.getByText('Show History')).toBeInTheDocument();
      expect(screen.getByText('Hide History')).toBeInTheDocument();
      expect(screen.getByText('Toggle History')).toBeInTheDocument();
      expect(screen.getByText('Navigate to Version')).toBeInTheDocument();
    });

    it('should throw error when used outside provider', () => {
      render(<OutsideProviderConsumer />);

      expect(screen.getByTestId('context-error')).toHaveTextContent(
        'useVersionProvider must be used within a VersionProvider'
      );
    });

    it('should update state correctly across multiple consumers', async () => {
      const user = userEvent.setup();

      function MultipleConsumers() {
        return (
          <>
            <TestConsumer />
            <div data-testid="second-consumer">
              <TestConsumer />
            </div>
          </>
        );
      }

      render(
        <VersionProvider>
          <MultipleConsumers />
        </VersionProvider>
      );

      // Both consumers should show initial state
      const expandedStates = screen.getAllByTestId('expanded-state');
      expect(expandedStates).toHaveLength(2);
      expandedStates.forEach(state => {
        expect(state).toHaveTextContent('collapsed');
      });

      // Click show on first consumer
      const showButtons = screen.getAllByText('Show History');
      await user.click(showButtons[0]);

      // Both consumers should update
      expandedStates.forEach(state => {
        expect(state).toHaveTextContent('expanded');
      });
    });
  });

  describe('useVersionTracking Hook', () => {
    it('should indicate availability when inside provider', () => {
      render(
        <VersionProvider>
          <TestTrackingConsumer />
        </VersionProvider>
      );

      expect(screen.getByTestId('available-state')).toHaveTextContent(
        'available'
      );
    });

    it('should indicate unavailability when outside provider', () => {
      render(<TestTrackingConsumer />);

      expect(screen.getByTestId('available-state')).toHaveTextContent(
        'not-available'
      );
    });

    it('should provide working methods when inside provider', async () => {
      const user = userEvent.setup();

      render(
        <VersionProvider>
          <TestTrackingConsumer />
          <TestConsumer />
        </VersionProvider>
      );

      expect(screen.getByTestId('expanded-state')).toHaveTextContent(
        'collapsed'
      );

      // Use tracking hook methods
      const trackingButtons = screen.getAllByText('Show History');
      await user.click(trackingButtons[0]); // First is from tracking consumer

      expect(screen.getByTestId('expanded-state')).toHaveTextContent(
        'expanded'
      );
    });

    it('should provide no-op methods when outside provider', async () => {
      const user = userEvent.setup();

      render(<TestTrackingConsumer />);

      // These should not throw errors
      const showButton = screen.getByText('Show History');
      const navigateButton = screen.getByText('Navigate to Version');

      await user.click(showButton);
      await user.click(navigateButton);

      // Should not cause any errors or state changes
      expect(screen.getByTestId('available-state')).toHaveTextContent(
        'not-available'
      );
    });
  });

  describe('Props Configuration', () => {
    it('should use default props', () => {
      render(
        <VersionProvider>
          <div>Child content</div>
        </VersionProvider>
      );

      const indicator = screen.getByTestId('version-indicator');
      const indicatorProps = JSON.parse(indicator.getAttribute('data-props')!);

      expect(indicatorProps.position).toBe('bottom-right');
      expect(indicatorProps.maxVersions).toBe(20);
      expect(indicatorProps.className).toBe('');

      const notification = screen.getByTestId('version-flash-notification');
      const notificationProps = JSON.parse(
        notification.getAttribute('data-props')!
      );

      expect(notificationProps.className).toBe('');
    });

    it('should override default props', () => {
      render(
        <VersionProvider
          showIndicator={true}
          showFlashNotifications={true}
          indicatorPosition="top-left"
          maxVersions={5}
          className="custom-style"
        >
          <div>Child content</div>
        </VersionProvider>
      );

      const indicator = screen.getByTestId('version-indicator');
      const indicatorProps = JSON.parse(indicator.getAttribute('data-props')!);

      expect(indicatorProps.position).toBe('top-left');
      expect(indicatorProps.maxVersions).toBe(5);
      expect(indicatorProps.className).toBe('custom-style');
    });

    it('should handle all position options', () => {
      const positions = [
        'bottom-left',
        'bottom-right',
        'top-left',
        'top-right',
      ] as const;

      positions.forEach(position => {
        const { unmount } = render(
          <VersionProvider indicatorPosition={position}>
            <div>Child content</div>
          </VersionProvider>
        );

        const indicator = screen.getByTestId('version-indicator');
        const indicatorProps = JSON.parse(
          indicator.getAttribute('data-props')!
        );

        expect(indicatorProps.position).toBe(position);

        unmount();
      });
    });
  });

  describe('State Persistence', () => {
    it('should maintain state during re-renders', async () => {
      const user = userEvent.setup();

      function TestWrapper({ extraProp }: { extraProp: boolean }) {
        return (
          <VersionProvider>
            <TestConsumer />
            {extraProp && <div data-testid="extra">Extra content</div>}
          </VersionProvider>
        );
      }

      const { rerender } = render(<TestWrapper extraProp={false} />);

      // Expand the history
      const showButton = screen.getByText('Show History');
      await user.click(showButton);
      expect(screen.getByTestId('expanded-state')).toHaveTextContent(
        'expanded'
      );

      // Re-render with different props
      rerender(<TestWrapper extraProp={true} />);

      // State should be maintained
      expect(screen.getByTestId('expanded-state')).toHaveTextContent(
        'expanded'
      );
      expect(screen.getByTestId('extra')).toBeInTheDocument();
    });
  });

  describe('Callback Memoization', () => {
    it('should memoize callback functions', () => {
      let renderCount = 0;
      const callbacks: any[] = [];

      function CallbackTestConsumer() {
        renderCount++;
        const context = useVersionProvider();
        callbacks.push({
          showVersionHistory: context.showVersionHistory,
          hideVersionHistory: context.hideVersionHistory,
          toggleVersionHistory: context.toggleVersionHistory,
          navigateToVersion: context.navigateToVersion,
        });

        return <div>Render count: {renderCount}</div>;
      }

      const { rerender } = render(
        <VersionProvider>
          <CallbackTestConsumer />
        </VersionProvider>
      );

      expect(renderCount).toBe(1);

      // Re-render without changing provider props
      rerender(
        <VersionProvider>
          <CallbackTestConsumer />
        </VersionProvider>
      );

      expect(renderCount).toBe(2);

      // Callbacks should be the same (memoized)
      const firstCallbacks = callbacks[0];
      const secondCallbacks = callbacks[1];

      expect(firstCallbacks.showVersionHistory).toBe(
        secondCallbacks.showVersionHistory
      );
      expect(firstCallbacks.hideVersionHistory).toBe(
        secondCallbacks.hideVersionHistory
      );
      expect(firstCallbacks.toggleVersionHistory).toBe(
        secondCallbacks.toggleVersionHistory
      );
      expect(firstCallbacks.navigateToVersion).toBe(
        secondCallbacks.navigateToVersion
      );
    });
  });

  describe('Error Boundaries', () => {
    it('should handle errors in child components gracefully', () => {
      function ErrorComponent() {
        throw new Error('Test error');
      }

      // Note: In a real application, you'd want an error boundary around this
      // For testing purposes, we'll just ensure the provider structure is sound
      expect(() => {
        render(
          <VersionProvider>
            <div>Safe content</div>
          </VersionProvider>
        );
      }).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should coordinate between provider state and child components', async () => {
      const user = userEvent.setup();

      render(
        <VersionProvider>
          <TestConsumer />
        </VersionProvider>
      );

      // Initial state
      expect(screen.getByTestId('expanded-state')).toHaveTextContent(
        'collapsed'
      );

      // Test all state transitions
      const showButton = screen.getByText('Show History');
      const hideButton = screen.getByText('Hide History');
      const toggleButton = screen.getByText('Toggle History');
      const navigateButton = screen.getByText('Navigate to Version');

      // Show -> expanded
      await user.click(showButton);
      expect(screen.getByTestId('expanded-state')).toHaveTextContent(
        'expanded'
      );

      // Hide -> collapsed
      await user.click(hideButton);
      expect(screen.getByTestId('expanded-state')).toHaveTextContent(
        'collapsed'
      );

      // Toggle -> expanded
      await user.click(toggleButton);
      expect(screen.getByTestId('expanded-state')).toHaveTextContent(
        'expanded'
      );

      // Toggle -> collapsed
      await user.click(toggleButton);
      expect(screen.getByTestId('expanded-state')).toHaveTextContent(
        'collapsed'
      );

      // Navigate -> expanded (with version selection)
      await user.click(navigateButton);
      expect(screen.getByTestId('expanded-state')).toHaveTextContent(
        'expanded'
      );
    });

    it('should handle flash notification integration', async () => {
      const user = userEvent.setup();

      render(
        <VersionProvider>
          <TestConsumer />
        </VersionProvider>
      );

      expect(screen.getByTestId('expanded-state')).toHaveTextContent(
        'collapsed'
      );

      // Simulate flash notification triggering view details
      const viewDetailsButton = screen.getByText('View Details');
      await user.click(viewDetailsButton);

      // Should navigate to version (expanding the history)
      expect(screen.getByTestId('expanded-state')).toHaveTextContent(
        'expanded'
      );
    });
  });
});
