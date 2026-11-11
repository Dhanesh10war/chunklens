import { ChunkMetadata, ChunkingConfig } from '../types';
import { countTokens } from '../tokenizers/tokenizer';
import { createLengthFn, findChunkIndices, detectOrphan, splitOversizedText } from './utils';

// Common abbreviations that shouldn't trigger sentence splits
const ABBREVIATIONS = ['e.g.', 'i.e.', 'etc.', 'vs.', 'dr.', 'mr.', 'mrs.', 'ms.', 'prof.', 'inc.', 'ltd.', 'corp.', 'u.s.', 'u.k.'];

export function chunkSentence(text: string, config: ChunkingConfig): ChunkMetadata[] {
  if (!text || text.trim().length === 0) return [];

  const { chunkSize, chunkOverlap, unit, encoding } = config;
  const safeOverlap = Math.min(chunkOverlap, Math.max(0, chunkSize - 1));
  const lengthFn = createLengthFn(unit, encoding);

  // Split into sentences and paragraphs while respecting abbreviations
  const rawSegments = text.split(/\n+/).flatMap((line) => {
    const trimmed = line.trim();
    if (!trimmed) return [];

    // Tokenize line into sentence candidates
    const sentences: string[] = [];
    let current = '';
    const words = trimmed.split(/(\s+)/);

    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      current += w;

      const lowerTrimmed = current.trim().toLowerCase();
      const isAbbr = ABBREVIATIONS.some((abbr) => lowerTrimmed.endsWith(abbr));

      if (!isAbbr && /[.!?]$/.test(current.trim()) && i + 1 < words.length) {
        sentences.push(current.trim());
        current = '';
      }
    }

    if (current.trim()) {
      sentences.push(current.trim());
    }

    return sentences;
  });

  const rawChunks: string[] = [];
  let currentGroup: string[] = [];
  let currentGroupLen = 0;

  for (const sentence of rawSegments) {
    const sLen = lengthFn(sentence);

    if (sLen > chunkSize) {
      // Sentence itself exceeds chunkSize: flush buffer then subdivide oversized sentence
      if (currentGroup.length > 0) {
        rawChunks.push(currentGroup.join(' '));
        currentGroup = [];
        currentGroupLen = 0;
      }

      const subChunks = splitOversizedText(sentence, chunkSize, safeOverlap, unit, encoding);
      rawChunks.push(...subChunks);
      continue;
    }

    if (currentGroupLen + sLen + (currentGroup.length > 0 ? 1 : 0) <= chunkSize) {
      currentGroup.push(sentence);
      currentGroupLen += sLen + (currentGroup.length > 1 ? 1 : 0);
    } else {
      if (currentGroup.length > 0) {
        rawChunks.push(currentGroup.join(' '));

        // Retain trailing sentences that fit into safeOverlap
        const nextGroup: string[] = [];
        let nextGroupLen = 0;
        for (let i = currentGroup.length - 1; i >= 0; i--) {
          const s = currentGroup[i];
          const len = lengthFn(s);
          if (nextGroupLen + len + (nextGroup.length > 0 ? 1 : 0) <= safeOverlap) {
            nextGroup.unshift(s);
            nextGroupLen += len + (nextGroup.length > 1 ? 1 : 0);
          } else {
            break;
          }
        }
        currentGroup = nextGroup;
        currentGroupLen = nextGroupLen;
      }

      currentGroup.push(sentence);
      currentGroupLen += sLen + (currentGroup.length > 1 ? 1 : 0);
    }
  }

  if (currentGroup.length > 0) {
    rawChunks.push(currentGroup.join(' '));
  }

  // Map into structured ChunkMetadata with precise offsets
  let searchCursor = 0;
  return rawChunks.map((chunkText, idx) => {
    const { startCharIndex, endCharIndex, nextCursor } = findChunkIndices(text, chunkText, searchCursor);
    searchCursor = nextCursor;

    let actualOverlapChars = 0;
    if (idx > 0) {
      const prevChunk = rawChunks[idx - 1];
      const maxPossible = Math.min(prevChunk.length, chunkText.length);
      for (let len = maxPossible; len > 0; len--) {
        if (prevChunk.endsWith(chunkText.slice(0, len))) {
          actualOverlapChars = len;
          break;
        }
      }
    }

    return {
      id: `sent-${idx}`,
      index: idx,
      text: chunkText,
      startCharIndex,
      endCharIndex,
      charCount: chunkText.length,
      tokenCount: countTokens(chunkText, encoding),
      overlapPrevChars: actualOverlapChars > 0 ? actualOverlapChars : (idx > 0 ? safeOverlap : 0),
      overlapNextChars: idx < rawChunks.length - 1 ? safeOverlap : 0,
      isOrphan: detectOrphan(text, startCharIndex),
    };
  });
}
