'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, User, AuthState } from '../../lib/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    sessionToken: null,
    isLoading: true,
  });

  const refreshUser = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const user = await authService.getCurrentUser();
      const sessionToken = authService.getSessionToken();
      
      setAuthState({
        user,
        sessionToken,
        isLoading: false,
      });
    } catch (error) {
      setAuthState({
        user: null,
        sessionToken: null,
        isLoading: false,
      });
    }
  };

  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    const result = await authService.login(email, password);
    
    if (result.success) {
      setAuthState({
        user: result.user,
        sessionToken: result.sessionToken,
        isLoading: false,
      });
      return { success: true };
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: result.error };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    const result = await authService.register(name, email, password);
    
    if (result.success) {
      // After registration, automatically log in
      const loginResult = await authService.login(email, password);
      if (loginResult.success) {
        setAuthState({
          user: loginResult.user,
          sessionToken: loginResult.sessionToken,
          isLoading: false,
        });
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
      return { success: true };
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: result.error };
    }
  };

  const logout = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    await authService.logout();
    
    setAuthState({
      user: null,
      sessionToken: null,
      isLoading: false,
    });
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}