import { Quiz } from '../db/database';

// Sample quiz data for offline testing
// In Phase 3, this will be replaced with NERDC curriculum data

export const sampleQuizzes: Quiz[] = [
  {
    id: 1,
    quizId: 'math_algebra_001',
    subject: 'Mathematics',
    topic: 'Algebra - Linear Equations',
    grade: 'SSS1',
    points: 100,
    gems: 4,
    difficulty: 'medium',
    source: 'curriculum',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    questions: [
      {
        id: 'q1',
        text: 'Solve for x: 2x + 5 = 15',
        options: [
          { id: 'a', text: 'x = 5' },
          { id: 'b', text: 'x = 10' },
          { id: 'c', text: 'x = 7.5' },
          { id: 'd', text: 'x = 4' }
        ],
        correctOptionId: 'a',
        explanation: '2x + 5 = 15\n2x = 15 - 5\n2x = 10\nx = 10/2 = 5',
        hint: 'Start by isolating the term with x on one side. Subtract 5 from both sides first.',
        cognitiveLevel: 'apply'
      },
      {
        id: 'q2',
        text: 'If y = 3x - 2, what is the value of y when x = 4?',
        options: [
          { id: 'a', text: '10' },
          { id: 'b', text: '12' },
          { id: 'c', text: '14' },
          { id: 'd', text: '8' }
        ],
        correctOptionId: 'a',
        explanation: 'y = 3(4) - 2 = 12 - 2 = 10',
        hint: 'Simply substitute x = 4 into the equation and calculate.',
        cognitiveLevel: 'apply'
      },
      {
        id: 'q3',
        text: 'Simplify: 3(x + 2) - 2(x - 1)',
        options: [
          { id: 'a', text: 'x + 8' },
          { id: 'b', text: 'x + 4' },
          { id: 'c', text: '5x + 8' },
          { id: 'd', text: '5x + 4' }
        ],
        correctOptionId: 'a',
        explanation: '3x + 6 - 2x + 2 = x + 8',
        hint: 'Distribute the numbers outside the brackets to each term inside, then combine like terms.',
        cognitiveLevel: 'apply'
      },
      {
        id: 'q4',
        text: 'What is the gradient of the line y = 2x + 3?',
        options: [
          { id: 'a', text: '2' },
          { id: 'b', text: '3' },
          { id: 'c', text: '1' },
          { id: 'd', text: '-2' }
        ],
        correctOptionId: 'a',
        explanation: 'In y = mx + c form, m is the gradient. Here m = 2',
        hint: 'Remember the slope-intercept form y = mx + c, where m is the coefficient of x.',
        cognitiveLevel: 'understand'
      },
      {
        id: 'q5',
        text: 'Solve: 3(x - 1) = 2(x + 3)',
        options: [
          { id: 'a', text: 'x = 9' },
          { id: 'b', text: 'x = 6' },
          { id: 'c', text: 'x = 3' },
          { id: 'd', text: 'x = 12' }
        ],
        correctOptionId: 'a',
        explanation: '3x - 3 = 2x + 6\n3x - 2x = 6 + 3\nx = 9',
        hint: 'First expand both sides, then get all x terms on one side.',
        cognitiveLevel: 'apply'
      }
    ]
  },
  {
    id: 2,
    quizId: 'english_grammar_001',
    subject: 'English',
    topic: 'Grammar - Parts of Speech',
    grade: 'SSS1',
    points: 75,
    gems: 3,
    difficulty: 'easy',
    source: 'curriculum',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    questions: [
      {
        id: 'q1',
        text: 'Identify the noun in the sentence: "The quick brown fox jumps over the lazy dog."',
        options: [
          { id: 'a', text: 'quick' },
          { id: 'b', text: 'fox' },
          { id: 'c', text: 'jumps' },
          { id: 'd', text: 'lazy' }
        ],
        correctOptionId: 'b',
        explanation: 'A noun is a person, place, thing, or idea. "fox" is a thing (animal).',
        hint: 'Look for words that represent a person, place, thing, or idea. Adjectives describe nouns.',
        cognitiveLevel: 'understand'
      },
      {
        id: 'q2',
        text: 'Which word is an adjective in: "She wore a beautiful red dress."?',
        options: [
          { id: 'a', text: 'wore' },
          { id: 'b', text: 'beautiful' },
          { id: 'c', text: 'dress' },
          { id: 'd', text: 'She' }
        ],
        correctOptionId: 'b',
        explanation: 'An adjective describes a noun. "beautiful" describes the dress.',
        hint: 'Adjectives modify nouns by describing or giving more information about them.',
        cognitiveLevel: 'understand'
      },
      {
        id: 'q3',
        text: 'What is the verb in: "The children played in the park"?',
        options: [
          { id: 'a', text: 'children' },
          { id: 'b', text: 'park' },
          { id: 'c', text: 'played' },
          { id: 'd', text: 'in' }
        ],
        correctOptionId: 'c',
        explanation: 'A verb expresses action or state of being. "played" is the action.',
        hint: 'Verbs are action words - they tell us what someone or something does.',
        cognitiveLevel: 'remember'
      }
    ]
  },
  {
    id: 3,
    quizId: 'biology_cell_001',
    subject: 'Biology',
    topic: 'Cell Biology - Cell Structure',
    grade: 'SSS1',
    points: 80,
    gems: 4,
    difficulty: 'medium',
    source: 'curriculum',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    questions: [
      {
        id: 'q1',
        text: 'Which organelle is known as the "powerhouse" of the cell?',
        options: [
          { id: 'a', text: 'Nucleus' },
          { id: 'b', text: 'Mitochondria' },
          { id: 'c', text: 'Ribosome' },
          { id: 'd', text: 'Golgi apparatus' }
        ],
        correctOptionId: 'b',
        explanation: 'Mitochondria produce ATP through cellular respiration, providing energy for the cell.',
        hint: 'Think about which organelle is responsible for producing energy (ATP) for the cell.',
        cognitiveLevel: 'remember'
      },
      {
        id: 'q2',
        text: 'What is the function of the nucleus?',
        options: [
          { id: 'a', text: 'Energy production' },
          { id: 'b', text: 'Protein synthesis' },
          { id: 'c', text: 'Cellular respiration' },
          { id: 'd', text: 'Contains genetic material' }
        ],
        correctOptionId: 'd',
        explanation: 'The nucleus contains the cell\'s DNA and controls cell activities.',
        hint: 'This organelle houses the cell\'s genetic information (DNA) and acts as the control center.',
        cognitiveLevel: 'understand'
      }
    ]
  }
];

// Function to seed the database with sample quizzes
export async function seedSampleQuizzes() {
  const { db } = await import('../db/database');
  const existingQuizzes = await db.quizzes.count();
  
  if (existingQuizzes === 0) {
    await db.quizzes.bulkAdd(sampleQuizzes);
    console.log('Sample quizzes seeded successfully');
  }
}
