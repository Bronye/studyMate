import { useState, createElement, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../stores/useAppStore';
import { db, StudentProfile, LearningPersona } from '../db/database';
import { Eye, Ear, Hand, BookOpen, Sparkles, Smile, Meh, Frown, Brain, Zap, Target, Clock, Check, X, ArrowRight, Sparkles as Stars } from 'lucide-react';

// Icon mapping for dynamic icons
const getIconComponent = (iconName: string | undefined) => {
  if (!iconName) return null;
  const icons: Record<string, React.ElementType> = {
    'visibility': Eye,
    'volume_up': Ear,
    'touch_app': Hand,
    'menu_book': BookOpen,
    'auto_awesome': Sparkles,
    'sentiment_satisfied': Smile,
    'sentiment_neutral': Meh,
    'sentiment_very_dissatisfied': Frown,
  };
  return icons[iconName] || null;
};

// Telemetry tracking interface
interface TelemetryData {
  initiationLag: number;
  clickFreqHz: number;
  cursorDelta: number;
  backspaceCount: number;
  gistHoverTime: number;
  whyHoverTime: number;
  gistToWhyToggle: boolean;
  mathInputVelocity: number;
  errorCount: number;
  mathStartTime: number;
  mathEndTime: number;
  mathAnswers: { correct: boolean; timeSpent: number }[];
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { setCurrentStudent, setOnboarded } = useAppStore();
  
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    grade: 'SSS1' as const,
    learningStyle: 'visual' as const,
    preferredDifficulty: 'medium' as const,
  });
  
  // Telemetry state
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    initiationLag: 0,
    clickFreqHz: 0,
    cursorDelta: 0,
    backspaceCount: 0,
    gistHoverTime: 0,
    whyHoverTime: 0,
    gistToWhyToggle: false,
    mathInputVelocity: 0,
    errorCount: 0,
    mathStartTime: 0,
    mathEndTime: 0,
    mathAnswers: [],
  });
  
  const [componentMountTime, setComponentMountTime] = useState<number>(0);
  const [firstInteraction, setFirstInteraction] = useState<boolean>(false);
  const gistHoverRef = useRef<number>(0);
  const whyHoverRef = useRef<number>(0);
  const [selectedGist, setSelectedGist] = useState<boolean | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  
  // Math game state
  const [mathProblems, setMathProblems] = useState<{ a: number; b: number; op: string; answer: number }[]>([]);
  const [currentMathIndex, setCurrentMathIndex] = useState(0);
  const [mathInput, setMathInput] = useState('');
  const [mathTimer, setMathTimer] = useState(10);
  const [mathStarted, setMathStarted] = useState(false);
  const [mathCompleted, setMathCompleted] = useState(false);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Profile synthesis animation state
  const [showSynthesis, setShowSynthesis] = useState(false);
  const [studentClass, setStudentClass] = useState<'Scholar' | 'Speedster' | 'Tactician' | 'Zen Learner'>('Tactician');
  
  // Generate math problems
  useEffect(() => {
    const problems = [
      { a: 12, b: 7, op: '+', answer: 19 },
      { a: 9, b: 3, op: '×', answer: 27 },
      { a: 20, b: 5, op: '÷', answer: 4 },
      { a: 15, b: 8, op: '+', answer: 23 },
      { a: 6, b: 7, op: '×', answer: 42 },
    ];
    setMathProblems(problems);
  }, []);
  
  // Track component mount time
  useEffect(() => {
    setComponentMountTime(Date.now());
  }, []);
  
  // Track first interaction
  useEffect(() => {
    if (!firstInteraction && step > 3) { // After initial questions
      const lag = Date.now() - componentMountTime;
      setTelemetry(prev => ({ ...prev, initiationLag: lag }));
      setFirstInteraction(true);
    }
  }, [step, componentMountTime, firstInteraction]);
  
  // Timer for math game
  useEffect(() => {
    if (mathStarted && mathTimer > 0 && !mathCompleted) {
      const interval = setInterval(() => {
        setMathTimer(prev => {
          if (prev <= 1) {
            handleMathTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setTimerInterval(interval);
      return () => clearInterval(interval);
    }
  }, [mathStarted, mathCompleted]);
  
  const handleMathTimeout = () => {
    setMathCompleted(true);
    if (timerInterval) clearInterval(timerInterval);
  };
  
  const startMathGame = () => {
    setMathStarted(true);
    setTelemetry(prev => ({ ...prev, mathStartTime: Date.now() }));
  };
  
  const handleMathAnswer = (answer: string) => {
    const currentProblem = mathProblems[currentMathIndex];
    const isCorrect = parseInt(answer) === currentProblem.answer;
    const timeSpent = 10 - mathTimer;
    
    const newAnswers = [...telemetry.mathAnswers, { correct: isCorrect, timeSpent }];
    const errorCount = isCorrect ? telemetry.errorCount : telemetry.errorCount + 1;
    
    setTelemetry(prev => ({
      ...prev,
      mathAnswers: newAnswers,
      errorCount,
      mathInputVelocity: newAnswers.length > 0 
        ? newAnswers.reduce((sum, a) => sum + (a.correct ? 1 : 0), 0) / (newAnswers.length || 1)
        : 0
    }));
    
    if (currentMathIndex < mathProblems.length - 1) {
      setCurrentMathIndex(prev => prev + 1);
      setMathTimer(10);
      setMathInput('');
    } else {
      setMathCompleted(true);
      setTelemetry(prev => ({ ...prev, mathEndTime: Date.now() }));
      if (timerInterval) clearInterval(timerInterval);
    }
  };
  
  // Question types
  const questions = [
    {
      id: 'name',
      question: "What's your name?",
      type: 'text',
      placeholder: 'Enter your name'
    },
    {
      id: 'grade',
      question: 'What class are you in?',
      type: 'choice',
      options: ['SSS1', 'SSS2', 'SSS3']
    },
    {
      id: 'learningStyle',
      question: 'How do you learn best?',
      type: 'choice',
      options: [
        { value: 'visual', label: 'Visual', icon: 'visibility' },
        { value: 'auditory', label: 'Auditory', icon: 'volume_up' },
        { value: 'kinesthetic', label: 'Hands-on', icon: 'touch_app' },
        { value: 'reading', label: 'Reading', icon: 'menu_book' }
      ]
    },
    {
      id: 'preferredDifficulty',
      question: 'What challenge level do you prefer?',
      type: 'choice',
      options: [
        { value: 'easy', label: 'Easy', icon: 'sentiment_satisfied' },
        { value: 'medium', label: 'Medium', icon: 'sentiment_neutral' },
        { value: 'hard', label: 'Hard', icon: 'sentiment_very_dissatisfied' }
      ]
    },
    // Task 1: Concept Diagram (Cognitive Depth)
    {
      id: 'conceptDiagram',
      question: 'Understanding Photosynthesis',
      type: 'concept',
      content: {
        diagram: 'Photosynthesis is the process by which plants convert light energy into chemical energy. During this process, carbon dioxide and water are transformed into glucose and oxygen. The chlorophyll in leaf cells captures light energy from the sun, driving the chemical reactions that sustain plant life.',
        gist: 'Plants use sunlight to convert CO₂ and water into food (glucose) and oxygen.',
        explanation: 'Photosynthesis occurs in chloroplasts containing chlorophyll. Light energy drives the light-dependent reactions, producing ATP and NADPH. These energy carriers fuel the Calvin cycle, where carbon fixation produces glucose. The process releases oxygen as a byproduct, essential for life on Earth.'
      }
    },
    // Task 2: Speed-Run Math (Pressure Tolerance)
    {
      id: 'speedMath',
      question: 'Speed Challenge!',
      type: 'math',
      timeLimit: 10
    }
  ];
  
  const handleNext = async () => {
    // Calculate student class based on telemetry
    if (step === questions.length - 1) {
      // Calculate Cognitive Depth (D)
      const D = telemetry.gistHoverTime > 0 && telemetry.whyHoverTime > 0
        ? telemetry.whyHoverTime / (telemetry.gistHoverTime + telemetry.whyHoverTime)
        : 0.5;
      
      // Calculate Pressure Tolerance (P)
      const correctAnswers = telemetry.mathAnswers.filter(a => a.correct).length;
      const totalTimeRemaining = (telemetry.mathEndTime - telemetry.mathStartTime) / 1000;
      const A = correctAnswers / (telemetry.mathAnswers.length || 1);
      const Trem = Math.max(0, totalTimeRemaining / 50); // Normalize to 0-1
      const P = A * (1 + Trem);
      
      // Determine student class
      let assignedClass: 'Scholar' | 'Speedster' | 'Tactician' | 'Zen Learner' = 'Tactician';
      
      if (D > 0.6 && P > 0.7) {
        assignedClass = 'Scholar'; // High cognitive depth, handles pressure
      } else if (P > 0.8 && correctAnswers >= 4) {
        assignedClass = 'Speedster'; // Fast and accurate under pressure
      } else if (P < 0.5 && correctAnswers >= 3) {
        assignedClass = 'Zen Learner'; // Careful, methodical, not stressed by time
      } else {
        assignedClass = 'Tactician'; // Balanced, strategic
      }
      
      setStudentClass(assignedClass);
      setShowSynthesis(true);
      
      // Wait for animation, then save
      setTimeout(async () => {
        await saveStudentProfile(assignedClass, D, P);
      }, 3000);
      
      return;
    }
    
    if (step < questions.length - 1) {
      setStep(step + 1);
    }
  };
  
  const saveStudentProfile = async (assignedClass: string, cognitiveDepth: number, pressureTolerance: number) => {
    const persona: LearningPersona = {
      studentId: `student_${Date.now()}`,
      personaType: formData.learningStyle,
      cognitiveProfile: {
        processingSpeed: 6,
        memoryStrength: 'working',
        attentionSpan: 25,
        criticalThinking: 6,
        eqBaseline: 'encouraging'
      },
      cognitiveDepth,
      pressureTolerance,
      studentClass: assignedClass as 'Scholar' | 'Speedster' | 'Tactician' | 'Zen Learner',
      telemetry: {
        initiationLag: telemetry.initiationLag,
        clickFreqHz: telemetry.clickFreqHz,
        cursorDelta: telemetry.cursorDelta,
        backspaceCount: telemetry.backspaceCount,
        gistHoverTime: telemetry.gistHoverTime,
        whyHoverTime: telemetry.whyHoverTime,
        gistToWhyToggle: telemetry.gistToWhyToggle,
        mathInputVelocity: telemetry.mathInputVelocity,
        errorCount: telemetry.errorCount,
      },
      subjectStrengths: [],
      preferredDifficulty: formData.preferredDifficulty,
      studyPatterns: {
        peakHours: [9, 10, 11, 15, 16, 17],
        sessionDuration: 30,
        breakFrequency: 2
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const storedCreds = localStorage.getItem('studymate_credentials');
    const storedUsername = storedCreds ? JSON.parse(storedCreds).username : formData.name;
    
    const student: StudentProfile = {
      studentId: persona.studentId,
      username: storedUsername,
      name: formData.name,
      grade: formData.grade,
      xp: 0,
      gems: 0,
      streak: 0,
      completedQuizzes: [],
      avatar: {
        level: 1,
        xp: 0,
        streak: 0,
        unlockedAccessories: [],
        mood: 'happy',
        expression: 'smile'
      },
      persona,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.students.add(student);
    setCurrentStudent(student);
    setOnboarded(true);
    navigate('/home');
  };
  
  const hasValidSelection = () => {
    if (step === 0) return formData.name.trim().length > 0;
    if (step === 1) return (formData.grade as string) !== '';
    if (step === 2) return (formData.learningStyle as string) !== '';
    if (step === 3) return (formData.preferredDifficulty as string) !== '';
    if (step === 4) return selectedGist !== null; // Concept diagram requires selection
    if (step === 5) return mathCompleted; // Math requires completion
    return true;
  };
  
  const currentQ = questions[step];
  
  // Calculate timer color (blue to red)
  const getTimerColor = () => {
    const ratio = mathTimer / 10;
    if (ratio > 0.5) return 'from-blue-400 to-blue-600';
    if (ratio > 0.25) return 'from-yellow-400 to-orange-500';
    return 'from-orange-500 to-red-600';
  };
  
  // Render Neural Profile Synthesis animation
  if (showSynthesis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-32 h-32 mx-auto mb-8"
          >
            <Brain className="w-32 h-32 text-purple-400" />
          </motion.div>
          
          <h2 className="text-2xl font-bold text-white mb-4">Analyzing Your Learning Profile...</h2>
          
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 2 }}
            className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4 max-w-md mx-auto"
          />
        </motion.div>
        
        <AnimatePresence>
          {studentClass && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2, duration: 0.5 }}
              className="text-center mt-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 2.2, type: "spring", stiffness: 200 }}
                className="inline-block p-8 bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-3xl border border-purple-500/50 backdrop-blur-md"
              >
                <Stars className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-white mb-2">Profile Confirmed</h3>
                <p className="text-xl text-purple-300">You are a</p>
                <h4 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent mt-2">
                  {studentClass}
                </h4>
              </motion.div>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.8 }}
                className="text-slate-400 mt-6 max-w-md"
              >
                {studentClass === 'Scholar' && "Your deep curiosity and ability to handle complexity sets you apart. You'll thrive with detailed explanations first."}
                {studentClass === 'Speedster' && "Fast and focused under pressure! You excel when the stakes are high and the clock is ticking."}
                {studentClass === 'Tactician' && "You think before you act. Strategic and measured - you'll excel with clear paths and logical progression."}
                {studentClass === 'ZenLearner' && "Calm and careful. You prefer to take your time and get things right. Guided learning paths will suit you best."}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background p-6 flex flex-col">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-widest text-text-secondary">
            Step {step + 1} of {questions.length}
          </span>
          <span className="text-xs font-bold text-primary">
            {Math.round(((step + 1) / questions.length) * 100)}%
          </span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-primary to-accent"
            initial={{ width: 0 }}
            animate={{ width: `${((step + 1) / questions.length) * 100}%` }}
          />
        </div>
        <div className="flex justify-center gap-2 mt-4">
          {questions.map((_, index) => (
            <motion.div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === step 
                  ? 'w-8 bg-gradient-to-r from-primary to-accent' 
                  : index < step 
                  ? 'w-2 bg-primary' 
                  : 'w-2 bg-slate-200'
              }`}
              initial={false}
              animate={{
                width: index === step ? 32 : 8,
                backgroundColor: index <= step ? '#10B981' : '#e2e8f0'
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Question Content */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1"
      >
        <h1 className="text-2xl font-bold text-text-primary mb-8">
          {currentQ.question}
        </h1>
        
        {/* Text Input */}
        {currentQ.type === 'text' && (
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={currentQ.placeholder}
            className="input-field text-lg"
            autoFocus
          />
        )}
        
        {/* Choice Selection */}
        {currentQ.type === 'choice' && (
          <div className="space-y-3">
            {currentQ.options?.map((opt: any) => (
              <button
                key={opt.value || opt}
                onClick={() => {
                  if (step === 1) setFormData({ ...formData, grade: opt as any });
                  if (step === 2) setFormData({ ...formData, learningStyle: (opt as any).value });
                  if (step === 3) setFormData({ ...formData, preferredDifficulty: (opt as any).value });
                }}
                className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all
                  ${(step === 1 && formData.grade === opt) ||
                    (step === 2 && formData.learningStyle === (opt as any).value) ||
                    (step === 3 && formData.preferredDifficulty === (opt as any).value)
                    ? 'border-primary bg-primary/10' 
                    : 'border-slate-200 hover:border-primary/50'
                  }`}
              >
                {(opt as any).icon && (
                  createElement(getIconComponent((opt as any).icon)!, { className: "w-6 h-6 text-primary", strokeWidth: 2.5 })
                )}
                <span className="font-medium">{(opt as any).label || opt}</span>
              </button>
            ))}
          </div>
        )}
        
        {/* Task 1: Concept Diagram */}
        {currentQ.type === 'concept' && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-text-primary leading-relaxed">
                {(currentQ as any).content.diagram}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setSelectedGist(true);
                  setTelemetry(prev => ({ ...prev, gistHoverTime: Date.now() - componentMountTime }));
                }}
                onMouseEnter={() => {
                  gistHoverRef.current = Date.now();
                }}
                onMouseLeave={() => {
                  const hoverDuration = Date.now() - gistHoverRef.current;
                  setTelemetry(prev => ({ ...prev, gistHoverTime: prev.gistHoverTime + hoverDuration }));
                }}
                className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${
                  selectedGist 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-5 h-5 text-blue-500" />
                  <span className="font-bold text-blue-600">Gimme the gist</span>
                </div>
                <p className="text-sm text-slate-500">1 bullet point summary</p>
                {(currentQ as any).content.gist && selectedGist && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 text-sm text-text-primary bg-white p-2 rounded"
                  >
                    {(currentQ as any).content.gist}
                  </motion.p>
                )}
              </button>
              
              <button
                onClick={() => {
                  setSelectedGist(false);
                  setShowExplanation(true);
                  setTelemetry(prev => ({ 
                    ...prev, 
                    whyHoverTime: Date.now() - componentMountTime,
                    gistToWhyToggle: selectedGist === true
                  }));
                }}
                onMouseEnter={() => {
                  whyHoverRef.current = Date.now();
                }}
                onMouseLeave={() => {
                  const hoverDuration = Date.now() - whyHoverRef.current;
                  setTelemetry(prev => ({ ...prev, whyHoverTime: prev.whyHoverTime + hoverDuration }));
                }}
                className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${
                  !selectedGist && showExplanation
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-slate-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Brain className="w-5 h-5 text-purple-500" />
                  <span className="font-bold text-purple-600">Explain the 'Why'</span>
                </div>
                <p className="text-sm text-slate-500">Detailed explanation</p>
                {(currentQ as any).content.explanation && showExplanation && !selectedGist && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 text-sm text-text-primary bg-white p-2 rounded"
                  >
                    {(currentQ as any).content.explanation}
                  </motion.p>
                )}
              </button>
            </div>
          </div>
        )}
        
        {/* Task 2: Speed-Run Math */}
        {currentQ.type === 'math' && (
          <div className="space-y-6">
            {!mathStarted ? (
              <div className="text-center py-8">
                <Zap className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <p className="text-text-secondary mb-4">5 quick math problems. 10 seconds each!</p>
                <p className="text-sm text-slate-500 mb-6">See how fast you can answer correctly under pressure.</p>
                <button
                  onClick={startMathGame}
                  className="btn-primary px-8 py-3 text-lg"
                >
                  Start Challenge
                </button>
              </div>
            ) : !mathCompleted ? (
              <div className="space-y-4">
                {/* Timer Bar */}
                <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${getTimerColor()}`}
                    style={{ width: `${(mathTimer / 10) * 100}%` }}
                  />
                </div>
                
                {/* Problem */}
                <div className="text-center py-8">
                  <p className="text-sm text-text-secondary mb-2">Problem {currentMathIndex + 1} of 5</p>
                  <p className="text-4xl font-bold text-text-primary mb-6">
                    {mathProblems[currentMathIndex].a} {mathProblems[currentMathIndex].op} {mathProblems[currentMathIndex].b} = ?
                  </p>
                  <input
                    type="number"
                    value={mathInput}
                    onChange={(e) => setMathInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && mathInput.trim()) {
                        handleMathAnswer(mathInput);
                      }
                    }}
                    placeholder="?"
                    className="input-field text-2xl text-center w-32 mx-auto"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      if (mathInput.trim()) {
                        handleMathAnswer(mathInput);
                      }
                    }}
                    disabled={!mathInput.trim()}
                    className="btn-primary mt-4"
                  >
                    Submit
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-text-primary mb-2">Challenge Complete!</h3>
                <p className="text-text-secondary">
                  {telemetry.errorCount === 0 
                    ? "Perfect score! 🎉" 
                    : `${5 - telemetry.errorCount} out of 5 correct`}
                </p>
              </div>
            )}
          </div>
        )}
      </motion.div>
      
      {/* Continue Button */}
      <button
        onClick={handleNext}
        disabled={!hasValidSelection()}
        className="btn-primary w-full mt-8"
      >
        {step === questions.length - 1 ? 'Complete Profile' : step === 4 && !showSynthesis ? 'Continue to Math Challenge' : step === 5 && !mathCompleted ? 'Finish Challenge' : 'Continue'}
      </button>
    </div>
  );
}
