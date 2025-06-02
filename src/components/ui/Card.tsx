// Reusable card component

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  footer?: React.ReactNode;
  hoverable?: boolean;
  withShadow?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  className = '',
  footer,
  hoverable = false,
  withShadow = true,
}) => {
  const cardClasses = `
    bg-white
    rounded-lg
    border
    border-gray-200
    overflow-hidden
    ${withShadow ? 'shadow-md' : ''}
    ${hoverable ? 'transition-all duration-200 hover:shadow-lg' : ''}
    ${className}
  `;

  return (
    <div className={cardClasses}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-800">{title}</h3>
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;