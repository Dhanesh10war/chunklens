export type ChunkingStrategy = 'recursive' | 'fixed' | 'markdown' | 'sentence' | 'tabular';

export type TokenizerEncoding = 'o200k_base' | 'cl100k_base';

export type ChunkUnit = 'tokens' | 'characters';

export interface ChunkMetadata {
  id: string;
  index: number;
  text: string;
  startCharIndex: number;
  endCharIndex: number;
  charCount: number;
  tokenCount: number;
  overlapPrevChars: number;
  overlapNextChars: number;
  isOrphan: boolean;
  sectionHeader?: string;
}

export interface ChunkingConfig {
  strategy: ChunkingStrategy;
  chunkSize: number;
  chunkOverlap: number;
  unit: ChunkUnit;
  encoding: TokenizerEncoding;
  separators?: string[];
}

export interface ChunkingResult {
  strategy: ChunkingStrategy;
  chunks: ChunkMetadata[];
  totalChars: number;
  totalTokens: number;
  totalChunkTokens: number;
  avgTokensPerChunk: number;
  minTokensPerChunk: number;
  maxTokensPerChunk: number;
  estimatedCostUsd: number; // e.g. text-embedding-3-small ($0.02 per 1M tokens)
  executionTimeMs: number;
}

export interface SampleDocument {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string;
}

export type CodeExportFramework = 'langchain-python' | 'llamaindex-python' | 'langchain-js' | 'native-python';
