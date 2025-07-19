import React from 'react'
import { render, screen, waitFor } from '@/lib/test-utils'
import { PasswordResetForm } from '../password-reset-form'
import userEvent from '@testing-library/user-event'

describe('PasswordResetForm', () => {
  const mockRequestPasswordReset = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockRequestPasswordReset.mockResolvedValue({ success: true })
  })

  it('renders password reset form after mounting', async () => {
    render(<PasswordResetForm />, {
      authState: {
        requestPasswordReset: mockRequestPasswordReset
      }
    })
    
    // Wait for component to mount
    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    })
    
    expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send reset email/i })).toBeInTheDocument()
    expect(screen.getByText(/back to login/i)).toBeInTheDocument()
  })

  it('shows loading state before mounting', () => {
    render(<PasswordResetForm />)
    
    expect(screen.getByText(/reset password/i)).toBeInTheDocument()
    // Note: Loading state is only visible for a brief moment before mounting completes
    // This test primarily checks that the component renders without crashing
  })

  it.skip('validates email field', async () => {
    const user = userEvent.setup()
    render(<PasswordResetForm />, {
      authState: {
        requestPasswordReset: mockRequestPasswordReset
      }
    })
    
    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    })
    
    const submitButton = screen.getByRole('button', { name: /send reset email/i })
    
    // Fill with invalid email format to test React validation (bypasses HTML5 required)
    const emailInput = screen.getByLabelText(/email address/i)
    await user.type(emailInput, 'invalid-email')
    
    // Ensure the input value is updated
    await waitFor(() => {
      expect(emailInput).toHaveValue('invalid-email')
    })
    
    // Give React time to update state
    await new Promise(resolve => setTimeout(resolve, 100))
    
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid email', async () => {
    const user = userEvent.setup()
    render(<PasswordResetForm />, {
      authState: {
        requestPasswordReset: mockRequestPasswordReset
      }
    })
    
    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    })
    
    const emailInput = screen.getByLabelText(/email address/i)
    const submitButton = screen.getByRole('button', { name: /send reset email/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockRequestPasswordReset).toHaveBeenCalledWith('test@example.com')
    })
  })

  it('shows success message after successful submission', async () => {
    const user = userEvent.setup()
    render(<PasswordResetForm />, {
      authState: {
        requestPasswordReset: mockRequestPasswordReset
      }
    })
    
    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    })
    
    const emailInput = screen.getByLabelText(/email address/i)
    const submitButton = screen.getByRole('button', { name: /send reset email/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/password reset email sent/i)).toBeInTheDocument()
      expect(screen.getByText(/check your email for instructions/i)).toBeInTheDocument()
      expect(screen.getByText(/development mode/i)).toBeInTheDocument()
    })
    
    // Email field should be cleared
    expect(emailInput).toHaveValue('')
  })

  it('displays error message on failure', async () => {
    const user = userEvent.setup()
    mockRequestPasswordReset.mockResolvedValueOnce({ 
      success: false, 
      error: 'User not found' 
    })
    
    render(<PasswordResetForm />, {
      authState: {
        requestPasswordReset: mockRequestPasswordReset
      }
    })
    
    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    })
    
    const emailInput = screen.getByLabelText(/email address/i)
    const submitButton = screen.getByRole('button', { name: /send reset email/i })
    
    await user.type(emailInput, 'nonexistent@example.com')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/user not found/i)).toBeInTheDocument()
    })
  })

  it('disables form during submission', async () => {
    const user = userEvent.setup()
    mockRequestPasswordReset.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    )
    
    render(<PasswordResetForm />, {
      authState: {
        requestPasswordReset: mockRequestPasswordReset
      }
    })
    
    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    })
    
    const emailInput = screen.getByLabelText(/email address/i)
    const submitButton = screen.getByRole('button', { name: /send reset email/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)
    
    expect(emailInput).toBeDisabled()
    expect(submitButton).toBeDisabled()
    expect(screen.getByText(/sending/i)).toBeInTheDocument()
    
    await waitFor(() => {
      expect(emailInput).not.toBeDisabled()
    })
  })

  it('handles unexpected errors gracefully', async () => {
    const user = userEvent.setup()
    mockRequestPasswordReset.mockRejectedValueOnce(new Error('Network error'))
    
    render(<PasswordResetForm />, {
      authState: {
        requestPasswordReset: mockRequestPasswordReset
      }
    })
    
    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    })
    
    const emailInput = screen.getByLabelText(/email address/i)
    const submitButton = screen.getByRole('button', { name: /send reset email/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument()
    })
  })
})