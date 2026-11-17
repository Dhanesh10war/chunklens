import { describe, it, expect } from 'vitest';
import {
  exportChunksToJson,
  exportChunksToCsv,
  exportChunksToHtml,
  sanitizeCsvCell,
  sanitizeCsvValue,
  escapeHtml,
} from '../dataExporters';
import { ChunkMetadata, ChunkingConfig } from '../../engine/types';

describe('Dataset Exporters', () => {
  const sampleChunks: ChunkMetadata[] = [
    {
      id: 'chunk-0',
      index: 0,
      text: 'First chunk with "quotes" and commas, here.',
      startCharIndex: 0,
      endCharIndex: 44,
      charCount: 44,
      tokenCount: 9,
      overlapPrevChars: 0,
      overlapNextChars: 10,
      isOrphan: false,
      sectionHeader: 'Intro',
    },
    {
      id: 'chunk-1',
      index: 1,
      text: 'Second chunk without header.',
      startCharIndex: 34,
      endCharIndex: 62,
      charCount: 28,
      tokenCount: 5,
      overlapPrevChars: 10,
      overlapNextChars: 0,
      isOrphan: false,
    },
  ];

  const config: ChunkingConfig = {
    strategy: 'recursive',
    chunkSize: 400,
    chunkOverlap: 40,
    unit: 'tokens',
    encoding: 'o200k_base',
  };

  it('exports chunks to structured JSON payload with full round-trip preservation', () => {
    const jsonStr = exportChunksToJson(sampleChunks, config, 'API Spec');
    const parsed = JSON.parse(jsonStr);

    expect(parsed.documentTitle).toBe('API Spec');
    expect(parsed.totalChunks).toBe(2);
    expect(parsed.config.strategy).toBe('recursive');
    expect(parsed.chunks.length).toBe(2);
    expect(parsed.chunks[0].sectionHeader).toBe('Intro');
    expect(parsed.chunks[0].tokenCount).toBe(9);
    expect(parsed.chunks[0].text).toBe(sampleChunks[0].text);
  });

  it('exports chunks to RFC 4180 compliant CSV', () => {
    const csvStr = exportChunksToCsv(sampleChunks);
    const lines = csvStr.split('\n');

    expect(lines[0]).toBe('id,index,tokenCount,charCount,startCharIndex,endCharIndex,sectionHeader,text');
    expect(lines.length).toBe(3);
    // Verifies quotes escaping
    expect(lines[1]).toContain('""quotes""');
  });

  describe('CSV Formula Injection Prevention (CWE-1236)', () => {
    const maliciousChunks: ChunkMetadata[] = [
      {
        id: 'chunk-calc',
        index: 0,
        text: "=cmd|' /C calc'!A0",
        startCharIndex: 0,
        endCharIndex: 19,
        charCount: 19,
        tokenCount: 6,
        overlapPrevChars: 0,
        overlapNextChars: 0,
        isOrphan: false,
        sectionHeader: '=1+1',
      },
      {
        id: 'chunk-plus',
        index: 1,
        text: '+1+1',
        startCharIndex: 20,
        endCharIndex: 24,
        charCount: 4,
        tokenCount: 3,
        overlapPrevChars: 0,
        overlapNextChars: 0,
        isOrphan: false,
        sectionHeader: '+cmd',
      },
      {
        id: 'chunk-minus',
        index: 2,
        text: '-5',
        startCharIndex: 25,
        endCharIndex: 27,
        charCount: 2,
        tokenCount: 2,
        overlapPrevChars: 0,
        overlapNextChars: 0,
        isOrphan: false,
        sectionHeader: '-10',
      },
      {
        id: 'chunk-at',
        index: 3,
        text: '@SUM(1,1)',
        startCharIndex: 28,
        endCharIndex: 37,
        charCount: 9,
        tokenCount: 4,
        overlapPrevChars: 0,
        overlapNextChars: 0,
        isOrphan: false,
        sectionHeader: '@dangerousFunction',
      },
      {
        id: 'chunk-tab',
        index: 4,
        text: '\t=HYPERLINK("http://attacker.com")',
        startCharIndex: 38,
        endCharIndex: 72,
        charCount: 34,
        tokenCount: 8,
        overlapPrevChars: 0,
        overlapNextChars: 0,
        isOrphan: false,
        sectionHeader: '\tsecretTab',
      },
      {
        id: 'chunk-cr',
        index: 5,
        text: '\r=cmd|',
        startCharIndex: 73,
        endCharIndex: 80,
        charCount: 7,
        tokenCount: 4,
        overlapPrevChars: 0,
        overlapNextChars: 0,
        isOrphan: false,
        sectionHeader: '\rCarriageReturn',
      },
    ];

    it('sanitizes cells starting with =, +, -, @, \\t, and \\r by prefixing with a single quote', () => {
      expect(sanitizeCsvValue("=cmd|' /C calc'!A0")).toBe("'=cmd|' /C calc'!A0");
      expect(sanitizeCsvValue('+1+1')).toBe("'+1+1");
      expect(sanitizeCsvValue('-5')).toBe("'-5");
      expect(sanitizeCsvValue('@SUM(1,1)')).toBe("'@SUM(1,1)");
      expect(sanitizeCsvValue('\tleadingTab')).toBe("'\tleadingTab");
      expect(sanitizeCsvValue('\rleadingCR')).toBe("'\rleadingCR");

      // Non-injection strings remain unchanged
      expect(sanitizeCsvValue('Normal text')).toBe('Normal text');
      expect(sanitizeCsvValue('Just a note: 10 + 5 = 15')).toBe('Just a note: 10 + 5 = 15');
    });

    it('neutralizes all injection triggers in exported CSV rows', () => {
      const csv = exportChunksToCsv(maliciousChunks);
      const lines = csv.split('\n').slice(1);

      // Verify no cell begins with an unneutralized formula character
      for (const line of lines) {
        expect(line).not.toMatch(/,"[=+\-@\t\r]/);
        expect(line).not.toMatch(/^"[=+\-@\t\r]/);
      }

      // Verify all injection rows are properly prefixed with single quote
      expect(csv).toContain("\"'=cmd|' /C calc'!A0\"");
      expect(csv).toContain("\"'+1+1\"");
      expect(csv).toContain("\"'-5\"");
      expect(csv).toContain("\"'@SUM(1,1)\"");
      expect(csv).toContain("\"'\t=HYPERLINK(\"\"http://attacker.com\"\")\"");
      expect(csv).toContain("\"'\r=cmd|\"");
      expect(csv).toContain("\"'=1+1\"");
      expect(csv).toContain("\"'+cmd\"");
      expect(csv).toContain("\"'-10\"");
      expect(csv).toContain("\"'@dangerousFunction\"");
      expect(csv).toContain("\"'\tsecretTab\"");
      expect(csv).toContain("\"'\rCarriageReturn\"");
    });
  });

  describe('HTML and JSON Exporter Security & Escaping', () => {
    it('escapes HTML special characters in exportChunksToHtml', () => {
      const xssChunks: ChunkMetadata[] = [
        {
          id: 'chunk-xss',
          index: 0,
          text: '<script>alert("xss")</script><img src=x onerror=alert(1)>',
          startCharIndex: 0,
          endCharIndex: 58,
          charCount: 58,
          tokenCount: 15,
          overlapPrevChars: 0,
          overlapNextChars: 0,
          isOrphan: false,
          sectionHeader: '<b>Heading & Test</b>',
        },
      ];

      const html = exportChunksToHtml(xssChunks, config, '<Injection> & Doc');
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('<img src=x');
      expect(html).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
      expect(html).toContain('&lt;b&gt;Heading &amp; Test&lt;/b&gt;');
      expect(html).toContain('&lt;Injection&gt; &amp; Doc');
    });

    it('safely serializes special characters and quotes in exportChunksToJson', () => {
      const complexChunks: ChunkMetadata[] = [
        {
          id: 'chunk-json-spec',
          index: 0,
          text: 'Line 1\nLine 2\tTabbed "Quoted" and unicode: 🚀 & <tags>',
          startCharIndex: 0,
          endCharIndex: 55,
          charCount: 55,
          tokenCount: 12,
          overlapPrevChars: 0,
          overlapNextChars: 0,
          isOrphan: false,
        },
      ];

      const jsonStr = exportChunksToJson(complexChunks, config);
      const parsed = JSON.parse(jsonStr);
      expect(parsed.chunks[0].text).toBe(complexChunks[0].text);
    });
  });
});
