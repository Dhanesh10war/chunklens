# Engineering & Product Recommendations
**Project:** ChunkLens — Visual Document Chunking & Token Optimization Workbench for RAG Pipelines  
**Version:** v0.1.1  
**Author:** Principal Engineer & QA Lead  
**Date:** November 2026  

---

## 1. Out-of-Scope Opportunities & Future Enhancements

The following architectural and product enhancements were identified during validation as highly valuable, but intentionally kept out-of-scope for v0.1.1 to preserve the strict PRD baseline:

### 1. In-Browser Local Embeddings & Cosine Heatmaps (Roadmap v0.2)
- **Concept:** Integrate `@xenova/transformers` (Transformers.js) running `all-MiniLM-L6-v2` or `bge-small-en-v1.5` completely client-side via ONNX Runtime Web.
- **Value:** Generate actual 384-dimensional dense vectors for each chunk and compute an interactive pairwise Cosine Similarity Matrix / Heatmap. AI engineers can instantly spot semantic cliffs, orphaned paragraphs, and repetitive context.
- **Estimated Effort:** Medium (2–3 engineering days).

### 2. Client-Side PDF Parsing Support
- **Concept:** Add `pdfjs-dist` (or `unpdf`) to parse uploaded `.pdf` documents directly in the browser thread.
- **Value:** Technical papers, 10-K financial reports, and legal agreements are predominantly distributed as PDFs. Allowing drag-and-drop PDF ingestion without sending documents to an external extraction server strongly aligns with ChunkLens' privacy promise.
- **Estimated Effort:** Small (1 engineering day).

### 3. Direct CSV & JSON Tabular Chunking (Roadmap v0.3)
- **Concept:** Dedicated table chunker that parses CSV and JSON rows, retains table header schemas at the top of every chunk, and groups rows dynamically up to `chunkSize`.
- **Value:** Tabular RAG ingestion is notoriously error-prone when standard text splitters split headers away from data rows.
- **Estimated Effort:** Medium (2 engineering days).

### 4. ChunkLens Headless CLI (`npx chunklens test`) (Roadmap v0.4)
- **Concept:** A standalone CLI package distributed via npm (`npx chunklens test ./docs --strategy=markdown --max-tokens=500`).
- **Value:** Allows RAG teams to add regression tests in GitHub Actions CI to assert that documentation changes do not cause chunk boundary anomalies or token blowouts before merging to production.
- **Estimated Effort:** Medium (3 engineering days).

### 5. Multi-Model Tokenizer Expansion
- **Concept:** Add Anthropic Claude (via `@anthropic-ai/tokenizer` or tiktoken cl100k approximation) and Meta Llama-3 (`llama-tokenizer-js`) tokenizers.
- **Value:** Enables engineers building multi-provider RAG pipelines to compare token counts across OpenAI, Anthropic, and open-source models side by side.

---

## 2. Technical Debt Identified & Mitigation Strategy

| Tech Debt Item | Root Cause | Impact | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Main-Thread Tokenization on Massive Docs** | `js-tiktoken` runs synchronously on the browser UI thread inside React `useMemo`. | Documents > 200,000 characters could briefly stutter slider interactions during rapid dragging. | Move chunking and token counting into an asynchronous Web Worker (`chunker.worker.ts`) via `Comlink` or native `postMessage`. |
| **In-Memory State Reset on Page Refresh** | Active text and configuration are stored purely in React state. | Accidental page reload or navigation loses uploaded custom text and custom slider adjustments. | Add non-intrusive `localStorage` persistence with a "Reset to Defaults" button. |
| **Custom Separator Input Control** | `separators` array is supported in engine types and `recursiveChunker.ts`, but no UI control exists in `ControlsPanel.tsx`. | Users cannot test custom delimiters (e.g. `\n### `, `\n- `) without code editing. | Add an expandable "Advanced Settings" accordion in `ControlsPanel.tsx` with a tag-input for custom separators. |

---

## 3. Next Steps & Release Checklist
1. **Deploy v0.1.1 to Production:** Deploy static assets in `dist/` to Cloudflare Pages or Vercel.
2. **Community Announcement:** Share the open-source workbench with AI engineer communities, emphasizing 100% in-browser privacy and exact GPT-4o BPE token counts.
3. **Initiate v0.2 Planning:** Prototype ONNX Web embedding generation with Transformers.js.
