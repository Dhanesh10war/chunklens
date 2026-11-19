# ChunkLens Learn Track P0 Milestone Report & Ratchet Table

## Executive Summary
This document summarizes the autonomous execution and verification of **ChunkLens Learn Track Phase P0** (Vertical Slice: Curriculum Engine, Interactive Simulation Widgets, and Canonical Lessons).

The Learn Track introduces a zero-egress, interactive, browser-based curriculum inside ChunkLens that teaches technical concepts in Retrieval-Augmented Generation (RAG) and document chunking through visual interactive models, real-time chunking sandboxes, and verified technical content.

---

## Priority Order Execution & Commit History

Execution followed the strict priority order: **A hygiene > B chunker refactor > C platform > D routing and map > E widgets > F lessons > G gates > H self-review > I report**.

All commits were recorded locally on branch `content/learn` (stacked on `feature/ui-refresh`) with conventional messages:

1. `95d6019` — `chore(hygiene): remove forbidden design-language terms from commit history`
2. `e7ef914` — `chore(hygiene): update system font fallbacks to system-ui and re-encode PNG metadata`
3. `e39be68` — `chore(git): rename branch to feature/ui-refresh and verify clean hygiene scans`
4. `cc2cca7` — `test(chunkers): add golden characterization tests across 120 document and strategy combinations`
5. `b315ceb` — `refactor(chunkers): decouple token counter via dependency injection`
6. `a919947` — `perf(chunkers): add realistic 50k character benchmark for main thread chunking`
7. `8273dfc` — `feat(learning): implement platform parser, renderer, progress store, and widgets`
8. `607dcb8` — `feat(learning): add visual curriculum map, routing, canonical lessons, and retire legacy modals`
9. `20bae7b` — `test(learning): add content authenticity and term scan test`
10. `89c9247` — `test(egress): expand egress coverage to curriculum map and lesson views`
11. `c58d19e` — `test(a11y): pass WCAG 2.2 AA and cross-browser audits on Learn Track`
12. `0c30ce4` — `perf(learning): filter lazy chunks from modulepreload, split workbench view, and verify CDP byte metrics`
13. `eb42b89` — `docs(learning): capture visual verification artifacts for curriculum and widgets`

---

## Architectural Refactoring & Deviations Register

| # | Item / Decision | Architectural Rationale | Impact / Verification |
|---|---|---|---|
| **D1** | **Lazy-Loading Workbench View (`WorkbenchView.tsx`)** | Previously, `AppContent` mounted the heavy chunking worker, state, and upload hooks unconditionally at root. Extracting `WorkbenchView` keeps the root router shell minimal (`35.72 kB`). | First `?view=learn` wire payload dropped by 93.5% (from 2.78 MB to 180 kB). Neither tiktoken, pdf-engine, nor workers load until user visits workbench or runs a token simulation. |
| **D2** | **Vite `modulePreload.filter` Configuration** | Vite's default crawler automatically injected `<link rel="modulepreload">` for all chunks into `dist/index.html`. We explicitly filtered out `tokenizer-tiktoken`, `pdf-engine`, and `chunking.worker`. | Verified in `dist/index.html`: only `index.js`, `vendor-react`, and `vendor-icons` are preloaded for the root app shell. |
| **D3** | **Dynamic Tokenizer Injection in V2 Sandbox** | When a reader switches the V2 Sandbox from character mode to token mode, `V2ChunkSandbox` prompts for confirmation and dynamically imports `tokenizer.ts`, wiring it into `setChunkerTokenizerContext`. | Verified by chunk analysis: `V2ChunkSandbox` bundle (`12.25 kB`) does not statically import `tokenizer-tiktoken`. |
| **D4** | **WCAG 2.2 Target Size & Contrast Adjustments** | Sliders in `V2ChunkSandbox` were given `minHeight: 28px` to guarantee $\ge 24\text{px}$ touch targets under SC 2.5.8. Range inputs, subtle text, and badges were styled with high-contrast palette tokens (`.learn-primary-btn`, `.learn-subtle-text`). Header logo was converted to semantic div to eliminate target collision with sidebar collapse. | Verified via Playwright Axe audit: 0 violations across 1440px and 375px viewports in light and dark themes. |
| **D5** | **Keyboard-Scrollable Container ARIA Semantics** | Axe-core flagged `scrollable-region-focusable` on markdown code blocks, SVG diagrams, and data tables. Added `tabIndex={0}`, `role="region"`, and explicit `aria-label` to all scrollable elements. | Verified via Playwright Axe audit across desktop and mobile. |

---

## Measured CDP Byte Transfers (CDP Network.loadingFinished)

Measurements conducted on production build via headless Chrome CDP socket (`node --experimental-websocket scripts/measure-cdp-bytes.cjs`):

| Phase | Wire Transferred | Uncompressed Raw | tiktoken Loaded | pdf Loaded | worker Loaded | Egress Bytes | Status |
|---|---|---|---|---|---|---|---|
| **1. First `?view=learn` Load (Cold)** | **180.05 kB** | 180.05 kB | **NO** | **NO** | **NO** | 0 B | **PASS** |
| **2. Lesson 3.2 Load (with V2 sandbox chunk)** | **55.77 kB** | 55.77 kB | **NO** | **NO** | **NO** | 0 B | **PASS** |
| **3. First V2 Interaction in Character Mode** | **0.00 kB** | 0.00 kB | **NO** | **NO** | **NO** | 0 B | **PASS** |
| **4. Token Mode Activation (with local dynamic import)** | **0.00 kB** | 0.00 kB | Local chunk | **NO** | **NO** | 0 B | **PASS** |

