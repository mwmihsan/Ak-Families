// Login page component

import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile');
    }
  }, [isAuthenticated, navigate]);
  
  const handleLoginSuccess = () => {
    navigate('/profile');
  };
  
  const handleRegisterClick = () => {
    navigate('/register');
  };
  
  return (
    <div className="py-12">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
          <LoginForm 
            onSuccess={handleLoginSuccess}
            onRegisterClick={handleRegisterClick}
          />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;