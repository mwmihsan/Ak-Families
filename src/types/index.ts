// Core data types for the application

export interface User {
  id: string;
  email: string;
  phone?: string;
  password: string; // In a real app, this would be handled securely
}

export interface Profile {
  id: string;
  userId: string;
  familyName?: string;
  initial?: string;
  fullName: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  maritalStatus: 'married' | 'unmarried';
  fatherId?: string;
  motherId?: string;
  spouseId?: string;
  childrenIds: string[];
  profilePicture?: string;
}

export interface Relationship {
  type: 'parent' | 'child' | 'spouse';
  from: string; // Profile ID
  to: string; // Profile ID
}

export interface FamilyMember {
  profile: Profile;
  relationship: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AppState {
  auth: AuthState;
  currentProfile: Profile | null;
  familyMembers: FamilyMember[];
  suggestions: Profile[];
}