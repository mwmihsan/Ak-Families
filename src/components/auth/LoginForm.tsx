// Login form component

import React, { useState } from 'react';
import { User } from 'lucide-react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { isValidEmail, isValidPhone } from '../../utils';

interface LoginFormProps {
  onSuccess?: () => void;
  onRegisterClick?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onRegisterClick }) => {
  const { login, isLoading, error: authError } = useAuth();
  
  const [formData, setFormData] = useState({
    emailOrPhone: '',
    password: '',
  });
  
  const [errors, setErrors] = useState({
    emailOrPhone: '',
    password: '',
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error when user types
    setErrors({ ...errors, [name]: '' });
  };
  
  const validateForm = (): boolean => {
    const newErrors = {
      emailOrPhone: '',
      password: '',
    };
    
    if (!formData.emailOrPhone) {
      newErrors.emailOrPhone = 'Email or phone is required';
    } else if (!isValidEmail(formData.emailOrPhone) && !isValidPhone(formData.emailOrPhone)) {
      newErrors.emailOrPhone = 'Please enter a valid email or phone number';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    
    return !newErrors.emailOrPhone && !newErrors.password;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const { success } = await login(formData.emailOrPhone, formData.password);
    
    if (success && onSuccess) {
      onSuccess();
    }
  };
  
  return (
    <div className="max-w-md mx-auto">
      <div className="flex justify-center mb-6">
        <div className="bg-teal-100 p-3 rounded-full">
          <User size={32} className="text-teal-600" />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
        Welcome Back
      </h2>
      
      {authError && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
          {authError}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <Input
          label="Email or Phone"
          type="text"
          name="emailOrPhone"
          value={formData.emailOrPhone}
          onChange={handleChange}
          error={errors.emailOrPhone}
          placeholder="Enter your email or phone"
          autoComplete="username"
        />
        
        <Input
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="Enter your password"
          autoComplete="current-password"
        />
        
        <Button
          type="submit"
          fullWidth
          isLoading={isLoading}
          className="mt-2"
        >
          Sign In
        </Button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onRegisterClick}
            className="text-teal-600 hover:text-teal-800 font-medium"
          >
            Register
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;