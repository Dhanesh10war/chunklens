import { describe, it, expect } from 'vitest';
import { computeChunkSimilarityMatrix, tokenizeText } from '../vectorizer';
import { ChunkMetadata } from '../../types';

function createMockChunk(id: number, text: string): ChunkMetadata {
  return {
    id: `chunk-${id}`,
    index: id,
    text,
    tokenCount: text.split(/\s+/).length,
    charCount: text.length,
    startCharIndex: 0,
    endCharIndex: text.length,
    overlapPrevChars: 0,
    overlapNextChars: 0,
    isOrphan: false,
  };
}

describe('tokenizeText', () => {
  it('normalizes uppercase, punctuation, and removes short tokens', () => {
    const tokens = tokenizeText('Hello, World! Vector-Search & LLMs.');
    expect(tokens).toContain('hello');
    expect(tokens).toContain('world');
    expect(tokens).toContain('vector-search');
    expect(tokens).toContain('llms');
  });
});

describe('computeChunkSimilarityMatrix', () => {
  it('returns empty structures when chunks list is empty', () => {
    const result = computeChunkSimilarityMatrix([]);
    expect(result.matrix).toEqual([]);
    expect(result.adjacentSimilarities).toEqual([]);
    expect(result.averageContinuity).toBe(0);
    expect(result.redundantPairs).toEqual([]);
  });

  it('computes 1.0 on diagonal for a single chunk', () => {
    const chunks = [createMockChunk(0, 'Single standalone chunk about indexing.')];
    const result = computeChunkSimilarityMatrix(chunks);

    expect(result.matrix).toEqual([[1.0]]);
    expect(result.averageContinuity).toBe(1.0);
  });

  it('computes 1.0 similarity for identical duplicate chunks and detects redundancy', () => {
    const chunks = [
      createMockChunk(0, 'Retrieval augmented generation with vector embeddings.'),
      createMockChunk(1, 'Retrieval augmented generation with vector embeddings.'),
    ];
    const result = computeChunkSimilarityMatrix(chunks, 0.70);

    expect(result.matrix[0][1]).toBeCloseTo(1.0, 2);
    expect(result.redundantPairs.length).toBe(1);
    expect(result.redundantPairs[0].similarity).toBeCloseTo(1.0, 2);
    expect(result.redundantPairs[0].sharedKeywords).toContain('retrieval');
  });

  it('computes 0.0 similarity for completely disjoint chunks', () => {
    const chunks = [
      createMockChunk(0, 'Quantum computing qubits and entanglement.'),
      createMockChunk(1, 'Chocolate brownie recipe with walnuts and butter.'),
    ];
    const result = computeChunkSimilarityMatrix(chunks);

    expect(result.matrix[0][1]).toBe(0);
    expect(result.redundantPairs).toEqual([]);
  });

  it('computes accurate adjacent transition scores and shared keywords', () => {
    const chunks = [
      createMockChunk(0, 'Document indexing pipeline stores embeddings in vector database.'),
      createMockChunk(1, 'Vector database performs approximate nearest neighbor search.'),
      createMockChunk(2, 'Cooking pasta requires boiling water with salt.'),
    ];
    const result = computeChunkSimilarityMatrix(chunks);

    expect(result.adjacentSimilarities.length).toBe(2);
    // Chunks 0 and 1 share 'vector' and 'database'
    expect(result.adjacentSimilarities[0]).toBeGreaterThan(0.05);
    // Chunks 1 and 2 share no meaningful technical terms
    expect(result.adjacentSimilarities[1]).toBe(0);

    const keywords01 = result.sharedKeywordsMatrix['0-1'];
    expect(keywords01).toContain('vector');
    expect(keywords01).toContain('database');
  });
});
