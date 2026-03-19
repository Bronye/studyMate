import Dexie, { Table } from 'dexie';

// =======================
// TYPE DEFINITIONS
// =======================

/**
 * XP Transaction - Immutable record of all XP gains/losses
 * Used for audit trail and analytics
 */
export interface XPTransaction {
  id?: number;
  txId: string;
  studentId: string;
  amount: number;
  source: XPSource;
  sourceId?: string;
  multiplier: number;
  bonusBreakdown: {
    baseXP: number;
    streakBonus?: number;
    perfectBonus?: number;
    speedBonus?: number;
    difficultyBonus?: number;
  };
  timestamp: Date;
  synced: boolean;
}

export type XPSource = 
  | 'quiz_complete'
  | 'quiz_perfect'
  | 'quiz_speed'
  | 'daily_login'
  | 'streak_milestone'
  | 'quest_complete'
  | 'achievement_unlock'
  | 'daily_goal'
  | 'weekly_goal'
  | 'level_up'
  | 'subject_mastery'
  | 'admin_adjustment';

/**
 * Quest Definition
 */
export interface Quest {
  id: string;
  type: QuestType;
  title: string;
  description: string;
  requirements: QuestRequirement;
  rewards: {
    xp: number;
    gems: number;
    coins?: number;
    badgeId?: string;
    accessoryId?: string;
  };
  startDate?: Date;
  endDate?: Date;
  resetPeriod?: 'daily' | 'weekly' | 'monthly';
  isVisible: boolean;
  isSecret: boolean;
  prerequisites?: string[];
}

export type QuestType = 
  | 'daily'
  | 'weekly'
  | 'story'
  | 'challenge'
  | 'milestone'
  | 'social';

export interface QuestRequirement {
  type: 'quiz_count' | 'perfect_score' | 'speed_run' | 'streak_days' | 'score' | 'streak' | 'time' | 'subject' | 'level_reach' | 'custom';
  target: number;
  subject?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Quest Progress
 */
export interface QuestProgress {
  id?: number;
  questId: string;
  studentId: string;
  progress: number;
  isComplete: boolean;
  claimed: boolean;
  startedAt: Date;
  completedAt?: Date;
}

/**
 * Achievement/Badge Definition
 */
export interface Achievement {
  id: string;
  category: AchievementCategory;
  name: string;
  description: string;
  icon: string;
  criteria: AchievementCriteria;
  rewards?: {
    xp?: number;
    gems?: number;
    accessoryId?: string;
  };
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  isSecret: boolean;
  order: number;
}

export type AchievementCategory = 
  | 'quiz'
  | 'streak'
  | 'social'
  | 'subject'
  | 'special'
  | 'hidden';

export interface AchievementCriteria {
  type: 'quiz_count' | 'perfect_score' | 'speed_run' | 'streak_days' | 'score' | 'streak' | 'time' | 'subject' | 'level_reach' | 'subject_quiz_count' | 'achievement_count' | 'referral' | 'custom';
  target: number;
  subject?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Earned Achievement
 */
export interface EarnedAchievement {
  id?: number;
  achievementId: string;
  studentId: string;
  earnedAt: Date;
  synced: boolean;
}

/**
 * Leaderboard Entry
 */
export interface LeaderboardEntry {
  id?: number;
  studentId: string;
  displayName: string;
  avatarType: string;
  level: number;
  xp: number;
  streak: number;
  rank: number;
  lastUpdated: Date;
}

/**
 * Friend Connection
 */
export interface Friend {
  id?: number;
  studentId: string;
  friendId: string;
  friendName: string;
  friendAvatar: string;
  addedAt: Date;
  lastActive?: Date;
}

// =======================
// DATABASE CLASS
// =======================

export class GamificationDB extends Dexie {
  xpTransactions!: Table<XPTransaction>;
  questDefinitions!: Table<Quest>;
  questProgress!: Table<QuestProgress>;
  achievements!: Table<Achievement>;
  earnedAchievements!: Table<EarnedAchievement>;
  leaderboard!: Table<LeaderboardEntry>;
  friends!: Table<Friend>;

