// Footer component

import React from 'react';
import { Heart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-gray-600 text-sm">
              &copy; {new Date().getFullYear()} Ak Families. All rights reserved.
            </p>
          </div>
          
          <div className="flex items-center">
            <p className="text-gray-600 text-sm flex items-center">
              Made with <Heart size={14} className="text-red-500 mx-1" /> for families
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;