import { convex } from './convex';
import { api } from '../convex/api';

export interface User {
  _id: string;
  name: string;
  email: string;
  profile_image_url?: string;
  role: string;
  _creationTime: number;
}

export interface AuthState {
  user: User | null;
  sessionToken: string | null;
  isLoading: boolean;
}

// Authentication service class
export class AuthService {
  private static instance: AuthService;
  private sessionToken: string | null = null;

  private constructor() {
    // Load session token from localStorage if available
    if (typeof window !== 'undefined') {
      this.sessionToken = localStorage.getItem('auth_session_token');
    }
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async register(name: string, email: string, password: string) {
    try {
      const result = await convex.mutation(api.auth.registerUser, {
        name,
        email,
        password,
      });
      return { success: true, user: result };
    } catch (error: any) {
      // Extract the actual error message from Convex error format
      let errorMessage = 'Registration failed';
      if (error.message) {
        // Check if it's a Convex formatted error
        if (error.message.includes('User with this email already exists')) {
          errorMessage =
            'An account with this email already exists. Please sign in instead.';
        } else if (error.message.includes('Uncaught Error:')) {
          // Extract the error message after "Uncaught Error:"
          const match = error.message.match(/Uncaught Error:\s*(.+?)(?:\n|$)/);
          errorMessage = match ? match[1].trim() : error.message;
        } else {
          errorMessage = error.message;
        }
      }
      return { success: false, error: errorMessage };
    }
  }

  async login(email: string, password: string) {
    try {
      const result = await convex.mutation(api.auth.loginUser, {
        email,
        password,
      });

      this.sessionToken = result.sessionToken;

      // Store session token
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_session_token', result.sessionToken);
      }

      return {
        success: true,
        user: result.user,
        sessionToken: result.sessionToken,
      };
    } catch (error: any) {
      // Extract the actual error message from Convex error format
      let errorMessage = 'Login failed';
      if (error.message) {
        if (error.message.includes('Invalid email or password')) {
          errorMessage =
            'Invalid email or password. Please check your credentials.';
        } else if (error.message.includes('Uncaught Error:')) {
          const match = error.message.match(/Uncaught Error:\s*(.+?)(?:\n|$)/);
          errorMessage = match ? match[1].trim() : error.message;
        } else {
          errorMessage = error.message;
        }
      }
      return { success: false, error: errorMessage };
    }
  }

  async logout() {
    try {
      if (this.sessionToken) {
        await convex.mutation(api.auth.logoutUser, {
          sessionToken: this.sessionToken,
        });
      }

      this.sessionToken = null;

      // Remove session token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_session_token');
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.sessionToken) {
      return null;
    }

    try {
      const user = await convex.query(api.users.getCurrentUser, {
        sessionToken: this.sessionToken,
      });
      return user;
    } catch (error) {
      // If session is invalid, clear it
      this.sessionToken = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_session_token');
      }
      return null;
    }
  }

  getSessionToken(): string | null {
    return this.sessionToken;
  }

  isAuthenticated(): boolean {
    return !!this.sessionToken;
  }
}

export const authService = AuthService.getInstance();
