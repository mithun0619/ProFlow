import React from 'react';

const LoadingSpinner = ({ size = 'medium', fullPage = false }) => {
  const sizeClasses = {
    small: 'w-6 h-6 border-2',
    medium: 'w-12 h-12 border-3',
    large: 'w-16 h-16 border-4',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        {/* Glowing background ring */}
        <div
          className={`${sizeClasses[size]} rounded-full border-slate-800 absolute top-0 left-0`}
        ></div>
        {/* Animated active gradient ring */}
        <div
          className={`${sizeClasses[size]} rounded-full border-t-primary-500 border-r-transparent border-b-transparent border-l-transparent animate-spin`}
        ></div>
      </div>
      {fullPage && (
        <p className="text-slate-400 text-xs font-light tracking-widest uppercase animate-pulse">
          Loading workspace...
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-dark-950 z-[9999] flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
