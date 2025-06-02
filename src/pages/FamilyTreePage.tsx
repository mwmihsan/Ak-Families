// Family tree page component

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import FamilyTree from '../components/family-tree/FamilyTree';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';

const FamilyTreePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { profile } = useProfile();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Redirect to create profile if no profile exists
    if (!profile) {
      navigate('/create-profile');
    }
  }, [isAuthenticated, profile, navigate]);
  
  if (!profile) {
    return (
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse flex justify-center mb-4">
              <Users size={48} className="text-gray-300" />
            </div>
            <p className="text-gray-500">Loading family tree...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FamilyTree rootProfileId={profile.id} />
      </div>
    </div>
  );
};

export default FamilyTreePage;