  constructor() {
    super('StudyMateGamification');
    
    this.version(1).stores({
      xpTransactions: '++id, txId, studentId, source, timestamp, synced',
      questDefinitions: '++id, id, type, isVisible',
      questProgress: '++id, questId, studentId, isComplete, claimed',
      achievements: '++id, id, category, rarity',
      earnedAchievements: '++id, achievementId, studentId, earnedAt',
      leaderboard: '++id, studentId, rank',
      friends: '++id, studentId, friendId, addedAt'
    });
  }
}

export const gamificationDB = new GamificationDB();

// =======================
// ACHIEVEMENT DEFINITIONS
// =======================

export const ACHIEVEMENTS: Achievement[] = [
  // Quiz Achievements
  {
    id: 'first_quiz',
    category: 'quiz',
    name: 'First Steps',
    description: 'Complete your first quiz',
    icon: 'trophy',
    criteria: { type: 'quiz_count', target: 1 },
    rewards: { xp: 25, gems: 5 },
    rarity: 'common',
    isSecret: false,
    order: 1
  },
  {
    id: 'quiz_10',
    category: 'quiz',
    name: 'Quiz Pro',
    description: 'Complete 10 quizzes',
    icon: 'medal',
    criteria: { type: 'quiz_count', target: 10 },
    rewards: { xp: 50, gems: 10 },
    rarity: 'common',
    isSecret: false,
    order: 2
  },
  {
    id: 'quiz_50',
    category: 'quiz',
    name: 'Quiz Master',
    description: 'Complete 50 quizzes',
    icon: 'award',
    criteria: { type: 'quiz_count', target: 50 },
    rewards: { xp: 150, gems: 30 },
    rarity: 'uncommon',
    isSecret: false,
    order: 3
  },
  {
    id: 'quiz_100',
    category: 'quiz',
    name: 'Quiz Legend',
    description: 'Complete 100 quizzes',
    icon: 'crown',
    criteria: { type: 'quiz_count', target: 100 },
    rewards: { xp: 300, gems: 75 },
    rarity: 'rare',
    isSecret: false,
    order: 4
  },
  {
    id: 'perfect_first',
    category: 'quiz',
    name: 'Perfect Start!',
    description: 'Get your first 100% on a quiz',
    icon: 'star',
    criteria: { type: 'perfect_score', target: 1 },
    rewards: { xp: 50, gems: 15 },
    rarity: 'common',
    isSecret: false,
    order: 5
  },
  {
    id: 'perfect_10',
    category: 'quiz',
    name: 'Perfectionist',
    description: 'Get 10 perfect scores',
    icon: 'sparkles',
    criteria: { type: 'perfect_score', target: 10 },
    rewards: { xp: 150, gems: 30 },
    rarity: 'uncommon',
    isSecret: false,
    order: 6
  },
  {
    id: 'speed_demon',
    category: 'quiz',
    name: 'Speed Demon',
    description: 'Complete a quiz in under 1 minute',
    icon: 'zap',
    criteria: { type: 'speed_run', target: 60 },
    rewards: { xp: 50, gems: 10 },
    rarity: 'uncommon',
    isSecret: false,
    order: 7
  },
  
  // Streak Achievements
  {
    id: 'streak_3',
    category: 'streak',
    name: 'Streak Starter',
    description: 'Maintain a 3-day streak',
    icon: 'flame',
    criteria: { type: 'streak_days', target: 3 },
    rewards: { xp: 30, gems: 5 },
    rarity: 'common',
    isSecret: false,
    order: 10
  },
  {
    id: 'streak_7',
    category: 'streak',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: 'flame',
    criteria: { type: 'streak_days', target: 7 },
    rewards: { xp: 75, gems: 15 },
    rarity: 'common',
    isSecret: false,
    order: 11
  },
  {
    id: 'streak_14',
    category: 'streak',
    name: 'Fortnight Fighter',
    description: 'Maintain a 14-day streak',
    icon: 'flame',
    criteria: { type: 'streak_days', target: 14 },
    rewards: { xp: 150, gems: 30 },
    rarity: 'uncommon',
    isSecret: false,
    order: 12
  },
  {
    id: 'streak_30',
    category: 'streak',
    name: 'Month Master',
    description: 'Maintain a 30-day streak',
    icon: 'flame',
    criteria: { type: 'streak_days', target: 30 },
    rewards: { xp: 300, gems: 50 },
    rarity: 'rare',
    isSecret: false,
    order: 13
  },
  {
    id: 'streak_100',
    category: 'streak',
    name: 'Century Champion',
    description: 'Maintain a 100-day streak',
    icon: 'flame',
    criteria: { type: 'streak_days', target: 100 },
    rewards: { xp: 1000, gems: 200 },
    rarity: 'epic',
    isSecret: false,
    order: 14
  },
  {
    id: 'streak_365',
    category: 'streak',
    name: 'Year Legend',
    description: 'Maintain a 365-day streak',
    icon: 'crown',
    criteria: { type: 'streak_days', target: 365 },
    rewards: { xp: 5000, gems: 500 },
    rarity: 'legendary',
    isSecret: false,
    order: 15
  },
  
  // Level Achievements
  {
    id: 'level_5',
    category: 'special',
    name: 'Rising Star',
    description: 'Reach Level 5',
    icon: 'arrow-up',
    criteria: { type: 'level_reach', target: 5 },
    rewards: { xp: 100, gems: 25 },
    rarity: 'common',
    isSecret: false,
    order: 30
  },
  {
    id: 'level_10',
    category: 'special',
    name: 'Scholar',
    description: 'Reach Level 10',
    icon: 'graduation-cap',
    criteria: { type: 'level_reach', target: 10 },
    rewards: { xp: 250, gems: 50 },
    rarity: 'uncommon',
    isSecret: false,
    order: 31
  },
  {
    id: 'level_25',
    category: 'special',
    name: 'Master',
    description: 'Reach Level 25',
    icon: 'crown',
    criteria: { type: 'level_reach', target: 25 },
    rewards: { xp: 500, gems: 100 },
    rarity: 'rare',
    isSecret: false,
    order: 32
  }
];

// =======================
// QUEST DEFINITIONS
// =======================

export const QUESTS: Quest[] = [
  // Daily Quests
  {
    id: 'daily_quiz_1',
    type: 'daily',
    title: 'Daily Grind',
    description: 'Complete 1 quiz today',
    requirements: { type: 'quiz_count', target: 1 },
    rewards: { xp: 50, gems: 5 },
    isVisible: true,
    isSecret: false
  },
  {
    id: 'daily_quiz_3',
    type: 'daily',
    title: 'Quiz Champion',
    description: 'Complete 3 quizzes today',
    requirements: { type: 'quiz_count', target: 3 },
    rewards: { xp: 100, gems: 15 },
    isVisible: true,
    isSecret: false
  },
  {
    id: 'daily_perfect',
    type: 'daily',
    title: 'Perfect Day',
    description: 'Get 100% on a quiz today',
    requirements: { type: 'perfect_score', target: 1 },
    rewards: { xp: 75, gems: 10 },
    isVisible: true,
    isSecret: false
  },
  {
    id: 'daily_speed',
    type: 'daily',
    title: 'Speed Demon',
    description: 'Complete a quiz in under 2 minutes',
    requirements: { type: 'speed_run', target: 120 },
    rewards: { xp: 50, gems: 10 },
    isVisible: true,
    isSecret: false
  },
  {
    id: 'daily_study_time',
    type: 'daily',
    title: 'Dedicated Learner',
    description: 'Study for 10 minutes today',
    requirements: { type: 'time', target: 10 },
    rewards: { xp: 30, gems: 5 },
    isVisible: true,
    isSecret: false
  },
  
  // Weekly Quests
  {
    id: 'weekly_streak',
    type: 'weekly',
    title: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    requirements: { type: 'streak_days', target: 7 },
    rewards: { xp: 200, gems: 30 },
    isVisible: true,
    isSecret: false
  },
  {
    id: 'weekly_quizzes',
    type: 'weekly',
    title: 'Quiz Week',
    description: 'Complete 20 quizzes this week',
    requirements: { type: 'quiz_count', target: 20 },
    rewards: { xp: 300, gems: 50 },
    isVisible: true,
    isSecret: false
  },
  {
    id: 'weekly_perfect',
    type: 'weekly',
    title: 'Perfection Week',
    description: 'Get 5 perfect scores this week',
    requirements: { type: 'perfect_score', target: 5 },
    rewards: { xp: 250, gems: 40 },
    isVisible: true,
    isSecret: false
  }
];

// =======================
// LEVEL CONFIGURATION
// =======================

export const LEVEL_CONFIG = {
  xpForLevel: (level: number) => Math.pow(level, 2) * 100,
  
  titles: [
    { level: 1, title: 'Novice' },
    { level: 2, title: 'Apprentice' },
    { level: 3, title: 'Student' },
    { level: 4, title: 'Scholar' },
    { level: 5, title: 'Expert' },
    { level: 6, title: 'Master' },
    { level: 7, title: 'Grandmaster' },
    { level: 8, title: 'Virtuoso' },
    { level: 9, title: 'Sage' },
    { level: 10, title: 'Legend' },
    { level: 15, title: 'Mythic' },
    { level: 20, title: 'Titan' },
    { level: 30, title: 'Demigod' },
    { level: 50, title: 'Godlike' },
    { level: 100, title: 'Omniscient' }
  ],
  
  getTitle: (level: number) => {
    const titles = LEVEL_CONFIG.titles;
    for (let i = titles.length - 1; i >= 0; i--) {
      if (level >= titles[i].level) {
        return titles[i].title;
      }
    }
    return 'Novice';
  }
};

// =======================
// XP CONFIGURATION
// =======================

export const XP_CONFIG = {
  baseXP: {
    quizComplete: 50,
    quizPerfect: 50,
    dailyGoal: 25,
    weeklyGoal: 100,
    streakBonus: 10,
    subjectMastery: 100,
    achievement: 25,
    questComplete: 50
  },
  
  multipliers: {
    difficulty: {
      easy: 1.0,
      medium: 1.5,
      hard: 2.0,
      adaptive: 1.25
    },
    streak: {
      max: 2.0,
      increment: 0.1
    }
  },
  
  streakMilestones: {
    7: { xpBonus: 50, gemsBonus: 10 },
    14: { xpBonus: 100, gemsBonus: 20 },
    30: { xpBonus: 250, gemsBonus: 50 },
    60: { xpBonus: 500, gemsBonus: 100 },
    100: { xpBonus: 1000, gemsBonus: 200 },
    365: { xpBonus: 5000, gemsBonus: 500 }
  } as Record<number, { xpBonus: number; gemsBonus: number }>,
  
  calculateQuizXP: (params: {
    baseXP: number;
    difficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
    score: number;
    isPerfect: boolean;
    timeSpent: number;
    streakDays: number;
  }): { totalXP: number; breakdown: { baseXP: number; difficultyBonus: number; perfectBonus: number; speedBonus: number; streakBonus: number } } => {
    const { baseXP, difficulty, isPerfect, timeSpent, streakDays } = params;
    
    let totalXP = baseXP;
    const breakdown = {
      baseXP: baseXP,
      difficultyBonus: 0,
      perfectBonus: 0,
      speedBonus: 0,
      streakBonus: 0
    };
    
    // Difficulty multiplier
    const diffMult = XP_CONFIG.multipliers.difficulty[difficulty];
    breakdown.difficultyBonus = Math.round(baseXP * (diffMult - 1));
    totalXP += breakdown.difficultyBonus;
    
    // Perfect score bonus
    if (isPerfect) {
      breakdown.perfectBonus = XP_CONFIG.baseXP.quizPerfect;
      totalXP += breakdown.perfectBonus;
    }
    
    // Speed bonus (if completed in under 60 seconds per question)
    if (timeSpent < 60) {
      breakdown.speedBonus = 10;
      totalXP += breakdown.speedBonus;
    }
    
    // Streak multiplier
    const streakMult = Math.min(
      XP_CONFIG.multipliers.streak.max,
      1 + (streakDays * XP_CONFIG.multipliers.streak.increment)
    );
    breakdown.streakBonus = Math.round(totalXP * (streakMult - 1));
    totalXP += breakdown.streakBonus;
    
    return { totalXP, breakdown };
  }
};

// =======================
// DATABASE HELPERS
// =======================

export async function initializeGamificationData(): Promise<void> {
  const existingAchievements = await gamificationDB.achievements.count();
  if (existingAchievements === 0) {
    await gamificationDB.achievements.bulkAdd(ACHIEVEMENTS);
  }
  
  const existingQuests = await gamificationDB.questDefinitions.count();
  if (existingQuests === 0) {
    await gamificationDB.questDefinitions.bulkAdd(QUESTS);
  }
}

export async function recordXPTransaction(
  studentId: string,
  amount: number,
  source: XPSource,
  sourceId?: string,
  multiplier: number = 1,
  bonusBreakdown?: { baseXP: number; difficultyBonus?: number; perfectBonus?: number; speedBonus?: number; streakBonus?: number }
): Promise<number> {
  const transaction: XPTransaction = {
    txId: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    studentId,
    amount,
    source,
    sourceId,
    multiplier,
    bonusBreakdown: bonusBreakdown || { baseXP: amount },
    timestamp: new Date(),
    synced: false
  };
  
  return await gamificationDB.xpTransactions.add(transaction);
}

export async function getXPHistory(studentId: string, limit: number = 50): Promise<XPTransaction[]> {
  return await gamificationDB.xpTransactions
    .where('studentId')
    .equals(studentId)
    .reverse()
    .sortBy('timestamp');
}

export async function getQuestProgress(studentId: string): Promise<QuestProgress[]> {
  return await gamificationDB.questProgress
    .where('studentId')
    .equals(studentId)
    .toArray();
}

export async function getEarnedAchievements(studentId: string): Promise<EarnedAchievement[]> {
  return await gamificationDB.earnedAchievements
    .where('studentId')
    .equals(studentId)
    .toArray();
}

export async function unlockAchievement(studentId: string, achievementId: string): Promise<Achievement | null> {
  const existing = await gamificationDB.earnedAchievements
    .where('studentId')
    .equals(studentId)
    .and(e => e.achievementId === achievementId)
    .first();
  
  if (existing) return null;
  
  const achievement = await gamificationDB.achievements
    .where('id')
    .equals(achievementId)
    .first();
  
  if (!achievement) return null;
  
  await gamificationDB.earnedAchievements.add({
    achievementId,
    studentId,
    earnedAt: new Date(),
    synced: false
  });
  
  return achievement;
}
