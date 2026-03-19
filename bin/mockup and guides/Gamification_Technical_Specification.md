# Study Mate - Gamification Technical Specification

**Document Version:** 1.0  
**Date:** March 10, 2026  
**Status:** Technical Design Specification  
**Target:** Phase 2 Gamification Implementation

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Database Schema Enhancement](#2-database-schema-enhancement)
3. [State Management Design](#3-state-management-design)
4. [Component Architecture](#4-component-architecture)
5. [XP System Implementation](#5-xp-system-implementation)
6. [Streak System Implementation](#6-streak-system-implementation)
7. [Avatar System Implementation](#7-avatar-system-implementation)
8. [Quest System Implementation](#8-quest-system-implementation)
9. [Achievement System Implementation](#9-achievement-system-implementation)
10. [Animation Requirements](#10-animation-requirements)
11. [API & Integration Points](#11-api--integration-points)
12. [Testing Strategy](#12-testing-strategy)

---

## 1. Architecture Overview

### 1.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        UI Layer                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ XPDisplay   │  │ StreakCounter│  │QuestCard   │              │
│  │ LevelBadge  │  │ GemCounter  │  │Achievement │              │
│  │ SpriteView  │  │ Leaderboard │  │ DailyGoals │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    State Management Layer                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              useAppStore (Zustand Store)                    ││
│  │  - Gamification State Slices                                ││
│  │  - Computed Selectors                                       ││
│  │  - Actions & Middleware                                     ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              Dexie.js (IndexedDB)                           ││
│  │  - Gamification Tables                                       ││
│  │  - Transaction Support                                      ││
│  │  - Offline Persistence                                      ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   External Services (Future)                     │
│  - Backend API Sync                                             │
│  - Leaderboard API                                              │
│  - Social Features                                              │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Design Principles

| Principle | Description |
|-----------|-------------|
| **Offline-First** | All gamification data persisted locally first, sync later |
| **Idempotent** | XP calculations must be deterministic and re-runnable |
| **Event-Sourced** | Store XP transactions, not just balances |
| **Optimistic UI** | Update UI immediately, reconcile with DB |
| **Composable** | Reusable components with clear interfaces |

---

## 2. Database Schema Enhancement

### 2.1 Current Schema (v1)

The current database has basic student profiles with XP, gems, and streak fields. We need to enhance this for Phase 2.

### 2.2 New Schema (v2)

```typescript
// src/db/gamification.ts

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
  txId: string;              // Unique transaction ID
  studentId: string;
  amount: number;            // Positive = gain, Negative = loss
  source: XPSource;          // What caused the XP
  sourceId?: string;        // Quiz ID, quest ID, etc.
  multiplier: number;        // e.g., 1.5 for streak bonus
  bonusBreakdown: {
    baseXP: number;
    streakBonus: number;
    perfectBonus: number;
    speedBonus: number;
    difficultyBonus: number;
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
 * Enhanced Student Profile with full gamification data
 */
export interface StudentProfile {
  id?: number;
  studentId: string;
  name: string;
  grade: 'SSS1' | 'SSS2' | 'SSS3';
  
  // Currency
  xp: number;
  gems: number;
  coins: number;
  
  // Level System
  level: number;
  totalXPEarned: number;
  
  // Streak System
  streak: {
    current: number;
    longest: number;
    lastActiveDate: string;  // ISO date string
    freezes: number;         // Streak freeze tokens
    gracePeriodUsed: boolean;
  };
  
  // Avatar
  avatar: AvatarState;
  
  // Progress Tracking
  completedQuizzes: string[];
  subjectsStudied: SubjectProgress[];
  totalStudyTime: number;    // minutes
  perfectScores: number;
  
  // Daily Stats (reset daily)
  dailyStats: {
    date: string;            // ISO date
    xpEarned: number;
    quizzesCompleted: number;
    studyTimeMinutes: number;
    dailyGoalComplete: boolean;
  };
  
  // Persona
  persona: LearningPersona;
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Avatar System State
 */
export interface AvatarState {
  // Identity
  baseType: 'orb' | 'creature' | 'abstract';
  colorTheme: string;
  
  // Appearance
  expression: AvatarExpression;
  aura: AvatarAura;
  accessories: string[];
  
  // Evolution
  evolutionStage: 1 | 2 | 3 | 4;
  evolutionProgress: number;  // 0-100
  
  // Animation
  idleAnimation: 'float' | 'bounce' | 'pulse' | 'wave';
  currentMood: AvatarMood;
}

export type AvatarExpression = 
  | 'neutral'
  | 'happy'
  | 'excited'
  | 'proud'
  | 'thinking'
  | 'celebrating'
  | 'disappointed'
  | 'sleepy';

export type AvatarAura = 
  | 'none'
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'rainbow';

export type AvatarMood = 
  | 'happy'
  | 'focused'
  | 'excited'
  | 'proud'
  | 'encouraging';

/**
 * Subject Progress Tracking
 */
export interface SubjectProgress {
  subject: string;
  quizzesCompleted: number;
  perfectScores: number;
  averageScore: number;
  totalStudyTime: number;
  masteredTopics: string[];
  weakTopics: string[];
  lastStudied: Date;
}

/**
 * Quest Definition
 */
export interface Quest {
  id: string;
  type: QuestType;
  title: string;
  description: string;
  
  // Requirements
  requirements: QuestRequirement;
  
  // Rewards
  rewards: {
    xp: number;
    gems: number;
    coins?: number;
    badgeId?: string;
    accessoryId?: string;
  };
  
  // Timing
  startDate?: Date;
  endDate?: Date;
  resetPeriod?: 'daily' | 'weekly' | 'monthly';
  
  // Visibility
  isVisible: boolean;
  isSecret: boolean;
  prerequisites?: string[];  // Quest IDs required before this one
}

export type QuestType = 
  | 'daily'
  | 'weekly'
  | 'story'
  | 'challenge'
  | 'milestone'
  | 'social';

export interface QuestRequirement {
  type: 'quiz_count' | 'score' | 'streak' | 'time' | 'subject' | 'custom';
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
  
  progress: number;           // Current progress value
  isComplete: boolean;
  claimed: boolean;           // Rewards claimed
  
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
  icon: string;              // Icon name or URL
  
  // Criteria
  criteria: AchievementCriteria;
  
  // Rewards
  rewards?: {
    xp?: number;
    gems?: number;
    accessoryId?: string;
  };
  
  // Display
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  isSecret: boolean;
  order: number;             // Display order
}

export type AchievementCategory = 
  | 'quiz'
  | 'streak'
  | 'social'
  | 'subject'
  | 'special'
  | 'hidden';

export interface AchievementCriteria {
  type: string;             // e.g., 'quiz_count', 'streak_days', 'perfect_score'
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
  odlokudentId: string;
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
  // Core tables
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
      // Primary indices
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

// Export singleton
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
    criteria: { type: 'speed_run', target: 60 }, // seconds
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
  
  // Subject Achievements
  {
    id: 'subject_math',
    category: 'subject',
    name: 'Math Whiz',
    description: 'Complete 20 Math quizzes',
    icon: 'calculator',
    criteria: { type: 'subject_quiz_count', target: 20, subject: 'Mathematics' },
    rewards: { xp: 100, gems: 20 },
    rarity: 'common',
    isSecret: false,
    order: 20
  },
  {
    id: 'subject_english',
    category: 'subject',
    name: 'Word Smith',
    description: 'Complete 20 English quizzes',
    icon: 'book',
    criteria: { type: 'subject_quiz_count', target: 20, subject: 'English' },
    rewards: { xp: 100, gems: 20 },
    rarity: 'common',
    isSecret: false,
    order: 21
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
  },
  
  // Hidden Achievements
  {
    id: 'night_owl',
    category: 'hidden',
    name: 'Night Owl',
    description: 'Complete a quiz after midnight',
    icon: 'moon',
    criteria: { type: 'time_based', target: 1, metadata: { hour: 0 } },
    rewards: { xp: 50, gems: 10 },
    rarity: 'rare',
    isSecret: true,
    order: 40
  },
  {
    id: 'early_bird',
    category: 'hidden',
    name: 'Early Bird',
    description: 'Complete a quiz before 6 AM',
    icon: 'sunrise',
    criteria: { type: 'time_based', target: 1, metadata: { hour: 6 } },
    rewards: { xp: 50, gems: 10 },
    rarity: 'rare',
    isSecret: true,
    order: 41
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
  },
  
  // Story Quests
  {
    id: 'story_math_1',
    type: 'story',
    title: 'Math Journey: Algebra',
    description: 'Complete 10 Mathematics quizzes',
    requirements: { type: 'subject_quiz_count', target: 10, subject: 'Mathematics' },
    rewards: { xp: 200, gems: 30 },
    prerequisites: [],
    isVisible: true,
    isSecret: false
  },
  {
    id: 'story_english_1',
    type: 'story',
    title: 'English Journey: Grammar',
    description: 'Complete 10 English quizzes',
    requirements: { type: 'subject_quiz_count', target: 10, subject: 'English' },
    rewards: { xp: 200, gems: 30 },
    prerequisites: [],
    isVisible: true,
    isSecret: false
  }
];

// =======================
// AVATAR ACCESSORIES
// =======================

export const AVATAR_ACCESSORIES = [
  { id: 'study_cap', name: 'Study Cap', category: 'head', rarity: 'common', unlockCriteria: { type: 'quiz_count', target: 10 } },
  { id: 'glasses', name: 'Smart Glasses', category: 'face', rarity: 'common', unlockCriteria: { type: 'perfect_score', target: 5 } },
  { id: 'cape_blue', name: 'Blue Cape', category: 'back', rarity: 'uncommon', unlockCriteria: { type: 'streak_days', target: 14 } },
  { id: 'cape_gold', name: 'Gold Cape', category: 'back', rarity: 'rare', unlockCriteria: { type: 'streak_days', target: 30 } },
  { id: 'crown', name: 'Royal Crown', category: 'head', rarity: 'epic', unlockCriteria: { type: 'level_reach', target: 25 } },
  { id: 'wings', name: 'Angel Wings', category: 'back', rarity: 'legendary', unlockCriteria: { type: 'referral', target: 1 } },
  { id: 'shield', name: 'Hero Shield', category: 'hand', rarity: 'rare', unlockCriteria: { type: 'subject_mastery', target: 1 } },
  { id: 'aura_gold', name: 'Golden Aura', category: 'aura', rarity: 'rare', unlockCriteria: { type: 'achievement_count', target: 10 } },
  { id: 'aura_diamond', name: 'Diamond Aura', category: 'aura', rarity: 'legendary', unlockCriteria: { type: 'achievement_count', target: 25 } }
];

// =======================
// LEVEL CONFIGURATION
// =======================

export const LEVEL_CONFIG = {
  // XP required for each level: level^2 * 100
  // Level 1 = 100 XP, Level 2 = 400 XP, Level 10 = 10,000 XP
  xpForLevel: (level: number) => Math.pow(level, 2) * 100,
  
  // Level titles
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
  // Base XP rewards
  baseXP: {
    quizComplete: 50,
    quizPerfect: 50,        // Bonus for perfect score
    dailyGoal: 25,
    weeklyGoal: 100,
    streakBonus: 10,        // Per day of streak
    subjectMastery: 100,
    achievement: 25,
    questComplete: 50
  },
  
  // Multipliers
  multipliers: {
    difficulty: {
      easy: 1.0,
      medium: 1.5,
      hard: 2.0,
      adaptive: 1.25
    },
    streak: {
      max: 2.0,             // Max 2x at 10+ day streak
      increment: 0.1        // +0.1x per streak day
    }
  },
  
  // Streak milestones with bonus rewards
  streakMilestones: {
    7: { xpBonus: 50, gemsBonus: 10 },
    14: { xpBonus: 100, gemsBonus: 20 },
    30: { xpBonus: 250, gemsBonus: 50 },
    60: { xpBonus: 500, gemsBonus: 100 },
    100: { xpBonus: 1000, gemsBonus: 200 },
    365: { xpBonus: 5000, gemsBonus: 500 }
  },
  
  // Calculate XP for a quiz
  calculateQuizXP: (params: {
    baseXP: number;
    difficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
    score: number;
    isPerfect: boolean;
    timeSpent: number;       // seconds
    streakDays: number;
  }): { totalXP: number; breakdown: any } => {
    const { baseXP, difficulty, score, isPerfect, timeSpent, streakDays } = params;
    
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
    const avgTimePerQuestion = timeSpent / 5; // Assuming 5 questions
    if (avgTimePerQuestion < 12) { // 12 seconds per question
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
  // Initialize achievement definitions
  const existingAchievements = await gamificationDB.achievements.count();
  if (existingAchievements === 0) {
    await gamificationDB.achievements.bulkAdd(ACHIEVEMENTS);
  }
  
  // Initialize quest definitions
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
  bonusBreakdown?: any
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
  // Check if already earned
  const existing = await gamificationDB.earnedAchievements
    .where('studentId')
    .equals(studentId)
    .and(e => e.achievementId === achievementId)
    .first();
  
  if (existing) return null;
  
  // Get achievement definition
  const achievement = await gamificationDB.achievements
    .where('id')
    .equals(achievementId)
    .first();
  
  if (!achievement) return null;
  
  // Record earned achievement
  await gamificationDB.earnedAchievements.add({
    achievementId,
    studentId,
    earnedAt: new Date(),
    synced: false
  });
  
  return achievement;
}
