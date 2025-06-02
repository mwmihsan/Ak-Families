// Family tree management service

import { Profile } from '../types';
import { getProfiles, getProfileById } from './localStorage';

// Tree structure for visualization
export interface TreeNode {
  id: string;
  name: string;
  gender: string;
  profileId: string;
  children: TreeNode[];
  spouse?: TreeNode;
  level: number;
}

/**
 * Builds a family tree starting from a given profile
 */
export const buildFamilyTree = (rootProfileId: string): TreeNode | null => {
  const rootProfile = getProfileById(rootProfileId);
  if (!rootProfile) return null;
  
  // Set to keep track of profiles already added to prevent circular references
  const addedProfiles = new Set<string>();
  
  const buildNode = (profile: Profile, level: number): TreeNode => {
    addedProfiles.add(profile.id);
    
    const node: TreeNode = {
      id: `node-${profile.id}`,
      name: profile.fullName,
      gender: profile.gender,
      profileId: profile.id,
      children: [],
      level
    };
    
    // Add spouse if exists and not already in the tree
    if (profile.spouseId && !addedProfiles.has(profile.spouseId)) {
      const spouseProfile = getProfileById(profile.spouseId);
      if (spouseProfile) {
        addedProfiles.add(spouseProfile.id);
        node.spouse = {
          id: `node-${spouseProfile.id}`,
          name: spouseProfile.fullName,
          gender: spouseProfile.gender,
          profileId: spouseProfile.id,
          children: [],
          level
        };
      }
    }
    
    // Add children if not already in the tree
    if (profile.childrenIds.length > 0 && level < 3) {  // Limit depth to prevent excessive recursion
      profile.childrenIds.forEach(childId => {
        if (!addedProfiles.has(childId)) {
          const childProfile = getProfileById(childId);
          if (childProfile) {
            node.children.push(buildNode(childProfile, level + 1));
          }
        }
      });
    }
    
    return node;
  };
  
  // If we're starting with someone who has parents, try to start with the highest ancestor
  let startProfile = rootProfile;
  let currentProfile = rootProfile;
  let foundHigherAncestor = true;
  
  // Only go up to 5 levels to prevent infinite loops in case of circular references
  for (let i = 0; i < 5 && foundHigherAncestor; i++) {
    foundHigherAncestor = false;
    
    if (currentProfile.fatherId) {
      const fatherProfile = getProfileById(currentProfile.fatherId);
      if (fatherProfile) {
        startProfile = fatherProfile;
        currentProfile = fatherProfile;
        foundHigherAncestor = true;
        continue;
      }
    }
    
    if (currentProfile.motherId) {
      const motherProfile = getProfileById(currentProfile.motherId);
      if (motherProfile) {
        startProfile = motherProfile;
        currentProfile = motherProfile;
        foundHigherAncestor = true;
      }
    }
  }
  
  return buildNode(startProfile, 0);
};

/**
 * Gets all profiles that could be potential parents
 * (i.e., those old enough to be parents of the given profile)
 */
export const getPotentialParents = (dateOfBirth?: string): Profile[] => {
  if (!dateOfBirth) return getProfiles();
  
  const birthDate = new Date(dateOfBirth);
  const profiles = getProfiles();
  
  // Filter for profiles that are at least 15 years older
  return profiles.filter(profile => {
    if (!profile.dateOfBirth) return true;
    
    const profileBirthDate = new Date(profile.dateOfBirth);
    const ageDifference = birthDate.getFullYear() - profileBirthDate.getFullYear();
    
    return ageDifference >= 15;
  });
};

/**
 * Gets all profiles that could be potential spouses
 */
export const getPotentialSpouses = (profileId: string): Profile[] => {
  const profile = getProfileById(profileId);
  if (!profile) return [];
  
  const profiles = getProfiles();
  
  // Filter out the profile itself, its parents, and its children
  return profiles.filter(p => {
    const isNotSelf = p.id !== profileId;
    const isNotParent = p.id !== profile.fatherId && p.id !== profile.motherId;
    const isNotChild = !profile.childrenIds.includes(p.id);
    
    return isNotSelf && isNotParent && isNotChild;
  });
};