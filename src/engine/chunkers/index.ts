import { ChunkingConfig, ChunkingResult } from '../types';
import { chunkFixed } from './fixedChunker';
import { chunkRecursive } from './recursiveChunker';
import { chunkMarkdown } from './markdownChunker';
import { chunkSentence } from './sentenceChunker';
import { countTokens } from '../tokenizers/tokenizer';

export function executeChunking(text: string, config: ChunkingConfig): ChunkingResult {
  const t0 = performance.now();

  let chunks = [];
  switch (config.strategy) {
    case 'fixed':
      chunks = chunkFixed(text, config);
      break;
    case 'markdown':
      chunks = chunkMarkdown(text, config);
      break;
    case 'sentence':
      chunks = chunkSentence(text, config);
      break;
    case 'recursive':
    default:
      chunks = chunkRecursive(text, config);
      break;
  }

  const executionTimeMs = Math.round((performance.now() - t0) * 100) / 100;

  const totalChars = text.length;
  const totalTokens = countTokens(text, config.encoding);

  const chunkTokenCounts = chunks.map(c => c.tokenCount);
  const avgTokens = chunks.length > 0 ? Math.round(chunkTokenCounts.reduce((a, b) => a + b, 0) / chunks.length) : 0;
  const minTokens = chunks.length > 0 ? Math.min(...chunkTokenCounts) : 0;
  const maxTokens = chunks.length > 0 ? Math.max(...chunkTokenCounts) : 0;

  // text-embedding-3-small is $0.02 per 1M tokens ($0.00000002 per token)
  const estimatedCostUsd = (totalTokens * 0.00000002);

  return {
    strategy: config.strategy,
    chunks,
    totalChars,
    totalTokens,
    avgTokensPerChunk: avgTokens,
    minTokensPerChunk: minTokens,
    maxTokensPerChunk: maxTokens,
    estimatedCostUsd,
    executionTimeMs,
  };
}
