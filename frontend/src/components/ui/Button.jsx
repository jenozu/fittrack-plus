import React from 'react';

// One system: primary (the one main action), secondary (neutral), ghost, danger. All >= 44px tall.
// 'outline' kept as alias of secondary for older callers.
const variants = {
  primary: 'bg-brand-600 hover:bg-brand-700 text-white',
  secondary: 'bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-800',
  ghost: 'text-neutral-700 hover:bg-neutral-100',
  danger: 'bg-danger-600 hover:bg-danger-700 text-white',
};
variants.outline = variants.secondary;

const sizes = {
  sm: 'min-h-[44px] px-3 text-small',
  md: 'min-h-[44px] px-4 text-body',
  lg: 'min-h-[48px] px-6 text-body',
};

const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  fullWidth = false,
  className = '',
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center justify-center font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant] || variants.primary} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
  >
    {children}
  </button>
);

export default Button;
