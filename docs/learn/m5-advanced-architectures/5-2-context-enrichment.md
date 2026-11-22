# Document Metadata & Summary Enrichment

<!-- claim: [STANDARD KNOWLEDGE] Prepending structural metadata and synthetic context to raw chunks significantly improves retrieval precision. -->
:::callout[note]{title="TL;DR"}
A chunk in isolation suffers from "context blindness": a paragraph discussing liability limits has no idea whether it belongs to a 2021 Vendor Agreement or a 2024 Customer Master Service Agreement. Contextual enrichment prepends document titles, section summaries, and synthetic query keywords to every chunk, providing the essential global framing needed for accurate vector and keyword retrieval.
:::

## The Context Blindness Problem

Consider an isolated passage extracted from page 14 of an enterprise repository:

> *"Either party may terminate this agreement upon thirty (30) days written notice in the event of an uncured material breach."*

When embedded into a vector store as raw text:
- Which company does this apply to?
- Which contract version is it?
- Does it apply to European customers or US customers?
- What year was it enacted?

If a user asks: *"What is the termination notice period in our 2024 European Master Services Agreement?"*, the vector search may struggle or match an outdated 2019 contract because the chunk itself contains zero temporal or geographic identifiers.

---

## The Three Techniques for Contextual Enrichment

```
┌─────────────────────────────────────────────────────────────┐
│                 Enriched Chunk Structure                     │
│                                                             │
│ [Metadata Header]:                                          │
│ Document: 2024-Customer-MSA-EMEA.pdf                        │
│ Section: Part II: Commercial Terms > Clause 9: Termination   │
│ Entity: European Enterprise Customers                       │
│ Effective Date: January 1, 2024                             │
│                                                             │
│ [Raw Content Body]:                                         │
│ Either party may terminate this agreement upon thirty (30)  │
│ days written notice in the event of an uncured material     │
│ breach...                                                   │
└─────────────────────────────────────────────────────────────┘
```

### 1. Structural Metadata Prepending
Prepend document metadata directly to the text payload before generating the embedding vector:
- `Document Title`
- `File Path / Repository Category`
- `Author / Department / Region`
- `Section Breadcrumbs` (`Architecture > Auth > Tokens`)

<!-- claim: [STANDARD KNOWLEDGE] Prepending metadata directly into the embedded text payload allows dense vectors to match both topical concepts and structural filters. -->
Because the metadata becomes part of the embedded text, queries targeting specific versions or departments match with significantly higher cosine scores.

### 2. Contextual Summary Injection (Anthropic Contextual Retrieval)
At ingestion time, pass the entire document and the individual chunk to a lightweight LLM with a brief prompt:
> *"Here is the full document. Write a 2-sentence summary providing the specific context for where this passage sits and what it governs."*

Inject those 2 sentences at the top of the chunk. This immediately resolves ambiguous pronouns and establishes the scope of the passage.

### 3. Synthetic Question Generation (Reverse QA Indexing)
Generate 3–5 hypothetical questions that the chunk answers, and append them to the chunk text:
- *"How much notice is required to terminate for material breach?"*
- *"Can European enterprise customers cancel the 2024 MSA?"*

When users submit questions, their query vectors align almost identically with these pre-generated synthetic questions in vector space.

---

## Token Budget Balancing

While metadata enrichment dramatically boosts retrieval accuracy, it consumes token budget:

:::compare{left="Raw Chunk (No Enrichment)" right="Enriched Chunk"}
- **Size**: 350 tokens (100% body text).
- **Retrieval**: High risk of ambiguous or obsolete matches.
- **Cost**: Low ingestion cost.
===
- **Size**: 450 tokens (100 tokens metadata + 350 tokens body).
- **Retrieval**: High precision across versions, dates, and entities.
- **Cost**: Slightly higher embedding and storage overhead.
:::

**Rule of Thumb**: Allocate no more than $20\% - 25\%$ of your target chunk token budget to metadata headers (e.g. 50–80 tokens of metadata for a 400-token chunk).

:::tryit[legal-saas-agreement]{strategy="recursive" chunkSize="450" chunkOverlap="45"}
:::

---

## Test Your Understanding

:::quiz[quiz-5-2]{}
:::

---

## Key Takeaways

- **Chunks suffer from context blindness**: Isolated passages lack document names, version dates, and geographic scope.
- **Prepend structural metadata**: Include document title, section breadcrumbs, and effective dates in the chunk header.
- **Use contextual summaries**: Two sentences explaining the chunk's scope resolve dangling antecedents.
- **Budget for metadata overhead**: Cap metadata headers at 20% of your total chunk token size.
