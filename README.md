# 🔍 ChunkLens

> **Client-side document chunking, token cost workbench, and interactive RAG academy**  
> *100% Client-Side • Zero Document Egress • 29 Interactive Lessons • 433 Verified Invariants • [Live Demo](https://chunklensdev.vercel.app)*

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)
[![Live Demo](https://img.shields.io/badge/Demo-chunklensdev.vercel.app-emerald.svg)](https://chunklensdev.vercel.app)
[![Zero Document Egress](https://img.shields.io/badge/Privacy-100%25%20Client--Side-emerald.svg)](#-100-client-side-privacy-guarantee)
[![Tests Passing](https://img.shields.io/badge/Tests-433%20Passed-blue.svg)](#-verification--build)
[![WCAG 2.2 AA](https://img.shields.io/badge/Accessibility-WCAG%202.2%20AA-blue.svg)](#-architecture--design-standards)

---

![ChunkLens Workbench](docs/design/after-v0.3/loaded_1440.png)

---

## 📖 Overview

Retrieval-Augmented Generation (RAG) applications succeed or fail on the quality of their chunking pipeline:
- **Chunks too small:** Crucial context is amputated, degrading semantic retrieval coherence.
- **Chunks too large:** Vector search precision drops, and token ingestion bills escalate.
- **Wrong strategy:** Tabular data loses column headers, markdown headers lose their sections, and code blocks break mid-syntax.

**ChunkLens** is an open-source developer workbench that allows AI and ML engineers to test, inspect, benchmark, and optimize document chunking strategies in real time with exact BPE token calculations, multi-model token variance analysis, and boundary continuity diagnostics—executed entirely inside the browser.

---

## ✨ Key Features

### 1. 5 Production Chunking Algorithms
- 🔄 **Recursive Character (LangChain):** Hierarchical boundary recursion across paragraphs (`\n\n`), lines (`\n`), sentences (`. `), and words.
- 📑 **Markdown Header (Hierarchical AST):** Preserves H1–H6 header paths, section breadcrumbs, and protects fenced code blocks (` ``` `).
- 📊 **Tabular CSV & JSON (Schema-Preserving):** Partitions tabular rows and JSON records while automatically prepending schema column definitions to every chunk to preserve retrieval context.
- 🎯 **Sentence Boundary (LlamaIndex):** Grammatical punctuation-aware boundary splitting with strict overlap retention.
- 🪟 **Fixed-Size Sliding Window:** Strict character or token sliding windows with configurable overlap.

### 2. Multi-Model Tokenizer Matrix & Embedding Cost Analyzer
Compare token counts, density ratios, and variance across model families. Only the two OpenAI encodings (`o200k_base`, `cl100k_base`) are exact; other families are estimates based on their tokenization characteristics:
- **o200k_base (OpenAI):** 200,000 vocabulary (exact BPE)
- **cl100k_base (OpenAI):** 100,000 vocabulary (exact BPE)
- **Claude (estimate):** Anthropic BPE token count estimate (~65k vocabulary)
- **Gemini (estimate):** Google SentencePiece token count estimate (256k vocabulary)
- **Llama (estimate):** Meta BPE token count estimate (128k vocabulary)
- **Cohere (estimate):** Cohere BPE token count estimate (256k vocabulary)
- **Embedding Cost Analyzer:** Estimates real-time vector pipeline costs across OpenAI (`text-embedding-3-small`, `text-embedding-3-large`), Cohere Embed v3, and Voyage AI at 10k and 100k document scale.

### 3. Interactive Visual Canvas & Inspector
- **Continuous Reading Column:** Primary hero view with 8-hue OKLCH chunk color bands and diagonal-hatch overlap ribbons labeled `▨▨ ~X ch overlap with Chunk #Y`.
- **Separated Cards Mode:** Neutral hairline-bordered cards with color-coded left accents.
- **Pro Tool Inspector:** Collapsible 320px sidebar displaying exact character offsets, density ratios (ch/tok), neighbor context, cut reason diagnostics, and severed token warnings.
- **A/B Side-by-Side Comparison:** Compare two chunking configurations on the same document simultaneously.

### 4. Semantic Similarity Heatmap & Continuity Matrix
- **$N \times N$ Pairwise Matrix:** Computes an interactive cosine similarity matrix directly in-browser using L2-normalized TF-IDF vectorization.
- **Pixel-Perfect 2D Grid with 0px Drift:** Locked dual-axis sticky corner anchor (`data-testid="heatmap-corner-spacer"`) and uniform 44px column pitch ensure column headers never drift out of sync with matrix cells, even across 100+ chunks.
- **Boundary Continuity Scoring:** Assesses semantic transition smoothness between neighboring chunks with a real-time adjacent continuity sparkline.
- **Redundancy & Orphan Detection:** Flags duplicate or highly redundant chunk pairs (>70% overlap) with shared key term extraction, and isolates semantically disconnected orphan chunks.

### 5. Interactive 29-Lesson RAG Academy
- **Zero-to-Production Curriculum:** 9 structured modules (M0 to M8) covering mental models, document ingestion, tokenization physics, parent-child retrieval, hybrid search (RRF), cross-encoders, and production playbooks (legal contracts, 10-K financial filings, technical documentation).
- **Embedded Simulation Sandboxes:** Hands-on interactive widgets (`V1PipelineFlowExplorer`, `V2ChunkSandbox`) allowing learners to simulate chunking boundaries directly inside the lesson text.
- **Mastery Verification Quizzes:** Comprehensive multi-question quizzes with instant answer feedback and deep engineering rationale explanations.
- **Progress Tracking:** Local, private progress persistence across modules without requiring any user account or cloud storage.

### 6. Document Sniffing & Local Parsing
- **Intelligent Ingestion:** Combines binary magic bytes (`%PDF-`), file extensions, and deep content heuristics to automatically identify uploaded documents.
- **Supported Formats:** PDF (`.pdf`), Markdown (`.md`), Tabular CSV (`.csv`), TSV (`.tsv`), JSON Datasets (`.json`), JSON Lines (`.jsonl`), Source Code (`.py`, `.ts`, `.js`, `.go`, `.sql`), and Plain Text.
- **Auto Strategy Alignment:** Uploading a CSV or JSON file automatically switches the workbench to **Tabular Record Chunking**; uploading Markdown aligns to **Markdown Header Splitting**.

### 7. One-Click Production Code & Dataset Exporter
Generates copy-pasteable, production-ready code mirroring your exact in-browser parameters:
- **Python (LangChain):** `RecursiveCharacterTextSplitter`, `MarkdownHeaderTextSplitter`
- **Python (LlamaIndex):** `SentenceSplitter`, `TokenTextSplitter`
- **TypeScript (LangChain.js):** Browser and Node.js compatible
- **Native Python:** Zero external dependencies
- **Dataset Export:** Download chunks as JSON or RFC 4180 CSV with token counts, character offsets, and metadata.

### 8. Pro & Enterprise Ingestion Funnel
- Dedicated waitlist and custom inquiry modal for high-volume batch processing, CI/CD pipeline linters, and air-gapped enterprise self-hosting.
- Secure, non-intrusive background inquiry relay via Web3Forms, completely isolated from document processing.

---

## 🔒 100% Client-Side Privacy Guarantee

ChunkLens operates entirely within your browser runtime:
- **Zero Document Egress:** All text parsing, BPE tokenization, and vector similarity calculations execute locally in WebAssembly and Web Workers. Your documents never touch our servers.
- **Strict Content Security Policy:** Production builds enforce a strict CSP (`connect-src 'self' https://api.web3forms.com`), ensuring that document processing is completely air-gapped from network transmission (with network access restricted exclusively to the optional Pro waitlist inquiry form).
- **Isolated PDF Parsing:** Client-side Web Worker parses PDF documents locally via `pdfjs-dist` with script evaluation disabled (`isEvalSupported: false`).
- **Memory Safety:** Cloned buffer protection prevents memory leaks and detached buffer errors during binary file processing.
- **Zero Tracking:** No tracking cookies, no third-party telemetry, no external CDN font calls, and no local storage persistence of your sensitive document text.

### DevTools Privacy Verification Guide
You can independently verify the zero-egress guarantee at any time:
1. Open your browser Developer Tools (`F12` or `Cmd+Option+I` / `Ctrl+Shift+I`).
2. Switch to the **Network** tab.
3. Upload any sensitive document, change chunking strategies, or inspect token counts.
4. Verify that **zero network requests** are dispatched during parsing, chunking, or analysis.
5. In the **Console** or **Security** tab, inspect the document headers or meta tags to verify the active Content Security Policy.

---

## ⚠️ Architectural Limitations

- **Browser Heap Limits:** Because all processing runs client-side in the browser tab, extremely large files (>50 MB) or documents containing hundreds of pages may be limited by available browser memory.
- **Scanned / Rasterized PDFs:** PDF extraction extracts text streams embedded directly in the document. Scanned images or rasterized PDFs without an embedded OCR text layer will not produce text (OCR engines are excluded to maintain a lightweight, instant bundle).
- **Minimum Browser Support (PDF Engine):** Client-side PDF extraction is powered by `pdfjs-dist` v6 (`pdf.worker.min.mjs`), which relies on ECMAScript 2024 `Promise.withResolvers` in the Web Worker global scope. Minimum supported browser versions:
  - Chrome / Chromium 119+ (released October 2023)
  - Microsoft Edge 119+ (released October 2023)
  - Mozilla Firefox 121+ (released December 2023)
  - Safari 17.4+ (released March 2024)
  - Node.js 22+ for headless test environments (Node 20 is polyfilled in `src/utils/pdfParser.ts`).

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `⌘K` / `Ctrl+K` | Open Command Palette (search strategies, corpora, views) |
| `[` | Toggle Left Configuration Sidebar |
| `]` | Toggle Right Chunk Inspector |
| `J` / `ArrowRight` | Step to next chunk |
| `K` / `ArrowLeft` | Step to previous chunk |
| `C` | Copy selected chunk text |
| `Esc` | Clear chunk selection / Dismiss dialogs |

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 20.0 (or Node.js 22 LTS)
- npm >= 9.0

### Run Locally
```bash
# 1. Clone repository
git clone https://github.com/Dhanesh10war/chunklens.git
cd chunklens

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```
Visit `http://localhost:5173` in your browser.

### Verification & Build
```bash
# Run strict TypeScript type check
npm run typecheck

# Run test suite
npm test

# Production build with bundle budget checks
npm run build
```

---

## 📐 Architecture & Technology Stack

```
┌──────────────────────────────────────────────────────────────┐
│                    Client Browser Runtime                    │
├──────────────────────────────┬───────────────────────────────┤
│ Core Views                   │ Landing (/)                   │
│                              │ Workbench (/?view=app)        │
│                              │ Learn Academy (/?view=learn)  │
├──────────────────────────────┼───────────────────────────────┤
│ UI Framework                 │ React 18 + TypeScript + Vite  │
│ Design Tokens                │ Tailwind CSS + OKLCH + Serif  │
│ Icons & Feedback             │ Lucide Icons + Native Toasts  │
├──────────────────────────────┼───────────────────────────────┤
│ Off-Thread Processing        │ Background Web Worker         │
│ Tokenization Engine          │ js-tiktoken (BPE o200k/cl100k)│
│ Similarity & Vectorizer      │ In-Memory TF-IDF + Cosine Sim │
│ PDF Extraction               │ pdfjs-dist (Isolated Worker)  │
│ Format Sniffer               │ Magic Bytes & Content Parser  │
├──────────────────────────────┼───────────────────────────────┤
│ Performance & Budget         │ Main Shell: 36.57 kB (<=185kB)│
│                              │ Workbench: 116.24 kB (<=120kB)│
│                              │ Total Initial: 152.8 kB(<=165)│
│                              │ CSS Bundle: 44.16 kB (<=45kB) │
└──────────────────────────────┴───────────────────────────────┘
```

### Verification & Test Suite
```bash
# Run strict TypeScript type check (0 errors)
npm run typecheck

# Run full Vitest unit & invariant suite (433 tests passing)
npm test

# Run cross-browser Playwright compatibility quick suite (16 tests)
npm run test:compat:quick

# Run production bundle budget validation gate
npm run check:bundle

# Production build
npm run build
```

---

## 📄 License

Licensed under the [MIT License](./LICENSE). Created by [Dhaneshwar](https://github.com/Dhanesh10war).
