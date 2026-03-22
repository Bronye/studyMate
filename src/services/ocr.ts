// =======================
// OCR SERVICE - Gemini Vision + Queue Implementation
// Handwriting-to-JSON Bridge - Part 1
// Uses Gemini Vision API for OCR + Offline Queue
// =======================

import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Get API keys from environment variables
const GOOGLE_CLOUD_VISION_API_KEY = import.meta.env.VITE_GOOGLE_CLOUD_VISION_API_KEY || '';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export interface OCRResult {
  rawText: string;
  confidence: number;
  source: 'gemini' | 'queued';
  spatialLayout?: {
    paragraphs: { text: string; x: number; y: number; width: number; height: number }[];
    lists: { items: string[]; type: 'bullet' | 'numbered' }[];
    underlinedWords: string[];
  };
  unclearRegions?: UnclearRegion[];
}

export interface UnclearRegion {
  text: string;
  originalText: string;
  suggestion: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
  confidence?: number;
}

// Configuration for OCR service
interface OCRConfig {
  apiKey?: string;
  useMock?: boolean;
  /** Minimum confidence threshold (0-1). Below this, triggers verification. */
  confidenceThreshold?: number;
  /** Force use of specific provider: 'gemini' | 'auto' */
  provider?: 'gemini' | 'auto';
}

// Offline queue for images waiting to be processed
interface QueuedImage {
  id: string;
  file: File;
  fileData: string; // base64
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

let offlineQueue: QueuedImage[] = [];

// Load queue from localStorage on init
export function loadOfflineQueue(): QueuedImage[] {
  try {
    const stored = localStorage.getItem('studymate_offline_queue');
    if (stored) {
      offlineQueue = JSON.parse(stored);
      console.log('[OCR] Loaded offline queue:', offlineQueue.length, 'items');
    }
  } catch (e) {
    console.error('[OCR] Failed to load offline queue:', e);
  }
  return offlineQueue;
}

// Save queue to localStorage
export function saveOfflineQueue(): void {
  try {
    localStorage.setItem('studymate_offline_queue', JSON.stringify(offlineQueue));
  } catch (e) {
    console.error('[OCR] Failed to save offline queue:', e);
  }
}

// Add image to offline queue
export async function queueImageForProcessing(file: File): Promise<string> {
  const id = `queued_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const fileData = await fileToBase64(file);
  
  const queuedImage: QueuedImage = {
    id,
    file,
    fileData,
    timestamp: Date.now(),
    status: 'pending'
  };
  
  offlineQueue.push(queuedImage);
  saveOfflineQueue();
  console.log('[OCR] Image queued for later processing:', id);
  
  return id;
}

// Process all queued images (called when back online)
export async function processQueuedImages(
  onProgress?: (completed: number, total: number) => void
): Promise<void> {
  const pending = offlineQueue.filter(q => q.status === 'pending');
  console.log('[OCR] Processing queued images:', pending.length);
  
  for (let i = 0; i < pending.length; i++) {
    const queued = pending[i];
    queued.status = 'processing';
    saveOfflineQueue();
    
    try {
      // Convert base64 back to File
      const file = base64ToFile(queued.fileData, queued.file.name, queued.file.type);
      
      // Process with Gemini
      await geminiOCR(file);
      
      queued.status = 'completed';
    } catch (error) {
      console.error('[OCR] Failed to process queued image:', queued.id, error);
      queued.status = 'failed';
    }
    
    saveOfflineQueue();
    onProgress?.(i + 1, pending.length);
  }
}

// Helper: Convert File to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Helper: Convert base64 to File
function base64ToFile(base64: string, name: string, type: string): File {
  const byteString = base64.split(',')[1];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new File([ab], name, { type });
}

// Check if we should process now or queue
function shouldQueueForOffline(): boolean {
  return typeof navigator !== 'undefined' ? !navigator.onLine : false;
}

/**
 * Gemini Vision OCR - Uses Gemini API to extract text from images
 * Works online only - queues images when offline
 */
async function geminiOCR(file: File, apiKey?: string): Promise<OCRResult> {
  const key = apiKey || GEMINI_API_KEY;
  
  if (!key) {
    throw new Error('Gemini API key not configured');
  }
  
  // Convert file to base64
  const base64 = await fileToBase64(file);
  
  // Call Gemini Vision API
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            inline_data: {
              mime_type: file.type || 'image/jpeg',
              data: base64
            }
          }, {
            text: 'Extract ALL text from this image. Return the exact text content. If there are math problems, equations, or formulas, include them exactly as shown. If there are diagrams or images with text, include that text too.'
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topP: 0.8,
          topK: 40
        }
      })
    }
  );
  
  if (!response.ok) {
    throw new Error(`Gemini OCR failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error('No text extracted from image');
  }
  
