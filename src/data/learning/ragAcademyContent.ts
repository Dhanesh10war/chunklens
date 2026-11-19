import { RagAcademyModule } from './types';

export const RAG_ACADEMY_MODULES: RagAcademyModule[] = [
  {
    id: 'chunk-size-trade-offs',
    title: 'The Chunk Size Dilemma: Search Precision vs. Context Richness',
    subtitle: 'Why neither 128 tokens nor 2,000 tokens is universally correct, and how to calibrate your pipeline.',
    level: 'Beginner',
    category: 'trade-offs',
    readTime: '6 min read',
    keyTakeaways: [
      'Small chunks (128–256 tokens) yield high vector retrieval precision but risk losing critical surrounding context.',
      'Large chunks (1024–2048 tokens) capture complex context but dilute vector embeddings and increase LLM inference cost.',
      'Medium chunks (384–512 tokens) with 10%–15% overlap represent a widely effective baseline for general QA pipelines.',
    ],
    sections: [
      {
        heading: '1. The Precision / Recall Tension in Vector Embeddings',
        paragraphs: [
          'Dense vector embedding models map an entire passage into a single fixed-dimension vector (e.g., 768 or 1536 floats). When a passage contains multiple distinct thoughts, facts, or instructions, the embedding model must average these semantic concepts into a single vector manifold.',
          'As chunk size grows past 512 tokens, vector similarity scores for specific niche facts dilute significantly. Conversely, if chunks are cut too small (e.g., 64–128 tokens), the embedding cleanly captures the individual sentence, but downstream generation fails because the LLM lacks the background context needed to synthesize an authoritative answer.',
        ],
        diagramAscii: `  Small Chunks (128 tok)       Medium Chunks (384–512 tok)       Large Chunks (1024+ tok)
  ┌──────────────────────┐      ┌───────────────────────────┐      ┌─────────────────────────────┐
  │ High Search Precision│      │ Balanced Precision/Recall │      │ Rich Semantic Context       │
  │ Low Context Synthesis│  --> │ Optimal Vector Clustered  │ <--- │ Diluted Vector Similarity   │
  │ High Storage Density │      │ Recommended for QA & Chat │      │ Attention Degradation Risk  │
  └──────────────────────┘      └───────────────────────────┘      └─────────────────────────────┘`,
      },
      {
        heading: '2. The Overlap Strategy: Preserving Antecedents and Continuity',
        paragraphs: [
          'An overlap window (typically 10% to 15% of the target chunk size) copies the trailing tokens of chunk N to the start of chunk N+1. This ensures that pronouns ("he", "they", "this method") remain linked to the entities introduced in the preceding sentence.',
          'Configuring overlap beyond 25% creates diminishing returns: it inflates vector database index volume by 30% to 50% without yielding measurable retrieval accuracy improvements.',
        ],
        keyMetric: {
          label: 'Optimal Overlap Ratio',
          value: '10% – 15%',
          note: 'For a 400-token chunk, use a 40-token overlap window.',
        },
      },
    ],
  },
  {
    id: 'lost-in-the-middle',
    title: 'The "Lost in the Middle" Attention Phenomenon & Re-ranking',
    subtitle: 'Understanding why LLMs miss facts positioned in the center of multi-chunk prompts.',
    level: 'Intermediate',
    category: 'fundamentals',
    readTime: '7 min read',
    keyTakeaways: [
      'Transformer attention mechanisms exhibit a distinct U-shaped retrieval curve: facts at the start or end of the prompt are recalled with much higher fidelity.',
      'Injecting 10+ raw retrieved chunks into a prompt often leads to hallucinations if the key evidence is located in chunks 4–7.',
      'Cross-encoder re-rankers solve this by re-ordering retrieved passages so that the highest-scoring evidence sits right before the generation prompt.',
    ],
    sections: [
      {
        heading: '1. The U-Shaped Attention Curve Across Transformer Sequences',
        paragraphs: [
          'Empirical research in language model evaluation demonstrates that LLM retrieval performance is rarely uniform across long inputs. When models are presented with 10 to 20 retrieved passages, their ability to extract the correct answer peaks when the evidence is in the first 10% or final 10% of the prompt.',
          'When critical evidence is positioned in the middle third of the context, model accuracy can drop by up to 30% to 50%, even in models with 128k+ nominal token limits.',
        ],
        diagramAscii: `  Recall Accuracy vs. Passage Position in Prompt:
  100% ┌───                                         ───┐ (High Recall at Extremities)
       │   \\                                       /   │
   50% │    \\                                     /    │
       │     \\                                   /     │
    0% └──────┴───────────────────┬─────────────┴──────┘ (Dips in the Middle)
             Start               Center                End`,
      },
      {
        heading: '2. Mitigating the Dip with Cross-Encoder Re-Ranking',
        paragraphs: [
          'In a two-stage retrieval pipeline, bi-encoder vector search retrieves the top 20 candidate chunks at low latency. A secondary cross-encoder re-ranker then scores the joint query-document interaction and re-orders the candidate list.',
          'By placing the top 3 highest-ranked chunks immediately adjacent to the user query at the end of the context window, pipelines circumvent the middle-attention degradation entirely.',
        ],
      },
    ],
  },
  {
    id: 'advanced-rag-architectures',
    title: 'Advanced RAG Patterns: Hierarchical, Hybrid, ColBERT, and HyDE',
    subtitle: 'Moving beyond naive vector search to enterprise-grade production architectures.',
    level: 'Advanced',
    category: 'architectures',
    readTime: '9 min read',
    keyTakeaways: [
      'Hierarchical / Parent-Child indexing decouples search representation (small child chunks) from generation context (large parent chunks).',
      'Hybrid search blends dense semantic vectors with sparse BM25 keyword matching via Reciprocal Rank Fusion (RRF).',
      'Late interaction (ColBERT) maintains token-level representations for fine-grained phrase and acronym matching.',
      'HyDE (Hypothetical Document Embeddings) uses LLM generation to bridge vocabulary divergence between query and corpus.',
    ],
    sections: [
      {
        heading: '1. Hierarchical / Parent-Child Chunking',
        paragraphs: [
          'Naive RAG assumes that the text chunk indexed in the vector store must be identical to the text chunk injected into the LLM prompt. Hierarchical chunking breaks this constraint.',
          'Documents are partitioned into large parent chunks (e.g. 1,000–1,500 tokens), and each parent is further divided into small child chunks (e.g. 150–200 tokens). Vector search targets only the child chunks for pinpoint keyword matching. When a child chunk matches, its parent chunk is retrieved and provided to the generation LLM.',
        ],
        diagramAscii: `  Parent Chunk (~1,200 tokens) ──────────────────────────────────────────┐
    ├─ Child Chunk 1 (150 tok)  -> Indexed in Vector DB (High Search Precision)  │
    ├─ Child Chunk 2 (150 tok)  -> Indexed in Vector DB                         │
    └─ Child Chunk 3 (150 tok)  -> Indexed in Vector DB                         │
  When Child 2 Matches Query -> Full Parent Chunk Injected to LLM Context <──────┘`,
      },
      {
        heading: '2. Hybrid Search (Dense Vectors + Sparse BM25)',
        paragraphs: [
          'Dense embeddings understand semantic analogies (e.g., "automobile" ↔ "car") but frequently miss exact serial numbers, product SKUs, legal section codes, or medical acronyms.',
          'Hybrid search executes two parallel queries: a dense vector similarity query and a sparse BM25 inverted-index query. The two ranked candidate lists are unified using Reciprocal Rank Fusion (RRF):',
        ],
        diagramAscii: `  RRF Score(d) = Σ [ 1 / (k + rank_dense(d)) ] + Σ [ 1 / (k + rank_sparse(d)) ]
  where k is a smoothing constant (standardly k = 60).`,
      },
      {
        heading: '3. Hypothetical Document Embeddings (HyDE)',
        paragraphs: [
          'User search queries are often brief questions ("How do I rotate an API key?"), whereas document chunks are descriptive statements ("To rotate an API key in the developer console..."). This vocabulary mismatch can lower vector similarity.',
          'HyDE prompts an LLM with zero-shot generation: "Write a short passage answering: {query}". Although the generated passage may contain minor factual inaccuracies, its linguistic style and vocabulary match real documentation. Embedding the hypothetical passage produces significantly higher retrieval hit rates.',
        ],
      },
    ],
  },
  {
    id: 'rag-triad-evaluation',
    title: 'The RAG Triad: Evaluating Context Relevance, Groundedness, and Recall',
    subtitle: 'Systematically measuring retrieval precision, context hallucination, and answer faithfulness.',
    level: 'Intermediate',
    category: 'evaluation',
    readTime: '6 min read',
    keyTakeaways: [
      'Context Relevance measures whether the retrieved chunks actually pertain to the question or include extraneous noise.',
      'Groundedness (Faithfulness) measures whether every claim in the generated answer is backed by retrieved evidence.',
      'Answer Relevance measures whether the final response directly addresses the user question without drift.',
    ],
    sections: [
      {
        heading: '1. The Three Pillars of RAG Quality',
        paragraphs: [
          'Without objective evaluation metrics, engineering teams tune chunk sizes and prompts by gut feel. The RAG Triad establishes three orthogonal evaluation axes:',
          '1. Context Relevance: Number of relevant sentences in retrieved chunks divided by total retrieved sentences. If this score is low, chunks are either too large or retrieval k is set too high.\n2. Groundedness (Faithfulness): Number of factual claims in the generated response that can be directly traced back to retrieved context. Prevents model hallucinations.\n3. Answer Relevance: Semantic similarity between the user query and the final response, confirming the model did not deflect or answer an unrelated question.',
        ],
        diagramAscii: `         ┌───────────────── User Query ─────────────────┐
         │                                              │
         ▼ Context Relevance                            ▼ Answer Relevance
  [Retrieved Chunks] ──────────────────────────> [Generated Answer]
         ▲                                              │
         └───────────── Groundedness (Faithfulness) ────┘`,
      },
    ],
  },
];
