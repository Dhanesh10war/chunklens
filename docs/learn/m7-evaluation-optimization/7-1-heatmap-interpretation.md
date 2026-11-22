# Interpreting Pairwise Chunk Similarity Heatmaps

<!-- claim: [STANDARD KNOWLEDGE] Pairwise chunk similarity matrices project intra-document semantic relationships, revealing topic coherence, boundary fragmentation, and cross-section redundancy. -->
:::callout[note]{title="TL;DR"}
Visual inspection of pairwise chunk similarity heatmaps is one of the most powerful diagnostic techniques in RAG engineering. By computing the $N \times N$ cosine similarity matrix between all chunks in a document, you can immediately identify whether your splitting strategy creates cohesive topic blocks, dangerous context cliffs, or repetitive semantic bloat—without reading thousands of lines of text manually.
:::

## The Pairwise Similarity Matrix

When ChunkLens partitions a document into $N$ chunks $\{C_1, C_2, \dots, C_N\}$, it generates vector embeddings for each chunk and computes the pairwise cosine similarity matrix $\mathbf{M} \in \mathbb{R}^{N \times N}$:

$$M_{i,j} = \cos\left(\mathbf{e}(C_i), \mathbf{e}(C_j)\right) = \frac{\mathbf{e}(C_i) \cdot \mathbf{e}(C_j)}{\|\mathbf{e}(C_i)\|_2 \|\mathbf{e}(C_j)\|_2}$$

Because cosine similarity is reflexive and symmetric:
- The main diagonal is uniformly $1.0$ ($M_{i,i} = 1.0$).
- The matrix is symmetric ($M_{i,j} = M_{j,i}$).
- Values range from $0.0$ (orthogonal/unrelated) to $1.0$ (identical semantic meaning).

```
        C1    C2    C3    C4    C5    C6    C7    C8
   C1 [ 1.00  0.86  0.81  0.22  0.19  0.18  0.25  0.21 ]
   C2 [ 0.86  1.00  0.84  0.25  0.20  0.17  0.22  0.19 ]  <-- Topic Block A (C1-C3)
   C3 [ 0.81  0.84  1.00  0.28  0.22  0.19  0.24  0.20 ]
   C4 [ 0.22  0.25  0.28  1.00  0.79  0.82  0.31  0.29 ]
   C5 [ 0.19  0.20  0.22  0.79  1.00  0.85  0.28  0.24 ]  <-- Topic Block B (C4-C6)
   C6 [ 0.18  0.17  0.19  0.82  0.85  1.00  0.30  0.27 ]
   C7 [ 0.25  0.22  0.24  0.31  0.28  0.30  1.00  0.88 ]  <-- Topic Block C (C7-C8)
   C8 [ 0.21  0.19  0.20  0.29  0.24  0.27  0.88  1.00 ]
```

---

## Visual Diagnostic Archetypes

When reviewing a similarity matrix in ChunkLens, look for four characteristic geometric patterns:

### 1. Block-Diagonal Clusters (Healthy Topic Coherence)
Solid high-similarity squares along the main diagonal signify that consecutive chunks belong to the same narrative or technical topic. The size of the block indicates the breadth of the topic. Clean, distinct transitions between blocks mean the document changes subjects sharply without dangling thoughts.

### 2. High Off-Diagonal Rectangles (Redundancy & Boilerplate)
When cells far away from the main diagonal ($|i - j| \ge 4$) light up with high similarity ($>0.75$), you have detected cross-document redundancy.
- **Common causes**: Repeated legal disclaimers, identical header/footer text across pages, copied license blocks, or duplicated summary paragraphs.
- **System impact**: During retrieval, multiple redundant chunks will match the same query, crowding out complementary factual evidence.

### 3. Cold Isolated Stripes (Orphan & Syntax Chunks)
A single row and column rendered entirely in dark/low similarity ($<0.30$) represents an outlier chunk.
- **Common causes**: Raw code snippets, lone data tables, ASCII diagrams, or severed image captions.
- **Diagnosis**: Verify whether this chunk contains enough linguistic context to stand alone, or if it was severed from its explanatory prose.

### 4. Checkerboard / Uniform High Density (Under-Split Documents)
If the entire matrix displays uniform medium-to-high similarity ($>0.70$) without defined blocks, the document has been split with chunks that are too large (e.g., 2,000 tokens), causing every chunk to average out into the same general document embedding.

---

## Architectural Comparison

:::compare{left="Healthy Semantic Partitioning" right="Pathological Semantic Partitioning"}
- Distinct block diagonal squares showing clear topical progression.
- Off-diagonal values are low ($<0.35$), indicating minimal boilerplate.
- Step-wise boundary transitions align with document headings.
===
- Diffuse, blurry diagonals without defined cluster boundaries.
- Bright off-diagonal bands reflecting uncleaned headers and notices.
- Dark vertical and horizontal stripes where syntax fragments are orphaned.
:::

---

## Quantitative Matrix Metrics

In automated evaluation pipelines, you can quantify matrix quality using two programmatic indicators:

### 1. Local Continuity Score ($\kappa_{\text{local}}$)
Measures the average cosine similarity between immediately adjacent chunks:

$$\kappa_{\text{local}} = \frac{1}{N - 1} \sum_{i=1}^{N - 1} M_{i, i+1}$$

A very low $\kappa_{\text{local}}$ ($<0.4$) signals excessive boundary fragmentation where related sentences are prematurely cut.

### 2. Off-Diagonal Redundancy Index ($\rho_{\text{redundant}}$)
Measures the proportion of non-adjacent chunk pairs that exceed a similarity threshold (e.g. $\tau = 0.80$):

$$\rho_{\text{redundant}} = \frac{\sum_{i=1}^{N} \sum_{j > i + 1}^{N} \mathbb{I}(M_{i,j} \ge \tau)}{\frac{1}{2}(N-1)(N-2)}$$

A high $\rho_{\text{redundant}}$ flags heavy duplication or boilerplate that should be filtered out before indexing.

```python
import numpy as np

def compute_matrix_diagnostics(sim_matrix: np.ndarray, tau: float = 0.80):
    n = sim_matrix.shape[0]
    
    # 1. Local continuity (adjacent chunks)
    local_continuity = np.mean([sim_matrix[i, i + 1] for i in range(n - 1)])
    
    # 2. Off-diagonal redundancy (pairs separated by at least 1 chunk)
    off_diag_mask = np.triu(np.ones((n, n), dtype=bool), k=2)
    redundant_pairs = np.sum((sim_matrix >= tau) & off_diag_mask)
    total_off_diag = np.sum(off_diag_mask)
    redundancy_rate = redundant_pairs / max(total_off_diag, 1)
    
    return {
        "local_continuity": float(local_continuity),
        "redundancy_rate": float(redundancy_rate)
    }
```

:::tryit[academic-paper]{strategy="recursive" chunkSize="400" chunkOverlap="40"}
:::

---

## Test Your Understanding

:::quiz[quiz-7-1]{}
:::

---

## Key Takeaways

- **Geometric insight**: The pairwise matrix provides an instant macro-view of document structure without reading every word.
- **Block diagonals indicate coherence**: Well-defined squares along the main diagonal reflect cohesive topical segments.
- **Off-diagonal spikes reveal bloat**: High values far from the diagonal expose duplicated boilerplate, headers, and repetitive summaries.
- **Cold stripes isolate fragments**: Thin rows with near-zero similarity to all neighbors flag severed code blocks or orphan tables.
