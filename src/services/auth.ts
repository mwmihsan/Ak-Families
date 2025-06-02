// Authentication service

import { User } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { 
  getUserByEmailOrPhone, 
  saveUser, 
  setCurrentUser, 
  getCurrentUser,
  removeCurrentUser
} from './localStorage';

export const register = (
  email: string, 
  password: string, 
  phone?: string
): { user: User | null; error: string | null } => {
  try {
    // Check if user already exists
    const existingUser = getUserByEmailOrPhone(email) || (phone ? getUserByEmailOrPhone(phone) : undefined);
    
    if (existingUser) {
      return { 
        user: null, 
        error: 'User with this email or phone already exists' 
      };
    }
    
    // Create new user
    const newUser: User = {
      id: uuidv4(),
      email,
      password, // In a real app, this would be hashed
      phone
    };
    
    saveUser(newUser);
    setCurrentUser(newUser);
    
    return { user: newUser, error: null };
  } catch (error) {
    return { 
      user: null, 
      error: 'Failed to register user' 
    };
  }
};

export const login = (
  emailOrPhone: string, 
  password: string
): { user: User | null; error: string | null } => {
  try {
    const user = getUserByEmailOrPhone(emailOrPhone);
    
    if (!user) {
      return { 
        user: null, 
        error: 'User not found' 
      };
    }
    
    if (user.password !== password) { // In a real app, would compare hashed passwords
      return { 
        user: null, 
        error: 'Invalid password' 
      };
    }
    
    setCurrentUser(user);
    return { user, error: null };
  } catch (error) {
    return { 
      user: null, 
      error: 'Login failed' 
    };
  }
};

export const logout = (): void => {
  removeCurrentUser();
};

export const checkAuth = (): User | null => {
  return getCurrentUser();
};