// =======================
// QUIZ GENERATOR SERVICE
// Handwriting-to-JSON Bridge - Part 2
// Uses Gemini 2.5 Flash API to generate quizzes from extracted text
// =======================

import { Quiz, Question, LearningPersona } from '../db/database';
import { generateUniqueId } from '../utils/generateId';

export interface QuizGenerationOptions {
  extractedText: string;
  studentPersona?: LearningPersona;
  unclearRegions?: { text: string; suggestion: string }[];
  subject?: string;
  topic?: string;
  grade?: 'SSS1' | 'SSS2' | 'SSS3';
}

export interface QuizGenerationResult {
  quiz: Quiz;
  studyTips: StudyTip[];
  warnings?: string[];
}

export interface StudyTip {
  title: string;
  description: string;
}

interface GeminiConfig {
  apiKey?: string;
  useMock?: boolean;
}

// Generate quiz from extracted text using Gemini 2.5 Flash
export async function generateQuizFromNotes(
  options: QuizGenerationOptions,
  config: GeminiConfig = { useMock: true }
): Promise<QuizGenerationResult> {
  const { extractedText, studentPersona, unclearRegions, subject, grade } = options;
  
  if (!extractedText || extractedText.trim().length === 0) {
    throw new Error('No text content provided for quiz generation');
  }
  
  if (config.useMock) {
    return mockGenerateQuiz(options);
  }
  
  return await geminiGenerateQuiz(options, config.apiKey!);
}

// Mock quiz generation for development
async function mockGenerateQuiz(options: QuizGenerationOptions): Promise<QuizGenerationResult> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2500));
  
  const { extractedText, studentPersona, unclearRegions, subject, grade = 'SSS1' } = options;
  
  // Determine topic from text (simple heuristic)
  const topic = options.topic || extractTopicFromText(extractedText);
  const detectedSubject = subject || detectSubject(extractedText);
  
  // Generate questions based on extracted text content
  const questions = generateQuestionsFromContent(extractedText, studentPersona);
  
  // Generate personalized study tips based on persona
  const studyTips = generateStudyTips(studentPersona);
  
  // Build warnings if there were unclear regions
  const warnings: string[] = [];
  if (unclearRegions && unclearRegions.length > 0) {
    warnings.push(`⚠️ ${unclearRegions.length} unclear region(s) were skipped in quiz generation. Please verify the original notes.`);
  }
  
  const quiz: Quiz = {
    quizId: `quiz_${generateUniqueId()}`,
    subject: detectedSubject,
    topic,
    grade,
    questions,
    points: 10,
    gems: 3,
    difficulty: 'medium',
    source: 'note_upload',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  };
  
  return {
    quiz,
    studyTips,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

// Production Gemini API implementation
async function geminiGenerateQuiz(
  options: QuizGenerationOptions,
  apiKey: string
): Promise<QuizGenerationResult> {
  const { extractedText, studentPersona, unclearRegions, subject, grade = 'SSS1' } = options;
  
  // Build the prompt with persona context
  const systemPrompt = buildSystemPrompt(studentPersona);
  const userPrompt = buildUserPrompt(extractedText, unclearRegions, subject, grade);
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt },
              { text: userPrompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4000,
          responseMimeType: 'application/json'
        }
      })
    }
  );
  
  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  const generatedContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!generatedContent) {
    throw new Error('No content generated from Gemini API');
  }
  
  // Parse the JSON response
  const parsed = JSON.parse(generatedContent);
  
  // Convert to our Quiz format
  const questions: Question[] = parsed.questions.map((q: any, index: number) => ({
    id: `q_${generateUniqueId()}_${index}`,
    text: q.question,
    options: q.options.map((opt: string, optIndex: number) => ({
      id: String.fromCharCode(97 + optIndex), // a, b, c, d
      text: opt
    })),
    correctOptionId: String.fromCharCode(97 + q.correctIndex),
    explanation: q.explanation,
    cognitiveLevel: q.cognitiveLevel || 'understand'
  }));
  
  const topic = options.topic || extractTopicFromText(extractedText);
  const detectedSubject = subject || detectSubject(extractedText);
  
  const quiz: Quiz = {
    quizId: `quiz_${generateUniqueId()}`,
    subject: detectedSubject,
    topic,
    grade,
    questions,
    points: 10,
    gems: 3,
    difficulty: 'medium',
    source: 'note_upload',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  };
  
  return {
    quiz,
    studyTips: parsed.studyTips || []
  };
}

