import { ChunkingStrategy } from '../engine/types';

export type FileFormatId =
  | 'pdf'
  | 'csv'
  | 'tsv'
  | 'json'
  | 'markdown'
  | 'code'
  | 'html'
  | 'text';

export interface DetectedFormatInfo {
  formatId: FileFormatId;
  label: string;
  badge: string;
  extension: string;
  recommendedStrategy: ChunkingStrategy;
  confidence: 'high' | 'medium' | 'inferred';
  description: string;
  suggestedSeparators?: string[];
  suggestedChunkSize?: number;
  suggestedOverlap?: number;
}

/**
 * Checks if a byte buffer starts with the PDF magic header: %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
 */
export function isPdfBuffer(buffer: ArrayBuffer | Uint8Array): boolean {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (bytes.length < 5) return false;
  // %PDF-
  return (
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  );
}

/**
 * Analyzes string content to detect if it matches tabular CSV or TSV structure.
 */
function detectCsvOrTsvContent(content: string): 'csv' | 'tsv' | null {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .slice(0, 10);

  if (lines.length < 2) return null;

  // Check CSV (comma)
  const commaCounts = lines.map((l) => (l.match(/,/g) || []).length);
  const firstCommaCount = commaCounts[0];
  if (firstCommaCount >= 1 && commaCounts.every((c) => Math.abs(c - firstCommaCount) <= 1 && c > 0)) {
    return 'csv';
  }

  // Check TSV (tab)
  const tabCounts = lines.map((l) => (l.match(/\t/g) || []).length);
  const firstTabCount = tabCounts[0];
  if (firstTabCount >= 1 && tabCounts.every((t) => t === firstTabCount && t > 0)) {
    return 'tsv';
  }

  return null;
}

/**
 * Analyzes string content to detect if it matches JSON array or JSON Lines.
 */
function detectJsonContent(content: string): boolean {
  const trimmed = content.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed.slice(0, 5000) + (trimmed.length > 5000 ? ']' : ''));
      if (Array.isArray(parsed)) return true;
    } catch {
      // Fallback: check array of objects pattern
      if (/^\[\s*\{[\s\S]*\}\s*\]$/.test(trimmed)) return true;
    }
  }

  // Check JSON Lines (NDJSON)
  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0).slice(0, 5);
  if (lines.length >= 2 && lines.every((l) => l.startsWith('{') && l.endsWith('}'))) {
    try {
      lines.forEach((l) => JSON.parse(l));
      return true;
    } catch {
      // Not valid JSONL
    }
  }

  return false;
}

/**
 * Analyzes string content to detect Markdown structure (headers, lists, tables).
 */
function detectMarkdownContent(content: string): boolean {
  const hasHeaders = /(?:^|\n)#{1,6}\s+[^\n]+/.test(content);
  const hasTables = /(?:^|\n)\|[^\n]+\|\r?\n\|[-:\s|]+\|/.test(content);
  const hasFencedCode = /(?:^|\n)```[a-z0-9_-]*\r?\n[\s\S]*?```/.test(content);
  const hasLinks = /\[[^\n\]]+\]\((?:https?:\/\/[^\s)]+|\/[^\s)]+)\)/.test(content);

  let matchCount = 0;
  if (hasHeaders) matchCount += 2;
  if (hasTables) matchCount += 2;
  if (hasFencedCode) matchCount += 1;
  if (hasLinks) matchCount += 1;

  return matchCount >= 2;
}

/**
 * Analyzes string content to detect Programming Source Code.
 */
