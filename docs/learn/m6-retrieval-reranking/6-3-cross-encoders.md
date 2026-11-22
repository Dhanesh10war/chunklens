# Cross-Encoder Re-Ranking

<!-- claim: [STANDARD KNOWLEDGE] Bi-encoders project queries and documents independently for fast vector search, whereas cross-encoders process query-document pairs simultaneously with full cross-attention for high scoring accuracy. -->
:::callout[note]{title="TL;DR"}
First-stage vector search is fast because bi-encoders embed queries and documents independently. However, independent encoding prevents the model from analyzing how query tokens interact directly with document tokens. Cross-encoders solve this by concatenating the query and passage into a single sequence, evaluating full multi-head cross-attention across every word. Because cross-encoders are computationally intensive, production architectures deploy them in a two-stage funnel: retrieve top-50 with fast bi-encoders, then re-rank down to top-5 with a cross-encoder.
:::

## The Bi-Encoder vs Cross-Encoder Paradigm

To understand why re-ranking is essential, compare how transformers process text in both architectures:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Bi-Encoder (First-Stage)                            │
│                                                                             │
│    Query: "Is python 3.12 supported?"  ──► [Transformer A] ──► Vector Q     │
│                                                                      │      │
│                                                                  Dot Product│
│                                                                      │      │
│    Chunk: "Runtime compatibility guide"──► [Transformer B] ──► Vector D     │
│    (Zero interaction between query tokens and chunk tokens during encoding) │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                        Cross-Encoder (Second-Stage)                         │
│                                                                             │
│    [CLS] Query tokens [SEP] Chunk candidate tokens [SEP]                    │
│                               │                                             │
│                     [Full Transformer Encoder]                              │
│             (All query tokens attend to all chunk tokens)                   │
│                               │                                             │
│                       Logit Score (0.0 to 1.0)                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Why Bi-Encoders Miss Nuance

In a bi-encoder:
$$\mathbf{u} = \text{Encoder}(Q), \quad \mathbf{v} = \text{Encoder}(D), \quad \text{Score} = \cos(\mathbf{u}, \mathbf{v})$$

Because $\mathbf{u}$ and $\mathbf{v}$ are computed independently:
1. **Loss of Token-to-Token Interaction**: The model cannot dynamically adjust its interpretation of ambiguous words based on the target document.
2. **Negation and Conditionality**: Sentences like *"Feature A is enabled unless Flag B is set"* and *"Feature A is enabled when Flag B is set"* yield almost identical bi-encoder vectors because they share vocabulary, but their operational meaning is opposite.
3. **Information Bottleneck**: The entire semantic content of a 500-token chunk must be compressed into a single vector (e.g. 768 or 1,536 floats). Subtle qualifiers are easily lost.

---

## How Cross-Encoders Compute Relevance

In a cross-encoder:
$$\text{Input} = [\text{CLS}] \circ Q \circ [\text{SEP}] \circ D \circ [\text{SEP}]$$
$$\text{Score} = \sigma(\mathbf{W} \cdot \text{Transformer}(\text{Input})_{[\text{CLS}]})$$

Every layer of multi-head self-attention allows query tokens to attend directly to candidate tokens:
- The token `"not"` in the query can suppress activations on affirmative clauses in the document.
- The token `"v2"` in the query directly weights matching version tokens in the passage.

### The Computational Constraint
If you have a collection of 100,000 document chunks:
- A bi-encoder embeds chunks once at ingestion. Query time requires a single query embedding ($5\text{ ms}$) and a fast vector similarity search ($2\text{ ms}$ over an HNSW index).
- A cross-encoder would require running the heavy transformer forward pass 100,000 times for a single user query ($100,000 \times 10\text{ ms} = 1,000\text{ seconds}$).

This latency makes cross-encoders unusable for full-corpus scanning.

---

## The Two-Stage Production Funnel