### Chunk Sizes of Learning Assets
- `index.js` (App shell router): **35.72 kB** (gzip: **12.43 kB**)
- `LearnView.js` (Curriculum platform, map, progress): **71.87 kB** (gzip: **21.29 kB**)
- `LearnView.css` (Learn Track stylesheet): **4.57 kB** (gzip: **1.19 kB**)
- `V1PipelineFlowExplorer.js` (V1 widget): **8.61 kB** (gzip: **2.95 kB**)
- `V2ChunkSandbox.js` (V2 sandbox widget): **12.25 kB** (gzip: **3.53 kB**)
- `WidgetContainer.js` (Container shell & accessible table): **2.35 kB** (gzip: **0.89 kB**)

---

## Benchmark: 50,000-Character Main-Thread Chunking

Executed across 20 iterations using `scripts/bench-chunkers.ts`:

| Strategy | Text Length | Chunk Count | Median (p50) | 95th Percentile (p95) | Threshold | Status |
|---|---|---|---|---|---|---|
| **fixed** | 50,000 chars | 125 chunks | 0.16 ms | 0.28 ms | < 50.0 ms | **PASS** |
| **recursive** | 50,000 chars | 125 chunks | 0.42 ms | 0.75 ms | < 50.0 ms | **PASS** |
| **markdown** | 50,000 chars | 114 chunks | 0.48 ms | 0.81 ms | < 50.0 ms | **PASS** |
| **sentence** | 50,000 chars | 132 chunks | 1.15 ms | 2.10 ms | < 50.0 ms | **PASS** |
| **tabular** | 50,000 chars | 84 chunks | 1.82 ms | 3.40 ms | < 50.0 ms | **PASS** |

*Conclusion:* All five chunkers execute in $< 5\text{ ms}$ at p95 on 50,000 characters, well within the 50 ms interactive budget. Main-thread execution for character-mode sandboxing guarantees instantaneous 60 FPS slider adjustments.

---

## Honest Ratchet Table (v0.3 Baseline vs. P0 Milestone)

| Metric | v0.3 Baseline | Prior to P0 Refactor | P0 Milestone Result | Ratchet Direction | Status |
|---|---|---|---|---|---|
| **Main JS Bundle (raw)** | 136.00 kB | 169.83 kB | **35.72 kB** | **-73.7%** vs v0.3 | **PASS** (Budget <= 185 kB) |
| **Main CSS Bundle (raw)** | 44.97 kB | 44.97 kB | **44.82 kB** | **-0.15 kB** | **PASS** (Budget <= 45 kB) |
| **Initial `?view=learn` Wire Transfer** | N/A | 2,788.53 kB | **180.05 kB** | **-93.5%** | **PASS** |
| **tiktoken Loaded on First Learn View** | N/A | YES | **NO** | Eliminated | **PASS** |
| **pdf Engine Loaded on First Learn View** | N/A | NO | **NO** | Invariant | **PASS** |
| **Chunking Worker Loaded on Learn View** | N/A | YES | **NO** | Eliminated | **PASS** |
| **Network Egress Requests** | 0 | 0 | **0** | Invariant | **PASS** (Strict CSP) |
| **Axe WCAG 2.2 AA Violations** | 0 | 0 | **0** | Invariant | **PASS** (1440px & 375px) |
| **Cross-Browser Compatibility** | Chromium, Firefox, WebKit | Passing | **Passing (16/16)** | Invariant | **PASS** (0 horizontal overflow) |
| **Unit & Integration Tests** | 286 tests | 286 tests | **427 tests** | **+141 tests** | **PASS** (100% passing) |
| **Golden Characterization Invariants** | 0 | 120 tests | **120 tests** | **+120 tests** | **PASS** (100% invariant) |
| **Banned Design-Language Terms** | 10+ occurrences | 0 | **0** | Scrubbed clean | **PASS** |

---

## Visual Verification Artifacts Captured

Visual screenshots generated via Playwright and stored in `docs/design/learn/`:
1. `docs/design/learn/01-curriculum-map-desktop-1440-dark.png` — Curriculum map with progress rings, path selector (Beginner/Builder/Operator), and 8 module sections in dark mode.
2. `docs/design/learn/02-curriculum-map-mobile-375-light.png` — Responsive single-column mobile view at 375px in light mode with no horizontal overflow.
3. `docs/design/learn/03-lesson-1-1-v1-pipeline-desktop-dark.png` — Lesson 1.1 with interactive 5-stage SVG RAG Pipeline Simulator and data table fallback.
4. `docs/design/learn/04-lesson-3-2-v2-sandbox-desktop-dark.png` — Lesson 3.2 with Live Chunking Sandbox (sliders, live chunk preview, token cost metrics).
5. `docs/design/learn/05-quiz-feedback-accessible-desktop-dark.png` — Accessible quiz evaluation with color-independent icons and live feedback.

---

## PR & Integration Instructions

To review or integrate the Learn Track P0 changes without altering main:
1. Ensure you are on the `content/learn` branch:
   ```bash
   git checkout content/learn
   git status
   ```
2. Verify all quality gates pass locally:
   ```bash
   npm run check:bundle       # Confirms JS <= 185 kB (35.72 kB) and CSS <= 45 kB (44.82 kB)
   npm test                   # Runs all 427 unit, snapshot, and content scan tests
   npm run test:compat:quick  # Tests Chromium desktop and mobile layout compatibility
   node --experimental-websocket scripts/test-egress.cjs  # Proves zero network egress
   ```
3. To open a pull request against `feature/ui-refresh`:
   ```bash
   # Push content/learn branch to your remote repository
   git push -u origin content/learn
   # Open PR: base=feature/ui-refresh, compare=content/learn
   ```
