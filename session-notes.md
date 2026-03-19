# Study Mate - Session Notes

## Date: 2026-03-11

---

## Current Status: Hint System Bug Fix In Progress

### Issue Reported
The hint button in quizzes doesn't work - clicking it does nothing.

### Root Cause Identified
1. **Primary Issue**: The `startQuiz` function in `useAppStore.ts` was not resetting the `usedHints` Set when starting a new quiz. This caused hints from previous quizzes to carry over and potentially block new hints.
2. **Secondary Issue**: The hint button may have had cursor styling issues.

### Fixes Applied

#### 1. File: `src/stores/useAppStore.ts` (Line 79)
Added `usedHints: new Set<string>()` to reset hint state for each new quiz:
```typescript
startQuiz: (quiz) => set({
  currentQuiz: quiz,
  currentQuestionIndex: 0,
  answers: new Map(),
  quizStartTime: Date.now(),
  quizInProgress: true,
  usedHints: new Set<string>()  // NEW: Reset used hints
}),
```

#### 2. File: `src/pages/Quiz.tsx` (Line 317)
Added explicit `cursor-pointer` class to hint button:
```tsx
className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium mb-4 cursor-pointer
  ${isHintUsed 
    ? 'bg-green-100 text-green-700 cursor-default' 
    : canUseHint 
      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors'
      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
  }`}
```

#### 3. File: `src/pages/Quiz.tsx` (Line 130)
Added console logging to `handleUseHint` for debugging:
```typescript
const handleUseHint = () => {
  console.log('[Hint] handleUseHint called', { currentQuestion: currentQuestion?.id, hintTokens, isHintUsed, hasHint, canUseHint });
  // ... rest of function
};
```

---

## How to Test the Fix

1. **Start a fresh quiz** (the sample Algebra quiz - "math_algebra_001")
2. **Look for the hint button** - should appear as a yellow/orange button with Lightbulb icon below the question
3. **Check cursor** - cursor should change to pointer on hover
4. **Click the button** - the hint modal should appear with hint text
5. **Check browser console** - if it doesn't work, look for log messages starting with `[Hint]`

---

## Hint System Overview

### How It Works
- Students start with **3 hint tokens**
- Each quiz question can have an optional `hint` field
- Clicking "Use Hint" consumes 1 token and shows the hint in a modal
- Tokens are NOT refunded if used
- Good performance (≥70% score) awards +1 hint token

### Files Involved
| File | Purpose |
|------|---------|
| `src/stores/useAppStore.ts` | State management - hintTokens, usedHints, useHint() |
| `src/pages/Quiz.tsx` | Quiz UI - hint button and modal |
| `src/data/sampleQuiz.ts` | Sample quiz data with hints |
| `src/db/database.ts` | Question interface with optional hint field |

---

## To Do / Next Steps

- [ ] Test the hint fix on a fresh quiz
- [ ] Verify hint tokens decrease after use
- [ ] Check that completed quizzes award bonus hint tokens (≥70% score)
- [ ] Test with imported JSON quizzes to ensure hints work there too

---

## Notes from Investigation

- Sample quizzes (e.g., math_algebra_001) DO have hints defined
- Imported JSON quizzes need `hint` field in each question object
- The hint token count displays in the header (Lightbulb icon with number)
- Browser console logging added to debug any remaining issues
