import { describe, it, expect } from 'vitest';
import { generateExportCode } from '../codeExporters';
import { ChunkingConfig } from '../../engine/types';

describe('Code Exporters (Strategy-Aware)', () => {
  const baseConfig: ChunkingConfig = {
    strategy: 'recursive',
    chunkSize: 500,
    chunkOverlap: 50,
    unit: 'tokens',
    encoding: 'o200k_base',
  };

  describe('LangChain Python', () => {
    it('generates Recursive splitter code', () => {
      const code = generateExportCode(baseConfig, 'langchain-python');
      expect(code).toContain('RecursiveCharacterTextSplitter');
      expect(code).toContain('chunk_size=500');
      expect(code).toContain('chunk_overlap=50');
      expect(code).toContain('token_length_function');
    });

    it('generates MarkdownHeaderTextSplitter for markdown strategy', () => {
      const code = generateExportCode({ ...baseConfig, strategy: 'markdown' }, 'langchain-python');
      expect(code).toContain('MarkdownHeaderTextSplitter');
      expect(code).toContain('headers_to_split_on');
      expect(code).toContain('RecursiveCharacterTextSplitter');
    });

    it('generates Sentence splitter for sentence strategy', () => {
      const code = generateExportCode({ ...baseConfig, strategy: 'sentence' }, 'langchain-python');
      expect(code).toContain('RecursiveCharacterTextSplitter');
      expect(code).toContain('separators=[". ", "! ", "? "');
    });

    it('generates CharacterTextSplitter for fixed strategy', () => {
      const code = generateExportCode({ ...baseConfig, strategy: 'fixed' }, 'langchain-python');
      expect(code).toContain('CharacterTextSplitter');
      expect(code).toContain('separator=""');
    });
  });

  describe('LlamaIndex Python', () => {
    it('generates SentenceSplitter for sentence/recursive strategy', () => {
      const code = generateExportCode(baseConfig, 'llamaindex-python');
      expect(code).toContain('SentenceSplitter');
      expect(code).toContain('o200k_base');
    });

    it('generates MarkdownNodeParser for markdown strategy', () => {
      const code = generateExportCode({ ...baseConfig, strategy: 'markdown' }, 'llamaindex-python');
      expect(code).toContain('MarkdownNodeParser');
    });

    it('generates TokenTextSplitter for fixed strategy', () => {
      const code = generateExportCode({ ...baseConfig, strategy: 'fixed' }, 'llamaindex-python');
      expect(code).toContain('TokenTextSplitter');
    });
  });

  describe('LangChain.js (TypeScript)', () => {
    it('generates RecursiveCharacterTextSplitter for recursive strategy', () => {
      const code = generateExportCode(baseConfig, 'langchain-js');
      expect(code).toContain('RecursiveCharacterTextSplitter');
      expect(code).toContain('chunkSize: 500');
    });

    it('generates MarkdownHeaderTextSplitter for markdown strategy', () => {
      const code = generateExportCode({ ...baseConfig, strategy: 'markdown' }, 'langchain-js');
      expect(code).toContain('MarkdownHeaderTextSplitter');
      expect(code).toContain('headersToSplitOn');
    });
  });

  describe('Native Python', () => {
    it('generates standalone markdown chunker function', () => {
      const code = generateExportCode({ ...baseConfig, strategy: 'markdown' }, 'native-python');
      expect(code).toContain('def chunk_markdown(');
    });

    it('generates standalone sentence chunker function', () => {
      const code = generateExportCode({ ...baseConfig, strategy: 'sentence' }, 'native-python');
      expect(code).toContain('def chunk_sentences(');
    });

    it('generates standalone sliding window chunker function for fixed', () => {
      const code = generateExportCode({ ...baseConfig, strategy: 'fixed' }, 'native-python');
      expect(code).toContain('def chunk_text(');
    });
  });
});
