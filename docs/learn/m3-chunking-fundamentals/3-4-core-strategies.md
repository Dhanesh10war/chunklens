# The 5 Core Splitting Strategies Compared

<!-- claim: [STANDARD KNOWLEDGE] Selecting the appropriate splitting strategy depends on document structure, syntax, and retrieval objectives. -->
:::callout[note]{title="TL;DR"}
No single splitting strategy fits every document type. A strategy designed for unstructured narrative prose will scramble tabular data, while a rigid fixed-character slicer will sever sentences and code blocks. This lesson provides an architectural, side-by-side comparison of the five primary splitting strategies used in production RAG pipelines, complete with a decision tree for selecting the optimal strategy.
:::

## The 5 Core Splitting Strategies

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       The Document Splitting Decision Tree                  │
│                                                                             │
│                     What is the primary document format?                    │
│                                      │                                      │
│        ┌─────────────────────────────┼─────────────────────────────┐        │
│        ▼                             ▼                             ▼        │
│  [Tabular / CSV]             [Markdown / Docs]             [Narrative Text] │
│        │                             │                             │        │
│        ▼                             ▼                             ▼        │
│  Tabular Splitter            Markdown Splitter             Recursive Split  │
│  (Glues header schema        (Splits on # headers,         (Paragraphs \n\n,│
│   to every row group)         injects breadcrumbs)          lines \n, words)│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Architectural Comparison Matrix

| Strategy | Primary Splitting Mechanism | Best Document Corpus | Primary Hazard | Compute Cost |
| :--- | :--- | :--- | :--- | :--- |
| **Recursive Character** | Hierarchical delimiters: `["\n\n", "\n", " ", ""]` | Unstructured prose, legal agreements, articles | Long uninterrupted strings fallback to arbitrary word splits | Extremely low ($< 1\text{ ms}$) |
| **Markdown Header** | Markdown syntax tags: `["#", "##", "###"]` | Developer documentation, wikis, RFCs | Documents with irregular or missing header formatting | Low ($< 2\text{ ms}$) |
| **Tabular & CSV** | Row grouping with header schema injection | Financial spreadsheets, product catalogs, database dumps | High token overhead from repeated column headers | Low ($< 3\text{ ms}$) |
| **Sentence-Based** | Punctuation boundary detection (`. `, `? `, `! `) | Academic papers, dense literature, clinical notes | Abbreviations (`e.g.`, `Dr.`) cause false split points | Moderate ($2 - 5\text{ ms}$) |
| **Fixed Size** | Uniform character/token counters | Benchmarking, synthetic baselines | Severe context cliffs; words severed mid-character | Negligible |

---

## Strategy Deep Dives

### 1. Recursive Character Splitting (The General Baseline)
Recursive splitting is the standard choice for general unstructured text. It attempts to preserve largest semantic blocks first:
1. First, attempts to split by double newlines (`\n\n`) to preserve whole paragraphs.
2. If a paragraph exceeds the target chunk size, it splits by single newlines (`\n`) to preserve sentences.
3. If a line is still too long, it splits by spaces (` `) to preserve words.
4. Only as an absolute last resort does it split mid-word.

### 2. Markdown Header Splitting (Structure-Aware)
Markdown splitters parse the document's Abstract Syntax Tree (AST). Chunks are anchored to section headers, and ancestral headers are propagated as breadcrumbs. This ensures that every chunk retains its structural context (e.g. `Architecture > Database > Connection Pooling`).

### 3. Tabular & CSV Splitting (Schema-Retaining)
Instead of treating rows as arbitrary text lines, tabular splitters group related rows together and replicate the header row at the top of every chunk. This guarantees that numbers and dates remain tied to their column definitions.

### 4. Fixed-Size Slicing (The Synthetic Baseline)
Fixed-size splitting enforces strict uniform windows (e.g. exactly 500 characters) regardless of syntax. While useful as a baseline for measuring performance, it should rarely be deployed in production applications due to the prevalence of context cliffs.

:::widget[v2-sandbox]{initialStrategy="recursive" initialChunkSize="450" initialChunkOverlap="45" initialSampleId="developer-guide"}
:::

---

## Decision Matrix: How to Choose in 10 Seconds

:::compare{left="Choose Recursive or Markdown If..." right="Choose Tabular or Sentence If..."}
- Documents are written in human prose (articles, policy manuals, technical guides).
- Documents contain natural paragraphs and markdown headers.
- You want fast, robust splitting with minimal edge-case fragility.
===
- Documents consist of structured records, financial tables, or spreadsheets.
- Texts are dense with technical citations or clinical findings requiring sentence atomicity.
- Schema retention is mandatory to interpret numeric data.
:::

:::tryit[developer-guide]{strategy="markdown" chunkSize="450" chunkOverlap="40"}
:::

---

## Test Your Understanding

:::quiz[quiz-3-4]{}
:::

---

## Key Takeaways

- **Match strategy to syntax**: Use Tabular for CSVs, Markdown for technical docs, and Recursive for general prose.
- **Recursive splitting is the safest default**: Its delimiter fallback cascade prevents severed words in unstructured documents.
- **Avoid fixed-size slicing in production**: Rigid character counters cause avoidable context cliffs and fragmented thoughts.
- **Audit your choice in ChunkLens**: Always preview chunk distributions across multiple document types before indexing into vector databases.
