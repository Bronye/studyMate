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
  getActiveQuests: () => QuestProgress[];
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

// Helper hook for easy access
export const useQuests = () => {
  const {
    availableQuests,
    activeQuests,
    completedQuestsToday,
    loadQuests,
    startQuest,
    updateQuestProgress,
    completeQuest,
    claimReward,
    getDailyQuests,
    getWeeklyQuests
  } = useQuestStore();
  
  const dailyQuests = getDailyQuests();
  const weeklyQuests = getWeeklyQuests();
  
  return {
    availableQuests,
    activeQuests,
    completedQuestsToday,
    dailyQuests,
    weeklyQuests,
    loadQuests,
    startQuest,
    updateQuestProgress,
    completeQuest,
    claimReward
  };
};
