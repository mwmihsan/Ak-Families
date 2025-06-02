// Register page component

import React from 'react';
import { useNavigate } from 'react-router-dom';
import RegisterForm from '../components/auth/RegisterForm';
import { useAuth } from '../context/AuthContext';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile');
    }
  }, [isAuthenticated, navigate]);
  
  const handleRegisterSuccess = () => {
    navigate('/create-profile');
  };
  
  const handleLoginClick = () => {
    navigate('/login');
  };
  
  return (
    <div className="py-12">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
          <RegisterForm 
            onSuccess={handleRegisterSuccess}
            onLoginClick={handleLoginClick}
          />
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;