# Context Brief & Reconstructed PRD-lite (ASSUMED)
**Project:** ChunkLens — Visual Document Chunking & Token Optimization Workbench for RAG Pipelines  
**Version:** v0.1.0 (MVP)  
**Evaluator:** Principal Engineer, Product-minded QA Lead, Security Reviewer  
**Date:** November 2026  
**Status:** ASSUMED PRD-LITE (Reconstructed from README, source code, UI, and test suite)

---

## 1. Executive Summary & Project Purpose
Retrieval-Augmented Generation (RAG) systems fail frequently due to poor document chunking: Chunks that are too small slice critical context in half, while chunks that are too large dilute vector embedding recall and inflate token costs.

**ChunkLens** is an open-source, client-side visual interactive workbench that enables AI and data engineers to test, visualize, debug, and benchmark document chunking strategies in real time with exact BPE token counting directly in the browser.

### Key Value Propositions
- **100% In-Browser Privacy:** Zero bytes leave the user's browser. Parsing, tokenization, and metrics run entirely on the client thread.
- **Exact BPE Token Counting:** Leverages `js-tiktoken` with OpenAI's `o200k_base` (GPT-4o) and `cl100k_base` (GPT-4) tokenizers.
- **Production Parity:** Implements 4 standard chunking algorithms designed to mirror LangChain and LlamaIndex behavior.
- **One-Click Code Export:** Generates ready-to-run ingestion code for LangChain (Python), LlamaIndex (Python), LangChain.js (TS), and Native Python.

---

## 2. Project Map & Architecture

### Target Users
- AI Engineers and LLM Application Developers building RAG pipelines.
- Data Engineers optimizing vector database ingestion costs and chunk densities.
- Machine Learning Researchers analyzing context boundary coherence.

### Tech Stack
| Component | Technology | Description |
| :--- | :--- | :--- |
| **Runtime** | Web Browser | Client-side only execution |
| **Language** | TypeScript 5.6.3 | Strict type-checking enabled |
| **UI Framework** | React 18.3.1 | Functional components with Hooks |
| **Bundler / Dev** | Vite 6.0.3 | Fast HMR and static bundle builder |
| **Styling** | Tailwind CSS 3.4.17 | Dark-mode developer-focused theme |
| **Icons** | Lucide React 0.468.0 | Minimalist modern SVG iconography |
| **Tokenization**| js-tiktoken 1.0.17 | Pure JS/WASM OpenAI BPE token counting |
| **Testing** | Vitest 2.1.8 | Fast unit testing |

### Architecture Diagram
```
                     ┌───────────────────────────────────────────────┐
                     │              Browser Client Runtime           │
                     └───────────────────────┬───────────────────────┘
                                             │
             ┌───────────────────────────────┼──────────────────────────────┐
             ▼                               ▼                              ▼
   ┌────────────────────┐         ┌──────────────────────┐        ┌───────────────────┐
   │ Document Ingestion │         │   Chunking Engine    │        │  BPE Tokenizer    │
   │ - Sample Library   │ ──────► │ - Recursive Delim    │ ◄────► │ - js-tiktoken     │
   │ - File Upload      │         │ - Markdown AST       │        │   (o200k/cl100k)  │
   │ - Raw Text Editor  │         │ - Sentence Boundary  │        │ - Token Truncator │
   └────────────────────┘         │ - Fixed Window       │        └───────────────────┘
                                  └──────────┬───────────┘
                                             │
             ┌───────────────────────────────┼──────────────────────────────┐
             ▼                               ▼                              ▼
   ┌────────────────────┐         ┌──────────────────────┐        ┌───────────────────┐
   │ Real-Time Metrics  │         │    Visual Canvas     │        │   Code Exporter   │
   │ - Token Density    │         │ - Color Chunk Cards  │        │ - Python LangChain│
   │ - Cost Estimation  │         │ - Continuous Stream  │        │ - LlamaIndex      │
   │ - Latency & Alerts │         │ - Side-by-Side Comp. │        │ - LangChain.js    │
   └────────────────────┘         └──────────────────────┘        │ - Native Python   │
                                                                  └───────────────────┘
```

