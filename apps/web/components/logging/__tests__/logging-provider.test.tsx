/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { LoggingProvider } from '../logging-provider';

// Mock the console override module
jest.mock('../../../lib/console-override', () => ({
  initializeConsoleOverride: jest.fn(),
  ConsoleLogger: {
    setUserId: jest.fn(),
    getStatus: jest.fn(() => ({
      initialized: true,
      enabled: true,
      traceId: 'test_trace_123',
      userId: 'test_user',
    })),
  },
}));

import { initializeConsoleOverride, ConsoleLogger } from '../../../lib/console-override';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('LoggingProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment
    process.env.NODE_ENV = 'development';
    process.env.CLAUDE_LOGGING_ENABLED = 'true';
  });

  afterEach(() => {
    jest.resetModules();
  });

  test('should render children', () => {
    render(
      <LoggingProvider>
        <div data-testid="child">Test Child</div>
      </LoggingProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  test('should initialize console override in development', () => {
    render(
      <LoggingProvider>
        <div>Test</div>
      </LoggingProvider>
    );

    expect(initializeConsoleOverride).toHaveBeenCalled();
  });

  test('should set user ID from localStorage if available', () => {
    mockLocalStorage.getItem.mockReturnValue('stored_user_123');
    
    render(
      <LoggingProvider>
        <div>Test</div>
      </LoggingProvider>
    );

    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('userId');
    expect(ConsoleLogger.setUserId).toHaveBeenCalledWith('stored_user_123');
  });

  test('should not set user ID if not in localStorage', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    
    render(
      <LoggingProvider>
        <div>Test</div>
      </LoggingProvider>
    );

    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('userId');
    expect(ConsoleLogger.setUserId).not.toHaveBeenCalled();
  });

  test('should set window logging flag', () => {
    render(
      <LoggingProvider>
        <div>Test</div>
      </LoggingProvider>
    );

    expect(window.CLAUDE_LOGGING_ENABLED).toBe('true');
  });

  test('should not initialize in production', () => {
    process.env.NODE_ENV = 'production';
    const { initializeConsoleOverride } = require('../../../lib/console-override');
    
    render(
      <LoggingProvider>
        <div>Test</div>
      </LoggingProvider>
    );

    expect(initializeConsoleOverride).not.toHaveBeenCalled();
  });
});