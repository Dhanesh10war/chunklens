import { ChunkMetadata, ChunkingConfig } from '../types';
import { countTokens } from '../tokenizers/tokenizer';

interface MarkdownSection {
  header: string;
  level: number;
  content: string;
}

export function chunkMarkdown(text: string, config: ChunkingConfig): ChunkMetadata[] {
  if (!text || text.trim().length === 0) return [];

  const { chunkSize, chunkOverlap, unit, encoding } = config;
  const lengthFn = (str: string) => (unit === 'tokens' ? countTokens(str, encoding) : str.length);

  // Line-by-line parser tracking headers and fenced code blocks
  const lines = text.split('\n');
  const sections: MarkdownSection[] = [];
  let currentHeader = 'Introduction';
  let currentLevel = 1;
  let currentLines: string[] = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      currentLines.push(line);
      continue;
    }

    if (!inCodeBlock && /^#{1,6}\s+/.test(line)) {
      if (currentLines.length > 0) {
        sections.push({
          header: currentHeader,
          level: currentLevel,
          content: currentLines.join('\n'),
        });
        currentLines = [];
      }

      const match = line.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        currentLevel = match[1].length;
        currentHeader = match[2].trim();
      }
      currentLines.push(line);
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0) {
    sections.push({
      header: currentHeader,
      level: currentLevel,
      content: currentLines.join('\n'),
    });
  }

  // Now create chunks from sections, breaking oversized sections if necessary
  const chunks: ChunkMetadata[] = [];
  let chunkIndex = 0;

  for (const section of sections) {
    const sectionText = section.content;
    const sectionLen = lengthFn(sectionText);

    if (sectionLen <= chunkSize) {
      if (sectionText.trim()) {
        const start = text.indexOf(sectionText);
        chunks.push({
          id: `md-${chunkIndex}`,
          index: chunkIndex,
          text: sectionText,
          startCharIndex: start,
          endCharIndex: start !== -1 ? start + sectionText.length : -1,
          charCount: sectionText.length,
          tokenCount: countTokens(sectionText, encoding),
          overlapPrevChars: chunkIndex > 0 ? chunkOverlap : 0,
          overlapNextChars: chunkOverlap,
          isOrphan: false,
          sectionHeader: section.header,
        });
        chunkIndex++;
      }
    } else {
      // Split section by paragraphs or lines without breaking code fences
      const paragraphs = sectionText.split(/\n\s*\n/);
      let buffer: string[] = [];
      let bufferLen = 0;

      for (const p of paragraphs) {
        const pLen = lengthFn(p);
        if (bufferLen + pLen <= chunkSize) {
          buffer.push(p);
          bufferLen += pLen;
        } else {
          if (buffer.length > 0) {
            const chunkStr = buffer.join('\n\n');
            const start = text.indexOf(chunkStr);
            chunks.push({
              id: `md-${chunkIndex}`,
              index: chunkIndex,
              text: chunkStr,
              startCharIndex: start,
              endCharIndex: start !== -1 ? start + chunkStr.length : -1,
              charCount: chunkStr.length,
              tokenCount: countTokens(chunkStr, encoding),
              overlapPrevChars: chunkIndex > 0 ? chunkOverlap : 0,
              overlapNextChars: chunkOverlap,
              isOrphan: false,
              sectionHeader: section.header,
            });
            chunkIndex++;
            buffer = [];
            bufferLen = 0;
          }

          if (pLen > chunkSize) {
            // Hard split paragraph
            const words = p.split(' ');
            let wordBuffer: string[] = [];
            let wordBufferLen = 0;
            for (const w of words) {
              const wLen = lengthFn(w);
              if (wordBufferLen + wLen <= chunkSize) {
                wordBuffer.push(w);
                wordBufferLen += wLen + 1;
              } else {
                if (wordBuffer.length > 0) {
                  const chunkStr = wordBuffer.join(' ');
                  const start = text.indexOf(chunkStr);
                  chunks.push({
                    id: `md-${chunkIndex}`,
                    index: chunkIndex,
                    text: chunkStr,
                    startCharIndex: start,
                    endCharIndex: start !== -1 ? start + chunkStr.length : -1,
                    charCount: chunkStr.length,
                    tokenCount: countTokens(chunkStr, encoding),
                    overlapPrevChars: chunkIndex > 0 ? chunkOverlap : 0,
                    overlapNextChars: chunkOverlap,
                    isOrphan: false,
                    sectionHeader: section.header,
                  });
                  chunkIndex++;
                }
                wordBuffer = [w];
                wordBufferLen = wLen;
              }
            }
            if (wordBuffer.length > 0) {
              buffer = [wordBuffer.join(' ')];
              bufferLen = wordBufferLen;
            }
          } else {
            buffer.push(p);
            bufferLen = pLen;
          }
        }
      }

      if (buffer.length > 0) {
        const chunkStr = buffer.join('\n\n');
        const start = text.indexOf(chunkStr);
        chunks.push({
          id: `md-${chunkIndex}`,
          index: chunkIndex,
          text: chunkStr,
          startCharIndex: start,
          endCharIndex: start !== -1 ? start + chunkStr.length : -1,
          charCount: chunkStr.length,
          tokenCount: countTokens(chunkStr, encoding),
          overlapPrevChars: chunkIndex > 0 ? chunkOverlap : 0,
          overlapNextChars: 0,
          isOrphan: false,
          sectionHeader: section.header,
        });
        chunkIndex++;
      }
    }
  }

  return chunks;
}
