// Profile page component

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import ProfileCard from '../components/profile/ProfileCard';
import ProfileForm from '../components/profile/ProfileForm';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { profile } = useProfile();
  
  const [isEditing, setIsEditing] = useState(false);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Redirect to create profile if no profile exists
    if (!profile && !isEditing) {
      navigate('/create-profile');
    }
  }, [isAuthenticated, profile, navigate, isEditing]);
  
  const handleEditClick = () => {
    setIsEditing(true);
  };
  
  const handleProfileUpdated = () => {
    setIsEditing(false);
  };
  
  if (!profile) {
    return (
      <div className="py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse flex justify-center mb-4">
              <User size={48} className="text-gray-300" />
            </div>
            <p className="text-gray-500">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {isEditing ? (
          <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
            <ProfileForm 
              existingProfile={profile}
              onSuccess={handleProfileUpdated}
            />
          </div>
        ) : (
          <ProfileCard 
            profile={profile}
            onEdit={handleEditClick}
          />
        )}
      </div>
    </div>
  );
};

export default ProfilePage;