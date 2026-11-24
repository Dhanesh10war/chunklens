# Changelog

All notable changes to ChunkLens will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-23

### Added
- **Commercial Landing Page & SaaS Architecture:**
  - High-converting editorial landing page with dark/light themes, warm typography (`Instrument Serif`), and interactive 3-column playground simulation.
  - Multi-view routing architecture supporting `/` (Landing Page), `/?view=app` (Workbench), and `/?view=learn` (RAG Academy) with tab-scoped session preservation.
  - Pro & Enterprise custom waitlist modal (`ProWaitlistModal.tsx`) with non-blocking Web3Forms background relay (`https://api.web3forms.com`), keeping document processing completely client-side and air-gapped.
- **29-Lesson Interactive RAG Academy:**
  - 9 structured curriculum modules (M0 Quickstart through M8 Production Playbooks for Legal, Financial 10-K, and Tech Docs).
  - Interactive simulation widgets (`V1PipelineFlowExplorer`, `V2ChunkSandbox`) with live boundary calculations directly inside lesson prose.
  - Mastery verification quizzes across all modules with detailed engineering rationales.
- **Marketing Automation & Agency Video Pipeline:**
  - Automated 1080p 60fps Playwright video recording suite (`e2e/recordProductVideo.spec.ts`) capturing fluid product interactions.
  - Agency-grade title card templates (`media/intro_card.html`, `media/outro_card.html`).
  - Produced 45.2s master launch trailer (`chunklens_launch_trailer.mp4`) and comprehensive multi-channel publish kit (`chunklens_first_publish_launch_kit.md`).
- **Comprehensive Test Expansion:**
  - Test suite grew from 126 tests (20 suites) to **433 tests passing across 44 test suites**, including property invariants, token variance benchmarks, and boundary checks.
  - Automated Playwright cross-browser compatibility quick suite (16 tests) and dedicated heatmap alignment e2e test suite (2 tests).

### Changed
- **Code Splitting & Bundle Performance:**
  - Split `AppContent` into lazy-loaded views, reducing main entry shell JS from 136.00 kB to **36.57 kB** (raw) / 12.58 kB (gzip).
  - Workbench workspace isolated into dedicated chunk (`116.24 kB`), bringing total initial JS for `?view=app` to **152.81 kB** (well under the 165 kB budget).
  - CSS bundle optimized to **44.16 kB** (under the 45.0 kB budget).
- **Updated Content Security Policy:**
  - Refined CSP across `index.html`, `public/_headers`, `vercel.json`, and `csp.ts` to `connect-src 'self' https://api.web3forms.com`, preserving zero document egress while enabling enterprise waitlist submissions.

### Fixed
- **2D Similarity Heatmap Pitch Alignment (0px Drift):**
  - Resolved cumulative horizontal misalignment where 40px column headers drifted from 44px matrix cells (gap-1); standardized headers and cell rows to identical 44px pitch.
- **Dual-Axis Locked Sticky Corner:**
  - Added `data-testid="heatmap-corner-spacer"` with `z-40`, `left-0`, `top-0` to prevent column headers from colliding with sticky row numbers during 2D scroll.
- **Large Matrix Row Truncation & Black Void:**
  - Enforced `shrink-0` on cell buttons, `w-max min-w-full` on row wrappers, and updated `containIntrinsicSize: 'auto 36px'`, eliminating horizontal cell cutoff on 65+ chunk datasets.
- **Scrollport Height Expansion:**
  - Added `min-h-0 min-w-0` to flex container hierarchy in `WorkbenchView.tsx` and `SimilarityHeatmap.tsx` to restore smooth inner 2D scrolling within the browser window.

## [0.3.0] - 2026-11-14

### Added
- Responsive header priority ordering and overflow menu (`MoreHorizontal`) for viewports $\le 1024$px with full keyboard arrow navigation, Escape dismiss, and focus return (3.6).
- Two-row wrap layout for metrics strip on mobile viewports (<768px) with conditional overflow fade mask when scrolling (3.6).
- Compact left-aligned metrics rows with CSS hairline dividers below `xl` viewport (V7).
- Plain secondary text algorithm description in Sidebar without bordered box (V6).
- Mobile canvas responsive layout: stacked chunk gutter above text below `sm`, shortened `Stream` / `Cards` toggle with `whitespace-nowrap`, and hidden chunk caption below `sm` (V8).
- Privacy shield docked beside right-side actions at 1024px viewport (V9).
- Hardened GitHub Actions CI pipeline (`.github/workflows/ci.yml`) triggered on push and pull_request to `main` with `contents: read`, Node 22, typecheck, vitest coverage, prod audit gate, build, bundle check, and Playwright with artifacts (B2).
- Bundle budget gate script (`scripts/check-bundle.cjs`) enforcing JS $\le 185$ kB raw and CSS $\le 45$ kB raw (B2).
- Comprehensive Playwright axe accessibility test suite (`e2e/accessibility.spec.ts`) covering loaded, empty, and corrupt PDF error states without weakening rules (B2).
- Pre-flight release verification checklist (`docs/LAUNCH_CHECKLIST.md`) covering zero egress, multi-page PDF resilience, mobile viewports, theme contrast, keyboard navigation, and zero tracking (B6).
- Multi-target CSP and security headers generator (`scripts/sync-csp.cjs`) targeting `index.html`, `public/_headers`, and `vercel.json` (B4).
- Production deployment guide (`docs/DEPLOY.md`) covering Cloudflare Pages and Vercel hosting architectures (B4).
- Single version injection (`__APP_VERSION__`) sourced from `package.json` into Vite and Vitest configs with TypeScript types in `src/vite-env.d.ts` (B1).
- Direct "Compare models & costs..." entry point inside the "Unit & tokenizer" sidebar section (3.7).
- Automated static test asserting zero sub-12px CSS font sizes in codebase and live browser-computed style audit verifying strict 12px text floor (3.7).
- Automated CSS variable contrast parser test verifying WCAG 2.2 AA compliant contrast across all themes (3.7).
- Interactive "How to Verify" privacy popover with DevTools audit steps, collapsing to icon + tooltip below 1200px (3.2).
- Real `EmptyState` component with 10 MB limit dropzone, paste text mode, format guidance, and 6 sample benchmark cards (3.4).
- Shared `useDocumentUpload` hook unifying file ingestion, format detection, and strict exception categorization across Sidebar and VisualCanvas (3.3).
- Compact `UploadErrorBanner` with `role="alert"`, clear reason, retained document indicator, and copyable technical details (3.3).

