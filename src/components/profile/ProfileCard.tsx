// Profile card component for displaying profile information

import React from 'react';
import { User, Calendar, Users, Scale as Male, Scale as Female, Heart, Edit } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Profile } from '../../types';
import { formatDate, calculateAge } from '../../utils';
import { getProfileById } from '../../services/localStorage';

interface ProfileCardProps {
  profile: Profile;
  onEdit?: () => void;
  showEditButton?: boolean;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ 
  profile, 
  onEdit,
  showEditButton = true
}) => {
  const age = calculateAge(profile.dateOfBirth);
  
  const fatherProfile = profile.fatherId ? getProfileById(profile.fatherId) : null;
  const motherProfile = profile.motherId ? getProfileById(profile.motherId) : null;
  const spouseProfile = profile.spouseId ? getProfileById(profile.spouseId) : null;
  
  return (
    <Card
      className="max-w-2xl mx-auto"
      title={
        <div className="flex items-center">
          <User size={20} className="text-teal-600 mr-2" />
          <span>Profile Information</span>
        </div>
      }
      footer={
        showEditButton && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={onEdit}
              leftIcon={<Edit size={16} />}
            >
              Edit Profile
            </Button>
          </div>
        )
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-teal-100 p-4 rounded-full">
            {profile.gender === 'male' ? (
              <Male size={48} className="text-teal-600" />
            ) : profile.gender === 'female' ? (
              <Female size={48} className="text-teal-600" />
            ) : (
              <User size={48} className="text-teal-600" />
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{profile.fullName}</h3>
            {age && (
              <p className="text-gray-600 flex items-center mt-1">
                <Calendar size={16} className="mr-1" />
                {age} years old
              </p>
            )}
            {profile.dateOfBirth && (
              <p className="text-sm text-gray-500">
                Born: {formatDate(profile.dateOfBirth)}
              </p>
            )}
          </div>
          
          <div className="border-t md:border-t-0 md:border-l border-gray-200 pt-3 md:pt-0 md:pl-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <Users size={16} className="mr-1" />
              Family Connections
            </h4>
            
            <div className="space-y-2">
              {fatherProfile && (
                <div className="flex items-center">
                  <Male size={16} className="text-blue-600 mr-2" />
                  <span className="text-sm text-gray-800">
                    <span className="font-medium">Father:</span> {fatherProfile.fullName}
                  </span>
                </div>
              )}
              
              {motherProfile && (
                <div className="flex items-center">
                  <Female size={16} className="text-pink-600 mr-2" />
                  <span className="text-sm text-gray-800">
                    <span className="font-medium">Mother:</span> {motherProfile.fullName}
                  </span>
                </div>
              )}
              
              {spouseProfile && (
                <div className="flex items-center">
                  <Heart size={16} className="text-red-500 mr-2" />
                  <span className="text-sm text-gray-800">
                    <span className="font-medium">Spouse:</span> {spouseProfile.fullName}
                  </span>
                </div>
              )}
              
              {profile.childrenIds.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-800">Children:</span>
                  <ul className="ml-6 mt-1">
                    {profile.childrenIds.map(childId => {
                      const childProfile = getProfileById(childId);
                      return childProfile ? (
                        <li key={childId} className="flex items-center">
                          {childProfile.gender === 'male' ? (
                            <Male size={14} className="text-blue-600 mr-1" />
                          ) : (
                            <Female size={14} className="text-pink-600 mr-1" />
                          )}
                          <span className="text-sm text-gray-800">
                            {childProfile.fullName}
                          </span>
                        </li>
                      ) : null;
                    })}
                  </ul>
                </div>
              )}
              
              {!fatherProfile && !motherProfile && !spouseProfile && profile.childrenIds.length === 0 && (
                <p className="text-sm text-gray-500 italic">
                  No family connections added yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProfileCard;