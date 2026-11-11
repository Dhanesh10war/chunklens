# Improvement Log
**Project:** ChunkLens — Visual Document Chunking & Token Optimization Workbench for RAG Pipelines  
**Version:** v0.1.0 -> v0.1.1  
**Status:** In Progress  

---

## Batch Index
- [Batch 1: Core Test Infrastructure & Strict Assertions](#batch-1-core-test-infrastructure--strict-assertions)
- [Batch 2: Chunker Algorithm Bug Fixes & Code Fence Protection](#batch-2-chunker-algorithm-bug-fixes--code-fence-protection)
- [Batch 3: Strategy-Aware Production Code Exporters](#batch-3-strategy-aware-production-code-exporters)
- [Batch 4: Metrics Accuracy, Overlap Slider Clamping, & Reliability](#batch-4-metrics-accuracy-overlap-slider-clamping--reliability)
- [Batch 5: UX/DX Polish, Bundle Optimization, Dead Code Removal & CI/CD](#batch-5-uxdx-polish-bundle-optimization-dead-code-removal--cicd)

---

## Batch 1: Core Test Infrastructure & Strict Assertions
- **Issue IDs:** ISS-06, ISS-12
- **Goal:** Establish a safety net of rigorous tests across all chunkers, tokenizers, metrics, and code exporters before algorithm refactoring. Add `npm run typecheck` script.
- **Files Modified:**
  - `package.json`: Added `"typecheck": "tsc -b"` script.
  - `src/engine/chunkers/__tests__/chunkers.test.ts`: Added tests for `cl100k_base`, `truncateByTokens`, token sliding window, overlap safety bounds, orphan detection, empty string resilience, and fixed relaxed assertion from 100 to 80 chars.
  - `src/exporters/__tests__/codeExporters.test.ts`: Added unit tests for Python LangChain, Python LlamaIndex, TypeScript LangChain.js, and Native Python.
- **Verification:**
  - Ran `npm run test` (19 passed across 2 test files).
  - Ran `npm run typecheck` (passed with 0 errors).
  - Ran `npm run build` (passed).
- **Git Commit:** `3ba7d58`

---

## Batch 2: Chunker Algorithm Bug Fixes & Code Fence Protection
- **Issue IDs:** ISS-04, ISS-05
- **Goal:** Protect Markdown code fences from being broken in half; implement true paragraph overlap in Markdown chunker; enforce `chunkSize` limits on oversized sentences in Sentence chunker; honor token units during recursive chunker hard slicing; centralize text and token slicing in `utils.ts`.
- **Files Modified:**
  - `src/engine/chunkers/utils.ts`: Created shared helper module providing `createLengthFn`, `findChunkIndices` (with cursor tracking to prevent repeat-text index conflicts), `detectOrphan`, and `splitOversizedText` (supporting both token and character modes).
  - `src/engine/chunkers/recursiveChunker.ts`: Rewrote to use `utils.ts`, honor token units during hard slicing, calculate true character overlap, and track search cursors.
  - `src/engine/chunkers/markdownChunker.ts`: Rewrote parser to preserve fenced code blocks atomically through blank lines; dynamically close and reopen code fences if an individual code block strictly exceeds `chunkSize`; implement genuine paragraph overlap; track search cursors.
  - `src/engine/chunkers/sentenceChunker.ts`: Subdivide sentences exceeding `chunkSize` using `splitOversizedText`; treat newline blocks as sentence boundaries; track search cursors.
  - `src/engine/chunkers/fixedChunker.ts`: Added token-mode character offset mapping via `findChunkIndices`, `detectOrphan`, and true overlap measurement.
  - `src/engine/chunkers/__tests__/chunkers.test.ts`: Added tests for Markdown code fence protection with blank lines, oversized code block fence enclosure, sentence chunker oversized sentence enforcement, and recursive chunker token-unit constraints.
- **Verification:**
  - Ran `npm run test` (24 passed across 2 test files).
  - Ran `npm run typecheck` (passed with 0 errors).
  - Ran `npm run build` (passed).
- **Git Commit:** `1d01a2a`

---

## Batch 3: Strategy-Aware Production Code Exporters
- **Issue IDs:** ISS-03
- **Goal:** Update `src/exporters/codeExporters.ts` to generate code specifically tailored to the active strategy (Markdown, Sentence, Fixed, Recursive) across all 4 frameworks.
- **Files Modified:**
  - `src/exporters/codeExporters.ts`: Implemented strategy-tailored templates:
    - LangChain Python: `MarkdownHeaderTextSplitter` + `RecursiveCharacterTextSplitter` for markdown, sentence-delimiter splitter for sentence, `CharacterTextSplitter` for fixed, `RecursiveCharacterTextSplitter` for recursive.
    - LlamaIndex Python: `MarkdownNodeParser` for markdown, `TokenTextSplitter` for fixed, `SentenceSplitter` for sentence/recursive.
    - LangChain.js: `MarkdownHeaderTextSplitter` for markdown, sentence/recursive splitters.
    - Native Python: Standalone header-aware markdown chunker, grammatical sentence chunker, and sliding window chunker.
  - `src/exporters/__tests__/codeExporters.test.ts`: Added unit tests verifying generated code templates across all 4 frameworks and 4 strategies (12 tests total).
- **Verification:**
  - Ran `npm run test` (31 passed across 2 test files).
  - Ran `npm run typecheck` (passed with 0 errors).
  - Ran `npm run build` (passed).
- **Git Commit:** `2655564`

---

## Batch 4: Metrics Accuracy, Overlap Slider Clamping, & Reliability
- **Issue IDs:** ISS-01, ISS-02
- **Goal:** Enforce automatic overlap clamping on chunk size change to eliminate `chunkOverlap > chunkSize` desyncs; add file size limits (10MB) and `reader.onerror` error handling; calculate total chunk tokens (RAG ingestion volume) alongside raw document tokens; compute vector cost accurately from total ingested chunk tokens.
- **Files Modified:**
  - `src/engine/types.ts`: Added `totalChunkTokens: number` to `ChunkingResult`.
  - `src/engine/chunkers/index.ts`: Computed `totalChunkTokens` and calculated `estimatedCostUsd` based on actual ingested tokens.
  - `src/components/MetricsBar.tsx`: Displayed Ingested Tokens (with Source Doc tokens tooltip) and updated cost calculation.
  - `src/components/ControlsPanel.tsx`: Added automatic clamping to chunk size and overlap sliders; added 10MB file upload guard and `reader.onerror` handler.
  - `src/engine/chunkers/__tests__/chunkers.test.ts`: Added assertions verifying `totalChunkTokens` and cost calculation.
- **Verification:**
  - Ran `npm run test` (31 passed across 2 test files).
  - Ran `npm run typecheck` (passed with 0 errors).
  - Ran `npm run build` (passed).
- **Git Commit:** `54e6e3b`

---

## Batch 5: UX/DX Polish, Bundle Optimization, Dead Code Removal & CI/CD
- **Issue IDs:** ISS-07, ISS-08, ISS-09, ISS-10, ISS-11, ISS-12
- **Goal:** Polish continuous stream view to highlight overlaps with `.overlap-highlight` and eliminate text repetition; expand Variant B in Comparison View with complete unit, overlap, and encoding controls; optimize Vite build with Rollup manualChunks code-splitting to bring main JS chunk down from 5.8MB to 77.5KB; wire `clsx` and `tailwind-merge` into shared `cn()` helper and remove dead `keepSeparators`; align `README.md` docs with code and add GitHub Actions CI workflow.
- **Files Modified:**
  - `src/utils/cn.ts`: Created shared `cn()` helper utilizing `clsx` and `tailwind-merge`.
  - `src/engine/types.ts`: Removed dead `keepSeparators` interface field.
  - `src/components/VisualCanvas.tsx`: Rendered stream view with boundary pills, chunk text, and `.overlap-highlight` highlighting for overlapping prefixes.
  - `src/components/ComparisonView.tsx`: Added unit toggle ('tokens' vs 'characters'), overlap slider/input, and encoding selector to Variant B.
  - `src/components/Header.tsx`, `src/components/ControlsPanel.tsx`, `src/components/ExportModal.tsx`, `src/App.tsx`: Refactored class name concatenation to `cn()`.
  - `vite.config.ts`: Added Rollup `manualChunks` splitting (`vendor-react`, `vendor-icons`, `tokenizer-tiktoken`), reducing main bundle size to 77.5 kB.
  - `.github/workflows/ci.yml`: Created automated GitHub Actions CI workflow running typecheck, unit tests, and production build on push/PR.
  - `README.md`: Corrected supported document types (MD/TXT/Code), documented `npm run typecheck`, clarified client-side zero-leakage privacy guarantee, and added CI section.
- **Verification:**
  - Ran `npm run test` (31 passed across 2 test files).
  - Ran `npm run typecheck` (passed with 0 errors).
  - Ran `npm run build` (passed in 4.10s, main chunk 77.5 kB, zero chunk size warnings).
- **Git Commit:** `71c7584`