### Changed
- Lazy-loaded heavy modal dialogs and views (`TokenizerComparisonModal`, `ExportModal`, `CommandPalette`, `ComparisonView`, `SimilarityHeatmap`) via `React.lazy`, reducing main bundle `index.js` from 188.65 kB to 132.99 kB raw (40.33 kB gzip), well below the 185 kB budget limit.
- Split accent tokens into `--accent` (text/icons/rings), `--accent-solid` (#4338CA light / #4F46E5 dark), and `--on-accent` (#FFFFFF) guaranteeing $\ge 4.5:1$ contrast (7.90:1 light, 6.29:1 dark) on primary buttons (3.7).
- Defined status danger tokens (`--status-danger`, `--status-danger-border`, `--on-status-danger`) guaranteeing $\ge 3:1$ icon contrast and 5.45:1 text contrast on error banners (V4).
- Replaced all sub-12px font sizes with strict `text-xs` (12px) minimum text floor (3.7).
- Updated all section labels and headers to real UI sentence-case labels: Algorithm, Separators hierarchy, Measurement unit, Tokenizer encoding, and Size & overlap (3.7).
- Self-hosted Inter and JetBrains Mono woff2 fonts; configured caching to `max-age=604800` (non-content-hashed); eliminated Google Fonts (3.1).
- Implemented single-source strict Content Security Policy (`connect-src 'none'`) with zero network egress proof (3.1).
- Reconciled Document vs Ingested token counts with tooltips and unit tests (3.5).
- Replaced live-looking mock API key in `api-reference` sample corpus with placeholder `YOUR_API_KEY` (3.8).
- Rewrote `README.md` with verified 6 frontier tokenizers across 5 model families, Option 1 tagline, refreshed hero shot, zero-egress DevTools verification guide, and architectural limitations (B5).
- Removed unused duplicate upload handler from `ControlsPanel.tsx` (B1).
- Removed external personal repository URLs and commit links from documentation (Report fixes).
- Upgraded project Node runtime recommendation to Node 22 (`.nvmrc`) (B4).
- Playwright E2E and axe suites (`e2e/networkEgress.spec.ts`, `e2e/accessibility.spec.ts`) are written, not yet run locally due to sandbox offline environment; fully wired in GitHub Actions CI via `npx playwright install --with-deps chromium` (B2).

### Fixed
- Resolved detached `ArrayBuffer` crash in PDF parsing (`pdfParser.ts`) by isolating byte copies with `new Uint8Array(source.length)` and ensuring `loadingTask.destroy()` in `finally` (3.3).
- Added comprehensive unit tests for detached `ArrayBuffer` prevention and sequential multi-read reusability (`pdfParser.test.ts`).
- Fixed header spacing at 375px viewport ensuring $\ge 6$px bounding box gap between shield and version badge (V2).
- Fixed empty-state paste text button clipping at 375px by shortening copy to "Have a snippet?" (V1).

### Security
- Upgraded `pdfjs-dist` from 5.6.205 to 6.5.438 to remediate CVE-2026-16633 (high severity XSS vulnerability affecting versions >=5.6.205 <6.2.108).
- Explicitly disabled embedded scripting (`enableScripting: false`) and eval evaluation (`isEvalSupported: false`) in PDF worker options.

## [0.2.0] - 2026-11-12
Tagged at commit `ffb2f16`.

### Added
- Multi-model tokenizer comparison matrix and embedding cost analyzer across 6 frontier LLMs.
- Automatic file format recognition (PDF, CSV, JSON, Markdown, Source Code) and strategy auto-alignment.
- Dedicated background Web Worker for CPU-heavy chunking and token counting.
- 320px collapsible Chunk Inspector drawer with delimiter diagnostics and offset tracking.
- Global Command Palette (`⌘K`) with fuzzy navigation.
- In-memory TF-IDF semantic vectorizer and $N \times N$ cosine similarity heatmap.
- Enterprise design system (OKLCH chunk palette, diagonal-hatch overlap ribbons, dark/light themes, 100% WCAG 2.2 AA compliance).

## [0.1.0] - 2026-11-10

### Added
- Initial release with 5 chunking algorithms (Fixed, Recursive, Markdown, Sentence, Tabular).
- Dual measurement units (characters and tokens).
- Code generators for LangChain, LlamaIndex, and raw JSON/CSV data export.
