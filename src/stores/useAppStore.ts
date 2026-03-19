import { create } from 'zustand';
import { Quiz, StudentProfile, QuizAttempt, AvatarState, db } from '../db/database';
import { useGamificationStore } from './gamificationStore';

interface AppState {
  // User state
  currentStudent: StudentProfile | null;
  isOnboarded: boolean;
  isAuthenticated: boolean;  // NEW: Login state
  hasSeenSplash: boolean;    // NEW: Track if user has seen splash screen
  isFirstTimeUser: boolean;  // NEW: Track if user is first time user

  // Quiz state
  currentQuiz: Quiz | null;
  currentQuestionIndex: number;
  answers: Map<string, string>;
  quizStartTime: number | null;
  quizInProgress: boolean;
  completedQuizzes: Set<string>;

  // Hint system
  hintTokens: number;
  usedHints: Set<string>; // Track which questions have used hints

  // UI state
  isOnline: boolean;
  isSyncing: boolean;

  // Actions
  setCurrentStudent: (student: StudentProfile | null) => void;
  setOnboarded: (value: boolean) => void;
  startQuiz: (quiz: Quiz) => void;
  answerQuestion: (questionId: string, optionId: string) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  finishQuiz: () => QuizAttempt | null;
  resetQuiz: () => void;
  setOnlineStatus: (status: boolean) => void;
  setSyncing: (status: boolean) => void;

  // XP and Streak
  addXP: (amount: number) => void;
  addGems: (amount: number) => void;
  updateStreak: () => void;
  checkAndUpdateStreak: () => void;
  updateAvatar: (updates: Partial<AvatarState>) => void;
  markQuizCompleted: (quizId: string) => void;
  isQuizCompleted: (quizId: string) => boolean;

  // Hint actions
  useHint: (questionId: string) => boolean;
  addHintTokens: (amount: number) => void;
  resetUsedHints: () => void;

  // Load student from storage
  loadStudent: () => Promise<void>;

