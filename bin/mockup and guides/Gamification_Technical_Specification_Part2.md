# Study Mate - Gamification Technical Specification

## Part 2: State Management & Component Architecture

**Document Version:** 1.0  
**Date:** March 10, 2026

---

## 3. State Management Design

### 3.1 Overview

We will extend the existing Zustand store (`useAppStore`) with dedicated gamification slices. The store will be organized into modular slices that can be imported and combined.

### 3.2 Store Architecture

```
useAppStore
├── userSlice          (existing)
├── quizSlice          (existing)
├── gamificationSlice  (NEW - XP, Level, Streak)
├── questSlice        (NEW - Quests & Challenges)
├── achievementSlice  (NEW - Badges & Achievements)
└── socialSlice       (NEW - Friends & Leaderboards)
```

### 3.3 Gamification State Slice

```typescript
// src/stores/gamificationStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  XP_CONFIG, 
  LEVEL_CONFIG, 
  recordXPTransaction,
  XPTransaction 
} from '../db/gamification';
import { generateId } from '../utils/generateId';

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
  
  // Computed values
  xpToNextLevel: number;
  xpProgress: number; // percentage
  levelTitle: string;
  
  // Actions
  addXP: (amount: number, source: string, sourceId?: string) => void;
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
}

// Helper to get today's date string
const getTodayDate = () => new Date().toISOString().split('T')[0];

// Helper to calculate streak
const calculateStreak = (lastActiveDate: string | null): number => {
  if (!lastActiveDate) return 1;
  
  const today = new Date();
  const lastDate = new Date(lastActiveDate);
  const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 0; // Already studied today
  if (diffDays === 1) return 1; // Continue streak
  return 1; // Reset streak (could implement grace period)
};

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      // Initial State
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
      recentTransactions: [],
      xpToNextLevel: 100,
      xpProgress: 0,
      levelTitle: 'Novice',
      
      // XP Actions
      addXP: (amount, source, sourceId) => {
        const state = get();
        const newXP = state.xp + amount;
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
          xp: newXP,
          totalXPEarned: newTotalXPEarned,
          level: newLevel,
          xpToNextLevel: xpNeededForNext,
          xpProgress: (xpInCurrentLevel / xpNeededForNext) * 100,
          levelTitle: LEVEL_CONFIG.getTitle(newLevel),
          dailyStats: isNewDay 
            ? {
                date: today,
                xpEarned: amount,
                quizzesCompleted: state.dailyStats.quizzesCompleted + (leveledUp ? 0 : 0),
                studyTimeMinutes: state.dailyStats.studyTimeMinutes,
                dailyGoalComplete: state.dailyStats.dailyGoalComplete
              }
            : {
                ...state.dailyStats,
                xpEarned: state.dailyStats.xpEarned + amount
              }
        });
        
        // Record transaction (async)
        recordXPTransaction('current_student', amount, source as any, sourceId);
        
        // Return if leveled up
        return leveledUp;
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
        
        let newStreak = state.streak.current;
        
        if (!lastActive) {
          newStreak = 1;
        } else {
          const lastDate = new Date(lastActive);
          const todayDate = new Date(today);
          const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          
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
          const milestone = XP_CONFIG.streakMilestones[newStreak as keyof typeof XP_CONFIG.streakMilestones];
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
        
        if (!lastActive) {
          // First time user
          get().updateStreak();
          return;
        }
        
        const lastDate = new Date(lastActive);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
          // Already studied today, do nothing
          return;
        } else if (diffDays === 1) {
          // Continue streak
          get().updateStreak();
        } else if (diffDays === 2 && state.streak.freezes > 0) {
          // Use streak freeze
          get().useStreakFreeze();
        }
        // diffDays > 2 means streak is already broken
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
            // Reset for new day but keep streak logic
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
          set(savedState);
        }
        
        // Check if we need to reset daily stats
        const today = getTodayDate();
        if (get().dailyStats.date !== today) {
          get().resetDailyStats();
        }
        
        // Check streak on load
        get().checkAndUpdateStreak();
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
```

### 3.4 Quest State Slice

