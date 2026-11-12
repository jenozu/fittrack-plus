import React from 'react';

const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={name} className="block text-small font-medium text-neutral-700 mb-1">
          {label}
          {required && <span className="text-danger-600 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`
          w-full min-h-[44px] px-4 py-2 text-body rounded-lg border 
          ${error ? 'border-danger-600' : 'border-neutral-500'} 
          focus:outline-none focus:ring-2 
          ${error ? 'focus:ring-danger-600' : 'focus:ring-brand-600'} 
                    disabled:bg-neutral-100 disabled:cursor-not-allowed
          transition-all duration-200
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-small text-danger-600">{error}</p>
      )}
    </div>
  );
};

export default Input;