  // NEW: Auth actions
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  signUp: (username: string, email: string, password: string) => Promise<boolean>;
  markSplashSeen: () => void;
  setFirstTimeUser: (value: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  currentStudent: null,
  isOnboarded: false,
  isAuthenticated: false,
  hasSeenSplash: false,
  isFirstTimeUser: true,
  currentQuiz: null,
  currentQuestionIndex: 0,
  answers: new Map(),
  quizStartTime: null,
  quizInProgress: false,
  completedQuizzes: new Set<string>(),

  // Hint system - start with 3 tokens
  hintTokens: 3,
  usedHints: new Set<string>(),

  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,

  // Actions
  setCurrentStudent: (student) => set({ currentStudent: student }),

  setOnboarded: (value) => set({ isOnboarded: value }),

  markSplashSeen: () => {
    set({ hasSeenSplash: true });
    localStorage.setItem('studymate_splash_seen', 'true');
  },

  setFirstTimeUser: (value) => set({ isFirstTimeUser: value }),

  startQuiz: (quiz) => set({
    currentQuiz: quiz,
    currentQuestionIndex: 0,
    answers: new Map(),
    quizStartTime: Date.now(),
    quizInProgress: true,
    usedHints: new Set<string>()
  }),

  answerQuestion: (questionId, optionId) => {
    const newAnswers = new Map(get().answers);
    newAnswers.set(questionId, optionId);
    set({ answers: newAnswers });
  },

  nextQuestion: () => {
    const { currentQuiz, currentQuestionIndex } = get();
    if (currentQuiz && currentQuestionIndex < currentQuiz.questions.length - 1) {
      set({ currentQuestionIndex: currentQuestionIndex + 1 });
    }
  },

  prevQuestion: () => {
    const { currentQuestionIndex } = get();
    if (currentQuestionIndex > 0) {
      set({ currentQuestionIndex: currentQuestionIndex - 1 });
    }
  },

  finishQuiz: () => {
    const { currentQuiz, answers, quizStartTime, currentStudent, completedQuizzes, addXP, addGems, hintTokens } = get();
    if (!currentQuiz) return null;

    // Use demo student if no student profile (for testing)
    const studentId = currentStudent?.studentId || 'demo_student';
    const studentName = currentStudent?.name || 'Demo Student';

    const timeSpent = quizStartTime ? Math.floor((Date.now() - quizStartTime) / 1000) : 0;

    // Calculate score
    const questionResults = currentQuiz.questions.map(q => {
      const selectedOptionId = answers.get(q.id) || '';
      const isCorrect = selectedOptionId === q.correctOptionId;
      return {
        questionId: q.id,
        selectedOptionId,
        isCorrect
      };
    });

    const correctCount = questionResults.filter(r => r.isCorrect).length;
    const score = Math.round((correctCount / currentQuiz.questions.length) * 100);

    const attempt: QuizAttempt = {
      attemptId: `attempt_${Date.now()}`,
      quizId: currentQuiz.quizId,
      studentId,
      answers: questionResults,
      score,
      totalQuestions: currentQuiz.questions.length,
      timeSpent,
      completedAt: new Date(),
      synced: false
    };

    // Award points only if quiz hasn't been completed before
    const isAlreadyCompleted = completedQuizzes.has(currentQuiz.quizId);
    if (!isAlreadyCompleted) {
      // Award XP based on performance
      let xpAmount = currentQuiz.points || 10;
      if (score >= 70) {
        xpAmount += 3; // Bonus XP for high score
      } else if (score >= 50) {
        xpAmount += 1; // Small bonus for passing
      }
      addXP(xpAmount);

      // Award gems based on difficulty (3-5 gems)
      const gemsAwarded = currentQuiz.gems ||
        (currentQuiz.difficulty === 'hard' ? 5 : currentQuiz.difficulty === 'medium' ? 4 : 3);
      addGems(gemsAwarded);
    }

    // Award hint tokens for good performance (score >= 70%)
    if (score >= 70) {
      const newHintTokens = hintTokens + 1;
      set({ hintTokens: newHintTokens });
    }

    set({ quizInProgress: false });

    return attempt;
  },

  resetQuiz: () => set({
    currentQuiz: null,
    currentQuestionIndex: 0,
    answers: new Map(),
    quizStartTime: null,
    quizInProgress: false
  }),

  setOnlineStatus: (status) => set({ isOnline: status }),

  setSyncing: (status) => set({ isSyncing: status }),

  addXP: (amount) => {
    // Use new gamification store for XP tracking
    const gamificationStore = useGamificationStore.getState();
    gamificationStore.addXP(amount, 'quiz_complete');

    // Also update student profile for backwards compatibility
    const { currentStudent } = get();
    if (currentStudent) {
      const newXP = currentStudent.xp + amount;
      const newLevel = Math.floor(newXP / 500) + 1;

      const updatedStudent = {
        ...currentStudent,
        xp: newXP,
        avatar: {
          ...currentStudent.avatar!,
          level: newLevel,
          xp: newXP
        }
      };

      set({ currentStudent: updatedStudent });
      db.students.put(updatedStudent).catch(err => console.error('Error saving XP:', err));
    }
  },

  addGems: (amount) => {
    // Use new gamification store
    const gamificationStore = useGamificationStore.getState();
    gamificationStore.addGems(amount);

    // Also update student profile
    const { currentStudent } = get();
    if (currentStudent) {
      const newGems = (currentStudent.gems || 0) + amount;

      const updatedStudent = {
        ...currentStudent,
        gems: newGems
      };

      set({ currentStudent: updatedStudent });
      db.students.put(updatedStudent).catch(err => console.error('Error saving gems:', err));
    }
  },

  updateStreak: () => {
    // Use new gamification store for streak tracking
    const gamificationStore = useGamificationStore.getState();
    gamificationStore.updateStreak();

    // Also update student profile for backwards compatibility
    const { currentStudent } = get();
    if (currentStudent) {
      const today = new Date();
      const lastStudy = currentStudent.lastStudyDate;
      let newStreak = currentStudent.streak;

      if (lastStudy) {
        const lastDate = new Date(lastStudy);
        const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff === 1) {
          newStreak += 1;
        } else if (daysDiff > 1) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }

      set({
        currentStudent: {
          ...currentStudent,
          streak: newStreak,
          lastStudyDate: today,
          avatar: {
            ...currentStudent.avatar!,
            streak: newStreak
          }
        }
      });
    }
  },

