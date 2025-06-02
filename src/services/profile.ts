// Profile management service

import { v4 as uuidv4 } from 'uuid';
import { Profile, Relationship } from '../types';
import { 
  saveProfile, 
  getProfileById, 
  getProfileByUserId,
  getProfiles,
  saveRelationship,
  getFamilyMembers
} from './localStorage';

export const createProfile = (
  userId: string,
  fullName: string,
  gender: 'male' | 'female' | 'other',
  dateOfBirth?: string,
  fatherId?: string,
  motherId?: string,
  spouseId?: string,
  familyName?: string,
  initial?: string,
  maritalStatus: 'married' | 'unmarried' = 'unmarried',
  profilePicture?: string
): Profile => {
  const newProfile: Profile = {
    id: uuidv4(),
    userId,
    familyName,
    initial,
    fullName,
    gender,
    dateOfBirth,
    maritalStatus,
    fatherId,
    motherId,
    spouseId,
    childrenIds: [],
    profilePicture
  };
  
  saveProfile(newProfile);
  
  // Create relationships if parent ids are provided
  if (fatherId) {
    createRelationship(fatherId, newProfile.id, 'parent');
    
    // Update father's children list
    const fatherProfile = getProfileById(fatherId);
    if (fatherProfile) {
      fatherProfile.childrenIds = [...fatherProfile.childrenIds, newProfile.id];
      saveProfile(fatherProfile);
    }
  }
  
  if (motherId) {
    createRelationship(motherId, newProfile.id, 'parent');
    
    // Update mother's children list
    const motherProfile = getProfileById(motherId);
    if (motherProfile) {
      motherProfile.childrenIds = [...motherProfile.childrenIds, newProfile.id];
      saveProfile(motherProfile);
    }
  }
  
  // Create spouse relationship if provided
  if (spouseId) {
    createRelationship(newProfile.id, spouseId, 'spouse');
    
    // Update spouse's profile
    const spouseProfile = getProfileById(spouseId);
    if (spouseProfile) {
      spouseProfile.spouseId = newProfile.id;
      spouseProfile.maritalStatus = 'married';
      saveProfile(spouseProfile);
    }
  }
  
  return newProfile;
};

export const updateProfile = (profile: Profile): Profile => {
  const existingProfile = getProfileById(profile.id);
  
  if (!existingProfile) {
    throw new Error('Profile not found');
  }
  
  // Handle relationship changes
  if (profile.fatherId && profile.fatherId !== existingProfile.fatherId) {
    if (existingProfile.fatherId) {
      // Remove old relationship
      // In a real app, we would delete the old relationship
    }
    createRelationship(profile.fatherId, profile.id, 'parent');
    
    // Update father's children list
    const fatherProfile = getProfileById(profile.fatherId);
    if (fatherProfile) {
      fatherProfile.childrenIds = [...fatherProfile.childrenIds, profile.id];
      saveProfile(fatherProfile);
    }
  }
  
  if (profile.motherId && profile.motherId !== existingProfile.motherId) {
    if (existingProfile.motherId) {
      // Remove old relationship
      // In a real app, we would delete the old relationship
    }
    createRelationship(profile.motherId, profile.id, 'parent');
    
    // Update mother's children list
    const motherProfile = getProfileById(profile.motherId);
    if (motherProfile) {
      motherProfile.childrenIds = [...motherProfile.childrenIds, profile.id];
      saveProfile(motherProfile);
    }
  }
  
  if (profile.spouseId && profile.spouseId !== existingProfile.spouseId) {
    if (existingProfile.spouseId) {
      // Update old spouse's profile
      const oldSpouse = getProfileById(existingProfile.spouseId);
      if (oldSpouse) {
        oldSpouse.spouseId = undefined;
        oldSpouse.maritalStatus = 'unmarried';
        saveProfile(oldSpouse);
      }
    }
    
    createRelationship(profile.id, profile.spouseId, 'spouse');
    
    // Update new spouse's profile
    const spouseProfile = getProfileById(profile.spouseId);
    if (spouseProfile) {
      spouseProfile.spouseId = profile.id;
      spouseProfile.maritalStatus = 'married';
      saveProfile(spouseProfile);
    }
  } else if (!profile.spouseId && existingProfile.spouseId) {
    // Handle spouse removal
    const oldSpouse = getProfileById(existingProfile.spouseId);
    if (oldSpouse) {
      oldSpouse.spouseId = undefined;
      oldSpouse.maritalStatus = 'unmarried';
      saveProfile(oldSpouse);
    }
  }
  
  saveProfile(profile);
  return profile;
};

export const getUserProfile = (userId: string): Profile | undefined => {
  return getProfileByUserId(userId);
};

export const createRelationship = (
  fromProfileId: string, 
  toProfileId: string, 
  type: 'parent' | 'child' | 'spouse'
): void => {
  const relationship: Relationship = {
    from: fromProfileId,
    to: toProfileId,
    type
  };
  
  saveRelationship(relationship);
  
  // For spouse relationships, create the reverse relationship as well
  if (type === 'spouse') {
    const reverseRelationship: Relationship = {
      from: toProfileId,
      to: fromProfileId,
      type
    };
    saveRelationship(reverseRelationship);
  }
  
  // For parent relationships, create the reverse child relationship
  if (type === 'parent') {
    const childRelationship: Relationship = {
      from: toProfileId,
      to: fromProfileId,
      type: 'child'
    };
    saveRelationship(childRelationship);
  }
};

export const findRelatives = (searchTerm: string): Profile[] => {
  const profiles = getProfiles();
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  return profiles.filter(profile => 
    profile.fullName.toLowerCase().includes(lowerSearchTerm) ||
    (profile.familyName && profile.familyName.toLowerCase().includes(lowerSearchTerm)) ||
    (profile.initial && profile.initial.toLowerCase().includes(lowerSearchTerm))
  );
};

export const getSuggestedRelatives = (profileId: string): Profile[] => {
  // In a real application, this would use more sophisticated matching
  // For now, just return family members
  return getFamilyMembers(profileId);
};