// Authentication context for managing user state across the app

// src/context/AuthContext.tsx - Fixed version
import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { 
  register as authRegister, 
  login as authLogin, 
  logout as authLogout 
} from '../services/auth'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface AuthContextType extends AuthState {
  register: (email: string, password: string, phone?: string) => Promise<{ success: boolean; error: string | null }>
  login: (emailOrPhone: string, password: string) => Promise<{ success: boolean; error: string | null }>
  logout: () => Promise<void>
  clearError: () => void
}

const defaultAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
}

const AuthContext = createContext<AuthContextType>({
  ...defaultAuthState,
  register: async () => ({ success: false, error: 'AuthContext not initialized' }),
  login: async () => ({ success: false, error: 'AuthContext not initialized' }),
  logout: async () => {},
  clearError: () => {},
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState)

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...')
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (error) {
          console.error('Error getting initial session:', error)
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null, // Don't show error for initial session failure
          })
          return
        }

        console.log('Initial session:', session?.user?.email || 'No session')
        
        setAuthState({
          user: session?.user ?? null,
          isAuthenticated: !!session?.user,
          isLoading: false,
          error: null,
        })
      } catch (error) {
        console.error('Error in getInitialSession:', error)
        if (!mounted) return
        
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null, // Don't show initialization errors to user
        })
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        console.log('Auth state changed:', event, session?.user?.email || 'No user')
        
        // Handle the auth state change
        setAuthState(prev => ({
          ...prev,
          user: session?.user ?? null,
          isAuthenticated: !!session?.user,
          isLoading: false,
          error: null,
        }))

        // Handle specific auth events
        switch (event) {
          case 'SIGNED_IN':
            console.log('User signed in successfully')
            break
          case 'SIGNED_OUT':
            console.log('User signed out')
            break
          case 'PASSWORD_RECOVERY':
            console.log('Password recovery initiated')
            break
          case 'TOKEN_REFRESHED':
            console.log('Token refreshed successfully')
            break
          case 'USER_UPDATED':
            console.log('User profile updated')
            break
          case 'INITIAL_SESSION':
            console.log('Initial session loaded')
            break
          default:
            console.log('Auth event:', event)
        }
      }
    )

    // Cleanup function
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const register = async (email: string, password: string, phone?: string): Promise<{ success: boolean; error: string | null }> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      console.log('Attempting to register user:', email)
      const { user, error } = await authRegister(email, password, phone)
      
      if (error || !user) {
        console.error('Registration failed:', error)
        setAuthState(prev => ({ ...prev, isLoading: false, error }))
        return { success: false, error }
      }
      
      console.log('Registration successful:', user.email)
      // Auth state will be updated by the onAuthStateChange listener
      return { success: true, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed'
      console.error('Registration error:', errorMessage)
      setAuthState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      return { success: false, error: errorMessage }
    }
  }

  const login = async (emailOrPhone: string, password: string): Promise<{ success: boolean; error: string | null }> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      console.log('Attempting to login user:', emailOrPhone)
      const { user, error } = await authLogin(emailOrPhone, password)
      
      if (error || !user) {
        console.error('Login failed:', error)
        setAuthState(prev => ({ ...prev, isLoading: false, error }))
        return { success: false, error }
      }
      
      console.log('Login successful:', user.email)
      // Auth state will be updated by the onAuthStateChange listener
      return { success: true, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      console.error('Login error:', errorMessage)
      setAuthState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      return { success: false, error: errorMessage }
    }
  }

  const logout = async (): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true }))
    
    try {
      console.log('Attempting to logout user')
      const { error } = await authLogout()
      
      if (error) {
        console.error('Logout failed:', error)
        setAuthState(prev => ({ ...prev, isLoading: false, error }))
        return
      }
      
      console.log('Logout successful')
      // Auth state will be updated by the onAuthStateChange listener
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed'
      console.error('Logout error:', errorMessage)
      setAuthState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
    }
  }

  const clearError = (): void => {
    setAuthState(prev => ({ ...prev, error: null }))
  }

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        register,
        login,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}