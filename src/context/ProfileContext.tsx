// Profile context for managing profile state across the app

// src/context/ProfileContext.tsx - Updated for Supabase
import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { 
  Profile,
  CreateProfileData,
  getUserProfile, 
  createProfile as createProfileService, 
  updateProfile as updateProfileService,
  getFamilyNetwork
} from '../services/profile'

interface ProfileContextType {
  profile: Profile | null
  isLoading: boolean
  error: string | null
  suggestedRelatives: Profile[]
  createUserProfile: (profileData: CreateProfileData) => Promise<{ success: boolean; profile: Profile | null; error: string | null }>
  updateProfile: (profileId: string, updates: Partial<CreateProfileData>) => Promise<{ success: boolean; profile: Profile | null; error: string | null }>
  loadSuggestedRelatives: () => Promise<void>
  refreshProfile: () => Promise<void>
  clearError: () => void
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  isLoading: false,
  error: null,
  suggestedRelatives: [],
  createUserProfile: async () => ({ success: false, profile: null, error: 'ProfileContext not initialized' }),
  updateProfile: async () => ({ success: false, profile: null, error: 'ProfileContext not initialized' }),
  loadSuggestedRelatives: async () => {},
  refreshProfile: async () => {},
  clearError: () => {},
})

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestedRelatives, setSuggestedRelatives] = useState<Profile[]>([])

  // Load user profile when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserProfile()
    } else {
      setProfile(null)
      setSuggestedRelatives([])
      setError(null)
    }
  }, [isAuthenticated, user])

  // Set up real-time subscriptions for profile updates
  useEffect(() => {
    if (!user || !profile) return

    console.log('Setting up real-time subscriptions for profile:', profile.id)

    // Subscribe to profile changes
    const profileSubscription = supabase
      .channel('profile_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Profile changed:', payload)
          loadUserProfile() // Reload profile on any change
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_relationships'
        },
        (payload) => {
          console.log('Family relationship changed:', payload)
          // Check if this change affects the current user's family
          if (profile && (
            payload.new?.parent_id === profile.id || 
            payload.new?.child_id === profile.id ||
            payload.old?.parent_id === profile.id || 
            payload.old?.child_id === profile.id
          )) {
            loadUserProfile()
            loadSuggestedRelatives()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'spouse_relationships'
        },
        (payload) => {
          console.log('Spouse relationship changed:', payload)
          // Check if this change affects the current user
          if (profile && (
            payload.new?.spouse_1_id === profile.id || 
            payload.new?.spouse_2_id === profile.id ||
            payload.old?.spouse_1_id === profile.id || 
            payload.old?.spouse_2_id === profile.id
          )) {
            loadUserProfile()
            loadSuggestedRelatives()
          }
        }
      )
      .subscribe()

    return () => {
      console.log('Cleaning up real-time subscriptions')
      profileSubscription.unsubscribe()
    }
  }, [user, profile?.id])

  const loadUserProfile = async (): Promise<void> => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      const userProfile = await getUserProfile(user.id)
      setProfile(userProfile)
      
      if (userProfile) {
        await loadSuggestedRelatives()
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      setError(error instanceof Error ? error.message : 'Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  const createUserProfile = async (profileData: CreateProfileData): Promise<{ success: boolean; profile: Profile | null; error: string | null }> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { profile: newProfile, error: createError } = await createProfileService(profileData)
      
      if (createError || !newProfile) {
        setError(createError || 'Failed to create profile')
        return { success: false, profile: null, error: createError }
      }
      
      setProfile(newProfile)
      await loadSuggestedRelatives()
      
      return { success: true, profile: newProfile, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create profile'
      setError(errorMessage)
      return { success: false, profile: null, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = async (profileId: string, updates: Partial<CreateProfileData>): Promise<{ success: boolean; profile: Profile | null; error: string | null }> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { profile: updatedProfile, error: updateError } = await updateProfileService(profileId, updates)
      
      if (updateError || !updatedProfile) {
        setError(updateError || 'Failed to update profile')
        return { success: false, profile: null, error: updateError }
      }
      
      setProfile(updatedProfile)
      await loadSuggestedRelatives()
      
      return { success: true, profile: updatedProfile, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile'
      setError(errorMessage)
      return { success: false, profile: null, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const loadSuggestedRelatives = async (): Promise<void> => {
    if (!profile) return

    try {
      const familyNetwork = await getFamilyNetwork(profile.id)
      // Filter out the current user's profile from suggestions
      const suggestions = familyNetwork.filter(p => p.id !== profile.id)
      setSuggestedRelatives(suggestions)
    } catch (error) {
      console.error('Error loading suggested relatives:', error)
      // Don't set error state for non-critical suggestions
    }
  }

  const refreshProfile = async (): Promise<void> => {
    await loadUserProfile()
  }

  const clearError = (): void => {
    setError(null)
  }

  return (
    <ProfileContext.Provider
      value={{
        profile,
        isLoading,
        error,
        suggestedRelatives,
        createUserProfile,
        updateProfile,
        loadSuggestedRelatives,
        refreshProfile,
        clearError,
      }}
    >
      {children}
    </ProfileContext.Provider>
  )
}

export const useProfile = (): ProfileContextType => {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}