// Profile context for managing profile state across the app

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Profile } from '../types';
import { 
  getUserProfile, 
  createProfile, 
  updateProfile as updateProfileService,
  getSuggestedRelatives
} from '../services/profile';
import { useAuth } from './AuthContext';

interface ProfileContextType {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  suggestedRelatives: Profile[];
  createUserProfile: (
    fullName: string,
    gender: 'male' | 'female' | 'other',
    dateOfBirth?: string,
    fatherId?: string,
    motherId?: string,
    spouseId?: string
  ) => Promise<{ success: boolean; profile: Profile | null }>;
  updateProfile: (
    updatedProfile: Profile
  ) => Promise<{ success: boolean; profile: Profile | null }>;
  loadSuggestedRelatives: () => void;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  isLoading: false,
  error: null,
  suggestedRelatives: [],
  createUserProfile: async () => ({ success: false, profile: null }),
  updateProfile: async () => ({ success: false, profile: null }),
  loadSuggestedRelatives: () => {},
});

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedRelatives, setSuggestedRelatives] = useState<Profile[]>([]);

  useEffect(() => {
    if (isAuthenticated && user) {
      setIsLoading(true);
      // Load user profile
      const userProfile = getUserProfile(user.id);
      setProfile(userProfile || null);
      setIsLoading(false);
      
      if (userProfile) {
        loadSuggestedRelatives();
      }
    } else {
      setProfile(null);
      setSuggestedRelatives([]);
    }
  }, [isAuthenticated, user]);

  const createUserProfile = async (
    fullName: string,
    gender: 'male' | 'female' | 'other',
    dateOfBirth?: string,
    fatherId?: string,
    motherId?: string,
    spouseId?: string
  ): Promise<{ success: boolean; profile: Profile | null }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const newProfile = createProfile(
        user.id,
        fullName,
        gender,
        dateOfBirth,
        fatherId,
        motherId,
        spouseId
      );
      
      setProfile(newProfile);
      loadSuggestedRelatives();
      setIsLoading(false);
      
      return { success: true, profile: newProfile };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create profile';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, profile: null };
    }
  };

  const updateProfile = async (
    updatedProfile: Profile
  ): Promise<{ success: boolean; profile: Profile | null }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updated = updateProfileService(updatedProfile);
      setProfile(updated);
      loadSuggestedRelatives();
      setIsLoading(false);
      
      return { success: true, profile: updated };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, profile: null };
    }
  };

  const loadSuggestedRelatives = (): void => {
    if (profile) {
      const suggestions = getSuggestedRelatives(profile.id);
      setSuggestedRelatives(suggestions);
    }
  };

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
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = (): ProfileContextType => useContext(ProfileContext);