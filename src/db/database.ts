import Dexie, { Table } from 'dexie';

// =======================
// TYPE DEFINITIONS
// =======================

export interface LearningPersona {
  studentId: string;
  personaType: 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'mixed';
  cognitiveProfile: {
    processingSpeed: number;
    memoryStrength: 'short_term' | 'long_term' | 'working' | 'visual' | 'auditory';
    attentionSpan: number;
    criticalThinking: number;
    eqBaseline: 'encouraging' | 'direct' | 'analytic';
  };
  subjectStrengths: {
    subject: string;
    proficiency: number;
    interest: number;
  }[];
  preferredDifficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
  studyPatterns: {
    peakHours: number[];
    sessionDuration: number;
    breakFrequency: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentProfile {
  id?: number;
  studentId: string;
  username: string; // Username from signup
  name: string; // Display name from onboarding
  grade: 'SSS1' | 'SSS2' | 'SSS3';
  avatar?: AvatarState;
  xp: number;
  gems: number;
  streak: number;
  lastStudyDate?: Date;
  completedQuizzes?: string[]; // Store completed quiz IDs
  persona: LearningPersona;
  createdAt: Date;
  updatedAt: Date;
}

export interface AvatarState {
  level: number;
  xp: number;
  streak: number;
  unlockedAccessories: string[];
  mood: 'happy' | 'focused' | 'excited' | 'proud';
  expression: 'smile' | 'thinking' | 'celebrating';
}

export interface Question {
  id: string;
  text: string;
  options: {
    id: string;
    text: string;
  }[];
  correctOptionId: string;
  explanation: string;
  hint?: string;
  cognitiveLevel: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate';
}

export interface Quiz {
  id?: number;
  quizId: string;
  subject: string;
  topic: string;
  grade: 'SSS1' | 'SSS2' | 'SSS3';
  questions: Question[];
  points: number;
  gems: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  source: 'curriculum' | 'note_upload';
  syncedAt?: Date;
  expiresAt: Date;
}

export interface QuizAttempt {
  id?: number;
  attemptId: string;
  quizId: string;
  studentId: string;
  answers: {
    questionId: string;
    selectedOptionId: string;
    isCorrect: boolean;
  }[];
  score: number;
  totalQuestions: number;
  timeSpent: number;
  completedAt: Date;
  synced: boolean;
  syncedAt?: Date;
}

export interface NoteUpload {
  id?: number;
  uploadId: string;
  studentId: string;
  fileName: string;
  fileType: 'image' | 'pdf';
  extractedText?: string;
  generatedQuiz?: Quiz;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  createdAt: Date;
  processedAt?: Date;
}

// AI-generated study notes saved from quiz sessions
export interface SavedNote {
  id?: number;
  noteId: string;
  studentId: string;
  title: string;
  content: string; // AI-generated explanation/study notes
  sourceText?: string; // Original extracted text
  subject?: string;
  topic?: string;
  createdAt: Date;
}

export interface SyncQueueItem {
  id?: number;
  syncId: string;
  action: 'quiz_attempt' | 'profile_update';
  payload: unknown;
  createdAt: Date;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed';
}

// =======================
// DATABASE CLASS
// =======================

class StudyMateDB extends Dexie {
  students!: Table<StudentProfile>;
  quizzes!: Table<Quiz>;
  quizAttempts!: Table<QuizAttempt>;
  noteUploads!: Table<NoteUpload>;
  syncQueue!: Table<SyncQueueItem>;
  completedQuizzes!: Table<CompletedQuiz>;
  savedNotes!: Table<SavedNote>;

  constructor() {
    super('StudyMateDB');
    
    this.version(1).stores({
      students: '++id, studentId, grade',
      quizzes: '++id, quizId, subject, topic, grade, source',
      quizAttempts: '++id, attemptId, quizId, studentId, synced',
      noteUploads: '++id, uploadId, studentId, status',
      syncQueue: '++id, syncId, action, status',
      completedQuizzes: '++id, quizId, studentId, completedAt',
      savedNotes: '++id, noteId, studentId, subject, topic, createdAt'
    });
  }
}

// Export singleton instance
export const db = new StudyMateDB();

// =======================
// HELPER FUNCTIONS
// =======================

export async function saveStudentProfile(profile: StudentProfile): Promise<number> {
  return await db.students.put(profile) as number;
}

export async function getStudentProfile(studentId: string): Promise<StudentProfile | undefined> {
  return await db.students.where('studentId').equals(studentId).first();
}

export async function saveQuiz(quiz: Quiz): Promise<number> {
  return await db.quizzes.put(quiz) as number;
}

export async function getQuiz(quizId: string): Promise<Quiz | undefined> {
  return await db.quizzes.where('quizId').equals(quizId).first();
}

export async function getAvailableQuizzes(): Promise<Quiz[]> {
  const now = new Date();
  return await db.quizzes
    .where('expiresAt')
    .above(now)
    .toArray();
}

export async function saveQuizAttempt(attempt: QuizAttempt): Promise<number> {
  const id = await db.quizAttempts.put(attempt);
  
  // Add to sync queue
  await db.syncQueue.add({
    syncId: attempt.attemptId,
    action: 'quiz_attempt',
    payload: attempt,
    createdAt: new Date(),
    retryCount: 0,
    status: 'pending'
  });
  
  return id as number;
}

export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  return await db.syncQueue
    .where('status')
    .equals('pending')
    .toArray();
}

export async function markSyncComplete(syncId: string): Promise<void> {
  await db.syncQueue.where('syncId').equals(syncId).delete();
  await db.quizAttempts.where('attemptId').equals(syncId).modify({
    synced: true,
    syncedAt: new Date()
  });
}

export async function updateStreak(studentId: string, streak: number): Promise<void> {
  await db.students.where('studentId').equals(studentId).modify({
    streak,
    lastStudyDate: new Date()
  });
}

export async function addXP(studentId: string, xpToAdd: number): Promise<void> {
  const student = await getStudentProfile(studentId);
  if (student) {
    await db.students.where('studentId').equals(studentId).modify({
      xp: student.xp + xpToAdd
    });
  }
}

// ========================
// COMPLETED QUIZZES HELPERS
// ========================

export interface CompletedQuiz {
  id?: number;
  quizId: string;
  studentId: string;
  completedAt: Date;
}

export async function markQuizCompletedDB(quizId: string, studentId: string): Promise<number> {
  const completed: CompletedQuiz = {
    quizId,
    studentId,
    completedAt: new Date()
  };
  return await db.completedQuizzes.put(completed) as number;
}

export async function isQuizCompletedDB(quizId: string, studentId: string): Promise<boolean> {
  const result = await db.completedQuizzes
    .where('quizId')
    .equals(quizId)
    .first();
  return !!result;
}

export async function getCompletedQuizzesDB(studentId: string): Promise<string[]> {
  const results = await db.completedQuizzes
    .where('studentId')
    .equals(studentId)
    .toArray();
  return results.map(r => r.quizId);
}

// Saved Notes functions
export async function saveNote(note: SavedNote): Promise<number> {
  return await db.savedNotes.put(note) as number;
}

export async function getNotes(studentId: string): Promise<SavedNote[]> {
  return await db.savedNotes
    .where('studentId')
    .equals(studentId)
    .reverse()
    .sortBy('createdAt');
}

export async function getNote(noteId: string): Promise<SavedNote | undefined> {
  return await db.savedNotes.where('noteId').equals(noteId).first();
}

export async function deleteNote(noteId: string): Promise<void> {
  await db.savedNotes.where('noteId').equals(noteId).delete();
}

// Get all note uploads for a student (for Notes page)
export async function getNoteUploads(studentId: string): Promise<NoteUpload[]> {
  return await db.noteUploads
    .where('studentId')
    .equals(studentId)
    .reverse()
    .sortBy('createdAt');
}
