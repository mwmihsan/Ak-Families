// Register form component

import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { isValidEmail, isValidPhone, isValidPassword } from '../../utils';

interface RegisterFormProps {
  onSuccess?: () => void;
  onLoginClick?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onLoginClick }) => {
  const { register, isLoading, error: authError } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error when user types
    setErrors({ ...errors, [name]: '' });
  };
  
  const validateForm = (): boolean => {
    const newErrors = {
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    };
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (formData.phone && !isValidPhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!isValidPassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters with letters and numbers';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    
    return !newErrors.email && !newErrors.phone && !newErrors.password && !newErrors.confirmPassword;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const { success } = await register(formData.email, formData.password, formData.phone || undefined);
    
    if (success && onSuccess) {
      onSuccess();
    }
  };
  
  return (
    <div className="max-w-md mx-auto">
      <div className="flex justify-center mb-6">
        <div className="bg-teal-100 p-3 rounded-full">
          <UserPlus size={32} className="text-teal-600" />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
        Create Your Account
      </h2>
      
      {authError && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
          {authError}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="Enter your email"
          autoComplete="email"
          required
        />
        
        <Input
          label="Phone (optional)"
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          error={errors.phone}
          placeholder="Enter your phone number"
          autoComplete="tel"
        />
        
        <Input
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="Create a password"
          autoComplete="new-password"
          helperText="At least 8 characters with letters and numbers"
          required
        />
        
        <Input
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          placeholder="Confirm your password"
          autoComplete="new-password"
          required
        />
        
        <Button
          type="submit"
          fullWidth
          isLoading={isLoading}
          className="mt-2"
        >
          Register
        </Button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onLoginClick}
            className="text-teal-600 hover:text-teal-800 font-medium"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;