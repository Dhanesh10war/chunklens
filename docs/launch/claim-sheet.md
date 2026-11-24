# ChunkLens Launch Film Claim Sheet & Truth Register

> **Status:** Phase 1 Revision 2 — Awaiting User Approval  
> **Rule Enforcement:** Every spoken or on-screen claim must map to an entry in this sheet marked `VERIFIED`. Any claim marked `NOT VERIFIED as worded` or `FORBIDDEN` is strictly prohibited from appearing in the script, on-screen text, captions, or film assets.

---

## 1. Verified Claims (Safe for Film & Captions)

| ID | Claim Category | Precise Claim Text / Statement | Evidence (File Path & Logic) | Status |
| :--- | :--- | :--- | :--- | :---: |
| **C-01** | **Core Positioning** | "See your chunks before you embed them." | Functional definition of visualizer: partitions documents and displays chunk cards with token metrics before vector generation. | **VERIFIED** |
| **C-02** | **Exact Token Counting** | "Exact token counts for standard BPE encodings (o200k_base and cl100k_base)." | `src/engine/tokenizers/tokenizer.ts` (lines 18–38): uses `js-tiktoken` for exact byte-pair encoding. `src/engine/tokenizers/multiModel.ts` (lines 18–37): `isExact: true` for `o200k_base` and `cl100k_base`. Measured on bundled sample `Developer API Reference & Code`: 2,007 characters $\rightarrow$ 482 document tokens (508 ingested tokens across 2 chunks with overlap; Chunk #01: 330 tokens). | **VERIFIED** |
| **C-03** | **Multi-Model Token Estimation** | "Compare token counts across models (estimates for non-BPE models)." | `src/engine/tokenizers/multiModel.ts` (lines 38–65): non-exact models flagged with `isExact: false` and computed via proportional character/token heuristics. Exact models clearly differentiated from estimated models. | **VERIFIED** |
| **C-04** | **Chunking Algorithms** | "5 configurable splitting algorithms: recursive character, markdown header, sentence boundary, tabular record, and fixed-size sliding window." | `src/engine/chunkers/index.ts` (lines 30–47): `chunkFixed`, `chunkMarkdown`, `chunkSentence`, `chunkTabular`, and `chunkRecursive`. Verified by 120 golden tests in `src/engine/chunkers/__tests__/goldenChunkers.test.ts`. | **VERIFIED** |
| **C-05** | **Real-Time Sliders** | "Live chunk reflow as target size and overlap adjust." | `src/components/Sidebar.tsx` (lines 280–330) and `src/components/WorkbenchView.tsx`: reactive slider triggers background Web Worker (`useChunkingWorker.ts`) updating chunks without page reloads. | **VERIFIED** |
| **C-06** | **Heatmap Similarity** | "Pairwise lexical similarity matrix computed via TF-IDF cosine projection." | `src/engine/embeddings/vectorizer.ts` (lines 37–88): tokenizes alphanumeric terms, applies stop-word filter, computes TF-IDF weights, and calculates L2-normalized cosine dot product. Measured on live app with 65-chunk catalog: generates full $65 \times 65$ transition matrix. | **VERIFIED** |
| **C-07** | **Boundary Continuity** | "Adjacent-neighbor boundary continuity scoring." | `src/engine/embeddings/vectorizer.ts` (lines 74–76) and `src/components/SimilarityHeatmap.tsx` (lines 143–176): calculates transition similarity between chunk $i$ and $i+1$. Measured on live 65-chunk catalog: 64 transitions across 65 chunks with an average continuity score of 47.5%. | **VERIFIED** |
| **C-08** | **Redundancy Detection** | "Identifies high-overlap (>70%) chunk pairs and weak boundary transitions." | `src/engine/embeddings/vectorizer.ts` (lines 80–85): flags pairs exceeding redundancy threshold and extracts shared keywords. | **VERIFIED** |
| **C-09** | **Embedding Cost Estimation**| "Estimate embedding cost based on ingested token count." | `src/engine/tokenizers/multiModel.ts` (lines 140–180) and `src/components/MetricsBar.tsx`: computes cost projections ($ < 0.0001) per token density against published baseline rates. Measured on live sample: `< $0.0001`. | **VERIFIED** |
| **C-10** | **Code & Data Export** | "Exports chunking parameters as code for standard pipelines (Python and TypeScript) or clean data (JSON and CSV)." | `src/exporters/codeExporters.ts` (cases: `langchain-python`, `llamaindex-python`, `langchain-js`, `native-python`) and `src/exporters/dataExporters.ts` (JSON and sanitized RFC 4180 CSV). | **VERIFIED** |
| **C-13** | **Open Source** | "Open source under MIT License." | `LICENSE` file in root repository specifies MIT License (Copyright 2026 Dhaneshwar). | **VERIFIED** |
| **C-14** | **Free Access** | "Free to use in the browser. No account required." | Application loads directly at `https://chunklensdev.vercel.app` without sign-in, authentication wall, or payment barrier. | **VERIFIED** |

---

## 2. Privacy Claims: Two Wording Versions (Audit & Verification)

> [!WARNING]
> **Audit Finding (C-11 & C-12):** The live deployed CSP header on `https://chunklensdev.vercel.app` contains `connect-src 'self' https://api.web3forms.com;`.
> The exception `https://api.web3forms.com` is used exclusively in `src/components/pro/ProWaitlistModal.tsx` in `<ProWaitlistModal />` (lines 118 & 215) to submit user email addresses for the optional early-access waitlist and custom enterprise inquiries.
> Consequently, the claims "Zero network egress" and "connect-src 'none'" are **NOT VERIFIED as worded** for the current deployment.

### Version A: Current Live Deployed State (Waitlist Form Retained)
*Applies if the Web3Forms submission remains in the application:*
- **Status of C-11 & C-12:** **NOT VERIFIED as worded**.
- **Mandatory Film & Copy Wording:**
  - *"Your documents never leave your browser. The only outbound request is the optional early-access email form, sent only when you submit it."*
  - *"Local in-browser processing."*
- **Strictly Prohibited under Version A:**
  - The phrase "zero network egress" is **FORBIDDEN**.
  - Any visual or spoken display of `connect-src 'none'` is **FORBIDDEN**.
  - On-screen CSP display must show the actual deployed header: `connect-src 'self' https://api.web3forms.com`.

### Version B: Recommended Remediation (Waitlist Form Replaced, `connect-src 'none'` Restored)
*Applies if user approves removing the Web3Forms submission:*
- **Remediation Action:**
  1. Remove `fetch('https://api.web3forms.com/submit')` from `src/components/pro/ProWaitlistModal.tsx`.
  2. Replace form submission action with a `mailto:` link or a public GitHub link (`https://github.com/Dhanesh10war/chunklens/issues`).
  3. Revert `connect-src` in `src/config/csp.ts`, `vercel.json`, and `public/_headers` to strict `'none'`.
  4. Redeploy and re-verify live HTTP response header with `curl -sI https://chunklensdev.vercel.app`.
- **Wording for Version B:**
  - *"Runs entirely in your browser. Zero network egress."* [C-11]
  - *"Enforced by browser Content-Security-Policy: connect-src 'none'."* [C-12]
- **Status under Version B:** **VERIFIED** (pending deployment).

---

## 3. Forbidden Claims (Strictly Prohibited from Film & Copy)

| Claim / Term | Reason for Prohibition | Enforced Replacement / Action |
| :--- | :--- | :--- |
| **"Semantic" similarity** | In-browser matrix uses lexical TF-IDF n-grams with stop-words, not dense neural vector embeddings. | Use "lexical similarity", "TF-IDF similarity", or "pairwise similarity". |
| **"5 tokenizers"** | Only 2 BPE encodings are exact (`o200k_base`, `cl100k_base`); others are proportional heuristic estimates. | Use "exact BPE token counting" and "multi-model variance estimates". |
| **"Zero network egress" / `connect-src 'none'` (under Version A)** | Live CSP includes `https://api.web3forms.com` for waitlist modal. | Prohibited unless Version B is implemented and deployed. |
| **"433 Invariants" / Unexplained Numbers** | Not explained in film context; creates confusion. | Removed entirely from film and on-screen cards. |
| **"0px header drift"** | Unmeasured / unnecessary technical jargon in brief. | Removed entirely. |
| **Vendor / Platform Brand Names** | Prohibited by NAMING RULE: no competitor or platform brand names (no OpenAI, Anthropic, Google, Meta, LangChain, LlamaIndex, Haystack, Vercel, Cloudflare, etc.). | Use generic technical descriptions ("standard BPE encodings", "pipeline frameworks"). |
| **Apple References** | Explicitly prohibited by NAMING RULE. | Excluded entirely. |
| **Haystack** | Not implemented in code or export targets. | Excluded entirely. |
| **Batch Directory Ingestion** | Current web application processes single documents or selected sample corpora. | Excluded entirely. |
| **Retrieval Simulator** | Application inspects chunk partitioning and boundary continuity, not vector retrieval simulation. | Excluded entirely. |
| **Vector Database Push / Sync** | No live API connection exists to write to remote vector databases. | Excluded entirely. |
| **Compliance Certifications (SOC2, HIPAA, GDPR)** | Not independently audited or certified compliance service. | Describe only technical architecture: "in-browser document processing". |
| **Unmeasured Superlatives / Percentages** | "Saves 30–50%", "100x faster", "the ultimate RAG tool". | Cut entirely. State only measured UI metrics. |
| **Fake Testimonials / Customer Logos** | Prohibited by TRUTH RULE. | Zero fake social proof. |

---

## 4. Real Measured Benchmark Values (for Script & Visuals)

All numbers appearing in the film must match these live measured values:
1. **Sample Document:** `Developer API Reference & Code`
   - Raw Character Count: `2,007 characters`
   - Document BPE Token Count: `482 tokens`
   - Ingested Tokens (across 2 chunks with overlap): `508 tokens`
   - Chunk #01 Token Count: `330 tokens`
   - Chunk #02 Token Count: `178 tokens`
   - Average Chunk Size: `254 tokens` [range: 178–330]
   - Vector Embedding Cost: `< $0.0001`
   - Client Compute Time: `~1.1s`
2. **Sample Document:** `Product Catalog CSV / JSON` (Heatmap View)
   - Total Chunks: `65 chunks`
   - Adjacent Transitions: `64 transitions`
   - Measured Boundary Continuity Average: `47.5%`

---

## 5. Verified Brand Assets & Licensing

- **Brand Mark:** "The Partitioned Lens" from `src/components/ui/ChunkLensLogo.tsx` (an original three-strata geometric SVG with central aperture). License: MIT (ChunkLens repository).
- **Alternative Wordmark:** Clean monospaced or geometric sans typography: `ChunkLens`.
- **Target Deployed URL:** `https://chunklensdev.vercel.app`
- **Public Git Repository:** `https://github.com/Dhanesh10war/chunklens`
