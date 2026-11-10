import { getEncoding, Tiktoken } from 'js-tiktoken';
import { TokenizerEncoding } from '../types';

// Cache encoding instances to avoid repeated initialization overhead
const encodingCache: Partial<Record<TokenizerEncoding, Tiktoken>> = {};

export function getTokenizer(encoding: TokenizerEncoding = 'o200k_base'): Tiktoken {
  if (!encodingCache[encoding]) {
    try {
      encodingCache[encoding] = getEncoding(encoding);
    } catch {
      // Fallback to cl100k_base if o200k_base fails
      try {
        encodingCache[encoding] = getEncoding('cl100k_base');
      } catch (err) {
        console.error('Failed to initialize tokenizer encoding:', err);
        throw err;
      }
    }
  }
  return encodingCache[encoding]!;
}

/**
 * Counts exact BPE tokens for given text
 */
export function countTokens(text: string, encoding: TokenizerEncoding = 'o200k_base'): number {
  if (!text) return 0;
  try {
    const enc = getTokenizer(encoding);
    return enc.encode(text).length;
  } catch (e) {
    // Fallback heuristic: roughly ~4 chars per token if tokenizer encounters unhandled edge
    console.warn('Tokenizer fallback count used:', e);
    return Math.ceil(text.length / 4);
  }
}

/**
 * Slices text up to maxTokens using the BPE tokenizer
 */
export function truncateByTokens(text: string, maxTokens: number, encoding: TokenizerEncoding = 'o200k_base'): string {
  if (!text || maxTokens <= 0) return '';
  try {
    const enc = getTokenizer(encoding);
    const tokens = enc.encode(text);
    if (tokens.length <= maxTokens) return text;
    const truncatedTokens = tokens.slice(0, maxTokens);
    return enc.decode(truncatedTokens);
  } catch {
    return text.slice(0, maxTokens * 4);
  }
}