  const rawText = data.candidates[0].content.parts[0].text || '';
  
  // Gemini typically has high confidence - estimate based on text quality
  const confidence = rawText.length > 50 ? 0.9 : 0.7;
  
  return {
    rawText,
    confidence,
    source: 'gemini'
  };
}

/**
 * Main OCR processing function:
 * 1. Online: Use Gemini Vision API
 * 2. Offline: Queue image for later processing
 * 3. PDF: Convert pages to images first
 */
export async function processImage(
  file: File,
  config: OCRConfig = { useMock: false, confidenceThreshold: 0.7, provider: 'auto' }
): Promise<OCRResult> {
  const { useMock, apiKey, confidenceThreshold = 0.7, provider = 'auto' } = config;
  
  // Mock mode for development
  if (useMock) {
    return mockOCRProcess(file);
  }
  
  // Check connectivity - prioritize navigator.onLine for real-time status
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  
  console.log(`[OCR] Network status: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
  
  const apiKeyToUse = apiKey || GOOGLE_CLOUD_VISION_API_KEY;
  
  // Handle PDF files - convert to images
  if (file.type === 'application/pdf') {
    console.log('[OCR] Processing PDF file...');
    try {
      const imageFiles = await convertPdfToImages(file);
      
      // Process each page and combine results
      const results: OCRResult[] = [];
      for (const imgFile of imageFiles) {
        const result = await processSingleFile(imgFile, isOnline, apiKeyToUse, confidenceThreshold, provider);
        results.push(result);
      }
      
      // Combine results from all pages
      return combineOCRResults(results);
    } catch (pdfError) {
      console.error('[OCR] PDF processing failed:', pdfError);
      throw new Error(`Failed to process PDF: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`);
    }
  }
  
  // Process single image file
  return processSingleFile(file, isOnline, apiKeyToUse, confidenceThreshold, provider);
}

/**
 * Process a single file (image) with OCR
 */
async function processSingleFile(
  file: File,
  isOnline: boolean,
  apiKeyToUse: string,
  confidenceThreshold: number,
  provider: string
): Promise<OCRResult> {
  // Check online status - use navigator.onLine for real-time status
  const realTimeOnline = typeof navigator !== 'undefined' ? navigator.onLine : isOnline;
  
  if (!realTimeOnline) {
    // OFFLINE MODE: Queue the image for later processing
    console.log('[OCR] OFFLINE mode - queuing image for later');
    
    try {
      await queueImageForProcessing(file);
      
      // Return a queued result - this tells the UI to show the queue message
      return {
        rawText: '',
        confidence: 0,
        source: 'queued'
      };
    } catch (queueError) {
      console.error('[OCR] Failed to queue image:', queueError);
      throw new Error('Failed to queue image for offline processing');
    }
  }
  
  // ONLINE MODE: Use Gemini Vision API
  const geminiKey = apiKeyToUse || GEMINI_API_KEY;
  
  if (!geminiKey) {
    throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env.local');
  }
  
  console.log('[OCR] ONLINE mode - using Gemini Vision');
  
  try {
    const result = await geminiOCR(file, geminiKey);
    return result;
  } catch (geminiError) {
    console.error('[OCR] Gemini OCR failed:', geminiError);
    // Fall back to Cloud Vision if available
    if (GOOGLE_CLOUD_VISION_API_KEY) {
      console.log('[OCR] Falling back to Cloud Vision');
      // If Gemini fails, there's no fallback - just throw the error
      throw geminiError;
    }
}

/**
 * Convert PDF to array of image files
 */
async function convertPdfToImages(file: File): Promise<File[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const imageFiles: File[] = [];
  
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR
    
    // Create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    if (!context) {
      throw new Error('Failed to get canvas context');
    }
    
    // Render PDF page to canvas
    await page.render({
      canvasContext: context,
      viewport: viewport,
      canvas: canvas
    } as any).promise;
    
    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to convert canvas to blob'));
      }, 'image/png');
    });
    
    // Create file from blob
    const imageFile = new File([blob], `page_${pageNum}.png`, { type: 'image/png' });
    imageFiles.push(imageFile);
  }
  
  console.log(`[OCR] Converted ${pdf.numPages} PDF pages to images`);
  return imageFiles;
}

/**
 * Combine OCR results from multiple pages
 */
function combineOCRResults(results: OCRResult[]): OCRResult {
  if (results.length === 0) {
    return {
      rawText: '',
      confidence: 0,
      source: 'gemini'
    };
  }
  
  if (results.length === 1) {
    return results[0];
  }
  
  // Combine text from all pages
  const combinedText = results.map(r => r.rawText).join('\n\n--- Page Break ---\n\n');
  
  // Average confidence
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  
  // Combine unclear regions
  const allUnclearRegions = results.flatMap(r => r.unclearRegions || []);
  
  // Combine spatial layout
  const allParagraphs = results.flatMap(r => r.spatialLayout?.paragraphs || []);
  const allLists = results.flatMap(r => r.spatialLayout?.lists || []);
  const allUnderlined = results.flatMap(r => r.spatialLayout?.underlinedWords || []);
  
  // Determine source - prioritize gemini
  const source = results.some(r => r.source === 'gemini') ? 'gemini' : 'queued';
  
  return {
    rawText: combinedText,
    confidence: avgConfidence,
    source,
    spatialLayout: {
      paragraphs: allParagraphs,
      lists: allLists,
      underlinedWords: allUnderlined
    },
    unclearRegions: allUnclearRegions.length > 0 ? allUnclearRegions : undefined
  };
}

// Note: Cloud Vision OCR removed - using Gemini only
// async function cloudVisionOCR(file: File, apiKey: string): Promise<OCRResult> {
  // Convert file to base64
  const base64Image = await fileToBase64(file);
  
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: base64Image,
            },
            features: [
              {
                type: 'TEXT_DETECTION',
                maxResults: 10,
              },
              {
                type: 'DOCUMENT_TEXT_DETECTION',
                maxResults: 10,
              },
            ],
          },
        ],
      }),
    }
  );
  
  if (!response.ok) {
    throw new Error(`Cloud Vision API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  const textAnnotations = data.responses[0]?.textAnnotations;
  
  if (!textAnnotations || textAnnotations.length === 0) {
    return {
      rawText: '',
      confidence: 0,
      source: 'gemini',
    };
  }
  
  // Extract text and confidence
  const rawText = textAnnotations[0]?.description || '';
  const confidence = textAnnotations[0]?.confidence || 0.9;
  
  // Extract spatial information from vertices
  const paragraphs = textAnnotations.slice(1).map((ann: any) => ({
    text: ann.description,
    boundingBox: ann.boundingPoly?.vertices?.[0] || { x: 0, y: 0 },
    width: ann.boundingPoly?.vertices?.[1]?.x - ann.boundingPoly?.vertices?.[0]?.x || 0,
    height: ann.boundingPoly?.vertices?.[2]?.y - ann.boundingPoly?.vertices?.[0]?.y || 0,
  }));
  
  // Identify unclear regions (low confidence words)
  const unclearRegions: UnclearRegion[] = [];
  textAnnotations.slice(1).forEach((ann: any) => {
    if (ann.confidence && ann.confidence < 0.8) {
      unclearRegions.push({
        text: '???',
        originalText: ann.description,
        suggestion: `This might say "${ann.description}" - can you confirm?`,
        confidence: ann.confidence
      });
    }
  });
  
  console.log(`[OCR] Cloud Vision completed. Confidence: ${(confidence * 100).toFixed(1)}%`);
  
  return {
    rawText,
    confidence,
    source: 'gemini',
    spatialLayout: {
      paragraphs: paragraphs.map((p: any) => ({
        text: p.text,
        x: p.boundingBox?.x || 0,
        y: p.boundingBox?.y || 0,
        width: p.width,
        height: p.height
      })),
      lists: [],
      underlinedWords: []
    },
    unclearRegions: unclearRegions.length > 0 ? unclearRegions : undefined
  };
}

// Mock OCR for development and testing
async function mockOCRProcess(file: File): Promise<OCRResult> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const isImage = file.type.startsWith('image/');
  
  if (!isImage) {
    return {
      rawText: '',
      confidence: 0,
      source: 'gemini',
      unclearRegions: [{
        text: 'Unable to process file',
        originalText: '',
        suggestion: 'Please upload an image file (JPG, PNG)'
      }]
    };
  }
  
  // Simulate different confidence levels
  const mockConfidence = 0.65 + Math.random() * 0.3; // 0.65-0.95
  
  const mockExtractedText = `ALGEBRA - LINEAR EQUATIONS

Introduction:
A linear equation is an algebraic equation in which each term is either a constant or the product of a constant and a single variable.

Key Concepts:
1. Variables - letters that represent unknown values (x, y, z)
2. Constants - fixed numerical values
3. Coefficients - numbers multiplied by variables

Example:
2x + 5 = 15
- Subtract 5 from both sides: 2x = 10
- Divide by 2: x = 5

Practice Problems:
1. Solve: 3x - 7 = 14
2. Find x if: 4x + 3 = 19
3. Calculate: 2(x + 3) = 16`;
  
  const unclearRegions: UnclearRegion[] = [];
  
  if (mockConfidence < 0.8) {
    unclearRegions.push(
      {
        text: 'x = ?',
        originalText: 'x = 5',
        suggestion: 'This looks like "x equals 5"',
        confidence: 0.6
      },
      {
        text: '2? + 5',
        originalText: '2x + 5',
        suggestion: 'This looks like "2x + 5" - the variable x',
        confidence: 0.55
      }
    );
  }
  
  return {
    rawText: mockExtractedText,
    confidence: mockConfidence,
    source: 'gemini',
    spatialLayout: {
      paragraphs: [
        { text: 'ALGEBRA - LINEAR EQUATIONS', x: 50, y: 100, width: 300, height: 30 },
        { text: 'Introduction:', x: 50, y: 150, width: 120, height: 20 },
        { text: 'A linear equation is an algebraic equation...', x: 50, y: 175, width: 400, height: 40 }
      ],
      lists: [
        { items: ['Variables - letters that represent unknown values', 'Constants - fixed numerical values', 'Coefficients - numbers multiplied by variables'], type: 'bullet' }
      ],
      underlinedWords: ['2x + 5 = 15', 'x = 5']
    },
    unclearRegions: unclearRegions.length > 0 ? unclearRegions : undefined
  };
}



// Check if OCR confidence is below threshold (for partial success)
export function needsVerification(result: OCRResult): boolean {
  const hasLowConfidence = result.confidence < 0.8;
  const hasUnclearRegions = !!(result.unclearRegions && result.unclearRegions.length > 0);
  return hasLowConfidence || hasUnclearRegions;
}

// Generate partial success message
export function generatePartialSuccessMessage(result: OCRResult): string {
  const source = result.source === 'gemini' ? 'Gemini' : 'Queued';
  
  if (!result.unclearRegions || result.unclearRegions.length === 0) {
    return `I caught most of your notes with ${source}, but some parts weren't completely clear. Can you help me verify them?`;
  }
  
  const regionCount = result.unclearRegions.length;
  return `I found ${regionCount} part${regionCount > 1 ? 's' : ''} in your notes that weren't completely clear (using ${source}). Can you double-check them?`;
}

// Cleanup function - no longer needed since we use Gemini
export async function cleanupTesseract(): Promise<void> {
  console.log('[OCR] Cleanup called - using Gemini, no worker to terminate');
}

// Check if running offline
export function isOffline(): boolean {
  return typeof navigator !== 'undefined' ? !navigator.onLine : false;
}