```typescript
// src/stores/questStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Quest, QuestProgress, gamificationDB, QUESTS } from '../db/gamification';

interface QuestState {
  // Available quests
  availableQuests: Quest[];
  
  // Active quest progress
  activeQuests: QuestProgress[];
  
  // Quests completed today
  completedQuestsToday: number;
  lastResetDate: string;
  
  // Actions
  loadQuests: () => Promise<void>;
  startQuest: (questId: string, studentId: string) => Promise<void>;
  updateQuestProgress: (questId: string, progress: number) => Promise<void>;
  completeQuest: (questId: string) => Promise<Quest | null>;
  claimReward: (questId: string) => Promise<Quest | null>;
  resetDailyQuests: () => void;
  
  // Computed
  getActiveQuests: () => Quest[];
  getDailyQuests: () => Quest[];
  getWeeklyQuests: () => Quest[];
}

const getTodayDate = () => new Date().toISOString().split('T')[0];

export const useQuestStore = create<QuestState>()(
  persist(
    (set, get) => ({
      availableQuests: QUESTS,
      activeQuests: [],
      completedQuestsToday: 0,
      lastResetDate: getTodayDate(),
      
      loadQuests: async () => {
        const quests = await gamificationDB.questDefinitions.toArray();
        if (quests.length > 0) {
          set({ availableQuests: quests });
        }
        
        // Check daily reset
        const today = getTodayDate();
        if (get().lastResetDate !== today) {
          get().resetDailyQuests();
        }
      },
      
      startQuest: async (questId, studentId) => {
        const existing = get().activeQuests.find(q => q.questId === questId);
        if (existing) return;
        
        const newProgress: QuestProgress = {
          questId,
          studentId,
          progress: 0,
          isComplete: false,
          claimed: false,
          startedAt: new Date()
        };
        
        await gamificationDB.questProgress.add(newProgress);
        
        set((state) => ({
          activeQuests: [...state.activeQuests, newProgress]
        }));
      },
      
      updateQuestProgress: async (questId, progress) => {
        const quest = get().activeQuests.find(q => q.questId === questId);
        if (!quest) return;
        
        const questDef = get().availableQuests.find(q => q.id === questId);
        if (!questDef) return;
        
        const isComplete = progress >= questDef.requirements.target;
        
        await gamificationDB.questProgress
          .where('questId')
          .equals(questId)
          .modify({ 
            progress, 
            isComplete,
            completedAt: isComplete ? new Date() : undefined 
          });
        
        set((state) => ({
          activeQuests: state.activeQuests.map(q => 
            q.questId === questId 
              ? { ...q, progress, isComplete, completedAt: isComplete ? new Date() : q.completedAt }
              : q
          )
        }));
      },
      
      completeQuest: async (questId) => {
        const questDef = get().availableQuests.find(q => q.id === questId);
        if (!questDef) return null;
        
        const progress = get().activeQuests.find(q => q.questId === questId);
        if (!progress || progress.isComplete) return null;
        
        await gamificationDB.questProgress
          .where('questId')
          .equals(questId)
          .modify({ isComplete: true, completedAt: new Date() });
        
        set((state) => ({
          activeQuests: state.activeQuests.map(q => 
            q.questId === questId 
              ? { ...q, isComplete: true, completedAt: new Date() }
              : q
          ),
          completedQuestsToday: state.completedQuestsToday + 1
        }));
        
        return questDef;
      },
      
      claimReward: async (questId) => {
        const questDef = get().availableQuests.find(q => q.id === questId);
        if (!questDef) return null;
        
        const progress = get().activeQuests.find(q => q.questId === questId);
        if (!progress || !progress.isComplete || progress.claimed) return null;
        
        await gamificationDB.questProgress
          .where('questId')
          .equals(questId)
          .modify({ claimed: true });
        
        set((state) => ({
          activeQuests: state.activeQuests.map(q => 
            q.questId === questId ? { ...q, claimed: true } : q
          )
        }));
        
        return questDef;
      },
      
      resetDailyQuests: () => {
        // Reset daily quest progress (keep completed count)
        set({
          completedQuestsToday: 0,
          lastResetDate: getTodayDate()
        });
      },
      
      getActiveQuests: () => {
        return get().activeQuests;
      },
      
      getDailyQuests: () => {
        return get().availableQuests.filter(q => q.type === 'daily');
      },
      
      getWeeklyQuests: () => {
        return get().availableQuests.filter(q => q.type === 'weekly');
      }
    }),
    {
      name: 'study-mate-quests',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
```

