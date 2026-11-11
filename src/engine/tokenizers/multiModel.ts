import { TokenizerEncoding, ChunkMetadata } from '../types';
import { countTokens } from './tokenizer';

export type ModelFamily = 'OpenAI' | 'Anthropic' | 'Meta' | 'Google' | 'Cohere';

export interface ModelProfile {
  id: string;
  name: string;
  family: ModelFamily;
  tokenizerName: string;
  vocabSize: string;
  isExact: boolean;
  contextWindow: string;
  description: string;
}

export const SUPPORTED_MODELS: ModelProfile[] = [
  {
    id: 'gpt-4o',
    name: 'OpenAI GPT-4o / mini',
    family: 'OpenAI',
    tokenizerName: 'o200k_base (BPE)',
    vocabSize: '200,000',
    isExact: true,
    contextWindow: '128k',
    description: 'Native OpenAI flagship tokenizer with high-efficiency unicode & code compression.',
  },
  {
    id: 'gpt-4',
    name: 'OpenAI GPT-4 / 3.5 / Ada',
    family: 'OpenAI',
    tokenizerName: 'cl100k_base (BPE)',
    vocabSize: '100,000',
    isExact: true,
    contextWindow: '128k',
    description: 'Standard OpenAI legacy embedding and completion tokenizer.',
  },
  {
    id: 'claude-3-5',
    name: 'Anthropic Claude 3.5 Sonnet',
    family: 'Anthropic',
    tokenizerName: 'Claude BPE Profile',
    vocabSize: '~65,000',
    isExact: false,
    contextWindow: '200k',
    description: 'Anthropic custom BPE tokenizer; higher token expansion on code and symbols.',
  },
  {
    id: 'llama-3',
    name: 'Meta Llama 3 / 3.1 / 3.2',
    family: 'Meta',
    tokenizerName: 'Tiktoken BPE (128k)',
    vocabSize: '128,000',
    isExact: false,
    contextWindow: '128k',
    description: 'Meta open-weight flagship tokenizer optimized for multilingual and coding.',
  },
  {
    id: 'gemini-1-5',
    name: 'Google Gemini 1.5 Pro / Flash',
    family: 'Google',
    tokenizerName: 'SentencePiece (256k)',
    vocabSize: '256,000',
    isExact: false,
    contextWindow: '1M – 2M',
    description: 'DeepMind 256k SentencePiece tokenizer with superior whitespace handling.',
  },
  {
    id: 'cohere-command',
    name: 'Cohere Command R+ / Embed v3',
    family: 'Cohere',
    tokenizerName: 'Cohere BPE (256k)',
    vocabSize: '256,000',
    isExact: false,
    contextWindow: '128k',
    description: 'Cohere enterprise RAG and multilingual retrieval tokenizer.',
  },
];

export interface ModelTokenStats {
  id: string;
  name: string;
  family: ModelFamily;
  tokenizerName: string;
  isExact: boolean;
  totalDocTokens: number;
  totalChunkTokens: number;
  maxChunkTokens: number;
  avgTokensPerChunk: number;
  variancePercentVsBaseline: number;
  charsPerToken: number;
}

export interface IngestionCostEstimate {
  provider: string;
  model: string;
  ratePerMillion: number;
  singleDocCost: number;
  scale10kCost: number;
  scale100kCost: number;
}

export interface TruncationRiskSummary {
  limit512Exceeded: number;
  limit2048Exceeded: number;
  limit8192Exceeded: number;
  exceededChunkIndices512: number[];
  exceededChunkIndices2048: number[];
}

export interface MultiModelComparisonResult {
  baselineEncoding: TokenizerEncoding;
  baselineTokens: number;
  models: ModelTokenStats[];
  costs: IngestionCostEstimate[];
  truncationRisk: TruncationRiskSummary;
}

/**
 * Calculates empirical token count for non-js-tiktoken models based on text morphology
 */
