import React, { useState, useEffect } from 'react';
import { User, Calendar, Scale as Male, Scale as Female, Users, Image as ImageIcon, UserPlus } from 'lucide-react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { useProfile } from '../../context/ProfileContext';
import { Profile } from '../../types';
import { getProfileById } from '../../services/localStorage';
import { findRelatives } from '../../services/profile';

interface ProfileFormProps {
  onSuccess?: () => void;
  existingProfile?: Profile;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ onSuccess, existingProfile }) => {
  const { createUserProfile, updateProfile, isLoading, error: profileError } = useProfile();
  
  const [formData, setFormData] = useState({
    familyName: existingProfile?.familyName || '',
    initial: existingProfile?.initial || '',
    fullName: existingProfile?.fullName || '',
    gender: existingProfile?.gender || 'male',
    dateOfBirth: existingProfile?.dateOfBirth || '',
    maritalStatus: existingProfile?.maritalStatus || 'unmarried',
    fatherId: existingProfile?.fatherId || '',
    fatherName: '',
    motherId: existingProfile?.motherId || '',
    motherName: '',
    spouseId: existingProfile?.spouseId || '',
    spouseName: '',
    profilePicture: existingProfile?.profilePicture || '',
    children: [] as { name: string, gender: 'male' | 'female' | 'other' }[],
  });
  
  const [errors, setErrors] = useState({
    fullName: '',
    gender: '',
    dateOfBirth: '',
    fatherId: '',
    motherId: '',
    spouseId: '',
  });
  
  const [fatherSearchResults, setFatherSearchResults] = useState<Profile[]>([]);
  const [motherSearchResults, setMotherSearchResults] = useState<Profile[]>([]);
  const [spouseSearchResults, setSpouseSearchResults] = useState<Profile[]>([]);
  
  useEffect(() => {
    if (existingProfile) {
      if (existingProfile.fatherId) {
        const father = getProfileById(existingProfile.fatherId);
        if (father) {
          setFormData(prev => ({ ...prev, fatherName: father.fullName }));
        }
      }
      
      if (existingProfile.motherId) {
        const mother = getProfileById(existingProfile.motherId);
        if (mother) {
          setFormData(prev => ({ ...prev, motherName: mother.fullName }));
        }
      }
      
      if (existingProfile.spouseId) {
        const spouse = getProfileById(existingProfile.spouseId);
        if (spouse) {
          setFormData(prev => ({ ...prev, spouseName: spouse.fullName }));
        }
      }
    }
  }, [existingProfile]);
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: '' });
    
    // Reset spouse-related fields when changing marital status to unmarried
    if (name === 'maritalStatus' && value === 'unmarried') {
      setFormData(prev => ({
        ...prev,
        spouseId: '',
        spouseName: '',
        children: [],
        [name]: value
      }));
    }
  };
  
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profilePicture: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleAddChild = () => {
    setFormData(prev => ({
      ...prev,
      children: [...prev.children, { name: '', gender: 'male' }]
    }));
  };
  
  const handleChildChange = (index: number, field: 'name' | 'gender', value: string) => {
    setFormData(prev => ({
      ...prev,
      children: prev.children.map((child, i) => 
        i === index ? { ...child, [field]: value } : child
      )
    }));
  };
  
  const handleRemoveChild = (index: number) => {
    setFormData(prev => ({
      ...prev,
      children: prev.children.filter((_, i) => i !== index)
    }));
  };
  
  const handleRelativeSearch = (type: 'father' | 'mother' | 'spouse', query: string) => {
    if (query.length < 2) {
      if (type === 'father') setFatherSearchResults([]);
      if (type === 'mother') setMotherSearchResults([]);
      if (type === 'spouse') setSpouseSearchResults([]);
      return;
    }
    
    const results = findRelatives(query);
    const filteredResults = existingProfile 
      ? results.filter(p => p.id !== existingProfile.id)
      : results;
    
    if (type === 'father') {
      setFatherSearchResults(filteredResults.filter(p => p.gender === 'male'));
    } else if (type === 'mother') {
      setMotherSearchResults(filteredResults.filter(p => p.gender === 'female'));
    } else {
      setSpouseSearchResults(filteredResults.filter(p => 
        p.id !== formData.fatherId && p.id !== formData.motherId
      ));
    }
  };
  
  const handleRelativeSelect = (type: 'father' | 'mother' | 'spouse', profile: Profile) => {
    if (type === 'father') {
      setFormData({ 
        ...formData, 
        fatherId: profile.id, 
        fatherName: profile.fullName 
      });
      setFatherSearchResults([]);
    } else if (type === 'mother') {
      setFormData({ 
        ...formData, 
        motherId: profile.id, 
        motherName: profile.fullName 
      });
      setMotherSearchResults([]);
    } else {
      setFormData({ 
        ...formData, 
        spouseId: profile.id, 
        spouseName: profile.fullName,
        maritalStatus: 'married'
      });
      setSpouseSearchResults([]);
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors = {
      fullName: '',
      gender: '',
      dateOfBirth: '',
      fatherId: '',
      motherId: '',
      spouseId: '',
    };
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }
    
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      
      if (birthDate > today) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future';
      }
    }
    
    setErrors(newErrors);
    
    return !newErrors.fullName && !newErrors.gender && !newErrors.dateOfBirth;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (existingProfile) {
      const updatedProfile: Profile = {
        ...existingProfile,
        familyName: formData.familyName,
        initial: formData.initial,
        fullName: formData.fullName,
        gender: formData.gender as 'male' | 'female' | 'other',
        dateOfBirth: formData.dateOfBirth || undefined,
        maritalStatus: formData.maritalStatus as 'married' | 'unmarried',
        fatherId: formData.fatherId || undefined,
        motherId: formData.motherId || undefined,
        spouseId: formData.spouseId || undefined,
        profilePicture: formData.profilePicture || undefined,
      };
      
      const { success } = await updateProfile(updatedProfile);
      
      if (success && onSuccess) {
        onSuccess();
      }
    } else {
      const { success } = await createUserProfile(
        formData.fullName,
        formData.gender as 'male' | 'female' | 'other',
        formData.dateOfBirth || undefined,
        formData.fatherId || undefined,
        formData.motherId || undefined,
        formData.spouseId || undefined,
        formData.familyName,
        formData.initial,
        formData.maritalStatus as 'married' | 'unmarried',
        formData.profilePicture
      );
      
      if (success && onSuccess) {
        onSuccess();
      }
    }
  };
  
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
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
            <User size={20} className="text-teal-600 mr-2" />
            Personal Information
          </h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profile Picture (optional)
            </label>
            <div className="flex items-center space-x-4">
              {formData.profilePicture && (
                <img
                  src={formData.profilePicture}
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
            name="familyName"
            value={formData.familyName}
            onChange={handleChange}
            placeholder="Enter your family name"
          />
          
          {/* Father and Mother selection immediately after family name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Father's Name
            </label>
            <div className="relative">
              <div className="flex items-center">
                <Male size={20} className="text-blue-600 absolute left-3" />
                <Input
                  className="pl-10"
                  placeholder="Search for father by name"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={(e) => {
                    handleChange(e);
                    handleRelativeSearch('father', e.target.value);
                  }}
                />
              </div>
              
              {fatherSearchResults.length > 0 && (
                <div className="absolute z-10 w-full bg-white mt-1 border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {fatherSearchResults.map((profile) => (
                    <div
                      key={profile.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
                      onClick={() => handleRelativeSelect('father', profile)}
                    >
                      <Male size={16} className="text-blue-600 mr-2" />
                      {profile.fullName}
                      {profile.familyName && (
                        <span className="text-gray-500 ml-1">
                          ({profile.familyName})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mother's Name
            </label>
            <div className="relative">
              <div className="flex items-center">
                <Female size={20} className="text-pink-600 absolute left-3" />
                <Input
                  className="pl-10"
                  placeholder="Search for mother by name"
                  name="motherName"
                  value={formData.motherName}
                  onChange={(e) => {
                    handleChange(e);
                    handleRelativeSearch('mother', e.target.value);
                  }}
                />
              </div>
              
              {motherSearchResults.length > 0 && (
                <div className="absolute z-10 w-full bg-white mt-1 border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {motherSearchResults.map((profile) => (
                    <div
                      key={profile.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
                      onClick={() => handleRelativeSelect('mother', profile)}
                    >
                      <Female size={16} className="text-pink-600 mr-2" />
                      {profile.fullName}
                      {profile.familyName && (
                        <span className="text-gray-500 ml-1">
                          ({profile.familyName})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
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
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            error={errors.fullName}
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
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            error={errors.dateOfBirth}
          />
          
          <Select
            label="Marital Status"
            name="maritalStatus"
            value={formData.maritalStatus}
            onChange={handleChange}
            options={[
              { value: 'unmarried', label: 'Unmarried' },
              { value: 'married', label: 'Married' },
            ]}
            required
          />
        </div>
        
        {/* Spouse and Children section (only shown if married) */}
        {formData.maritalStatus === 'married' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <Users size={20} className="text-teal-600 mr-2" />
              Family Details
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Spouse's Name
              </label>
              <div className="relative">
                <div className="flex items-center">
                  <Users size={20} className="text-purple-600 absolute left-3" />
                  <Input
                    className="pl-10"
                    placeholder="Search for spouse by name"
                    name="spouseName"
                    value={formData.spouseName}
                    onChange={(e) => {
                      handleChange(e);
                      handleRelativeSearch('spouse', e.target.value);
                    }}
                  />
                </div>
                
                {spouseSearchResults.length > 0 && (
                  <div className="absolute z-10 w-full bg-white mt-1 border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {spouseSearchResults.map((profile) => (
                      <div
                        key={profile.id}
                        className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
                        onClick={() => handleRelativeSelect('spouse', profile)}
                      >
                        {profile.gender === 'male' ? (
                          <Male size={16} className="text-blue-600 mr-2" />
                        ) : (
                          <Female size={16} className="text-pink-600 mr-2" />
                        )}
                        {profile.fullName}
                        {profile.familyName && (
                          <span className="text-gray-500 ml-1">
                            ({profile.familyName})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium text-gray-700">Children</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddChild}
                  leftIcon={<UserPlus size={16} />}
                >
                  Add Child
                </Button>
              </div>
              
              {formData.children.map((child, index) => (
                <div key={index} className="flex gap-4 items-start mb-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Child's name"
                      value={child.name}
                      onChange={(e) => handleChildChange(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="w-32">
                    <Select
                      value={child.gender}
                      onChange={(e) => handleChildChange(index, 'gender', e.target.value)}
                      options={[
                        { value: 'male', label: 'Male' },
                        { value: 'female', label: 'Female' },
                        { value: 'other', label: 'Other' },
                      ]}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemoveChild(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex justify-end">
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