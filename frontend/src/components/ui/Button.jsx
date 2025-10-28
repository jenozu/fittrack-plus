import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  type = 'button',
  disabled = false,
  fullWidth = false,
  className = '' 
}) => {
  const baseStyles = 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary-blue hover:bg-secondary-blue text-neutral-800 focus:ring-primary-blue',
    secondary: 'bg-primary-pink hover:bg-secondary-pink text-white focus:ring-primary-pink',
    outline: 'border-2 border-primary-blue text-primary-blue hover:bg-primary-blue hover:text-white focus:ring-primary-blue',
    ghost: 'text-neutral-700 hover:bg-neutral-100 focus:ring-neutral-300',
    danger: 'bg-red-400 hover:bg-red-500 text-white focus:ring-red-400',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;

