// Service for managing data in localStorage

import { User, Profile, Relationship } from '../types';

// Storage keys
const USERS_KEY = 'ak-families-users';
const PROFILES_KEY = 'ak-families-profiles';
const RELATIONSHIPS_KEY = 'ak-families-relationships';
const CURRENT_USER_KEY = 'ak-families-current-user';

// User operations
export const getUsers = (): User[] => {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

export const saveUser = (user: User): void => {
  const users = getUsers();
  const existingUserIndex = users.findIndex((u) => u.id === user.id);
  
  if (existingUserIndex >= 0) {
    users[existingUserIndex] = user;
  } else {
    users.push(user);
  }
  
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const getUserByEmailOrPhone = (emailOrPhone: string): User | undefined => {
  const users = getUsers();
  return users.find((user) => user.email === emailOrPhone || user.phone === emailOrPhone);
};

export const getUserById = (id: string): User | undefined => {
  const users = getUsers();
  return users.find((user) => user.id === id);
};

export const setCurrentUser = (user: User): void => {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
};

export const getCurrentUser = (): User | null => {
  const user = localStorage.getItem(CURRENT_USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const removeCurrentUser = (): void => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

// Profile operations
export const getProfiles = (): Profile[] => {
  const profiles = localStorage.getItem(PROFILES_KEY);
  return profiles ? JSON.parse(profiles) : [];
};

export const saveProfile = (profile: Profile): void => {
  const profiles = getProfiles();
  const existingProfileIndex = profiles.findIndex((p) => p.id === profile.id);
  
  if (existingProfileIndex >= 0) {
    profiles[existingProfileIndex] = profile;
  } else {
    profiles.push(profile);
  }
  
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
};

export const getProfileById = (id: string): Profile | undefined => {
  const profiles = getProfiles();
  return profiles.find((profile) => profile.id === id);
};

export const getProfileByUserId = (userId: string): Profile | undefined => {
  const profiles = getProfiles();
  return profiles.find((profile) => profile.userId === userId);
};

export const searchProfiles = (query: string): Profile[] => {
  const profiles = getProfiles();
  const lowerQuery = query.toLowerCase();
  
  return profiles.filter((profile) => 
    profile.fullName.toLowerCase().includes(lowerQuery)
  );
};

// Relationship operations
export const getRelationships = (): Relationship[] => {
  const relationships = localStorage.getItem(RELATIONSHIPS_KEY);
  return relationships ? JSON.parse(relationships) : [];
};

export const saveRelationship = (relationship: Relationship): void => {
  const relationships = getRelationships();
  
  // Check if relationship already exists
  const exists = relationships.some(
    (r) => r.from === relationship.from && r.to === relationship.to && r.type === relationship.type
  );
  
  if (!exists) {
    relationships.push(relationship);
    localStorage.setItem(RELATIONSHIPS_KEY, JSON.stringify(relationships));
  }
};

export const getRelationshipsByProfileId = (profileId: string): Relationship[] => {
  const relationships = getRelationships();
  return relationships.filter(
    (relationship) => relationship.from === profileId || relationship.to === profileId
  );
};

// Helper functions for family data
export const getFamilyMembers = (profileId: string): Profile[] => {
  const relationships = getRelationshipsByProfileId(profileId);
  const profiles = getProfiles();
  const relatedIds = new Set<string>();
  
  relationships.forEach((rel) => {
    if (rel.from === profileId) {
      relatedIds.add(rel.to);
    } else {
      relatedIds.add(rel.from);
    }
  });
  
  return profiles.filter((profile) => relatedIds.has(profile.id));
};