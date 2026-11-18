import { ChunkMetadata, ChunkingConfig } from '../types';
import { ChunkerOptions, resolveCountTokens, resolveTokenizer } from './context';
import { detectOrphan } from './utils';

export function chunkFixed(
  text: string,
  config: ChunkingConfig,
  options?: ChunkerOptions
): ChunkMetadata[] {
  if (!text || text.trim().length === 0) return [];

  const { chunkSize, chunkOverlap, unit, encoding } = config;
  const safeOverlap = Math.min(chunkOverlap, Math.max(0, chunkSize - 1));
  const step = Math.max(1, chunkSize - safeOverlap);

  const chunks: ChunkMetadata[] = [];
  const countFn = resolveCountTokens(encoding, options);

  if (unit === 'characters') {
    let start = 0;
    let index = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunkText = text.slice(start, end);

      const overlapPrev = index > 0 ? safeOverlap : 0;
      const overlapNext = end < text.length ? safeOverlap : 0;
      const isOrphan = detectOrphan(text, start);

      chunks.push({
        id: `fixed-${index}`,
        index,
        text: chunkText,
        startCharIndex: start,
        endCharIndex: end,
        charCount: chunkText.length,
        tokenCount: countFn(chunkText),
        overlapPrevChars: overlapPrev,
        overlapNextChars: overlapNext,
        isOrphan,
      });

      start += step;
      index++;

      if (end >= text.length) break;
    }
  } else {
    // Token-based fixed window
    const enc = resolveTokenizer(encoding, options);
    if (!enc) {
      // Fall back to character splitting if tokenizer not provided
      return chunkFixed(text, { ...config, unit: 'characters' }, options);
    }

    const tokens = enc.encode(text);
    let tokenStart = 0;
    let index = 0;

    while (tokenStart < tokens.length) {
      const tokenEnd = Math.min(tokenStart + chunkSize, tokens.length);
      const chunkTokens = tokens.slice(tokenStart, tokenEnd);
      const startCharIndex = enc.decode(tokens.slice(0, tokenStart)).length;
      const endCharIndex = enc.decode(tokens.slice(0, tokenEnd)).length;
      const chunkText = text.slice(startCharIndex, endCharIndex);

      let actualOverlapChars = 0;
      if (index > 0) {
        const prevText = chunks[index - 1].text;
        const maxPossible = Math.min(prevText.length, chunkText.length);
        for (let len = maxPossible; len > 0; len--) {
          if (prevText.endsWith(chunkText.slice(0, len))) {
            actualOverlapChars = len;
            break;
          }
        }
      }

      chunks.push({
        id: `fixed-token-${index}`,
        index,
        text: chunkText,
        startCharIndex,
        endCharIndex,
        charCount: chunkText.length,
        tokenCount: chunkTokens.length,
        overlapPrevChars: actualOverlapChars > 0 ? actualOverlapChars : (index > 0 ? safeOverlap : 0),
        overlapNextChars: tokenEnd < tokens.length ? safeOverlap : 0,
        isOrphan: detectOrphan(text, startCharIndex),
      });

      tokenStart += step;
      index++;

      if (tokenEnd >= tokens.length) break;
    }
  }

  return chunks;
}
