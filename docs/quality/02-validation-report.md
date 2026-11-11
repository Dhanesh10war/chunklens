# Validation Report
**Project:** ChunkLens — Visual Document Chunking & Token Optimization Workbench for RAG Pipelines  
**Version:** v0.1.0 (MVP)  
**Date:** November 2026  
**Status:** Completed  

---

## 1. Tooling & Build Execution Log

The following commands were executed in the repository root (`/home/drago/projects/Venture/chunklens`):

| Check | Command Executed | Exit Code | Result Summary |
| :--- | :--- | :--- | :--- |
| **Install / Dependency Audit** | Inspection of `package.json`, `package-lock.json`, and `node_modules` | 0 | All dependencies installed locally. Notice: `clsx` and `tailwind-merge` installed but unused. |
| **Type-Check** | `npx tsc -b` | 0 | Strict TypeScript 5.6 passed with 0 diagnostic errors. |
| **Lint** | Not configured in `package.json`. No `eslint` installed in `devDependencies`. | N/A | Missing lint script/configuration in project. |
| **Unit Tests** | `npm run test` (`vitest run`) | 0 | 1 test file passed (`6 passed, 0 failed` in 2.04s). However, test assertions were found to be loose (e.g. relaxing 80 char limit to 100 in recursive chunker). |
| **Production Build** | `npm run build` (`tsc -b && vite build`) | 0 | Build succeeded in 3.59s. Emitted `dist/index.html` (1.50 kB), `dist/assets/index-Du3jSXry.css` (21.78 kB), and `dist/assets/index-D2ZVNG2K.js` (5,799.82 kB). Emitted Vite warning: bundle exceeds 500 kB limit due to monolithic `js-tiktoken` dictionary import. |

---

## 2. Requirement Traceability Matrix

Status Key:
- ✅ **Implemented & verified** (Works as expected with verified test / code evidence)
- 🟡 **Partial** (Partially implemented; missing features or edge cases)
- ❌ **Missing** (Claimed in PRD/README/UI but missing from code)
- ⚠️ **Implemented but untested** (Code exists but has zero automated test coverage)
- 🔀 **Deviates from PRD** (Behavior conflicts with specifications or produces incorrect output)

