import React from 'react'
import { render, screen, fireEvent, waitFor } from '@/lib/test-utils'
import { LoginForm } from '../login-form'
import userEvent from '@testing-library/user-event'

// Mock the OAuth components
jest.mock('../github-oauth-button', () => ({
  GitHubOAuthButton: () => <button>Sign in with GitHub</button>
}))

jest.mock('../google-oauth-button', () => ({
  GoogleOAuthButton: () => <button>Sign in with Google</button>
}))

describe('LoginForm', () => {
  const mockLogin = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockLogin.mockResolvedValue({ success: true })
  })

  it('renders login form with all fields', () => {
    render(<LoginForm />)
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
    expect(screen.getByText(/forgot your password/i)).toBeInTheDocument()
    expect(screen.getByText(/sign in with github/i)).toBeInTheDocument()
    expect(screen.getByText(/sign in with google/i)).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const submitButton = screen.getByRole('button', { name: /log in/i })
    
    // Submit without filling fields
    await user.click(submitButton)
    expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument()
    
    // Fill email without @ symbol and password to trigger different validation
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    
    // Clear fields and fill with invalid email but valid password
    await user.clear(emailInput)
    await user.clear(passwordInput)
    await user.type(emailInput, 'invalidemail')
    await user.type(passwordInput, 'password123')
    
    // Wait a moment for the form state to update
    await waitFor(() => {
      expect(emailInput).toHaveValue('invalidemail')
      expect(passwordInput).toHaveValue('password123')
    })
    
    // Give React time to update the state
    await new Promise(resolve => setTimeout(resolve, 100))
    
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid credentials', async () => {
    const user = userEvent.setup()
    const { render: customRender } = await import('@/lib/test-utils')
    
    customRender(<LoginForm />, {
      authState: {
        isAuthenticated: false,
        login: mockLogin
      }
    })
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const rememberMeCheckbox = screen.getByLabelText(/remember me/i)
    const submitButton = screen.getByRole('button', { name: /log in/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(rememberMeCheckbox)
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123', true)
    })
  })

  it('displays error message on login failure', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValueOnce({ success: false, error: 'Invalid credentials' })
    
    const { render: customRender } = await import('@/lib/test-utils')
    customRender(<LoginForm />, {
      authState: {
        isAuthenticated: false,
        login: mockLogin
      }
    })
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const submitButton = screen.getByRole('button', { name: /log in/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })
  })

  it('disables form during submission', async () => {
    const user = userEvent.setup()
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    const { render: customRender } = await import('@/lib/test-utils')
    customRender(<LoginForm />, {
      authState: {
        isAuthenticated: false,
        login: mockLogin
      }
    })
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const submitButton = screen.getByRole('button', { name: /log in/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    expect(emailInput).toBeDisabled()
    expect(passwordInput).toBeDisabled()
    expect(submitButton).toBeDisabled()
    expect(screen.getByText(/logging in/i)).toBeInTheDocument()
    
    await waitFor(() => {
      expect(emailInput).not.toBeDisabled()
    })
  })

  it('handles unexpected errors gracefully', async () => {
    const user = userEvent.setup()
    mockLogin.mockRejectedValueOnce(new Error('Network error'))
    
    const { render: customRender } = await import('@/lib/test-utils')
    customRender(<LoginForm />, {
      authState: {
        isAuthenticated: false,
        login: mockLogin
      }
    })
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const submitButton = screen.getByRole('button', { name: /log in/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument()
    })
  })

  it('maintains remember me state', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const rememberMeCheckbox = screen.getByLabelText(/remember me/i) as HTMLInputElement
    
    expect(rememberMeCheckbox.checked).toBe(false)
    
    await user.click(rememberMeCheckbox)
    expect(rememberMeCheckbox.checked).toBe(true)
    
    await user.click(rememberMeCheckbox)
    expect(rememberMeCheckbox.checked).toBe(false)
  })
})