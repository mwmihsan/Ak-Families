// Navigation bar component

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Users, LogOut, User } from 'lucide-react';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

const Navbar: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <Users size={28} className="text-teal-600 mr-2" />
              <span className="font-bold text-xl text-gray-800">Ak Families</span>
            </Link>
          </div>
          
          {isAuthenticated && (
            <nav className="flex space-x-4 items-center">
              <Link 
                to="/profile" 
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/profile'
                    ? 'bg-teal-100 text-teal-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Profile
              </Link>
              
              <Link 
                to="/family-tree" 
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/family-tree'
                    ? 'bg-teal-100 text-teal-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Family Tree
              </Link>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                leftIcon={<LogOut size={16} />}
              >
                Logout
              </Button>
            </nav>
          )}
          
          {!isAuthenticated && (
            <div className="flex space-x-4 items-center">
              <Link to="/login">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<User size={16} />}
                >
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;