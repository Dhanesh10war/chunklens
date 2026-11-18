import { GlossaryTerm } from './types';

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    term: 'BM25 (Best Matching 25)',
    category: 'Vector Search',
    definition: 'A probabilistic term-weighting ranking function used in information retrieval. Unlike TF-IDF, BM25 uses non-linear term frequency saturation and document length normalization, making it the industry benchmark for sparse lexical search.',
    formulaOrExample: 'Score(D, Q) = Σ IDF(qi) · [f(qi, D) · (k1 + 1)] / [f(qi, D) + k1 · (1 - b + b · |D| / avgdl)]',
    seeAlso: ['Hybrid Search', 'RRF (Reciprocal Rank Fusion)'],
  },
  {
    term: 'Reciprocal Rank Fusion (RRF)',
    category: 'Vector Search',
    definition: 'An algorithmic technique for combining the ranked search results of multiple independent retrieval algorithms (such as dense vector similarity and sparse BM25 keyword matching) without requiring manual score normalization.',
    formulaOrExample: 'RRF_Score(doc) = Σ (1 / (60 + rank(doc, system_i)))',
    seeAlso: ['Hybrid Search', 'BM25'],
  },
  {
    term: 'Chunk Utilization Rate',
    category: 'Evaluation',
    definition: 'The percentage of tokens in a retrieved chunk that were directly used or referenced by the LLM in synthesizing its final answer. High chunk utilization (> 70%) signals ideal chunk sizing; low utilization (< 25%) indicates chunks contain excessive extraneous noise.',
    seeAlso: ['Context Relevance', 'The RAG Triad'],
  },
  {
    term: 'Lost in the Middle',
    category: 'LLM Architecture',
    definition: 'The empirical observation that LLM performance degrades significantly when target factual evidence is positioned in the center of long multi-chunk input prompts compared to the beginning or end of the context window.',
    seeAlso: ['Cross-Encoder Re-Ranking', 'Attention Degradation'],
  },
  {
    term: 'ColBERT (Late Interaction)',
    category: 'Vector Search',
    definition: 'A dense retrieval architecture that preserves contextualized token-level embeddings instead of condensing an entire document into a single vector. Uses MaxSim operator to compute fine-grained token alignments.',
    formulaOrExample: 'Score(Q, D) = Σ_i max_j (E_qi · D_dj)',
    seeAlso: ['Dense Retrieval', 'Hybrid Search'],
  },
  {
    term: 'HyDE (Hypothetical Document Embeddings)',
    category: 'Vector Search',
    definition: 'A zero-shot query expansion technique that prompts an LLM to hallucinate a synthetic answer passage before retrieval. The synthetic passage is embedded and used to search the vector index, bridging the vocabulary gap between short questions and rich documentation.',
    seeAlso: ['Dense Retrieval', 'Query Expansion'],
  },
  {
    term: 'Context Cliff',
    category: 'Chunking',
    definition: 'A sharp discontinuity in boundary similarity (< 20%) between adjacent chunks caused by splitting mid-phrase or mid-sentence, causing downstream LLMs to hallucinate due to severed antecedent references.',
    seeAlso: ['Boundary Continuity', 'Overlap Window'],
  },
  {
    term: 'Semantic Bloat',
    category: 'Chunking',
    definition: 'The presence of high semantic similarity (> 70%) between non-adjacent chunks in an indexed corpus, causing vector stores to return near-duplicate passages that waste prompt context.',
    seeAlso: ['Deduplication', 'Similarity Matrix'],
  },
  {
    term: 'Hierarchical (Parent-Child) Indexing',
    category: 'Chunking',
    definition: 'A chunking architecture where small child chunks (100–200 tokens) are indexed in the vector store for precision search, while their larger parent chunks (800–1,200 tokens) are retrieved and injected into the LLM prompt for rich contextual generation.',
    seeAlso: ['Chunk Size Trade-Offs', 'Context Richness'],
  },
  {
    term: 'BPE (Byte-Pair Encoding)',
    category: 'LLM Architecture',
    definition: 'A subword tokenization algorithm that iteratively replaces the most frequent pairs of bytes or characters in a text corpus with a new subword unit. Used by tokenizers like tiktoken (cl100k_base, o200k_base).',
    seeAlso: ['Token Density', 'cl100k_base'],
  },
];
