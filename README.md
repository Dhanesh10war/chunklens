# 🔍 ChunkLens

> **Enterprise Document Chunking, Tokenizer Comparison & Optimization Workbench for RAG Pipelines**  
> *100% Client-Side • Zero Server Egress • Multi-Model BPE Analysis • Open Source (MIT)*

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)
[![Zero Backend](https://img.shields.io/badge/Backend-$0%20(Client--Side)-emerald.svg)](#100-client-side-privacy-guarantee)
[![Tests Passing](https://img.shields.io/badge/Tests-86%2F86%20Passing-success.svg)](https://vitest.dev/)
[![WCAG 2.2 AA](https://img.shields.io/badge/Accessibility-WCAG%202.2%20AA-blue.svg)](#design-system--accessibility)

---

## 📖 Overview

Retrieval-Augmented Generation (RAG) applications live and die by document chunking quality:
- **Chunks too small:** Crucial context is amputated, destroying retrieval coherence.
- **Chunks too large:** Vector search precision drops, and token bills explode.
- **Wrong strategy:** Tabular data loses its column headers, markdown headers lose their sections, and code blocks break mid-syntax.

**ChunkLens** is an open-source visual interactive developer workbench that allows AI and ML engineers to test, visualize, benchmark, and optimize document chunking strategies in real time with exact BPE token calculations, multi-model token variance analysis, and boundary continuity diagnostics—entirely in the browser.

---

## ✨ Key Features

### 1. 5 Production Chunking Algorithms
- 🔄 **Recursive Character (LangChain):** Hierarchical boundary recursion across paragraphs (`\n\n`), lines (`\n`), sentences (`. `), and words.
- 📑 **Markdown Header (Hierarchical AST):** Preserves H1–H6 header paths, section breadcrumbs, and protects fenced code blocks (` ``` `).
- 📊 **Tabular CSV & JSON (Schema-Preserving):** Partitions tabular rows and JSON records while automatically prepending schema column definitions to every chunk to preserve retrieval context.
- 🎯 **Sentence Boundary (LlamaIndex):** Grammatical punctuation-aware boundary splitting with strict overlap retention.
- 🪟 **Fixed-Size Sliding Window:** Strict character or token sliding windows with custom overlap.

### 2. Auto File Format Recognition & Content Sniffing
- **Intelligent Ingestion:** Combines binary magic bytes (`%PDF-`), file extensions, and deep content heuristics to automatically identify uploaded documents.
- **Supported Formats:** PDF (`.pdf`), Markdown (`.md`), Tabular CSV (`.csv`), TSV (`.tsv`), JSON Datasets (`.json`), JSON Lines (`.jsonl`), Source Code (`.py`, `.ts`, `.js`, `.go`, `.sql`), and Plain Text.
- **Auto Strategy Alignment:** Uploading a CSV or JSON file automatically switches the workbench to **Tabular Record Chunking**; uploading Markdown aligns to **Markdown Header Splitting**.
- **Drag & Drop:** Drag files directly onto the canvas or sidebar with live drag-target feedback.

### 3. Multi-Model Tokenizer Matrix & Embedding Cost Analyzer
- **Multi-Model Comparison:** Compares token counts, density ratios, and expansion variances across 6 frontier LLM tokenizer families:
  - **OpenAI GPT-4o (`o200k_base`):** 200k vocabulary
  - **OpenAI GPT-4 / GPT-3.5 (`cl100k_base`):** 100k vocabulary
  - **Anthropic Claude 3.5 Sonnet:** BPE character calibration
  - **Meta Llama 3 8B / 70B:** 128k BPE vocabulary
  - **Google Gemini 1.5 Flash:** SentencePiece calibration
  - **Mistral Large / Codestral:** 32k Byte-Fallback BPE
- **Embedding Cost Analyzer:** Estimates real-time vector pipeline costs across OpenAI (`text-embedding-3-small`, `text-embedding-3-large`), Cohere Embed v3, and Voyage AI.

### 4. Semantic Similarity Heatmap & Continuity Matrix
- **$N \times N$ Pairwise Matrix:** Computes an interactive cosine similarity matrix directly in-browser using L2-normalized TF-IDF vectorization.
- **Boundary Continuity Scoring:** Assesses semantic transition smoothness between neighboring chunks.
- **Redundancy Detection:** Highlights duplicate or overly redundant chunk pairs (>70% overlap) with shared key terms extraction.

### 5. Pro Tool Inspector & Delimiter Diagnostics
- **320px Collapsible Inspector:** Appears on chunk selection to display exact start/end offsets, density ratios (ch/tok), and neighbor overlap context.
- **Boundary Reason Diagnostics:** Analyzes the exact delimiter or constraint that caused the chunk cut (e.g. `Double Linebreak (\n\n)`, `Sentence Terminator`, `Whitespace`, or `Length Limit`).
- **Orphan Warning Alert:** Warns if a word was severed mid-token by hard limits.

### 6. Interactive Visual Canvas
- **Continuous Reading Column:** Primary hero view ($\ge 70\%$ viewport height) with 8-hue OKLCH chunk color bands and diagonal-hatch overlap ribbons labeled `▨▨ ~X ch overlap with Chunk #Y`.
- **Separated Cards Mode:** Secondary card layout with neutral hairline borders and color-coded left edges.
- **A/B Side-by-Side Comparison:** Compare two chunking configurations side-by-side on the same document.

### 7. One-Click Production Code & Dataset Exporter
Generates copy-pasteable, production-ready code mirroring your exact in-browser parameters:
- **Python (LangChain):** `RecursiveCharacterTextSplitter`, `MarkdownHeaderTextSplitter`
- **Python (LlamaIndex):** `SentenceSplitter`, `TokenTextSplitter`
- **TypeScript (LangChain.js):** Browser and Node.js compatible
- **Native Python:** Zero external dependencies
- **Dataset Export:** Download chunks as JSON or RFC 4180 CSV with token counts, character offsets, and metadata.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `⌘K` / `Ctrl+K` | Open Command Palette (quick search strategies, corpora, views) |
| `[` | Toggle Left Configuration Sidebar |
| `]` | Toggle Right Chunk Inspector |
| `J` / `ArrowRight` | Step to next chunk |
| `K` / `ArrowLeft` | Step to previous chunk |
| `C` | Copy selected chunk text |
| `Esc` | Clear chunk selection / Dismiss dialogs |

---

## 🔒 100% Client-Side Privacy Guarantee

- **Zero Network Egress:** All text parsing, BPE tokenization, and vector similarity calculations execute 100% within your local browser runtime.
- **Isolated PDF Parsing:** Client-side Web Worker parses PDF documents locally without external service calls.
- **Cloned Buffer Protection:** Prevents memory leakage and buffer detachment during file decoding.
- **Zero Cookies / Zero Telemetry:** Works completely offline once loaded.

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.0
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

### Verification & Testing
```bash
# Run unit test battery (86 tests across 12 test suites)
npm run test

# Run strict TypeScript type check
npm run typecheck

# Production build with automated vendor chunk splitting
npm run build
```

---

## 📐 Architecture & Technology Stack

```
┌──────────────────────────────────────────────────────────────┐
│                    Client Browser Runtime                    │
├──────────────────────────────┬───────────────────────────────┤
│ UI Framework                 │ React 18 + TypeScript + Vite  │
│ Design Tokens                │ Tailwind CSS + OKLCH Theme    │
│ Icons & Feedback             │ Lucide Icons + Native Toasts  │
├──────────────────────────────┼───────────────────────────────┤
│ Off-Thread Processing        │ Background Web Worker         │
│ Tokenization Engine          │ js-tiktoken (BPE o200k/cl100k)│
│ Similarity & Vectorizer      │ In-Memory TF-IDF + Cosine Sim │
│ PDF Extraction               │ pdfjs-dist (Isolated Worker)  │
│ Format Sniffer               │ Magic Bytes & Content Parser  │
└──────────────────────────────┴───────────────────────────────┘
```

---

## 📄 License

Licensed under the [MIT License](./LICENSE). Created by [Dhaneshwar](https://github.com/Dhanesh10war).
