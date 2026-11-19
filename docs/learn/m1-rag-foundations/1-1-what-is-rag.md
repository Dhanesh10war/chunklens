# What is RAG? (Retrieval-Augmented Generation)

<!-- claim: [STANDARD KNOWLEDGE] RAG supplements LLM parametric knowledge with external dynamic document retrieval. -->
:::callout[note]{title="TL;DR"}
Retrieval-Augmented Generation (RAG) is an architecture that supplements a Large Language Model (LLM) with external, authoritative documents retrieved at query time. Instead of relying solely on the frozen knowledge encoded during pre-training, RAG searches an indexed knowledge base for relevant passages and injects them directly into the model's prompt. How you slice those documents into chunks determines whether the model receives precise answers or gets bogged down in noisy, irrelevant context.
:::

## The Core Problem RAG Solves

Large language models excel at reasoning, linguistic synthesis, and code generation. However, deploying an LLM alone in real-world enterprise applications reveals three fundamental limitations:

<!-- claim: [STANDARD KNOWLEDGE] Pre-trained LLM weights are static and subject to training cutoff dates. -->
1. **Knowledge Cutoffs**: Model weights are fixed at the conclusion of training. They cannot answer questions about internal company policies, recent events, or proprietary datasets created after their training cutoffs.
<!-- claim: [STANDARD KNOWLEDGE] Hallucinations occur when models generate plausible-sounding but factually ungrounded text. -->
2. **Hallucination Risk**: When asked about specific, nuanced facts not memorized in their weights, models frequently invent plausible-sounding yet fictitious facts, citations, or formulas.
3. **Auditability and Citations**: A standard LLM response cannot point back to the exact paragraph, file version, or contract clause that justifies its statement.

<!-- claim: [STANDARD KNOWLEDGE] RAG architectures bypass retraining by retrieving context dynamically. -->
Rather than undertaking costly continual fine-tuning or retraining—which is expensive and still does not eliminate hallucinations—RAG decouples **reasoning** from **memory**. The model acts as an analytical reasoning engine, while an external document index serves as the verifiable source of truth.

---

## The 5-Stage RAG Lifecycle

A modern RAG system processes documents through a five-stage pipeline. Every stage depends directly on the output quality of the previous step.

:::widget[v1-pipeline]{}
:::

### 1. Document Ingestion & Extraction
Raw documents—including PDFs, technical documentation, spreadsheets, and markdown notes—are ingested and parsed into clean text. Visual headers, table formatting, and code blocks must be extracted while preserving meaningful reading order.

### 2. Chunking & Overlap Partitioning
A 50-page document cannot be passed to a retrieval system as a single unbroken string. The document is partitioned into bounded passages called [[chunk|chunks]]. Sizing these chunks and maintaining an [[chunk-overlap|overlap window]] bridges boundaries so that key concepts are not severed mid-sentence.

### 3. Dense Vector Embedding
Each chunk is passed to an embedding model (such as OpenAI `text-embedding-3-small` or open-source equivalents). The model maps the text into a dense numerical [[embedding|vector]] in a multi-dimensional semantic space. Semantically related passages cluster closely together geometrically.

### 4. Vector Search & Retrieval
When a user submits a question, that question is embedded into the same vector space. A [[vector-database|vector database]] runs Approximate Nearest Neighbor (ANN) search to identify the top-*k* candidate chunks with the highest cosine similarity to the query.

### 5. Context Augmentation & Generation
The retrieved chunks are assembled into a structured prompt alongside the original query. The LLM reads the evidence and synthesizes a grounded, verifiable answer with direct citations back to the source passages.

---

## Why Chunking Is the Control Lever of RAG

Many engineering teams treat chunking as an afterthought, relying on default split sizes like `chunk_size=1000`. In practice, chunking is the single most influential hyperparameter in the retrieval pipeline.

<!-- claim: [STANDARD KNOWLEDGE] Chunk size dictates the signal-to-noise ratio in retrieved context. -->
If chunks are sized too small (for example, single sentences), the retrieval engine might pinpoint the exact line, but the LLM lacks the surrounding context to understand what pronouns or conditions apply. If chunks are sized too large (for example, entire chapters), the vector embedding becomes a diluted blend of disparate topics, and the prompt context fills with irrelevant noise.

```
[Raw Document] -> [Chunker Strategy] -> [Embeddings] -> [Top-k Retrieval] -> [Grounded Answer]
                        ▲
                        │ (ChunkLens Inspects & Calibrates Here)
```

In ChunkLens, you observe exactly where these boundaries land in real time, measuring character distributions, token counts, and semantic similarity matrices before you index a single vector into production.

---

## Test Your Knowledge

:::quiz[quiz-1-1]{}
:::

---

## Key Takeaways

<!-- claim: [CHUNKLENS BEHAVIOR VERIFIED] Tokenization and chunk boundaries can be fully previewed client-side without remote calls. -->
- **RAG separates reasoning from knowledge storage**: LLMs provide language comprehension; your document index provides factual grounding.
- **The pipeline has five distinct stages**: Ingestion, Chunking, Embedding, Retrieval, and Generation.
- **Chunking directly controls retrieval precision**: Oversized chunks dilute embeddings; undersized chunks fragment necessary context.
- **Verification is essential**: Inspecting chunk boundaries and token metrics before database indexing prevents expensive retrieval regressions in production.
