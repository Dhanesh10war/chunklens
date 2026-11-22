# Technical Documentation & API References

<!-- claim: [STANDARD KNOWLEDGE] Technical documentation chunking requires maintaining atomic coupling between prose explanations, parameter schemas, and corresponding code samples using Markdown AST-aware splitting. -->
:::callout[note]{title="TL;DR"}
Technical documentation and API references present a distinct engineering challenge: code snippets are useless without the prose that explains their parameters, and prose is incomplete without the executable example that validates it. Splitting technical docs with naive character chunkers frequently severs code blocks from endpoint descriptions or splits JSON payloads mid-bracket. AST-aware markdown chunking preserves the atomic relationship between HTTP verbs, parameter tables, and implementation snippets.
:::

## The Interleaved Nature of Technical Docs

Modern developer documentation is rarely pure prose. It is composed of tightly coupled heterogeneous elements:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Anatomy of an API Endpoint                            │
│                                                                             │
│  ## POST /api/v2/embeddings                                                 │
│  Generate dense vector representations for input strings.                   │
│                                                                             │
│  ### Request Parameters (Table)                                             │
│  | Parameter | Type   | Required | Description                            | │
│  | input     | string | Yes      | The text string to embed               | │
│  | model     | string | Yes      | Model identifier string                | │
│                                                                             │
│  ### Example Request (Code)                                                 │
│  ```bash                                                                    │
│  curl -X POST https://api.service.com/v2/embeddings \                       │
│    -H "Authorization: Bearer $KEY" \                                        │
│    -d '{"input": "Search query", "model": "text-embed-3"}'                  │
│  ```                                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

When an ingestion pipeline applies a flat 400-character splitter to this document:
- Chunk #1 contains `## POST /api/v2/embeddings` and the first two lines of prose.
- Chunk #2 contains only the parameter table.
- Chunk #3 contains the raw curl code snippet without any mention of `/api/v2/embeddings`.

### The Retrieval Failure:
When a developer asks *"Show me a curl example for creating embeddings"*, vector search retrieves Chunk #3. However, because Chunk #3 lacks the endpoint URL and method header, the LLM hallucinates an arbitrary URL like `/v1/vectors`.

---

## The Markdown AST-Aware Strategy

To preserve technical context, chunking engines should operate at the **Markdown Abstract Syntax Tree (AST)** level rather than the raw character level:

### 1. Header-Level Section Partitioning
Split primarily on heading transitions (`#`, `##`, `###`). An entire endpoint specification—including its route, description, parameter table, and code example—should be kept as an atomic unit whenever it fits within the model's token limit (typically 500 to 1,000 tokens).

### 2. Code Block Shielding
Never permit a chunk boundary to cut inside a fenced code block (` ``` `):
- If the entire section (prose + code) fits in 800 tokens, keep it unified.
- If the code snippet is unusually large (e.g. a 200-line SDK sample), split cleanly *before* the code fence, and inject a header breadcrumb into the code chunk:

```markdown
<!-- Chunk B (Code Block) -->
[Reference: POST /api/v2/embeddings > Code Sample]
```python
import client
response = client.embeddings.create(input="Query", model="text-embed-3")
```
```

---

## Architectural Comparison

:::compare{left="Flat Character Splitting" right="Markdown AST-Aware API Chunking"}
- Splits wherever token count reaches limit.
- Severs curl commands and SDK examples from the endpoint route.
- Splits markdown tables mid-row, losing column schema headers.
- Leaves dangling syntax brackets in code blocks.
===
- Uses Markdown AST nodes (`Heading`, `Table`, `CodeBlock`) as atomic units.
- Couples endpoints directly with their parameter tables and examples.
- Re-injects table headers if a table must span multiple chunks.
- Preserves full syntax validity for code and JSON payloads.
:::

---

## Production Python Implementation

Using `langchain_text_splitters.MarkdownHeaderTextSplitter`, you can partition technical documentation while preserving heading hierarchy:

```python
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter

markdown_document = """
# API Documentation

## Authentication
All API requests require an API key passed in the Authorization header.

```bash
curl -H "Authorization: Bearer YOUR_KEY" https://api.service.com/status
```

## Endpoints

### POST /v1/chat/completions
Creates a model response for the given chat conversation.

#### Request Body
| Field | Type | Description |
|---|---|---|
| model | string | ID of the model to use |
| messages | array | List of message objects |

#### Example
```python
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}]
)
```
"""

# Step 1: Split along logical Markdown headings
headers_to_split_on = [
    ("#", "H1"),
    ("##", "H2"),
    ("###", "H3"),
]

markdown_splitter = MarkdownHeaderTextSplitter(
    headers_to_split_on=headers_to_split_on,
    strip_headers=False
)
header_splits = markdown_splitter.split_text(markdown_document)

# Step 2: Ensure individual sections do not exceed token ceiling
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=800,
    chunk_overlap=50
)
final_chunks = text_splitter.split_documents(header_splits)

for i, chunk in enumerate(final_chunks, start=1):
    print(f"--- Chunk {i} [Metadata: {chunk.metadata}] ---")
    print(chunk.page_content.strip())
```

:::tryit[tech-docs]{strategy="markdown" chunkSize="600" chunkOverlap="50"}
:::

---

## Test Your Understanding

:::quiz[quiz-8-2]{}
:::

---

## Key Takeaways

- **Never sever code from prose**: An API code snippet is ambiguous if it lacks its corresponding route and HTTP method.
- **AST-aware splitting**: Partition along markdown headers rather than arbitrary line or character counts.
- **Preserve code fences**: Avoid cutting inside fenced code blocks or JSON payloads.
- **Table schema preservation**: Ensure parameter tables retain their header rows if split across chunk boundaries.
