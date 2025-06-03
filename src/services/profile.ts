// Profile management service

// src/services/profile.ts - Updated for Supabase
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'
import { User } from '@supabase/supabase-js' 

// Updated Profile type to match Supabase schema
export interface Profile {
  id: string
  user_id: string
  family_name?: string
  initial?: string
  full_name: string
  gender: 'male' | 'female' | 'other'
  date_of_birth?: string
  marital_status: 'married' | 'unmarried'
  profile_picture_url?: string
  created_at: string
  updated_at: string
  // Virtual fields from relationships
  father_id?: string
  father_name?: string
  mother_id?: string
  mother_name?: string
  spouse_id?: string
  spouse_name?: string
  children?: Profile[]
}

export interface CreateProfileData {
  family_name?: string
  initial?: string
  full_name: string
  gender: 'male' | 'female' | 'other'
  date_of_birth?: string
  marital_status?: 'married' | 'unmarried'
  profile_picture_url?: string
  father_id?: string
  mother_id?: string
  spouse_id?: string
}

export const createProfile = async (profileData: CreateProfileData): Promise<{ profile: Profile | null; error: string | null }> => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Start a transaction-like operation
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([{
        user_id: user.id,
        family_name: profileData.family_name,
        initial: profileData.initial,
        full_name: profileData.full_name,
        gender: profileData.gender,
        date_of_birth: profileData.date_of_birth,
        marital_status: profileData.marital_status || 'unmarried',
        profile_picture_url: profileData.profile_picture_url
      }])
      .select()
      .single()

    if (profileError) {
      throw new Error(profileError.message)
    }

    // Create family relationships
    const relationshipPromises = []

    if (profileData.father_id) {
      relationshipPromises.push(
        supabase
          .from('family_relationships')
          .insert([{
            parent_id: profileData.father_id,
            child_id: profile.id,
            relationship_type: 'father'
          }])
      )
    }

    if (profileData.mother_id) {
      relationshipPromises.push(
        supabase
          .from('family_relationships')
          .insert([{
            parent_id: profileData.mother_id,
            child_id: profile.id,
            relationship_type: 'mother'
          }])
      )
    }

    if (profileData.spouse_id) {
      relationshipPromises.push(
        supabase
          .from('spouse_relationships')
          .insert([{
            spouse_1_id: profile.id,
            spouse_2_id: profileData.spouse_id
          }])
      )

      // Update marital status for both profiles
      relationshipPromises.push(
        supabase
          .from('profiles')
          .update({ marital_status: 'married' })
          .eq('id', profileData.spouse_id)
      )
    }

    // Execute all relationship insertions
    const relationshipResults = await Promise.allSettled(relationshipPromises)
    
    // Check for any relationship errors (non-critical)
    relationshipResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.warn(`Relationship creation failed at index ${index}:`, result.reason)
      }
    })

    return { profile, error: null }
  } catch (error) {
    console.error('Create profile error:', error)
    return { 
      profile: null, 
      error: error instanceof Error ? error.message : 'Failed to create profile' 
    }
  }
}

export const updateProfile = async (profileId: string, updates: Partial<CreateProfileData>): Promise<{ profile: Profile | null; error: string | null }> => {
  try {
    // Update the profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({
        family_name: updates.family_name,
        initial: updates.initial,
        full_name: updates.full_name,
        gender: updates.gender,
        date_of_birth: updates.date_of_birth,
        marital_status: updates.marital_status,
        profile_picture_url: updates.profile_picture_url
      })
      .eq('id', profileId)
      .select()
      .single()

    if (profileError) {
      throw new Error(profileError.message)
    }

    // Handle relationship updates (this is more complex and might need separate functions)
    // For now, we'll keep the existing relationships and let the UI handle changes

    return { profile, error: null }
  } catch (error) {
    console.error('Update profile error:', error)
    return { 
      profile: null, 
      error: error instanceof Error ? error.message : 'Failed to update profile' 
    }
  }
}

export const getUserProfile = async (userId?: string): Promise<Profile | null> => {
  try {
    let targetUserId = userId

    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      targetUserId = user.id
    }

    const { data: profile, error } = await supabase
      .from('profile_with_relationships')
      .select('*')
      .eq('user_id', targetUserId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No profile found
        return null
      }
      throw new Error(error.message)
    }

    return profile
  } catch (error) {
    console.error('Get user profile error:', error)
    return null
  }
}

export const getProfileById = async (profileId: string): Promise<Profile | null> => {
  try {
    const { data: profile, error } = await supabase
      .from('profile_with_relationships')
      .select('*')
      .eq('id', profileId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No profile found
        return null
      }
      throw new Error(error.message)
    }

    return profile
  } catch (error) {
    console.error('Get profile by ID error:', error)
    return null
  }
}

export const searchProfiles = async (query: string, limit: number = 10): Promise<Profile[]> => {
  try {
    if (query.length < 2) return []

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.%${query}%,family_name.ilike.%${query}%,initial.ilike.%${query}%`)
      .limit(limit)

    if (error) {
      throw new Error(error.message)
    }

    return profiles || []
  } catch (error) {
    console.error('Search profiles error:', error)
    return []
  }
}

export const getChildren = async (profileId: string): Promise<Profile[]> => {
  try {
    const { data: children, error } = await supabase
      .from('profiles')
      .select(`
        *
      `)
      .in('id', 
        supabase
          .from('family_relationships')
          .select('child_id')
          .eq('parent_id', profileId)
      )

    if (error) {
      throw new Error(error.message)
    }

    return children || []
  } catch (error) {
    console.error('Get children error:', error)
    return []
  }
}

export const getFamilyNetwork = async (profileId: string): Promise<Profile[]> => {
  try {
    // This is a complex query to get all related family members
    // We'll use a stored procedure for better performance
    const { data: familyMembers, error } = await supabase
      .rpc('get_family_network', { profile_id: profileId })

    if (error) {
      throw new Error(error.message)
    }

    return familyMembers || []
  } catch (error) {
    console.error('Get family network error:', error)
    return []
  }
}

// Helper function to upload profile picture
export const uploadProfilePicture = async (file: File, profileId: string): Promise<{ url: string | null; error: string | null }> => {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${profileId}/profile.${fileExt}`

    const { data, error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      throw new Error(uploadError.message)
    }

    const { data: { publicUrl } } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(fileName)

    // Update profile with the new picture URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ profile_picture_url: publicUrl })
      .eq('id', profileId)

    if (updateError) {
      throw new Error(updateError.message)
    }

    return { url: publicUrl, error: null }
  } catch (error) {
    console.error('Upload profile picture error:', error)
    return { 
      url: null, 
      error: error instanceof Error ? error.message : 'Failed to upload picture' 
    }
  }
}

// Legacy functions for compatibility (will be removed later)
export const findRelatives = searchProfiles
export const getSuggestedRelatives = getFamilyNetwork