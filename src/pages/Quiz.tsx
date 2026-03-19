import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X, Zap } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { useNoteUploadStore } from '../stores/noteUploadStore';
import { db, Quiz, QuizAttempt } from '../db/database';

export default function QuizPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  
  const { 
    currentQuiz, 
    currentQuestionIndex, 
    answers, 
    quizInProgress,
    completedQuizzes,
    startQuiz, 
    answerQuestion, 
    nextQuestion, 
    prevQuestion,
    finishQuiz,
    resetQuiz,
    addXP,
    addGems,
    updateStreak,
    markQuizCompleted,
    hintTokens,
    usedHints,
    useHint,
    addHintTokens,
    resetUsedHints
  } = useAppStore();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes default
  const [showHintModal, setShowHintModal] = useState(false);
  const [currentHint, setCurrentHint] = useState<string | null>(null);
  
  // Load quiz
  useEffect(() => {
    async function loadQuiz() {
      if (!quizId) return;
      
      const foundQuiz = await db.quizzes.where('quizId').equals(quizId).first();
      if (foundQuiz) {
        setQuiz(foundQuiz);
        startQuiz(foundQuiz);
      }
      setLoading(false);
    }
    
    loadQuiz();
  }, [quizId, startQuiz]);
  
  // Timer
  useEffect(() => {
    if (!quizInProgress || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [quizInProgress]);
  
  const handleSelectOption = (optionId: string) => {
    if (!currentQuiz) return;
    const questionId = currentQuiz.questions[currentQuestionIndex].id;
    answerQuestion(questionId, optionId);
  };
  
  const handleFinish = async () => {
    // Prevent double-clicking
    if (processing) return;
    
    setProcessing(true);
    
    try {
      if (!currentQuiz) {
        setProcessing(false);
        return;
      }
      
      const result = finishQuiz();
      
      if (!result) {
        setProcessing(false);
        return;
      }
      
      // Save to IndexedDB
      await db.quizAttempts.add(result);
      
      // Mark quiz as completed
      markQuizCompleted(result.quizId);
      
      updateStreak();
      
      setAttempt(result);
      setShowResults(true);
      
      // Award study bonus if user came from study mode and scored > 30%
      const noteUploadStore = useNoteUploadStore.getState();
      noteUploadStore.awardStudyBonus(result.score);
    } catch (error) {
      console.error('Error finishing quiz:', error);
    } finally {
      setProcessing(false);
    }
  };
  
  const handleExit = () => {
    resetQuiz();
    navigate('/home');
  };
  
  // Determine timer urgency level
  const getTimerUrgency = () => {
    if (timeLeft <= 10) return 'critical';
    if (timeLeft <= 30) return 'urgent';
    if (timeLeft <= 60) return 'warning';
    return 'normal';
  };
  
  const timerUrgency = getTimerUrgency();
  
  // Timer styling based on urgency
  const getTimerStyles = () => {
    const baseStyles = 'flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300';
    
    switch (timerUrgency) {
      case 'critical':
        return `${baseStyles} bg-error text-white animate-pulse-fast shadow-lg shadow-error/50`;
      case 'urgent':
        return `${baseStyles} bg-error/20 text-error animate-pulse shadow-md`;
      case 'warning':
        return `${baseStyles} bg-orange-100 text-orange-600`;
      default:
        return `${baseStyles} bg-primary/10 text-primary`;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleUseHint = () => {
    console.log('[Hint] handleUseHint called', { currentQuestion: currentQuestion?.id, hintTokens, isHintUsed, hasHint, canUseHint });
    
    if (!currentQuestion) {
      console.log('[Hint] No current question');
      return;
    }
    
    // Check if hint already used for this question
    if (usedHints.has(currentQuestion.id)) {
      console.log('[Hint] Already used for this question');
      return;
    }
    
    // Check if there's a hint available
    if (!currentQuestion.hint) {
      console.log('[Hint] No hint available for this question');
      return;
    }
    
    // Try to use the hint
    const success = useHint(currentQuestion.id);
    console.log('[Hint] useHint result:', success);
    
    if (success) {
      setCurrentHint(currentQuestion.hint || null);
      setShowHintModal(true);
      console.log('[Hint] Modal should show now');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <span className="text-3xl animate-spin">⏳</span>
          <p className="mt-2 text-text-secondary">Loading quiz...</p>
        </div>
      </div>
    );
  }
  
  if (!quiz || !currentQuiz) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <span className="text-3xl">⚠️</span>
          <p className="mt-2 text-text-secondary">Quiz not found</p>
          <button onClick={() => navigate('/home')} className="btn-primary mt-4">
            Go Home
          </button>
        </div>
      </div>
    );
  }
  
  const currentQuestion = currentQuiz.questions[currentQuestionIndex];
  const selectedOption = answers.get(currentQuestion.id);
  
  const isHintUsed = usedHints.has(currentQuestion.id);
  const hasHint = currentQuestion.hint ? true : false;
  const canUseHint = hintTokens > 0 && hasHint && !isHintUsed;

  // Calculate actual XP and gems to be awarded (same logic as finishQuiz)
  const isAlreadyCompleted = completedQuizzes.has(currentQuiz?.quizId || '');
  const actualXP = isAlreadyCompleted ? 0 : (
    (currentQuiz?.points || 10) + 
    (attempt && attempt.score >= 70 ? 3 : attempt && attempt.score >= 50 ? 1 : 0)
  );
  const actualGems = isAlreadyCompleted ? 0 : (
    currentQuiz?.gems || 
    (currentQuiz?.difficulty === 'hard' ? 5 : currentQuiz?.difficulty === 'medium' ? 4 : 3)
  );

  // Results Screen
  if (showResults && attempt) {
    return (
      <div className="min-h-screen bg-background p-4">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="card-glass p-8 text-center"
        >
          <div className="mb-6">
            <span className="text-6xl">
              {attempt.score >= 70 ? '🏆' : '😊'}
            </span>
          </div>
          
          <h2 className="text-3xl font-bold text-text-primary mb-2">
            {attempt.score >= 70 ? 'Great Job!' : 'Keep Practicing!'}
          </h2>
          
          <p className="text-5xl font-black text-primary mb-4">
            {attempt.score}%
          </p>
          
          <p className="text-text-secondary mb-6">
            {attempt.score >= 70 
              ? `You got ${attempt.answers.filter(a => a.isCorrect).length} out of ${attempt.totalQuestions} correct!`
              : 'Review the topics and try again!'}
          </p>
          
          {/* XP and Gems Earned */}
          <div className="bg-primary/10 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center gap-4">
              <div>
                <span className="text-primary align-middle">+</span>
                <span className="text-xl font-bold text-primary ml-2">
                  +{actualXP} XP
                </span>
              </div>
              {actualGems > 0 && (
                <div>
                  <span className="text-accent align-middle">+</span>
                  <span className="text-xl font-bold text-accent ml-2">
                    +{actualGems} Gems
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Hint Token Reward */}
          {attempt.score >= 70 && (
            <div className="bg-yellow-100 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2">
                <Lightbulb className="text-yellow-600" size={20} />
                <span className="text-yellow-700 font-medium">
                  +1 Hint Token Earned!
                </span>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <button onClick={() => navigate('/home')} className="btn-primary w-full">
              Back to Quest Hub
            </button>
          </div>
        </motion.div>
      </div>
    );
  }
  
  // Quiz Screen
  return (
    <div className="min-h-screen bg-background p-4 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <button onClick={handleExit} className="btn-ghost text-2xl">
            ✕
          </button>
        
        {/* Timer */}
        <div className={getTimerStyles()}>
          <span className="text-lg">⏱️</span>
          <span className="font-bold font-mono">{formatTime(timeLeft)}</span>
        </div>
        
        {/* Hint Tokens */}
        <div className={`flex items-center gap-1 px-3 py-2 rounded-full 
          ${hintTokens > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-400'}`}>
          <Lightbulb size={18} className={hintTokens > 0 ? 'text-yellow-500' : 'text-slate-400'} />
          <span className="font-bold text-sm">{hintTokens}</span>
        </div>
      </header>
      
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-text-secondary mb-2">
          <span>Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}</span>
          <span>{Math.round(((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100)}%</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex-1"
        >
          <h2 className="text-xl font-bold text-text-primary mb-2">
            {currentQuestion.text}
          </h2>
          
          {/* Hint Button */}
          {hasHint && (
            <button
              onClick={handleUseHint}
              disabled={!canUseHint}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium mb-4 cursor-pointer
                ${isHintUsed 
                  ? 'bg-green-100 text-green-700 cursor-default' 
                  : canUseHint 
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
            >
              <Lightbulb size={16} />
              {isHintUsed ? 'Hint Used' : 'Use Hint (-1 token)'}
            </button>
          )}
          
          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option) => (
              <motion.button
                key={option.id}
                onClick={() => handleSelectOption(option.id)}
                className={`option-button ${selectedOption === option.id ? 'option-button-selected' : ''}`}
                whileTap={{ scale: 0.98 }}
              >
                <span className="font-medium">{option.text}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        <button 
          onClick={prevQuestion}
          disabled={currentQuestionIndex === 0}
          className="btn-ghost flex-1"
        >
          Previous
        </button>
        
        {currentQuestionIndex < currentQuiz.questions.length - 1 ? (
          <button 
            onClick={nextQuestion}
            disabled={!selectedOption}
            className="btn-primary flex-1"
          >
            Next
          </button>
        ) : (
          <button 
            onClick={handleFinish}
            disabled={processing}
            className="btn-primary flex-1"
          >
            {processing ? (
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                Processing...
              </motion.span>
            ) : 'Finish'}
          </button>
        )}
      </div>
      
      {/* Hint Modal */}
      <AnimatePresence>
        {showHintModal && currentHint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowHintModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-yellow-100 p-2 rounded-full">
                  <Lightbulb className="text-yellow-600" size={24} />
                </div>
                <h3 className="text-xl font-bold text-text-primary">Hint</h3>
                <button
                  onClick={() => setShowHintModal(false)}
                  className="ml-auto text-slate-400 hover:text-slate-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <p className="text-text-secondary mb-4">
                {currentHint}
              </p>
              
              <button
                onClick={() => setShowHintModal(false)}
                className="btn-primary w-full"
              >
                Got it!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
