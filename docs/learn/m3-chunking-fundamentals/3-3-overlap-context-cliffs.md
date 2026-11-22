# Overlap Windows & Preventing Context Cliffs

<!-- claim: [STANDARD KNOWLEDGE] Chunk overlap preserves semantic continuity by duplicating trailing boundary tokens into succeeding partitions. -->
:::callout[note]{title="TL;DR"}
An overlap window duplicates a slice of trailing tokens from Chunk $N$ into the header of Chunk $N+1$. This structural bridge prevents [[context-cliff|context cliffs]], ensuring that pronouns, qualifying exceptions, and dependent clauses are not severed at partition edges. Calibrating overlap between 10% and 20% strikes the optimal balance between boundary continuity and vector index storage efficiency.
:::

## The Anatomy of an Overlap Window

When text is split sequentially, thoughts rarely conform neatly to arbitrary length limits. An overlap window acts as a semantic bridge:

```
Chunk 1: [============================= T_overlap ]
                                       [ T_overlap =============================] : Chunk 2
                                                                                [ T_overlap =================] : Chunk 3
```

By copying the final $10\% - 20\%$ of tokens from the preceding chunk into the beginning of the next chunk:
1. **Pronoun Binding**: Pronouns at the start of Chunk 2 (e.g. *"This safeguard..."*) remain linked to the antecedent nouns defined at the end of Chunk 1 (e.g. *"Rate limiting in AuthCore..."*).
2. **Boundary Continuity**: A query whose semantic match falls across the split boundary can still match either chunk with high cosine similarity.

---

## The Economics of Overlap: Diminishing Returns

While overlap is necessary, configuring too much overlap is one of the most common anti-patterns in enterprise RAG:

<!-- claim: [CHUNKLENS BEHAVIOR VERIFIED] Configuring overlap beyond 25% significantly expands total partition counts and vector storage index size with minimal retrieval recall gains. -->
$$\text{Index Expansion Ratio} \approx \frac{\text{Chunk Size}}{\text{Chunk Size} - \text{Overlap}}$$

| Chunk Size (Tokens) | Overlap (Tokens) | Overlap Ratio | Extra Partitions Generated | Vector Index Expansion | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 500 | 0 | 0% | +0% | Baseline | Dangerous: High risk of severed context. |
| 500 | 50 | 10% | +11% | +11% | **Optimal Baseline**: High continuity, minimal bloat. |
| 500 | 100 | 20% | +25% | +25% | Strong: Recommended for dense legal/medical text. |
| 500 | 250 | 50% | +100% | +100% | **Severe Bloat**: Doubles vector storage and returns duplicates. |

### The Near-Duplicate Retrieval Hazard
When overlap exceeds $30\%$, adjacent chunks become near-clones of each other. When a user asks a question:
1. Top-$k$ vector search returns Chunk 1, Chunk 2, and Chunk 3.
2. Because they overlap by $40\%$, all three chunks contain almost identical sentences.
3. The LLM's prompt window is filled with three repetitive versions of the same passage, completely starving out other diverse, relevant passages from the rest of the document.

---

## Calibrating Overlap in ChunkLens

In ChunkLens, overlap is evaluated in real time:

- **The Diagonal Overlap Ribbon**: In the Continuous Reading Stream, a diagonal hatch band visually displays the exact overlapping character sequence between adjacent cards.
- **Adjacent Boundary Continuity Score**: ChunkLens calculates the TF-IDF lexical overlap score across sequential transitions. A drop to near $0\%$ signals a severe context cliff.

:::widget[v2-sandbox]{initialStrategy="recursive" initialChunkSize="400" initialChunkOverlap="60" initialSampleId="legal-saas-agreement"}
:::

---

## Production Code Implementation

In LangChain and LlamaIndex, configure the overlap window proportionally to target chunk size:

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter

# 450 tokens with 10% overlap (45 tokens)
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=450,
    chunk_overlap=45,
    length_function=len,
    separators=["\n\n", "\n", " ", ""]
)
```

:::tryit[legal-saas-agreement]{strategy="recursive" chunkSize="450" chunkOverlap="45"}
:::

---

## Test Your Understanding

:::quiz[quiz-3-3]{}
:::

---

## Key Takeaways

- **Overlap bridges context cliffs**: Duplicating 10% to 20% of trailing tokens prevents severed pronouns and lost qualifiers.
- **Beware the 30% bloat ceiling**: Overlap beyond 25% expands vector index costs and floods top-$k$ retrieval with duplicate passages.
- **Inspect overlap visually**: Use the reading stream to confirm that overlapping spans contain complete, meaningful thoughts.
- **Maintain a 10:1 ratio**: As a general operational baseline, allocate roughly 10% of your target chunk budget to the overlap window.
