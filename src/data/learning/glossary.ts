import { GlossaryTerm } from './types';

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: 'rag',
    term: 'RAG (Retrieval-Augmented Generation)',
    category: 'Foundations',
    definition: 'An architectural pattern that supplements large language models with external, authoritative knowledge retrieved from indexed documents at query time.',
    formulaOrExample: 'Prompt = System Instructions + Retrieved Chunks + User Query',
    seeAlso: ['Vector Search', 'Chunking', 'Dense Retrieval'],
  },
  {
    id: 'chunk',
    term: 'Chunk',
    category: 'Chunking',
    definition: 'A bounded segment of a document produced by a splitting strategy, sized for indexing and retrieval within an LLM context budget.',
    seeAlso: ['Chunk Size', 'Chunk Overlap'],
  },
  {
    id: 'chunk-size',
    term: 'Chunk Size',
    category: 'Chunking',
    definition: 'The maximum allowable length (measured in characters or tokens) allocated to any individual chunk segment before splitting.',
    seeAlso: ['Chunk Overlap', 'Context Window'],
  },
  {
    id: 'chunk-overlap',
    term: 'Chunk Overlap',
    category: 'Chunking',
    definition: 'The quantity of characters or tokens duplicated between contiguous sequential chunks to preserve narrative and semantic continuity across boundaries.',
    seeAlso: ['Context Cliff', 'Boundary Continuity'],
  },
  {
    id: 'token',
    term: 'Token',
    category: 'LLM Architecture',
    definition: 'The fundamental atomic subword or byte sequence produced by a tokenizer (e.g. BPE) that language models read and generate.',
    formulaOrExample: 'Typical English prose: 1 token ≈ 4 characters or ~0.75 words',
    seeAlso: ['BPE (Byte-Pair Encoding)', 'o200k_base', 'cl100k_base'],
  },
  {
    id: 'embedding',
    term: 'Embedding',
    category: 'Vector Search',
    definition: 'A dense, low-dimensional numerical vector (e.g. 768 or 1,536 dimensions) representing the semantic meaning of a text passage.',
    formulaOrExample: 'vector = embed(chunk_text) ∈ ℝ^d',
    seeAlso: ['Vector Search', 'Cosine Similarity'],
  },
  {
    id: 'vector-database',
    term: 'Vector Database',
    category: 'Vector Search',
    definition: 'A specialized data store optimized for storing dense embedding vectors and performing approximate nearest neighbor (ANN) similarity search.',
    seeAlso: ['Embedding', 'Hybrid Search'],
  },
  {
    id: 'bm25',
    term: 'BM25 (Best Matching 25)',
    category: 'Vector Search',
    definition: 'A probabilistic term-weighting ranking function used in information retrieval. Unlike raw TF-IDF, BM25 uses non-linear term frequency saturation and document length normalization, serving as a widely adopted baseline for sparse lexical search.',
    formulaOrExample: 'Score(D, Q) = Σ IDF(qi) · [f(qi, D) · (k1 + 1)] / [f(qi, D) + k1 · (1 - b + b · |D| / avgdl)]',
    seeAlso: ['Hybrid Search', 'RRF (Reciprocal Rank Fusion)'],
  },
  {
    id: 'rrf',
    term: 'Reciprocal Rank Fusion (RRF)',
    category: 'Vector Search',
    definition: 'An algorithmic technique for combining the ranked search results of multiple independent retrieval algorithms (such as dense vector similarity and sparse BM25 keyword matching) without requiring manual score normalization.',
    formulaOrExample: 'RRF_Score(doc) = Σ (1 / (60 + rank(doc, system_i)))',
    seeAlso: ['Hybrid Search', 'BM25'],
  },
  {
    id: 'chunk-utilization',
    term: 'Chunk Utilization Rate',
    category: 'Evaluation',
    definition: 'The percentage of tokens in a retrieved chunk that were directly used or referenced by the LLM in synthesizing its final answer. High chunk utilization (> 70%) indicates tight chunk sizing; low utilization (< 25%) indicates chunks contain excessive extraneous noise.',
    seeAlso: ['Context Relevance', 'Semantic Bloat'],
  },
  {
    id: 'lost-in-the-middle',
    term: 'Lost in the Middle',
    category: 'LLM Architecture',
    definition: 'The empirical observation that LLM performance degrades when target factual evidence is positioned in the center of long multi-chunk input prompts compared to the beginning or end of the context window.',
    seeAlso: ['Cross-Encoder Re-Ranking', 'Attention Degradation'],
  },
  {
    id: 'colbert',
    term: 'ColBERT (Late Interaction)',
    category: 'Vector Search',
    definition: 'A dense retrieval architecture that preserves contextualized token-level embeddings instead of condensing an entire document into a single vector. Uses MaxSim operator to compute fine-grained token alignments.',
    formulaOrExample: 'Score(Q, D) = Σ_i max_j (E_qi · D_dj)',
    seeAlso: ['Dense Retrieval', 'Hybrid Search'],
  },
  {
    id: 'hyde',
    term: 'HyDE (Hypothetical Document Embeddings)',
    category: 'Vector Search',
    definition: 'A zero-shot query expansion technique that prompts an LLM to generate a synthetic hypothetical answer passage before retrieval. The synthetic passage is embedded and used to search the vector index, bridging the vocabulary gap between short questions and rich documentation.',
    seeAlso: ['Dense Retrieval', 'Query Expansion'],
  },
  {
    id: 'context-cliff',
    term: 'Context Cliff',
    category: 'Chunking',
    definition: 'A sharp discontinuity in boundary similarity between adjacent chunks caused by splitting mid-phrase or mid-sentence, causing downstream LLMs to lose antecedent references.',
    seeAlso: ['Boundary Continuity', 'Overlap Window'],
  },
  {
    id: 'semantic-bloat',
    term: 'Semantic Bloat',
    category: 'Chunking',
    definition: 'The presence of high semantic similarity between non-adjacent chunks in an indexed corpus, causing vector stores to return near-duplicate passages that waste prompt context.',
    seeAlso: ['Deduplication', 'Similarity Matrix'],
  },
  {
    id: 'hierarchical-chunking',
    term: 'Hierarchical (Parent-Child) Indexing',
    category: 'Chunking',
    definition: 'A chunking architecture where small child chunks (e.g. 100–200 tokens) are indexed in the vector store for precision search, while their larger parent chunks (e.g. 800–1,200 tokens) are retrieved and injected into the LLM prompt for rich contextual generation.',
    seeAlso: ['Chunk Size Trade-Offs', 'Context Richness'],
  },
  {
    id: 'bpe',
    term: 'BPE (Byte-Pair Encoding)',
    category: 'LLM Architecture',
    definition: 'A subword tokenization algorithm that iteratively replaces the most frequent pairs of bytes or characters in a text corpus with a new subword unit. Used by tokenizers like tiktoken (cl100k_base, o200k_base).',
    seeAlso: ['Token', 'cl100k_base'],
  },
  {
    id: 'orphan-chunk',
    term: 'Orphan Chunk',
    category: 'Chunking',
    definition: 'A residual chunk created at the end of a section or document that is disproportionately small (e.g. fewer than 20% of target chunk size) and lacks standalone semantic context.',
    seeAlso: ['Chunk Size', 'Recursive Chunking'],
  },
];

/**
 * Lookup helper to find a glossary term by ID or slugified name
 */
export function findGlossaryTerm(termId: string): GlossaryTerm | undefined {
  const normalized = termId.toLowerCase().trim();
  return GLOSSARY_TERMS.find(
    (t) =>
      (t.id && t.id.toLowerCase() === normalized) ||
      t.term.toLowerCase().includes(normalized) ||
      t.term.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-') === normalized
  );
}
