// src/components/profile/ProfileForm.tsx - Enhanced with searchable dropdowns
import React, { useState, useEffect, useRef } from 'react';
import { User, Calendar, Scale as Male, Scale as Female, Users, Image as ImageIcon, UserPlus, Search, X } from 'lucide-react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { useProfile } from '../../context/ProfileContext';
import { Profile, CreateProfileData } from '../../types';
import { searchProfiles } from '../../services/profile';

interface ProfileFormProps {
  onSuccess?: () => void;
  existingProfile?: Profile;
}

interface SearchableSelectProps {
  value: string;
  onChange: (profileId: string, profileName: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  gender?: 'male' | 'female';
  excludeIds?: string[];
  label: string;
  error?: string;
}

// Searchable dropdown component for selecting relatives
const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  placeholder,
  icon,
  gender,
  excludeIds = [],
  label,
  error
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search for profiles when search term changes
  useEffect(() => {
    const performSearch = async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const results = await searchProfiles(searchTerm, 10);
        let filteredResults = results.filter(profile => !excludeIds.includes(profile.id));
        
        // Filter by gender if specified
        if (gender) {
          filteredResults = filteredResults.filter(profile => profile.gender === gender);
        }
        
        setSearchResults(filteredResults);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, gender, excludeIds]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(newValue.length >= 2);
    
    // Clear selection if user is typing something different
    if (selectedProfile && !newValue.includes(selectedProfile.full_name)) {
      setSelectedProfile(null);
      onChange('', '');
    }
  };

  const handleSelectProfile = (profile: Profile) => {
    setSelectedProfile(profile);
    setSearchTerm(profile.full_name);
    onChange(profile.id, profile.full_name);
    setIsOpen(false);
  };

