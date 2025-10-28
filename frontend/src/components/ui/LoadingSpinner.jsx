import React from 'react';

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };
  
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div
        className={`
          ${sizes[size]}
          border-primary-blue border-t-transparent
          rounded-full animate-spin
        `}
      />
    </div>
  );
};

export default LoadingSpinner;

