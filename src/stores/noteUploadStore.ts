// =======================
// NOTE UPLOAD STORE
// Manages the state for the Note-to-Quiz pipeline
// =======================

import { create } from 'zustand';
import { Quiz, LearningPersona, db, NoteUpload } from '../db/database';
import { processImage, OCRResult, needsVerification, UnclearRegion } from '../services/ocr';
import { generateQuizFromNotes, QuizGenerationResult, StudyTip } from '../services/quizGenerator';
import { generateUniqueId } from '../utils/generateId';
import { useGamificationStore } from './gamificationStore';

// Get Gemini API key from environment
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Processing states
export type NoteUploadState = 
  | 'idle'           // No file selected
  | 'scanning'       // OCR in progress
  | 'verifying'      // Partial success - user needs to verify unclear regions
  | 'ready'          // NEW: OCR complete, awaiting user choice
  | 'generating'     // Quiz generation in progress
  | 'studying'       // NEW: Study mode active
  | 'completed'      // Quiz generated OR Study session complete
  | 'error';         // Error occurred

// Study session XP config
const STUDY_SESSION_XP = {
  baseXP: 15,
  studyBonusXP: 10,  // Bonus XP for taking quiz after studying
  perMinuteBonus: 2
};

interface NoteUploadStore {
  // State
  state: NoteUploadState;
  selectedFile: File | null;
  extractedText: string;
  ocrConfidence: number;
  ocrSource: 'gemini' | 'cloud-vision' | 'queued';
  unclearRegions: UnclearRegion[];
  generatedQuiz: Quiz | null | undefined;
  studyTips: StudyTip[];
  warnings: string[];
  errorMessage: string;
  studentPersona: LearningPersona | null;
  
  // Study mode state
  studyStartTime: number | null;
  hasStudied: boolean;  // Track if user completed study session
  studyMinutes: number;  // Minutes spent studying
  
  // Actions
  setSelectedFile: (file: File | null) => void;
  setStudentPersona: (persona: LearningPersona) => void;
  processNote: () => Promise<void>;
  verifyUnclearRegions: (confirmedRegions: UnclearRegion[]) => Promise<void>;
  skipVerification: () => Promise<void>;
  
  // NEW: Ready state actions
  setReady: (text: string, confidence: number, source: 'gemini' | 'cloud-vision' | 'queued') => void;
  backToReady: () => void;
  startStudying: () => void;
  completeStudySession: (awardBaseXP?: boolean) => Promise<void>;
  goToQuiz: () => Promise<void>;
  awardStudyBonus: (quizScore: number) => void;
  
  reset: () => void;
  clearQuiz: () => void;
}

const initialState = {
  state: 'idle' as NoteUploadState,
  selectedFile: null,
  extractedText: '',
  ocrConfidence: 0,
  ocrSource: 'gemini' as 'gemini' | 'cloud-vision' | 'queued',
  unclearRegions: [],
  generatedQuiz: undefined,
  studyTips: [],
  warnings: [],
  errorMessage: '',
  studentPersona: null,
  studyStartTime: null,
  hasStudied: false,
  studyMinutes: 0,
};

