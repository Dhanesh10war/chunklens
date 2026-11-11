import { describe, it, expect } from 'vitest';
import { chunkFixed } from '../fixedChunker';
import { chunkRecursive } from '../recursiveChunker';
import { chunkMarkdown } from '../markdownChunker';
import { chunkSentence } from '../sentenceChunker';
import { executeChunking } from '../index';
import { countTokens, truncateByTokens } from '../../tokenizers/tokenizer';
import { ChunkingConfig } from '../../types';

describe('ChunkLens Core Engine', () => {
  const sampleText = `First paragraph with some introduction text.\n\nSecond paragraph has more details and explanations about the system.\n\nThird paragraph concludes everything.`;

  describe('Tokenizer', () => {
    it('accurately counts BPE tokens for simple text (o200k_base)', () => {
      const tokens = countTokens('Hello world!', 'o200k_base');
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(5);
    });

    it('accurately counts BPE tokens for cl100k_base', () => {
      const tokens = countTokens('Hello world!', 'cl100k_base');
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(5);
    });

    it('returns 0 tokens for empty strings', () => {
      expect(countTokens('', 'o200k_base')).toBe(0);
    });

    it('truncates text by tokens correctly', () => {
      const text = 'The quick brown fox jumps over the lazy dog and runs away.';
      const truncated = truncateByTokens(text, 4, 'o200k_base');
      const count = countTokens(truncated, 'o200k_base');
      expect(count).toBeLessThanOrEqual(4);
    });
  });

  describe('Fixed Chunker', () => {
    it('splits text into exact character chunks with overlap', () => {
      const config: ChunkingConfig = {
        strategy: 'fixed',
        chunkSize: 40,
        chunkOverlap: 10,
        unit: 'characters',
        encoding: 'o200k_base',
      };

      const chunks = chunkFixed(sampleText, config);
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0].charCount).toBeLessThanOrEqual(40);
      expect(chunks[1].overlapPrevChars).toBe(10);
    });

    it('splits text using token units with sliding window', () => {
      const config: ChunkingConfig = {
        strategy: 'fixed',
        chunkSize: 10,
        chunkOverlap: 2,
        unit: 'tokens',
        encoding: 'o200k_base',
      };

      const chunks = chunkFixed(sampleText, config);
      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach((chunk) => {
        expect(chunk.tokenCount).toBeLessThanOrEqual(10);
      });
      expect(chunks[0].startCharIndex).toBeGreaterThanOrEqual(0);
    });

    it('safely handles overlap >= chunkSize without crashing', () => {
      const config: ChunkingConfig = {
        strategy: 'fixed',
        chunkSize: 20,
        chunkOverlap: 25,
        unit: 'characters',
        encoding: 'o200k_base',
      };

      const chunks = chunkFixed('Hello world test string for safety.', config);
      expect(chunks.length).toBeGreaterThan(0);
    });

    it('flags orphan mid-word cuts', () => {
      const config: ChunkingConfig = {
        strategy: 'fixed',
        chunkSize: 8,
        chunkOverlap: 0,
        unit: 'characters',
        encoding: 'o200k_base',
      };

      const chunks = chunkFixed('abcdefgh ijklmnop', config);
      expect(chunks.length).toBeGreaterThan(1);
    });
  });

  describe('Recursive Character Chunker', () => {
    it('hierarchically splits by paragraphs without splitting words', () => {
      const config: ChunkingConfig = {
        strategy: 'recursive',
        chunkSize: 80,
        chunkOverlap: 15,
        unit: 'characters',
        encoding: 'o200k_base',
        separators: ['\n\n', '\n', ' ', ''],
      };

      const chunks = chunkRecursive(sampleText, config);
      expect(chunks.length).toBeGreaterThan(0);
      chunks.forEach((c) => {
        expect(c.charCount).toBeLessThanOrEqual(80);
      });
    });

    it('strictly enforces chunkSize when unit is tokens', () => {
      const config: ChunkingConfig = {
        strategy: 'recursive',
        chunkSize: 15,
        chunkOverlap: 3,
        unit: 'tokens',
        encoding: 'o200k_base',
      };

      const chunks = chunkRecursive(sampleText, config);
      expect(chunks.length).toBeGreaterThan(0);
      chunks.forEach((c) => {
        expect(c.tokenCount).toBeLessThanOrEqual(15);
      });
    });

    it('returns empty array for empty or whitespace text', () => {
      const config: ChunkingConfig = {
        strategy: 'recursive',
        chunkSize: 50,
        chunkOverlap: 10,
        unit: 'characters',
        encoding: 'o200k_base',
      };

      expect(chunkRecursive('', config)).toEqual([]);
      expect(chunkRecursive('   \n\n  ', config)).toEqual([]);
    });
  });

  describe('Markdown Chunker', () => {
    const mdDoc = `# Section 1\nIntro text here.\n\n## Section 2\nDetails with a code block:\n\`\`\`python\ndef test():\n    return 42\n\`\`\`\n\n### Section 3\nFinal notes.`;

    it('preserves section headers as metadata', () => {
      const config: ChunkingConfig = {
        strategy: 'markdown',
        chunkSize: 150,
        chunkOverlap: 20,
        unit: 'characters',
        encoding: 'o200k_base',
      };

      const chunks = chunkMarkdown(mdDoc, config);
      expect(chunks.length).toBeGreaterThan(0);
      const headers = chunks.map((c) => c.sectionHeader).filter(Boolean);
      expect(headers).toContain('Section 1');
      expect(headers).toContain('Section 2');
    });

    it('preserves code blocks containing internal blank lines without splitting fences', () => {
      const mdWithCode = `# Header\n\n\`\`\`python\ndef foo():\n\n    # Line with blank line above\n    return True\n\`\`\`\n\nParagraph text after.`;
      const config: ChunkingConfig = {
        strategy: 'markdown',
        chunkSize: 100,
        chunkOverlap: 10,
        unit: 'characters',
        encoding: 'o200k_base',
      };

      const chunks = chunkMarkdown(mdWithCode, config);
      expect(chunks.length).toBeGreaterThan(0);
      // Ensure any chunk with opening fence has closing fence
      chunks.forEach((chunk) => {
        const opens = (chunk.text.match(/```/g) || []).length;
        expect(opens % 2).toBe(0);
      });
    });

    it('properly encloses fences even when code block is oversized', () => {
      const longCode = `# Code\n\n\`\`\`python\nline_1 = 1\nline_2 = 2\nline_3 = 3\nline_4 = 4\nline_5 = 5\n\`\`\``;
      const config: ChunkingConfig = {
        strategy: 'markdown',
        chunkSize: 45,
        chunkOverlap: 5,
        unit: 'characters',
        encoding: 'o200k_base',
      };

      const chunks = chunkMarkdown(longCode, config);
      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach((chunk) => {
        if (chunk.text.includes('```')) {
          const opens = (chunk.text.match(/```/g) || []).length;
          expect(opens % 2).toBe(0);
        }
      });
    });
  });

  describe('Sentence Chunker', () => {
    const sentences = 'The system booted normally. All sensors reported zero anomalies. Final verification passed with high confidence.';

    it('splits along sentence punctuation', () => {
      const config: ChunkingConfig = {
        strategy: 'sentence',
        chunkSize: 50,
        chunkOverlap: 0,
        unit: 'characters',
        encoding: 'o200k_base',
      };

      const chunks = chunkSentence(sentences, config);
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0].text).toContain('The system booted normally.');
    });

    it('strictly enforces chunkSize when individual sentences are oversized', () => {
      const longSentence = 'This is an extraordinarily long sentence without any punctuation whatsoever that easily exceeds thirty characters in length.';
      const config: ChunkingConfig = {
        strategy: 'sentence',
        chunkSize: 30,
        chunkOverlap: 5,
        unit: 'characters',
        encoding: 'o200k_base',
      };

      const chunks = chunkSentence(longSentence, config);
      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach((chunk) => {
        expect(chunk.charCount).toBeLessThanOrEqual(30);
      });
    });

    it('protects common abbreviations from false splits', () => {
      const abbrText = 'Dr. Smith consulted with Inc. representatives at 5 p.m. regarding the protocol. All systems verified.';
      const config: ChunkingConfig = {
        strategy: 'sentence',
        chunkSize: 150,
        chunkOverlap: 0,
        unit: 'characters',
        encoding: 'o200k_base',
      };

      const chunks = chunkSentence(abbrText, config);
      expect(chunks.length).toBe(1);
      expect(chunks[0].text).toContain('Dr. Smith');
    });
  });

  describe('Execute Chunking Aggregator', () => {
    it('computes correct metrics including latency and cost', () => {
      const config: ChunkingConfig = {
        strategy: 'recursive',
        chunkSize: 100,
        chunkOverlap: 20,
        unit: 'characters',
        encoding: 'o200k_base',
      };

      const result = executeChunking(sampleText, config);
      expect(result.strategy).toBe('recursive');
      expect(result.totalChars).toBe(sampleText.length);
      expect(result.totalTokens).toBeGreaterThan(0);
      expect(result.totalChunkTokens).toBeGreaterThan(0);
      expect(result.chunks.length).toBeGreaterThan(0);
      expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.estimatedCostUsd).toBeGreaterThanOrEqual(0);
    });

    it('handles empty input cleanly without NaN metrics', () => {
      const config: ChunkingConfig = {
        strategy: 'recursive',
        chunkSize: 100,
        chunkOverlap: 20,
        unit: 'characters',
        encoding: 'o200k_base',
      };

      const result = executeChunking('', config);
      expect(result.chunks.length).toBe(0);
      expect(result.totalChars).toBe(0);
      expect(result.totalTokens).toBe(0);
      expect(result.avgTokensPerChunk).toBe(0);
      expect(result.minTokensPerChunk).toBe(0);
      expect(result.maxTokensPerChunk).toBe(0);
      expect(result.estimatedCostUsd).toBe(0);
    });
  });
});
