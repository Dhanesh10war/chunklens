# 🔍 ChunkLens

> **Visual Document Chunking & Token Optimization Workbench for RAG Pipelines**  
> *100% In-Browser • Zero Server Calls • Privacy Guaranteed • Open Source (MIT)*

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)
[![Zero Backend](https://img.shields.io/badge/Backend-$0%20(Client--Side)-emerald.svg)](#privacy--architecture)

Retrieval-Augmented Generation (RAG) applications live and die by document chunking quality. If chunks are too small, crucial context is cut in half. If chunks are too large, vector recall precision drops and token bills skyrocket.

**ChunkLens** is an open-source visual interactive playground that lets AI engineers test, visualize, and benchmark document chunking strategies in real time with exact BPE token counting—directly in the browser.

---

## ✨ Features

- **4 Production Chunking Algorithms:**
  - 🔄 **Recursive Character:** Delimiter-based splitting mirroring LangChain's `RecursiveCharacterTextSplitter`.
  - 📑 **Markdown AST (Header-Aware):** Preserves header hierarchies and protects code fences (` ``` `) from being broken in half.
  - 🎯 **Sentence Boundary:** Grammatical boundary splitting mirroring LlamaIndex's `SentenceSplitter`.
  - 🪟 **Fixed Window:** Exact character or token sliding windows with custom overlap.
- **⚡ Exact BPE Token Calculation:**
  - Powered by `js-tiktoken` running OpenAI's tokenizers (`o200k_base` for GPT-4o, `cl100k_base` for GPT-4).
- **📄 Client-Side PDF Ingestion:**
  - Directly upload `.pdf` documents with automated page boundary detection (`--- Page X ---`) running 100% in-browser with zero server transmission.
- **🎨 Interactive Visual Canvas:**
  - Distinctive color-coded chunk cards with token badges, character offsets, and mid-word truncation warning alerts.
  - Continuous highlighted document stream view for spotting chunk boundary cuts.
- **⚖️ Side-by-Side Strategy Comparison:**
  - Benchmark two chunking algorithms simultaneously on the same text to evaluate chunk counts, average token density, and semantic coherence.
- **🚀 One-Click Code Exporter:**
  - Instantly generates production-ready code in **Python (LangChain)**, **Python (LlamaIndex)**, **TypeScript (LangChain.js)**, and **Native Python** (zero external dependencies).
- **🔒 100% Client-Side Privacy:**
  - All text parsing, chunking, and tokenization executes entirely within your browser thread. Zero bytes ever leave your machine.

---

## 🚀 Quickstart & Development

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

# 3. Launch development server
npm run dev
```
Open your browser at `http://localhost:5173`.

### Run Test Suite & Type Check
```bash
# Run unit tests
npm run test

# Run strict TypeScript type check
npm run typecheck
```

### Production Build
```bash
npm run build
```
Outputs optimized static assets into `dist/` with automated vendor code-splitting, ready to be hosted for free on Cloudflare Pages, GitHub Pages, or Vercel.

---

## 🏗️ Architecture

```
                    ┌────────────────────────┐
                    │  User Browser Runtime  │
                    └───────────┬────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌──────────────┐      ┌──────────────────┐      ┌──────────────┐
│ Text Parsers │ ───► │  Chunking Engine │ ───► │  BPE Token   │
│ (MD/TXT/Code)│      │(Recursive/MD/Sent│      │ (js-tiktoken)│
└──────────────┘      └──────────────────┘      └──────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │ Visual Canvas & Export │
                    └────────────────────────┘
```

---

## 📦 Zero-Cost Deployment Plan

ChunkLens is designed to run indefinitely on permanent $0 free-tier infrastructure:
- **Hosting:** Cloudflare Pages, Vercel, or GitHub Pages (Free static hosting)
- **SSL / CDN:** Global Edge CDN
- **Compute:** 100% Client-side browser thread
- **Privacy:** Zero server calls, zero document content transmission, zero cookies

---

## 🚦 Continuous Integration

Every commit is validated via GitHub Actions CI:
- Strict TypeScript type-checking (`tsc -b`)
- Unit test suite execution (`vitest run`)
- Production build validation (`vite build`)

---

## 🗺️ Roadmap

- [x] v0.1: 4 core chunking algorithms, interactive visual canvas, tiktoken integration, and code export.
- [ ] v0.2: Local embedding generation & cosine similarity heatmaps using Transformers.js (`all-MiniLM-L6-v2`).
- [ ] v0.3: Direct CSV/JSON tabular dataset chunking with schema preservation.
- [ ] v0.4: CLI tool (`npx chunklens test ./docs`) for CI/CD RAG regression testing on GitHub Actions.

---

## 📄 License

Licensed under the [MIT License](./LICENSE). Created by [Dhaneshwar](https://github.com/Dhanesh10war).
