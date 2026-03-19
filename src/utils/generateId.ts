/**
 * Generate a unique ID for quizzes and other entities
 * Uses timestamp + random string to ensure uniqueness
 */
export function generateUniqueId(prefix: string = 'id'): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 11);
  return `${prefix}_${timestamp}_${randomStr}`;
}

/**
 * Generate a unique quiz ID
 */
export function generateQuizId(): string {
  return generateUniqueId('quiz');
}

/**
 * Generate a unique attempt ID
 */
export function generateAttemptId(): string {
  return generateUniqueId('attempt');
}
