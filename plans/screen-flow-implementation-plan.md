# Screen Flow Implementation Plan

## Objective
Implement the new user flow architecture where new users will experience:
1. **Splash Screen** - Welcome screen with "Get Started" button
2. **Sign Up Page** - User registration form
3. **Onboarding Flow** - Enhanced with telemetry collection
4. **Home Page** - Main application lobby

## Technical Stack
- React 18 + TypeScript
- Vite
- React Router DOM 6
- Zustand for state management
- Framer Motion for animations
- Lucide React for icons
- Tailwind CSS for styling

## Implementation Steps

### Step 1: Create Splash Screen Component
**File:** `src/pages/Splash.tsx`

Key Features:
- Branding and welcome message
- "Get Started" button for new users
- "Sign In" option for existing users
- Animated background effects
- Responsive design

Implementation Details:
```typescript
// src/pages/Splash.tsx
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export default function Splash() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6">
          <BookOpen className="w-10 h-10 text-white" />
        </div>
        
        {/* Title */}
        <h1 className="text-4xl font-bold mb-4">Welcome to StudyMate</h1>
        
        {/* Subtitle */}
        <p className="text-xl mb-8 max-w-md mx-auto">
          Your personal study companion for academic success
        </p>
        
        {/* Buttons */}
        <div className="space-y-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/signup')}
            className="w-full max-w-md px-6 py-4 rounded-xl font-semibold"
          >
            Get Started
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/login')}
            className="w-full max-w-md px-6 py-4 rounded-xl font-semibold"
          >
            Sign In
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
```

### Step 2: Create Sign Up Page
**File:** `src/pages/SignUp.tsx`

Key Features:
- Username/Email input
- Password and confirm password fields
- Terms and conditions acceptance
- Form validation
- Account creation functionality

Implementation Details:
```typescript
// src/pages/SignUp.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

export default function SignUp() {
  const navigate = useNavigate();
  const { signUp } = useAppStore();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (!formData.acceptTerms) {
      setError('Please accept the terms and conditions');
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await signUp(formData.username, formData.email, formData.password);
      
      if (success) {
        navigate('/onboarding');
      } else {
        setError('Failed to create account');
      }
    } catch (err) {
      setError('An error occurred');
      console.error('Sign up error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <h1 className="text-3xl font-bold mb-6 text-center">Create Account</h1>
        
        {error && (
          <div className="mb-4 p-3 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form fields */}
          
          <div className="flex justify-between items-center">
            <Link to="/login" className="text-sm">
              Already have an account? Sign in
            </Link>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl font-semibold"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
```

### Step 3: Update Onboarding Page with Telemetry
**File:** `src/pages/Onboarding.tsx`

Enhancements:
- Add telemetry collection
- Improve visual design
- Enhance progress tracking
- Add study preferences section

### Step 4: Update State Management
**File:** `src/stores/useAppStore.ts`

Add new state and actions:
```typescript
interface AppState {
  // Existing state
  hasSeenSplash: boolean;
  isFirstTimeUser: boolean;
  
  // New actions
  signUp: (username: string, email: string, password: string) => Promise<boolean>;
  markSplashSeen: () => void;
  setFirstTimeUser: (value: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  hasSeenSplash: false,
  isFirstTimeUser: true,
  
  // New actions
  signUp: async (username, email, password) => {
    try {
      // Implement sign up logic (API call or local storage)
      return true;
    } catch (error) {
      console.error('Sign up failed:', error);
      return false;
    }
  },
  
  markSplashSeen: () => set({ hasSeenSplash: true }),
  setFirstTimeUser: (value) => set({ isFirstTimeUser: value }),
  
  // Existing actions...
}));
```

### Step 5: Update Routing in App.tsx
**File:** `src/App.tsx`

Modify routing logic:
```typescript
function App() {
  const { isOnline, setOnlineStatus, isOnboarded, checkAndUpdateStreak, loadStudent, isAuthenticated, hasSeenSplash, isFirstTimeUser } = useAppStore();
  const { theme } = useThemeStore();
  
  // Initialize app
  useEffect(() => {
    loadStudent();
    seedSampleQuizzes();
    checkAndUpdateStreak();
    // ...other effects
  }, [setOnlineStatus]);
  
  return (
    <div className="min-h-screen">
      <OfflineBanner />
      
      <Routes>
        {/* Public Routes */}
        <Route path="/splash" element={
          hasSeenSplash ? <Navigate to="/login" replace /> : <Splash />
        } />
        
        <Route path="/signup" element={
          isAuthenticated ? <Navigate to="/home" replace /> : <SignUp />
        } />
        
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/home" replace /> : <Login />
        } />
        
        {/* Onboarding Flow */}
        <Route path="/onboarding" element={
          isOnboarded ? <Navigate to="/home" replace /> : <Onboarding />
        } />
        
        {/* Main App Routes */}
        <Route element={<Layout />}>
          <Route path="/home" element={
            !isAuthenticated ? <Navigate to="/login" replace /> : <Home />
          } />
          {/* Other main routes */}
        </Route>
        
        {/* Default Redirect */}
        <Route path="*" element={
          isAuthenticated ? (
            isOnboarded ? <Navigate to="/home" replace /> : <Navigate to="/onboarding" replace />
          ) : (
            hasSeenSplash ? <Navigate to="/login" replace /> : <Navigate to="/splash" replace />
          )
        } />
      </Routes>
    </div>
  );
}
```

### Step 6: Test the Complete Flow
- Test for first-time users: `Splash → Sign Up → Onboarding → Home`
- Test for returning users: `Login → Home`
- Test navigation between all pages
- Verify state management works correctly
- Check for any edge cases

## Design Guidelines
- Follow existing theme system (CSS variables)
- Use consistent spacing and typography
- Implement smooth animations with Framer Motion
- Ensure all forms are accessible
- Maintain responsive design for mobile devices

## Future Enhancements
- Social login integration
- Email verification process
- Forgot password functionality
- Multi-language support
- Advanced telemetry tracking
