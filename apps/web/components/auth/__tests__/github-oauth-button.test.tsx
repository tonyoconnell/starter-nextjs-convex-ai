import React from 'react';
import { render, screen, fireEvent, waitFor } from '@/lib/test-utils';
import '@testing-library/jest-dom';
import { GitHubOAuthButton } from '../github-oauth-button';

// Mock the auth context
const mockGetGitHubOAuthUrl = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

test('GitHubOAuthButton renders with correct text', () => {
  render(<GitHubOAuthButton />, {
    authState: {
      getGitHubOAuthUrl: mockGetGitHubOAuthUrl
    }
  });

  expect(screen.getByText('Continue with GitHub')).toBeInTheDocument();
  expect(screen.getByRole('button')).toBeInTheDocument();
});

test('GitHubOAuthButton shows loading state when clicked', async () => {
  mockGetGitHubOAuthUrl.mockResolvedValue({
    success: true,
    url: 'https://github.com/login/oauth/authorize?test=1',
    state: 'test-state',
  });

  render(<GitHubOAuthButton />, {
    authState: {
      getGitHubOAuthUrl: mockGetGitHubOAuthUrl
    }
  });

  const button = screen.getByRole('button');
  fireEvent.click(button);

  expect(screen.getByText('Connecting...')).toBeInTheDocument();
  expect(button).toBeDisabled();
});

test('GitHubOAuthButton handles successful OAuth URL generation', async () => {
  const mockUrl = 'https://github.com/login/oauth/authorize?client_id=test';
  const mockState = 'test-state';
  
  // Reset window state
  window.location.href = '';
  window.sessionStorage.setItem.mockClear();

  mockGetGitHubOAuthUrl.mockResolvedValue({
    success: true,
    url: mockUrl,
    state: mockState,
  });

  render(<GitHubOAuthButton />, {
    authState: {
      getGitHubOAuthUrl: mockGetGitHubOAuthUrl
    }
  });

  const button = screen.getByRole('button');
  fireEvent.click(button);

  await waitFor(() => {
    expect(mockGetGitHubOAuthUrl).toHaveBeenCalled();
    expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
      'github_oauth_state',
      mockState
    );
    expect(window.location.href).toBe(mockUrl);
  });
});

test('GitHubOAuthButton handles OAuth URL generation error', async () => {
  mockGetGitHubOAuthUrl.mockResolvedValue({
    success: false,
    error: 'GitHub OAuth not configured',
  });

  render(<GitHubOAuthButton />, {
    authState: {
      getGitHubOAuthUrl: mockGetGitHubOAuthUrl
    }
  });

  const button = screen.getByRole('button');
  fireEvent.click(button);

  await waitFor(() => {
    expect(screen.getByText('GitHub OAuth not configured')).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });
});

test('GitHubOAuthButton applies custom className', () => {
  render(<GitHubOAuthButton className="custom-class" />, {
    authState: {
      getGitHubOAuthUrl: mockGetGitHubOAuthUrl
    }
  });

  const button = screen.getByRole('button');
  expect(button).toHaveClass('custom-class');
});

test('GitHubOAuthButton renders with primary variant', () => {
  render(<GitHubOAuthButton variant="primary" />, {
    authState: {
      getGitHubOAuthUrl: mockGetGitHubOAuthUrl
    }
  });

  const button = screen.getByRole('button');
  expect(button).toHaveClass('bg-white');
});

test('GitHubOAuthButton renders with secondary variant (default)', () => {
  render(<GitHubOAuthButton variant="secondary" />, {
    authState: {
      getGitHubOAuthUrl: mockGetGitHubOAuthUrl
    }
  });

  const button = screen.getByRole('button');
  expect(button).toHaveClass('bg-gray-50');
});
