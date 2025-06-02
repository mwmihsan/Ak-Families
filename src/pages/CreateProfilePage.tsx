// Create profile page component

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileForm from '../components/profile/ProfileForm';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';

const CreateProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { profile } = useProfile();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
    
    // Redirect if profile already exists
    if (profile) {
      navigate('/profile');
    }
  }, [isAuthenticated, profile, navigate]);
  
  const handleProfileCreated = () => {
    navigate('/profile');
  };
  
  return (
    <div className="py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
          <ProfileForm onSuccess={handleProfileCreated} />
        </div>
      </div>
    </div>
  );
};

export default CreateProfilePage;