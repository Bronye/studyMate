import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  XP_CONFIG, 
  LEVEL_CONFIG, 
  recordXPTransaction,
  XPTransaction 
} from '../db/gamification';

interface GamificationState {
  // XP & Currency
  xp: number;
  gems: number;
  coins: number;
  totalXPEarned: number;
  
  // Level System
  level: number;
  
  // Streak System
  streak: {
    current: number;
    longest: number;
    lastActiveDate: string | null;
    freezes: number;
  };
  
  // Daily Stats
  dailyStats: {
    date: string;
    xpEarned: number;
    quizzesCompleted: number;
    studyTimeMinutes: number;
    dailyGoalComplete: boolean;
  };
  
  // Recent Transactions (for display)
  recentTransactions: XPTransaction[];
  
  // Computed values (not persisted)
  xpToNextLevel: number;
  xpProgress: number;
  levelTitle: string;
  
  // Actions
  addXP: (amount: number, source: string, sourceId?: string) => number;
  addGems: (amount: number) => void;
  addCoins: (amount: number) => void;
  
  // Streak Actions
  updateStreak: () => void;
  checkAndUpdateStreak: () => void;
  useStreakFreeze: () => boolean;
  
  // Level Actions
  checkLevelUp: () => boolean;
  
  // Daily Stats Actions
  recordQuizComplete: (score: number, timeSpent: number) => void;
  resetDailyStats: () => void;
  
  // Transaction History
  loadTransactions: (transactions: XPTransaction[]) => void;
  
  // Initialize
  initializeGamification: (savedState?: Partial<GamificationState>) => void;
  
  // Reset (for testing)
  resetGamification: () => void;
}

