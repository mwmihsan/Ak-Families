// Reusable button component

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  // Base classes
  let baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  // Width classes
  const widthClasses = fullWidth ? 'w-full' : '';
  
  // Size classes
  let sizeClasses = '';
  switch (size) {
    case 'sm':
      sizeClasses = 'h-8 px-3 text-xs';
      break;
    case 'lg':
      sizeClasses = 'h-12 px-6 text-lg';
      break;
    default:
      sizeClasses = 'h-10 px-4 py-2 text-sm';
  }
  
  // Variant classes
  let variantClasses = '';
  switch (variant) {
    case 'secondary':
      variantClasses = 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200';
      break;
    case 'outline':
      variantClasses = 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-100';
      break;
    case 'danger':
      variantClasses = 'bg-red-600 text-white hover:bg-red-700';
      break;
    default:
      variantClasses = 'bg-teal-600 text-white hover:bg-teal-700';
  }
  
  const combinedClasses = `${baseClasses} ${sizeClasses} ${variantClasses} ${widthClasses} ${className}`;
  
  return (
    <button 
      className={combinedClasses} 
      disabled={isLoading || disabled} 
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current\" xmlns="http://www.w3.org/2000/svg\" fill="none\" viewBox="0 0 24 24">
          <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      
      {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};

export default Button;