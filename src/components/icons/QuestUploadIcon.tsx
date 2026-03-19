import React from 'react';

interface QuestUploadIconProps {
  className?: string;
}

const QuestUploadIcon: React.FC<QuestUploadIconProps> = ({ className = "w-24 h-24" }) => {
  return (
    <svg 
      className={className}
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background Circle */}
      <circle cx="50" cy="50" r="45" fill="url(#questGradient)" />
      
      {/* Document/Scroll */}
      <rect x="25" y="20" width="50" height="60" rx="3" fill="white" opacity="0.2" stroke="white" strokeWidth="2" />
      
      {/* Lines representing text */}
      <line x1="35" y1="35" x2="65" y2="35" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="35" y1="45" x2="60" y2="45" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="35" y1="55" x2="55" y2="55" stroke="white" strokeWidth="2" strokeLinecap="round" />
      
      {/* Upload Arrow */}
      <path d="M50 65 L50 80 M40 75 L50 65 L60 75" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Gradient Definition */}
      <defs>
        <linearGradient id="questGradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default QuestUploadIcon;
