import React from 'react'
import { render, screen, waitFor } from '@/lib/test-utils'
import { LogoutButton } from '../logout-button'
import userEvent from '@testing-library/user-event'

describe('LogoutButton', () => {
  const mockLogout = jest.fn()
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockLogout.mockResolvedValue(undefined)
  })

  it('renders logout button when user is authenticated', () => {
    render(<LogoutButton />, {
      authState: {
        isAuthenticated: true,
        user: mockUser,
        logout: mockLogout
      }
    })
    
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument()
  })

  it('does not render when user is not authenticated', () => {
    render(<LogoutButton />, {
      authState: {
        isAuthenticated: false,
        user: null,
        logout: mockLogout
      }
    })
    
    expect(screen.queryByRole('button', { name: /log out/i })).not.toBeInTheDocument()
  })

  it('calls logout when clicked', async () => {
    const user = userEvent.setup()
    render(<LogoutButton />, {
      authState: {
        isAuthenticated: true,
        user: mockUser,
        logout: mockLogout
      }
    })
    
    const logoutButton = screen.getByRole('button', { name: /log out/i })
    await user.click(logoutButton)
    
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1)
    })
  })

  it('disables button during logout process', async () => {
    const user = userEvent.setup()
    mockLogout.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(<LogoutButton />, {
      authState: {
        isAuthenticated: true,
        user: mockUser,
        logout: mockLogout
      }
    })
    
    const logoutButton = screen.getByRole('button', { name: /log out/i })
    await user.click(logoutButton)
    
    expect(logoutButton).toBeDisabled()
    expect(screen.getByText(/logging out/i)).toBeInTheDocument()
    
    await waitFor(() => {
      expect(logoutButton).not.toBeDisabled()
      expect(screen.getByText(/log out/i)).toBeInTheDocument()
    })
  })

  it('handles logout errors gracefully', async () => {
    const user = userEvent.setup()
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    mockLogout.mockRejectedValueOnce(new Error('Logout failed'))
    
    render(<LogoutButton />, {
      authState: {
        isAuthenticated: true,
        user: mockUser,
        logout: mockLogout
      }
    })
    
    const logoutButton = screen.getByRole('button', { name: /log out/i })
    await user.click(logoutButton)
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Logout error:', expect.any(Error))
      expect(logoutButton).not.toBeDisabled()
    })
    
    consoleErrorSpy.mockRestore()
  })

  it('has correct styling classes', () => {
    render(<LogoutButton />, {
      authState: {
        isAuthenticated: true,
        user: mockUser,
        logout: mockLogout
      }
    })
    
    const logoutButton = screen.getByRole('button', { name: /log out/i })
    expect(logoutButton).toHaveClass('bg-red-600', 'hover:bg-red-700')
  })
})