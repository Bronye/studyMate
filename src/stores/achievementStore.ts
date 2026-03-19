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
  
  // Stats tracking
  stats: {
    totalQuizzes: number;
    perfectScores: number;
    totalStudyTime: number;
  };
  
  // Actions
  loadAchievements: () => Promise<void>;
  checkAndUnlockAchievement: (studentId: string, criteriaType: string, value: number, subject?: string) => Promise<Achievement | null>;
  markAchievementViewed: (achievementId: string) => void;
  clearNewAchievements: () => void;
  updateStats: (updates: Partial<AchievementState['stats']>) => void;
  
  // Computed
  getAchievementsByCategory: (category: string) => Achievement[];
  getEarnedAchievementIds: () => string[];
  isAchievementEarned: (achievementId: string) => boolean;
  getAchievementProgress: (achievementId: string) => number;
}

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      achievements: ACHIEVEMENTS,
      earnedAchievements: [],
      newAchievements: [],
      stats: {
        totalQuizzes: 0,
        perfectScores: 0,
        totalStudyTime: 0
      },
      
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
      
      updateStats: (updates) => {
        set((state) => ({
          stats: { ...state.stats, ...updates }
        }));
      },
      
      getAchievementsByCategory: (category) => {
        return get().achievements.filter(a => a.category === category);
      },
      
      getEarnedAchievementIds: () => {
        return get().earnedAchievements.map(e => e.achievementId);
      },
      
      isAchievementEarned: (achievementId) => {
        return get().getEarnedAchievementIds().includes(achievementId);
      },
      
      getAchievementProgress: (achievementId) => {
        const achievement = get().achievements.find(a => a.id === achievementId);
        if (!achievement) return 0;
        
        const stats = get().stats;
        const criteriaType = achievement.criteria.type;
        
        let currentValue = 0;
        switch (criteriaType) {
          case 'quiz_count':
            currentValue = stats.totalQuizzes;
            break;
          case 'perfect_score':
            currentValue = stats.perfectScores;
            break;
          case 'speed_run':
            currentValue = stats.totalStudyTime > 0 ? 60 : 999; // Simplified
            break;
          default:
            currentValue = 0;
        }
        
        return Math.min((currentValue / achievement.criteria.target) * 100, 100);
      }
    }),
    {
      name: 'study-mate-achievements',
      storage: createJSONStorage(() => localStorage)
    }
  )
);

// Helper hook
export const useAchievements = () => {
  const {
    achievements,
    earnedAchievements,
    newAchievements,
    stats,
    loadAchievements,
    checkAndUnlockAchievement,
    markAchievementViewed,
    clearNewAchievements,
    updateStats,
    getAchievementsByCategory,
    getEarnedAchievementIds,
    isAchievementEarned,
    getAchievementProgress
  } = useAchievementStore();
  
  const earnedCount = earnedAchievements.length;
  const totalCount = achievements.length;
  
  return {
    achievements,
    earnedAchievements,
    newAchievements,
    stats,
    earnedCount,
    totalCount,
    loadAchievements,
    checkAndUnlockAchievement,
    markAchievementViewed,
    clearNewAchievements,
    updateStats,
    getAchievementsByCategory,
    getEarnedAchievementIds,
    isAchievementEarned,
    getAchievementProgress
  };
};
