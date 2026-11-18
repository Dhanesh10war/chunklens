import { ChunkingConfig, ChunkingResult } from '../types';
import { chunkFixed } from './fixedChunker';
import { chunkRecursive } from './recursiveChunker';
import { chunkMarkdown } from './markdownChunker';
import { chunkSentence } from './sentenceChunker';
import { chunkTabular } from './tabularChunker';
import { countTokens, getTokenizer } from '../tokenizers/tokenizer';
import { setChunkerTokenizerContext, ChunkerOptions } from './context';

// Wire exact tokenizer context for worker execution and direct calls
setChunkerTokenizerContext({
  countTokens: (text, enc) => countTokens(text, enc as any),
  getTokenizer: (enc) => getTokenizer(enc as any),
});

export function executeChunking(
  text: string,
  config: ChunkingConfig,
  customOptions?: ChunkerOptions
): ChunkingResult {
  const t0 = performance.now();

  const options: ChunkerOptions = {
    countTokens: (t) => countTokens(t, config.encoding),
    getTokenizer: (enc) => getTokenizer((enc || config.encoding) as any),
    ...customOptions,
  };

  let chunks = [];
  switch (config.strategy) {
    case 'fixed':
      chunks = chunkFixed(text, config, options);
      break;
    case 'markdown':
      chunks = chunkMarkdown(text, config, options);
      break;
    case 'sentence':
      chunks = chunkSentence(text, config, options);
      break;
    case 'tabular':
      chunks = chunkTabular(text, config, options);
      break;
    case 'recursive':
    default:
      chunks = chunkRecursive(text, config, options);
      break;
  }

  const executionTimeMs = Math.round((performance.now() - t0) * 100) / 100;

  const totalChars = text.length;
  const totalTokens = countTokens(text, config.encoding);

  const chunkTokenCounts = chunks.map((c) => c.tokenCount);
  const totalChunkTokens = chunkTokenCounts.reduce((a, b) => a + b, 0);
  const avgTokens = chunks.length > 0 ? Math.round(totalChunkTokens / chunks.length) : 0;
  const minTokens = chunks.length > 0 ? Math.min(...chunkTokenCounts) : 0;
  const maxTokens = chunks.length > 0 ? Math.max(...chunkTokenCounts) : 0;

  // In RAG pipelines, vector embedding cost is paid on the total tokens of the ingested chunks (including overlap)
  // text-embedding-3-small is $0.02 per 1M tokens ($0.00000002 per token)
  const estimatedCostUsd = totalChunkTokens * 0.00000002;

  return {
    strategy: config.strategy,
    chunks,
    totalChars,
    totalTokens,
    totalChunkTokens,
    avgTokensPerChunk: avgTokens,
    minTokensPerChunk: minTokens,
    maxTokensPerChunk: maxTokens,
    estimatedCostUsd,
    executionTimeMs,
  };
}
