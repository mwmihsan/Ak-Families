// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Types for better TypeScript support
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          phone?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          phone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          phone?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
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
        }
        Insert: {
          id?: string
          user_id: string
          family_name?: string
          initial?: string
          full_name: string
          gender: 'male' | 'female' | 'other'
          date_of_birth?: string
          marital_status?: 'married' | 'unmarried'
          profile_picture_url?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          family_name?: string
          initial?: string
          full_name?: string
          gender?: 'male' | 'female' | 'other'
          date_of_birth?: string
          marital_status?: 'married' | 'unmarried'
          profile_picture_url?: string
          updated_at?: string
        }
      }
      family_relationships: {
        Row: {
          id: string
          parent_id: string
          child_id: string
          relationship_type: 'father' | 'mother'
          created_at: string
        }
        Insert: {
          id?: string
          parent_id: string
          child_id: string
          relationship_type: 'father' | 'mother'
          created_at?: string
        }
        Update: {
          id?: string
          parent_id?: string
          child_id?: string
          relationship_type?: 'father' | 'mother'
        }
      }
      spouse_relationships: {
        Row: {
          id: string
          spouse_1_id: string
          spouse_2_id: string
          marriage_date?: string
          created_at: string
        }
        Insert: {
          id?: string
          spouse_1_id: string
          spouse_2_id: string
          marriage_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          spouse_1_id?: string
          spouse_2_id?: string
          marriage_date?: string
        }
      }
    }
  }
}