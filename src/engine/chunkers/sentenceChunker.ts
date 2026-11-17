import { ChunkMetadata, ChunkingConfig } from '../types';
import { countTokens } from '../tokenizers/tokenizer';
import { createLengthFn, detectOrphan, splitOversizedSpan } from './utils';

const ABBREVIATIONS = new Set([
  'e.g.',
  'i.e.',
  'etc.',
  'vs.',
  'dr.',
  'mr.',
  'mrs.',
  'ms.',
  'prof.',
  'inc.',
  'ltd.',
  'corp.',
  'u.s.',
  'u.k.',
]);

interface SentenceSpan {
  start: number;
  end: number;
}

/**
 * Identifies sentence spans with exact source character indices,
 * preserving verbatim source whitespace between sentences.
 */
function findSentenceSpans(text: string): SentenceSpan[] {
  const spans: SentenceSpan[] = [];
  let sentStart = 0;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];
    if (ch === '.' || ch === '?' || ch === '!') {
      // Find end of punctuation cluster (e.g. '...' or '?!!')
      let pEnd = i + 1;
      while (pEnd < text.length && (text[pEnd] === '.' || text[pEnd] === '?' || text[pEnd] === '!')) {
        pEnd++;
      }

      // Check if following character is whitespace or end of string
      const isFollowedByWhitespace = pEnd === text.length || /\s/.test(text[pEnd]);

      if (isFollowedByWhitespace) {
        // Extract preceding word to check against abbreviations
        const sliceBefore = text.slice(sentStart, pEnd).trim();
        const lastWord = sliceBefore.split(/\s+/).pop()?.toLowerCase() || '';

        if (!ABBREVIATIONS.has(lastWord)) {
          // Genuine sentence boundary: include trailing whitespace to partition the text
          let nextStart = pEnd;
          while (nextStart < text.length && /\s/.test(text[nextStart])) {
            nextStart++;
          }

          spans.push({ start: sentStart, end: nextStart });
          sentStart = nextStart;
          i = nextStart;
          continue;
        }
      }
      i = pEnd;
    } else {
      i++;
    }
  }

  if (sentStart < text.length) {
    spans.push({ start: sentStart, end: text.length });
  }

  return spans;
}

export function chunkSentence(text: string, config: ChunkingConfig): ChunkMetadata[] {
  if (!text || text.trim().length === 0) return [];

  const { chunkSize, chunkOverlap, unit, encoding } = config;
  const safeOverlap = Math.min(chunkOverlap, Math.max(0, chunkSize - 1));
  const lengthFn = createLengthFn(unit, encoding);

  // 1. Segment text into contiguous sentence spans that partition the source
  const rawSentenceSpans = findSentenceSpans(text);
  if (rawSentenceSpans.length === 0) return [];

  // 2. Subdivide any oversized sentences into sub-spans
  const atomicSpans: SentenceSpan[] = [];
  for (const s of rawSentenceSpans) {
    const sLen = lengthFn(text.slice(s.start, s.end));
    if (sLen > chunkSize) {
      const sub = splitOversizedSpan(text, s.start, s.end, chunkSize, safeOverlap, unit, encoding);
      for (const item of sub) {
        atomicSpans.push({ start: item.start, end: item.end });
      }
    } else {
      atomicSpans.push(s);
    }
  }

  // 3. Merge contiguous sentence spans into chunks <= chunkSize with safeOverlap
  const chunkSpans: SentenceSpan[] = [];
  let currentGroup: SentenceSpan[] = [];

  const getGroupLen = (group: SentenceSpan[]) => {
    if (group.length === 0) return 0;
    return lengthFn(text.slice(group[0].start, group[group.length - 1].end));
  };

  for (const span of atomicSpans) {
    if (currentGroup.length === 0) {
      currentGroup.push(span);
      continue;
    }

    const candidate = [...currentGroup, span];
    if (getGroupLen(candidate) <= chunkSize) {
      currentGroup = candidate;
    } else {
      // Flush currentGroup
      chunkSpans.push({
        start: currentGroup[0].start,
        end: currentGroup[currentGroup.length - 1].end,
      });

      // Retain trailing sentences for overlap
      const nextGroup: SentenceSpan[] = [];
      for (let i = currentGroup.length - 1; i >= 0; i--) {
        const testOverlap = [currentGroup[i], ...nextGroup];
        if (getGroupLen(testOverlap) <= safeOverlap) {
          nextGroup.unshift(currentGroup[i]);
        } else {
          break;
        }
      }

      currentGroup = [...nextGroup, span];
    }
  }

  if (currentGroup.length > 0) {
    chunkSpans.push({
      start: currentGroup[0].start,
      end: currentGroup[currentGroup.length - 1].end,
    });
  }

  // 4. Construct final ChunkMetadata with exact source character slices
  return chunkSpans.map((span, idx) => {
    const chunkText = text.slice(span.start, span.end);
    const prevSpan = chunkSpans[idx - 1];
    const nextSpan = chunkSpans[idx + 1];

    const overlapPrevChars = prevSpan ? Math.max(0, prevSpan.end - span.start) : 0;
    const overlapNextChars = nextSpan ? Math.max(0, span.end - nextSpan.start) : 0;

    return {
      id: `sentence-${idx}`,
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
