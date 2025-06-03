// src/utils/dataMigration.ts
import React from 'react'
import { supabase } from '../lib/supabase'

// Legacy types from localStorage
interface LegacyUser {
  id: string
  email: string
  password: string
  phone?: string
}

interface LegacyProfile {
  id: string
  userId: string
  familyName?: string
  initial?: string
  fullName: string
  gender: 'male' | 'female' | 'other'
  dateOfBirth?: string
  maritalStatus: 'married' | 'unmarried'
  fatherId?: string
  motherId?: string
  spouseId?: string
  childrenIds: string[]
  profilePicture?: string
}

interface LegacyRelationship {
  type: 'parent' | 'child' | 'spouse'
  from: string
  to: string
}

export interface MigrationResult {
  success: boolean
  migratedUsers: number
  migratedProfiles: number
  migratedRelationships: number
  errors: string[]
  warnings: string[]
}

export const checkForLegacyData = (): boolean => {
  const users = localStorage.getItem('ak-families-users')
  const profiles = localStorage.getItem('ak-families-profiles')
  const relationships = localStorage.getItem('ak-families-relationships')
  
  return !!(users || profiles || relationships)
}

export const getLegacyDataSummary = () => {
  const users = JSON.parse(localStorage.getItem('ak-families-users') || '[]')
  const profiles = JSON.parse(localStorage.getItem('ak-families-profiles') || '[]')
  const relationships = JSON.parse(localStorage.getItem('ak-families-relationships') || '[]')
  
  return {
    users: users.length,
    profiles: profiles.length,
    relationships: relationships.length
  }
}

export const migrateDataToSupabase = async (): Promise<MigrationResult> => {
  const result: MigrationResult = {
    success: false,
    migratedUsers: 0,
    migratedProfiles: 0,
    migratedRelationships: 0,
    errors: [],
    warnings: []
  }

  try {
    // Get legacy data
    const legacyUsers: LegacyUser[] = JSON.parse(localStorage.getItem('ak-families-users') || '[]')
    const legacyProfiles: LegacyProfile[] = JSON.parse(localStorage.getItem('ak-families-profiles') || '[]')
    const legacyRelationships: LegacyRelationship[] = JSON.parse(localStorage.getItem('ak-families-relationships') || '[]')

    console.log('Starting migration...', { 
      users: legacyUsers.length, 
      profiles: legacyProfiles.length, 
      relationships: legacyRelationships.length 
    })

    // Step 1: Handle user authentication migration
    // Note: We can't migrate passwords directly for security reasons
    if (legacyUsers.length > 0) {
      result.warnings.push(`Found ${legacyUsers.length} users in localStorage. You'll need to use password reset for existing accounts.`)
      
      // For the current user, we'll assume they're already authenticated in Supabase
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser) {
        result.errors.push('No authenticated user found. Please log in to Supabase first.')
        return result
      }

      // Update current user's phone if it exists in legacy data
      const legacyUser = legacyUsers.find(u => u.email === currentUser.email)
      if (legacyUser?.phone) {
        const { error } = await supabase
          .from('users')
          .update({ phone: legacyUser.phone })
          .eq('id', currentUser.id)
        
        if (error) {
          result.warnings.push(`Failed to update phone number: ${error.message}`)
        }
      }
      
      result.migratedUsers = 1 // Current user
    }

    // Step 2: Migrate profiles
    const profileIdMap = new Map<string, string>() // old ID -> new ID
    
    for (const legacyProfile of legacyProfiles) {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        
        // Only migrate profiles for the current authenticated user
        if (legacyProfile.userId !== legacyUsers.find(u => u.email === currentUser?.email)?.id) {
          result.warnings.push(`Skipping profile ${legacyProfile.fullName} - belongs to different user`)
          continue
        }

        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert([{
            user_id: currentUser!.id,
            family_name: legacyProfile.familyName,
            initial: legacyProfile.initial,
            full_name: legacyProfile.fullName,
            gender: legacyProfile.gender,
            date_of_birth: legacyProfile.dateOfBirth,
            marital_status: legacyProfile.maritalStatus,
            profile_picture_url: legacyProfile.profilePicture
          }])
          .select()
          .single()

        if (profileError) {
          result.errors.push(`Failed to migrate profile ${legacyProfile.fullName}: ${profileError.message}`)
          continue
        }

        profileIdMap.set(legacyProfile.id, newProfile.id)
        result.migratedProfiles++
        
        console.log(`Migrated profile: ${legacyProfile.fullName} (${legacyProfile.id} -> ${newProfile.id})`)
      } catch (error) {
        result.errors.push(`Error migrating profile ${legacyProfile.fullName}: ${error}`)
      }
    }

    // Step 3: Migrate relationships
    const processedRelationships = new Set<string>()
    
    for (const relationship of legacyRelationships) {
      try {
        const fromId = profileIdMap.get(relationship.from)
        const toId = profileIdMap.get(relationship.to)
        
        if (!fromId || !toId) {
          result.warnings.push(`Skipping relationship - profile not found: ${relationship.from} -> ${relationship.to}`)
          continue
        }

        // Create unique key to avoid duplicates
        const relationshipKey = [fromId, toId, relationship.type].sort().join('-')
        if (processedRelationships.has(relationshipKey)) {
          continue
        }

        if (relationship.type === 'parent') {
          // Need to determine if this is father or mother relationship
          const parentProfile = legacyProfiles.find(p => p.id === relationship.from)
          if (!parentProfile) continue
          
          const relationshipType = parentProfile.gender === 'male' ? 'father' : 'mother'
          
          const { error: relationshipError } = await supabase
            .from('family_relationships')
            .insert([{
              parent_id: fromId,
              child_id: toId,
              relationship_type: relationshipType
            }])

          if (relationshipError) {
            result.warnings.push(`Failed to create family relationship: ${relationshipError.message}`)
          } else {
            result.migratedRelationships++
            processedRelationships.add(relationshipKey)
          }
        } else if (relationship.type === 'spouse') {
          // Create spouse relationship (only once per couple)
          const spouseKey = [fromId, toId].sort().join('-spouse')
          if (!processedRelationships.has(spouseKey)) {
            const { error: spouseError } = await supabase
              .from('spouse_relationships')
              .insert([{
                spouse_1_id: fromId,
                spouse_2_id: toId
              }])

            if (spouseError) {
              result.warnings.push(`Failed to create spouse relationship: ${spouseError.message}`)
            } else {
              result.migratedRelationships++
              processedRelationships.add(spouseKey)
            }
          }
        }
      } catch (error) {
        result.errors.push(`Error migrating relationship: ${error}`)
      }
    }

    // Step 4: Backup and clean localStorage
    if (result.migratedProfiles > 0) {
      // Create backup
      const backup = {
        users: legacyUsers,
        profiles: legacyProfiles,
        relationships: legacyRelationships,
        timestamp: new Date().toISOString()
      }
      
      localStorage.setItem('ak-families-backup', JSON.stringify(backup))
      
      // Clear old data
      localStorage.removeItem('ak-families-users')
      localStorage.removeItem('ak-families-profiles')
      localStorage.removeItem('ak-families-relationships')
      localStorage.removeItem('ak-families-current-user')
      
      result.success = true
      result.warnings.push('Legacy data backed up to ak-families-backup and cleared from localStorage')
    }

    console.log('Migration completed:', result)
    return result

  } catch (error) {
    result.errors.push(`Migration failed: ${error}`)
    console.error('Migration error:', error)
    return result
  }
}

