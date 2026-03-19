import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  FileText, 
  CheckCircle, 
  Upload, 
  Sparkles, 
  AlertCircle,
  Brain,
  Lightbulb,
  Play,
  RotateCcw,
  ArrowLeft
} from 'lucide-react';
import { useNoteUploadStore } from '../stores/noteUploadStore';
import { useAppStore } from '../stores/useAppStore';
import { useGamificationStore } from '../stores/gamificationStore';
import SnapStudyIcon from '../components/icons/SnapStudyIcon';
import StudyModeIcon from '../components/icons/StudyModeIcon';
import { Quiz } from '../db/database';
import { StudyTip } from '../services/quizGenerator';

export default function NoteUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get store state and actions
  const {
    state,
    selectedFile,
    extractedText,
    ocrConfidence,
    ocrSource,
    unclearRegions,
    generatedQuiz,
    studyTips,
    warnings,
    errorMessage,
    studyStartTime,
    setSelectedFile,
    processNote,
    verifyUnclearRegions,
    skipVerification,
    startStudying,
    completeStudySession,
    goToQuiz,
    reset,
    clearQuiz,
    backToReady
  } = useNoteUploadStore();
  
  // Get student profile for persona context
  const { currentStudent } = useAppStore();
  
  // Set student persona when available
  useEffect(() => {
    if (currentStudent?.persona) {
      useNoteUploadStore.getState().setStudentPersona(currentStudent.persona);
    }
  }, [currentStudent]);
  
  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };
  
  // Handle scan/process button click
  const handleProcess = async () => {
    await processNote();
  };
  
  // Handle verification confirmation
  const handleVerify = async () => {
    await verifyUnclearRegions(unclearRegions);
  };
  
  // Handle skip verification
  const handleSkipVerification = async () => {
    await skipVerification();
  };
  
  // Handle Study Now button
  const handleStudyNow = () => {
    startStudying();
  };
  
  // Handle Take Quiz button
  const handleTakeQuiz = async () => {
    await goToQuiz();
  };
  
  // Handle complete study session
  const handleCompleteStudy = async () => {
    await completeStudySession();
  };
  
  // Navigate to quiz
  const handleStartQuiz = () => {
    if (generatedQuiz) {
      navigate(`/quiz/${generatedQuiz.quizId}`);
    }
  };
  
  // Handle reset
  const handleReset = () => {
    reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Render content based on state
  const renderContent = () => {
    switch (state) {
      case 'scanning':
        return <RenderScanning />;
      case 'verifying':
        return (
          <RenderVerifying
            unclearRegions={unclearRegions}
            onVerify={handleVerify}
            onSkip={handleSkipVerification}
          />
        );
      case 'ready':
        return (
          <RenderReady
            extractedText={extractedText}
            confidence={ocrConfidence}
            ocrSource={ocrSource}
            onStudyNow={handleStudyNow}
            onTakeQuiz={handleTakeQuiz}
          />
        );
      case 'studying':
        return (
          <RenderStudying
            extractedText={extractedText}
            studyStartTime={studyStartTime}
            onComplete={handleCompleteStudy}
            onGoToQuiz={handleTakeQuiz}
            onBack={backToReady}
          />
        );
        return <RenderGenerating />;
      case 'completed':
        return (
          <RenderCompleted
            quiz={generatedQuiz}
            studyTips={studyTips}
            warnings={warnings}
            onStartQuiz={handleStartQuiz}
            onReset={handleReset}
          />
        );
      case 'error':
        return (
          <RenderError
            message={errorMessage}
            onRetry={() => {
              clearQuiz();
              setSelectedFile(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
          />
        );
      default:
        return (
          <RenderIdle
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            onProcess={handleProcess}
          />
        );
    }
  };
  
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Dark Scanner Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col z-10">
        
        {/* Header */}
        <div className="flex items-center p-4 justify-between">
          <button 
            onClick={() => navigate('/home')}
            className="text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" strokeWidth={2.5} />
          </button>
          
          <h2 className="text-white font-semibold">Snap to Study</h2>
          
          <div className="w-10"></div>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 relative flex items-center justify-center p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={state}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// =======================
// STATE RENDERERS
// =======================

// Idle State - File selection
function RenderIdle({ 
  selectedFile, 
  onFileSelect, 
  onProcess 
}: { 
  selectedFile: File | null;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onProcess: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  return (
    <div className="space-y-6">
      {/* Corner Markers */}
      <div className="absolute top-1/4 left-8 w-8 h-8 border-l-4 border-t-4 border-highlight rounded-tl-lg viewfinder-corner"></div>
      <div className="absolute top-1/4 right-8 w-8 h-8 border-r-4 border-t-4 border-highlight rounded-tr-lg viewfinder-corner"></div>
      <div className="absolute bottom-1/4 left-8 w-8 h-8 border-l-4 border-b-4 border-highlight rounded-bl-lg viewfinder-corner"></div>
      <div className="absolute bottom-1/4 right-8 w-8 h-8 border-r-4 border-b-4 border-highlight rounded-br-lg viewfinder-corner"></div>
      
      {/* Instructions */}
      <div className="text-center text-white/80">
        {selectedFile ? (
          <div>
            <CheckCircle className="w-14 h-14 mb-4 text-primary mx-auto" strokeWidth={2.5} />
            <p className="text-lg font-medium">{selectedFile.name}</p>
            <p className="text-sm text-white/60 mt-2">Ready to generate quiz</p>
          </div>
        ) : (
          <div>
            <FileText className="w-14 h-14 mb-4 mx-auto" strokeWidth={2.5} />
            <p className="text-lg font-medium">Position your notes in the frame</p>
            <p className="text-sm text-white/60 mt-2">Supports images and PDFs</p>
          </div>
        )}
      </div>
      
      {/* Bottom Actions */}
      <div className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={onFileSelect}
          className="hidden"
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-4 bg-white/10 border border-white/20 rounded-xl text-white font-medium flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
        >
          <Upload className="w-5 h-5" strokeWidth={2.5} />
          {selectedFile ? 'Change File' : 'Upload from Gallery'}
        </button>
        
        {selectedFile && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onProcess}
            className="w-full py-4 bg-highlight rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-highlight/30"
          >
            <Sparkles className="w-5 h-5" strokeWidth={2.5} />
            Generate Quiz
          </motion.button>
        )}
        
        <p className="text-center text-white/50 text-sm">
          Tip: Use good lighting for better results
        </p>
      </div>
    </div>
  );
}

// Scanning State - OCR in progress
function RenderScanning() {
  return (
    <div className="text-center">
      {/* Scanning animation */}
      <div className="relative w-32 h-32 mx-auto mb-6">
        <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-highlight rounded-full animate-spin"></div>
        <Brain className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-highlight" />
      </div>
      
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <FileText className="w-14 h-14 mb-4 mx-auto text-white/60" strokeWidth={2.5} />
        <p className="text-lg font-medium text-white">Analyzing your notes...</p>
        <p className="text-sm text-white/50 mt-2">Extracting text and structure</p>
      </motion.div>
    </div>
  );
}

// Verifying State - Partial Success
function RenderVerifying({
  unclearRegions,
  onVerify,
  onSkip
}: {
  unclearRegions: { text: string; suggestion: string }[];
  onVerify: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Partial success message */}
      <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4 text-center">
        <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
        <p className="text-white font-medium">I caught most of your notes!</p>
        <p className="text-white/70 text-sm mt-1">
          Some parts weren't completely clear. Can you help me verify them?
        </p>
      </div>
      
      {/* Unclear regions list */}
      <div className="space-y-3">
        <h3 className="text-white font-medium text-sm">Unclear regions:</h3>
        {unclearRegions.map((region, index) => (
          <div 
            key={index}
            className="bg-white/10 rounded-lg p-3 border border-white/10"
          >
            <p className="text-white/50 text-sm line-through">{region.text}</p>
            <p className="text-highlight text-sm mt-1">→ {region.suggestion}</p>
          </div>
        ))}
      </div>
      
      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={onVerify}
          className="w-full py-4 bg-primary rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-5 h-5" />
          Confirm & Generate Quiz
        </button>
        
        <button
          onClick={onSkip}
          className="w-full py-3 bg-white/10 rounded-xl text-white/70 font-medium text-sm flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
        >
          Skip verification
        </button>
      </div>
    </div>
  );
}

// Ready State - OCR complete, user chooses action
function RenderReady({
  extractedText,
  confidence,
  ocrSource,
  onStudyNow,
  onTakeQuiz
}: {
  extractedText: string;
  confidence: number;
  ocrSource: 'tesseract' | 'cloud-vision';
  onStudyNow: () => void;
  onTakeQuiz: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Success message */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
        >
          <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" strokeWidth={2.5} />
        </motion.div>
        <p className="text-xl font-bold text-white">Ready to Study! 🎉</p>
        <p className="text-white/60 text-sm mt-1">
          Your notes have been scanned successfully
        </p>
      </div>
      
      {/* Text Preview */}
      <div className="bg-white/10 rounded-xl p-4 border border-white/10 max-h-48 overflow-y-auto">
        <p className="text-white text-sm whitespace-pre-wrap">{extractedText}</p>
      </div>
      
      {/* OCR Info */}
      <div className="flex justify-between text-white/60 text-sm">
        <span>Confidence: {Math.round(confidence * 100)}%</span>
        <span>Source: {ocrSource === 'cloud-vision' ? 'Cloud Vision' : 'Tesseract'}</span>
      </div>
      
      {/* Choice Buttons */}
      <div className="space-y-3">
        <button
          onClick={onStudyNow}
          className="w-full py-4 bg-highlight rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-highlight/30"
        >
          <StudyModeIcon className="w-6 h-6" />
          Study Now (+XP)
        </button>
        
        <button
          onClick={onTakeQuiz}
          className="w-full py-4 bg-primary rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/30"
        >
          <FileText className="w-5 h-5" />
          Take Quiz
        </button>
      </div>
      
      <p className="text-center text-white/50 text-sm">
        Choose how you want to review your notes
      </p>
    </div>
  );
}

// Studying State - Study mode active
function RenderStudying({
  extractedText,
  studyStartTime,
  onComplete,
  onGoToQuiz,
  onBack
}: {
  extractedText: string;
  studyStartTime: number | null;
  onComplete: () => void;
  onGoToQuiz?: () => void;
  onBack?: () => void;
}) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  
  // Update elapsed time every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (studyStartTime) {
        const elapsed = Math.floor((Date.now() - studyStartTime) / 1000);
        setElapsedTime(elapsed);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [studyStartTime]);
  
  // Calculate XP preview
  const minutesStudied = Math.floor(elapsedTime / 60);
  const baseXP = 15;
  const timeBonus = minutesStudied * 2;
  const potentialXP = baseXP + timeBonus;
  
  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleComplete = async () => {
    setIsCompleting(true);
    await onComplete();
  };
  
  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <Brain className="w-10 h-10 text-highlight mx-auto mb-2" strokeWidth={2.5} />
          <p className="text-lg font-bold text-white">Study Mode</p>
        </div>
        <button
          onClick={onGoToQuiz}
          className="px-4 py-2 rounded-lg bg-accent text-white font-medium text-sm"
        >
          Take Quiz
        </button>
      </div>
      
      {/* Timer */}
      <div className="bg-white/10 rounded-xl p-4 border border-white/10">
        <div className="flex justify-between items-center">
          <span className="text-white/60 text-sm">Time Studying</span>
          <span className="text-white font-mono text-xl">{formatTime(elapsedTime)}</span>
        </div>
      </div>
      
      {/* XP Preview */}
      <div className="bg-highlight/20 rounded-xl p-4 border border-highlight/30">
        <div className="flex justify-between items-center">
          <span className="text-white/80 text-sm">Potential XP</span>
          <div className="text-right">
            <span className="text-highlight font-bold text-xl">+{potentialXP} XP</span>
            <p className="text-white/50 text-xs">
              {minutesStudied > 0 ? `+${minutesStudied * 2} XP from ${minutesStudied} min` : 'Base: 15 XP'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Text Content */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10 max-h-64 overflow-y-auto">
        <p className="text-white/90 text-sm whitespace-pre-wrap leading-relaxed">
          {extractedText}
        </p>
      </div>
      
      {/* Complete Button */}
      <button
        onClick={handleComplete}
        disabled={isCompleting}
        className="w-full py-4 bg-primary rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/30 disabled:opacity-50"
      >
        {isCompleting ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <CheckCircle className="w-5 h-5" />
            Mark as Complete
          </>
        )}
      </button>
      
      <p className="text-center text-white/50 text-sm">
        Take your time - XP increases with study duration!
      </p>
    </div>
  );
}

