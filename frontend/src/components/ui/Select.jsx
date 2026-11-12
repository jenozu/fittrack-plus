import React from 'react';

const Select = ({
  label,
  name,
  value,
  onChange,
  options,
  error,
  required = false,
  disabled = false,
  placeholder = 'Select an option',
  className = '',
}) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={name} className="block text-small font-medium text-neutral-700 mb-1">
          {label}
          {required && <span className="text-danger-600 ml-1">*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
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
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-small text-danger-600">{error}</p>
      )}
    </div>
  );
};

export default Select;

