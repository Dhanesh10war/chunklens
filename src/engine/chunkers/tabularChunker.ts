import { ChunkMetadata, ChunkingConfig } from '../types';
import { countTokens } from '../tokenizers/tokenizer';
import { createLengthFn } from './utils';

/**
 * Tabular & CSV Document Chunker with Schema Retention
 * 
 * Slices rows while guaranteeing that every chunk begins with the
 * schema header row (column definitions), preventing LLM hallucinations and
 * context loss during RAG retrieval.
 */
export function chunkTabular(text: string, config: ChunkingConfig): ChunkMetadata[] {
  if (!text || !text.trim()) return [];

  const lengthFn = createLengthFn(config.unit, config.encoding);
  const trimmed = text.trim();

  // If JSON array of records, process as structured JSON chunks with schema retention
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (
        Array.isArray(parsed) &&
        parsed.length > 0 &&
        typeof parsed[0] === 'object' &&
        parsed[0] !== null
      ) {
        return chunkJsonRecords(text, parsed, config, lengthFn);
      }
    } catch {
      // If JSON parse fails, fall through to delimited row parser
    }
  }

  return chunkDelimitedRows(text, config, lengthFn);
}

/**
 * Chunks CSV, TSV, or newline-delimited tabular rows.
 * Prepend the column header line to every chunk.
 */