Production search architectures resolve this computational constraint using a two-stage funnel:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Total Corpus: 500,000 Chunks                                                │
│                                                                             │
│   Stage 1: Fast Retrieval (Bi-Encoder + BM25 Hybrid)                        │
│   Latency: ~15ms                                                            │
│   Filters 500,000 chunks down to Top 50 candidates (High Recall)            │
│                                                                             │
│   Stage 2: Cross-Encoder Re-Ranking                                         │
│   Latency: ~40ms (50 pairs batched on GPU / CPU)                            │
│   Re-scores and re-orders Top 50 down to Top 5 (High Precision)             │
│                                                                             │
│ Final LLM Context: Top 5 High-Precision Chunks                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Architectural Comparison

:::compare{left="Bi-Encoder (First Stage)" right="Cross-Encoder (Second Stage)"}
- Asymmetric encoding: Query and Document processed separately.
- Vectors can be precomputed and cached in index storage.
- Retrieval scales to millions of passages via sub-millisecond ANN search.
- Susceptible to compression bottlenecks and negation confusion.
===
- Symmetric cross-attention: Query and Document processed together.
- Cannot be precomputed; must run inference dynamically per query pair.
- Computationally limited to candidate pools of 20 to 100 passages.
- Exceptional precision; captures subtle linguistic dependencies and negations.
:::

---

## Production Python Implementation

Using `sentence-transformers`, you can chain first-stage candidate retrieval with a cross-encoder re-ranker:

```python
from sentence_transformers import SentenceTransformer, CrossEncoder
import numpy as np

# 1. First-Stage Bi-Encoder Model
bi_encoder = SentenceTransformer("all-MiniLM-L6-v2")

# 2. Second-Stage Cross-Encoder Model
cross_encoder = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

documents = [
    "Chunk 0: Python 3.12 delivers significant performance optimizations for comprehension loops.",
    "Chunk 1: System requirements: This library explicitly does NOT support Python 3.12 or higher.",
    "Chunk 2: Python installation guide: Download version 3.11 for stable environments.",
    "Chunk 3: Release notes covering backward incompatibilities in Python 3.12 release."
]

query = "Can I install this library on Python 3.12?"

# --- Stage 1: Fast Bi-Encoder Retrieval ---
doc_embeddings = bi_encoder.encode(documents, normalize_embeddings=True)
query_embedding = bi_encoder.encode(query, normalize_embeddings=True)

# Calculate cosine similarities
bi_scores = doc_embeddings @ query_embedding
top_candidates_idx = np.argsort(bi_scores)[::-1][:3]  # Retrieve top 3

print("Stage 1 (Bi-Encoder) Rankings:")
for idx in top_candidates_idx:
    print(f"  Doc {idx} (Score: {bi_scores[idx]:.4f}): {documents[idx][:60]}...")

# --- Stage 2: Cross-Encoder Re-Ranking ---
pairs = [(query, documents[idx]) for idx in top_candidates_idx]
rerank_scores = cross_encoder.predict(pairs)

# Re-order based on cross-attention scores
ranked_order = np.argsort(rerank_scores)[::-1]

print("\nStage 2 (Cross-Encoder) Re-Ranked Order:")
for rank, rank_idx in enumerate(ranked_order, start=1):
    original_doc_idx = top_candidates_idx[rank_idx]
    score = rerank_scores[rank_idx]
    print(f"  Rank {rank} -> Doc {original_doc_idx} (Re-rank Score: {score:.4f})")
```

:::tryit[tech-docs]{strategy="recursive" chunkSize="400" chunkOverlap="40"}
:::

---

## Test Your Understanding

:::quiz[quiz-6-3]{}
:::

---

## Key Takeaways

- **Decoupled vs Joint Attention**: Bi-encoders encode queries and documents separately; cross-encoders process them jointly with full token-to-token cross-attention.
- **The Latency Trade-Off**: Cross-encoders cannot scale across a full database, but provide superior precision on small candidate sets.
- **The Two-Stage Architecture**: Use bi-encoders/hybrid search to pull the top 30–100 candidates, then use a cross-encoder to re-rank the top 3–5 chunks for the final LLM prompt.
- **Resolves Negation and Nuance**: Cross-encoders correctly distinguish affirmative vs contradictory clauses that fool vector distance metrics.
