import { ChunkMetadata } from '../types';

export interface RedundantPair {
  chunkAIndex: number;
  chunkBIndex: number;
  similarity: number;
  sharedKeywords: string[];
}

export interface SimilarityMatrixResult {
  matrix: number[][];
  adjacentSimilarities: number[];
  averageContinuity: number;
  redundantPairs: RedundantPair[];
  sharedKeywordsMatrix: Record<string, string[]>;
}

const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during',
  'each', 'few', 'for', 'from', 'further',
  'had', 'has', 'have', 'having', 'he', 'her', 'here', 'his', 'how',
  'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself',
  'just', 'me', 'more', 'most', 'my', 'myself',
  'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'out', 'over', 'own',
  'same', 'she', 'should', 'so', 'some', 'such',
  'than', 'that', 'the', 'their', 'theirs', 'them', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up', 'very',
  'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your'
]);

/**
 * Tokenizes text into lowercase normalized alphanumeric tokens,
 * stripping common markdown symbols, punctuation, and non-informative stop words.
 */
export function tokenizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[^a-z0-9_\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w));
}

/**
 * Computes an N x N cosine similarity matrix across all generated chunks
 * using TF-IDF weighting and L2 vector normalization.
 * 
 * Also extracts adjacent transition continuity and flags potential redundancy clusters.
 */
export function computeChunkSimilarityMatrix(
  chunks: ChunkMetadata[],
  redundancyThreshold = 0.70
): SimilarityMatrixResult {
  const N = chunks.length;

  if (N === 0) {
    return {
      matrix: [],
      adjacentSimilarities: [],
      averageContinuity: 0,
      redundantPairs: [],
      sharedKeywordsMatrix: {},
    };
  }

  // 1. Build document frequency table
  const docTokens = chunks.map((c) => tokenizeText(c.text));
  const docFreq = new Map<string, number>();

  for (const tokens of docTokens) {
    const unique = new Set(tokens);
    for (const token of unique) {
      docFreq.set(token, (docFreq.get(token) || 0) + 1);
    }
  }

  // 2. Compute L2-normalized TF-IDF sparse vector for each chunk
  const vectors = docTokens.map((tokens) => {
    const tf = new Map<string, number>();
    for (const token of tokens) {
      tf.set(token, (tf.get(token) || 0) + 1);
    }

    let normSq = 0;
    const weights = new Map<string, number>();

    for (const [token, count] of tf.entries()) {
      const df = docFreq.get(token) || 1;
      const idf = Math.log(1 + N / df) + 1;
      const weight = (1 + Math.log(count)) * idf;
      weights.set(token, weight);
      normSq += weight * weight;
    }

    const norm = Math.sqrt(normSq) || 1;
    const normalized = new Map<string, number>();

    for (const [token, weight] of weights.entries()) {
      normalized.set(token, weight / norm);
    }

    return normalized;
  });

  // 3. Compute symmetric similarity matrix & shared keywords
  const matrix: number[][] = Array.from({ length: N }, () => Array(N).fill(0));
  const redundantPairs: RedundantPair[] = [];
  const sharedKeywordsMatrix: Record<string, string[]> = {};

  for (let i = 0; i < N; i++) {
    matrix[i][i] = 1.0;

    for (let j = i + 1; j < N; j++) {
      let dot = 0;
      const vecA = vectors[i];
      const vecB = vectors[j];
      const shared: Array<{ token: string; product: number }> = [];

      for (const [token, weightA] of vecA.entries()) {
        const weightB = vecB.get(token);
        if (weightB) {
          const prod = weightA * weightB;
          dot += prod;
          shared.push({ token, product: prod });
        }
      }

      // Bound between 0 and 1
      const score = Math.max(0, Math.min(1, Math.round(dot * 1000) / 1000));
      matrix[i][j] = score;
      matrix[j][i] = score;

      // Extract top shared keywords sorted by contribution
      shared.sort((a, b) => b.product - a.product);
      const topKeywords = shared.slice(0, 5).map((s) => s.token);
      sharedKeywordsMatrix[`${i}-${j}`] = topKeywords;
      sharedKeywordsMatrix[`${j}-${i}`] = topKeywords;

      if (score >= redundancyThreshold) {
        redundantPairs.push({
          chunkAIndex: i,
          chunkBIndex: j,
          similarity: score,
          sharedKeywords: topKeywords,
        });
      }
    }
  }

  // 4. Compute adjacent chunk transition similarities
  const adjacentSimilarities: number[] = [];
  for (let i = 0; i < N - 1; i++) {
    adjacentSimilarities.push(matrix[i][i + 1]);
  }

  const averageContinuity =
    adjacentSimilarities.length > 0
      ? Math.round(
          (adjacentSimilarities.reduce((sum, val) => sum + val, 0) /
            adjacentSimilarities.length) *
            1000
        ) / 1000
      : 1.0;

  return {
    matrix,
    adjacentSimilarities,
    averageContinuity,
    redundantPairs,
    sharedKeywordsMatrix,
  };
}
