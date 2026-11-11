import { ChunkMetadata, ChunkingConfig } from '../types';
import { countTokens } from '../tokenizers/tokenizer';
import { createLengthFn, findChunkIndices, detectOrphan, splitOversizedText } from './utils';

const DEFAULT_SEPARATORS = ['\n\n', '\n', '. ', ' ', ''];

export function chunkRecursive(text: string, config: ChunkingConfig): ChunkMetadata[] {
  if (!text || text.trim().length === 0) return [];

  const { chunkSize, chunkOverlap, unit, encoding } = config;
  const safeOverlap = Math.min(chunkOverlap, Math.max(0, chunkSize - 1));
  const separators = config.separators && config.separators.length > 0 ? config.separators : DEFAULT_SEPARATORS;

  const lengthFn = createLengthFn(unit, encoding);

  // Split recursively using separators
  function splitText(currentText: string, currentSeparators: string[]): string[] {
    const finalChunks: string[] = [];
    if (!currentText) return finalChunks;

    // Pick separator
    let separator = currentSeparators[currentSeparators.length - 1];
    let newSeparators: string[] = [];

    for (let i = 0; i < currentSeparators.length; i++) {
      const s = currentSeparators[i];
      if (s === '' || currentText.includes(s)) {
        separator = s;
        newSeparators = currentSeparators.slice(i + 1);
        break;
      }
    }

    const splits = separator === '' ? currentText.split('') : currentText.split(separator);
    const goodSplits: string[] = [];

    for (const s of splits) {
      if (s) {
        goodSplits.push(s);
      }
    }

    // Merge splits back into chunks <= chunkSize
    let currentDoc: string[] = [];
    let totalLen = 0;

    for (const piece of goodSplits) {
      const pieceLen = lengthFn(piece);

      if (totalLen + pieceLen + (currentDoc.length > 0 ? lengthFn(separator) : 0) <= chunkSize) {
        currentDoc.push(piece);
        totalLen += pieceLen + (currentDoc.length > 1 ? lengthFn(separator) : 0);
      } else {
        if (currentDoc.length > 0) {
          const doc = currentDoc.join(separator);
          if (doc.trim()) {
            finalChunks.push(doc);
          }
          // Handle overlap: retain trailing items from currentDoc that fit within safeOverlap
          while (
            currentDoc.length > 0 &&
            (totalLen > safeOverlap || totalLen + pieceLen + (currentDoc.length > 0 ? lengthFn(separator) : 0) > chunkSize)
          ) {
            const popped = currentDoc.shift();
            if (popped) {
              totalLen -= lengthFn(popped) + (currentDoc.length > 0 ? lengthFn(separator) : 0);
            }
          }
        }

        if (pieceLen > chunkSize) {
          // Piece itself is too large, recurse with remaining separators
          if (newSeparators.length > 0) {
            const subChunks = splitText(piece, newSeparators);
            finalChunks.push(...subChunks);
          } else {
            // No more separators: strictly split using oversized utility respecting unit (tokens or chars)
            const subChunks = splitOversizedText(piece, chunkSize, safeOverlap, unit, encoding);
            finalChunks.push(...subChunks);
          }
        } else {
          currentDoc.push(piece);
          totalLen += pieceLen + (currentDoc.length > 1 ? lengthFn(separator) : 0);
        }
      }
    }

    if (currentDoc.length > 0) {
      const remaining = currentDoc.join(separator);
      if (remaining.trim()) {
        finalChunks.push(remaining);
      }
    }

    return finalChunks;
  }

  const rawChunks = splitText(text, separators);

  // Map into structured ChunkMetadata with precise offsets
  let searchCursor = 0;
  return rawChunks.map((chunkStr, idx) => {
    const { startCharIndex, endCharIndex, nextCursor } = findChunkIndices(text, chunkStr, searchCursor);
    searchCursor = nextCursor;

    // Calculate actual overlap with previous chunk if any
    let actualOverlapChars = 0;
    if (idx > 0) {
      const prevChunk = rawChunks[idx - 1];
      // Check common overlap length
      const maxPossibleOverlap = Math.min(prevChunk.length, chunkStr.length);
      for (let len = maxPossibleOverlap; len > 0; len--) {
        if (prevChunk.endsWith(chunkStr.slice(0, len))) {
          actualOverlapChars = len;
          break;
        }
      }
    }

    return {
      id: `recursive-${idx}`,
      index: idx,
      text: chunkStr,
      startCharIndex,
      endCharIndex,
      charCount: chunkStr.length,
      tokenCount: countTokens(chunkStr, encoding),
      overlapPrevChars: actualOverlapChars > 0 ? actualOverlapChars : (idx > 0 ? safeOverlap : 0),
      overlapNextChars: idx < rawChunks.length - 1 ? safeOverlap : 0,
      isOrphan: detectOrphan(text, startCharIndex),
    };
  });
}
