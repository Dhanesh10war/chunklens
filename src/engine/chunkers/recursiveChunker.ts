import { ChunkMetadata, ChunkingConfig } from '../types';
import { countTokens } from '../tokenizers/tokenizer';

const DEFAULT_SEPARATORS = ['\n\n', '\n', '. ', ' ', ''];

export function chunkRecursive(text: string, config: ChunkingConfig): ChunkMetadata[] {
  if (!text || text.trim().length === 0) return [];

  const { chunkSize, chunkOverlap, unit, encoding } = config;
  const separators = config.separators && config.separators.length > 0 ? config.separators : DEFAULT_SEPARATORS;

  const lengthFn = (str: string) => (unit === 'tokens' ? countTokens(str, encoding) : str.length);

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
          // Handle overlap: keep last items from currentDoc that fit within chunkOverlap
          while (
            currentDoc.length > 0 &&
            (totalLen > chunkOverlap || totalLen + pieceLen > chunkSize)
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
            // No more separators, hard-slice piece
            let subStart = 0;
            while (subStart < piece.length) {
              finalChunks.push(piece.slice(subStart, subStart + chunkSize));
              subStart += Math.max(1, chunkSize - chunkOverlap);
            }
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

  // Map into structured ChunkMetadata with offsets
  let searchCursor = 0;
  return rawChunks.map((chunkStr, idx) => {
    let startChar = text.indexOf(chunkStr, searchCursor);
    if (startChar === -1) {
      startChar = text.indexOf(chunkStr);
    }
    const endChar = startChar !== -1 ? startChar + chunkStr.length : -1;
    if (startChar !== -1) {
      searchCursor = Math.max(searchCursor, startChar + 1);
    }

    return {
      id: `recursive-${idx}`,
      index: idx,
      text: chunkStr,
      startCharIndex: startChar,
      endCharIndex: endChar,
      charCount: chunkStr.length,
      tokenCount: countTokens(chunkStr, encoding),
      overlapPrevChars: idx > 0 ? chunkOverlap : 0,
      overlapNextChars: idx < rawChunks.length - 1 ? chunkOverlap : 0,
      isOrphan: startChar > 0 && /\w/.test(text[startChar - 1]) && /\w/.test(text[startChar]),
    };
  });
}
