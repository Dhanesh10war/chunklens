import { ChunkMetadata, ChunkingConfig } from '../types';
import { countTokens, getTokenizer } from '../tokenizers/tokenizer';
import { findChunkIndices, detectOrphan } from './utils';

export function chunkFixed(text: string, config: ChunkingConfig): ChunkMetadata[] {
  if (!text || text.trim().length === 0) return [];

  const { chunkSize, chunkOverlap, unit, encoding } = config;
  const safeOverlap = Math.min(chunkOverlap, Math.max(0, chunkSize - 1));
  const step = Math.max(1, chunkSize - safeOverlap);

  const chunks: ChunkMetadata[] = [];

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
        tokenCount: countTokens(chunkText, encoding),
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
    const enc = getTokenizer(encoding);
    const tokens = enc.encode(text);
    let tokenStart = 0;
    let index = 0;
    let searchCursor = 0;

    while (tokenStart < tokens.length) {
      const tokenEnd = Math.min(tokenStart + chunkSize, tokens.length);
      const chunkTokens = tokens.slice(tokenStart, tokenEnd);
      const chunkText = enc.decode(chunkTokens);

      const { startCharIndex, endCharIndex, nextCursor } = findChunkIndices(text, chunkText, searchCursor);
      searchCursor = nextCursor;

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
