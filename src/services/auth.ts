// Authentication service

// src/services/auth.ts - Updated for Supabase
import { supabase } from '../lib/supabase'
import { User } from '@supabase/supabase-js'

export interface AuthResult {
  user: User | null
  error: string | null
}

export const register = async (
  email: string, 
  password: string, 
  phone?: string
): Promise<AuthResult> => {
  try {
    // 1. Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          phone: phone || null
        }
      }
    })

    if (authError) {
      throw new Error(authError.message)
    }

    if (!authData.user) {
      throw new Error('Registration failed: No user data returned')
    }

    // 2. Update the users table with additional info
    if (phone) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ phone })
        .eq('id', authData.user.id)

      if (updateError) {
        console.warn('Failed to update phone number:', updateError)
      }
    }

    return { 
      user: authData.user, 
      error: null 
    }
  } catch (error) {
    console.error('Registration error:', error)
    return { 
      user: null, 
      error: error instanceof Error ? error.message : 'Registration failed' 
    }
  }
}

export const login = async (
  emailOrPhone: string, 
  password: string
): Promise<AuthResult> => {
  try {
    // Determine if input is email or phone
    const isEmail = emailOrPhone.includes('@')
    
    let authResult
    
    if (isEmail) {
      // Login with email
      authResult = await supabase.auth.signInWithPassword({
        email: emailOrPhone,
        password
      })
    } else {
      // For phone login, we need to find the email first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('phone', emailOrPhone)
        .single()

      if (userError || !userData) {
        throw new Error('User not found with this phone number')
      }

      authResult = await supabase.auth.signInWithPassword({
        email: userData.email,
        password
      })
    }

    const { data, error } = authResult

    if (error) {
      throw new Error(error.message)
    }

    return { 
      user: data.user, 
      error: null 
    }
  } catch (error) {
    console.error('Login error:', error)
    return { 
      user: null, 
      error: error instanceof Error ? error.message : 'Login failed' 
    }
  }
}

export const logout = async (): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      throw new Error(error.message)
    }

    return { error: null }
  } catch (error) {
    console.error('Logout error:', error)
    return { 
      error: error instanceof Error ? error.message : 'Logout failed' 
    }
  }
}

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Get current user error:', error)
      return null
    }

    return user
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

export const checkAuth = async (): Promise<User | null> => {
  // For immediate synchronous check, use the session
  const session = supabase.auth.getSession()
  return await session ? null : null // This will be handled by the auth context
}

// Password reset functionality
export const resetPassword = async (email: string): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) {
      throw new Error(error.message)
    }

    return { error: null }
  } catch (error) {
    console.error('Password reset error:', error)
    return { 
      error: error instanceof Error ? error.message : 'Password reset failed' 
    }
  }
}

// Update password
export const updatePassword = async (newPassword: string): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      throw new Error(error.message)
    }

    return { error: null }
  } catch (error) {
    console.error('Update password error:', error)
    return { 
      error: error instanceof Error ? error.message : 'Password update failed' 
    }
  }
}