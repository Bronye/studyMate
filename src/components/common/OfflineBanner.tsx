import { motion } from 'framer-motion';
import { WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  return (
    <motion.div 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -50, opacity: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-highlight text-white px-4 py-2 flex items-center justify-center gap-2 shadow-lg"
    >
      <WifiOff className="w-4 h-4" />
      <span className="text-sm font-medium">You're offline - quizzes will sync when connected</span>
    </motion.div>
  );
}
