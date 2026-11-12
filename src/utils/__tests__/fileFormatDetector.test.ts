import { describe, it, expect } from 'vitest';
import { detectFileFormat, isPdfBuffer } from '../fileFormatDetector';

describe('fileFormatDetector', () => {
  it('detects PDF by magic bytes in binary buffer', () => {
    // %PDF-1.7
    const buffer = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
    expect(isPdfBuffer(buffer)).toBe(true);

    const result = detectFileFormat('document.bin', undefined, buffer);
    expect(result.formatId).toBe('pdf');
    expect(result.label).toBe('PDF Document');
    expect(result.recommendedStrategy).toBe('recursive');
  });

  it('detects PDF by .pdf extension', () => {
    const result = detectFileFormat('attention_paper.pdf');
    expect(result.formatId).toBe('pdf');
    expect(result.badge).toBe('PDF');
  });

  it('detects CSV tabular dataset by extension and recommends tabular strategy', () => {
    const content = 'id,name,role,salary\n1,Alice,Engineer,120000\n2,Bob,Manager,140000';
    const result = detectFileFormat('employees.csv', content);
    expect(result.formatId).toBe('csv');
    expect(result.badge).toBe('CSV');
    expect(result.recommendedStrategy).toBe('tabular');
  });

  it('detects CSV by content sniffing even with .txt extension', () => {
    const content = 'product_id,product_name,category,price\n101,Widget A,Tools,19.99\n102,Widget B,Tools,29.99';
    const result = detectFileFormat('data.txt', content);
    expect(result.formatId).toBe('csv');
    expect(result.recommendedStrategy).toBe('tabular');
  });

  it('detects TSV by extension and tab-delimited content', () => {
    const content = 'colA\tcolB\tcolC\nval1\tval2\tval3\nval4\tval5\tval6';
    const result = detectFileFormat('dataset.tsv', content);
    expect(result.formatId).toBe('tsv');
    expect(result.recommendedStrategy).toBe('tabular');
  });

  it('detects JSON array and recommends tabular strategy', () => {
    const content = JSON.stringify([
      { id: 1, title: 'Item 1', status: 'active' },
      { id: 2, title: 'Item 2', status: 'pending' },
    ]);
    const result = detectFileFormat('records.json', content);
    expect(result.formatId).toBe('json');
    expect(result.badge).toBe('JSON');
    expect(result.recommendedStrategy).toBe('tabular');
  });

  it('detects JSON Lines format (.jsonl)', () => {
    const content = '{"id": 1, "text": "hello"}\n{"id": 2, "text": "world"}';
    const result = detectFileFormat('events.jsonl', content);
    expect(result.formatId).toBe('json');
    expect(result.badge).toBe('JSONL');
    expect(result.recommendedStrategy).toBe('tabular');
  });

  it('detects Markdown documents and recommends markdown strategy', () => {
    const content = `# Architecture Overview\n\n## Section 1\nDetailed content.\n\n| Feature | Status |\n|---|---|\n| Chunking | Done |`;
    const result = detectFileFormat('README.md', content);
    expect(result.formatId).toBe('markdown');
    expect(result.badge).toBe('MD');
    expect(result.recommendedStrategy).toBe('markdown');
  });

  it('detects source code files with language-specific separators', () => {
    const pythonCode = `import os\n\ndef process_items(data):\n    pass\n\nclass DataManager:\n    pass`;
    const result = detectFileFormat('pipeline.py', pythonCode);
    expect(result.formatId).toBe('code');
    expect(result.badge).toBe('PY');
    expect(result.recommendedStrategy).toBe('recursive');
    expect(result.suggestedSeparators).toBeDefined();
    expect(result.suggestedSeparators).toContain('\ndef ');
  });

  it('falls back to plain text for general prose', () => {
    const prose = 'The quick brown fox jumps over the lazy dog. A continuous paragraph with normal punctuation.';
    const result = detectFileFormat('notes.txt', prose);
    expect(result.formatId).toBe('text');
    expect(result.badge).toBe('TXT');
    expect(result.recommendedStrategy).toBe('recursive');
  });
});
