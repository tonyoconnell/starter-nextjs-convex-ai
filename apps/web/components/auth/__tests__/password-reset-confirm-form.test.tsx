import React from 'react'
import { render, screen, waitFor } from '@/lib/test-utils'
import { PasswordResetConfirmForm } from '../password-reset-confirm-form'
import userEvent from '@testing-library/user-event'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('PasswordResetConfirmForm', () => {
  const mockResetPassword = jest.fn()
  const testToken = 'test-reset-token'

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockResetPassword.mockResolvedValue({ success: true })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders password reset confirmation form', () => {
    render(<PasswordResetConfirmForm token={testToken} />, {
      authState: {
        resetPassword: mockResetPassword
      }
    })
    
    expect(screen.getByRole('heading', { name: /set new password/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument()
  })

  it.skip('validates required fields', async () => {
    const user = userEvent.setup()
    render(<PasswordResetConfirmForm token={testToken} />, {
      authState: {
        resetPassword: mockResetPassword
      }
    })
    
    const newPasswordInput = screen.getByLabelText(/^new password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
    const submitButton = screen.getByRole('button', { name: /reset password/i })
    
    // Clear any default values and leave fields empty
    await user.clear(newPasswordInput)
    await user.clear(confirmPasswordInput)
    
    // Submit without filling fields
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Please fill in all fields')).toBeInTheDocument()
    })
  })

  it('validates password requirements', async () => {
    const user = userEvent.setup({ delay: null })
    render(<PasswordResetConfirmForm token={testToken} />, {
      authState: {
        resetPassword: mockResetPassword
      }
    })
    
    const newPasswordInput = screen.getByLabelText(/^new password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
    const submitButton = screen.getByRole('button', { name: /reset password/i })
    
    // Test short password
    await user.type(newPasswordInput, 'short')
    await user.type(confirmPasswordInput, 'short')
    await user.click(submitButton)
    expect(screen.getByText(/password must be at least 8 characters long/i)).toBeInTheDocument()
    
    // Test password without lowercase
    await user.clear(newPasswordInput)
    await user.clear(confirmPasswordInput)
    await user.type(newPasswordInput, 'PASSWORD123!')
    await user.type(confirmPasswordInput, 'PASSWORD123!')
    await user.click(submitButton)
    expect(screen.getByText(/password must contain at least one lowercase letter/i)).toBeInTheDocument()
    
    // Test password without uppercase
    await user.clear(newPasswordInput)
    await user.clear(confirmPasswordInput)
    await user.type(newPasswordInput, 'password123!')
    await user.type(confirmPasswordInput, 'password123!')
    await user.click(submitButton)
    expect(screen.getByText(/password must contain at least one uppercase letter/i)).toBeInTheDocument()
    
    // Test password without number
    await user.clear(newPasswordInput)
    await user.clear(confirmPasswordInput)
    await user.type(newPasswordInput, 'Password!')
    await user.type(confirmPasswordInput, 'Password!')
    await user.click(submitButton)
    expect(screen.getByText(/password must contain at least one number/i)).toBeInTheDocument()
    
    // Test password without special character
    await user.clear(newPasswordInput)
    await user.clear(confirmPasswordInput)
    await user.type(newPasswordInput, 'Password123')
    await user.type(confirmPasswordInput, 'Password123')
    await user.click(submitButton)
    expect(screen.getByText(/password must contain at least one special character/i)).toBeInTheDocument()
  })

  it('validates password confirmation match', async () => {
    const user = userEvent.setup({ delay: null })
    render(<PasswordResetConfirmForm token={testToken} />, {
      authState: {
        resetPassword: mockResetPassword
      }
    })
    
    const newPasswordInput = screen.getByLabelText(/^new password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
    const submitButton = screen.getByRole('button', { name: /reset password/i })
    
    await user.type(newPasswordInput, 'ValidPass123!')
    await user.type(confirmPasswordInput, 'DifferentPass123!')
    await user.click(submitButton)
    
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
  })

  it('submits form with valid passwords', async () => {
    const user = userEvent.setup({ delay: null })
    render(<PasswordResetConfirmForm token={testToken} />, {
      authState: {
        resetPassword: mockResetPassword
      }
    })
    
    const newPasswordInput = screen.getByLabelText(/^new password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
    const submitButton = screen.getByRole('button', { name: /reset password/i })
    
    await user.type(newPasswordInput, 'ValidPass123!')
    await user.type(confirmPasswordInput, 'ValidPass123!')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith(testToken, 'ValidPass123!')
    })
  })

  it.skip('shows success message and redirects after successful reset', async () => {
    const user = userEvent.setup({ delay: null })
    render(<PasswordResetConfirmForm token={testToken} />, {
      authState: {
        resetPassword: mockResetPassword
      }
    })
    
    const newPasswordInput = screen.getByLabelText(/^new password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
    const submitButton = screen.getByRole('button', { name: /reset password/i })
    
    await user.type(newPasswordInput, 'ValidPass123!')
    await user.type(confirmPasswordInput, 'ValidPass123!')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/password reset successful/i)).toBeInTheDocument()
      expect(screen.getByText((content, element) => {
        return element?.textContent === 'Redirecting to login page in 3 seconds...'
      })).toBeInTheDocument()
    })
    
    // Fast-forward through countdown
    jest.advanceTimersByTime(1000)
    await waitFor(() => {
      expect(screen.getByText(/redirecting to login in 2 seconds/i)).toBeInTheDocument()
    })
    
    jest.advanceTimersByTime(1000)
    await waitFor(() => {
      expect(screen.getByText(/redirecting to login in 1 seconds/i)).toBeInTheDocument()
    })
    
    jest.advanceTimersByTime(1000)
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        '/login?message=Password reset successful. Please log in with your new password.'
      )
    })
  })

  it('displays error message on reset failure', async () => {
    const user = userEvent.setup({ delay: null })
    mockResetPassword.mockResolvedValueOnce({ 
      success: false, 
      error: 'Invalid or expired token' 
    })
    
    render(<PasswordResetConfirmForm token={testToken} />, {
      authState: {
        resetPassword: mockResetPassword
      }
    })
    
    const newPasswordInput = screen.getByLabelText(/^new password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
    const submitButton = screen.getByRole('button', { name: /reset password/i })
    
    await user.type(newPasswordInput, 'ValidPass123!')
    await user.type(confirmPasswordInput, 'ValidPass123!')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/invalid or expired token/i)).toBeInTheDocument()
    })
  })

  it('disables form during submission', async () => {
    const user = userEvent.setup({ delay: null })
    mockResetPassword.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    )
    
    render(<PasswordResetConfirmForm token={testToken} />, {
      authState: {
        resetPassword: mockResetPassword
      }
    })
    
    const newPasswordInput = screen.getByLabelText(/^new password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
    const submitButton = screen.getByRole('button', { name: /reset password/i })
    
    await user.type(newPasswordInput, 'ValidPass123!')
    await user.type(confirmPasswordInput, 'ValidPass123!')
    await user.click(submitButton)
    
    expect(submitButton).toBeDisabled()
    expect(screen.getByText(/resetting password/i)).toBeInTheDocument()
    
    jest.advanceTimersByTime(100)
    
    await waitFor(() => {
      expect(newPasswordInput).not.toBeDisabled()
    })
  })

  it('shows password requirements helper text', () => {
    render(<PasswordResetConfirmForm token={testToken} />, {
      authState: {
        resetPassword: mockResetPassword
      }
    })
    
    expect(screen.getByText(/must be at least 8 characters/i)).toBeInTheDocument()
    expect(screen.getByText(/uppercase/i)).toBeInTheDocument()
    expect(screen.getByText(/lowercase/i)).toBeInTheDocument()
    expect(screen.getByText(/number/i)).toBeInTheDocument()
    expect(screen.getByText(/special character/i)).toBeInTheDocument()
  })
})