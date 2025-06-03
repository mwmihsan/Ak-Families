// Profile management service

// src/services/profile.ts - Updated to use simplified schema
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

    // Create the profile
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

    // Get the complete profile with relationships
    const completeProfile = await getProfileByIdInternal(profile.id)
    
    return { profile: completeProfile || profile, error: null }
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

    // Handle relationship updates (simplified approach)
    // For relationship changes, we'll handle them separately to avoid complexity
    
    // Get the complete profile with relationships
    const completeProfile = await getProfileByIdInternal(profileId)

    return { profile: completeProfile || profile, error: null }
  } catch (error) {
    console.error('Update profile error:', error)
    return { 
      profile: null, 
      error: error instanceof Error ? error.message : 'Failed to update profile' 
    }
  }
}

// Internal helper to get profile with relationships
const getProfileByIdInternal = async (profileId: string): Promise<Profile | null> => {
  try {
    // Get base profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single()

    if (profileError || !profile) {
      return null
    }

    // Get father relationship
    const { data: fatherRel } = await supabase
      .from('family_relationships')
      .select(`
        parent_id,
        profiles!family_relationships_parent_id_fkey(id, full_name)
      `)
      .eq('child_id', profileId)
      .eq('relationship_type', 'father')
      .single()

    // Get mother relationship  
    const { data: motherRel } = await supabase
      .from('family_relationships')
      .select(`
        parent_id,
        profiles!family_relationships_parent_id_fkey(id, full_name)
      `)
      .eq('child_id', profileId)
      .eq('relationship_type', 'mother')
      .single()

    // Get spouse relationship
    const { data: spouseRel } = await supabase
      .from('spouse_relationships')
      .select(`
        spouse_1_id,
        spouse_2_id,
        spouse_1:profiles!spouse_relationships_spouse_1_id_fkey(id, full_name),
        spouse_2:profiles!spouse_relationships_spouse_2_id_fkey(id, full_name)
      `)
      .or(`spouse_1_id.eq.${profileId},spouse_2_id.eq.${profileId}`)
      .single()

    // Build complete profile
    const completeProfile: Profile = {
      ...profile,
      father_id: fatherRel?.parent_id,
      father_name: (fatherRel?.profiles as any)?.full_name,
      mother_id: motherRel?.parent_id,
      mother_name: (motherRel?.profiles as any)?.full_name,
      spouse_id: spouseRel?.spouse_1_id === profileId ? spouseRel?.spouse_2_id : spouseRel?.spouse_1_id,
      spouse_name: spouseRel?.spouse_1_id === profileId ? 
        (spouseRel?.spouse_2 as any)?.full_name : 
        (spouseRel?.spouse_1 as any)?.full_name
    }

    return completeProfile
  } catch (error) {
    console.error('Error getting profile with relationships:', error)
    return null
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

    // Get user's profile
    const { data: profile, error } = await supabase
      .from('profiles')
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

    // Get complete profile with relationships
    return await getProfileByIdInternal(profile.id)
  } catch (error) {
    console.error('Get user profile error:', error)
    return null
  }
}

export const getProfileById = async (profileId: string): Promise<Profile | null> => {
  try {
    return await getProfileByIdInternal(profileId)
  } catch (error) {
    console.error('Get profile by ID error:', error)
    return null
  }
}

export const searchProfiles = async (query: string, limit: number = 10): Promise<Profile[]> => {
  try {
    if (query.length < 2) return []

    // Use the stored function for better performance
    const { data: profiles, error } = await supabase
      .rpc('search_profiles', { 
        search_query: query, 
        limit_count: limit 
      })

    if (error) {
      console.error('Search profiles RPC error:', error)
      // Fallback to direct query
      const { data: fallbackProfiles, error: fallbackError } = await supabase
        .from('profiles')
        .select('*')
        .or(`full_name.ilike.%${query}%,family_name.ilike.%${query}%,initial.ilike.%${query}%`)
        .limit(limit)

      if (fallbackError) {
        throw new Error(fallbackError.message)
      }

      return fallbackProfiles || []
    }

    return profiles || []
  } catch (error) {
    console.error('Search profiles error:', error)
    return []
  }
}