export const useNoteUploadStore = create<NoteUploadStore>((set, get) => ({
  ...initialState,
  
  setSelectedFile: (file) => set({ 
    selectedFile: file,
    state: file ? 'idle' : 'idle',
    errorMessage: ''
  }),
  
  setStudentPersona: (persona) => set({ studentPersona: persona }),
  
  // NEW: Set ready state after successful OCR
  setReady: (text, confidence, source) => {
    set({
      state: 'ready',
      extractedText: text,
      ocrConfidence: confidence,
      ocrSource: source
    });
  },
  
  // NEW: Go back to ready state from studying
  backToReady: () => {
    const { extractedText, ocrConfidence, ocrSource } = get();
    set({
      state: 'ready',
      studyStartTime: null
    });
  },
  
  // Start study mode
  startStudying: () => {
    set({
      state: 'studying',
      studyStartTime: Date.now()
    });
  },
  
  // Complete study session and award base XP
  // (Bonus XP is awarded when taking quiz if score > 30%)
  completeStudySession: async () => {
    const { studyStartTime, extractedText, selectedFile, studentPersona } = get();
    
    // Calculate time spent in minutes
    const timeSpentMs = Date.now() - (studyStartTime || Date.now());
    const timeSpentMinutes = Math.floor(timeSpentMs / 60000);
    
    // Award only base XP (bonus awarded in quiz if score > 30%)
    const baseXP = STUDY_SESSION_XP.baseXP;
    
    // Award XP
    const gamificationStore = useGamificationStore.getState();
    gamificationStore.addXP(baseXP, 'study_session');
    
    // Save note upload record for study session
    const noteUpload: NoteUpload = {
      uploadId: `upload_${generateUniqueId()}`,
      studentId: studentPersona?.studentId || 'demo',
      fileName: selectedFile?.name || 'unknown',
      fileType: selectedFile?.type.startsWith('image/') ? 'image' : 'pdf',
      extractedText,
      generatedQuiz: undefined,
      status: 'completed',
      createdAt: new Date(),
      processedAt: new Date()
    };
    await db.noteUploads.put(noteUpload);
    
    // Set hasStudied flag and store study minutes for quiz bonus calculation
    set({
      state: 'completed',
      studyStartTime: null,
      hasStudied: true,
      studyMinutes: timeSpentMinutes
    });
  },
  
  // Generate quiz and go to quiz mode
  goToQuiz: async () => {
    const { extractedText, studentPersona, unclearRegions, selectedFile, studyStartTime, studyMinutes } = get();
    
    // Track if user came from study mode
    const isFromStudy = studyStartTime !== null || studyMinutes > 0;
    
    try {
      set({ state: 'generating' });
      
      const quizResult: QuizGenerationResult = await generateQuizFromNotes({
        extractedText,
        studentPersona: studentPersona || undefined,
        unclearRegions
      }, { useMock: !GEMINI_API_KEY, apiKey: GEMINI_API_KEY });
      
      // Save to IndexedDB
      await db.quizzes.put(quizResult.quiz);
      
      // Save note upload record
      const noteUpload: NoteUpload = {
        uploadId: `upload_${generateUniqueId()}`,
        studentId: studentPersona?.studentId || 'demo',
        fileName: selectedFile?.name || 'unknown',
        fileType: selectedFile?.type.startsWith('image/') ? 'image' : 'pdf',
        extractedText,
        generatedQuiz: quizResult.quiz,
        status: 'completed',
        createdAt: new Date(),
        processedAt: new Date()
      };
      await db.noteUploads.put(noteUpload);
      
      set({
        state: 'completed',
        generatedQuiz: quizResult.quiz,
        studyTips: quizResult.studyTips,
        warnings: quizResult.warnings || []
      });
      
    } catch (error) {
      console.error('Error generating quiz:', error);
      set({
        state: 'error',
        errorMessage: error instanceof Error ? error.message : 'Failed to generate quiz'
      });
    }
  },
  
  // Main processing pipeline
  processNote: async () => {
    const { selectedFile, studentPersona, setReady } = get();
    
    if (!selectedFile) {
      set({ errorMessage: 'No file selected' });
      return;
    }
    
    try {
      // Step 1: OCR Processing
      set({ state: 'scanning', errorMessage: '' });
      
      const ocrResult: OCRResult = await processImage(selectedFile, { useMock: false });
      
      // Check if image was queued for offline processing
      if (ocrResult.source === 'queued') {
        // Show queued message - image will be processed when back online
        set({
          state: 'completed',
          extractedText: '',
          ocrConfidence: 0,
          ocrSource: 'queued',
          unclearRegions: [],
          errorMessage: 'Image queued! It will be processed when you\'re back online.'
        });
        return;
      }
      
      // Step 2: Set to 'ready' state - user chooses Study or Quiz
      // Store OCR data for later use
      set({
        state: 'ready',
        extractedText: ocrResult.rawText,
        ocrConfidence: ocrResult.confidence,
        ocrSource: ocrResult.source,
        unclearRegions: ocrResult.unclearRegions || [],
        errorMessage: ''
      });
      
    } catch (error) {
      console.error('Error processing note:', error);
      set({
        state: 'error',
        errorMessage: error instanceof Error ? error.message : 'Failed to process note'
      });
    }
  },
  
  // Handle verification of unclear regions (Partial Success)
  verifyUnclearRegions: async (confirmedRegions) => {
    const { extractedText, studentPersona, unclearRegions } = get();
    
    try {
      set({ state: 'generating' });
      
      // Filter out unclear regions that weren't confirmed
      const skippedRegions = unclearRegions.filter(
        ur => !confirmedRegions.some(cr => cr.originalText === ur.originalText)
      );
      
      const quizResult: QuizGenerationResult = await generateQuizFromNotes({
        extractedText,
        studentPersona: studentPersona || undefined,
        unclearRegions: skippedRegions
      }, { useMock: !GEMINI_API_KEY, apiKey: GEMINI_API_KEY });
      
      // Save to IndexedDB
      await db.quizzes.put(quizResult.quiz);
      
      // Save note upload record
      const noteUpload: NoteUpload = {
        uploadId: `upload_${generateUniqueId()}`,
        studentId: studentPersona?.studentId || 'demo',
        fileName: get().selectedFile?.name || 'unknown',
        fileType: 'image',
        extractedText,
        generatedQuiz: quizResult.quiz,
        status: 'completed',
        createdAt: new Date(),
        processedAt: new Date()
      };
      await db.noteUploads.put(noteUpload);
      
      set({
        state: 'completed',
        generatedQuiz: quizResult.quiz,
        studyTips: quizResult.studyTips,
        warnings: [
          ...(quizResult.warnings || []),
          skippedRegions.length > 0 ? `Note: ${skippedRegions.length} unclear region(s) were skipped.` : ''
        ].filter(Boolean),
        unclearRegions: [] // Clear unclear regions after processing
      });
      
    } catch (error) {
      console.error('Error generating quiz after verification:', error);
      set({
        state: 'error',
        errorMessage: error instanceof Error ? error.message : 'Failed to generate quiz'
      });
    }
  },
  
  // Skip verification and generate quiz with available text
  skipVerification: async () => {
    const { extractedText, studentPersona, unclearRegions } = get();
    
    try {
      set({ state: 'generating' });
      
      const quizResult: QuizGenerationResult = await generateQuizFromNotes({
        extractedText,
        studentPersona: studentPersona || undefined,
        unclearRegions // Include unclear regions for the AI to handle
      }, { useMock: !GEMINI_API_KEY, apiKey: GEMINI_API_KEY });
      
      // Save to IndexedDB
      await db.quizzes.put(quizResult.quiz);
      
      // Save note upload record
      const noteUpload: NoteUpload = {
        uploadId: `upload_${generateUniqueId()}`,
        studentId: studentPersona?.studentId || 'demo',
        fileName: get().selectedFile?.name || 'unknown',
        fileType: 'image',
        extractedText,
        generatedQuiz: quizResult.quiz,
        status: 'completed',
        createdAt: new Date(),
        processedAt: new Date()
      };
      await db.noteUploads.put(noteUpload);
      
      set({
        state: 'completed',
        generatedQuiz: quizResult.quiz,
        studyTips: quizResult.studyTips,
        warnings: [
          ...(quizResult.warnings || []),
          'Note: Some parts of your notes were unclear. Quiz generated from readable content.'
        ].filter(Boolean),
        unclearRegions: []
      });
      
    } catch (error) {
      console.error('Error generating quiz after skip:', error);
      set({
        state: 'error',
        errorMessage: error instanceof Error ? error.message : 'Failed to generate quiz'
      });
    }
  },
  
  // Reset the store to initial state
  reset: () => set(initialState),
  
  // Clear generated quiz but keep state
  clearQuiz: () => set({
    generatedQuiz: null,
    studyTips: [],
    warnings: [],
    unclearRegions: []
  }),
  
  // Award study bonus XP if quiz score > 30%
  awardStudyBonus: (quizScore) => {
    const { hasStudied, studyMinutes } = get();
    
    // Only award bonus if user studied and score > 30%
    if (hasStudied && quizScore > 30) {
      const timeBonus = studyMinutes * STUDY_SESSION_XP.perMinuteBonus;
      const studyBonus = STUDY_SESSION_XP.studyBonusXP + timeBonus;
      
      // Award bonus XP
      const gamificationStore = useGamificationStore.getState();
      gamificationStore.addXP(studyBonus, 'study_bonus');
      
      console.log(`[Study] Awarded ${studyBonus} XP bonus for quiz score ${quizScore}%`);
    }
    
    // Reset study flags after bonus is awarded
    set({
      hasStudied: false,
      studyMinutes: 0
    });
  }
}));

// Helper function to get partial success message
export function getPartialSuccessMessage(): string {
  return 'I caught most of your notes, but some parts weren\'t completely clear. Can you help me verify them?';
}
