# Plain Text & Markdown Structures

<!-- claim: [STANDARD KNOWLEDGE] Markdown headers provide explicit structural delimiters that reflect author-intended semantic hierarchy. -->
:::callout[note]{title="TL;DR"}
Markdown is the ideal format for retrieval-augmented generation because its syntax (`#`, `##`, code fences, lists) reflects the author's explicit semantic hierarchy. Splitting markdown naively with fixed-character counters destroys this structure, severing code blocks and disassociating headers from body paragraphs. This lesson explains how structural markdown splitters propagate breadcrumbs and maintain clean syntactic boundaries.
:::

## The Power of Markdown AST in RAG

When authors write documentation in markdown, they provide free structural metadata:
- Level 1 (`#`): Broad domain or document title.
- Level 2 (`##`): Major functional section or feature.
- Level 3 (`###`): Specific procedure, parameter, or sub-clause.

A naive character splitter ignores these syntax tokens, cutting passages at arbitrary character counts (e.g. 500 characters). This creates **headless chunks** where paragraph 3 of `### Rate Limiting` is detached from the header that explains what system is being throttled.

---

## Heading Breadcrumb Propagation

To prevent headless chunks, structural splitters utilize **Breadcrumb Context Injection**. Whenever a chunk is created under a hierarchy of headings, the splitter injects the ancestral path into the chunk's metadata or directly prepends it to the chunk text:

```markdown
# Cloud Infrastructure Specification
## Storage Subsystems
### Object Retention Policies
The default retention period for archival buckets is 365 days...
```

Instead of indexing:
> *"The default retention period for archival buckets is 365 days..."* (Which buckets? Which subsystem?)

The structural splitter creates an enriched chunk:
```
[Cloud Infrastructure Specification > Storage Subsystems > Object Retention Policies]
The default retention period for archival buckets is 365 days...
```

<!-- claim: [STANDARD KNOWLEDGE] Prepending structural breadcrumbs to child chunks disambiguates generic prose in dense vector search. -->
When a user asks: *"What is the storage retention policy?"*, the dense vector embedding matches both the query terms and the injected breadcrumb tokens, yielding significantly higher retrieval precision.

---

## Preserving Code Fences and Indentation

Technical documents frequently contain code snippets wrapped in triple backticks (` ``` `). 

:::compare{left="Naive Splitter" right="Syntax-Aware Splitter"}
**Cuts mid-block:**
```python
def generate_auth_token(user_id: str):
    payload = {"sub": user_id, "exp": time.time() + 3600}
```
*(Chunk ends; function signature severed from implementation.)*
===
**Preserves block atomicity:**
Keeps the entire function unified within a single chunk, or splits cleanly at outer block boundaries if the snippet exceeds target limits.
:::

If a code snippet must be split because it exceeds the maximum token budget, a syntax-aware splitter ensures that:
1. The opening code fence (` ```python `) is closed before the chunk boundary.
2. The subsequent chunk re-opens the fence with the appropriate language identifier to preserve syntax highlighting and LLM parsing validity.

---

## Markdown Splitting Hierarchy in ChunkLens

ChunkLens uses an optimized recursive delimiter cascade for markdown:
1. Level 2 Headers (`\n## `)
2. Level 3 Headers (`\n### `)
3. Paragraph Breaks (`\n\n`)
4. List Items & Line Breaks (`\n- `, `\n* `, `\n`)
5. Word Boundaries (` `)

```
[Raw Markdown] ──▶ [Match ## Headers] ──▶ [Evaluate Budget <= 512 tok]
                          │ (Exceeds budget)
                          ▼
                  [Match ### Subheaders] ──▶ [Evaluate Budget]
                          │ (Exceeds budget)
                          ▼
                  [Match Paragraphs \n\n]
```

This hierarchy guarantees that chunks preserve the highest possible level of semantic abstraction without breaching positional token budgets.

:::tryit[developer-guide]{strategy="markdown" chunkSize="450" chunkOverlap="40"}
:::

---

## Test Your Understanding

:::quiz[quiz-2-1]{}
:::

---

## Key Takeaways

- **Markdown encodes author intent**: Use heading tags (`#`, `##`, `###`) as natural primary partition boundaries.
- **Propagate heading breadcrumbs**: Prepending section ancestry (`Doc > Section > Subsection`) provides the context needed for isolated vector retrieval.
- **Never sever code fences**: Ensure code blocks remain unified or gracefully re-opened across chunk splits.
- **Use hierarchical delimiter cascades**: Split by double newlines before falling back to line breaks or words.