### 3.5 Achievement State Slice

```typescript
// src/stores/achievementStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Achievement, EarnedAchievement, gamificationDB, ACHIEVEMENTS } from '../db/gamification';

interface AchievementState {
  // Achievement definitions
  achievements: Achievement[];
  
  // Earned achievements
  earnedAchievements: EarnedAchievement[];
  
  // New unviewed achievements
  newAchievements: string[];
  
  // Actions
  loadAchievements: () => Promise<void>;
  checkAndUnlockAchievement: (studentId: string, criteriaType: string, value: number, subject?: string) => Promise<Achievement | null>;
  markAchievementViewed: (achievementId: string) => void;
  clearNewAchievements: () => void;
  
  // Computed
  getAchievementsByCategory: (category: string) => Achievement[];
  getEarnedAchievementIds: () => string[];
  isAchievementEarned: (achievementId: string) => boolean;
}

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      achievements: ACHIEVEMENTS,
      earnedAchievements: [],
      newAchievements: [],
      
      loadAchievements: async () => {
        const achievements = await gamificationDB.achievements.toArray();
        if (achievements.length > 0) {
          set({ achievements });
        }
        
        // Load earned achievements
        const earned = await gamificationDB.earnedAchievements.toArray();
        set({ earnedAchievements: earned });
      },
      
      checkAndUnlockAchievement: async (studentId, criteriaType, value, subject) => {
        const achievements = get().achievements;
        const earnedIds = get().getEarnedAchievementIds();
        
        for (const achievement of achievements) {
          // Skip if already earned
          if (earnedIds.includes(achievement.id)) continue;
          
          // Skip if criteria doesn't match
          if (achievement.criteria.type !== criteriaType) continue;
          
          // Skip subject-specific if no match
          if (achievement.criteria.subject && achievement.criteria.subject !== subject) continue;
          
          // Check if criteria met
          if (value >= achievement.criteria.target) {
            // Unlock achievement
            await gamificationDB.earnedAchievements.add({
              achievementId: achievement.id,
              studentId,
              earnedAt: new Date(),
              synced: false
            });
            
            set((state) => ({
              earnedAchievements: [
                ...state.earnedAchievements,
                {
                  achievementId: achievement.id,
                  studentId,
                  earnedAt: new Date(),
                  synced: false
                }
              ],
              newAchievements: [...state.newAchievements, achievement.id]
            }));
            
            return achievement;
          }
        }
        
        return null;
      },
      
      markAchievementViewed: (achievementId) => {
        set((state) => ({
          newAchievements: state.newAchievements.filter(id => id !== achievementId)
        }));
      },
      
      clearNewAchievements: () => {
        set({ newAchievements: [] });
      },
      
      getAchievementsByCategory: (category) => {
        return get().achievements.filter(a => a.category === category);
      },
      
      getEarnedAchievementIds: () => {
        return get().earnedAchievements.map(e => e.achievementId);
      },
      
      isAchievementEarned: (achievementId) => {
        return get().getEarnedAchievementIds().includes(achievementId);
      }
    }),
    {
      name: 'study-mate-achievements',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
```

---

## 4. Component Architecture

### 4.1 Component Directory Structure