export const restoreFromBackup = (): boolean => {
  try {
    const backup = localStorage.getItem('ak-families-backup')
    if (!backup) {
      return false
    }

    const backupData = JSON.parse(backup)
    
    localStorage.setItem('ak-families-users', JSON.stringify(backupData.users))
    localStorage.setItem('ak-families-profiles', JSON.stringify(backupData.profiles))
    localStorage.setItem('ak-families-relationships', JSON.stringify(backupData.relationships))
    
    localStorage.removeItem('ak-families-backup')
    
    return true
  } catch (error) {
    console.error('Restore from backup failed:', error)
    return false
  }
}

export const clearLegacyData = (): void => {
  localStorage.removeItem('ak-families-users')
  localStorage.removeItem('ak-families-profiles')
  localStorage.removeItem('ak-families-relationships')
  localStorage.removeItem('ak-families-current-user')
  localStorage.removeItem('ak-families-backup')
}

// Helper component for migration UI
export const useMigrationStatus = () => {
  const [isChecking, setIsChecking] = React.useState(false)
  const [hasMigrated, setHasMigrated] = React.useState(false)
  const [legacyDataExists, setLegacyDataExists] = React.useState(false)

  React.useEffect(() => {
    setIsChecking(true)
    
    // Check if user has already migrated
    const migrated = localStorage.getItem('ak-families-migrated')
    setHasMigrated(!!migrated)
    
    // Check for legacy data
    setLegacyDataExists(checkForLegacyData())
    
    setIsChecking(false)
  }, [])

  const markAsMigrated = () => {
    localStorage.setItem('ak-families-migrated', 'true')
    setHasMigrated(true)
  }

  return {
    isChecking,
    hasMigrated,
    legacyDataExists,
    markAsMigrated
  }
}