  // Check and update streak on app load (daily login)
  checkAndUpdateStreak: () => {
    // Use new gamification store
    const gamificationStore = useGamificationStore.getState();
    gamificationStore.checkAndUpdateStreak();

    // Also update student profile for backwards compatibility
    const { currentStudent, addXP } = get();
    if (currentStudent) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;
      const lastStudy = currentStudent.lastStudyDate;

      console.log('[Streak Debug - useAppStore] checkAndUpdateStreak called');
      console.log('[Streak Debug - useAppStore] today:', todayStr);
      console.log('[Streak Debug - useAppStore] lastStudy:', lastStudy);
      console.log('[Streak Debug - useAppStore] current streak:', currentStudent.streak);

      if (lastStudy) {
        // Use local date parsing to avoid timezone issues
        const lastStudyStr = lastStudy instanceof Date
          ? `${lastStudy.getFullYear()}-${String(lastStudy.getMonth() + 1).padStart(2, '0')}-${String(lastStudy.getDate()).padStart(2, '0')}`
          : String(lastStudy).split('T')[0];
        const lastDate = new Date(lastStudyStr + 'T00:00:00');
        const todayDate = new Date(todayStr + 'T00:00:00');
        const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        console.log('[Streak Debug - useAppStore] daysDiff:', daysDiff);

        // If last study was yesterday, increment streak
        if (daysDiff === 1) {
          const newStreak = currentStudent.streak + 1;
          set({
            currentStudent: {
              ...currentStudent,
              streak: newStreak,
              lastStudyDate: today,
              avatar: {
                ...currentStudent.avatar!,
                streak: newStreak
              }
            }
          });
          // Award XP for daily login streak
          addXP(2);
          console.log('[Streak Debug - useAppStore] Streak incremented to:', newStreak);
        }
        // If last study was today, do nothing
        else if (daysDiff === 0) {
          // Already studied today
          console.log('[Streak Debug - useAppStore] Already studied today');
        }
        // If last study was more than 1 day ago, reset streak to 1
        else if (daysDiff > 1) {
          console.log('[Streak Debug - useAppStore] Streak broken! Resetting to 1');
          set({
            currentStudent: {
              ...currentStudent,
              streak: 1,
              lastStudyDate: today,
              avatar: {
                ...currentStudent.avatar!,
                streak: 1
              }
            }
          });
        }
      } else {
        // No previous study date, initialize to 1
        console.log('[Streak Debug - useAppStore] First time user, initializing to 1');
        set({
          currentStudent: {
            ...currentStudent,
            streak: 1,
            lastStudyDate: today,
            avatar: {
              ...currentStudent.avatar!,
              streak: 1
            }
          }
        });
      }
    }
  },

  updateAvatar: (updates) => {
    const { currentStudent } = get();
    if (currentStudent && currentStudent.avatar) {
      set({
        currentStudent: {
          ...currentStudent,
          avatar: {
            ...currentStudent.avatar,
            ...updates
          }
        }
      });
    }
  },

  markQuizCompleted: async (quizId) => {
    const { completedQuizzes, currentStudent } = get();
    const newCompletedQuizzes = new Set(completedQuizzes);
    newCompletedQuizzes.add(quizId);
    set({ completedQuizzes: newCompletedQuizzes });

    // Save to student profile in database for persistence
    if (currentStudent) {
      try {
        const updatedStudent = {
          ...currentStudent,
          completedQuizzes: Array.from(newCompletedQuizzes)
        };
        await db.students.put(updatedStudent);
        set({ currentStudent: updatedStudent });
        console.log('Saved completed quiz to student profile:', quizId);
      } catch (error) {
        console.error('Error saving completed quiz:', error);
      }
    }
  },

  isQuizCompleted: (quizId) => {
    const { completedQuizzes } = get();
    return completedQuizzes.has(quizId);
  },

  // Hint actions
  useHint: (questionId) => {
    const { hintTokens, usedHints } = get();

    // Check if already used hint for this question
    if (usedHints.has(questionId)) {
      return false;
    }

    // Check if user has tokens
    if (hintTokens <= 0) {
      return false;
    }

    // Consume token and mark hint as used
    const newUsedHints = new Set(usedHints);
    newUsedHints.add(questionId);

    set({
      hintTokens: hintTokens - 1,
      usedHints: newUsedHints
    });

    return true;
  },

  addHintTokens: (amount) => {
    const { hintTokens } = get();
    set({ hintTokens: hintTokens + amount });
  },

  resetUsedHints: () => {
    set({ usedHints: new Set<string>() });
  },

  // Load student from IndexedDB and check session
  loadStudent: async () => {
    try {
      // Check for existing session first
      const hasSession = localStorage.getItem('studymate_session') === 'true';
      const hasSeenSplash = localStorage.getItem('studymate_splash_seen') === 'true';
      
      // Get stored credentials to find the correct student
      const storedCredentials = localStorage.getItem('studymate_credentials');
      const storedUsername = storedCredentials ? JSON.parse(storedCredentials).username : null;
      
      // Get all students from IndexedDB
      const students = await db.students.toArray();
      
      if (students.length > 0) {
        // If we have a stored username, find the matching student
        let student = students[0];
        if (storedUsername) {
          const matchingStudent = students.find(s => s.username === storedUsername);
          if (matchingStudent) {
            student = matchingStudent;
          }
        }

        // Load completed quizzes from student profile
        const completedList = student.completedQuizzes || [];
        const completedSet = new Set(completedList);

        set({
          currentStudent: student,
          isOnboarded: true,
          isAuthenticated: hasSession,
          hasSeenSplash: hasSeenSplash,
          completedQuizzes: completedSet
        });
        console.log('Loaded student from storage:', student.username || student.name, 'Authenticated:', hasSession);
      } else {
        console.log('No student found in storage');
        set({ 
          isOnboarded: false,
          isAuthenticated: false 
        });
      }
    } catch (error) {
      console.error('Error loading student:', error);
    }
  },

  // NEW: Local authentication - simple username/password check
  login: async (username: string, password: string): Promise<boolean> => {
    try {
      // For local auth, we check against stored credentials
      // In a real app, this would be more secure with hashing
      const storedCredentials = localStorage.getItem('studymate_credentials');

      if (storedCredentials) {
        const creds = JSON.parse(storedCredentials);
        // Check if username and password match exactly
        if (creds.username === username && creds.password === password) {
          // Find the student in IndexedDB by username
          const students = await db.students.toArray();
          const matchingStudent = students.find(s => s.username === username);
          
          if (matchingStudent) {
            set({ 
              isAuthenticated: true, 
              hasSeenSplash: true,
              currentStudent: matchingStudent
            });
            localStorage.setItem('studymate_session', 'true');
            localStorage.setItem('studymate_splash_seen', 'true');
            localStorage.setItem('studymate_current_student_id', matchingStudent.studentId);
            console.log('[Auth] Login successful with stored credentials');
            return true;
          } else {
            // Student profile doesn't exist yet - redirect to onboarding
            set({ isAuthenticated: true, hasSeenSplash: true });
            localStorage.setItem('studymate_session', 'true');
            localStorage.setItem('studymate_splash_seen', 'true');
            console.log('[Auth] Login successful but no student profile - needs onboarding');
            return true;
          }
        } else if (creds.username !== username) {
          // Username doesn't match - user doesn't exist
          console.log('[Auth] Login failed - username not found');
          return false;
        } else if (creds.password !== password) {
          // Password doesn't match
          console.log('[Auth] Login failed - incorrect password');
          return false;
        }
      }

      // No stored credentials - check if this is a new user trying to log in
      console.log('[Auth] Login failed - no account found. Please sign up first.');
      return false;
    } catch (error) {
      console.error('[Auth] Login error:', error);
      return false;
    }
  },

  // NEW: Logout - clear session
  logout: () => {
    set({ 
      isAuthenticated: false,
      hasSeenSplash: false 
    });
    localStorage.removeItem('studymate_session');
    console.log('[Auth] Logged out');
  },

  // NEW: SignUp - create new user
  signUp: async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      // Store credentials locally (in production, this would be a backend)
      localStorage.setItem('studymate_credentials', JSON.stringify({ username, password, email }));
      set({ 
        isAuthenticated: true, 
        hasSeenSplash: true,
        isOnboarded: false 
      });
      localStorage.setItem('studymate_session', 'true');
      localStorage.setItem('studymate_splash_seen', 'true');
      console.log('[Auth] Signup successful');
      return true;
    } catch (error) {
      console.error('[Auth] Signup error:', error);
      return false;
    }
  }
}));