```
src/
├── components/
│   ├── gamification/
│   │   ├── XPDisplay.tsx           # Shows current XP with animated counter
│   │   ├── LevelBadge.tsx          # Current level with progress ring
│   │   ├── StreakCounter.tsx       # Animated streak fire
│   │   ├── GemCounter.tsx          # Gem currency display
│   │   ├── CoinCounter.tsx         # Coin currency display
│   │   ├── QuestCard.tsx           # Quest display with progress
│   │   ├── QuestList.tsx           # List of active quests
│   │   ├── AchievementBadge.tsx   # Single badge display
│   │   ├── AchievementToast.tsx    # Notification for new badges
│   │   ├── AchievementGallery.tsx  # All achievements grid
│   │   ├── Leaderboard.tsx         # Rankings display
│   │   ├── LearningSprite.tsx      # Animated avatar
│   │   ├── DailyGoals.tsx         # Today's objectives
│   │   ├── XPPopup.tsx            # Floating +XP animation
│   │   └── LevelUpModal.tsx       # Level up celebration
│   │
│   └── effects/
│       ├── ParticleEffect.tsx      # XP particle effects
│       ├── FireAnimation.tsx       # Streak fire effect
│       ├── CelebrationBurst.tsx   # Achievement unlock effect
│       └── ProgressRing.tsx        # Circular progress indicator
│
├── hooks/
│   ├── useGamification.ts         # Combined gamification hooks
│   ├── useQuests.ts               # Quest management hooks
│   ├── useAchievements.ts         # Achievement hooks
│   └── useLevelUp.ts              # Level up detection
│
├── stores/
│   ├── gamificationStore.ts      # XP, Level, Streak state
│   ├── questStore.ts             # Quest state
│   ├── achievementStore.ts       # Achievement state
│   └── useAppStore.ts            # Existing store (extended)
│
└── db/
    ├── database.ts                # Original database
    └── gamification.ts           # NEW: Gamification DB & types
```

### 4.2 Key Component Implementations

#### XP Display Component

```tsx
// src/components/gamification/XPDisplay.tsx

import { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { useGamificationStore } from '../../stores/gamificationStore';
import { Sparkles } from 'lucide-react';

interface XPDisplayProps {
  showBreakdown?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function XPDisplay({ showBreakdown = false, size = 'md' }: XPDisplayProps) {
  const { xp, xpToNextLevel, xpProgress, level, levelTitle } = useGamificationStore();
  const [displayXP, setDisplayXP] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const prevXP = useRef(xp);
  
  // Animated counter
  const springXP = useSpring(0, { stiffness: 100, damping: 30 });
  const progressWidth = useTransform(springXP, [0, xpToNextLevel], ['0%', '100%']);
  
  useEffect(() => {
    springXP.set(xp);
  }, [xp, springXP]);
  
  useEffect(() => {
    // Show popup when XP increases
    if (xp > prevXP.current) {
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 1500);
    }
    prevXP.current = xp;
  }, [xp]);
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  };
  
  return (
    <div className="relative">
      <div className={`flex items-center gap-2 ${sizeClasses[size]}`}>
        <Sparkles className="text-highlight" size={size === 'lg' ? 24 : 16} />
        <span className="font-bold text-highlight">
          {xp.toLocaleString()} XP
        </span>
      </div>
      
      {/* Progress to next level */}
      {showBreakdown && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-text-secondary mb-1">
            <span>Level {level}: {levelTitle}</span>
            <span>{xpToNextLevel} XP to next</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-primary to-highlight"
              style={{ width: progressWidth }}
            />
          </div>
        </div>
      )}
      
      {/* XP Popup */}
      {showPopup && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.5 }}
          animate={{ opacity: 1, y: -20, scale: 1 }}
          exit={{ opacity: 0 }}
          className="absolute -top-8 left-1/2 -translate-x-1/2 bg-highlight text-white px-3 py-1 rounded-full font-bold text-sm shadow-lg"
        >
          +{xp - prevXP.current} XP!
        </motion.div>
      )}
    </div>
  );
}
```

#### Streak Counter Component

