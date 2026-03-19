import { useState, createElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '../stores/useAppStore';
import { db, StudentProfile, LearningPersona } from '../db/database';
import { Eye, Ear, Hand, BookOpen, Sparkles, Smile, Meh, Frown } from 'lucide-react';

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
    }
  ];
  
  const handleNext = async () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      // Create student profile
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
      
      // Get username from signup (stored in localStorage)
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
      
      // Save to IndexedDB
      await db.students.add(student);
      
      // Update store
      setCurrentStudent(student);
      setOnboarded(true);
      
      navigate('/home');
    }
  };
  
  // Check if current step has a valid selection
  const hasValidSelection = () => {
    if (step === 0) return formData.name.trim().length > 0;
    if (step === 1) return (formData.grade as string) !== '';
    if (step === 2) return (formData.learningStyle as string) !== '';
    if (step === 3) return (formData.preferredDifficulty as string) !== '';
    return true;
  };
  
  const currentQ = questions[step];
  
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
        {/* Step Indicator Dots */}
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
      
      {/* Question */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1"
      >
        <h1 className="text-2xl font-bold text-text-primary mb-8">
          {currentQ.question}
        </h1>
        
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
      </motion.div>
      
      {/* Continue Button */}
      <button
        onClick={handleNext}
        disabled={!hasValidSelection()}
        className="btn-primary w-full mt-8"
      >
        {step === questions.length - 1 ? 'Start Learning!' : 'Continue'}
      </button>
    </div>
  );
}
