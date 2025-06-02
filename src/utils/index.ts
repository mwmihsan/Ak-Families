// Utility functions

import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a unique ID
 */
export const generateId = (): string => {
  return uuidv4();
};

/**
 * Formats a date string to a localized format
 */
export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Not specified';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid date';
  }
};

/**
 * Calculates age from date of birth
 */
export const calculateAge = (dateOfBirth?: string): number | null => {
  if (!dateOfBirth) return null;
  
  try {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  } catch (error) {
    return null;
  }
};

/**
 * Truncates text to a specified length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Validates an email address
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates a phone number (simple validation)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  return phoneRegex.test(phone);
};

/**
 * Validates a password (minimum 8 characters, at least one letter and one number)
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
};

/**
 * Gets a gender-specific icon name (for use with lucide-react icons)
 */
export const getGenderIconName = (gender: string): string => {
  switch (gender.toLowerCase()) {
    case 'male':
      return 'male';
    case 'female':
      return 'female';
    default:
      return 'user';
  }
};

/**
 * Gets a relationship label
 */
export const getRelationshipLabel = (
  fromGender: string, 
  relationship: string
): string => {
  if (relationship === 'parent') {
    return fromGender.toLowerCase() === 'male' ? 'Father' : 'Mother';
  }
  
  if (relationship === 'child') {
    return fromGender.toLowerCase() === 'male' ? 'Son' : 'Daughter';
  }
  
  if (relationship === 'spouse') {
    return fromGender.toLowerCase() === 'male' ? 'Husband' : 'Wife';
  }
  
  return 'Relative';
};