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
 * Dangerous leading characters for CSV formula injection (CWE-1236).
 * Spreadsheet software (Excel, Calc, Google Sheets) parses cells starting with these
 * as executable formulas or external DDE commands.
 */
export const CSV_INJECTION_PREFIXES = ['=', '+', '-', '@', '\t', '\r'] as const;

/**
 * Sanitizes a string value for safe CSV export (preventing CSV Formula Injection / CWE-1236).
 * Any cell value starting with '=', '+', '-', '@', '\t', or '\r' is prefixed with a single quote (').
 */
export function sanitizeCsvValue(value: string): string {
  if (CSV_INJECTION_PREFIXES.some((prefix) => value.startsWith(prefix))) {
    return `'${value}`;
  }
  return value;
}

/**
 * Sanitizes and escapes a cell value for RFC 4180 compliant CSV format.
 */
export function sanitizeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return '""';
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  const str = String(value);
  const sanitized = sanitizeCsvValue(str);
  return `"${sanitized.replace(/"/g, '""')}"`;
}

/**
 * Escapes characters for safe inclusion in HTML.
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
 * Formats chunks into standard RFC 4180 CSV format with escaped and injection-sanitized fields.
 */
export function exportChunksToCsv(chunks: ChunkMetadata[]): string {
  const headers = ['id', 'index', 'tokenCount', 'charCount', 'startCharIndex', 'endCharIndex', 'sectionHeader', 'text'];
  const rows = chunks.map((c) => {
    return [
      sanitizeCsvCell(c.id),
      c.index,
      c.tokenCount,
      c.charCount,
      c.startCharIndex,
      c.endCharIndex,
      sanitizeCsvCell(c.sectionHeader || ''),
      sanitizeCsvCell(c.text),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Formats chunks into a self-contained, sanitized HTML document report.
 */
export function exportChunksToHtml(
  chunks: ChunkMetadata[],
  config: ChunkingConfig,
  docTitle: string = 'document'
): string {
  const safeTitle = escapeHtml(docTitle);
  const rows = chunks
    .map(
      (c) => `    <tr>
      <td>${escapeHtml(c.id)}</td>
      <td>${c.index}</td>
      <td>${c.tokenCount}</td>
      <td>${c.charCount}</td>
      <td>${c.startCharIndex}</td>
      <td>${c.endCharIndex}</td>
      <td>${c.sectionHeader ? escapeHtml(c.sectionHeader) : ''}</td>
      <td><pre>${escapeHtml(c.text)}</pre></td>
    </tr>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${safeTitle} - ChunkLens Export</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 2rem; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #f4f4f4; }
    pre { white-space: pre-wrap; margin: 0; font-family: monospace; font-size: 13px; }
  </style>
</head>
<body>
  <h1>${safeTitle}</h1>
  <p>Strategy: ${escapeHtml(config.strategy)} | Chunk Size: ${config.chunkSize} | Overlap: ${config.chunkOverlap} | Total Chunks: ${chunks.length}</p>
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Index</th>
        <th>Tokens</th>
        <th>Chars</th>
        <th>Start</th>
        <th>End</th>
        <th>Section</th>
        <th>Text</th>
      </tr>
    </thead>
    <tbody>
${rows}
    </tbody>
  </table>
</body>
</html>`;
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