  const handleClearSelection = () => {
    setSelectedProfile(null);
    setSearchTerm('');
    onChange('', '');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const getDisplayName = (profile: Profile) => {
    let name = profile.full_name;
    if (profile.family_name) {
      name += ` (${profile.family_name})`;
    }
    if (profile.date_of_birth) {
      const age = new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear();
      name += ` - ${age} years`;
    }
    return name;
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => searchTerm.length >= 2 && setIsOpen(true)}
            placeholder={placeholder}
            className={`w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {selectedProfile && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X size={16} className="text-gray-400 hover:text-gray-600" />
            </button>
          )}
          {!selectedProfile && searchTerm.length >= 2 && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
          )}
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {isLoading ? (
              <div className="p-3 text-center text-gray-500">
                <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-top-teal-600 rounded-full mx-auto mb-2"></div>
                Searching...
              </div>
            ) : searchResults.length > 0 ? (
              <div>
                {searchResults.map((profile) => (
                  <div
                    key={profile.id}
                    className="p-3 hover:bg-gray-100 cursor-pointer flex items-center"
                    onClick={() => handleSelectProfile(profile)}
                  >
                    <div className="flex-shrink-0 mr-3">
                      {profile.gender === 'male' ? (
                        <Male size={16} className="text-blue-600" />
                      ) : (
                        <Female size={16} className="text-pink-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{profile.full_name}</div>
                      {(profile.family_name || profile.date_of_birth) && (
                        <div className="text-sm text-gray-500">
                          {profile.family_name && `Family: ${profile.family_name}`}
                          {profile.family_name && profile.date_of_birth && ' • '}
                          {profile.date_of_birth && `Born: ${new Date(profile.date_of_birth).getFullYear()}`}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : searchTerm.length >= 2 ? (
              <div className="p-3 text-center text-gray-500">
                <div className="mb-2">No {gender ? `${gender} ` : ''}profiles found matching "{searchTerm}"</div>
                <div className="text-xs text-gray-400">
                  {gender === 'male' ? 'Only male profiles are shown' : gender === 'female' ? 'Only female profiles are shown' : 'All profiles are searched'}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {searchTerm.length > 0 && searchTerm.length < 2 && (
        <p className="mt-1 text-sm text-gray-500">Type at least 2 characters to search</p>
      )}
    </div>
  );
};

const ProfileForm: React.FC<ProfileFormProps> = ({ onSuccess, existingProfile }) => {
  const { createUserProfile, updateProfile, isLoading, error: profileError } = useProfile();
  
  const [formData, setFormData] = useState({
    family_name: existingProfile?.family_name || '',
    initial: existingProfile?.initial || '',
    full_name: existingProfile?.full_name || '',
    gender: existingProfile?.gender || 'male',
    date_of_birth: existingProfile?.date_of_birth || '',
    marital_status: existingProfile?.marital_status || 'unmarried',
    father_id: existingProfile?.father_id || '',
    father_name: existingProfile?.father_name || '',
    mother_id: existingProfile?.mother_id || '',
    mother_name: existingProfile?.mother_name || '',
    spouse_id: existingProfile?.spouse_id || '',
    spouse_name: existingProfile?.spouse_name || '',
    profile_picture_url: existingProfile?.profile_picture_url || '',
  });
  
  const [errors, setErrors] = useState({
    full_name: '',
    gender: '',
    date_of_birth: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: '' });
    
    // Reset spouse-related fields when changing marital status to unmarried
    if (name === 'marital_status' && value === 'unmarried') {
      setFormData(prev => ({
        ...prev,
        spouse_id: '',
        spouse_name: '',
        [name]: value
      }));
    }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profile_picture_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRelativeSelect = (type: 'father' | 'mother' | 'spouse', profileId: string, profileName: string) => {
    setFormData(prev => ({
      ...prev,
      [`${type}_id`]: profileId,
      [`${type}_name`]: profileName,
      // Update marital status if spouse is selected
      ...(type === 'spouse' && profileId ? { marital_status: 'married' } : {})
    }));
  };

  const validateForm = (): boolean => {
    const newErrors = {
      full_name: '',
      gender: '',
      date_of_birth: '',
    };
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }
    
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }
    
    if (formData.date_of_birth) {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      
      if (birthDate > today) {
        newErrors.date_of_birth = 'Date of birth cannot be in the future';
      }
    }
    
    setErrors(newErrors);
    return !newErrors.full_name && !newErrors.gender && !newErrors.date_of_birth;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const profileData: CreateProfileData = {
      family_name: formData.family_name || undefined,
      initial: formData.initial || undefined,
      full_name: formData.full_name,
      gender: formData.gender as 'male' | 'female' | 'other',
      date_of_birth: formData.date_of_birth || undefined,
      marital_status: formData.marital_status as 'married' | 'unmarried',
      profile_picture_url: formData.profile_picture_url || undefined,
      father_id: formData.father_id || undefined,
      mother_id: formData.mother_id || undefined,
      spouse_id: formData.spouse_id || undefined,
    };

    let result;
    if (existingProfile) {
      result = await updateProfile(existingProfile.id, profileData);
    } else {
      result = await createUserProfile(profileData);
    }
    
    if (result.success && onSuccess) {
      onSuccess();
    }
  };

  // Get exclude IDs to prevent circular relationships
  const excludeIds = [
    existingProfile?.id,
    formData.father_id,
    formData.mother_id,
    formData.spouse_id
  ].filter(Boolean) as string[];

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {existingProfile ? 'Edit Profile' : 'Complete Your Profile'}
      </h2>
      
      {profileError && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
          {profileError}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Personal Information Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
            <User size={20} className="text-teal-600 mr-2" />
            Personal Information
          </h3>
          
          {/* Profile Picture */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profile Picture (optional)
            </label>
            <div className="flex items-center space-x-4">
              {formData.profile_picture_url && (
                <img
                  src={formData.profile_picture_url}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover"
                />
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                />
              </div>
            </div>
          </div>

          <Input
            label="Family Name (optional)"
            type="text"
            name="family_name"
            value={formData.family_name}
            onChange={handleChange}
            placeholder="Enter your family name"
          />

          <Input
            label="Initial (optional)"
            type="text"
            name="initial"
            value={formData.initial}
            onChange={handleChange}
            placeholder="Enter your initial"
            maxLength={10}
          />
          
          <Input
            label="Full Name"
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            error={errors.full_name}
            placeholder="Enter your full name"
            required
          />
          
          <Select
            label="Gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            error={errors.gender}
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' },
            ]}
            required
          />
          
          <Input
            label="Date of Birth (optional)"
            type="date"
            name="date_of_birth"
            value={formData.date_of_birth}
            onChange={handleChange}
            error={errors.date_of_birth}
          />
          
          <Select
            label="Marital Status"
            name="marital_status"
            value={formData.marital_status}
            onChange={handleChange}
            options={[
              { value: 'unmarried', label: 'Unmarried' },
              { value: 'married', label: 'Married' },
            ]}
            required
          />
        </div>

        {/* Family Information Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
            <Users size={20} className="text-teal-600 mr-2" />
            Family Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Father Selection */}
            <SearchableSelect
              label="Father's Name"
              value={formData.father_id}
              onChange={(id, name) => handleRelativeSelect('father', id, name)}
              placeholder="Search for father by name..."
              icon={<Male size={20} className="text-blue-600" />}
              gender="male"
              excludeIds={excludeIds}
            />

            {/* Mother Selection */}
            <SearchableSelect
              label="Mother's Name"
              value={formData.mother_id}
              onChange={(id, name) => handleRelativeSelect('mother', id, name)}
              placeholder="Search for mother by name..."
              icon={<Female size={20} className="text-pink-600" />}
              gender="female"
              excludeIds={excludeIds}
            />
          </div>

          {/* Spouse Selection (only shown if married) */}
          {formData.marital_status === 'married' && (
            <div className="mt-4">
              <SearchableSelect
                label="Spouse's Name"
                value={formData.spouse_id}
                onChange={(id, name) => handleRelativeSelect('spouse', id, name)}
                placeholder="Search for spouse by name..."
                icon={<Users size={20} className="text-purple-600" />}
                excludeIds={excludeIds}
              />
            </div>
          )}

          {/* Helpful Information */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Tips for Family Connections:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Type at least 2 characters to search for existing family members</li>
              <li>• If family members aren't found, they can register later and connect</li>
              <li>• You can always edit your profile later to add family connections</li>
              <li>• Family names help others find and connect with you</li>
            </ul>
          </div>
        </div>
        
        <div className="flex justify-end space-x-4">
          <Button
            type="submit"
            isLoading={isLoading}
            size="lg"
          >
            {existingProfile ? 'Update Profile' : 'Create Profile'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;