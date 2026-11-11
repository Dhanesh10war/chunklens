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
- **Git Commit:** Pending.
