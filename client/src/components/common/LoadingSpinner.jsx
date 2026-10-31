import React from 'react';

export const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <div
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full border-[#e2e8f0] border-t-[#0f172a] animate-spin`}
      />
      {text && <p className="text-xs font-semibold text-[#515f74] font-mono tracking-tight">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