### Key Entry Points & Modules
- `index.html` & `src/main.tsx`: Application bootstrapping and DOM mounting.
- `src/App.tsx`: Main application state management, active document, chunking config, reactive pipeline invocation.
- `src/engine/types.ts`: Core schema definitions (`ChunkingConfig`, `ChunkMetadata`, `ChunkingResult`, etc.).
- `src/engine/tokenizers/tokenizer.ts`: Cached `js-tiktoken` wrapper for `o200k_base` and `cl100k_base`.
- `src/engine/chunkers/index.ts`: Strategy orchestrator and metrics aggregator (`executeChunking`).
- `src/engine/chunkers/`: Individual algorithm implementations:
  - `recursiveChunker.ts`: LangChain-style recursive character delimiter splitting.
  - `markdownChunker.ts`: Markdown header hierarchy and code block aware chunker.
  - `sentenceChunker.ts`: Sentence boundary splitter with abbreviation protection.
  - `fixedChunker.ts`: Sliding fixed window by characters or tokens.
- `src/exporters/codeExporters.ts`: Code generation template engines.
- `src/components/`:
  - `Header.tsx`: Title, status, compare toggle, export modal trigger.
  - `ControlsPanel.tsx`: Parameters (strategy, unit, encoding, size, overlap), document selector, file uploader.
  - `MetricsBar.tsx`: Chunks count, token stats, cost calculation, execution time.
  - `VisualCanvas.tsx`: Chunk cards view, continuous stream view, copy tools, mid-word warning.
  - `ComparisonView.tsx`: Split-screen comparison of two chunking configurations.
  - `ExportModal.tsx`: Code export viewer and clipboard copy.

---

