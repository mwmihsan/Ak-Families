// Home page component

import React from 'react';
import { Users, UserPlus, GitBranch, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Ak Families
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Build your family tree, connect with relatives, and preserve your family history
            for generations to come.
          </p>
          
          {!isAuthenticated ? (
            <div className="mt-8 flex justify-center space-x-4">
              <Link to="/login">
                <Button size="lg">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" size="lg">
                  Create Account
                </Button>
              </Link>
            </div>
          ) : (
            <div className="mt-8 flex justify-center space-x-4">
              <Link to="/family-tree">
                <Button size="lg" leftIcon={<GitBranch size={20} />}>
                  View Family Tree
                </Button>
              </Link>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="bg-teal-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <UserPlus size={24} className="text-teal-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Easy Registration</h3>
            <p className="text-gray-600">
              Quickly register yourself and your family members with our intuitive profile creation system.
            </p>
          </div>
          
          {/* Feature 2 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Users size={24} className="text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Smart Connections</h3>
            <p className="text-gray-600">
              Our intelligent system suggests connections with existing family members to prevent duplicate entries.
            </p>
          </div>
          
          {/* Feature 3 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <GitBranch size={24} className="text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Interactive Tree</h3>
            <p className="text-gray-600">
              Visualize your entire family tree with our interactive tree view. Zoom, pan, and click to explore.
            </p>
          </div>
        </div>
        
        <div className="mt-16 text-center bg-gradient-to-r from-teal-50 to-emerald-50 p-8 rounded-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center justify-center">
            <Heart size={24} className="text-red-500 mr-2" />
            Preserve Your Family Legacy
          </h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            Start documenting your family connections today and create a lasting digital legacy
            for future generations to explore and expand.
          </p>
          
          {!isAuthenticated && (
            <div className="mt-6">
              <Link to="/register">
                <Button size="lg">
                  Get Started for Free
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;