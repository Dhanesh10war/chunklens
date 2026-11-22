# Your First Partition Evaluation

<!-- claim: [STANDARD KNOWLEDGE] Interactive visual inspection allows developers to catch boundary errors prior to vector embedding. -->
:::callout[note]{title="TL;DR"}
Evaluating a document partition requires more than checking whether your splitter code ran without crashing. A rigorous partition evaluation verifies four primary criteria: exact token budget compliance, boundary continuity across transitions, structural integrity of headings and tables, and minimal token overlap redundancy. This guide steps through evaluating your first document in the ChunkLens workbench.
:::

## The Evaluation Workflow

Before committing an ingestion pipeline to production, run your source documents through this five-step evaluation checklist:

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  1. Ingest &     │ --> │  2. Select &     │ --> │  3. Inspect      │
│     Detect       │     │     Calibrate    │     │     Boundaries   │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                                                           │
┌──────────────────┐     ┌──────────────────┐              ▼
│  5. Export Code  │ <-- │  4. Audit Matrix │ <────────────┘
│     to Pipeline  │     │     & Continuity │
└──────────────────┘     └──────────────────┘
```

---

## Step 1: Upload and Format Detection

In the ChunkLens sidebar or workbench, drop any source document:
- **Markdown (`.md`)**: Analyzed for heading hierarchy (`#`, `##`, `###`) and code fence boundaries.
- **PDF Documents (`.pdf`)**: Extracted 100% locally in-browser using WebAssembly-isolated worker threads without network transmission.
- **Structured Tables (`.csv`, `.json`)**: Identified for tabular header-stitching requirements.
- **Plain Text / Code (`.txt`, `.py`, `.ts`)**: Parsed with line-break and indentation awareness.

The visualizer immediately calculates total document characters, detected format, and initial BPE [[token|token count]] using real tokenization tables (`cl100k_base` and `o200k_base`).

---

## Step 2: Calibrate Strategy and Budget Limits

Select the partitioning algorithm that reflects your document's semantic structure:

1. **Recursive Character Splitter**: The most reliable general-purpose strategy for natural language prose, documentation, and agreements. It splits by double newlines (`\n\n`), single newlines (`\n`), and spaces (` `) before breaking words.
2. **Markdown Header Splitter**: Preserves logical document hierarchy by anchoring chunks to section headers.
3. **Tabular CSV Splitter**: Glues the header row to every chunk partition so that numbers never lose their column definitions.
4. **Fixed Size with Overlap**: Slices text into rigid, uniform character or token windows.

:::widget[v2-sandbox]{initialStrategy="recursive" initialChunkSize="450" initialChunkOverlap="45" initialSampleId="legal-saas-agreement"}
:::

---

## Step 3: Read the Real-Time Metrics Bar

At the top of the ChunkLens workbench, five core metrics quantify your partition geometry:

- **Chunks / Partitions**: The total count of vector embeddings that will be created.
- **Total Ingested Tokens**: Calculated using real BPE encoding tables.
- **Average Tokens per Chunk**: Displays both the mean token count and the min-max spread (e.g. `[142 - 480] tok`). A tight spread indicates predictable embedding performance.
- **Estimated Ingestion Cost**: Calculated across major vector embedding models (e.g., OpenAI `text-embedding-3-small` at $0.02 / 1M tokens).
- **Compute Latency**: The Web Worker execution time in milliseconds.

---

## Step 4: Inspect Boundary Transitions in the Reading Stream

Switch to the **Continuous Stream View** to inspect how adjacent chunks connect:

<!-- claim: [CHUNKLENS BEHAVIOR VERIFIED] Diagonal overlap bands highlight duplicated characters between contiguous chunk boundaries. -->
- **The Diagonal Overlap Band**: When overlap is configured, a diagonal hatch ribbon highlights the exact duplicated text between Chunk $N$ and Chunk $N+1$.
- **Boundary Continuity Score**: An automated lexical similarity score measuring whether topic continuity is preserved across the partition boundary. A drop below 20% signals an abrupt topic transition or severed thought.
- **Orphan Headers**: Verify that section headings are not stranded at the very bottom of a chunk without their supporting paragraphs.

---

## Step 5: Export Ready-to-Run Code

Once you have visually confirmed that:
1. No sentences are severed mid-clause,
2. Tables retain their column headers,
3. Chunk token counts stay safely below embedding model context ceilings (e.g. $\le 512$ tokens),

Open the **Export Modal** (`Cmd+E` / `Ctrl+E`) to export the exact calibrated configuration directly to Python (LangChain, LlamaIndex) or TypeScript.

:::tryit[legal-saas-agreement]{strategy="recursive" chunkSize="450" chunkOverlap="45"}
:::

---

## Test Your Understanding

:::quiz[quiz-0-2]{}
:::

---

## Key Takeaways

- **Start with Recursive Splitting**: For natural prose, recursive character splitting with a 10% overlap window provides an effective initial baseline.
- **Always monitor the min-max token spread**: A wide token spread (e.g. 50 tokens to 900 tokens) indicates unpredictable chunking that risks embedding truncation.
- **Inspect overlap bands visually**: Ensure that pronouns, qualifying caveats, and antecedent definitions span across the boundary.
- **Export verified configurations**: Do not re-enter parameters manually into code; export tested configs directly to eliminate transcription errors.
