# The Classic Failure Modes of RAG

<!-- claim: [STANDARD KNOWLEDGE] Document chunking errors propagate directly into retrieval failures and LLM hallucinations. -->
:::callout[note]{title="TL;DR"}
When a RAG system answers incorrectly, engineering teams frequently blame the LLM or fine-tune prompt templates. In reality, over 70% of retrieval failures originate in the document ingestion and chunking layer. This lesson details the four classic failure modes—Context Cliffs, Semantic Dilution, Lost-in-the-Middle Degradation, and Orphan Chunks—and demonstrates how proper partition calibration eliminates them.
:::

## The Upstream Error Propagation Principle

In a RAG architecture, errors cascade monotonically downstream:

```
[Defective Chunking]
        │ (Severed sentence or diluted vector)
        ▼
[Failed Retrieval]
        │ (Irrelevant chunk returned or critical fact omitted)
        ▼
[Defective Prompt Augmentation]
        │ (LLM is prompted with missing or misleading context)
        ▼
[Hallucination or Refusal]
        (Final response is incorrect)
```

No prompt engineering technique or model upgrade can compensate for evidence that was never retrieved or that was severed during partitioning.

---

## Failure Mode 1: Context Cliffs (The Severed Antecedent)

A **[[context-cliff|context cliff]]** occurs when an arbitrary character limit splits a sentence or logical clause directly across a partition boundary.

<!-- claim: [STANDARD KNOWLEDGE] Fixed-size character splitters routinely fracture sentences across chunk boundaries. -->
Consider this technical compliance clause:
> *"The database replica automatically switches to read-only mode when disk latency exceeds 250ms. Under no circumstances should automated write traffic resume until an administrator has executed the cluster verification script."*

If an uncalibrated splitter cuts at 100 characters:
- **Chunk A**: `"...The database replica automatically switches to read-only mode when disk latency exceeds 250ms."`
- **Chunk B**: `"Under no circumstances should automated write traffic resume until an administrator has..."`

When an operator asks: *"When can write traffic resume?"*, vector search retrieves **Chunk B**. 
Notice the severe defect: Chunk B contains no mention of "database replica", "read-only mode", or "disk latency". The LLM is forced to guess which system the rule applies to, generating an ungrounded or ambiguous recommendation.

:::compare{left="Defective Boundary (No Overlap)" right="Calibrated Boundary (15% Overlap)"}
**Chunk B in isolation:**
`"Under no circumstances should automated write traffic resume until an administrator has executed the cluster verification script."`
- Subject is missing.
- Context cliff prevents definitive retrieval matching.
===
**Chunk B with bridge overlap:**
`"[...latency exceeds 250ms.] Under no circumstances should automated write traffic resume until an administrator has executed the cluster verification script."`
- Subject and condition are fully preserved.
- Direct cosine alignment with query.
:::

---

## Failure Mode 2: Semantic Dilution (The Averaged Vector)

Dense embedding models project an entire passage into a single fixed-dimension vector (e.g. 1,536 floats). 

<!-- claim: [STANDARD KNOWLEDGE] Large chunks dilute specific factual signals by averaging disparate semantic concepts into a single vector. -->
When a chunk is sized too large (e.g. 2,000+ tokens spanning multiple subheadings):
1. The mathematical embedding averages all the different concepts contained in the text.
2. If the user asks a question about a specific footnote or single parameter on page 3 of that chunk, the cosine similarity between the query vector and the massive chunk vector is muted.
3. A smaller, more focused chunk from another document with higher topical concentration will outrank the relevant passage, causing a retrieval miss.

```
Query: "What is the timeout for AuthCore token refresh?"

Chunk A (150 tokens, focused on AuthCore):
Cosine Similarity: 0.89  [RETRIEVED]

Chunk B (2,500 tokens, covering architecture, billing, legal, and AuthCore):
Cosine Similarity: 0.61  [MISSED DUE TO SEMANTIC DILUTION]
```

---

## Failure Mode 3: Lost in the Middle

Even when large chunks or many small chunks are successfully retrieved, LLMs suffer from **[[lost-in-the-middle|Lost-in-the-Middle attention degradation]]** (documented by Liu et al., 2023).

<!-- claim: [ACADEMIC CITATION] Liu et al. (2023) demonstrated that transformer retrieval accuracy is highest when relevant information is at the beginning or end of input context, dropping sharply when placed in the middle. -->
When a prompt contains 10 retrieved chunks totaling 8,000 tokens:
- Facts located in the first 1–2 chunks enjoy high attention weights.
- Facts located in the final chunk directly preceding the query enjoy high attention weights.
- Facts located in chunks 4, 5, 6, and 7 suffer from substantial attention degradation, with model recall dropping by up to 30%.

```
┌─────────────────────────────────────────────────────────────┐
│ High Recall    │      Degraded Recall (Lost in Middle)      │ High Recall │
│ (Beginning)    │      (Chunks 3 through 7)                  │ (End)       │
└─────────────────────────────────────────────────────────────┘
```

**The ChunkLens Solution**: By tightening chunk size (e.g. 350–500 tokens) and tuning top-$k$ retrieval to only include high-confidence chunks, you minimize prompt clutter and keep vital evidence within the model's highest-attention zones.

---

## Failure Mode 4: Orphan Chunks & Structural Amputation

An **[[orphan-chunk|orphan chunk]]** occurs when structural document elements are divorced from their associated body text:
- **Orphan Header**: A chunk ending with `# Section 4.2 Security Requirements` while all actual requirements appear in the next chunk.
- **Headerless Table**: A chunk starting with row 45 of a tabular CSV (`104, 82.5, "Active", 19201`) without the column names (`UserID, Latency, Status, AccountID`).

To an embedding model, numbers without column headers are meaningless statistical noise. In ChunkLens tabular mode, column headers are automatically attached to every chunk partition.

:::widget[v1-pipeline]{}
:::

---

## Test Your Understanding

:::quiz[quiz-1-2]{}
:::

---

## Key Takeaways

- **Most RAG errors originate in ingestion**: Poor chunk boundaries cause downstream retrieval misses and model hallucinations.
- **Context cliffs sever antecedents**: A sentence missing its grammatical subject cannot be reliably matched by vector search.
- **Semantic dilution harms dense vectors**: Sizing chunks past 1,000 tokens averages away niche factual signals.
- **Lost in the middle is real**: Keep prompt context concise; avoid stuffing dozens of noisy chunks into prompt windows.
- **Retain structural headers**: Never let tabular data or section headers get severed from their data rows.