// Build persona-injected system prompt
function buildSystemPrompt(persona?: LearningPersona): string {
  if (!persona) {
    return "You are an expert Nigerian curriculum educator. Generate quiz questions based on the provided text.";
  }
  
  const {
    personaType = 'mixed',
    cognitiveProfile,
    preferredDifficulty = 'medium'
  } = persona;
  
  const {
    processingSpeed = 5,
    memoryStrength = 'working',
    attentionSpan = 30,
    criticalThinking = 5,
    eqBaseline = 'encouraging'
  } = cognitiveProfile || {};
  
  return `SYSTEM: Acting as a ${personaType} mentor for a student in the Nigerian SSS curriculum.
Tone: ${eqBaseline} (based on EQ baseline)

CONTEXT:
- Processing Speed: ${processingSpeed}/10 (adjust question complexity accordingly)
- Memory Type: ${memoryStrength}
- Attention Span: ${attentionSpan} minutes (keep questions focused)
- Critical Thinking: ${criticalThinking}/10
- Preferred Difficulty: ${preferredDifficulty}

TASK: Generate quiz questions that match the student's learning profile.`;
}

// Build user prompt with extracted text
function buildUserPrompt(
  extractedText: string,
  unclearRegions?: { text: string; suggestion: string }[],
  subject?: string,
  grade: string = 'SSS1'
): string {
  let prompt = `CURRICULUM: Nigerian National Curriculum (${grade})

TASK:
From the following extracted text from the student's notes, generate:
1. 10 Multiple Choice Questions (4 options each)
2. 3 Study Tips personalized to the student's learning persona

OUTPUT FORMAT (JSON):
{
  "questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this is correct",
      "cognitiveLevel": "remember|understand|apply|analyze|evaluate"
    }
  ],
  "studyTips": [
    {"title": "Tip 1", "description": "..."}
  ]
}

EXTRACTED TEXT:
${extractedText}`;

  // Add unclear regions warning
  if (unclearRegions && unclearRegions.length > 0) {
    prompt += `\n\n⚠️ NOTE: The following regions were unclear and should be skipped or handled carefully:\n`;
    unclearRegions.forEach((region, i) => {
      prompt += `- Region ${i + 1}: "${region.text}" (suggested: ${region.suggestion})\n`;
    });
  }

  return prompt;
}

// Extract topic from text content (simple heuristic)
function extractTopicFromText(text: string): string {
  // Look for title-like text (usually at the beginning)
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    if (firstLine.length < 100) {
      return firstLine;
    }
  }
  return 'General Knowledge';
}

// Detect subject from text content
function detectSubject(text: string): string {
  const lowerText = text.toLowerCase();
  
  // Subject keywords
  const subjectKeywords: Record<string, string[]> = {
    'Mathematics': ['algebra', 'equation', 'calculate', 'geometry', 'trigonometry', 'calculus', 'math', 'numbers'],
    'English': ['grammar', 'language', 'literature', 'essay', 'vocabulary', 'english', 'poem'],
    'Physics': ['force', 'energy', 'motion', 'wave', 'gravity', 'physics', 'velocity'],
    'Chemistry': ['atom', 'molecule', 'reaction', 'chemistry', 'element', 'compound'],
    'Biology': ['cell', 'organ', 'biology', 'organism', 'dna', 'photosynthesis'],
    'Geography': ['map', 'climate', 'location', 'geography', 'region', 'weather'],
    'History': ['history', 'war', 'century', 'ancient', 'historical', 'empire'],
    'Commerce': ['trade', 'business', 'commerce', 'market', 'economy'],
    'Economics': ['economy', 'price', 'demand', 'supply', 'market', 'cost'],
    'Civic Education': ['civic', 'citizen', 'government', 'rights', 'duties', 'nation'],
    'Digital Technology': ['computer', 'software', 'internet', 'digital', 'technology', 'code', 'programming']
  };
  
  for (const [subject, keywords] of Object.entries(subjectKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return subject;
    }
  }
  
  return 'General Knowledge';
}

