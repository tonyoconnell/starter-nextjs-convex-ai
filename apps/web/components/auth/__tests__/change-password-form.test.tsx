import React from 'react';
import {
  screen,
  fireEvent,
  waitFor,
  act,
  render,
} from '@testing-library/react';
import { ChangePasswordForm } from '../change-password-form';
import { AuthProvider } from '../auth-provider';

// Mock the auth service
jest.mock('../../../lib/auth', () => ({
  authService: {
    getCurrentUser: jest.fn(),
    getSessionToken: jest.fn(),
    changePassword: jest.fn(),
  },
}));

import { authService } from '../../../lib/auth';
const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('ChangePasswordForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthService.getCurrentUser.mockResolvedValue(null);
    mockAuthService.getSessionToken.mockReturnValue(null);
    mockAuthService.changePassword.mockResolvedValue({ success: true });
  });

  describe('Component Rendering', () => {
    it('should render the form with all required fields', () => {
      render(<ChangePasswordForm />, {
        authState: {
          changePassword: jest.fn(),
        },
      });

      expect(
        screen.getByRole('heading', { name: /change password/i })
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
      expect(screen.getByLabelText('New Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /change password/i })
      ).toBeInTheDocument();
    });

    it('should show password requirements text', () => {
      render(<ChangePasswordForm />, {
        authState: {
          changePassword: jest.fn(),
        },
      });

      expect(
        screen.getByText(
          /must be at least 8 characters with uppercase, lowercase, number, and special character/i
        )
      ).toBeInTheDocument();
    });

    it('should show back to dashboard link', () => {
      render(<ChangePasswordForm />, {
        authState: {
          changePassword: jest.fn(),
        },
      });

      expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error when fields are empty', async () => {
      render(<ChangePasswordForm />, {
        authState: {
          changePassword: jest.fn(),
        },
      });

      // Get the form element and trigger submit directly to bypass HTML5 validation
      const form = screen
        .getByRole('button', { name: /change password/i })
        .closest('form')!;

      await act(async () => {
        fireEvent.submit(form);
      });

      expect(screen.getByText('Please fill in all fields')).toBeInTheDocument();
    });

    it('should show error when passwords do not match', async () => {
      render(<ChangePasswordForm />, {
        authState: {
          changePassword: jest.fn(),
        },
      });

      fireEvent.change(screen.getByLabelText('Current Password'), {
        target: { value: 'current123!' },
      });
      fireEvent.change(screen.getByLabelText('New Password'), {
        target: { value: 'NewPassword123!' },
      });
      fireEvent.change(screen.getByLabelText('Confirm New Password'), {
        target: { value: 'DifferentPassword123!' },
      });

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: /change password/i })
        );
      });

      expect(
        screen.getByText('New passwords do not match')
      ).toBeInTheDocument();
    });

    it('should show error when new password is same as current', async () => {
      render(<ChangePasswordForm />, {
        authState: {
          changePassword: jest.fn(),
        },
      });

      fireEvent.change(screen.getByLabelText('Current Password'), {
        target: { value: 'Password123!' },
      });
      fireEvent.change(screen.getByLabelText('New Password'), {
        target: { value: 'Password123!' },
      });
      fireEvent.change(screen.getByLabelText('Confirm New Password'), {
        target: { value: 'Password123!' },
      });

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: /change password/i })
        );
      });

      expect(
        screen.getByText('New password must be different from current password')
      ).toBeInTheDocument();
    });

    it('should validate password strength', async () => {
      render(<ChangePasswordForm />, {
        authState: {
          changePassword: jest.fn(),
        },
      });

      fireEvent.change(screen.getByLabelText('Current Password'), {
        target: { value: 'OldPassword123!' },
      });
      fireEvent.change(screen.getByLabelText('New Password'), {
        target: { value: 'weak' },
      });
      fireEvent.change(screen.getByLabelText('Confirm New Password'), {
        target: { value: 'weak' },
      });

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: /change password/i })
        );
      });

      expect(
        screen.getByText('Password must be at least 8 characters long')
      ).toBeInTheDocument();
    });
  });

  describe('Password Change Submission', () => {
    it('should call changePassword with correct arguments on valid submission', async () => {
      const mockChangePassword = jest.fn().mockResolvedValue({ success: true });

      render(<ChangePasswordForm />, {
        authState: {
          changePassword: mockChangePassword,
        },
      });

      fireEvent.change(screen.getByLabelText('Current Password'), {
        target: { value: 'OldPassword123!' },
      });
      fireEvent.change(screen.getByLabelText('New Password'), {
        target: { value: 'NewPassword123!' },
      });
      fireEvent.change(screen.getByLabelText('Confirm New Password'), {
        target: { value: 'NewPassword123!' },
      });

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: /change password/i })
        );
      });

      expect(mockChangePassword).toHaveBeenCalledWith(
        'OldPassword123!',
        'NewPassword123!'
      );
    });

    it('should show success message after successful password change', async () => {
      const mockChangePassword = jest.fn().mockResolvedValue({ success: true });

      render(<ChangePasswordForm />, {
        authState: {
          changePassword: mockChangePassword,
        },
      });

      fireEvent.change(screen.getByLabelText('Current Password'), {
        target: { value: 'OldPassword123!' },
      });
      fireEvent.change(screen.getByLabelText('New Password'), {
        target: { value: 'NewPassword123!' },
      });
      fireEvent.change(screen.getByLabelText('Confirm New Password'), {
        target: { value: 'NewPassword123!' },
      });

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: /change password/i })
        );
      });

      await waitFor(() => {
        expect(
          screen.getByText('Password changed successfully!')
        ).toBeInTheDocument();
      });

      // Check success message links
      expect(screen.getByText('Return to Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Go to Login')).toBeInTheDocument();
    });

    it('should show error message when password change fails', async () => {
      const mockChangePassword = jest.fn().mockResolvedValue({
        success: false,
        error: 'Current password is incorrect',
      });

      render(<ChangePasswordForm />, {
        authState: {
          changePassword: mockChangePassword,
        },
      });

      fireEvent.change(screen.getByLabelText('Current Password'), {
        target: { value: 'WrongPassword123!' },
      });
      fireEvent.change(screen.getByLabelText('New Password'), {
        target: { value: 'NewPassword123!' },
      });
      fireEvent.change(screen.getByLabelText('Confirm New Password'), {
        target: { value: 'NewPassword123!' },
      });

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: /change password/i })
        );
      });

      await waitFor(() => {
        expect(
          screen.getByText('Current password is incorrect')
        ).toBeInTheDocument();
      });
    });

    it('should handle unexpected errors gracefully', async () => {
      const mockChangePassword = jest
        .fn()
        .mockRejectedValue(new Error('Network error'));

      render(<ChangePasswordForm />, {
        authState: {
          changePassword: mockChangePassword,
        },
      });

      fireEvent.change(screen.getByLabelText('Current Password'), {
        target: { value: 'OldPassword123!' },
      });
      fireEvent.change(screen.getByLabelText('New Password'), {
        target: { value: 'NewPassword123!' },
      });
      fireEvent.change(screen.getByLabelText('Confirm New Password'), {
        target: { value: 'NewPassword123!' },
      });

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: /change password/i })
        );
      });

      await waitFor(() => {
        expect(
          screen.getByText('An unexpected error occurred')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during submission', async () => {
      let resolveChangePassword: (value: any) => void;
      const changePasswordPromise = new Promise(resolve => {
        resolveChangePassword = resolve;
      });
      const mockChangePassword = jest
        .fn()
        .mockReturnValue(changePasswordPromise);

      render(<ChangePasswordForm />, {
        authState: {
          changePassword: mockChangePassword,
        },
      });

      fireEvent.change(screen.getByLabelText('Current Password'), {
        target: { value: 'OldPassword123!' },
      });
      fireEvent.change(screen.getByLabelText('New Password'), {
        target: { value: 'NewPassword123!' },
      });
      fireEvent.change(screen.getByLabelText('Confirm New Password'), {
        target: { value: 'NewPassword123!' },
      });

      act(() => {
        fireEvent.click(
          screen.getByRole('button', { name: /change password/i })
        );
      });

      // Should show loading state
      expect(screen.getByText('Changing Password...')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /changing password/i })
      ).toBeDisabled();

      // Resolve the promise
      act(() => {
        resolveChangePassword!({ success: true });
      });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /change password/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe('Form Reset After Success', () => {
    it('should clear form fields after successful password change', async () => {
      const mockChangePassword = jest.fn().mockResolvedValue({ success: true });

      render(<ChangePasswordForm />, {
        authState: {
          changePassword: mockChangePassword,
        },
      });

      const currentPasswordField = screen.getByLabelText(
        'Current Password'
      ) as HTMLInputElement;
      const newPasswordField = screen.getByLabelText(
        'New Password'
      ) as HTMLInputElement;
      const confirmPasswordField = screen.getByLabelText(
        'Confirm New Password'
      ) as HTMLInputElement;

      fireEvent.change(currentPasswordField, {
        target: { value: 'OldPassword123!' },
      });
      fireEvent.change(newPasswordField, {
        target: { value: 'NewPassword123!' },
      });
      fireEvent.change(confirmPasswordField, {
        target: { value: 'NewPassword123!' },
      });

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: /change password/i })
        );
      });

      await waitFor(() => {
        expect(
          screen.getByText('Password changed successfully!')
        ).toBeInTheDocument();
      });

      // Form fields should be cleared
      expect(currentPasswordField.value).toBe('');
      expect(newPasswordField.value).toBe('');
      expect(confirmPasswordField.value).toBe('');
    });
  });
});
