// =======================
// OCR SERVICE - Hybrid Implementation
// Handwriting-to-JSON Bridge - Part 1
// Uses Tesseract.js (offline) + Google Cloud Vision (online/pro)
// =======================

import { createWorker, Worker, PSM } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Get API key from environment variables
const GOOGLE_CLOUD_VISION_API_KEY = import.meta.env.VITE_GOOGLE_CLOUD_VISION_API_KEY || '';

export interface OCRResult {
  rawText: string;
  confidence: number;
  source: 'tesseract' | 'cloud-vision';
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
  /** Force use of specific provider: 'tesseract' | 'cloud-vision' | 'auto' */
  provider?: 'tesseract' | 'cloud-vision' | 'auto';
}

// Tesseract.js worker instance (cached)
let tesseractWorker: Worker | null = null;

/**
 * Main OCR processing function with hybrid approach:
 * 1. Always try Tesseract.js first (works offline, fast)
 * 2. If online + low confidence + API key available, fallback to GCV
 * 3. If PDF, convert pages to images first
 */
export async function processImage(
  file: File,
  config: OCRConfig = { useMock: true, confidenceThreshold: 0.7, provider: 'auto' }
): Promise<OCRResult> {
  const { useMock, apiKey, confidenceThreshold = 0.7, provider = 'auto' } = config;
  
  // Mock mode for development
  if (useMock) {
    return mockOCRProcess(file);
  }
  
  // Check connectivity
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  
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
  let result: OCRResult;
  
  if (provider === 'tesseract' || !isOnline || !apiKeyToUse) {
    // Use Tesseract.js (offline-capable)
    result = await tesseractOCR(file);
  } else if (provider === 'cloud-vision') {
    // Force Cloud Vision
    result = await cloudVisionOCR(file, apiKeyToUse);
  } else {
    // Auto mode: Try Tesseract first, then fallback to GCV if low confidence
    result = await tesseractOCR(file);
    
    // If low confidence and online, try Cloud Vision
    if (result.confidence < confidenceThreshold && isOnline && apiKeyToUse) {
      console.log('[OCR] Low confidence from Tesseract, falling back to Cloud Vision...');
      try {
        const gcvResult = await cloudVisionOCR(file, apiKeyToUse);
        // Only use GCV result if it's better
        if (gcvResult.confidence > result.confidence) {
          result = { ...gcvResult, source: 'cloud-vision' };
        }
      } catch (error) {
        console.error('[OCR] Cloud Vision fallback failed:', error);
        // Keep Tesseract result
      }
    }
  }
  
  return result;
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
      source: 'tesseract'
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
  
  // Determine source (use cloud-vision if any page used it)
  const source = results.some(r => r.source === 'cloud-vision') ? 'cloud-vision' : 'tesseract';
  
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

/**
 * Tesseract.js OCR - Client-side, works offline
 */
async function tesseractOCR(file: File): Promise<OCRResult> {
  try {
    // Initialize worker if not already done
    if (!tesseractWorker) {
      console.log('[OCR] Initializing Tesseract.js worker...');
      try {
        tesseractWorker = await createWorker('eng', 1, {
          logger: (m) => console.log('[Tesseract]', m.status, m.progress)
        });
      } catch (workerError) {
        console.error('[OCR] Worker initialization error:', workerError);
        throw new Error(`Failed to initialize Tesseract worker: ${workerError instanceof Error ? workerError.message : 'Unknown error'}`);
      }
    }
    
    // Convert file to URL for Tesseract
    const imageUrl = URL.createObjectURL(file);
    
    try {
      // Recognize text
      const { data } = await tesseractWorker.recognize(imageUrl);
      
      // Clean up
      URL.revokeObjectURL(imageUrl);
      
      // Extract confidence (average of word confidences)
      const confidence = data.confidence / 100;
      
      // Identify unclear regions (low confidence words)
      const unclearRegions: UnclearRegion[] = [];
      const dataWithWords = data as any;
      if (dataWithWords.words) {
        (dataWithWords.words as any[]).forEach((word: any) => {
          if (word.confidence < 70) {
            unclearRegions.push({
              text: '???',
              originalText: word.text,
              suggestion: `This might say "${word.text}" - can you confirm?`,
              confidence: word.confidence / 100
            });
          }
        });
      }
      
      // Parse paragraphs and structure
      const paragraphs: { text: string; x: number; y: number; width: number; height: number }[] = [];
      const dataWithParagraphs = data as any;
      if (dataWithParagraphs.paragraphs) {
        (dataWithParagraphs.paragraphs as any[]).forEach((para: any) => {
          const bbox = para.bbox;
          paragraphs.push({
            text: para.text,
            x: bbox?.x0 || 0,
            y: bbox?.y0 || 0,
            width: (bbox?.x1 || 0) - (bbox?.x0 || 0),
            height: (bbox?.y1 || 0) - (bbox?.y0 || 0)
          });
        });
      }
      
      // Extract lists (heuristic: lines starting with numbers or bullets)
      const lines = data.text.split('\n').filter((line: string) => line.trim());
      const lists: { items: string[]; type: 'bullet' | 'numbered' }[] = [];
      const numberedItems: string[] = [];
      const bulletItems: string[] = [];
      
      lines.forEach((line: string) => {
        const trimmed = line.trim();
        if (/^\d+[.)]/.test(trimmed)) {
          numberedItems.push(trimmed.replace(/^\d+[.)]\s*/, ''));
        } else if (/^[-•*]/.test(trimmed)) {
          bulletItems.push(trimmed.replace(/^[-•*]\s*/, ''));
        }
      });
      
      if (numberedItems.length > 0) {
        lists.push({ items: numberedItems, type: 'numbered' });
      }
      if (bulletItems.length > 0) {
        lists.push({ items: bulletItems, type: 'bullet' });
      }
      
      console.log(`[OCR] Tesseract.js completed. Confidence: ${(confidence * 100).toFixed(1)}%`);
      
      return {
        rawText: data.text,
        confidence,
        source: 'tesseract',
        spatialLayout: {
          paragraphs,
          lists,
          underlinedWords: []
        },
        unclearRegions: unclearRegions.length > 0 ? unclearRegions : undefined
      };
      
    } catch (recognizeError) {
      console.error('[OCR] Recognition error:', recognizeError);
      throw new Error(`Tesseract recognition failed: ${recognizeError instanceof Error ? recognizeError.message : 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error('[OCR] Tesseract.js error:', error);
    throw new Error(`Tesseract OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Google Cloud Vision OCR - Server-side, higher accuracy
 * Requires API key (should be called from backend in production)
 */
async function cloudVisionOCR(file: File, apiKey: string): Promise<OCRResult> {
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
      source: 'cloud-vision',
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
    source: 'cloud-vision',
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
      source: 'tesseract',
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
    source: Math.random() > 0.5 ? 'tesseract' : 'cloud-vision',
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

// Helper function to convert file to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
}

// Check if OCR confidence is below threshold (for partial success)
export function needsVerification(result: OCRResult): boolean {
  const hasLowConfidence = result.confidence < 0.8;
  const hasUnclearRegions = !!(result.unclearRegions && result.unclearRegions.length > 0);
  return hasLowConfidence || hasUnclearRegions;
}

// Generate partial success message
export function generatePartialSuccessMessage(result: OCRResult): string {
  const source = result.source === 'cloud-vision' ? 'Cloud Vision' : 'Tesseract';
  
  if (!result.unclearRegions || result.unclearRegions.length === 0) {
    return `I caught most of your notes with ${source}, but some parts weren't completely clear. Can you help me verify them?`;
  }
  
  const regionCount = result.unclearRegions.length;
  return `I found ${regionCount} part${regionCount > 1 ? 's' : ''} in your notes that weren't completely clear (using ${source}). Can you double-check them?`;
}

// Cleanup function to terminate Tesseract worker
export async function cleanupTesseract(): Promise<void> {
  if (tesseractWorker) {
    await tesseractWorker.terminate();
    tesseractWorker = null;
    console.log('[OCR] Tesseract.js worker terminated');
  }
}

// Check if running offline
export function isOffline(): boolean {
  return typeof navigator !== 'undefined' ? !navigator.onLine : false;
}
