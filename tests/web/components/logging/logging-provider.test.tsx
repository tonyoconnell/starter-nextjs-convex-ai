// @ts-nocheck
/**
 * Comprehensive tests for LoggingProvider component
 * Tests: auth integration, user context updates, development environment checks, console override initialization
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// Mock console override module
const mockInitializeConsoleOverride = jest.fn();
const mockConsoleLogger = {
  setUserId: jest.fn(),
  getStatus: jest.fn(() => ({
    initialized: true,
    enabled: true,
    traceId: 'test-trace-123',
    userId: 'test-user',
  })),
};

jest.mock('@/lib/console-override', () => ({
  initializeConsoleOverride: mockInitializeConsoleOverride,
  ConsoleLogger: mockConsoleLogger,
}));

// Mock auth provider
const mockUseAuth = jest.fn();
jest.mock('@/components/auth/auth-provider', () => ({
  useAuth: mockUseAuth,
}));

// Mock logging status component
jest.mock('@/components/logging/logging-status', () => ({
  LoggingStatus: () => <div data-testid="logging-status">Logging Status</div>,
}));

// Mock console to capture logs
const mockConsoleLog = jest.fn();
const originalConsoleLog = console.log;

// Mock window object
Object.defineProperty(global, 'window', {
  value: {
    CLAUDE_LOGGING_ENABLED: undefined,
    ConsoleLogger: undefined,
  },
  writable: true,
});

import { LoggingProvider } from '@/components/logging/logging-provider';

describe('LoggingProvider', () => {
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
    
    // Reset window state
    delete global.window.CLAUDE_LOGGING_ENABLED;
    delete global.window.ConsoleLogger;
    
    // Reset mocks
    jest.clearAllMocks();
    mockInitializeConsoleOverride.mockClear();
    mockConsoleLogger.setUserId.mockClear();
    mockConsoleLogger.getStatus.mockClear();
    
    // Mock console.log
    console.log = mockConsoleLog;
    
    // Default auth state
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
    });
  });

  afterEach(() => {
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }
    
    // Restore original console
    console.log = originalConsoleLog;
  });

  describe('Environment-Based Initialization', () => {
    it('should initialize console override in development environment', () => {
      process.env.NODE_ENV = 'development';

      render(
        <LoggingProvider>
          <div>Test Content</div>
        </LoggingProvider>
      );

      expect(global.window.CLAUDE_LOGGING_ENABLED).toBe('true');
      expect(mockInitializeConsoleOverride).toHaveBeenCalled();
      expect(global.window.ConsoleLogger).toBe(mockConsoleLogger);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Claude logging provider initialized:',
        expect.any(Object)
      );
    });

    it('should not initialize console override in production environment', () => {
      process.env.NODE_ENV = 'production';

      render(
        <LoggingProvider>
          <div>Test Content</div>
        </LoggingProvider>
      );

      expect(global.window.CLAUDE_LOGGING_ENABLED).toBe('false');
      expect(mockInitializeConsoleOverride).not.toHaveBeenCalled();
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it('should not initialize console override in test environment', () => {
      process.env.NODE_ENV = 'test';

      render(
        <LoggingProvider>
          <div>Test Content</div>
        </LoggingProvider>
      );

      expect(global.window.CLAUDE_LOGGING_ENABLED).toBe('false');
      expect(mockInitializeConsoleOverride).not.toHaveBeenCalled();
    });

    it('should handle undefined NODE_ENV as production', () => {
      delete process.env.NODE_ENV;

      render(
        <LoggingProvider>
          <div>Test Content</div>
        </LoggingProvider>
      );

      expect(global.window.CLAUDE_LOGGING_ENABLED).toBe('false');
      expect(mockInitializeConsoleOverride).not.toHaveBeenCalled();
    });
  });

  describe('Authentication Integration', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should set user ID when user is authenticated', () => {
      const mockUser = {
        email: 'test@example.com',
        name: 'Test User',
      };

      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
      });

      render(
        <LoggingProvider>
          <div>Test Content</div>
        </LoggingProvider>
      );

      expect(mockConsoleLogger.setUserId).toHaveBeenCalledWith('test@example.com');
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Claude logging user context updated: test@example.com'
      );
    });

    it('should set anonymous user ID when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
      });

      render(
        <LoggingProvider>
          <div>Test Content</div>
        </LoggingProvider>
      );

      expect(mockConsoleLogger.setUserId).toHaveBeenCalledWith('anonymous');
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Claude logging user context reset to anonymous'
      );
    });

    it('should not update user context while loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
      });

      render(
        <LoggingProvider>
          <div>Test Content</div>
        </LoggingProvider>
      );

      expect(mockConsoleLogger.setUserId).not.toHaveBeenCalled();
    });

    it('should update user context when authentication state changes', () => {
      const { rerender } = render(
        <LoggingProvider>
          <div>Test Content</div>
        </LoggingProvider>
      );

      // Initially no user
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
      });

      rerender(
        <LoggingProvider>
          <div>Test Content</div>
        </LoggingProvider>
      );

      expect(mockConsoleLogger.setUserId).toHaveBeenCalledWith('anonymous');

      // User logs in
      mockUseAuth.mockReturnValue({
        user: { email: 'newuser@example.com' },
        isLoading: false,
      });

      rerender(
        <LoggingProvider>
          <div>Test Content</div>
        </LoggingProvider>
      );

      expect(mockConsoleLogger.setUserId).toHaveBeenCalledWith('newuser@example.com');
    });

    it('should handle user logout', () => {
      // Start with authenticated user
      mockUseAuth.mockReturnValue({
        user: { email: 'user@example.com' },
        isLoading: false,
      });

      const { rerender } = render(
        <LoggingProvider>
          <div>Test Content</div>
        </LoggingProvider>
      );

      expect(mockConsoleLogger.setUserId).toHaveBeenCalledWith('user@example.com');

      // User logs out
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
      });

      rerender(
        <LoggingProvider>
          <div>Test Content</div>
        </LoggingProvider>
      );

      expect(mockConsoleLogger.setUserId).toHaveBeenCalledWith('anonymous');
    });
  });

  describe('Production Environment Behavior', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('should not set user context in production', () => {
      mockUseAuth.mockReturnValue({
        user: { email: 'test@example.com' },
        isLoading: false,
      });

      render(
        <LoggingProvider>
          <div>Test Content</div>
        </LoggingProvider>
      );

      expect(mockConsoleLogger.setUserId).not.toHaveBeenCalled();
    });

    it('should not log initialization in production', () => {
      render(
        <LoggingProvider>
          <div>Test Content</div>
        </LoggingProvider>
      );

      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it('should still set window flag in production', () => {
      render(
        <LoggingProvider>
          <div>Test Content</div>
        </LoggingProvider>
      );

      expect(global.window.CLAUDE_LOGGING_ENABLED).toBe('false');
    });
  });

  describe('Component Structure and Rendering', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should render children content', () => {
      render(
        <LoggingProvider>
          <div data-testid="child-content">Child Content</div>
        </LoggingProvider>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('should render LoggingStatus component', () => {
      render(
        <LoggingProvider>
          <div>Test Content</div>
        </LoggingProvider>
      );

      expect(screen.getByTestId('logging-status')).toBeInTheDocument();
    });

    it('should handle multiple children', () => {
      render(
        <LoggingProvider>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <span data-testid="child-3">Child 3</span>
        </LoggingProvider>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should handle missing window object gracefully', () => {
      const originalWindow = global.window;
      delete global.window;

      expect(() => {
        render(
          <LoggingProvider>
            <div>Test Content</div>
          </LoggingProvider>
        );
      }).not.toThrow();

      global.window = originalWindow;
    });

    it('should handle auth provider errors gracefully', () => {
      mockUseAuth.mockImplementation(() => {
        throw new Error('Auth provider error');
      });

      expect(() => {
        render(
          <LoggingProvider>
            <div>Test Content</div>
          </LoggingProvider>
        );
      }).toThrow('Auth provider error');
    });

    it('should handle user object without email', () => {
      mockUseAuth.mockReturnValue({
        user: { name: 'Test User' }, // No email property
        isLoading: false,
      });

      render(
        <LoggingProvider>
          <div>Test Content</div>
        </LoggingProvider>
      );

      expect(mockConsoleLogger.setUserId).toHaveBeenCalledWith('anonymous');
    });

    it('should handle console override initialization failure', () => {
      mockInitializeConsoleOverride.mockImplementation(() => {
        throw new Error('Initialization failed');
      });

      expect(() => {
        render(
          <LoggingProvider>
            <div>Test Content</div>
          </LoggingProvider>
        );
      }).toThrow('Initialization failed');
    });
  });

  describe('Loading State Handling', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should not update user context during loading state', () => {
      mockUseAuth.mockReturnValue({
        user: { email: 'test@example.com' },
        isLoading: true,
      });

      render(
        <LoggingProvider>
          <div>Test Content</div>
        </LoggingProvider>
      );

      expect(mockConsoleLogger.setUserId).not.toHaveBeenCalled();
    });

    it('should update user context after loading completes', async () => {
      // Start with loading state
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
      });

      const { rerender } = render(
        <LoggingProvider>
          <div>Test Content</div>
        </LoggingProvider>
      );

      expect(mockConsoleLogger.setUserId).not.toHaveBeenCalled();

      // Loading completes with user
      mockUseAuth.mockReturnValue({
        user: { email: 'test@example.com' },
        isLoading: false,
      });

      rerender(
        <LoggingProvider>
          <div>Test Content</div>
        </LoggingProvider>
      );

      expect(mockConsoleLogger.setUserId).toHaveBeenCalledWith('test@example.com');
    });

    it('should handle loading state transitions', () => {
      const { rerender } = render(
        <LoggingProvider>
          <div>Test Content</div>
        </LoggingProvider>
      );

      // Loading -> authenticated
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
      });

      rerender(
        <LoggingProvider>
          <div>Test Content</div>
        </LoggingProvider>
      );

      mockUseAuth.mockReturnValue({
        user: { email: 'user@example.com' },
        isLoading: false,
      });

      rerender(
        <LoggingProvider>
          <div>Test Content</div>
        </LoggingProvider>
      );

      // Loading -> anonymous
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
      });

      rerender(
        <LoggingProvider>
          <div>Test Content</div>
        </LoggingProvider>
      );

      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
      });

      rerender(
        <LoggingProvider>
          <div>Test Content</div>
        </LoggingProvider>
      );

      expect(mockConsoleLogger.setUserId).toHaveBeenCalledWith('user@example.com');
      expect(mockConsoleLogger.setUserId).toHaveBeenCalledWith('anonymous');
    });
  });

  describe('Global Object Management', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should make ConsoleLogger globally available', () => {
      render(
        <LoggingProvider>
          <div>Test Content</div>
        </LoggingProvider>
      );

      expect(global.window.ConsoleLogger).toBe(mockConsoleLogger);
    });

    it('should set logging enabled flag correctly', () => {
      render(
        <LoggingProvider>
          <div>Test Content</div>
        </LoggingProvider>
      );

      expect(global.window.CLAUDE_LOGGING_ENABLED).toBe('true');
    });

    it('should handle window object modification', () => {
      // Start with no window
      const originalWindow = global.window;
      delete global.window;

      render(
        <LoggingProvider>
          <div>Test Content</div>
        </LoggingProvider>
      );

      // Should not throw error
      expect(screen.getByText('Test Content')).toBeInTheDocument();

      global.window = originalWindow;
    });
  });
});