// Generate questions from content (for mock)
function generateQuestionsFromContent(text: string, persona?: LearningPersona): Question[] {
  const questions: Question[] = [];
  
  // Sample question templates based on common patterns
  const templates = [
    {
      pattern: /(\w+)\s+=\s+(\w+)/g,
      cognitiveLevel: 'understand' as const,
      generate: (match: RegExpMatchArray) => ({
        text: `What is the value of ${match[1]} in the equation ${match[0]}?`,
        options: [match[2], '0', '1', match[2] + '2'],
        correctIndex: 0
      })
    },
    {
      pattern: /(\w+)\s+-\s+(\w+)\s+=\s+(\w+)/g,
      cognitiveLevel: 'apply' as const,
      generate: (match: RegExpMatchArray) => ({
        text: `Solve for the missing value: ${match[1]} - ? = ${match[3]}`,
        options: [match[2], match[3], String(Number(match[3]) + Number(match[2])), match[1]],
        correctIndex: 0
      })
    },
    {
      pattern: /solve/gi,
      cognitiveLevel: 'apply' as const,
      generate: () => ({
        text: 'What is the first step to solve this problem?',
        options: [
          'Identify known and unknown variables',
          'Memorize the formula',
          'Skip to the answer',
          'Ask for help immediately'
        ],
        correctIndex: 0
      })
    },
    {
      pattern: /example/gi,
      cognitiveLevel: 'understand' as const,
      generate: () => ({
        text: 'Based on the example given, what is the main concept being taught?',
        options: [
          'The principle demonstrated in the example',
          'A completely different topic',
          'Unrelated information',
          'Something not mentioned'
        ],
        correctIndex: 0
      })
    },
    {
      pattern: /practice/gi,
      cognitiveLevel: 'apply' as const,
      generate: () => ({
        text: 'What is the best approach to solve practice problems?',
        options: [
          'Apply the concepts learned from examples',
          'Guess randomly',
          'Copy from others',
          'Skip them'
        ],
        correctIndex: 0
      })
    }
  ];
  
  // Generate up to 10 questions using templates
  let questionCount = 0;
  const maxQuestions = 10;
  
  for (const template of templates) {
    if (questionCount >= maxQuestions) break;
    
    const matches = [...text.matchAll(template.pattern)];
    
    for (const match of matches) {
      if (questionCount >= maxQuestions) break;
      
      try {
        const generated = template.generate(match);
        
        questions.push({
          id: `q_${generateUniqueId()}_${questionCount}`,
          text: generated.text,
          options: generated.options.map((text: string, i: number) => ({
            id: String.fromCharCode(97 + i),
            text
          })),
          correctOptionId: String.fromCharCode(97 + generated.correctIndex),
          explanation: `This is correct based on the concepts covered in your notes.`,
          cognitiveLevel: template.cognitiveLevel
        });
        
        questionCount++;
      } catch (e) {
        // Skip invalid matches
      }
    }
  }
  
  // If we don't have enough questions, add general comprehension questions
  if (questions.length < 5) {
    const generalQuestions = [
      {
        text: 'What is the main topic covered in these notes?',
        options: ['The primary subject discussed', 'Unrelated content', 'Something else', 'Nothing specific'],
        correctIndex: 0
      },
      {
        text: 'How should you apply the knowledge from these notes?',
        options: ['Practice regularly', 'Ignore it', 'Memorize without understanding', 'Share without learning'],
        correctIndex: 0
      },
      {
        text: 'What is the key concept in this material?',
        options: ['The main principle explained', 'A minor detail', 'Something not covered', 'An error in the notes'],
        correctIndex: 0
      },
      {
        text: 'Based on the notes, what should you do next?',
        options: ['Review and practice', 'Forget it', 'Only read once', 'Skip the exercises'],
        correctIndex: 0
      },
      {
        text: 'What type of learner would benefit most from these notes?',
        options: ['Anyone willing to learn', 'Only visual learners', 'Only auditory learners', 'Those not studying'],
        correctIndex: 0
      }
    ];
    
    for (let i = questions.length; i < Math.min(generalQuestions.length, maxQuestions); i++) {
      const gq = generalQuestions[i - questions.length];
      questions.push({
        id: `q_${generateUniqueId()}_${i}`,
        text: gq.text,
        options: gq.options.map((text, idx) => ({
          id: String.fromCharCode(97 + idx),
          text
        })),
        correctOptionId: 'a',
        explanation: 'This answer is based on the general understanding of the material.',
        cognitiveLevel: 'understand'
      });
    }
  }
  
  return questions.slice(0, maxQuestions);
}

