import { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useGamificationStore } from '../../stores/gamificationStore';

interface XPDisplayProps {
  showBreakdown?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function XPDisplay({ showBreakdown = false, size = 'md' }: XPDisplayProps) {
  const { xp, xpToNextLevel, xpProgress, level, levelTitle } = useGamificationStore();
  const [showPopup, setShowPopup] = useState(false);
  const prevXP = useRef(xp);
  
  // Animated counter
  const springXP = useSpring(0, { stiffness: 100, damping: 30 });
  const progressWidth = useTransform(springXP, [0, xpToNextLevel], ['0%', '100%']);
  
  useEffect(() => {
    springXP.set(xp);
  }, [xp, springXP]);
  
  useEffect(() => {
    // Show popup when XP increases
    if (xp > prevXP.current) {
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 1500);
    }
    prevXP.current = xp;
  }, [xp]);
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  };
  
  return (
    <div className="relative">
      <div className={`flex items-center gap-2 ${sizeClasses[size]}`}>
        <Sparkles className="text-highlight" size={size === 'lg' ? 24 : 16} />
        <span className="font-bold text-highlight">
          {xp.toLocaleString()} XP
        </span>
      </div>
      
      {/* Progress to next level */}
      {showBreakdown && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-text-secondary mb-1">
            <span>Level {level}: {levelTitle}</span>
            <span>{xpToNextLevel} XP to next</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-primary to-highlight"
              style={{ width: progressWidth }}
            />
          </div>
        </div>
      )}
      
      {/* XP Popup */}
      {showPopup && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.5 }}
          animate={{ opacity: 1, y: -20, scale: 1 }}
          exit={{ opacity: 0 }}
          className="absolute -top-8 left-1/2 -translate-x-1/2 bg-highlight text-white px-3 py-1 rounded-full font-bold text-sm shadow-lg"
        >
          +{xp - prevXP.current} XP!
        </motion.div>
      )}
    </div>
  );
}

export default XPDisplay;
