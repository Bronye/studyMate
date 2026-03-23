import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../stores/useAppStore';
import { db, Quiz } from '../db/database';
import { generateQuizId } from '../utils/generateId';
import { Shield, User, Flame, Gem, BookOpen, Lightbulb, Calculator, GraduationCap, Book, Languages, Plus, FileJson, X, WifiOff, Wifi, ShoppingBag, Camera, ChevronDown, History, Home as HomeIcon, User as UserIcon, StickyNote } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentStudent, addXP, updateStreak, completedQuizzes, isQuizCompleted, isOnline } = useAppStore();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [importError, setImportError] = useState('');
  const [showShopPopup, setShowShopPopup] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // NEW: Quiz display state
  const [showAllQuizzes, setShowAllQuizzes] = useState(false);
  const MAX_VISIBLE_QUIZZES = 4;
  
  // Check if mobile screen
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Notify layout about empty state so FABs can hide if necessary
  useEffect(() => {
    if (!loading && quizzes.length === 0) {
      window.dispatchEvent(new CustomEvent('empty-state-open'));
    } else {
      window.dispatchEvent(new CustomEvent('empty-state-close'));
    }
  }, [loading, quizzes.length]);

  // Separate effect to handle import modal via query param
  useEffect(() => {
    if (searchParams.get('import') === 'true') {
      setShowImportModal(true);
      window.dispatchEvent(new CustomEvent('import-modal-open'));
      // Clean up the URL without re-rendering
      window.history.replaceState({}, '', '/home');
    }
  }, [searchParams]);

  // Listen for external requests to open the import modal (e.g. FAB on /home)
  useEffect(() => {
    const openHandler = () => {
      console.log('[Home] open-import-modal received');
      setShowImportModal(true);
      window.dispatchEvent(new CustomEvent('import-modal-open'));
    };
    window.addEventListener('open-import-modal', openHandler as EventListener);
    return () => window.removeEventListener('open-import-modal', openHandler as EventListener);
  }, []);

  const importModal = null; // placeholder; actual modal rendered after handlers to avoid hoisting issues
  
  const loadQuizzes = async () => {
    try {
      const availableQuizzes = await db.quizzes.toArray();
      setQuizzes(availableQuizzes);
    } catch (error) {
      console.error('Error loading quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load quizzes on mount so quest cards render
  useEffect(() => {
    loadQuizzes();
  }, []);

  // Handle JSON file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setJsonInput(JSON.stringify(json, null, 2));
        setImportError('');
      } catch (err) {
        setImportError('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  // Import quiz from JSON
  const handleImportQuiz = async () => {
    try {
      setImportError('');
      const quizData = JSON.parse(jsonInput);
      
      // Validate required fields (quizId is now optional - we'll generate one)
      if (!quizData.topic || !quizData.subject || !Array.isArray(quizData.questions)) {
        setImportError('Invalid quiz format. Required: topic, subject, questions[]');
        return;
      }
      
      // Generate unique quizId if not provided
      if (!quizData.quizId) {
        quizData.quizId = generateQuizId();
      }
      
      // Set default points if not provided
      if (!quizData.points) {
        quizData.points = 50; // Default points
      }
      
      // Set default gems based on difficulty if not provided
      if (!quizData.gems) {
        quizData.gems = quizData.difficulty === 'hard' ? 5 : quizData.difficulty === 'medium' ? 4 : 3;
      }
      
      // Add quiz to database
      await db.quizzes.add(quizData);
      
      // Refresh quiz list
      await loadQuizzes();
      
      // Close modal and reset
      setShowImportModal(false);
      window.dispatchEvent(new CustomEvent('import-modal-close'));
      setJsonInput('');
      alert('Quiz imported successfully!');
    } catch (err) {
      setImportError('Failed to import quiz: ' + (err as Error).message);
    }
  };

  // Import Quiz Modal - rendered after handlers to ensure handlers exist
  const importModalRendered = showImportModal ? (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileJson className="w-6 h-6 text-primary" strokeWidth={2.5} />
            <h2 className="text-xl font-bold text-text-primary">Import Quiz JSON</h2>
          </div>
          <button 
            onClick={() => { setShowImportModal(false); setJsonInput(''); setImportError(''); window.dispatchEvent(new CustomEvent('import-modal-close')); }}
            className="p-2 hover:bg-slate-100 rounded-full"
          >
            <X className="w-5 h-5 text-text-secondary" strokeWidth={2.5} />
          </button>
        </div>
        <p className="text-sm text-text-secondary mb-4">
          Paste your quiz JSON below or upload a file. Required fields: quizId, topic, subject, questions[].
        </p>
        <div className="mb-4">
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
            id="json-file-upload"
            ref={fileInputRef}
          />
          <label 
            htmlFor="json-file-upload"
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer text-sm font-medium text-text-secondary w-fit"
          >
            <FileJson className="w-4 h-4" strokeWidth={2.5} />
            Upload JSON File
          </label>
        </div>
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder='{"quizId": "unique_id", "topic": "Algebra Basics", "subject": "Mathematics", "points": 50, "isCompleted": false, "questions": [{"id": "q1", "text": "What is x if 2x + 5 = 15?", "options": [{"id": "a", "text": "x = 5"}, {"id": "b", "text": "x = 10"}], "correctOptionId": "a", "hint": "Subtract 5 from both sides first", "explanation": "2x + 5 - 5 = 15 - 5...", "cognitiveLevel": "apply"}]}'
          className="w-full h-48 p-3 border border-slate-200 rounded-lg font-mono text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none"
        />
        {importError && (
          <p className="text-error text-sm mt-2">{importError}</p>
        )}
        <div className="flex gap-3 mt-4">
          <button 
            onClick={() => { setShowImportModal(false); setJsonInput(''); setImportError(''); window.dispatchEvent(new CustomEvent('import-modal-close')); }}
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg font-medium text-text-secondary hover:bg-slate-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleImportQuiz}
            disabled={!jsonInput.trim()}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Import Quiz
          </button>
        </div>
      </motion.div>
    </div>
  ) : null;

  
  const handleStartQuiz = (quiz: Quiz) => {
    navigate(`/quiz/${quiz.quizId}`);
  };
  
  // NEW: Separate unattempted and completed quizzes
  const unattemptedQuizzes = quizzes.filter(q => !isQuizCompleted(q.quizId));
  const completedQuizzesList = quizzes.filter(q => isQuizCompleted(q.quizId));
  const visibleQuizzes = showAllQuizzes ? unattemptedQuizzes : unattemptedQuizzes.slice(0, MAX_VISIBLE_QUIZZES);
  const hasMoreQuizzes = unattemptedQuizzes.length > MAX_VISIBLE_QUIZZES;
  
  const avatar = currentStudent?.avatar;
  
  // helper: split array into chunks of given size
  const chunkArray = <T,>(arr: T[], size: number): T[][] => {
    const res: T[][] = [];
    for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
    return res;
  };
  
  // Mobile layout
  if (isMobile) {
    return (
      <div className="h-screen bg-gradient-to-br from-primary/5 to-accent/5 overflow-hidden" style={{ ['--header-height' as any]: '64px', ['--bottom-nav-height' as any]: '64px', ['--tip-height' as any]: '72px' }}>
        {importModalRendered}
        {/* Mobile Top Bar */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4" style={{ height: 'var(--header-height)' }}>
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-1">
              <Gem className="w-5 h-5 text-accent" />
              <span className="font-black text-accent">{currentStudent?.gems || 0}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-black text-text-primary">LOBBY</span>
              <div className="flex items-center gap-1">
                {isOnline ? <Wifi className="w-3 h-3 text-green-500" /> : <WifiOff className="w-3 h-3 text-amber-500" />}
                <span className="text-[10px]">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Flame className="w-5 h-5 text-highlight" />
              <span className="font-black text-highlight">{currentStudent?.streak || 0}</span>
            </div>
          </div>
        </header>

        {/* Content area sized to fit between header, tip, and bottom nav */}
        <div style={{ height: 'calc(100vh - var(--header-height) - var(--bottom-nav-height) - var(--tip-height) - env(safe-area-inset-top) - env(safe-area-inset-bottom))' }} className="px-2 pt-2 overflow-hidden">
          {/* Horizontal columns - each column is a vertical stack of 3 cards */}
          <div className="h-full flex items-stretch">
            {quizzes.length === 0 ? (
              <div className="w-full h-full bg-white/80 rounded-xl p-4 text-center flex items-center justify-center">
                <p className="text-text-secondary text-sm">No quests yet</p>
              </div>
            ) : (
              <div className="h-full overflow-x-auto flex gap-4 px-3 snap-x snap-mandatory" style={{ WebkitOverflowScrolling: 'touch' }}>
                {chunkArray(unattemptedQuizzes, 3).slice(0, 8).map((col, idx) => (
                  <div key={idx} className="flex-shrink-0" style={{ flex: '0 0 86%', height: '100%', scrollSnapAlign: 'center' }}>
                    <div className="flex flex-col gap-3 h-full">
                      {col.map((quiz) => (
                        <motion.button
                          key={quiz.quizId}
                          onClick={() => navigate(`/quiz/${quiz.quizId}`)}
                          className="bg-white rounded-lg p-3 text-left shadow-sm flex-1 overflow-hidden"
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="w-full h-8 flex items-center justify-center mb-1">
                            {quiz.subject === 'Mathematics' ? <Calculator className="w-5 h-5 text-green-600" /> : quiz.subject === 'English' ? <BookOpen className="w-5 h-5 text-blue-600" /> : <GraduationCap className="w-5 h-5 text-purple-600" />}
                          </div>
                          <h3 className="font-semibold text-sm text-text-primary truncate">{quiz.topic}</h3>
                          <p className="text-xs text-text-secondary truncate">{quiz.subject}</p>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tips Section - sits above bottom nav */}
        <div className="px-2" style={{ height: 'var(--tip-height)' }}>
          <div className="bg-white/80 backdrop-blur rounded-xl p-3 h-full flex items-center gap-3">
            <Lightbulb className="w-5 h-5 text-accent flex-shrink-0" />
            <p className="text-sm text-text-primary truncate">
              {currentStudent?.persona.personaType === 'visual' 
                ? 'Try using diagrams to understand concepts!'
                : currentStudent?.persona.personaType === 'auditory'
                ? 'Read aloud to improve retention!'
                : 'Practice with hands-on exercises!'}
            </p>
          </div>
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 py-2 z-40" style={{ height: 'var(--bottom-nav-height)' }}>
          <div className="flex items-center justify-between px-8">
            <button onClick={() => navigate('/profile')} className="flex flex-col items-center p-2">
              <UserIcon className="w-6 h-6 text-text-secondary" />
              <span className="text-[10px] text-text-secondary">Profile</span>
            </button>
            <button onClick={() => setShowShopPopup(true)} className="flex flex-col items-center p-2">
              <ShoppingBag className="w-6 h-6 text-text-secondary" />
              <span className="text-[10px] text-text-secondary">Shop</span>
            </button>
          </div>
        </nav>

        {/* Shop Coming Soon Popup - Mobile */}
        {showShopPopup && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowShopPopup(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <ShoppingBag className="w-12 h-12 text-primary mx-auto mb-4" strokeWidth={2} />
                <h2 className="text-xl font-bold text-text-primary mb-2">Coming Soon!</h2>
                <p className="text-text-secondary">
                  Hello, this feature is coming soon... keep saving those gems and XP!
                </p>
                <button 
                  onClick={() => setShowShopPopup(false)}
                  className="mt-4 px-6 py-2 bg-primary text-white rounded-lg font-medium"
                >
                  Got it!
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </div>
    );
  }

  

  // Desktop layout (original)
  return (
    <>
      {importModalRendered}
      <div className="p-4 space-y-6">
      {/* Shop Coming Soon Popup - Desktop */}
      {showShopPopup && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowShopPopup(false)}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <ShoppingBag className="w-12 h-12 text-primary mx-auto mb-4" strokeWidth={2} />
              <h2 className="text-xl font-bold text-text-primary mb-2">Coming Soon!</h2>
              <p className="text-text-secondary">
                Hello, this feature is coming soon... keep saving those gems and XP!
              </p>
              <button 
                onClick={() => setShowShopPopup(false)}
                className="mt-4 px-6 py-2 bg-primary text-white rounded-lg font-medium"
              >
                Got it!
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Header with Avatar, Student Profile, Quest Hub and Offline Mode */}
      <header className="flex items-start gap-3">
        {/* Avatar with Level Badge - Left side */}
        <button 
          onClick={() => navigate('/profile')}
          className="relative w-12 h-12 rounded-full border-2 border-white/60 bg-white/40 backdrop-blur-md shadow-lg flex items-center justify-center flex-shrink-0"
        >
          <User className="w-6 h-6 text-highlight font-bold" strokeWidth={2.5} />
          {/* Pulsing Level Badge */}
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-primary to-accent text-white text-xs font-bold flex items-center justify-center shadow-md animate-pulse">
            {avatar?.level || 1}
          </span>
        </button>
        
        {/* Student Profile - Name and Progress */}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-text-primary truncate">
            {currentStudent?.name || 'Student'}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden relative">
              {/* Progress bar with shimmer animation */}
              <div 
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500 relative overflow-hidden progress-shimmer"
                style={{ width: `${((currentStudent?.xp || 0) % 500) / 5}%` }}
              >
                {/* Shimmer overlay */}
                <div className="absolute inset-0 bg-white/30 skew-x-12 animate-shimmer" />
              </div>
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] pointer-events-none" />
            </div>
            <span className="text-xs font-bold text-neon-green whitespace-nowrap bg-arcade-surface px-2 py-0.5 rounded">
              Lvl {(avatar?.level || 1) + 1}
            </span>
          </div>
        </div>
        
        {/* Quest Hub with Offline Mode - Center */}
        <div className="flex flex-col items-center flex-shrink-0">
          <h2 className="text-lg font-bold text-text-primary">
            Quest Hub
          </h2>
          <div className="flex items-center gap-1.5 mt-1">
            <WifiOff className="w-3.5 h-3.5 text-text-secondary" strokeWidth={2.5} />
            <span className="text-xs font-bold text-text-secondary">
              Offline Mode
            </span>
          </div>
        </div>
      </header>
      
      {/* Stats Cards - Bento Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Streak Card */}
        <motion.div 
          className="stat-card"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Flame className="w-6 h-6 text-highlight" strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded-full">
              STREAK
            </span>
          </div>
          <p className="text-4xl font-black text-text-primary tracking-tighter">
            {currentStudent?.streak || 0}
          </p>
          <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
            Day Streak
          </p>
        </motion.div>
        
        {/* Marketplace Icon */}
        <motion.button
          className="stat-card flex flex-col items-center justify-center"
          whileHover={{ scale: 1.05 }}
          onClick={() => setShowShopPopup(true)}
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mb-1">
            <ShoppingBag className="w-6 h-6 text-emerald-600" strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-black text-emerald-600">
            SHOP
          </span>
        </motion.button>
        
        {/* XP Card */}
        <motion.div 
          className="stat-card"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
              <Gem className="w-6 h-6 text-accent" strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-black text-accent bg-accent/10 px-2 py-1 rounded-full">
              GEMS
            </span>
          </div>
          <p className="text-4xl font-black text-text-primary tracking-tighter">
            {currentStudent?.gems || 0}
          </p>
          <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
            Quest Gems
          </p>
        </motion.div>
      </div>
      

      {/* Quest Map */}
      <div>
        <h2 className="text-lg font-bold text-text-primary mb-4">Your Quests</h2>
        
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="quest-item animate-pulse">
                <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-12">
            {/* Empty State Illustration */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-primary" strokeWidth={2} />
              </div>
            </motion.div>
            <motion.h3
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xl font-bold text-text-primary mb-2"
            >
              No Quests Yet!
            </motion.h3>
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-text-secondary mb-6 max-w-xs mx-auto"
            >
              Start your learning adventure by importing your first quiz or taking a snap!
            </motion.p>
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <button
                onClick={() => { setShowImportModal(true); window.dispatchEvent(new CustomEvent('import-modal-open')); }}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <FileJson className="w-5 h-5" strokeWidth={2} />
                Import Quiz
              </button>
              <button
                onClick={() => navigate('/note-upload')}
                className="btn-secondary flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" strokeWidth={2} />
                Snap to Study
              </button>
            </motion.div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div 
              className="space-y-3"
              layout
            >
              {/* Section Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                  Available Quests
                </h2>
                <span className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
                  {unattemptedQuizzes.length} available • {completedQuizzesList.length} completed
                </span>
              </div>
              
              {/* Unattempted Quizzes */}
              {visibleQuizzes.map((quiz) => {
                // Determine subject color for glow effect
                const subjectColor = quiz.subject === 'Mathematics' 
                  ? { bg: 'bg-green-100', text: 'text-green-600', border: '#22c55e', glow: '#22c55e40' }
                  : quiz.subject === 'English'
                  ? { bg: 'bg-blue-100', text: 'text-blue-600', border: '#3b82f6', glow: '#3b82f640' }
                  : { bg: 'bg-purple-100', text: 'text-purple-600', border: '#a855f7', glow: '#a855f740' };
              
              const isCompleted = isQuizCompleted(quiz.quizId);
              
              return (
                <motion.button
                  key={quiz.quizId}
                  layout
                  initial={{ opacity: 1, scale: 1 }}
                  exit={{ 
                    opacity: 0, 
                    scale: 0.5, 
                    x: 100,
                    transition: { duration: 0.3 }
                  }}
                  onClick={() => handleStartQuiz(quiz)}
                  className={`quest-item w-full text-left relative overflow-hidden ${!isCompleted ? 'quest-pulse' : ''} ${isCompleted ? 'opacity-60' : ''}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    boxShadow: !isCompleted ? `0 0 15px ${subjectColor.glow}` : 'none',
                  }}
                >
                  {/* Subject color glow border on hover */}
                  <motion.div 
                    className="absolute inset-0 rounded-xl border-2 border-transparent pointer-events-none"
                    whileHover={{ 
                      borderColor: subjectColor.border,
                      boxShadow: `0 0 25px ${subjectColor.glow}`,
                    }}
                    transition={{ duration: 0.2 }}
                  />
                  <div className={`w-12 h-12 rounded-lg ${subjectColor.bg} flex items-center justify-center`}>
                    {quiz.subject === 'Mathematics' ? 
                      <Calculator className={`w-6 h-6 ${subjectColor.text}`} strokeWidth={2.5} /> : 
                       quiz.subject === 'English' ? 
                      <Book className={`w-6 h-6 ${subjectColor.text}`} strokeWidth={2.5} /> :
                      <GraduationCap className={`w-6 h-6 ${subjectColor.text}`} strokeWidth={2.5} />}
                  </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-text-primary">{quiz.topic}</h3>
                  <p className="text-sm text-text-secondary">
                    {quiz.subject} • {quiz.questions.length} questions
                  </p>
                </div>
                {isQuizCompleted(quiz.quizId) ? (
                  <motion.div
                    initial={{ scale: 3, rotate: -30, opacity: 0 }}
                    animate={{ scale: 1, rotate: -9, opacity: 1 }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 200, 
                      damping: 15,
                      delay: 0.1 
                    }}
                    className="relative"
                  >
                    <div className="px-4 py-2 rounded-lg border-4 border-success/60 bg-success/20 rotate-[-5deg]">
                      <span className="text-lg font-black text-success tracking-wider">
                        ✓ COMPLETED
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-accent/10 text-accent flex items-center gap-1">
                    <Gem className="w-3 h-3" strokeWidth={2.5} />
                    {quiz.gems || (quiz.difficulty === 'hard' ? 5 : quiz.difficulty === 'medium' ? 4 : 3)} gems
                  </span>
                )}
                </motion.button>
              );
              })}
              
              {/* Show More Button */}
              {hasMoreQuizzes && !showAllQuizzes && (
                <motion.button
                  onClick={() => setShowAllQuizzes(true)}
                  className="w-full py-3 px-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-colors"
                  style={{ 
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text-secondary)'
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ChevronDown className="w-5 h-5" />
                  Show {unattemptedQuizzes.length - MAX_VISIBLE_QUIZZES} More Quests
                </motion.button>
              )}
              
              {/* Show Less Button */}
              {showAllQuizzes && unattemptedQuizzes.length > MAX_VISIBLE_QUIZZES && (
                <motion.button
                  onClick={() => setShowAllQuizzes(false)}
                  className="w-full py-3 px-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-colors"
                  style={{ 
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text-secondary)'
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ChevronDown className="w-5 h-5 rotate-180" />
                  Show Less
                </motion.button>
              )}
              
              {/* Completed Quizzes Section */}
              {completedQuizzesList.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-md font-bold mb-3" style={{ color: 'var(--theme-text-secondary)' }}>
                    Completed Quests
                  </h3>
                  <div className="space-y-2">
                    {completedQuizzesList.slice(0, showAllQuizzes ? undefined : 3).map((quiz) => (
                      <motion.button
                        key={quiz.quizId}
                        onClick={() => handleStartQuiz(quiz)}
                        className="quest-item w-full text-left relative overflow-hidden opacity-60"
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className={`w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center`}>
                          <BookOpen className="w-5 h-5 text-slate-500" strokeWidth={2} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-text-primary text-sm">{quiz.topic}</h4>
                          <p className="text-xs text-text-secondary">
                            {quiz.subject}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-success">✓</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
      
      {/* Study Tips */}
      <div>
        <h2 className="text-lg font-bold text-text-primary mb-4">Today's Tips</h2>
        <div className="card-glass p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-accent" strokeWidth={2.5} />
            <div>
              <p className="font-medium text-text-primary">
                {currentStudent?.persona.personaType === 'visual' 
                  ? 'Try using diagrams and charts to understand concepts!'
                  : currentStudent?.persona.personaType === 'auditory'
                  ? 'Read aloud to improve retention!'
                  : 'Practice with hands-on exercises!'}
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
    </>
  );
}
