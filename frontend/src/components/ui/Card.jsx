import React from 'react';

const Card = ({ 
  children, 
  title, 
  subtitle,
  className = '',
  headerActions,
  noPadding = false 
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-md border border-neutral-200 overflow-hidden ${className}`}>
      {(title || subtitle || headerActions) && (
        <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
          <div>
            {title && <h3 className="text-lg font-semibold text-neutral-800">{title}</h3>}
            {subtitle && <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>}
          </div>
          {headerActions && <div>{headerActions}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
    </div>
  );
};

export default Card;

