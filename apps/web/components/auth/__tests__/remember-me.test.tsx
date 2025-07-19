import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '../login-form';
import { AuthProvider } from '../auth-provider';
import { jest } from '@jest/globals';

// Mock the auth service
const mockLogin = jest.fn();
const mockAuthService = {
  login: mockLogin,
};

jest.mock('../../../lib/auth', () => ({
  authService: mockAuthService,
}));

// Mock useRouter
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const mockContextValue = {
    user: null,
    sessionToken: null,
    isLoading: false,
    login: mockLogin,
    register: jest.fn(),
    logout: jest.fn(),
    refreshUser: jest.fn(),
    changePassword: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
    getGitHubOAuthUrl: jest.fn(),
    githubOAuthLogin: jest.fn(),
    getGoogleOAuthUrl: jest.fn(),
    googleOAuthLogin: jest.fn(),
  };

  return (
    <div data-testid="mock-auth-provider">
      {/* Mock the context value */}
      {children}
    </div>
  );
};

describe('Remember Me Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogin.mockResolvedValue({
      success: true,
      user: { id: '1', name: 'Test User', email: 'test@example.com' },
    });
  });

  it('renders remember me checkbox', () => {
    render(
      <MockAuthProvider>
        <LoginForm />
      </MockAuthProvider>
    );

    const rememberMeCheckbox = screen.getByRole('checkbox', {
      name: /remember me/i,
    });
    expect(rememberMeCheckbox).toBeInTheDocument();
    expect(rememberMeCheckbox).not.toBeChecked();
  });

  it('allows toggling remember me checkbox', () => {
    render(
      <MockAuthProvider>
        <LoginForm />
      </MockAuthProvider>
    );

    const rememberMeCheckbox = screen.getByRole('checkbox', {
      name: /remember me/i,
    });

    // Initially unchecked
    expect(rememberMeCheckbox).not.toBeChecked();

    // Click to check
    fireEvent.click(rememberMeCheckbox);
    expect(rememberMeCheckbox).toBeChecked();

    // Click to uncheck
    fireEvent.click(rememberMeCheckbox);
    expect(rememberMeCheckbox).not.toBeChecked();
  });

  it('passes rememberMe parameter to login function when checked', async () => {
    render(
      <MockAuthProvider>
        <LoginForm />
      </MockAuthProvider>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const rememberMeCheckbox = screen.getByRole('checkbox', {
      name: /remember me/i,
    });
    const submitButton = screen.getByRole('button', { name: /log in/i });

    // Fill form with remember me checked
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(rememberMeCheckbox);

    // Submit form
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        true
      );
    });
  });

  it('passes rememberMe as false when checkbox is unchecked', async () => {
    render(
      <MockAuthProvider>
        <LoginForm />
      </MockAuthProvider>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    // Fill form without checking remember me
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Submit form
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        false
      );
    });
  });

  it('displays remember me duration text', () => {
    render(
      <MockAuthProvider>
        <LoginForm />
      </MockAuthProvider>
    );

    expect(screen.getByText(/remember me for 30 days/i)).toBeInTheDocument();
  });

  it('disables remember me checkbox when form is submitting', async () => {
    // Mock login to be pending
    mockLogin.mockImplementation(() => new Promise(() => {}));

    render(
      <MockAuthProvider>
        <LoginForm />
      </MockAuthProvider>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const rememberMeCheckbox = screen.getByRole('checkbox', {
      name: /remember me/i,
    });
    const submitButton = screen.getByRole('button', { name: /log in/i });

    // Fill form
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Submit form
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(rememberMeCheckbox).toBeDisabled();
    });
  });
});
