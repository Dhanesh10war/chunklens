# Hybrid Search & Reciprocal Rank Fusion (RRF)

<!-- claim: [STANDARD KNOWLEDGE] Reciprocal Rank Fusion combines ranked result sets from disparate retrieval systems using ordinal rank positions rather than calibrated score magnitudes. -->
:::callout[note]{title="TL;DR"}
Because sparse BM25 produces unbounded scores $[0, \infty)$ and dense vector search produces bounded cosine similarities $[0, 1]$, combining their raw scores directly requires fragile normalization. Reciprocal Rank Fusion (RRF) solves this by discarding raw scores altogether. It scores documents based on their ordinal position across each retrieval list, providing a robust, scale-invariant merge of lexical and semantic search results.
:::

## The Score Calibration Dilemma

When executing hybrid search, an engineer queries two distinct retrieval indices in parallel:

```
                                  ┌──────────────────────────┐
                                  │       User Query         │
                                  └─────────────┬────────────┘
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       ▼                                                 ▼
          ┌─────────────────────────┐                       ┌─────────────────────────┐
          │   BM25 Sparse Search    │                       │   Dense Vector Search   │
          │   Scores: [0.0, 42.8]   │                       │   Scores: [0.12, 0.89]  │
          └────────────┬────────────┘                       └────────────┬────────────┘
                       │                                                 │
                       └────────────────────────┬────────────────────────┘
                                                ▼
                                    ┌───────────────────────┐
                                    │ Naive Score Blending? │
                                    │ (Scale Incompatible!) │
                                    └───────────────────────┘
```

Why cannot you simply calculate $\text{Score} = 0.5 \cdot S_{\text{dense}} + 0.5 \cdot S_{\text{bm25}}$?
- **Unbounded vs Bounded**: Cosine similarity is bounded in $[-1, 1]$ (or $[0, 1]$ with normalized embeddings). BM25 scores depend on corpus statistics and term frequency; short queries may peak at $4.2$ while long repetitive queries may peak at $65.0$.
- **Corpus Sensitivity**: If you apply min-max normalization:
  $$S_{\text{norm}} = \frac{S - S_{\min}}{S_{\max} - S_{\min}}$$
  an extreme outlier chunk can squash all other candidate scores, distorting the relative weighting for subsequent queries.

---

## The Reciprocal Rank Fusion (RRF) Solution

Proposed by Cormack, Clarke, and Büttcher in 2009, **Reciprocal Rank Fusion** operates purely on *ordinal rank order* ($1, 2, 3, \dots, N$) rather than score magnitude.

For a document $d$ appearing across a set of retrieval rankings $M$:

$$\text{RRF}(d) = \sum_{m \in M} \frac{1}{k + r_m(d)}$$

Where:
- $M$ is the collection of retrieval systems (e.g., $M = \{\text{BM25}, \text{Dense}\}$).
- $r_m(d)$ is the 1-based rank position of document $d$ in retrieval system $m$. If document $d$ does not appear in the top results of system $m$, its term for that system is omitted (or $r_m(d) \to \infty$).
- $k$ is a ranking constant. Empirical research establishes $k = 60$ as the default constant.

### The Role of Constant $k = 60$

The parameter $k$ prevents top-ranked documents from dominating the scoring distribution:
- If $k = 1$, rank 1 receives $\frac{1}{1+1} = 0.5$, while rank 2 receives $\frac{1}{1+2} = 0.333$. The top item enjoys a massive $50\%$ lead.
- If $k = 60$, rank 1 receives $\frac{1}{61} \approx 0.01639$, and rank 2 receives $\frac{1}{62} \approx 0.01613$. The relative drop is gradual.

This ensures that a document ranked #3 in BM25 and #4 in Dense accumulates a higher combined RRF score than a document ranked #1 in BM25 but completely missing from the Dense retrieval candidate list:

$$\text{RRF}(d_{\text{consensus}}) = \frac{1}{60 + 3} + \frac{1}{60 + 4} = 0.01587 + 0.01562 = 0.03149$$

$$\text{RRF}(d_{\text{single-winner}}) = \frac{1}{60 + 1} + 0 = 0.01639$$

The consensus candidate clearly wins.

---

## Architectural Comparison

:::compare{left="Linear Score Blending" right="Reciprocal Rank Fusion (RRF)"}
- Requires manual min-max normalization per query.
- Highly vulnerable to score distribution drift across disparate corpora.
- Hyperparameters ($\alpha$ weights) must be retuned whenever the document base changes.
===
- Operates strictly on ordinal rank positions (1st, 2nd, 3rd).
- Invariant to arbitrary score scales, units, or embedding dimensions.
- Zero calibration needed; robust out of the box with $k=60$.
:::

---

## Production Python Implementation

Here is a complete, dependency-free implementation of RRF merging:

```python
from typing import Dict, List, Tuple

def reciprocal_rank_fusion(
    ranked_lists: List[List[str]],
    k: int = 60
) -> List[Tuple[str, float]]:
    """
    Combines multiple ranked lists of document IDs using RRF.
    
    Args:
        ranked_lists: List of ranked doc ID lists from different retrieval engines.
        k: Smoothing constant (default: 60).
    
    Returns:
        Sorted list of tuples (document_id, rrf_score) in descending score order.
    """
    rrf_scores: Dict[str, float] = {}

    for rank_list in ranked_lists:
        for rank, doc_id in enumerate(rank_list, start=1):
            if doc_id not in rrf_scores:
                rrf_scores[doc_id] = 0.0
            rrf_scores[doc_id] += 1.0 / (k + rank)

    # Sort documents by accumulated RRF score descending
    sorted_docs = sorted(rrf_scores.items(), key=lambda item: item[1], reverse=True)
    return sorted_docs

# Example usage:
bm25_results = ["doc_error_404", "doc_network_timeout", "doc_overview"]
dense_results = ["doc_network_timeout", "doc_socket_retry", "doc_latency_guide"]

fused_rankings = reciprocal_rank_fusion([bm25_results, dense_results], k=60)

for rank, (doc, score) in enumerate(fused_rankings, start=1):
    print(f"Rank {rank}: {doc} (RRF Score: {score:.5f})")
# Output:
# Rank 1: doc_network_timeout (Appeared in both lists: rank 2 and rank 1)
# Rank 2: doc_error_404 (Rank 1 in BM25 only)
# Rank 3: doc_socket_retry (Rank 2 in Dense only)
```

:::tryit[tech-docs]{strategy="recursive" chunkSize="400" chunkOverlap="40"}
:::

---

## Test Your Understanding

:::quiz[quiz-6-2]{}
:::

---

## Key Takeaways

- **Scale mismatch makes score addition brittle**: Unbounded BM25 scores and bounded cosine similarities cannot be safely summed without distortion.
- **RRF leverages ordinal rank**: By scoring items as $\frac{1}{k + r}$, RRF eliminates reliance on score distributions.
- **Favors cross-modal consensus**: Documents retrieved by both sparse and dense engines rise to the top over single-engine candidates.
- **Empirical $k = 60$**: Provides smooth attenuation that balances top-rank rewards with multi-list agreement.
