import React from 'react'
import { render, screen, waitFor } from '@/lib/test-utils'
import { GoogleOAuthButton } from '../google-oauth-button'
import userEvent from '@testing-library/user-event'

describe('GoogleOAuthButton', () => {
  const mockGetGoogleOAuthUrl = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetGoogleOAuthUrl.mockResolvedValue({
      success: true,
      url: 'https://accounts.google.com/oauth/authorize?...',
      state: 'test-state-123'
    })
  })

  it('renders Google OAuth button with default props', () => {
    render(<GoogleOAuthButton />, {
      authState: {
        getGoogleOAuthUrl: mockGetGoogleOAuthUrl
      }
    })
    
    const button = screen.getByRole('button', { name: /continue with google/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-gray-50')
  })

  it('renders with primary variant', () => {
    render(<GoogleOAuthButton variant="primary" />, {
      authState: {
        getGoogleOAuthUrl: mockGetGoogleOAuthUrl
      }
    })
    
    const button = screen.getByRole('button', { name: /continue with google/i })
    expect(button).toHaveClass('bg-white')
  })

  it('applies custom className', () => {
    render(<GoogleOAuthButton className="custom-class" />, {
      authState: {
        getGoogleOAuthUrl: mockGetGoogleOAuthUrl
      }
    })
    
    const button = screen.getByRole('button', { name: /continue with google/i })
    expect(button).toHaveClass('custom-class')
  })

  it('initiates Google OAuth flow when clicked', async () => {
    const user = userEvent.setup()
    render(<GoogleOAuthButton />, {
      authState: {
        getGoogleOAuthUrl: mockGetGoogleOAuthUrl
      }
    })
    
    const button = screen.getByRole('button', { name: /continue with google/i })
    await user.click(button)
    
    await waitFor(() => {
      expect(mockGetGoogleOAuthUrl).toHaveBeenCalledTimes(1)
    })
  })

  it('stores OAuth state in sessionStorage and redirects', async () => {
    const user = userEvent.setup()
    // Reset window state
    window.location.href = ''
    window.sessionStorage.setItem.mockClear()
    
    render(<GoogleOAuthButton />, {
      authState: {
        getGoogleOAuthUrl: mockGetGoogleOAuthUrl
      }
    })
    
    const button = screen.getByRole('button', { name: /continue with google/i })
    await user.click(button)
    
    await waitFor(() => {
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith('google_oauth_state', 'test-state-123')
      expect(window.location.href).toBe('https://accounts.google.com/oauth/authorize?...')
    })
  })

  it('displays error when OAuth URL generation fails', async () => {
    const user = userEvent.setup()
    mockGetGoogleOAuthUrl.mockResolvedValueOnce({
      success: false,
      error: 'OAuth configuration error'
    })
    
    render(<GoogleOAuthButton />, {
      authState: {
        getGoogleOAuthUrl: mockGetGoogleOAuthUrl
      }
    })
    
    const button = screen.getByRole('button', { name: /continue with google/i })
    await user.click(button)
    
    await waitFor(() => {
      expect(screen.getByText(/oauth configuration error/i)).toBeInTheDocument()
    })
  })

  it('displays generic error when URL is missing', async () => {
    const user = userEvent.setup()
    mockGetGoogleOAuthUrl.mockResolvedValueOnce({
      success: true,
      url: null
    })
    
    render(<GoogleOAuthButton />, {
      authState: {
        getGoogleOAuthUrl: mockGetGoogleOAuthUrl
      }
    })
    
    const button = screen.getByRole('button', { name: /continue with google/i })
    await user.click(button)
    
    await waitFor(() => {
      expect(screen.getByText(/failed to initialize google login/i)).toBeInTheDocument()
    })
  })

  it('handles unexpected errors gracefully', async () => {
    const user = userEvent.setup()
    mockGetGoogleOAuthUrl.mockRejectedValueOnce(new Error('Network error'))
    
    render(<GoogleOAuthButton />, {
      authState: {
        getGoogleOAuthUrl: mockGetGoogleOAuthUrl
      }
    })
    
    const button = screen.getByRole('button', { name: /continue with google/i })
    await user.click(button)
    
    await waitFor(() => {
      expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument()
    })
  })

  it('disables button during OAuth initialization', async () => {
    const user = userEvent.setup()
    mockGetGoogleOAuthUrl.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    )
    
    render(<GoogleOAuthButton />, {
      authState: {
        getGoogleOAuthUrl: mockGetGoogleOAuthUrl
      }
    })
    
    const button = screen.getByRole('button', { name: /continue with google/i })
    await user.click(button)
    
    expect(button).toBeDisabled()
    expect(screen.getByText(/connecting/i)).toBeInTheDocument()
    
    await waitFor(() => {
      expect(window.location.href).toBe('https://accounts.google.com/oauth/authorize?...')
    })
  })

  it('renders Google logo SVG', () => {
    render(<GoogleOAuthButton />, {
      authState: {
        getGoogleOAuthUrl: mockGetGoogleOAuthUrl
      }
    })
    
    const svg = screen.getByRole('button').querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('w-5', 'h-5', 'mr-2')
  })

  it('handles sessionStorage gracefully when unavailable', async () => {
    const user = userEvent.setup()
    // Reset window state first
    window.location.href = ''
    const mockSetItem = window.sessionStorage.setItem
    mockSetItem.mockClear()
    
    // Mock sessionStorage to be undefined temporarily
    const originalSessionStorage = window.sessionStorage
    delete (window as any).sessionStorage
    
    render(<GoogleOAuthButton />, {
      authState: {
        getGoogleOAuthUrl: mockGetGoogleOAuthUrl
      }
    })
    
    const button = screen.getByRole('button', { name: /continue with google/i })
    await user.click(button)
    
    // Restore sessionStorage
    window.sessionStorage = originalSessionStorage
    
    await waitFor(() => {
      expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument()
      expect(window.location.href).toBe('')
    })
  })
})