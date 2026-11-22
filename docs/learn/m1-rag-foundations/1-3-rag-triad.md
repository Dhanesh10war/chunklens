# The RAG Evaluation Triad

<!-- claim: [ACADEMIC CITATION] The RAG Triad framework (TruLens / Ragas) evaluates RAG pipelines across Context Relevance, Groundedness, and Answer Relevance. -->
:::callout[note]{title="TL;DR"}
Evaluating a production RAG application requires measuring three distinct, orthogonal dimensions: Context Relevance (was the retrieved text focused?), Groundedness (is the answer fully supported by that text?), and Answer Relevance (did the model answer the user's question?). Sizing and calibrating your document chunks is the single most powerful architectural lever controlling all three legs of this triad.
:::

## The Three Pillars of RAG Quality

In traditional software systems, unit tests evaluate deterministic inputs and outputs. In retrieval-augmented generation, output variance requires decomposing the system into three verifiable relationships:

```
                         [User Query]
                          ▲        ▲
                         /          \
                        /            \
        Context Relevance            Answer Relevance
                      /                \
                     /                  \
                    ▼                    ▼
          [Retrieved Chunks] ────────▶ [Generated Answer]
                               Groundedness
                             (Faithfulness)
```

---

## 1. Context Relevance (The Retrieval Metric)

**Definition**: The proportion of sentences in the retrieved context chunks that are directly relevant to answering the user's query.

$$\text{Context Relevance} = \frac{|\text{Relevant Sentences in Retrieved Chunks}|}{|\text{Total Sentences in Retrieved Chunks}|}$$

### How Chunking Dictates Context Relevance:
- **Oversized Chunks (e.g. 1,500 tokens)**: When a user asks about a specific 2-line warranty clause, returning an entire 10-page legal agreement section results in very low Context Relevance ($< 15\%$). The remaining $85\%$ of the retrieved tokens are noise that inflates costs and risks model distraction.
- **Calibrated Chunks (e.g. 350–500 tokens)**: Returning focused paragraphs maximizes Context Relevance ($> 75\%$), ensuring the model context is dense with signal.

---

## 2. Groundedness / Faithfulness (The Hallucination Metric)

**Definition**: The percentage of factual claims in the generated LLM response that can be directly traced back to and verified by the retrieved context passages.

$$\text{Groundedness} = \frac{|\text{Answer Claims Supported by Retrieved Chunks}|}{|\text{Total Claims in Answer}}|}$$

<!-- claim: [STANDARD KNOWLEDGE] Poor chunk boundaries that sever qualifying caveats force LLMs to fabricate answers, lowering groundedness. -->
### How Chunking Dictates Groundedness:
- When chunk boundaries suffer from **[[context-cliff|context cliffs]]**—such as severing a caveat or omitting who a pronoun refers to—the LLM cannot find the complete factual justification in the text.
- To sound helpful, the LLM fills in the gaps using its parametric pre-training weights, causing groundedness to collapse.
- Proper chunk overlap preserves qualifying clauses and keeps groundedness near $100\%$.

---

## 3. Answer Relevance (The User Satisfaction Metric)

**Definition**: Whether the generated response directly and completely addresses the user's original query without digressing into irrelevant topics.

### How Chunking Dictates Answer Relevance:
- If chunking is so fragmented that the core answer is split across multiple non-retrieved chunks, the model will produce a evasive or incomplete response (e.g., *"The documentation does not provide clear information on this topic"*).
- By ensuring that logical entities, procedures, and tables stay unified within single chunks, retrieval returns the full picture required to answer decisively.

---

## The Triad Trade-Off Matrix

The relationship between chunk configuration and the evaluation triad can be mapped systematically:

:::compare{left="Undersized Chunks (< 150 tokens)" right="Oversized Chunks (> 1,200 tokens)"}
**Impact on Triad:**
- **Context Relevance**: Very high (almost every word is relevant).
- **Groundedness**: Low (critical caveats severed; model hallucinates missing context).
- **Answer Relevance**: Low to moderate (missing holistic context needed for complete answers).
===
**Impact on Triad:**
- **Context Relevance**: Low (substantial token noise and irrelevant paragraphs).
- **Groundedness**: High (the complete answer is somewhere in the text).
- **Answer Relevance**: Degraded by [[lost-in-the-middle|lost-in-the-middle attention fatigue]].
:::

### The Optimal Target Zone:
For general technical and enterprise knowledge bases, empirical testing reveals an optimal operating window:
- **Chunk Size**: 300 to 500 BPE tokens.
- **Chunk Overlap**: 10% to 15% (35 to 60 tokens).
- **Delimiters**: Semantic markdown or recursive character boundaries.

This sweet spot preserves high Context Relevance while providing the complete context needed for 100% Groundedness.

---

## Test Your Understanding

:::quiz[quiz-1-3]{}
:::

---

## Key Takeaways

- **Evaluate RAG on three distinct axes**: Context Relevance (input precision), Groundedness (hallucination freedom), and Answer Relevance (user intent).
- **Oversized chunks destroy Context Relevance**: Cluttering prompts with irrelevant paragraphs degrades model focus.
- **Undersized chunks destroy Groundedness**: Severed clauses force models to fabricate missing background facts.
- **Target 300–500 tokens with 10–15% overlap**: This operational window consistently balances all three legs of the RAG Triad.
