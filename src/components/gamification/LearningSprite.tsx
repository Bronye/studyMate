import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamificationStore } from '../../stores/gamificationStore';
import { useAppStore } from '../../stores/useAppStore';

interface LearningSpriteProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showExpression?: boolean;
  animated?: boolean;
}

// Sprite expressions using emoji
const EXPRESSION_CONFIG = {
  neutral: { eyes: '● ●', mouth: 'ー' },
  happy: { eyes: '^ ^', mouth: '‿' },
  excited: { eyes: '★ ★', mouth: 'Д' },
  proud: { eyes: '☆ ☆', mouth: '−' },
  thinking: { eyes: '● ‿', mouth: '◡' },
  celebrating: { eyes: '★ ★', mouth: '∀' },
  disappointed: { eyes: '● ●', mouth: '︵' },
  sleepy: { eyes: '- -', mouth: '〜' }
};

const MOOD_COLORS = {
  happy: 'from-yellow-400 to-orange-400',
  focused: 'from-blue-400 to-purple-400',
  excited: 'from-pink-400 to-red-400',
  proud: 'from-purple-400 to-indigo-400',
  encouraging: 'from-green-400 to-teal-400'
};

export function LearningSprite({ size = 'md', showExpression = true, animated = true }: LearningSpriteProps) {
  const { level } = useGamificationStore();
  const { currentStudent } = useAppStore();
  
  const avatar = currentStudent?.avatar;
  const studentLevel = avatar?.level || level || 1;
  const expression = avatar?.expression || 'happy';
  const mood = avatar?.mood || 'happy';
  
  const sizeConfig = {
    sm: 48,
    md: 80,
    lg: 120,
    xl: 180
  };
  
  const spriteSize = sizeConfig[size];
  
  // Determine aura based on level
  const getAura = (lvl: number) => {
    if (lvl >= 50) return 'diamond';
    if (lvl >= 25) return 'gold';
    if (lvl >= 10) return 'silver';
    if (lvl >= 5) return 'bronze';
    return null;
  };
  
  const aura = getAura(studentLevel);
  
  // Aura configurations
  const auraStyles: Record<string, string> = {
    bronze: 'shadow-[0_0_20px_#CD7F32]',
    silver: 'shadow-[0_0_25px_#C0C0C0]',
    gold: 'shadow-[0_0_30px_#FFD700]',
    diamond: 'shadow-[0_0_40px_#B9F2FF]'
  };
  
  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Aura glow */}
      {aura && (
        <motion.div
          className={`absolute rounded-full ${auraStyles[aura]}`}
          style={{
            width: spriteSize + 20,
            height: spriteSize + 20,
            background: aura === 'diamond' 
              ? 'linear-gradient(135deg, #B9F2FF, #E0E0E0, #FFD700)'
              : aura === 'gold'
              ? 'linear-gradient(135deg, #FFD700, #FFA500)'
              : aura === 'silver'
              ? 'linear-gradient(135deg, #C0C0C0, #808080)'
              : 'linear-gradient(135deg, #CD7F32, #8B4513)'
          }}
          animate={animated ? {
            scale: [1, 1.05, 1],
            opacity: [0.6, 0.8, 0.6]
          } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      )}
      
      {/* Main sprite body */}
      <motion.div
        className={`
          relative rounded-full flex items-center justify-center
          bg-gradient-to-br ${MOOD_COLORS[mood as keyof typeof MOOD_COLORS] || MOOD_COLORS.happy}
          ${aura ? auraStyles[aura] : 'shadow-lg'}
        `}
        style={{
          width: spriteSize,
          height: spriteSize
        }}
        animate={animated ? {
          y: [0, -5, 0],
        } : {}}
        transition={{ 
          repeat: Infinity, 
          duration: 2 + Math.random(),
          ease: 'easeInOut'
        }}
      >
        {/* Face */}
        {showExpression && (
          <div className="text-center text-white" style={{ fontSize: spriteSize * 0.4 }}>
            {/* Eyes */}
            <div className="mb-1 tracking-wider">
              {EXPRESSION_CONFIG[expression as keyof typeof EXPRESSION_CONFIG]?.eyes || EXPRESSION_CONFIG.happy.eyes}
            </div>
            {/* Mouth */}
            <div className="tracking-widest">
              {EXPRESSION_CONFIG[expression as keyof typeof EXPRESSION_CONFIG]?.mouth || EXPRESSION_CONFIG.happy.mouth}
            </div>
          </div>
        )}
        
        {/* Level badge */}
        <div className="absolute -bottom-1 -right-1 bg-white rounded-full px-1.5 py-0.5 text-xs font-bold text-primary shadow">
          {studentLevel}
        </div>
      </motion.div>
    </div>
  );
}

export default LearningSprite;