```tsx
// src/components/gamification/StreakCounter.tsx

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Shield } from 'lucide-react';
import { useGamificationStore } from '../../stores/gamificationStore';

interface StreakCounterProps {
  showDetails?: boolean;
}

export function StreakCounter({ showDetails = false }: StreakCounterProps) {
  const { streak } = useGamificationStore();
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Determine fire intensity based on streak length
  const getFireIntensity = (streakDays: number) => {
    if (streakDays >= 30) return 'inferno';
    if (streakDays >= 14) return 'blazing';
    if (streakDays >= 7) return 'burning';
    if (streakDays >= 3) return 'smoldering';
    return 'dormant';
  };
  
  const intensity = getFireIntensity(streak.current);
  
  const fireColors = {
    dormant: '#9CA3AF',
    smoldering: '#F97316',
    burning: '#EA580C',
    blazing: '#DC2626',
    inferno: '#B91C1C'
  };
  
  const fireSizes = {
    dormant: 16,
    smoldering: 20,
    burning: 24,
    blazing: 28,
    inferno: 32
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <motion.div
          animate={intensity !== 'dormant' ? {
            scale: [1, 1.1, 1],
            rotate: [0, 2, -2, 0]
          } : {}}
          transition={{
            repeat: Infinity,
            duration: intensity === 'inferno' ? 0.5 : 1
          }}
        >
          <Flame 
            size={fireSizes[intensity]} 
            color={fireColors[intensity]}
            fill={fireColors[intensity]}
          />
        </motion.div>
        
        {/* Glow effect for active streaks */}
        {intensity !== 'dormant' && (
          <motion.div
            className="absolute inset-0 rounded-full blur-md"
            style={{ backgroundColor: fireColors[intensity], opacity: 0.5 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        )}
      </div>
      
      <div className="flex flex-col">
        <span className="font-black text-lg leading-none">
          {streak.current}
        </span>
        {showDetails && (
          <span className="text-xs text-text-secondary">
            day streak
          </span>
        )}
      </div>
      
      {/* Streak freeze indicator */}
      {streak.freezes > 0 && (
        <div className="ml-2 flex items-center gap-1 text-xs text-blue-500">
          <Shield size={12} />
          <span>{streak.freezes}</span>
        </div>
      )}
    </div>
  );
}
```

#### Learning Sprite Avatar Component

```tsx
// src/components/gamification/LearningSprite.tsx

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../stores/useAppStore';
import { AvatarExpression, AvatarMood } from '../../db/gamification';

interface LearningSpriteProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showExpression?: boolean;
  animated?: boolean;
}

// Sprite expressions using CSS/emoji (in production, use Lottie/Three.js)
const EXPRESSION_CONFIG = {
  neutral: { eyes: '● ●', mouth: 'ー', mood: '😐' },
  happy: { eyes: '^ ^', mouth: '‿', mood: '😊' },
  excited: { eyes: '★ ★', mouth: 'Д', mood: '🤩' },
  proud: { eyes: '☆ ☆', mouth: '−', mood: '😎' },
  thinking: { eyes: '● ‿', mouth: '◡', mood: '🤔' },
  celebrating: { eyes: '★ ★', mouth: '∀', mood: '🎉' },
  disappointed: { eyes: '● ●', mouth: '︵', mood: '😞' },
  sleepy: { eyes: '- -', mouth: '〜', mood: '😴' }
};

const MOOD_COLORS = {
  happy: 'from-yellow-400 to-orange-400',
  focused: 'from-blue-400 to-purple-400',
  excited: 'from-pink-400 to-red-400',
  proud: 'from-purple-400 to-indigo-400',
  encouraging: 'from-green-400 to-teal-400'
};

export function LearningSprite({ size = 'md', showExpression = true, animated = true }: LearningSpriteProps) {
  const { currentStudent } = useAppStore();
  const [currentExpression, setCurrentExpression] = useState<AvatarExpression>('happy');
  const [currentMood, setCurrentMood] = useState<AvatarMood>('happy');
  
  const avatar = currentStudent?.avatar;
  const level = avatar?.level || 1;
  const expression = avatar?.expression || 'happy';
  const mood = avatar?.mood || 'happy';
  
  const sizeConfig = {
    sm: 48,
    md: 80,
    lg: 120,
    xl: 180
  };
  
  const spriteSize = sizeConfig[size];
  
  // Determine aura based on level
  const getAura = (lvl: number) => {
    if (lvl >= 50) return 'diamond';
    if (lvl >= 25) return 'gold';
    if (lvl >= 10) return 'silver';
    if (lvl >= 5) return 'bronze';
    return null;
  };
  
  const aura = getAura(level);
  
  // Aura configurations
  const auraStyles = {
    bronze: 'shadow-[0_0_20px_#CD7F32]',
    silver: 'shadow-[0_0_25px_#C0C0C0]',
    gold: 'shadow-[0_0_30px_#FFD700]',
    diamond: 'shadow-[0_0_40px_#B9F2FF]'
  };
  
  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Aura glow */}
      {aura && (
        <motion.div
          className={`absolute rounded-full ${auraStyles[aura]}`}
          style={{
            width: spriteSize + 20,
            height: spriteSize + 20,
            background: aura === 'diamond' 
              ? 'linear-gradient(135deg, #B9F2FF, #E0E0E0, #FFD700)'
              : aura === 'gold'
              ? 'linear-gradient(135deg, #FFD700, #FFA500)'
              : aura === 'silver'
              ? 'linear-gradient(135deg, #C0C0C0, #808080)'
              : 'linear-gradient(135deg, #CD7F32, #8B4513)'
          }}
          animate={animated ? {
            scale: [1, 1.05, 1],
            opacity: [0.6, 0.8, 0.6]
          } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      )}
      
      {/* Main sprite body */}
      <motion.div
        className={`
          relative rounded-full flex items-center justify-center
          bg-gradient-to-br ${MOOD_COLORS[mood]}
          ${aura ? auraStyles[aura] : 'shadow-lg'}
        `}
        style={{
          width: spriteSize,
          height: spriteSize
        }}
        animate={animated ? {
          y: [0, -5, 0],
        } : {}}
        transition={{ 
          repeat: Infinity, 
          duration: 2 + Math.random(),
          ease: 'easeInOut'
        }}
      >
        {/* Face */}
        {showExpression && (
          <div className="text-center text-white" style={{ fontSize: spriteSize * 0.4 }}>
            {/* Eyes */}
            <div className="mb-1 tracking-wider">
              {EXPRESSION_CONFIG[expression].eyes}
            </div>
            {/* Mouth */}
            <div className="tracking-widest">
              {EXPRESSION_CONFIG[expression].mouth}
            </div>
          </div>
        )}
        
        {/* Level badge */}
        <div className="absolute -bottom-1 -right-1 bg-white rounded-full px-1.5 py-0.5 text-xs font-bold text-primary shadow">
          {level}
        </div>
      </motion.div>
    </div>
  );
}
```