function chunkDelimitedRows(
  fullText: string,
  config: ChunkingConfig,
  lengthFn: (t: string) => number
): ChunkMetadata[] {
  interface TabularLine {
    text: string;
    start: number;
    end: number;
  }

  const lineRegex = /[^\r\n]+/g;
  const lines: TabularLine[] = [];
  let match: RegExpExecArray | null;
  while ((match = lineRegex.exec(fullText)) !== null) {
    if (match[0].trim().length > 0) {
      lines.push({
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  if (lines.length === 0) return [];

  const headerLine = lines[0];
  const dataRows = lines.slice(1);

  // If only header line exists, return it as single chunk
  if (dataRows.length === 0) {
    const chunkText = headerLine.text;
    return [
      {
        id: 'tabular-chunk-0',
        index: 0,
        text: chunkText,
        startCharIndex: headerLine.start,
        endCharIndex: headerLine.end,
        charCount: chunkText.length,
        tokenCount: countTokens(chunkText, config.encoding),
        overlapPrevChars: 0,
        overlapNextChars: 0,
        isOrphan: false,
        sectionHeader: `Schema: ${headerLine.text.slice(0, 50)}`,
      },
    ];
  }

  const headerWeight = lengthFn(headerLine.text + '\n');
  const targetChunkSize = Math.max(headerWeight + 1, config.chunkSize);
  const targetOverlap = config.chunkOverlap;

  const rawChunks: Array<{
    text: string;
    startRowIndex: number;
    endRowIndex: number;
  }> = [];

  let currentRows: TabularLine[] = [];
  let currentWeight = headerWeight;
  let startRowIdx = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowWeight = lengthFn(row.text + '\n');

    // Check if adding this row exceeds target chunk size
    if (currentRows.length > 0 && currentWeight + rowWeight > targetChunkSize) {
      const chunkText = `${headerLine.text}\n${currentRows.map((r) => r.text).join('\n')}`;
      rawChunks.push({
        text: chunkText,
        startRowIndex: startRowIdx,
        endRowIndex: startRowIdx + currentRows.length - 1,
      });

      // Calculate overlap rows from the end of currentRows
      const overlapRows: TabularLine[] = [];
      let overlapWeight = 0;

      if (targetOverlap > 0) {
        for (let r = currentRows.length - 1; r >= 0; r--) {
          const candidateRow = currentRows[r];
          const candidateWeight = lengthFn(candidateRow.text + '\n');
          if (overlapRows.length === 0 || overlapWeight + candidateWeight <= targetOverlap) {
            overlapRows.unshift(candidateRow);
            overlapWeight += candidateWeight;
          } else {
            break;
          }
        }
      }

      currentRows = [...overlapRows, row];
      currentWeight = headerWeight + lengthFn(currentRows.map((r) => r.text).join('\n') + '\n');
      startRowIdx = i - overlapRows.length;
    } else {
      currentRows.push(row);
      currentWeight += rowWeight;
    }
  }

  // Push final chunk if rows remain
  if (currentRows.length > 0) {
    const chunkText = `${headerLine.text}\n${currentRows.map((r) => r.text).join('\n')}`;
    rawChunks.push({
      text: chunkText,
      startRowIndex: startRowIdx,
      endRowIndex: startRowIdx + currentRows.length - 1,
    });
  }

  // Build ChunkMetadata objects using cumulative line positions
  return rawChunks.map((chunk, idx) => {
    const firstRow = dataRows[chunk.startRowIndex];
    const lastRow = dataRows[chunk.endRowIndex];
    const startCharIndex = firstRow ? firstRow.start : headerLine.start;
    const endCharIndex = lastRow ? lastRow.end : headerLine.end;

    // Calculate overlap with adjacent chunks
    const prevChunk = rawChunks[idx - 1];
    const nextChunk = rawChunks[idx + 1];

    let overlapPrevChars = 0;
    let overlapNextChars = 0;

    if (prevChunk) {
      const prevRows = new Set(prevChunk.text.split('\n').slice(1));
      const myRows = chunk.text.split('\n').slice(1);
      const shared = myRows.filter((r) => prevRows.has(r)).join('\n');
      overlapPrevChars = shared.length;
    }

    if (nextChunk) {
      const nextRows = new Set(nextChunk.text.split('\n').slice(1));
      const myRows = chunk.text.split('\n').slice(1);
      const shared = myRows.filter((r) => nextRows.has(r)).join('\n');
      overlapNextChars = shared.length;
    }

    return {
      id: `tabular-chunk-${idx}`,
      index: idx,
      text: chunk.text,
      startCharIndex: Math.max(0, startCharIndex),
      endCharIndex: Math.max(startCharIndex, endCharIndex),
      charCount: chunk.text.length,
      tokenCount: countTokens(chunk.text, config.encoding),
      overlapPrevChars,
      overlapNextChars,
      isOrphan: false,
      sectionHeader: `Schema: ${headerLine.text.slice(0, 40)}${headerLine.text.length > 40 ? '...' : ''} (Rows ${chunk.startRowIndex + 1}–${chunk.endRowIndex + 1})`,
    };
  });
}

/**
 * Chunks a JSON array of objects, prepending schema keys to every chunk.
 */
function chunkJsonRecords(
  fullText: string,
  records: Array<Record<string, unknown>>,
  config: ChunkingConfig,
  lengthFn: (t: string) => number
): ChunkMetadata[] {
  if (records.length === 0) return [];

  const keys = Object.keys(records[0] || {});
  const schemaHeader = `// Schema: [${keys.join(', ')}]\n`;
  const headerWeight = lengthFn(schemaHeader);
  const targetChunkSize = Math.max(headerWeight + 1, config.chunkSize);

  const rawChunks: Array<{
    text: string;
    startIdx: number;
    endIdx: number;
  }> = [];

  let currentItems: Array<Record<string, unknown>> = [];
  let currentWeight = headerWeight;
  let startIdx = 0;

  for (let i = 0; i < records.length; i++) {
    const item = records[i];
    const itemStr = JSON.stringify(item);
    const itemWeight = lengthFn(itemStr + ',\n');

    if (currentItems.length > 0 && currentWeight + itemWeight > targetChunkSize) {
      const chunkText = `${schemaHeader}[\n  ${currentItems.map((r) => JSON.stringify(r)).join(',\n  ')}\n]`;
      rawChunks.push({
        text: chunkText,
        startIdx,
        endIdx: startIdx + currentItems.length - 1,
      });

      currentItems = [item];
      currentWeight = headerWeight + itemWeight;
      startIdx = i;
    } else {
      currentItems.push(item);
      currentWeight += itemWeight;
    }
  }

  if (currentItems.length > 0) {
    const chunkText = `${schemaHeader}[\n  ${currentItems.map((r) => JSON.stringify(r)).join(',\n  ')}\n]`;
    rawChunks.push({
      text: chunkText,
      startIdx,
      endIdx: startIdx + currentItems.length - 1,
    });
  }

  return rawChunks.map((chunk, idx) => {
    return {
      id: `tabular-json-${idx}`,
      index: idx,
      text: chunk.text,
      startCharIndex: 0,
      endCharIndex: fullText.length,
      charCount: chunk.text.length,
      tokenCount: countTokens(chunk.text, config.encoding),
      overlapPrevChars: 0,
      overlapNextChars: 0,
      isOrphan: false,
      sectionHeader: `JSON Schema: [${keys.slice(0, 5).join(', ')}] (Items ${chunk.startIdx + 1}–${chunk.endIdx + 1})`,
    };
  });
}
