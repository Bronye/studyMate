export interface UnclearRegion {
  text: string;
  originalText: string;
  suggestion: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
  confidence?: number;
}

export interface OCRResult {
  rawText: string;
  confidence: number;
  source: 'mock';
  spatialLayout?: {
    paragraphs: { text: string; x: number; y: number; width: number; height: number }[];
    lists: { items: string[]; type: 'bullet' | 'numbered' }[];
    underlinedWords: string[];
  };
  unclearRegions?: UnclearRegion[];
}

// Simple mock OCR processing - simulates a network delay and returns sample text
export async function processImage(file: File, config?: { useMock?: boolean }): Promise<OCRResult> {
  await new Promise((r) => setTimeout(r, 800));

  const sampleText = `ALGEBRA — LINEAR EQUATIONS\n\nVariables: x, y\nExample: 2x + 5 = 15 -> x = 5\nPractice: Solve 3x - 7 = 14`;

  const result: OCRResult = {
    rawText: sampleText,
    confidence: 0.9,
    source: 'mock',
    spatialLayout: {
      paragraphs: [
        { text: 'ALGEBRA — LINEAR EQUATIONS', x: 10, y: 10, width: 300, height: 24 },
        { text: 'Variables: x, y', x: 10, y: 40, width: 200, height: 18 }
      ],
      lists: [{ items: ['2x + 5 = 15', '3x - 7 = 14'], type: 'numbered' }],
      underlinedWords: ['2x + 5 = 15']
    }
  };

  return result;
}

export function needsVerification(result: OCRResult): boolean {
  return !!(result.confidence < 0.8 || (result.unclearRegions && result.unclearRegions.length > 0));
}