#### Quest Card Component

```tsx
// src/components/gamification/QuestCard.tsx

import { motion } from 'framer-motion';
import { Check, Lock, Gift, Clock } from 'lucide-react';
import { Quest, QuestProgress } from '../../db/gamification';

interface QuestCardProps {
  quest: Quest;
  progress?: QuestProgress;
  onClaim?: () => void;
}

export function QuestCard({ quest, progress, onClaim }: QuestCardProps) {
  const currentProgress = progress?.progress || 0;
  const targetProgress = quest.requirements.target;
  const percentage = Math.min((currentProgress / targetProgress) * 100, 100);
  const isComplete = progress?.isComplete || false;
  const isClaimed = progress?.claimed || false;
  
  const typeColors = {
    daily: 'bg-blue-100 border-blue-200 text-blue-700',
    weekly: 'bg-purple-100 border-purple-200 text-purple-700',
    story: 'bg-amber-100 border-amber-200 text-amber-700',
    challenge: 'bg-red-100 border-red-200 text-red-700',
    milestone: 'bg-green-100 border-green-200 text-green-700',
    social: 'bg-pink-100 border-pink-200 text-pink-700'
  };
  
  return (
    <motion.div
      className={`
        relative overflow-hidden rounded-xl border-2 p-4
        ${isComplete && !isClaimed ? 'border-primary bg-primary/5' : 'border-slate-100 bg-white'}
      `}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400 }}
    >
      {/* Type badge */}
      <div className={`absolute top-0 right-0 px-2 py-1 rounded-bl-lg text-xs font-bold ${typeColors[quest.type]}`}>
        {quest.type}
      </div>
      
      {/* Quest content */}
      <div className="pr-16">
        <h4 className="font-bold text-text-primary">{quest.title}</h4>
        <p className="text-sm text-text-secondary mt-1">{quest.description}</p>
        
        {/* Progress bar */}
        {!isClaimed && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-text-secondary mb-1">
              <span>Progress</span>
              <span>{currentProgress}/{targetProgress}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ type: 'spring', stiffness: 100 }}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Rewards */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1 text-sm">
          <span className="text-highlight font-bold">+{quest.rewards.xp}</span>
          <span className="text-xs text-text-secondary">XP</span>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <span className="text-accent font-bold">+{quest.rewards.gems}</span>
          <span className="text-xs text-text-secondary">💎</span>
        </div>
        
        {/* Claim button */}
        {isComplete && !isClaimed && onClaim && (
          <button
            onClick={onClaim}
            className="ml-auto bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1"
          >
            <Gift size={14} />
            Claim
          </button>
        )}
        
        {/* Claimed indicator */}
        {isClaimed && (
          <div className="ml-auto flex items-center gap-1 text-green-500 text-sm font-bold">
            <Check size={16} />
            Claimed
          </div>
        )}
        
        {/* Locked indicator */}
        {quest.prerequisites && quest.prerequisites.length > 0 && (
          <div className="ml-auto flex items-center gap-1 text-slate-400 text-sm">
            <Lock size={14} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
```