function detectCodeContent(content: string, ext: string): boolean {
  const codeExtensions = [
    '.py',
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.java',
    '.cpp',
    '.c',
    '.h',
    '.hpp',
    '.cs',
    '.go',
    '.rs',
    '.php',
    '.rb',
    '.swift',
    '.kt',
    '.sql',
    '.sh',
    '.bash',
    '.yaml',
    '.yml',
  ];
  if (codeExtensions.includes(ext.toLowerCase())) return true;

  // Keyword heuristics
  const codePatterns = [
    /(?:^|\n)(?:import\s+|export\s+|from\s+['"][^'"]+['"])/,
    /(?:^|\n)(?:def\s+[a-zA-Z_]\w*\s*\(|class\s+[a-zA-Z_]\w*[:\s{])/,
    /(?:^|\n)(?:function\s+[a-zA-Z_]\w*\s*\(|const\s+[a-zA-Z_]\w*\s*=\s*(?:async\s*)?\()/,
    /(?:^|\n)(?:SELECT\s+.+\s+FROM\s+|CREATE\s+TABLE\s+)/i,
  ];

  return codePatterns.some((pattern) => pattern.test(content));
}

/**
 * Comprehensive File Format Detector
 * Automatically recognizes file formats by combining binary magic bytes, filename extensions, and content heuristics.
 */
export function detectFileFormat(
  filename: string,
  content?: string,
  buffer?: ArrayBuffer | Uint8Array
): DetectedFormatInfo {
  const cleanName = filename.trim();
  const extMatch = cleanName.match(/\.([0-9a-z]+)$/i);
  const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : '';
  const text = content || '';

  // 1. Binary Magic Bytes / PDF Detection
  if (buffer && isPdfBuffer(buffer)) {
    return {
      formatId: 'pdf',
      label: 'PDF Document',
      badge: 'PDF',
      extension: ext || '.pdf',
      recommendedStrategy: 'recursive',
      confidence: 'high',
      description: 'Portable Document Format with extracted page structure and layout boundaries.',
    };
  }

  if (ext === '.pdf') {
    return {
      formatId: 'pdf',
      label: 'PDF Document',
      badge: 'PDF',
      extension: '.pdf',
      recommendedStrategy: 'recursive',
      confidence: 'high',
      description: 'Portable Document Format with extracted page structure and layout boundaries.',
    };
  }

  // 2. CSV / TSV Detection
  if (ext === '.csv' || (!ext && detectCsvOrTsvContent(text) === 'csv')) {
    return {
      formatId: 'csv',
      label: 'CSV Tabular Dataset',
      badge: 'CSV',
      extension: ext || '.csv',
      recommendedStrategy: 'tabular',
      confidence: ext === '.csv' ? 'high' : 'medium',
      description: 'Comma-separated records with schema header. Optimal with schema-preserving tabular chunking.',
    };
  }

  if (ext === '.tsv' || (!ext && detectCsvOrTsvContent(text) === 'tsv')) {
    return {
      formatId: 'tsv',
      label: 'TSV Tabular Dataset',
      badge: 'TSV',
      extension: ext || '.tsv',
      recommendedStrategy: 'tabular',
      confidence: ext === '.tsv' ? 'high' : 'medium',
      description: 'Tab-separated records with schema header. Optimal with schema-preserving tabular chunking.',
    };
  }

  // Content sniff for CSV even with .txt extension
  if (ext === '.txt' && detectCsvOrTsvContent(text) === 'csv') {
    return {
      formatId: 'csv',
      label: 'CSV Tabular Dataset',
      badge: 'CSV',
      extension: '.csv',
      recommendedStrategy: 'tabular',
      confidence: 'medium',
      description: 'Detected tabular comma-separated structure within plain text document.',
    };
  }

  // 3. JSON / JSON Lines Detection
  if (ext === '.json' || ext === '.jsonl' || ext === '.ndjson' || detectJsonContent(text)) {
    return {
      formatId: 'json',
      label: ext === '.jsonl' ? 'JSON Lines Records' : 'JSON Dataset',
      badge: ext === '.jsonl' ? 'JSONL' : 'JSON',
      extension: ext || '.json',
      recommendedStrategy: 'tabular',
      confidence: ext.startsWith('.json') ? 'high' : 'medium',
      description: 'Structured JSON objects. Optimal with schema-preserving record chunking.',
    };
  }

  // 4. Markdown Detection
  if (ext === '.md' || ext === '.markdown' || ext === '.mdown' || detectMarkdownContent(text)) {
    return {
      formatId: 'markdown',
      label: 'Markdown Document',
      badge: 'MD',
      extension: ext || '.md',
      recommendedStrategy: 'markdown',
      confidence: ext.startsWith('.m') ? 'high' : 'medium',
      description: 'Hierarchical Markdown text with H1–H6 section structure and formatting.',
    };
  }

  // 5. Code / Source Files
  if (detectCodeContent(text, ext)) {
    return {
      formatId: 'code',
      label: 'Source Code',
      badge: ext ? ext.slice(1).toUpperCase() : 'CODE',
      extension: ext,
      recommendedStrategy: 'recursive',
      confidence: ext ? 'high' : 'medium',
      description: 'Programming source code with function, class, and block syntax boundaries.',
      suggestedSeparators: ['\nclass ', '\ndef ', '\nfunction ', '\n\n', '\n', ' ', ''],
    };
  }

  // 6. HTML / XML
  if (ext === '.html' || ext === '.htm' || ext === '.xml' || /^\s*<(!DOCTYPE|html|\?xml)/i.test(text)) {
    return {
      formatId: 'html',
      label: ext === '.xml' ? 'XML Document' : 'HTML Document',
      badge: ext === '.xml' ? 'XML' : 'HTML',
      extension: ext || '.html',
      recommendedStrategy: 'recursive',
      confidence: 'medium',
      description: 'Markup document with hierarchical DOM tag structure.',
      suggestedSeparators: ['</article>', '</section>', '</div>', '</p>', '\n\n', '\n', ' ', ''],
    };
  }

  // 7. Default: Plain Text / Prose
  return {
    formatId: 'text',
    label: 'Plain Text',
    badge: 'TXT',
    extension: ext || '.txt',
    recommendedStrategy: 'recursive',
    confidence: 'inferred',
    description: 'Natural language text document. Optimal with recursive boundary splitting.',
  };
}