// Helper to get today's date string (local time)
const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Initial state
const initialState = {
  xp: 0,
  gems: 0,
  coins: 0,
  totalXPEarned: 0,
  level: 1,
  streak: {
    current: 0,
    longest: 0,
    lastActiveDate: null,
    freezes: 0
  },
  dailyStats: {
    date: getTodayDate(),
    xpEarned: 0,
    quizzesCompleted: 0,
    studyTimeMinutes: 0,
    dailyGoalComplete: false
  },
  recentTransactions: [] as XPTransaction[],
  xpToNextLevel: 100,
  xpProgress: 0,
  levelTitle: 'Novice'
};

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // XP Actions
      addXP: (amount, source, sourceId) => {
        const state = get();
        const newTotalXPEarned = state.totalXPEarned + amount;
        
        // Calculate new level
        const newLevel = Math.floor(Math.sqrt(newTotalXPEarned / 100)) + 1;
        const leveledUp = newLevel > state.level;
        
        // Calculate XP to next level
        const xpForCurrentLevel = LEVEL_CONFIG.xpForLevel(newLevel);
        const xpForNextLevel = LEVEL_CONFIG.xpForLevel(newLevel + 1);
        const xpInCurrentLevel = newTotalXPEarned - xpForCurrentLevel;
        const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;
        
        // Update daily stats
        const today = getTodayDate();
        const isNewDay = state.dailyStats.date !== today;
        
        set({
          xp: state.xp + amount,
          totalXPEarned: newTotalXPEarned,
          level: newLevel,
          xpToNextLevel: xpNeededForNext,
          xpProgress: (xpInCurrentLevel / xpNeededForNext) * 100,
          levelTitle: LEVEL_CONFIG.getTitle(newLevel),
          dailyStats: isNewDay 
            ? {
                date: today,
                xpEarned: amount,
                quizzesCompleted: state.dailyStats.quizzesCompleted,
                studyTimeMinutes: state.dailyStats.studyTimeMinutes,
                dailyGoalComplete: false
              }
            : {
                ...state.dailyStats,
                xpEarned: state.dailyStats.xpEarned + amount
              }
        });
        
        // Record transaction (async - don't wait)
        const studentId = 'current_student'; // TODO: Get from auth
        recordXPTransaction(studentId, amount, source as any, sourceId).catch(console.error);
        
        return leveledUp ? newLevel : 0;
      },
      
      addGems: (amount) => {
        set((state) => ({ gems: state.gems + amount }));
      },
      
      addCoins: (amount) => {
        set((state) => ({ coins: state.coins + amount }));
      },
      
      // Streak Actions
      updateStreak: () => {
        const state = get();
        const today = getTodayDate();
        const lastActive = state.streak.lastActiveDate;
        
        console.log('[Streak Debug] updateStreak called');
        console.log('[Streak Debug] today:', today);
        console.log('[Streak Debug] lastActive:', lastActive);
        console.log('[Streak Debug] current streak before:', state.streak.current);
        
        let newStreak = state.streak.current;
        
        if (!lastActive) {
          newStreak = 1;
        } else {
          const lastDate = new Date(lastActive + 'T00:00:00');
          const todayDate = new Date(today + 'T00:00:00');
          const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          
          console.log('[Streak Debug] diffDays:', diffDays);
          
          if (diffDays === 0) {
            // Already updated today
            return;
          } else if (diffDays === 1) {
            // Continue streak
            newStreak = state.streak.current + 1;
          } else if (diffDays === 2 && state.streak.freezes > 0) {
            // Use streak freeze
            set((state) => ({
              streak: {
                ...state.streak,
                freezes: state.streak.freezes - 1,
                current: state.streak.current + 1,
                lastActiveDate: today
              }
            }));
            return;
          } else {
            // Streak broken
            newStreak = 1;
          }
        }
        
        // Check for streak milestones
        const milestones = [7, 14, 30, 60, 100, 365];
        const hitMilestone = milestones.includes(newStreak);
        
        set((state) => ({
          streak: {
            ...state.streak,
            current: newStreak,
            longest: Math.max(state.streak.longest, newStreak),
            lastActiveDate: today
          }
        }));
        
        // Award milestone bonuses
        if (hitMilestone) {
          const milestone = XP_CONFIG.streakMilestones[newStreak];
          if (milestone) {
            get().addXP(milestone.xpBonus, 'streak_milestone');
            get().addGems(milestone.gemsBonus);
          }
        }
      },
      
      checkAndUpdateStreak: () => {
        const state = get();
        const today = getTodayDate();
        const lastActive = state.streak.lastActiveDate;
        
        console.log('[Streak Debug] checkAndUpdateStreak called');
        console.log('[Streak Debug] today:', today);
        console.log('[Streak Debug] lastActive:', lastActive);
        console.log('[Streak Debug] current streak:', state.streak.current);
        
        if (!lastActive) {
          // First time user - initialize streak
          console.log('[Streak Debug] First time user, initializing streak');
          get().updateStreak();
          return;
        }
        
        const lastDate = new Date(lastActive + 'T00:00:00');
        const todayDate = new Date(today + 'T00:00:00');
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        console.log('[Streak Debug] lastDate:', lastDate.toISOString());
        console.log('[Streak Debug] todayDate:', todayDate.toISOString());
        console.log('[Streak Debug] diffDays:', diffDays);
        
        if (diffDays === 0) {
          // Already studied today, do nothing
          console.log('[Streak Debug] Already studied today, do nothing');
          return;
        } else if (diffDays === 1) {
          // Continue streak
          console.log('[Streak Debug] Continue streak - calling updateStreak');
          get().updateStreak();
        } else if (diffDays === 2 && state.streak.freezes > 0) {
          // Use streak freeze
          console.log('[Streak Debug] Using streak freeze');
          get().useStreakFreeze();
        } else {
          // diffDays > 2 means streak is broken - reset to 1
          console.log('[Streak Debug] Streak broken! Resetting to 1');
          set((state) => ({
            streak: {
              ...state.streak,
              current: 1,
              lastActiveDate: today
            }
          }));
        }
      },
      
      useStreakFreeze: () => {
        const state = get();
        if (state.streak.freezes <= 0) return false;
        
        set((state) => ({
          streak: {
            ...state.streak,
            freezes: state.streak.freezes - 1,
            lastActiveDate: getTodayDate()
          }
        }));
        return true;
      },
      
      // Level Actions
      checkLevelUp: () => {
        const state = get();
        const newLevel = Math.floor(Math.sqrt(state.totalXPEarned / 100)) + 1;
        
        if (newLevel > state.level) {
          set({
            level: newLevel,
            levelTitle: LEVEL_CONFIG.getTitle(newLevel)
          });
          return true;
        }
        return false;
      },
      
      // Daily Stats Actions
      recordQuizComplete: (score, timeSpent) => {
        set((state) => {
          const today = getTodayDate();
          const isNewDay = state.dailyStats.date !== today;
          
          if (isNewDay) {
            return {
              dailyStats: {
                date: today,
                xpEarned: 0,
                quizzesCompleted: 1,
                studyTimeMinutes: Math.floor(timeSpent / 60),
                dailyGoalComplete: false
              }
            };
          }
          
          const newQuizzes = state.dailyStats.quizzesCompleted + 1;
          const newStudyTime = state.dailyStats.studyTimeMinutes + Math.floor(timeSpent / 60);
          
          // Check daily goal (3 quizzes or 10 minutes)
          const goalComplete = newQuizzes >= 3 || newStudyTime >= 10;
          
          // Check if goal just completed
          if (!state.dailyStats.dailyGoalComplete && goalComplete) {
            // Award daily goal bonus
            get().addXP(XP_CONFIG.baseXP.dailyGoal, 'daily_goal');
            get().addGems(10);
          }
          
          return {
            dailyStats: {
              ...state.dailyStats,
              quizzesCompleted: newQuizzes,
              studyTimeMinutes: newStudyTime,
              dailyGoalComplete: goalComplete
            }
          };
        });
      },
      
      resetDailyStats: () => {
        set({
          dailyStats: {
            date: getTodayDate(),
            xpEarned: 0,
            quizzesCompleted: 0,
            studyTimeMinutes: 0,
            dailyGoalComplete: false
          }
        });
      },
      
      // Load transactions
      loadTransactions: (transactions) => {
        set({ recentTransactions: transactions.slice(0, 20) });
      },
      
      // Initialize
      initializeGamification: (savedState) => {
        if (savedState) {
          set(savedState as any);
        }
        
        // Check if we need to reset daily stats
        const today = getTodayDate();
        if (get().dailyStats.date !== today) {
          get().resetDailyStats();
        }
        
        // Check streak on load
        get().checkAndUpdateStreak();
      },
      
      // Reset
      resetGamification: () => {
        set(initialState);
      }
    }),
    {
      name: 'study-mate-gamification',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        xp: state.xp,
        gems: state.gems,
        coins: state.coins,
        totalXPEarned: state.totalXPEarned,
        level: state.level,
        streak: state.streak,
        dailyStats: state.dailyStats
      })
    }
  )
);

// Helper hook for easy access to gamification values
export const useGamification = () => {
  const {
    xp,
    gems,
    coins,
    level,
    streak,
    dailyStats,
    xpToNextLevel,
    xpProgress,
    levelTitle,
    addXP,
    addGems,
    addCoins,
    updateStreak,
    recordQuizComplete
  } = useGamificationStore();
  
  return {
    xp,
    gems,
    coins,
    level,
    streak,
    dailyStats,
    xpToNextLevel,
    xpProgress,
    levelTitle,
    addXP,
    addGems,
    addCoins,
    updateStreak,
    recordQuizComplete
  };
};
