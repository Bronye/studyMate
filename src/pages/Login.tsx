import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAppStore();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await login(username, password);
      
      if (success) {
        navigate('/home');
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4" 
      style={{ backgroundColor: 'var(--theme-background)' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ backgroundColor: 'var(--theme-primary)' }}>
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            StudyMate
          </h1>
          <p style={{ color: 'var(--theme-text-secondary)' }}>
            Welcome back! Sign in to continue.
          </p>
        </div>
        
        {/* Login Form */}
        <div className="card-glass p-8" 
          style={{ backgroundColor: 'var(--theme-card-bg)' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label 
                htmlFor="username" 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--theme-text-secondary)' }}
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-colors"
                style={{ 
                  backgroundColor: 'var(--theme-input-bg)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text-primary)'
                }}
                placeholder="Enter your username"
                autoComplete="username"
              />
            </div>
            
            {/* Password Field */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--theme-text-secondary)' }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-xl border-2 focus:outline-none transition-colors"
                  style={{ 
                    backgroundColor: 'var(--theme-input-bg)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text-primary)'
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: 'var(--theme-text-secondary)' }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 rounded-lg"
                style={{ backgroundColor: 'var(--theme-error-bg)', color: 'var(--theme-error)' }}
              >
                {error}
              </motion.div>
            )}
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ 
                backgroundColor: 'var(--theme-primary)',
                color: 'white',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
          
          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p style={{ color: 'var(--theme-text-secondary)' }}>
              Don't have an account?{' '}
              <Link 
                to="/onboarding" 
                className="font-medium hover:underline"
                style={{ color: 'var(--theme-primary)' }}
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
        
        {/* Skip for now */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/home')}
            className="text-sm hover:underline"
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            Continue as Guest
          </button>
        </div>
      </motion.div>
    </div>
  );
}