export function estimateTokensForModel(
  text: string,
  modelId: string,
  exactO200k: number,
  exactCl100k: number
): number {
  if (!text || text.trim().length === 0) return 0;

  if (modelId === 'gpt-4o') return exactO200k;
  if (modelId === 'gpt-4') return exactCl100k;

  // Compute punctuation and symbol ratio
  const symbolCount = (text.match(/[{}\[\]()<>;:,_./\\+\-=%&*^$#@!~|`]/g) || []).length;
  const whitespaceCount = (text.match(/\s/g) || []).length;
  const symbolDensity = symbolCount / Math.max(1, text.length);
  const whitespaceDensity = whitespaceCount / Math.max(1, text.length);

  switch (modelId) {
    case 'claude-3-5': {
      // Claude has ~1.06x prose baseline vs cl100k, expanding up to 1.25x with heavy symbols/code
      const multiplier = 1.06 + Math.min(0.20, symbolDensity * 0.85);
      return Math.round(exactCl100k * multiplier);
    }
    case 'llama-3': {
      // Llama 3 has 128k vocab; ~1.03x vs o200k on prose, ~1.06x with punctuation
      const multiplier = 1.03 + Math.min(0.08, symbolDensity * 0.25);
      return Math.round(exactO200k * multiplier);
    }
    case 'gemini-1-5': {
      // Gemini 256k SentencePiece compresses whitespace and common bigrams efficiently
      const whitespaceCompression = Math.min(0.05, whitespaceDensity * 0.15);
      const multiplier = 0.98 + Math.min(0.08, symbolDensity * 0.3) - whitespaceCompression;
      return Math.max(1, Math.round(exactO200k * multiplier));
    }
    case 'cohere-command': {
      // Cohere 256k BPE
      const multiplier = 1.01 + Math.min(0.06, symbolDensity * 0.22);
      return Math.round(exactO200k * multiplier);
    }
    default:
      return exactO200k;
  }
}

/**
 * Compares tokenization metrics across all major LLM and embedding providers
 */
export function compareTokenizers(
  rawText: string,
  chunks: ChunkMetadata[],
  baselineEncoding: TokenizerEncoding = 'o200k_base'
): MultiModelComparisonResult {
  const cleanDoc = rawText || '';
  const docO200k = countTokens(cleanDoc, 'o200k_base');
  const docCl100k = countTokens(cleanDoc, 'cl100k_base');

  const baselineTokens = baselineEncoding === 'o200k_base' ? docO200k : docCl100k;

  // Pre-calculate per-chunk base tokens once to avoid redundant BPE encoding passes
  const baseChunkCounts = chunks.map((chunk) => ({
    text: chunk.text,
    o200k: countTokens(chunk.text, 'o200k_base'),
    cl100k: countTokens(chunk.text, 'cl100k_base'),
  }));

  const chunkTokenCache: Record<string, number[]> = {};
  for (const model of SUPPORTED_MODELS) {
    chunkTokenCache[model.id] = baseChunkCounts.map(({ text, o200k, cl100k }) =>
      estimateTokensForModel(text, model.id, o200k, cl100k)
    );
  }

  // Model statistics
  const models: ModelTokenStats[] = SUPPORTED_MODELS.map((model) => {
    const chunkTokens = chunkTokenCache[model.id] || [];
    const totalChunkTokens = chunkTokens.reduce((sum, count) => sum + count, 0);
    const maxChunkTokens = chunkTokens.length > 0 ? Math.max(...chunkTokens) : 0;
    const avgTokensPerChunk = chunkTokens.length > 0 ? Math.round(totalChunkTokens / chunkTokens.length) : 0;

    const totalDocTokens = estimateTokensForModel(cleanDoc, model.id, docO200k, docCl100k);

    const variancePercentVsBaseline =
      baselineTokens > 0
        ? Number((((totalDocTokens - baselineTokens) / baselineTokens) * 100).toFixed(1))
        : 0;

    const charsPerToken =
      totalDocTokens > 0 ? Number((cleanDoc.length / totalDocTokens).toFixed(2)) : 0;

    return {
      id: model.id,
      name: model.name,
      family: model.family,
      tokenizerName: model.tokenizerName,
      isExact: model.isExact,
      totalDocTokens,
      totalChunkTokens,
      maxChunkTokens,
      avgTokensPerChunk,
      variancePercentVsBaseline,
      charsPerToken,
    };
  });

  // Calculate Truncation Risks across active chunks
  // We use the baseline model's chunk token counts for boundary checking
  const activeChunkTokens =
    baselineEncoding === 'o200k_base' ? chunkTokenCache['gpt-4o'] : chunkTokenCache['gpt-4'];

  const exceededIndices512: number[] = [];
  const exceededIndices2048: number[] = [];
  let limit8192Exceeded = 0;

  activeChunkTokens.forEach((count, idx) => {
    if (count > 512) exceededIndices512.push(idx + 1);
    if (count > 2048) exceededIndices2048.push(idx + 1);
    if (count > 8192) limit8192Exceeded++;
  });

  const truncationRisk: TruncationRiskSummary = {
    limit512Exceeded: exceededIndices512.length,
    limit2048Exceeded: exceededIndices2048.length,
    limit8192Exceeded,
    exceededChunkIndices512: exceededIndices512,
    exceededChunkIndices2048: exceededIndices2048,
  };

  // Ingestion Cost Matrix for Popular Vector Embeddings
  const totalIngestedTokens =
    baselineEncoding === 'o200k_base'
      ? models.find((m) => m.id === 'gpt-4o')?.totalChunkTokens || 0
      : models.find((m) => m.id === 'gpt-4')?.totalChunkTokens || 0;

  const costRates = [
    { provider: 'OpenAI', model: 'text-embedding-3-small', rate: 0.02 },
    { provider: 'Google Vertex AI', model: 'text-embedding-004', rate: 0.025 },
    { provider: 'Voyage AI', model: 'voyage-3', rate: 0.06 },
    { provider: 'Cohere', model: 'embed-english-v3.0', rate: 0.10 },
    { provider: 'OpenAI', model: 'text-embedding-3-large', rate: 0.13 },
  ];

  const costs: IngestionCostEstimate[] = costRates.map(({ provider, model, rate }) => {
    const singleDocCost = Number(((totalIngestedTokens / 1_000_000) * rate).toFixed(6));
    const scale10kCost = Number((singleDocCost * 10_000).toFixed(3));
    const scale100kCost = Number((singleDocCost * 100_000).toFixed(2));

    return {
      provider,
      model,
      ratePerMillion: rate,
      singleDocCost,
      scale10kCost,
      scale100kCost,
    };
  });

  return {
    baselineEncoding,
    baselineTokens,
    models,
    costs,
    truncationRisk,
  };
}
