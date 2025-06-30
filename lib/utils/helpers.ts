import crypto from 'crypto';

/**
 * Generate SHA256 hash for text + language
 */
export function generateHash(text: string, language: string): string {
  const combinedString = `${text.trim().toLowerCase()}-${language.trim().toLowerCase()}`;
  return crypto.createHash('sha256').update(combinedString).digest('hex');
}

/**
 * Sleep utility for rate limiting
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Chunk array into smaller arrays
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}