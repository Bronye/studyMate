# StudyMate MVP - Consolidated Project Roadmap

> **Last Updated:** March 13, 2026  
> **Version:** 1.0  
> **Status:** Active Development

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technical Architecture](#2-technical-architecture)
3. [Features Status](#3-features-status)
4. [Development Phases](#4-development-phases)
5. [Key Components](#5-key-components)
6. [Implementation Priorities](#6-implementation-priorities)
7. [Database Schema](#7-database-schema)
8. [API Integration](#8-api-integration)
9. [Testing Strategy](#9-testing-strategy)
10. [Next Steps](#10-next-steps)

---

## 1. Project Overview

### Mission Statement
Transform the Nigerian curriculum from a "chore" into a "quest" using AI-driven personalization and offline-first accessibility.

### Target Audience
- **Primary:** SSS 1-3 Nigerian secondary school students
- **Focus:** 2025/26 NERDC streamlined subjects (English, Maths, Trade, Citizenship & Heritage, Digital Tech)

### Core Philosophy
- **Tone:** Supportive, Gamified (Duolingo-style), and Predictive
- **Visual Identity:** "Naija-Modern" - High-saturation accents (Emerald, Violet, Coral) on neutral bases
- **UX Principle:** The "Anti-Menu" - No sidebars, use vertical "Quest Map" for curriculum

### Tech Stack
| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18 + Vite | UI development, PWA foundation |
| Styling | Tailwind CSS | Rapid responsive styling |
| Animations | Framer Motion | Smooth transitions & loading states |
| Local Database | IndexedDB (Dexie.js) | Offline data persistence |
| AI/OCR | Google Gemini 2.5 Flash + Cloud Vision | Text extraction & quiz generation |
| State Management | Zustand | Lightweight reactive state |
| PWA | Workbox | Service worker & offline caching |
| HTTP Client | Axios | API communication |

---

## 2. Technical Architecture

### System Architecture Overview

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
│                   External Services                              │
│  - Gemini 2.5 Flash API (Quiz Generation)                      │
│  - Google Cloud Vision (OCR)                                    │
│  - Backend API (Future - Supabase)                              │
└─────────────────────────────────────────────────────────────────┘
```

### Offline-First Strategy

**Sync Priority Logic:**
1. **Priority 1:** Sync Psychometric DNA first
2. **Priority 2:** Download 5 quizzes based on student's weakest curriculum topics
3. **Priority 3:** Queue offline "Level Ups" or "XP gains" for sync

---

## 3. Features Status

### ✅ Implemented Features

| Feature | Status | Notes |
|---------|--------|-------|
| Psychometric Profile Engine | ✅ Complete | Learning persona with visual/auditory/kinesthetic styles |
| Gamification System | ✅ Complete | XP, streaks, gems, achievements, quests |
| Quiz Engine (CBT) | ✅ Complete | Hints, timers, offline support |
| Database Layer | ✅ Complete | Full IndexedDB schema with sync queue |
| OCR Service | ✅ Complete | `src/services/ocr.ts` |
| Quiz Generator Service | ✅ Complete | `src/services/quizGenerator.ts` |
| NoteUpload Store | ✅ Complete | `src/stores/noteUploadStore.ts` |
| Responsive Layout | ✅ Complete | Mobile + Desktop breakpoints |
| Onboarding | ✅ Complete | Progress indicator included |
| Empty States | ✅ Complete | Home page has empty state UI |
| Hint System | ✅ Complete | 3 hint tokens, bonus on ≥70% score |

### ⚠️ In Progress / Partial Implementation

| Feature | Status | Notes |
|---------|--------|-------|
| NoteUpload Page UI | ⚠️ Partial | Services created, full UI integration needed |
| Desktop Navigation | ⚠️ Partial | FABs hide on desktop, need top nav |

### 📋 Future Features

| Feature | Status | Notes |
|---------|--------|-------|
| Backend API Integration | 📋 Future | Supabase + FastAPI |
| Teacher Portal Hook | 📋 Future | Database ready for analytics |
| Multi-language Support | 📋 Future | IB/UK curriculum swap capability |
| Social Features | 📋 Future | Leaderboards, friends |

---

## 4. Development Phases

### Phase 1: Foundation (✅ Complete)
- [x] Dexie.js database schema
- [x] Core UI components
- [x] Basic gamification
- [x] Quiz engine with offline support
- [x] Responsive breakpoints

### Phase 2: Note-to-Quiz Bridge (Current)
- [x] OCR Service (`src/services/ocr.ts`)
- [x] Quiz Generator Service (`src/services/quizGenerator.ts`)
- [x] NoteUpload Store (`src/stores/noteUploadStore.ts`)
- [ ] NoteUpload Page integration
- [ ] "Partial Success" UI for low confidence OCR
- [ ] Integration testing

### Phase 3: Backend Integration (Planned)
- [ ] Supabase setup
- [ ] API endpoints for quiz delivery
- [ ] User authentication
- [ ] Cloud sync

---

## 5. Key Components

### Pages
| Component | Path | Purpose |
|-----------|------|---------|
| Home | `src/pages/Home.tsx` | Quest hub, quiz list, stats |
| Onboarding | `src/pages/Onboarding.tsx` | Student profile setup |
| NoteUpload | `src/pages/NoteUpload.tsx` | Snap-to-Study feature |
| Quiz | `src/pages/Quiz.tsx` | CBT quiz interface |
| Profile | `src/pages/Profile.tsx` | Student profile & settings |

### Services
| Service | Path | Purpose |
|---------|------|---------|
| OCR | `src/services/ocr.ts` | Google Cloud Vision integration |
| Quiz Generator | `src/services/quizGenerator.ts` | Gemini API quiz generation |

### Stores
| Store | Path | Purpose |
|-------|------|---------|
| useAppStore | `src/stores/useAppStore.ts` | Main app state |
| gamificationStore | `src/stores/gamificationStore.ts` | XP, streaks, achievements |
| noteUploadStore | `src/stores/noteUploadStore.ts` | Note processing state |
| achievementStore | `src/stores/achievementStore.ts` | Badge tracking |
| questStore | `src/stores/questStore.ts` | Quest progress |

### Database
| File | Path | Purpose |
|------|------|---------|
| Database | `src/db/database.ts` | Core IndexedDB schema |
| Gamification | `src/db/gamification.ts` | Extended gamification tables |

---

## 6. Implementation Priorities

### Quick Wins (Done ✅)
1. ✅ Responsive breakpoints - Mobile + Desktop
2. ✅ Onboarding progress indicator
3. ✅ Empty states
4. ✅ FABs centered on all screens

### Key Strengths to Maintain
1. Psychometric personalization
2. Note-to-Quiz pipeline (Phase 2)
3. Offline-first architecture
4. Rich gamification animations

### Strategic Investments (Phase 2+)
1. Desktop navigation (Option B - Top Nav)
2. Sound effects for gamification
3. Haptic feedback
4. Enhanced avatar animations

---

## 7. Database Schema

### Core Tables (Dexie.js)

```typescript
// Student Profile
interface StudentProfile {
  id?: number;
  studentId: string;
  name: string;
  grade: 'SSS1' | 'SSS2' | 'SSS3';
  xp: number;
  gems: number;
  streak: number;
  completedQuizzes: string[];
  avatar: AvatarState;
  persona: LearningPersona;
  createdAt: Date;
  updatedAt: Date;
}

// Quiz
interface Quiz {
  id?: number;
  quizId: string;
  subject: string;
  topic: string;
  grade: string;
  questions: Question[];
  difficulty: 'easy' | 'medium' | 'hard';
  source: 'curriculum' | 'note_upload';
  syncedAt?: Date;
  expiresAt: Date;
}

// Question
interface Question {
  id: string;
  text: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation: string;
  hint?: string;
  cognitiveLevel: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate';
}

// Quiz Attempt
interface QuizAttempt {
  id?: number;
  attemptId: string;
  quizId: string;
  studentId: string;
  answers: { questionId: string; selectedOptionId: string; isCorrect: boolean }[];
  score: number;
  totalQuestions: number;
  timeSpent: number;
  completedAt: Date;
  synced: boolean;
  syncedAt?: Date;
}

// Sync Queue
interface SyncQueue {
  id?: number;
  id: string;
  action: 'quiz_attempt' | 'profile_update';
  payload: any;
  createdAt: Date;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed';
}
```

---

## 8. API Integration

### OCR Pipeline
```
User Upload → Google Cloud Vision → Text Extraction → Gemini 2.5 Flash → Quiz JSON
```

### Persona Context Injection
Every AI prompt includes:
```
SYSTEM: Acting as a {personaType} mentor for a {cognitiveProfile} student
Tone: {eqBaseline}
- Processing Speed: {processingSpeed}/10
- Memory Type: {memoryStrength}
- Attention Span: {attentionSpan} minutes
```

---

## 9. Testing Strategy

### Manual Testing Checklist

#### Note-to-Quiz Pipeline
- [ ] Upload image → OCR extracts text
- [ ] OCR with low confidence → Partial success UI shows
- [ ] User confirms unclear regions → Quiz generates correctly
- [ ] Quiz saves to IndexedDB
- [ ] Navigate to generated quiz
- [ ] Offline mode - quiz still generates (if API cached)

#### Gamification
- [ ] XP awarded on quiz completion
- [ ] Streak increments on daily study
- [ ] Achievements unlock at thresholds
- [ ] Avatar evolves with progress

---

## 10. Next Steps

### Immediate (This Sprint)
1. **Fix Sign-In Issue**
   - Investigate and resolve authentication/login flow issues
   - Ensure smooth user onboarding experience
   - Test login/logout functionality

2. **Fix Gamification Reward System**
   - Review XP awarding on quiz completion
   - Verify streak increments on daily study
   - Fix achievement unlock thresholds
   - Test gem rewards distribution
   - Ensure avatar evolves with progress

3. **Complete Snap-to-Quiz Pipeline**
   - Connect NoteUpload.tsx to noteUploadStore
   - Implement "Partial Success" verification UI
   - Test OCR → Gemini → Quiz pipeline end-to-end
   - Verify quiz saves to IndexedDB
   - Test with real images/files

4. **Verify Hint System**
   - Test hint button functionality
   - Verify hint tokens decrease correctly
   - Check ≥70% score bonus awards +1 token

### Short-term (Next 2-4 Weeks)
1. Desktop navigation (top nav bar)
2. Backend API skeleton
3. API key configuration for Gemini/Cloud Vision

### Long-term (Quarter 2+)
1. Supabase integration
2. Teacher portal
3. Social features (leaderboards)
4. Multi-curriculum support

---

## Session Notes - March 13, 2026

### Changes Made This Session
1. ✅ Fixed FABs to be centered on all screens (horizontal, centered)
2. ✅ Implemented hybrid OCR: Tesseract.js (offline) + Google Cloud Vision (online)
3. ✅ Installed tesseract.js package
4. ✅ Created PROJECT_ROADMAP.md with consolidated documentation
5. ✅ Updated APP_ANALYSIS_REPORT.md with fixes applied

### Known Issues to Fix
1. ~~FABs Positioning~~ - ✅ FIXED: Now centered on all screens
2. **OCR/Scanning Not Working:** The OCR service has been implemented with Tesseract.js but needs testing.
   - Current mode: `useMock: true` in noteUploadStore
   - Need to test with real images/files
   - May need API keys for production

### API Keys Required (Discussion Summary)
- **Google Cloud Vision API Key:** For high-accuracy OCR (handwriting recognition)
  - Get from: https://console.cloud.google.com/
  - Free tier: 1,000 requests/month
- **Google Gemini API Key:** For generating quizzes from extracted text
  - Get from: https://aistudio.google.com/app/apikey
  - Free tier available (Gemini 2.5 Flash)
- **Secure Implementation Options:**
  1. Environment variables (.env) - Quick for development
  2. Backend proxy - Recommended for production

### What's Working
- ✅ Responsive breakpoints (mobile + desktop)
- ✅ Onboarding progress indicator
- ✅ Empty states in Home
- ✅ Quiz engine with hints
- ✅ Gamification (XP, streaks, gems, achievements)
- ✅ NoteUpload UI with all states (idle, scanning, verifying, generating, completed, error)
- ✅ FABs now centered on all screens

### What's NOT Working / Needs Fixing
- ⚠️ ~~FABs should be centered on desktop~~ - ✅ FIXED
- ⚠️ OCR scanning needs testing with real images
- ⚠️ Need to set up real API keys for production

---

*Document generated from consolidated project documentation*
*Part of StudyMate MVP Development Roadmap*
*Last Updated: March 13, 2026*

## Key Files Reference

| File | Description |
|------|-------------|
| `SPEC.md` | Full architecture specification |
| `StudyMate MVP Architecture and Context Source of Truth.md` | Core philosophy & design decisions |
| `APP_ANALYSIS_REPORT.md` | App analysis with scores |
| `plans/phase-2-implementation-plan.md` | Note-to-Quiz implementation plan |
| `mockup and guides/Gamification_Technical_Specification.md` | Detailed gamification specs |

---

*Document generated from consolidated project documentation*  
*Part of StudyMate MVP Development Roadmap*