---

## 5. Integration Guide

### 5.1 Connecting to Existing Quiz Flow

The existing `finishQuiz` function in `useAppStore.ts` needs to be enhanced to trigger gamification events:

```typescript
// Enhanced finishQuiz action (in useAppStore.ts)

finishQuiz: () => {
  // ... existing code ...
  
  // NEW: Award XP with full calculation
  const xpResult = XP_CONFIG.calculateQuizXP({
    baseXP: currentQuiz.points || 50,
    difficulty: currentQuiz.difficulty || 'medium',
    score,
    isPerfect: score === 100,
    timeSpent,
    streakDays: currentStudent?.streak?.current || 0
  });
  
  // Add XP (triggers level up check internally)
  const leveledUp = gamificationStore.getState().addXP(
    xpResult.totalXP,
    'quiz_complete',
    currentQuiz.quizId,
    xpResult.multiplier,
    xpResult.breakdown
  );
  
  // Add gems
  gamificationStore.getState().addGems(gemsAwarded);
  
  // Update streak
  gamificationStore.getState().updateStreak();
  
  // Record daily stats
  gamificationStore.getState().recordQuizComplete(score, timeSpent);
  
  // Check achievements
  achievementStore.getState().checkAndUnlockAchievement(
    studentId,
    'quiz_count',
    totalQuizzesCompleted + 1
  );
  
  if (score === 100) {
    achievementStore.getState().checkAndUnlockAchievement(
      studentId,
      'perfect_score',
      perfectScores + 1
    );
  }
  
  if (timeSpent < 60) {
    achievementStore.getState().checkAndUnlockAchievement(
      studentId,
      'speed_run',
      timeSpent
    );
  }
  
  // Show level up modal if applicable
  if (leveledUp) {
    // Dispatch event or set state to show modal
    set({ showLevelUpModal: true });
  }
}
```

### 5.2 Page Integration

#### Adding to Home Page Header

```tsx
// In src/pages/Home.tsx - Header section

import { XPDisplay } from '../components/gamification/XPDisplay';
import { StreakCounter } from '../components/gamification/StreakCounter';
import { GemCounter } from '../components/gamification/GemCounter';

function HomeHeader() {
  return (
    <header className="flex items-center justify-between p-4">
      {/* Left: XP & Level */}
      <XPDisplay showBreakdown />
      
      {/* Center: Streak */}
      <StreakCounter showDetails />
      
      {/* Right: Gems */}
      <GemCounter />
    </header>
  );
}
```

#### Adding Quest Section

```tsx
// In src/pages/Home.tsx - Quests section

import { QuestList } from '../components/gamification/QuestList';
import { DailyGoals } from '../components/gamification/DailyGoals';

function QuestsSection() {
  return (
    <section className="p-4">
      <h2 className="text-lg font-bold mb-4">Daily Quests</h2>
      <DailyGoals />
      <QuestList />
    </section>
  );
}
```

---

## 6. Summary

This technical specification provides:

1. **Database Schema** - Enhanced IndexedDB schema with XP transactions, quests, achievements
2. **State Management** - Modular Zustand stores for gamification, quests, and achievements
3. **Component Architecture** - Reusable UI components for all gamification elements
4. **Integration Guide** - How to connect gamification to existing quiz flow

### Next Steps

- Review and approve this specification
- Begin implementation with Phase 2A (Foundation)
- Set up testing environment
- Plan user acceptance testing

---

*End of Technical Specification Part 2*  
*Related Documents:*
- *Gamification_Enhancement_Plan.md - Strategic overview*
- *Gamification_Technical_Specification.md - Part 1: Database*
