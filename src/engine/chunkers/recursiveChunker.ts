import { ChunkMetadata, ChunkingConfig } from '../types';
import { countTokens } from '../tokenizers/tokenizer';
import { createLengthFn, detectOrphan, splitOversizedSpan } from './utils';

const DEFAULT_SEPARATORS = ['\n\n', '\n', '. ', ' ', ''];

interface Span {
  start: number;
  end: number;
}

export function chunkRecursive(text: string, config: ChunkingConfig): ChunkMetadata[] {
  if (!text || text.trim().length === 0) return [];

  const { chunkSize, chunkOverlap, unit, encoding } = config;
  const safeOverlap = Math.min(chunkOverlap, Math.max(0, chunkSize - 1));
  const separators = config.separators && config.separators.length > 0 ? config.separators : DEFAULT_SEPARATORS;
  const lengthFn = createLengthFn(unit, encoding);

  /**
   * Recursively splits a [start, end] span into sub-spans using separator hierarchy,
   * guaranteeing that every sub-span is an exact slice of source text.
   */
  function splitSpan(start: number, end: number, currentSeparators: string[]): Span[] {
    if (start >= end) return [];

    const spanText = text.slice(start, end);
    const spanLen = lengthFn(spanText);

    if (spanLen <= chunkSize) {
      return [{ start, end }];
    }

    // Pick the first matching separator
    let separator = currentSeparators[currentSeparators.length - 1];
    let nextSeparators: string[] = [];

    for (let i = 0; i < currentSeparators.length; i++) {
      const s = currentSeparators[i];
      if (s === '' || spanText.includes(s)) {
        separator = s;
        nextSeparators = currentSeparators.slice(i + 1);
        break;
      }
    }

    if (separator === '') {
      // Split character-by-character or token-by-token
      const oversized = splitOversizedSpan(text, start, end, chunkSize, safeOverlap, unit, encoding);
      return oversized.map((o) => ({ start: o.start, end: o.end }));
    }

    // Split spanText by separator into segments
    const pieces: Span[] = [];
    let searchIdx = 0;

    while (searchIdx < spanText.length) {
      const matchIdx = spanText.indexOf(separator, searchIdx);
      if (matchIdx === -1) {
        if (searchIdx < spanText.length) {
          pieces.push({ start: start + searchIdx, end });
        }
        break;
      }

      if (matchIdx > searchIdx) {
        pieces.push({ start: start + searchIdx, end: start + matchIdx });
      }

      searchIdx = matchIdx + separator.length;
    }

    // If no pieces were created (e.g. text consists only of separators)
    if (pieces.length === 0) {
      return [{ start, end }];
    }

    // Recurse on any piece that still exceeds chunkSize
    const result: Span[] = [];
    for (const piece of pieces) {
      const pLen = lengthFn(text.slice(piece.start, piece.end));
      if (pLen > chunkSize) {
        if (nextSeparators.length > 0) {
          result.push(...splitSpan(piece.start, piece.end, nextSeparators));
        } else {
          const oversized = splitOversizedSpan(text, piece.start, piece.end, chunkSize, safeOverlap, unit, encoding);
          result.push(...oversized.map((o) => ({ start: o.start, end: o.end })));
        }
      } else {
        result.push(piece);
      }
    }

    return result;
  }

  // 1. Obtain atomic sub-spans that partition the source text
  const atomicPieces = splitSpan(0, text.length, separators);
  if (atomicPieces.length === 0) return [];

  // 2. Merge contiguous sub-spans into chunks up to chunkSize, preserving safeOverlap
  const rawSpans: Span[] = [];
  let currentGroup: Span[] = [];

  const getGroupLen = (group: Span[]) => {
    if (group.length === 0) return 0;
    return lengthFn(text.slice(group[0].start, group[group.length - 1].end));
  };

  for (const piece of atomicPieces) {
    if (currentGroup.length === 0) {
      currentGroup.push(piece);
      continue;
    }

    const testGroup = [...currentGroup, piece];
    const testLen = getGroupLen(testGroup);

    if (testLen <= chunkSize) {
      currentGroup = testGroup;
    } else {
      // Flush currentGroup
      rawSpans.push({
        start: currentGroup[0].start,
        end: currentGroup[currentGroup.length - 1].end,
      });

      // Retain trailing pieces for overlap
      const nextGroup: Span[] = [];
      for (let i = currentGroup.length - 1; i >= 0; i--) {
        const candidateGroup = [currentGroup[i], ...nextGroup];
        if (getGroupLen(candidateGroup) <= safeOverlap) {
          nextGroup.unshift(currentGroup[i]);
        } else {
          break;
        }
      }

      currentGroup = [...nextGroup, piece];
    }
  }

  if (currentGroup.length > 0) {
    rawSpans.push({
      start: currentGroup[0].start,
      end: currentGroup[currentGroup.length - 1].end,
    });
  }

  // 3. Build final ChunkMetadata with exact source character slices
  return rawSpans.map((span, idx) => {
    const chunkText = text.slice(span.start, span.end);
    const prevSpan = rawSpans[idx - 1];
    const nextSpan = rawSpans[idx + 1];

    const overlapPrevChars = prevSpan ? Math.max(0, prevSpan.end - span.start) : 0;
    const overlapNextChars = nextSpan ? Math.max(0, span.end - nextSpan.start) : 0;

    return {
      id: `recursive-${idx}`,
      index: idx,
      text: chunkText,
      startCharIndex: span.start,
      endCharIndex: span.end,
      charCount: chunkText.length,
      tokenCount: countTokens(chunkText, encoding),
      overlapPrevChars,
      overlapNextChars,
      isOrphan: detectOrphan(text, span.start),
    };
  });
}
