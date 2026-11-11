import { ChunkMetadata, ChunkingConfig } from '../types';
import { countTokens } from '../tokenizers/tokenizer';
import { createLengthFn, findChunkIndices, detectOrphan, splitOversizedText } from './utils';

interface MarkdownSection {
  header: string;
  level: number;
  blocks: string[];
}

export function chunkMarkdown(text: string, config: ChunkingConfig): ChunkMetadata[] {
  if (!text || text.trim().length === 0) return [];

  const { chunkSize, chunkOverlap, unit, encoding } = config;
  const safeOverlap = Math.min(chunkOverlap, Math.max(0, chunkSize - 1));
  const lengthFn = createLengthFn(unit, encoding);

  // Parse lines, separating into sections and preserving code blocks atomically
  const lines = text.split('\n');
  const sections: MarkdownSection[] = [];
  let currentHeader = 'Introduction';
  let currentLevel = 1;
  let currentBlocks: string[] = [];
  let activeParagraphLines: string[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  const flushParagraph = () => {
    if (activeParagraphLines.length > 0) {
      currentBlocks.push(activeParagraphLines.join('\n'));
      activeParagraphLines = [];
    }
  };

  const flushCodeBlock = () => {
    if (codeBlockLines.length > 0) {
      currentBlocks.push(codeBlockLines.join('\n'));
      codeBlockLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isFence = line.trim().startsWith('```');

    if (isFence) {
      if (!inCodeBlock) {
        // Start of code block: flush any pending paragraph
        flushParagraph();
        inCodeBlock = true;
        codeBlockLines.push(line);
      } else {
        // End of code block
        codeBlockLines.push(line);
        inCodeBlock = false;
        flushCodeBlock();
      }
      continue;
    }

    if (inCodeBlock) {
      // Retain all lines inside code block, even empty ones
      codeBlockLines.push(line);
      continue;
    }

    // Check for Markdown headings (only outside code blocks)
    if (/^#{1,6}\s+/.test(line)) {
      flushParagraph();
      if (currentBlocks.length > 0) {
        sections.push({
          header: currentHeader,
          level: currentLevel,
          blocks: currentBlocks,
        });
        currentBlocks = [];
      }

      const match = line.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        currentLevel = match[1].length;
        currentHeader = match[2].trim();
      }
      activeParagraphLines.push(line);
    } else if (line.trim() === '') {
      // Blank line outside code block indicates paragraph boundary
      flushParagraph();
    } else {
      activeParagraphLines.push(line);
    }
  }

  // Flush any remaining active lines
  if (inCodeBlock) {
    flushCodeBlock();
  }
  flushParagraph();

  if (currentBlocks.length > 0) {
    sections.push({
      header: currentHeader,
      level: currentLevel,
      blocks: currentBlocks,
    });
  }

  // Now assemble chunks respecting headers, code blocks, and overlap
  const rawChunks: { text: string; header: string }[] = [];

  for (const section of sections) {
    let buffer: string[] = [];
    let bufferLen = 0;

    for (const block of section.blocks) {
      const blockLen = lengthFn(block);

      if (bufferLen + blockLen + (buffer.length > 0 ? lengthFn('\n\n') : 0) <= chunkSize) {
        buffer.push(block);
        bufferLen += blockLen + (buffer.length > 1 ? lengthFn('\n\n') : 0);
      } else {
        // Flush existing buffer
        if (buffer.length > 0) {
          const chunkStr = buffer.join('\n\n');
          rawChunks.push({ text: chunkStr, header: section.header });

          // Paragraph-level overlap: retain trailing blocks that fit in safeOverlap
          const nextBuffer: string[] = [];
          let nextBufferLen = 0;
          for (let i = buffer.length - 1; i >= 0; i--) {
            const b = buffer[i];
            const bLen = lengthFn(b);
            if (nextBufferLen + bLen + (nextBuffer.length > 0 ? lengthFn('\n\n') : 0) <= safeOverlap) {
              nextBuffer.unshift(b);
              nextBufferLen += bLen + (nextBuffer.length > 1 ? lengthFn('\n\n') : 0);
            } else {
              break;
            }
          }
          buffer = nextBuffer;
          bufferLen = nextBufferLen;
        }

        if (blockLen > chunkSize) {
          // Block itself exceeds chunkSize
          if (block.startsWith('```')) {
            // It's an oversized code block: split lines while protecting fences
            const blockLines = block.split('\n');
            const openFence = blockLines[0]; // e.g. ```python
            const contentLines = blockLines.slice(1, blockLines.length - 1);
            let codeSubBuffer: string[] = [];
            let codeSubLen = lengthFn(openFence) + lengthFn('\n```');

            for (const cLine of contentLines) {
              const cLineLen = lengthFn(cLine) + 1;
              if (codeSubLen + cLineLen <= chunkSize) {
                codeSubBuffer.push(cLine);
                codeSubLen += cLineLen;
              } else {
                if (codeSubBuffer.length > 0) {
                  const chunkCode = `${openFence}\n${codeSubBuffer.join('\n')}\n\`\`\``;
                  rawChunks.push({ text: chunkCode, header: section.header });
                  codeSubBuffer = [];
                  codeSubLen = lengthFn(openFence) + lengthFn('\n```');
                }
                codeSubBuffer.push(cLine);
                codeSubLen += cLineLen;
              }
            }

            if (codeSubBuffer.length > 0) {
              const chunkCode = `${openFence}\n${codeSubBuffer.join('\n')}\n\`\`\``;
              rawChunks.push({ text: chunkCode, header: section.header });
            }
          } else {
            // Standard oversized text block
            const subChunks = splitOversizedText(block, chunkSize, safeOverlap, unit, encoding);
            for (const sc of subChunks) {
              rawChunks.push({ text: sc, header: section.header });
            }
          }
        } else {
          buffer.push(block);
          bufferLen += blockLen + (buffer.length > 1 ? lengthFn('\n\n') : 0);
        }
      }
    }

    if (buffer.length > 0) {
      const chunkStr = buffer.join('\n\n');
      rawChunks.push({ text: chunkStr, header: section.header });
    }
  }

  // Map into structured ChunkMetadata with precise offsets
  let searchCursor = 0;
  return rawChunks.map((item, idx) => {
    const chunkStr = item.text;
    const { startCharIndex, endCharIndex, nextCursor } = findChunkIndices(text, chunkStr, searchCursor);
    searchCursor = nextCursor;

    let actualOverlapChars = 0;
    if (idx > 0) {
      const prevChunk = rawChunks[idx - 1].text;
      const maxPossible = Math.min(prevChunk.length, chunkStr.length);
      for (let len = maxPossible; len > 0; len--) {
        if (prevChunk.endsWith(chunkStr.slice(0, len))) {
          actualOverlapChars = len;
          break;
        }
      }
    }

    return {
      id: `md-${idx}`,
      index: idx,
      text: chunkStr,
      startCharIndex,
      endCharIndex,
      charCount: chunkStr.length,
      tokenCount: countTokens(chunkStr, encoding),
      overlapPrevChars: actualOverlapChars > 0 ? actualOverlapChars : (idx > 0 ? safeOverlap : 0),
      overlapNextChars: idx < rawChunks.length - 1 ? safeOverlap : 0,
      isOrphan: detectOrphan(text, startCharIndex),
      sectionHeader: item.header,
    };
  });
}
