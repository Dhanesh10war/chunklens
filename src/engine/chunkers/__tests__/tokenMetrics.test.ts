import { describe, it, expect } from 'vitest';
import { executeChunking } from '../index';
import { ChunkingConfig } from '../../types';

describe('Token & Character Count Reconciliation (Item 3.5)', () => {
  const sampleDoc = `Retrieval-Augmented Generation (RAG) combines semantic search with large language models.
Chunking documents is the foundation of RAG quality. When chunks overlap, boundary tokens are included in both adjacent chunks.
This guarantees semantic continuity during retrieval, but increases total ingested tokens compared to the raw document.`;

  it('reconciles raw document tokens vs ingested tokens with overlap', () => {
    const configWithOverlap: ChunkingConfig = {
      strategy: 'recursive',
      chunkSize: 20,
      chunkOverlap: 8,
      unit: 'tokens',
      encoding: 'cl100k_base',
      separators: ['\n', ' ', ''],
    };

    const result = executeChunking(sampleDoc, configWithOverlap);

    expect(result.chunks.length).toBeGreaterThan(1);
    expect(result.totalChars).toBe(sampleDoc.length);
    // Ingested tokens must strictly exceed raw document tokens because overlap is duplicated
    expect(result.totalChunkTokens).toBeGreaterThan(result.totalTokens);
    expect(result.totalChunkTokens).toBe(
      result.chunks.reduce((acc, c) => acc + c.tokenCount, 0)
    );
  });

  it('proves zero-overlap chunking has identical document and ingested token counts', () => {
    const configZeroOverlap: ChunkingConfig = {
      strategy: 'fixed',
      chunkSize: 25,
      chunkOverlap: 0,
      unit: 'tokens',
      encoding: 'cl100k_base',
    };

    const result = executeChunking(sampleDoc, configZeroOverlap);

    expect(result.chunks.length).toBeGreaterThan(1);
    expect(result.totalChars).toBe(sampleDoc.length);
    // With zero overlap, every token belongs to exactly one chunk
    expect(result.totalChunkTokens).toBe(result.totalTokens);
  });

  it('accurately reports totalChars without trimming or silent mutation', () => {
    const paddedDoc = `   ${sampleDoc}   \n\n`;
    const config: ChunkingConfig = {
      strategy: 'fixed',
      chunkSize: 50,
      chunkOverlap: 5,
      unit: 'tokens',
      encoding: 'cl100k_base',
    };

    const result = executeChunking(paddedDoc, config);
    expect(result.totalChars).toBe(paddedDoc.length);
  });
});
