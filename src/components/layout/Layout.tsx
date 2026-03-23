import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, FileText } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hideDueToModalOrEmptyState, setHideDueToModalOrEmptyState] = useState(false);
  
  // Pages where FABs should be hidden
  const hideFabPages = [
    '/onboarding',
    '/note-upload',
    '/profile',
    '/study'
  ];
  
  // Check if current route should hide FABs
  // Also hide if it's a quiz page (/quiz/xxx)
  const shouldHideFab = hideFabPages.some(page => location.pathname === page) || 
    location.pathname.startsWith('/quiz/');

  // Listen for modal/empty-state events from pages so FABs can hide when a modal is open
  useEffect(() => {
    const openHandler = (e: Event) => setHideDueToModalOrEmptyState(true);
    const closeHandler = (e: Event) => setHideDueToModalOrEmptyState(false);
    window.addEventListener('import-modal-open', openHandler as EventListener);
    window.addEventListener('import-modal-close', closeHandler as EventListener);
    
    window.addEventListener('empty-state-open', openHandler as EventListener);
    window.addEventListener('empty-state-close', closeHandler as EventListener);
    return () => {
      window.removeEventListener('import-modal-open', openHandler as EventListener);
      window.removeEventListener('import-modal-close', closeHandler as EventListener);
      
      window.removeEventListener('empty-state-open', openHandler as EventListener);
      window.removeEventListener('empty-state-close', closeHandler as EventListener);
    };
  }, []);
  
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      {/* Main Content Area */}
      <main className="max-w-mobile md:max-w-tablet lg:max-w-desktop mx-auto px-4 md:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Floating Action Buttons - Side column on mobile, centered on desktop */}
      {(!shouldHideFab && !hideDueToModalOrEmptyState) && (
      <motion.div 
        className="fixed flex gap-4 md:flex-row flex-col right-4 md:left-1/2 md:-translate-x-1/2 md:bottom-8 md:top-auto md:right-auto"
        style={{ bottom: 'calc(7.5rem + env(safe-area-inset-bottom))', zIndex: 90 }}
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ 
          type: 'spring', 
          stiffness: 100, 
          damping: 15,
          delay: 0.5 
        }}
      >
        {/* Snap & Study FAB */}
        <motion.button 
          className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent shadow-2xl flex items-center justify-center neon-glow-primary"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/note-upload')}
          aria-label="Snap to Study"
        >
          <Camera className="w-8 h-8 text-white" strokeWidth={2} />
        </motion.button>
        
        {/* Upload Quest FAB */}
        <motion.button 
          className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-highlight shadow-2xl flex items-center justify-center neon-glow-highlight"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            console.log('[FAB] Upload FAB clicked, location:', location.pathname);
            if (location.pathname === '/home') {
              console.log('[FAB] dispatching open-import-modal');
              window.dispatchEvent(new CustomEvent('open-import-modal'));
            } else {
              console.log('[FAB] navigating to /home?import=true');
              navigate('/home?import=true');
            }
          }}
          aria-label="Upload Quest"
        >
          <Upload className="w-8 h-8 text-white" strokeWidth={2} />
        </motion.button>

        {/* Notes / Past Notes FAB */}
        <motion.button 
          className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-700 to-slate-500 shadow-2xl flex items-center justify-center neon-glow-slate"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/notes')}
          aria-label="Saved Notes"
        >
          <FileText className="w-8 h-8 text-white" strokeWidth={2} />
        </motion.button>
      </motion.div>
      )}

      
    </div>
  );
}
