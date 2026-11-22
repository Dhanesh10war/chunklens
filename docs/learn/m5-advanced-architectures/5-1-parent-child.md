# Hierarchical Parent-Child Indexing

<!-- claim: [STANDARD KNOWLEDGE] Hierarchical parent-child indexing decouples the retrieval unit from the context generation unit. -->
:::callout[note]{title="TL;DR"}
Traditional RAG forces engineers to compromise: small chunks optimize vector search precision, while large chunks optimize LLM generation quality. Hierarchical Parent-Child Indexing breaks this trade-off by decoupling the search unit from the prompt unit. Small child chunks (100–200 tokens) are embedded for high-precision search, but when a match occurs, the system retrieves and injects the larger parent passage (800–1,500 tokens) into the LLM context.
:::

## The Core Dilemma of Single-Tier RAG

In a single-tier chunking architecture, the passage you embed is the exact passage you pass to the language model:

$$\text{Embedding Unit} \equiv \text{Prompt Generation Unit}$$

This forces an unavoidable architectural compromise:
- If you choose **150 tokens**, vector retrieval is fast and pinpoint, but the LLM receives severed sentence fragments.
- If you choose **1,000 tokens**, the LLM gets rich context, but vector retrieval suffers from semantic dilution.

```
┌─────────────────────────────────────────────────────────────┐
│                    Single-Tier Compromise                   │
│                                                             │
│       Small Chunks (150 tok)       Large Chunks (1,000 tok) │
│       [Great Retrieval]            [Poor Retrieval]         │
│       [Poor Generation]            [Great Generation]       │
└─────────────────────────────────────────────────────────────┘
```

---

## The Parent-Child Architecture

Parent-Child indexing (also known as *Small-to-Big Retrieval*) decouples the two horizons:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Parent Chunk (1,000 tokens)                             │
│  "Section 4.1 Architecture Specification ... comprehensive background..."   │
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐           │
│  │ Child Chunk A    │  │ Child Chunk B    │  │ Child Chunk C    │           │
│  │ (150 tokens)     │  │ (150 tokens)     │  │ (150 tokens)     │           │
│  │ [Vector Embed]   │  │ [Vector Embed]   │  │ [Vector Embed]   │           │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘           │
│           │                     │                     │                     │
└───────────┼─────────────────────┼─────────────────────┼─────────────────────┘
            ▼                     ▼                     ▼
     [Vector Store]        [Vector Store]        [Vector Store]
       (parent_id)           (parent_id)           (parent_id)
```

### The Ingestion Flow:
1. **Partition Parents**: Slice the document into large, structurally cohesive parent passages (e.g. 800 to 1,200 tokens). Store these in document storage (or PostgreSQL / S3 / Redis).
2. **Partition Children**: Subdivide each parent into focused child chunks (e.g. 150 to 250 tokens).
3. **Index Vectors**: Embed only the child chunks into your vector database, attaching a `parent_id` foreign key metadata tag to each vector.

### The Query Flow:
1. User submits a query.
2. Vector search matches the most semantically relevant **Child Chunk** with high precision.
3. Instead of passing the child chunk to the LLM, the system performs a primary key lookup for the **Parent Chunk**.
4. If multiple child chunks share the same parent, they automatically deduplicate into a single parent retrieval.
5. The full parent passage is injected into the LLM prompt.

---

## Architectural Comparison

:::compare{left="Standard Single-Tier RAG" right="Hierarchical Parent-Child RAG"}
- Embedded passage equals prompt passage.
- Prone to context cliffs and severed antecedents.
- Lower prompt token efficiency when compensating with large overlap windows.
===
- Embedded passage (small) differs from prompt passage (large).
- 100% elimination of context cliffs: the LLM receives the full surrounding section.
- Higher storage requirements (stores both parent documents and child vectors).
:::

---

## Production Implementation Example

In LangChain, this pattern is natively supported via the `ParentDocumentRetriever`:

```python
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.retrievers import ParentDocumentRetriever
from langchain.storage import InMemoryStore

# 1. Parent splitter: Large context for generation
parent_splitter = RecursiveCharacterTextSplitter(chunk_size=1200, chunk_overlap=100)

# 2. Child splitter: Small passages for vector search
child_splitter = RecursiveCharacterTextSplitter(chunk_size=200, chunk_overlap=20)

retriever = ParentDocumentRetriever(
    vectorstore=vectorstore,
    docstore=docstore,
    child_splitter=child_splitter,
    parent_splitter=parent_splitter,
)
```

:::tryit[academic-paper]{strategy="recursive" chunkSize="400" chunkOverlap="40"}
:::

---

## Test Your Understanding

:::quiz[quiz-5-1]{}
:::

---

## Key Takeaways

- **Decouple search from generation**: Small chunks find answers; large chunks provide context.
- **Eliminates context cliffs**: Because the parent passage is injected into the prompt, qualifying caveats are never severed.
- **Deduplicates multi-match queries**: Multiple matching child chunks collapse into a single parent, saving prompt tokens.
- **Budget for two storage layers**: Requires a vector database for child embeddings and a fast key-value store for parent documents.
