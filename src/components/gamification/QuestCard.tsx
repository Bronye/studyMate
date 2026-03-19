import { motion } from 'framer-motion';
import { Check, Lock, Gift, Clock } from 'lucide-react';
import { Quest, QuestProgress } from '../../db/gamification';

interface QuestCardProps {
  quest: Quest;
  progress?: QuestProgress;
  onClaim?: () => void;
}

export function QuestCard({ quest, progress, onClaim }: QuestCardProps) {
  const currentProgress = progress?.progress || 0;
  const targetProgress = quest.requirements.target;
  const percentage = Math.min((currentProgress / targetProgress) * 100, 100);
  const isComplete = progress?.isComplete || false;
  const isClaimed = progress?.claimed || false;
  
  const typeColors: Record<string, string> = {
    daily: 'bg-blue-100 border-blue-200 text-blue-700',
    weekly: 'bg-purple-100 border-purple-200 text-purple-700',
    story: 'bg-amber-100 border-amber-200 text-amber-700',
    challenge: 'bg-red-100 border-red-200 text-red-700',
    milestone: 'bg-green-100 border-green-200 text-green-700',
    social: 'bg-pink-100 border-pink-200 text-pink-700'
  };
  
  return (
    <motion.div
      className={`
        relative overflow-hidden rounded-lg border-2 p-3
        ${isComplete && !isClaimed ? 'border-primary bg-primary/5' : 'border-slate-100 bg-white'}
      `}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400 }}
    >
      {/* Type badge */}
      <div className={`absolute top-0 right-0 px-2 py-1 rounded-bl-lg text-xs font-bold ${typeColors[quest.type] || 'bg-slate-100'}`}>
        {quest.type}
      </div>
      
      {/* Quest content */}
      <div className="pr-16">
        <h4 className="font-bold text-text-primary" style={{ fontSize: 'var(--theme-font-size-lg)' }}>{quest.title}</h4>
        <p className="text-xs text-text-secondary mt-1">{quest.description}</p>
        
        {/* Progress bar */}
        {!isClaimed && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-text-secondary mb-1">
              <span>Progress</span>
              <span>{currentProgress}/{targetProgress}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ type: 'spring', stiffness: 100 }}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Rewards */}
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1 text-xs">
          <span className="text-highlight font-bold">+{quest.rewards.xp}</span>
          <span className="text-xs text-text-secondary">XP</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <span className="text-accent font-bold">+{quest.rewards.gems}</span>
          <span className="text-xs text-text-secondary">💎</span>
        </div>
        
        {/* Claim button */}
        {isComplete && !isClaimed && onClaim && (
          <button
            onClick={onClaim}
            className="ml-auto bg-primary text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1"
          >
            <Gift size={12} />
            Claim
          </button>
        )}
        
        {/* Claimed indicator */}
        {isClaimed && (
          <div className="ml-auto flex items-center gap-1 text-green-500 text-xs font-bold">
            <Check size={14} />
            Claimed
          </div>
        )}
        
        {/* Locked indicator */}
        {quest.prerequisites && quest.prerequisites.length > 0 && (
          <div className="ml-auto flex items-center gap-1 text-slate-400 text-xs">
            <Lock size={12} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default QuestCard;
