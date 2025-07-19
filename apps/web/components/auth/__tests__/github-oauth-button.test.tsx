import { test, expect, beforeEach } from 'bun:test';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GitHubOAuthButton } from '../github-oauth-button';
import { AuthProvider } from '../auth-provider';

// Mock the auth context
const mockGetGitHubOAuthUrl = jest.fn();

// Mock AuthProvider with our mocked functions
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const mockContext = {
    user: null,
    sessionToken: null,
    isLoading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    refreshUser: jest.fn(),
    changePassword: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
    getGitHubOAuthUrl: mockGetGitHubOAuthUrl,
    githubOAuthLogin: jest.fn(),
  };

  return (
    <div data-testid="mock-auth-provider">
      {/* Simulate AuthContext.Provider */}
      {React.cloneElement(children as React.ReactElement, { ...mockContext })}
    </div>
  );
};

// Mock window.location
const mockLocation = {
  href: '',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

beforeEach(() => {
  mockGetGitHubOAuthUrl.mockClear();
  mockSessionStorage.setItem.mockClear();
  mockLocation.href = '';
});

test('GitHubOAuthButton renders with correct text', () => {
  render(
    <MockAuthProvider>
      <GitHubOAuthButton />
    </MockAuthProvider>
  );

  expect(screen.getByText('Continue with GitHub')).toBeInTheDocument();
  expect(screen.getByRole('button')).toBeInTheDocument();
});

test('GitHubOAuthButton shows loading state when clicked', async () => {
  mockGetGitHubOAuthUrl.mockResolvedValue({
    success: true,
    url: 'https://github.com/login/oauth/authorize?test=1',
    state: 'test-state',
  });

  render(
    <MockAuthProvider>
      <GitHubOAuthButton />
    </MockAuthProvider>
  );

  const button = screen.getByRole('button');
  fireEvent.click(button);

  expect(screen.getByText('Connecting...')).toBeInTheDocument();
  expect(button).toBeDisabled();
});

test('GitHubOAuthButton handles successful OAuth URL generation', async () => {
  const mockUrl = 'https://github.com/login/oauth/authorize?client_id=test';
  const mockState = 'test-state';

  mockGetGitHubOAuthUrl.mockResolvedValue({
    success: true,
    url: mockUrl,
    state: mockState,
  });

  render(
    <MockAuthProvider>
      <GitHubOAuthButton />
    </MockAuthProvider>
  );

  const button = screen.getByRole('button');
  fireEvent.click(button);

  await waitFor(() => {
    expect(mockGetGitHubOAuthUrl).toHaveBeenCalled();
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      'github_oauth_state',
      mockState
    );
    expect(mockLocation.href).toBe(mockUrl);
  });
});

test('GitHubOAuthButton handles OAuth URL generation error', async () => {
  mockGetGitHubOAuthUrl.mockResolvedValue({
    success: false,
    error: 'GitHub OAuth not configured',
  });

  render(
    <MockAuthProvider>
      <GitHubOAuthButton />
    </MockAuthProvider>
  );

  const button = screen.getByRole('button');
  fireEvent.click(button);

  await waitFor(() => {
    expect(screen.getByText('GitHub OAuth not configured')).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });
});

test('GitHubOAuthButton applies custom className', () => {
  render(
    <MockAuthProvider>
      <GitHubOAuthButton className="custom-class" />
    </MockAuthProvider>
  );

  const button = screen.getByRole('button');
  expect(button).toHaveClass('custom-class');
});

test('GitHubOAuthButton renders with primary variant', () => {
  render(
    <MockAuthProvider>
      <GitHubOAuthButton variant="primary" />
    </MockAuthProvider>
  );

  const button = screen.getByRole('button');
  expect(button).toHaveClass('bg-white');
});

test('GitHubOAuthButton renders with secondary variant (default)', () => {
  render(
    <MockAuthProvider>
      <GitHubOAuthButton variant="secondary" />
    </MockAuthProvider>
  );

  const button = screen.getByRole('button');
  expect(button).toHaveClass('bg-gray-50');
});
