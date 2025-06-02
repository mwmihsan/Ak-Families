// Authentication context for managing user state across the app

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthState } from '../types';
import { register as authRegister, login as authLogin, logout as authLogout, checkAuth } from '../services/auth';

interface AuthContextType extends AuthState {
  register: (email: string, password: string, phone?: string) => Promise<{ success: boolean; error: string | null }>;
  login: (emailOrPhone: string, password: string) => Promise<{ success: boolean; error: string | null }>;
  logout: () => void;
}

const defaultAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const AuthContext = createContext<AuthContextType>({
  ...defaultAuthState,
  register: async () => ({ success: false, error: 'AuthContext not initialized' }),
  login: async () => ({ success: false, error: 'AuthContext not initialized' }),
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState);

  useEffect(() => {
    // Check if user is already logged in
    const user = checkAuth();
    setAuthState({
      user,
      isAuthenticated: !!user,
      isLoading: false,
      error: null,
    });
  }, []);

  const register = async (email: string, password: string, phone?: string): Promise<{ success: boolean; error: string | null }> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { user, error } = authRegister(email, password, phone);
      
      if (error || !user) {
        setAuthState(prev => ({ ...prev, isLoading: false, error }));
        return { success: false, error };
      }
      
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      return { success: true, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setAuthState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  };

  const login = async (emailOrPhone: string, password: string): Promise<{ success: boolean; error: string | null }> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { user, error } = authLogin(emailOrPhone, password);
      
      if (error || !user) {
        setAuthState(prev => ({ ...prev, isLoading: false, error }));
        return { success: false, error };
      }
      
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      return { success: true, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAuthState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  };

  const logout = (): void => {
    authLogout();
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => useContext(AuthContext);