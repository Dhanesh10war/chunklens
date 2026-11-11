import { describe, it, expect } from 'vitest';
import {
  compareTokenizers,
  estimateTokensForModel,
  SUPPORTED_MODELS,
} from '../multiModel';
import { ChunkMetadata } from '../../types';

describe('multiModel tokenizer engine', () => {
  const sampleProse = 'Retrieval-Augmented Generation (RAG) optimizes the output of a large language model.';
  const sampleCode = `function retrieveContext(query: string, k: number = 5): Promise<Chunk[]> {
  const embedding = await vectorizer.embed(query);
  return index.query({ vector: embedding, topK: k });
}`;

  describe('estimateTokensForModel', () => {
    it('returns 0 for empty or whitespace string', () => {
      expect(estimateTokensForModel('', 'gpt-4o', 0, 0)).toBe(0);
      expect(estimateTokensForModel('   ', 'claude-3-5', 0, 0)).toBe(0);
    });

    it('returns exact counts for gpt-4o and gpt-4', () => {
      expect(estimateTokensForModel(sampleProse, 'gpt-4o', 14, 16)).toBe(14);
      expect(estimateTokensForModel(sampleProse, 'gpt-4', 14, 16)).toBe(16);
    });

    it('estimates Claude 3.5 tokens with expansion relative to cl100k', () => {
      const claudeProse = estimateTokensForModel(sampleProse, 'claude-3-5', 14, 16);
      expect(claudeProse).toBeGreaterThan(16);

      // Code with high symbol density should have higher expansion
      const claudeCode = estimateTokensForModel(sampleCode, 'claude-3-5', 35, 40);
      expect(claudeCode).toBeGreaterThan(42);
    });

    it('estimates Meta Llama 3 tokens close to o200k', () => {
      const llamaTokens = estimateTokensForModel(sampleProse, 'llama-3', 14, 16);
      expect(llamaTokens).toBeGreaterThanOrEqual(14);
      expect(llamaTokens).toBeLessThan(20);
    });

    it('estimates Gemini 1.5 with SentencePiece whitespace compression', () => {
      const geminiTokens = estimateTokensForModel('    indented text block    ', 'gemini-1-5', 6, 8);
      expect(geminiTokens).toBeGreaterThan(0);
    });
  });

  describe('compareTokenizers', () => {
    const mockChunks: ChunkMetadata[] = [
      {
        id: '1',
        index: 0,
        text: sampleProse,
        startCharIndex: 0,
        endCharIndex: sampleProse.length,
        charCount: sampleProse.length,
        tokenCount: 14,
        overlapPrevChars: 0,
        overlapNextChars: 0,
        isOrphan: false,
      },
      {
        id: '2',
        index: 1,
        text: 'word '.repeat(600), // 601 tokens, exceeds 512 limit
        startCharIndex: sampleProse.length,
        endCharIndex: sampleProse.length + 3000,
        charCount: 3000,
        tokenCount: 601,
        overlapPrevChars: 0,
        overlapNextChars: 0,
        isOrphan: false,
      },
    ];

    it('produces statistics for all supported models', () => {
      const result = compareTokenizers(sampleProse, mockChunks, 'o200k_base');
      expect(result.models.length).toBe(SUPPORTED_MODELS.length);
      expect(result.baselineEncoding).toBe('o200k_base');
      expect(result.baselineTokens).toBeGreaterThan(0);

      const gpt4o = result.models.find((m) => m.id === 'gpt-4o');
      expect(gpt4o).toBeDefined();
      expect(gpt4o?.variancePercentVsBaseline).toBe(0.0);
      expect(gpt4o?.isExact).toBe(true);
    });

    it('computes positive variance for cl100k vs o200k baseline on prose', () => {
      const result = compareTokenizers(sampleProse, mockChunks, 'o200k_base');
      const gpt4 = result.models.find((m) => m.id === 'gpt-4');
      expect(gpt4).toBeDefined();
      // cl100k typically has higher token count than o200k
      expect(gpt4?.totalDocTokens).toBeGreaterThanOrEqual(result.baselineTokens);
    });

    it('accurately identifies 512-token truncation risks', () => {
      const result = compareTokenizers(sampleProse, mockChunks, 'o200k_base');
      expect(result.truncationRisk.limit512Exceeded).toBe(1);
      expect(result.truncationRisk.exceededChunkIndices512).toContain(2); // Chunk #2 exceeded 512
      expect(result.truncationRisk.limit2048Exceeded).toBe(0);
    });

    it('calculates vector ingestion costs for multi-provider embeddings', () => {
      const result = compareTokenizers(sampleProse, mockChunks, 'o200k_base');
      expect(result.costs.length).toBe(5);

      const openAiSmall = result.costs.find((c) => c.model === 'text-embedding-3-small');
      expect(openAiSmall).toBeDefined();
      expect(openAiSmall?.ratePerMillion).toBe(0.02);
      expect(openAiSmall?.singleDocCost).toBeGreaterThanOrEqual(0);
      expect(openAiSmall?.scale10kCost).toBe(Number((openAiSmall!.singleDocCost * 10_000).toFixed(3)));
    });

    it('handles empty input gracefully', () => {
      const result = compareTokenizers('', [], 'o200k_base');
      expect(result.baselineTokens).toBe(0);
      expect(result.truncationRisk.limit512Exceeded).toBe(0);
      expect(result.models.every((m) => m.totalDocTokens === 0)).toBe(true);
      expect(result.costs.every((c) => c.singleDocCost === 0)).toBe(true);
    });
  });
});