| ID | Requirement | Status | Evidence (Files, Functions, Tests) | Findings & Notes |
| :--- | :--- | :---: | :--- | :--- |
| **REQ-01** | Recursive Character Chunker | 🟡 Partial / 🔀 Deviates | `src/engine/chunkers/recursiveChunker.ts` (`chunkRecursive`), `src/engine/chunkers/__tests__/chunkers.test.ts:41` | When `unit === 'tokens'`, fallback hard slice (`line 78`) slices by *character index* (`piece.slice(...)`), confusing characters with tokens. Overlap loop logic in lines 58-66 causes overlap to drop to 0 if a piece is moderately large. |
| **REQ-02** | Markdown AST Chunker | 🔀 Deviates | `src/engine/chunkers/markdownChunker.ts` (`chunkMarkdown`), `src/engine/chunkers/__tests__/chunkers.test.ts:61` | 1) Code fence protection fails if code block contains blank lines or exceeds chunkSize: splits right through ` ``` ` fences. 2) Paragraph splitting does NOT implement overlap; `overlapPrevChars` is falsely hardcoded to `chunkOverlap`. 3) Uses `indexOf(chunkStr)` without offset, misidentifying positions for duplicate text. |
| **REQ-03** | Sentence Boundary Chunker | 🟡 Partial | `src/engine/chunkers/sentenceChunker.ts` (`chunkSentence`), `src/engine/chunkers/__tests__/chunkers.test.ts:81` | Sentences that exceed `chunkSize` are never split and exceed the configured limit (e.g. 113 chars emitted when limit is 30). Does not split unpunctuated multi-line text (e.g. lists). `text.indexOf(chunkText)` repeats index 0 on duplicate sentences. |
| **REQ-04** | Fixed Window Chunker | ✅ Implemented & verified | `src/engine/chunkers/fixedChunker.ts` (`chunkFixed`), `src/engine/chunkers/__tests__/chunkers.test.ts:24` | Character sliding window and token sliding window work as expected. Handles step calculation safely (`Math.max(1, chunkSize - safeOverlap)`). In token mode, `startCharIndex` is `-1` and `overlapPrevChars` displays token count under char label. |
| **REQ-05** | Exact BPE Token Counting | ✅ Implemented & verified | `src/engine/tokenizers/tokenizer.ts` (`countTokens`, `getTokenizer`), `src/engine/chunkers/__tests__/chunkers.test.ts:12` | Accurately interfaces `js-tiktoken` with caching for `o200k_base` and `cl100k_base`. Verified via tests and scratch verification script. |
| **REQ-06** | Dual Unit Measurement (Tokens vs Chars) | 🟡 Partial | `src/components/ControlsPanel.tsx`, `src/engine/chunkers/` | Sliders adjust values on toggle, but `recursiveChunker` and `markdownChunker` confuse character slicing with token slicing when subdividing oversized pieces. |
| **REQ-07** | Interactive Visual Canvas (Cards & Stream) | 🟡 Partial | `src/components/VisualCanvas.tsx` | Chunk Cards view works cleanly with copy, badges, and inspector. Continuous Stream view renders overlapping chunks consecutively without deduplication or boundary overlap highlighting, causing overlapping text to duplicate on screen. |
| **REQ-08** | Chunk Boundary Inspection & Alerts | ✅ Implemented & verified | `src/components/VisualCanvas.tsx`, `src/components/MetricsBar.tsx` | Mid-word cut alert badge (`isOrphan`) renders correctly. Large chunk alert (`> 1,024 tokens`) shows up in MetricsBar. |
| **REQ-09** | Side-by-Side Strategy Comparison | 🟡 Partial | `src/components/ComparisonView.tsx` | Successfully renders split view comparing Variant A and Variant B. However, Variant B only allows toggling strategy and size; unit and overlap are locked to tokens and 60 respectively, which causes misleading comparison if Variant A is set to characters. |
| **REQ-10** | Production Code Exporter | 🔀 Deviates | `src/exporters/codeExporters.ts`, `src/components/ExportModal.tsx` | **Major deviation:** Ignores `config.strategy` completely! LangChain Python always exports `RecursiveCharacterTextSplitter`, LlamaIndex always exports `SentenceSplitter`, even when user selects Markdown AST or Fixed Window. |
| **REQ-11** | Real-Time Metrics Bar | 🟡 Partial | `src/components/MetricsBar.tsx`, `src/engine/chunkers/index.ts` | Displays chunks count, avg tokens, min/max, latency, and cost. However, embedding cost and total tokens are computed from raw document text tokens rather than total chunk tokens (including overlap), underreporting true RAG embedding volume. |
| **REQ-12** | Sample Document Library | ✅ Implemented & verified | `src/data/samples.ts`, `src/components/ControlsPanel.tsx` | 4 rich domain samples (Technical API, Legal, Financial, Research) are available, switch seamlessly, and populate the editor. |
| **REQ-13** | Custom Document Upload & Raw Editing | 🟡 Partial | `src/components/ControlsPanel.tsx`, `src/App.tsx` | File upload and raw textarea work for supported text formats. However, missing file error handling (e.g. `FileReader.onerror`), missing file size ceiling, and no warning if user uploads binary files. |
| **REQ-14** | Zero Server Calls & Privacy Guarantee | ✅ Implemented & verified | Entire application | 100% client-side execution confirmed. Zero fetch/XHR calls made outside browser. |
| **REQ-15** | Edge Case Resilience | 🟡 Partial | `src/engine/chunkers/` | Handles empty/whitespace text cleanly. However, `chunkOverlap >= chunkSize` desyncs slider states, and sentences/words longer than `chunkSize` can break chunk boundary guarantees. |
| **REQ-16** | Test Suite & Static Analysis | 🟡 Partial | `src/engine/chunkers/__tests__/chunkers.test.ts` | 6 tests exist, but test suite does not test `codeExporters.ts`, `ComparisonView`, token-unit modes, edge cases (empty strings, overlap >= size, code fence split). |

---

## 3. Inverse Analysis (Scope Creep, Dead Code, Unused Dependencies)

1. **Unused Dependencies (`clsx`, `tailwind-merge`):**
   - Both packages are in `package.json` dependencies (`"clsx": "^2.1.1"`, `"tailwind-merge": "^2.5.5"`), but grep confirms neither is imported in any `.ts`, `.tsx`, or `.js` file across `src/`.
2. **Dead Function (`truncateByTokens`):**
   - `src/engine/tokenizers/tokenizer.ts:42` implements `truncateByTokens`, but it is never imported or called in any chunker or component.
3. **Dead Interface Property (`keepSeparators`):**
   - `src/engine/types.ts:28` declares `keepSeparators?: boolean`, but no chunker or UI component uses or implements it.
4. **Dead CSS Rule (`.overlap-highlight`):**
   - `src/index.css:55` defines `.overlap-highlight` with amber background and dashed border, but it is never attached to any element in `VisualCanvas.tsx`.
5. **Ghost Feature in Architecture Diagram (`PDF Parser`):**
   - `README.md:81` claims `Text Parsers (MD/TXT/PDF)`, but no PDF parsing library (e.g. `pdfjs-dist`) exists in dependencies, and `ControlsPanel.tsx` does not accept `.pdf`.
6. **Ghost Feature in Documentation (`Umami Telemetry`):**
   - `README.md:99` claims anonymous telemetry via Umami Cloud, but no tracking script or integration exists in `index.html` or code.

---

## 4. Critical User Journeys End-to-End Verification

### Journey 1: Select Sample & Adjust Sizing (PASS WITH MINOR ISSUES)
- **Flow:** User opens app -> selects "Legal Contract" -> moves Chunk Size to 600 tokens -> adjusts Overlap to 100 tokens.
- **Result:** Chunks recompute reactively. Cards render with token counts.
- **Issue:** If user lowers chunk size below current overlap, overlap slider max moves down but state retains old overlap, causing `chunkOverlap > chunkSize`.

### Journey 2: Test Markdown Chunking with Code Blocks (BROKEN FLOW)
- **Flow:** User selects "Developer API Reference & Code" sample -> switches Algorithm to "Markdown AST" -> lowers Chunk Size to 200 tokens.
- **Result:** The Python code block in "Upsert Operations" is split in half across two chunks. Chunk 1 ends with `payload = { "records": [`, and Chunk 2 starts with `{"id": str(i)`. Both chunks contain unclosed/unmatched ` ``` ` fences.
- **PRD Conflict:** Fails requirement to keep fenced code blocks intact without mid-code splits.

### Journey 3: Side-by-Side Comparison (PARTIALLY DEGRADED)
- **Flow:** User clicks "Compare" -> left shows Variant A (Fixed Window, 1,000 Chars) -> right shows Variant B.
- **Result:** Variant B is locked to `unit: 'tokens'`. Comparing 1,000 characters against 600 tokens is asymmetrical and confusing because Variant B has no unit selector or overlap selector.

### Journey 4: Export Production Code (BROKEN FLOW)
- **Flow:** User configures Markdown AST chunking -> clicks "Export Code" -> selects "LangChain (Python)".
- **Result:** The modal presents `RecursiveCharacterTextSplitter`. No Markdown header splitting code is generated. If user runs this code in production, it will not perform Markdown AST chunking.

### Journey 5: Upload File & Edit Raw Text (PASS WITH EDGE RISKS)
- **Flow:** User switches to "Edit Raw Text" tab -> edits text -> switches back to "Chunks" tab.
- **Result:** Reactive updates work seamlessly.
- **Issue:** No file size guard on upload; uploading very large files synchronously freezes browser thread.

---

## 5. Consistency Matrix (Docs vs Config vs Code)

| Item | Documented (README / Docs) | Configured (`package.json`, etc.) | Actual Code Implementation | Status |
| :--- | :--- | :--- | :--- | :--- |
| **PDF Parsing** | Claimed in Architecture diagram (`MD/TXT/PDF`) | Not in `package.json` | Not supported (accepts `.txt,.md,.json,.csv,.py,.js,.ts`) | ❌ Inconsistent |
| **Telemetry** | Claimed Umami Cloud in Zero-Cost Deployment | Not in `package.json` | Not present in `index.html` or source | ❌ Inconsistent |
| **Code Exporter** | "Instantly generates production-ready code in Python (LangChain)..." | N/A | Hardcoded to RecursiveSplitter; ignores strategy | 🔀 Inconsistent |
| **Scripts** | Mentions `npm run test`, `npm run dev`, `npm run build` | Scripts match README | Missing `lint` and `typecheck` standalone scripts | 🟡 Minor gap |
| **Dependencies** | Not mentioned | `clsx` and `tailwind-merge` installed | Completely unused in source code | ⚠️ Dead dependency |
| **Code Fence Protection** | "protects code fences from being broken in half" | N/A | Breaks code fences if block contains blank lines or exceeds size | 🔀 Broken contract |
