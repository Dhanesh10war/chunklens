import { ChunkUnit, TokenizerEncoding } from '../types';
import { countTokens, getTokenizer } from '../tokenizers/tokenizer';

/**
 * Creates a length function measuring either tokens or character count
 */
export function createLengthFn(unit: ChunkUnit, encoding: TokenizerEncoding): (text: string) => number {
  return (text: string) => (unit === 'tokens' ? countTokens(text, encoding) : text.length);
}

/**
 * Finds the starting and ending character index of chunkText within fullText,
 * starting the search from searchCursor to avoid ambiguity with repeating substrings.
 */
export function findChunkIndices(
  fullText: string,
  chunkText: string,
  searchCursor: number
): { startCharIndex: number; endCharIndex: number; nextCursor: number } {
  if (!chunkText || !fullText) {
    return { startCharIndex: -1, endCharIndex: -1, nextCursor: searchCursor };
  }

  let startChar = fullText.indexOf(chunkText, searchCursor);
  if (startChar === -1) {
    // Fall back to searching from start if cursor passed it (e.g. Due to complex overlap)
    startChar = fullText.indexOf(chunkText, 0);
  }

  const endChar = startChar !== -1 ? startChar + chunkText.length : -1;
  const nextCursor = startChar !== -1 ? Math.max(searchCursor, startChar + 1) : searchCursor;

  return { startCharIndex: startChar, endCharIndex: endChar, nextCursor };
}

/**
 * Checks if a chunk start position falls mid-word
 */
export function detectOrphan(fullText: string, startCharIndex: number): boolean {
  if (startCharIndex <= 0 || startCharIndex >= fullText.length) return false;
  return /\w/.test(fullText[startCharIndex - 1]) && /\w/.test(fullText[startCharIndex]);
}

/**
 * Splits an oversized piece of text that cannot be subdivided further by separators,
 * strictly honoring chunkSize and chunkOverlap for either tokens or character units.
 */
export function splitOversizedText(
  text: string,
  chunkSize: number,
  chunkOverlap: number,
  unit: ChunkUnit,
  encoding: TokenizerEncoding
): string[] {
  if (!text) return [];

  const safeOverlap = Math.min(chunkOverlap, Math.max(0, chunkSize - 1));
  const step = Math.max(1, chunkSize - safeOverlap);

  if (unit === 'characters') {
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push(text.slice(start, end));
      start += step;
      if (end >= text.length) break;
    }
    return chunks;
  }

  // Token-based oversized splitting
  const enc = getTokenizer(encoding);
  const tokens = enc.encode(text);
  if (tokens.length <= chunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let tokenStart = 0;

  while (tokenStart < tokens.length) {
    const tokenEnd = Math.min(tokenStart + chunkSize, tokens.length);
    const subTokens = tokens.slice(tokenStart, tokenEnd);
    chunks.push(enc.decode(subTokens));
    tokenStart += step;
    if (tokenEnd >= tokens.length) break;
  }

  return chunks;
}
