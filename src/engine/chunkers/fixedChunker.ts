import { ChunkMetadata, ChunkingConfig } from '../types';
import { countTokens, getTokenizer } from '../tokenizers/tokenizer';

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

      // Check if chunk starts mid-word
      const isOrphan = start > 0 && /\w/.test(text[start - 1]) && /\w/.test(text[start]);

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

    while (tokenStart < tokens.length) {
      const tokenEnd = Math.min(tokenStart + chunkSize, tokens.length);
      const chunkTokens = tokens.slice(tokenStart, tokenEnd);
      const chunkText = enc.decode(chunkTokens);

      const overlapTokens = Math.min(safeOverlap, chunkTokens.length);

      chunks.push({
        id: `fixed-token-${index}`,
        index,
        text: chunkText,
        startCharIndex: -1, // approximate for token slice
        endCharIndex: -1,
        charCount: chunkText.length,
        tokenCount: chunkTokens.length,
        overlapPrevChars: index > 0 ? overlapTokens : 0,
        overlapNextChars: tokenEnd < tokens.length ? overlapTokens : 0,
        isOrphan: false,
      });

      tokenStart += step;
      index++;

      if (tokenEnd >= tokens.length) break;
    }
  }

  return chunks;
}
