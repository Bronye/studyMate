import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './stores/useAppStore';
import { useThemeStore } from './stores/themeStore';
import { seedSampleQuizzes } from './data/sampleQuiz';

// Layout
import Layout from './components/layout/Layout';

// Pages
import Splash from './pages/Splash';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import QuizPage from './pages/Quiz';
import NoteUpload from './pages/NoteUpload';
import Profile from './pages/Profile';

// Components
import OfflineBanner from './components/common/OfflineBanner';

function App() {
  const { isOnline, setOnlineStatus, isOnboarded, checkAndUpdateStreak, loadStudent, isAuthenticated } = useAppStore();
  const { theme } = useThemeStore();
  
  // Apply theme to root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  
  // Initialize app
  useEffect(() => {
    // Load student from IndexedDB
    loadStudent();
    
    // Seed sample quizzes for offline testing
    seedSampleQuizzes();
    
    // Check and update streak on app load (daily login)
    checkAndUpdateStreak();
    
    // Listen for online/offline events
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus]);
  
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--theme-background)' }}>
      {/* Offline Banner */}
      {!isOnline && <OfflineBanner />}
      
      <Routes>
        {/* Splash Screen - New users only */}
        <Route path="/splash" element={
          isAuthenticated ? <Navigate to="/home" replace /> : <Splash />
        } />
        
        {/* Sign Up Page - Public */}
        <Route path="/signup" element={
          isAuthenticated ? <Navigate to="/home" replace /> : <SignUp />
        } />
        
        {/* Login Page - Public */}
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/home" replace /> : <Login />
        } />
        
        {/* Onboarding Flow - For new users who haven't completed onboarding */}
        <Route path="/onboarding" element={
          isOnboarded ? <Navigate to="/home" replace /> : <Onboarding />
        } />
        
        {/* Main App Routes - Protected */}
        <Route element={<Layout />}>
          <Route path="/home" element={
            !isAuthenticated ? <Navigate to="/splash" replace /> : <Home />
          } />
          <Route path="/home?import=true" element={
            !isAuthenticated ? <Navigate to="/splash" replace /> : <Home />
          } />
          <Route path="/quiz/:quizId" element={
            !isAuthenticated ? <Navigate to="/splash" replace /> : <QuizPage />
          } />
          <Route path="/note-upload" element={
            !isAuthenticated ? <Navigate to="/splash" replace /> : <NoteUpload />
          } />
          <Route path="/quiz-import" element={
            !isAuthenticated ? <Navigate to="/splash" replace /> : <Home />
          } />
          <Route path="/profile" element={
            !isAuthenticated ? <Navigate to="/splash" replace /> : <Profile />
          } />
        </Route>
        
        {/* Default redirect - If authenticated go home, else go splash */}
        <Route path="*" element={
          isAuthenticated ? <Navigate to="/home" replace /> : <Navigate to="/splash" replace />
        } />
      </Routes>
    </div>
  );
}

export default App;
