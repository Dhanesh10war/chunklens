import { ChunkMetadata, ChunkingConfig } from '../engine/types';

export interface DatasetExportPayload {
  documentTitle: string;
  generatedAt: string;
  totalChunks: number;
  config: {
    strategy: string;
    chunkSize: number;
    chunkOverlap: number;
    unit: string;
    encoding: string;
  };
  chunks: Array<{
    id: string;
    index: number;
    tokenCount: number;
    charCount: number;
    startCharIndex: number;
    endCharIndex: number;
    sectionHeader?: string;
    isOrphan: boolean;
    text: string;
  }>;
}

/**
 * Formats chunking results into a structured JSON string suitable for vector DB ingestion.
 */
export function exportChunksToJson(
  chunks: ChunkMetadata[],
  config: ChunkingConfig,
  docTitle: string = 'document'
): string {
  const payload: DatasetExportPayload = {
    documentTitle: docTitle,
    generatedAt: new Date().toISOString(),
    totalChunks: chunks.length,
    config: {
      strategy: config.strategy,
      chunkSize: config.chunkSize,
      chunkOverlap: config.chunkOverlap,
      unit: config.unit,
      encoding: config.encoding,
    },
    chunks: chunks.map((c) => ({
      id: c.id,
      index: c.index,
      tokenCount: c.tokenCount,
      charCount: c.charCount,
      startCharIndex: c.startCharIndex,
      endCharIndex: c.endCharIndex,
      sectionHeader: c.sectionHeader,
      isOrphan: c.isOrphan,
      text: c.text,
    })),
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Formats chunks into standard RFC 4180 CSV format with escaped text fields.
 */
export function exportChunksToCsv(chunks: ChunkMetadata[]): string {
  const headers = ['id', 'index', 'tokenCount', 'charCount', 'startCharIndex', 'endCharIndex', 'sectionHeader', 'text'];
  const rows = chunks.map((c) => {
    const escapedText = `"${c.text.replace(/"/g, '""')}"`;
    const escapedHeader = c.sectionHeader ? `"${c.sectionHeader.replace(/"/g, '""')}"` : '""';
    return [
      c.id,
      c.index,
      c.tokenCount,
      c.charCount,
      c.startCharIndex,
      c.endCharIndex,
      escapedHeader,
      escapedText,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Triggers client-side browser file download via Blob URL.
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  if (typeof window === 'undefined') return;

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