// Generating State - Quiz generation in progress
function RenderGenerating() {
  return (
    <div className="text-center">
      {/* Generating animation */}
      <div className="relative w-32 h-32 mx-auto mb-6">
        <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-accent rounded-full animate-spin"></div>
        <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-accent" />
      </div>
      
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <Brain className="w-14 h-14 mb-4 mx-auto text-white/60" strokeWidth={2.5} />
        <p className="text-lg font-medium text-white">Generating your quiz...</p>
        <p className="text-sm text-white/50 mt-2">Creating personalized questions</p>
      </motion.div>
    </div>
  );
}

// Completed State - Quiz generated successfully or Study session completed
function RenderCompleted({
  quiz,
  studyTips = [],
  warnings = [],
  onStartQuiz,
  onReset
}: {
  quiz: Quiz | null | undefined;
  studyTips?: StudyTip[];
  warnings?: string[];
  onStartQuiz?: () => void;
  onReset?: () => void;
}) {
  // If no quiz, this is a study-only session completed
  if (!quiz) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
          >
            <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" strokeWidth={2.5} />
          </motion.div>
          <p className="text-xl font-bold text-white">Study Session Complete! 📚</p>
          <p className="text-white/60 text-sm mt-1">
            Great job reviewing your notes!
          </p>
        </div>
        
        {/* XP Earned */}
        <div className="bg-white/10 rounded-xl p-4 border border-white/10 text-center">
          <p className="text-white/60 text-sm">XP Earned</p>
          <p className="text-3xl font-black text-primary">+15</p>
        </div>
        
        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onReset}
            className="w-full py-3 px-4 rounded-xl font-semibold bg-primary text-white"
          >
            Upload New Notes
          </button>
        </div>
      </div>
    );
  }
  
  // Original quiz completed view
  return (
    <div className="space-y-6">
      {/* Success message */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
        >
          <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" strokeWidth={2.5} />
        </motion.div>
        <p className="text-xl font-bold text-white">Quiz Ready! 🎉</p>
        <p className="text-white/60 text-sm mt-1">
          {quiz.questions.length} questions generated
        </p>
      </div>
      
      {/* Quiz info card */}
      <div className="bg-white/10 rounded-xl p-4 border border-white/10">
        <div className="flex justify-between items-center mb-3">
          <span className="text-white/60 text-sm">Subject</span>
          <span className="text-white font-medium">{quiz.subject}</span>
        </div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-white/60 text-sm">Topic</span>
          <span className="text-white font-medium">{quiz.topic}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-white/60 text-sm">Questions</span>
          <span className="text-white font-medium">{quiz.questions.length}</span>
        </div>
      </div>
      
      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
          {warnings.map((warning, index) => (
            <p key={index} className="text-amber-400 text-sm">{warning}</p>
          ))}
        </div>
      )}
      
      {/* Study Tips */}
      {studyTips.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-white font-medium flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-secondary" />
            Study Tips
          </h3>
          {studyTips.map((tip, index) => (
            <div 
              key={index}
              className="bg-white/5 rounded-lg p-3 border border-white/5"
            >
              <p className="text-white font-medium text-sm">{tip.title}</p>
              <p className="text-white/50 text-xs mt-1">{tip.description}</p>
            </div>
          ))}
        </div>
      )}
      
      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={onStartQuiz}
          className="w-full py-4 bg-primary rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/30"
        >
          <Play className="w-5 h-5" />
          Start Quiz
        </button>
        
        <button
          onClick={onReset}
          className="w-full py-3 bg-white/10 rounded-xl text-white/70 font-medium text-sm flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Scan Another Note
        </button>
      </div>
    </div>
  );
}

// Error State
function RenderError({
  message,
  onRetry
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="text-center space-y-6">
      <div className="bg-red-500/20 rounded-full p-4 inline-block">
        <AlertCircle className="w-12 h-12 text-red-400" strokeWidth={2.5} />
      </div>
      
      <div>
        <p className="text-lg font-medium text-white">Oops! Something went wrong</p>
        <p className="text-white/50 text-sm mt-2">{message}</p>
      </div>
      
      <button
        onClick={onRetry}
        className="w-full py-4 bg-white/10 border border-white/20 rounded-xl text-white font-medium flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
      >
        <RotateCcw className="w-5 h-5" />
        Try Again
      </button>
    </div>
  );
}
