import React from 'react';

interface SnapStudyIconProps {
  className?: string;
}

const SnapStudyIcon: React.FC<SnapStudyIconProps> = ({ className = "w-24 h-24" }) => {
  return (
    <svg 
      className={className}
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background Circle */}
      <circle cx="50" cy="50" r="45" fill="url(#snapGradient)" />
      
      {/* Camera/Phone Frame */}
      <rect x="20" y="30" width="60" height="40" rx="4" stroke="white" strokeWidth="2" fill="none" />
      
      {/* Camera Lens */}
      <circle cx="50" cy="50" r="12" stroke="white" strokeWidth="2" fill="none" />
      <circle cx="50" cy="50" r="6" fill="white" opacity="0.5" />
      
      {/* Flash */}
      <circle cx="72" cy="38" r="3" fill="white" />
      
      {/* Text Lines (representing notes) */}
      <line x1="30" y1="78" x2="70" y2="78" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="35" y1="84" x2="65" y2="84" stroke="white" strokeWidth="2" strokeLinecap="round" />
      
      {/* Gradient Definition */}
      <defs>
        <linearGradient id="snapGradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default SnapStudyIcon;
