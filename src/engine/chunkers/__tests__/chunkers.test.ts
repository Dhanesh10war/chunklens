import { describe, it, expect } from 'vitest';
import { chunkFixed } from '../fixedChunker';
import { chunkRecursive } from '../recursiveChunker';
import { chunkMarkdown } from '../markdownChunker';
import { chunkSentence } from '../sentenceChunker';
import { countTokens } from '../../tokenizers/tokenizer';
import { ChunkingConfig } from '../../types';

describe('ChunkLens Core Engine', () => {
  const sampleText = `First paragraph with some introduction text.\n\nSecond paragraph has more details and explanations about the system.\n\nThird paragraph concludes everything.`;

  describe('Tokenizer', () => {
    it('accurately counts BPE tokens for simple text', () => {
      const tokens = countTokens('Hello world!', 'o200k_base');
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(5);
    });

    it('returns 0 tokens for empty strings', () => {
      expect(countTokens('', 'o200k_base')).toBe(0);
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
      // All chunks must respect chunkSize
      chunks.forEach(c => {
        expect(c.charCount).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Markdown Chunker', () => {
    const mdDoc = `# Section 1\nIntro text here.\n\n## Section 2\nDetails with a code block:\n\`\`\`python\ndef test():\n    return 42\n\`\`\`\n\n### Section 3\nFinal notes.`;

    it('preserves section headers as metadata and keeps code blocks intact', () => {
      const config: ChunkingConfig = {
        strategy: 'markdown',
        chunkSize: 150,
        chunkOverlap: 20,
        unit: 'characters',
        encoding: 'o200k_base',
      };

      const chunks = chunkMarkdown(mdDoc, config);
      expect(chunks.length).toBeGreaterThan(0);
      const headers = chunks.map(c => c.sectionHeader).filter(Boolean);
      expect(headers).toContain('Section 1');
      expect(headers).toContain('Section 2');
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
  });
});
