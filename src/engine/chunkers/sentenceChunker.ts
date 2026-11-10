import { ChunkMetadata, ChunkingConfig } from '../types';
import { countTokens } from '../tokenizers/tokenizer';

export function chunkSentence(text: string, config: ChunkingConfig): ChunkMetadata[] {
  if (!text || text.trim().length === 0) return [];

  const { chunkSize, chunkOverlap, unit, encoding } = config;
  const lengthFn = (str: string) => (unit === 'tokens' ? countTokens(str, encoding) : str.length);

  // Split into sentences using regex protecting common abbreviations (e.g., i.e., Dr., vs.)
  const rawSentences = text
    .replace(/([.!?])\s+(?=[A-Z0-9"'])/g, '$1|__SPLIT__|')
    .split('|__SPLIT__|')
    .map(s => s.trim())
    .filter(Boolean);

  const chunks: ChunkMetadata[] = [];
  let currentGroup: string[] = [];
  let currentGroupLen = 0;
  let chunkIdx = 0;

  for (const sentence of rawSentences) {
    const sLen = lengthFn(sentence);

    if (currentGroupLen + sLen + (currentGroup.length > 0 ? 1 : 0) <= chunkSize) {
      currentGroup.push(sentence);
      currentGroupLen += sLen + 1;
    } else {
      if (currentGroup.length > 0) {
        const chunkText = currentGroup.join(' ');
        const start = text.indexOf(chunkText);
        chunks.push({
          id: `sent-${chunkIdx}`,
          index: chunkIdx,
          text: chunkText,
          startCharIndex: start,
          endCharIndex: start !== -1 ? start + chunkText.length : -1,
          charCount: chunkText.length,
          tokenCount: countTokens(chunkText, encoding),
          overlapPrevChars: chunkIdx > 0 ? chunkOverlap : 0,
          overlapNextChars: chunkOverlap,
          isOrphan: false,
        });
        chunkIdx++;

        // Overlap: retain last sentence if it fits within overlap
        if (chunkOverlap > 0 && currentGroup.length > 1) {
          const lastSentence = currentGroup[currentGroup.length - 1];
          currentGroup = [lastSentence];
          currentGroupLen = lengthFn(lastSentence);
        } else {
          currentGroup = [];
          currentGroupLen = 0;
        }
      }

      currentGroup.push(sentence);
      currentGroupLen += sLen;
    }
  }

  if (currentGroup.length > 0) {
    const chunkText = currentGroup.join(' ');
    const start = text.indexOf(chunkText);
    chunks.push({
      id: `sent-${chunkIdx}`,
      index: chunkIdx,
      text: chunkText,
      startCharIndex: start,
      endCharIndex: start !== -1 ? start + chunkText.length : -1,
      charCount: chunkText.length,
      tokenCount: countTokens(chunkText, encoding),
      overlapPrevChars: chunkIdx > 0 ? chunkOverlap : 0,
      overlapNextChars: 0,
      isOrphan: false,
    });
  }

  return chunks;
}
