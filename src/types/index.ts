// Core data types for the application

// src/types/index.ts - Updated for Supabase compatibility
import { User as SupabaseUser } from '@supabase/supabase-js'

// Use Supabase User type instead of custom User
export type User = SupabaseUser

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
  // Virtual fields from relationships (populated by views/joins)
  father_id?: string
  father_name?: string
  mother_id?: string
  mother_name?: string
  spouse_id?: string
  spouse_name?: string
  children?: Profile[]
}

// New relationship types for Supabase
export interface FamilyRelationship {
  id: string
  parent_id: string
  child_id: string
  relationship_type: 'father' | 'mother'
  created_at: string
}

export interface SpouseRelationship {
  id: string
  spouse_1_id: string
  spouse_2_id: string
  marriage_date?: string
  created_at: string
}

// Legacy types for migration (keep for backward compatibility)
export interface LegacyProfile {
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

export interface LegacyRelationship {
  type: 'parent' | 'child' | 'spouse'
  from: string
  to: string
}

// Family member with relationship context
export interface FamilyMember {
  profile: Profile
  relationship: string
}

// Auth state (updated for Supabase)
export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

// App state
export interface AppState {
  auth: AuthState
  currentProfile: Profile | null
  familyMembers: FamilyMember[]
  suggestions: Profile[]
}

// Form data types
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

// Family tree visualization types
export interface TreeNode {
  id: string
  name: string
  gender: string
  profileId: string
  children: TreeNode[]
  spouse?: TreeNode
  level: number
}

// API response types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

// Family statistics
export interface FamilyStatistics {
  totalFamilyMembers: number
  maleCount: number
  femaleCount: number
  totalRelationships: number
  marriages: number
  averageAge: number
}

// Real-time subscription types
export interface RealtimeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  old?: Record<string, any>
  new?: Record<string, any>
}

// Search and filter types
export interface SearchFilters {
  query?: string
  gender?: 'male' | 'female' | 'other'
  ageRange?: [number, number]
  familyName?: string
  hasChildren?: boolean
  isMarried?: boolean
}

// Notification types
export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: string
  read: boolean
}

// File upload types
export interface UploadResult {
  url: string | null
  error: string | null
  fileName?: string
  fileSize?: number
}