// Generate personalized study tips based on persona
function generateStudyTips(persona?: LearningPersona): StudyTip[] {
  if (!persona) {
    return [
      { title: 'Review Regularly', description: 'Go over your notes within 24 hours of writing them to improve retention.' },
      { title: 'Practice Active Recall', description: 'Test yourself on the key concepts instead of just re-reading.' },
      { title: 'Connect Concepts', description: 'Try to link new information with what you already know.' }
    ];
  }
  
  const { personaType = 'mixed', cognitiveProfile } = persona;
  const tips: StudyTip[] = [];
  
  // Persona-based tips
  switch (personaType) {
    case 'visual':
      tips.push(
        { title: 'Use Visual Aids', description: 'Create mind maps and diagrams to visualize the concepts from your notes.' },
        { title: 'Color Code', description: 'Use different colors for key points, definitions, and examples.' }
      );
      break;
    case 'auditory':
      tips.push(
        { title: 'Read Aloud', description: 'Read your notes out loud to reinforce learning.' },
        { title: 'Discuss with Others', description: 'Explain the concepts to a study partner or record yourself.' }
      );
      break;
    case 'kinesthetic':
      tips.push(
        { title: 'Practice Problems', description: 'Work through practice problems actively rather than just reading.' },
        { title: 'Take Breaks', description: 'Use short breaks with physical movement to stay focused.' }
      );
      break;
    case 'reading':
      tips.push(
        { title: 'Summarize', description: 'Write summaries of each section in your own words.' },
        { title: 'Highlight Key Points', description: 'Mark important concepts while reviewing.' }
      );
      break;
    default:
      tips.push(
        { title: 'Mixed Approach', description: 'Combine reading, writing, and practice to reinforce learning.' }
      );
  }
  
  // Cognitive profile tips
  if (cognitiveProfile) {
    const { attentionSpan = 30, memoryStrength = 'working' } = cognitiveProfile;
    
    if (attentionSpan < 20) {
      tips.push({
        title: 'Short Sessions',
        description: `Break your study into ${attentionSpan}-minute sessions with short breaks.`
      });
    }
    
    switch (memoryStrength) {
      case 'short_term':
        tips.push({
          title: 'Quick Review',
          description: 'Review material multiple times in shorter intervals for better retention.'
        });
        break;
      case 'long_term':
        tips.push({
          title: 'Spaced Repetition',
          description: 'Use spaced repetition - review at increasing intervals over days and weeks.'
        });
        break;
      case 'working':
        tips.push({
          title: 'Active Practice',
          description: 'Use working memory actively through problem-solving and application.'
        });
        break;
    }
  }
  
  // Always add a general tip
  tips.push({
    title: 'Stay Consistent',
    description: 'Study a little every day rather than cramming for better long-term retention.'
  });
  
  return tips.slice(0, 3);
}
