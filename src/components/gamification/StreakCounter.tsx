import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Shield } from 'lucide-react';
import { useGamificationStore } from '../../stores/gamificationStore';

interface StreakCounterProps {
  showDetails?: boolean;
}

export function StreakCounter({ showDetails = false }: StreakCounterProps) {
  const { streak } = useGamificationStore();
  
  // Determine fire intensity based on streak length
  const getFireIntensity = (streakDays: number) => {
    if (streakDays >= 30) return 'inferno';
    if (streakDays >= 14) return 'blazing';
    if (streakDays >= 7) return 'burning';
    if (streakDays >= 3) return 'smoldering';
    return 'dormant';
  };
  
  const intensity = getFireIntensity(streak.current);
  
  const fireColors = {
    dormant: '#9CA3AF',
    smoldering: '#F97316',
    burning: '#EA580C',
    blazing: '#DC2626',
    inferno: '#B91C1C'
  };
  
  const fireSizes = {
    dormant: 16,
    smoldering: 20,
    burning: 24,
    blazing: 28,
    inferno: 32
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <motion.div
          animate={intensity !== 'dormant' ? {
            scale: [1, 1.1, 1],
            rotate: [0, 2, -2, 0]
          } : {}}
          transition={{
            repeat: Infinity,
            duration: intensity === 'inferno' ? 0.5 : 1
          }}
        >
          <Flame 
            size={fireSizes[intensity]} 
            color={fireColors[intensity]}
            fill={fireColors[intensity]}
          />
        </motion.div>
        
        {/* Glow effect for active streaks */}
        {intensity !== 'dormant' && (
          <motion.div
            className="absolute inset-0 rounded-full blur-md"
            style={{ backgroundColor: fireColors[intensity], opacity: 0.5 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        )}
      </div>
      
      <div className="flex flex-col">
        <span className="font-black text-lg leading-none">
          {streak.current}
        </span>
        {showDetails && (
          <span className="text-xs text-text-secondary">
            day streak
          </span>
        )}
      </div>
      
      {/* Streak freeze indicator */}
      {streak.freezes > 0 && (
        <div className="ml-2 flex items-center gap-1 text-xs text-blue-500">
          <Shield size={12} />
          <span>{streak.freezes}</span>
        </div>
      )}
    </div>
  );
}

export default StreakCounter;