## 3. Assumptions & Caveats (PRD-lite Reconstruction)
1. **Scope Assumption:** ChunkLens is strictly a client-side frontend tool. It does not require any backend server, database, or API keys.
2. **Tokenizer Scope:** Primary tokenizers are OpenAI `o200k_base` (GPT-4o) and `cl100k_base` (GPT-4) via `js-tiktoken`. Other tokenizers (Llama, Claude) are out of scope for v0.1.
3. **Embedding Cost Assumption:** Vector cost metric is estimated based on OpenAI's `text-embedding-3-small` public rate ($0.02 per 1,000,000 tokens).
4. **Markdown Parsing Assumption:** Markdown chunking must preserve code blocks (` ``` `) from being broken across chunks and extract heading levels as chunk metadata.
5. **Code Export Parity Assumption:** Exported code must reflect the exact configuration selected by the user in the UI (matching strategy, chunk size, overlap, unit, and tokenizer).

---

## 4. Numbered Requirement Checklist

| ID | Requirement | Priority | Acceptance Criteria | Flag / Ambiguity |
| :--- | :--- | :--- | :--- | :--- |
| **REQ-01** | **Recursive Character Chunker** | MUST | Splits text recursively by delimiters `['\n\n', '\n', '. ', ' ', '']`. Merges splits up to `chunkSize`. Preserves overlap `chunkOverlap`. Complies with `unit` (tokens vs characters). | Check delimiter preservation & token unit compliance. |
| **REQ-02** | **Markdown AST Chunker** | MUST | Splits text along Markdown headings (`#` through `######`). Preserves heading text in `sectionHeader`. Keeps fenced code blocks (` ``` `) intact without mid-code splits. Applies size constraints. | Untested for nested headings & multi-line code blocks with blank lines. |
| **REQ-03** | **Sentence Boundary Chunker** | MUST | Splits text at grammatical sentence boundaries (`. `, `! `, `? `). Protects common abbreviations (e.g. `e.g.`, `i.e.`, `Dr.`, `vs.`). Groups sentences up to `chunkSize` with sentence-level overlap. | Regex splitting needs verification on quotes and decimals. |
| **REQ-04** | **Fixed Window Chunker** | MUST | Slices text into exact sliding windows of `chunkSize` with step `chunkSize - chunkOverlap`. Supports both character and token slicing. Sets `isOrphan` when splitting mid-word. | Token slicing character offset mapping is currently `-1`. |
| **REQ-05** | **Exact BPE Token Counting** | MUST | Calculates exact BPE tokens using `js-tiktoken` for `o200k_base` and `cl100k_base`. Handles empty strings and fallback gracefully. | Verified in basic tests; edge cases need testing. |
| **REQ-06** | **Dual Unit Measurement (Tokens vs Chars)** | MUST | Users can toggle between `tokens` and `characters`. Sliders update ranges accordingly (tokens: 50-2048, chars: 200-8000). Chunker obeys active unit. | Verify whether all 4 chunkers actually honor token unit mode. |
| **REQ-07** | **Interactive Visual Canvas (Cards & Stream)** | MUST | Displays chunks in color-coded cards with index, token count, char count, section header, orphan badge, and copy button. Provides alternative "Continuous Stream" view with boundary markers. | Verify responsiveness and empty states. |
| **REQ-08** | **Chunk Boundary Inspection & Alerts** | SHOULD | Flags mid-word cuts with "Mid-word cut" badge. Highlights chunk boundary cuts. Warns if any chunk exceeds 1,024 tokens in the metrics bar. | Acceptance criteria clear. |
| **REQ-09** | **Side-by-Side Strategy Comparison** | MUST | Toggle button opens split view comparing Variant A (from controls) against Variant B (customizable strategy and size) on the same document. | Variant B controls currently only allow changing strategy and size (not unit or overlap). |
| **REQ-10** | **Production Code Exporter** | MUST | Generates copyable, valid code for LangChain Python, LlamaIndex Python, LangChain.js, and Native Python matching current configuration parameters. | Check whether all exporter templates match the active strategy and unit. |
| **REQ-11** | **Real-Time Metrics Bar** | MUST | Displays: Total Chunks, Total Tokens, Total Chars, Average Tokens/Chunk, Min/Max Tokens, Vector Embedding Cost ($), and Execution Latency (ms). Updates reactively on input change. | Cost calculation formula must be accurate. |
| **REQ-12** | **Sample Document Library** | SHOULD | Includes at least 4 diverse domain samples: Technical API Docs, Legal Contract, Financial 10-Q, and Research Paper. Selecting a sample populates the editor and updates chunks. | Implemented in `samples.ts`. |
| **REQ-13** | **Custom Document Upload & Raw Editing** | MUST | Allows uploading `.txt`, `.md`, `.json`, `.csv`, `.py`, `.js`, `.ts` files. Provides a raw text editor tab to paste or modify document text in real time. | Need error handling for binary/unsupported file types. |
| **REQ-14** | **Zero Server Calls & Privacy Guarantee** | MUST | Application makes 0 external network requests during parsing, tokenization, and rendering. Document content never leaves local client. | Verified via network tracing. |
| **REQ-15** | **Edge Case Resilience & Error Boundaries** | SHOULD | Handles empty string, single character, massive text, zero overlap, overlap >= chunkSize, whitespace-only without crashes or infinite loops. | Needs rigorous automated testing. |
| **REQ-16** | **Test Suite & Static Analysis** | MUST | Clean build (`npm run build`), clean type check (`tsc -b`), and automated unit tests (`npm run test`) passing with 100% success. | Currently 1 test file with 5 basic tests. Needs expansion. |

---

## 5. Next Steps
Phase 0 discovery complete. Proceeding to **Phase 1: Validate** to run tools, build, test, and perform detailed traceability and edge-case verification.
