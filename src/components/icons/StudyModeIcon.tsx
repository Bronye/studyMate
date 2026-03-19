import React from 'react';

interface StudyModeIconProps {
  className?: string;
}

const StudyModeIcon: React.FC<StudyModeIconProps> = ({ className = "w-24 h-24" }) => {
  return (
    <svg 
      className={className}
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background Circle */}
      <circle cx="50" cy="50" r="45" fill="url(#studyGradient)" />
      
      {/* Brain Shape */}
      <path 
        d="M50 25 C30 25 25 40 25 50 C25 65 35 75 50 75 C65 75 75 65 75 50 C75 40 70 25 50 25" 
        fill="white" 
        opacity="0.9"
      />
      
      {/* Brain folds */}
      <path d="M35 45 Q50 35 65 45" stroke="#6366F1" strokeWidth="2" fill="none" />
      <path d="M35 55 Q50 45 65 55" stroke="#6366F1" strokeWidth="2" fill="none" />
      <path d="M40 65 Q50 60 60 65" stroke="#6366F1" strokeWidth="2" fill="none" />
      
      {/* Lightbulb (idea) */}
      <circle cx="75" cy="25" r="8" fill="#FCD34D" />
      <path d="M72 30 L75 35 L78 30" stroke="#F59E0B" strokeWidth="1.5" fill="none" />
      
      {/* Gradient Definition */}
      <defs>
        <linearGradient id="studyGradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default StudyModeIcon;
