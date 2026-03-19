import { motion } from 'framer-motion';
import { Lock, Star, Trophy, Medal, Award, Crown, Flame, Zap, Book, Calculator, GraduationCap } from 'lucide-react';
import { Achievement } from '../../db/gamification';

interface AchievementBadgeProps {
  achievement: Achievement;
  earned?: boolean;
  progress?: number;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  trophy: Trophy,
  medal: Medal,
  award: Award,
  crown: Crown,
  flame: Flame,
  zap: Zap,
  star: Star,
  book: Book,
  calculator: Calculator,
  'graduation-cap': GraduationCap,
  'arrow-up': Zap
};

const rarityColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  common: { bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-600', glow: 'shadow-slate-300' },
  uncommon: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-600', glow: 'shadow-green-300' },
  rare: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-600', glow: 'shadow-blue-300' },
  epic: { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-600', glow: 'shadow-purple-300' },
  legendary: { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-600', glow: 'shadow-amber-400' }
};

export function AchievementBadge({ 
  achievement, 
  earned = false, 
  progress = 0,
  size = 'md',
  showDetails = false 
}: AchievementBadgeProps) {
  const IconComponent = iconMap[achievement.icon] || Trophy;
  const colors = rarityColors[achievement.rarity] || rarityColors.common;
  
  const sizeClasses = {
    sm: { container: 'w-12 h-12', icon: 16, text: 'text-xs' },
    md: { container: 'w-16 h-16', icon: 24, text: 'text-sm' },
    lg: { container: 'w-24 h-24', icon: 36, text: 'text-base' }
  };
  
  const sizes = sizeClasses[size];
  
  return (
    <div className="flex flex-col items-center">
      <motion.div
        className={`
          ${sizes.container} rounded-full flex items-center justify-center
          ${earned ? colors.bg : 'bg-slate-50'}
          ${earned ? colors.border : 'border-slate-200'} border-2
          ${earned ? `shadow-lg ${colors.glow}` : ''}
          ${!earned ? 'opacity-50' : ''}
        `}
        whileHover={earned ? { scale: 1.1 } : {}}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {earned ? (
          <IconComponent size={sizes.icon} className={colors.text} />
        ) : (
          <Lock size={sizes.icon} className="text-slate-400" />
        )}
      </motion.div>
      
      {showDetails && (
        <div className="mt-2 text-center">
          <p className={`font-bold ${sizes.text} ${earned ? 'text-text-primary' : 'text-slate-400'}`}>
            {achievement.name}
          </p>
          {achievement.isSecret && !earned && (
            <p className="text-xs text-slate-400">???</p>
          )}
          {earned && (
            <p className="text-xs text-text-secondary mt-1">
              +{achievement.rewards?.xp || 0} XP
            </p>
          )}
          {!earned && progress > 0 && (
            <div className="mt-1">
              <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full" 
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{Math.round(progress)}%</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AchievementBadge;
