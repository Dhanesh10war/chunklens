import { ChunkMetadata, ChunkingConfig } from '../types';
import { countTokens } from '../tokenizers/tokenizer';
import { createLengthFn, detectOrphan, splitOversizedSpan } from './utils';

interface BlockSpan {
  start: number;
  end: number;
  header: string;
}

interface MarkdownSection {
  header: string;
  level: number;
  blocks: BlockSpan[];
}

export function chunkMarkdown(text: string, config: ChunkingConfig): ChunkMetadata[] {
  if (!text || text.trim().length === 0) return [];

  const { chunkSize, chunkOverlap, unit, encoding } = config;
  const safeOverlap = Math.min(chunkOverlap, Math.max(0, chunkSize - 1));
  const lengthFn = createLengthFn(unit, encoding);

  // Parse lines with exact start/end character offsets in text
  const lineRegex = /(.*)(?:\r?\n|$)/g;
  interface LineInfo {
    line: string;
    start: number;
    end: number;
  }
  const lines: LineInfo[] = [];
  let match: RegExpExecArray | null;
  while ((match = lineRegex.exec(text)) !== null) {
    if (match.index >= text.length && match[0].length === 0) break;
    lines.push({
      line: match[1],
      start: match.index,
      end: match.index + match[1].length,
    });
    if (match[0].length === 0) break;
  }

  const sections: MarkdownSection[] = [];
  let currentHeader = 'Introduction';
  let currentLevel = 1;
  let currentBlocks: BlockSpan[] = [];
  let activeParagraphLines: LineInfo[] = [];
  let inCodeBlock = false;
  let codeBlockLines: LineInfo[] = [];

  const flushParagraph = () => {
    if (activeParagraphLines.length > 0) {
      const pStart = activeParagraphLines[0].start;
      const pEnd = activeParagraphLines[activeParagraphLines.length - 1].end;
      currentBlocks.push({ start: pStart, end: pEnd, header: currentHeader });
      activeParagraphLines = [];
    }
  };

  const flushCodeBlock = () => {
    if (codeBlockLines.length > 0) {
      const cStart = codeBlockLines[0].start;
      const cEnd = codeBlockLines[codeBlockLines.length - 1].end;
      currentBlocks.push({ start: cStart, end: cEnd, header: currentHeader });
      codeBlockLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const lInfo = lines[i];
    const line = lInfo.line;
    const isFence = line.trim().startsWith('```');

    if (isFence) {
      if (!inCodeBlock) {
        flushParagraph();
        inCodeBlock = true;
        codeBlockLines.push(lInfo);
      } else {
        codeBlockLines.push(lInfo);
        inCodeBlock = false;
        flushCodeBlock();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(lInfo);
      continue;
    }

    // Markdown headings
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

      const hMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (hMatch) {
        currentLevel = hMatch[1].length;
        currentHeader = hMatch[2].trim();
      }
      activeParagraphLines.push(lInfo);
    } else if (line.trim() === '') {
      flushParagraph();
    } else {
      activeParagraphLines.push(lInfo);
    }
  }

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

  // Assemble chunks respecting headers and chunk size, without injecting synthetic fences
  const rawSpans: BlockSpan[] = [];

  for (const section of sections) {
    let buffer: BlockSpan[] = [];

    const getBufferLen = (buf: BlockSpan[]) => {
      if (buf.length === 0) return 0;
      return lengthFn(text.slice(buf[0].start, buf[buf.length - 1].end));
    };

    for (const block of section.blocks) {
      const blockText = text.slice(block.start, block.end);
      const blockLen = lengthFn(blockText);

      const candidateBuffer = [...buffer, block];
      const candidateLen = getBufferLen(candidateBuffer);

      if (candidateLen <= chunkSize) {
        buffer = candidateBuffer;
      } else {
        // Flush buffer
        if (buffer.length > 0) {
          rawSpans.push({
            start: buffer[0].start,
            end: buffer[buffer.length - 1].end,
            header: section.header,
          });

          // Retain trailing blocks for overlap
          const nextBuffer: BlockSpan[] = [];
          for (let i = buffer.length - 1; i >= 0; i--) {
            const testCandidate = [buffer[i], ...nextBuffer];
            if (getBufferLen(testCandidate) <= safeOverlap) {
              nextBuffer.unshift(buffer[i]);
            } else {
              break;
            }
          }
          buffer = nextBuffer;
        }

        if (blockLen > chunkSize) {
          // Subdivide oversized block directly from source without synthesizing fences
          const subSpans = splitOversizedSpan(text, block.start, block.end, chunkSize, safeOverlap, unit, encoding);
          for (const sub of subSpans) {
            rawSpans.push({
              start: sub.start,
              end: sub.end,
              header: section.header,
            });
          }
        } else {
          buffer.push(block);
        }
      }
    }

    if (buffer.length > 0) {
      rawSpans.push({
        start: buffer[0].start,
        end: buffer[buffer.length - 1].end,
        header: section.header,
      });
    }
  }

  // Map into structured ChunkMetadata with verbatim source character slices
  return rawSpans.map((item, idx) => {
    const chunkText = text.slice(item.start, item.end);
    const prevSpan = rawSpans[idx - 1];
    const nextSpan = rawSpans[idx + 1];

    const overlapPrevChars = prevSpan ? Math.max(0, prevSpan.end - item.start) : 0;
    const overlapNextChars = nextSpan ? Math.max(0, item.end - nextSpan.start) : 0;

    return {
      id: `md-${idx}`,
      index: idx,
      text: chunkText,
      startCharIndex: item.start,
      endCharIndex: item.end,
      charCount: chunkText.length,
      tokenCount: countTokens(chunkText, encoding),
      overlapPrevChars,
      overlapNextChars,
      isOrphan: detectOrphan(text, item.start),
      sectionHeader: item.header,
    };
  });
}
