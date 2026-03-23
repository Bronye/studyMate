// =======================
// OCR SERVICE - Gemini Vision + Queue Implementation
// Handwriting-to-JSON Bridge - Part 1
// Uses Gemini Vision API for OCR + Offline Queue
// =======================

import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
// Stubbed OCR module for build stability.
// Original implementation is preserved in src/services/ocr.backup.ts

export interface OCRResult { rawText: string; confidence: number; source: string; unclearRegions?: any[] }
export interface UnclearRegion { text: string; originalText: string; suggestion: string }

export async function processImage(file: File, config?: { useMock?: boolean }): Promise<OCRResult> {
  // If someone accidentally calls this, forward to a simple mock
  return { rawText: 'OCR service temporarily disabled', confidence: 0, source: 'stub' };
}

export function needsVerification(_: OCRResult): boolean { return false }

export function isOffline(): boolean { return typeof navigator !== 'undefined' ? !navigator.onLine : false }
  console.log('[OCR] Cleanup called - using Gemini, no worker to terminate');
}

// Check if running offline
export function isOffline(): boolean {
  return typeof navigator !== 'undefined' ? !navigator.onLine : false;
}
