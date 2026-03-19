import { motion } from 'framer-motion';
import { Diamond } from 'lucide-react';
import { useGamificationStore } from '../../stores/gamificationStore';

interface GemCounterProps {
  size?: 'sm' | 'md' | 'lg';
}

export function GemCounter({ size = 'md' }: GemCounterProps) {
  const { gems } = useGamificationStore();
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  };
  
  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 24
  };
  
  return (
    <div className={`flex items-center gap-1 ${sizeClasses[size]}`}>
      <motion.div
        animate={{ 
          rotate: [0, 10, -10, 0],
        }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      >
        <Diamond 
          size={iconSizes[size]} 
          className="text-accent"
          fill="currentColor"
        />
      </motion.div>
      <span className="font-bold text-accent">
        {gems.toLocaleString()}
      </span>
    </div>
  );
}

export default GemCounter;
