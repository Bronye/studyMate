import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '../stores/useAppStore';
import { ArrowLeft, Flame, Gem, Eye, Ear, Hand, BookOpen, LogOut as LogOutIcon } from 'lucide-react';
import { ThemeSwitcher } from '../components/common/ThemeSwitcher';

export default function Profile() {
  const navigate = useNavigate();
  const { currentStudent, logout } = useAppStore();
  
  const avatar = currentStudent?.avatar;
  const persona = currentStudent?.persona;

  const handleLogout = () => {
    logout();
    navigate('/splash');
  };
  
  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <header className="flex items-center gap-4">
        <button onClick={() => navigate('/home')} className="btn-ghost">
          <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
        </button>
        <h1 className="text-xl font-bold">Your Learning Profile</h1>
      </header>
      
      {/* Avatar Card */}
      <motion.div 
        className="card-glass p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {avatar?.level || 1}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{currentStudent?.username || currentStudent?.name}</h2>
            <p className="text-text-secondary">{currentStudent?.grade} Student</p>
          </div>
        </div>
        
        {/* Level Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Level {avatar?.level || 1}</span>
            <span className="text-text-secondary">Level {(avatar?.level || 1) + 1}</span>
          </div>
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-primary to-accent"
              initial={{ width: 0 }}
              animate={{ width: `${((avatar?.xp || 0) % 500) / 5}%` }}
            />
          </div>
        </div>
      </motion.div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          className="card p-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Flame className="w-8 h-8 text-primary" strokeWidth={2.5} />
          <p className="text-2xl font-bold mt-2">{currentStudent?.streak || 0}</p>
          <p className="text-sm text-text-secondary">Day Streak</p>
        </motion.div>
        
        <motion.div 
          className="card p-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Gem className="w-8 h-8 text-accent" strokeWidth={2.5} />
          <p className="text-2xl font-bold mt-2">{currentStudent?.xp || 0}</p>
          <p className="text-sm text-text-secondary">Total XP</p>
        </motion.div>
      </div>
      
      {/* Persona Card */}
      <motion.div 
        className="card-glass p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-lg font-bold mb-4">Your Learning Style</h3>
        
        <div className="flex items-center gap-3 mb-4">
          {persona?.personaType === 'visual' ? 
            <Eye className="w-8 h-8 text-primary" strokeWidth={2.5} /> :
             persona?.personaType === 'auditory' ? 
            <Ear className="w-8 h-8 text-primary" strokeWidth={2.5} /> :
             persona?.personaType === 'kinesthetic' ? 
            <Hand className="w-8 h-8 text-primary" strokeWidth={2.5} /> : 
            <BookOpen className="w-8 h-8 text-primary" strokeWidth={2.5} />}
          <div>
            <p className="text-xl font-semibold capitalize">{persona?.personaType} Learner</p>
            <p className="text-sm text-text-secondary">EQ Tone: {persona?.cognitiveProfile.eqBaseline}</p>
          </div>
        </div>
        
        {/* Cognitive Stats */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-secondary">Processing Speed</span>
              <span className="font-medium">{persona?.cognitiveProfile.processingSpeed}/10</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full">
              <div 
                className="h-full bg-primary rounded-full"
                style={{ width: `${(persona?.cognitiveProfile.processingSpeed || 5) * 10}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-secondary">Critical Thinking</span>
              <span className="font-medium">{persona?.cognitiveProfile.criticalThinking}/10</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full">
              <div 
                className="h-full bg-accent rounded-full"
                style={{ width: `${(persona?.cognitiveProfile.criticalThinking || 5) * 10}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-secondary">Attention Span</span>
              <span className="font-medium">{persona?.cognitiveProfile.attentionSpan} minutes</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full">
              <div 
                className="h-full bg-highlight rounded-full"
                style={{ width: `${(persona?.cognitiveProfile.attentionSpan || 25) / 0.6}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Study Preferences */}
      <motion.div 
        className="card-glass p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-lg font-bold mb-4">Study Preferences</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Preferred Difficulty</span>
            <span className="font-medium capitalize">{persona?.preferredDifficulty}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Session Duration</span>
            <span className="font-medium">{persona?.studyPatterns.sessionDuration} minutes</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Break Frequency</span>
            <span className="font-medium">Every {persona?.studyPatterns.breakFrequency} hour(s)</span>
          </div>
        </div>
      </motion.div>
      
      {/* Theme Settings */}
      <motion.div 
        className="card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <ThemeSwitcher />
      </motion.div>
      
      {/* Logout Button */}
      <motion.div 
        className="card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <button 
          onClick={handleLogout}
          className="w-full py-3 border-2 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-opacity-10 transition-colors"
          style={{ borderColor: 'var(--theme-primary)', color: 'var(--theme-primary)' }}
        >
          <LogOutIcon className="w-5 h-5" />
          Log Out
        </button>
      </motion.div>
      
      {/* Danger Zone */}
      <motion.div 
        className="card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--theme-primary)' }}>Danger Zone</h3>
        <p className="text-sm mb-4" style={{ color: 'var(--theme-text-secondary)' }}>
          This will delete all your local data including progress and saved quizzes.
        </p>
        <button className="w-full py-3 border-2 rounded-lg font-medium hover:bg-opacity-10 transition-colors" style={{ borderColor: 'var(--theme-primary)', color: 'var(--theme-primary)' }}>
          Reset All Data
        </button>
      </motion.div>
    </div>
  );
}