export const getChildren = async (profileId: string): Promise<Profile[]> => {
  try {
    // Get children IDs from family relationships
    const { data: childrenRels, error: relsError } = await supabase
      .from('family_relationships')
      .select('child_id')
      .eq('parent_id', profileId)

    if (relsError) {
      throw new Error(relsError.message)
    }

    if (!childrenRels || childrenRels.length === 0) {
      return []
    }

    const childIds = childrenRels.map(rel => rel.child_id)

    // Get children profiles
    const { data: children, error } = await supabase
      .from('profiles')
      .select('*')
      .in('id', childIds)

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
    // Use the stored function for getting family network
    const { data: familyMembers, error } = await supabase
      .rpc('get_family_network', { profile_id: profileId })

    if (error) {
      console.error('Get family network RPC error:', error)
      // Fallback to manual queries
      return await getFamilyNetworkFallback(profileId)
    }

    return familyMembers || []
  } catch (error) {
    console.error('Get family network error:', error)
    return []
  }
}

// Fallback method for getting family network
const getFamilyNetworkFallback = async (profileId: string): Promise<Profile[]> => {
  try {
    const familyMembers: Profile[] = []
    const processedIds = new Set<string>([profileId])

    // Get parents
    const { data: parentRels } = await supabase
      .from('family_relationships')
      .select(`
        parent_id,
        profiles!family_relationships_parent_id_fkey(*)
      `)
      .eq('child_id', profileId)

    if (parentRels) {
      parentRels.forEach(rel => {
        const parent = rel.profiles as any
        if (parent && !processedIds.has(parent.id)) {
          familyMembers.push(parent)
          processedIds.add(parent.id)
        }
      })
    }

    // Get children
    const children = await getChildren(profileId)
    children.forEach(child => {
      if (!processedIds.has(child.id)) {
        familyMembers.push(child)
        processedIds.add(child.id)
      }
    })

    // Get spouse
    const { data: spouseRel } = await supabase
      .from('spouse_relationships')
      .select(`
        spouse_1_id,
        spouse_2_id,
        spouse_1:profiles!spouse_relationships_spouse_1_id_fkey(*),
        spouse_2:profiles!spouse_relationships_spouse_2_id_fkey(*)
      `)
      .or(`spouse_1_id.eq.${profileId},spouse_2_id.eq.${profileId}`)
      .single()

    if (spouseRel) {
      const spouse = spouseRel.spouse_1_id === profileId ? 
        spouseRel.spouse_2 as any : 
        spouseRel.spouse_1 as any
      
      if (spouse && !processedIds.has(spouse.id)) {
        familyMembers.push(spouse)
        processedIds.add(spouse.id)
      }
    }

    // Get siblings (people with same parents)
    if (parentRels && parentRels.length > 0) {
      for (const parentRel of parentRels) {
        const { data: siblingRels } = await supabase
          .from('family_relationships')
          .select(`
            child_id,
            profiles!family_relationships_child_id_fkey(*)
          `)
          .eq('parent_id', parentRel.parent_id)
          .neq('child_id', profileId)

        if (siblingRels) {
          siblingRels.forEach(rel => {
            const sibling = rel.profiles as any
            if (sibling && !processedIds.has(sibling.id)) {
              familyMembers.push(sibling)
              processedIds.add(sibling.id)
            }
          })
        }
      }
    }

    return familyMembers
  } catch (error) {
    console.error('Get family network fallback error:', error)
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

// Helper function to create family relationships
export const createFamilyRelationship = async (
  parentId: string, 
  childId: string, 
  relationshipType: 'father' | 'mother'
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from('family_relationships')
      .insert([{
        parent_id: parentId,
        child_id: childId,
        relationship_type: relationshipType
      }])

    if (error) {
      throw new Error(error.message)
    }

    return { error: null }
  } catch (error) {
    console.error('Create family relationship error:', error)
    return { 
      error: error instanceof Error ? error.message : 'Failed to create relationship' 
    }
  }
}

// Helper function to create spouse relationships
export const createSpouseRelationship = async (
  spouse1Id: string, 
  spouse2Id: string
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from('spouse_relationships')
      .insert([{
        spouse_1_id: spouse1Id,
        spouse_2_id: spouse2Id
      }])

    if (error) {
      throw new Error(error.message)
    }

    // Update marital status for both profiles
    await Promise.all([
      supabase
        .from('profiles')
        .update({ marital_status: 'married' })
        .eq('id', spouse1Id),
      supabase
        .from('profiles')
        .update({ marital_status: 'married' })
        .eq('id', spouse2Id)
    ])

    return { error: null }
  } catch (error) {
    console.error('Create spouse relationship error:', error)
    return { 
      error: error instanceof Error ? error.message : 'Failed to create relationship' 
    }
  }
}

// Legacy functions for compatibility (will be removed later)
export const findRelatives = searchProfiles
export const getSuggestedRelatives = getFamilyNetwork