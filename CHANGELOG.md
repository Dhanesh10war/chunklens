# Changelog

All notable changes to ChunkLens will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Responsive header priority ordering and overflow menu (`MoreHorizontal`) for viewports $\le 1024$px with full keyboard arrow navigation, Escape dismiss, and focus return (3.6).
- Two-row wrap layout for metrics strip on mobile viewports (<768px) with conditional overflow fade mask when scrolling (3.6).
- Direct "Compare models & costs..." entry point inside the "Unit & tokenizer" sidebar section.
- Automated static test asserting zero sub-12px CSS font sizes in codebase and live browser-computed style audit verifying strict 12px text floor.
- Automated CSS variable contrast parser test verifying WCAG 2.2 AA compliant contrast ($\ge 4.5:1$) across all themes.
- Interactive "How to Verify" privacy popover with DevTools audit steps, collapsing to icon + tooltip below 1200px (3.2).
- Real `EmptyState` component with 10 MB limit dropzone, paste text mode, format guidance, and 6 sample benchmark cards (3.4).
- Shared `useDocumentUpload` hook unifying file ingestion, format detection, and strict exception categorization across Sidebar and VisualCanvas (3.3).
- Compact `UploadErrorBanner` with `role="alert"`, clear reason, retained document indicator, and copyable technical details (3.3).

### Changed
- Lazy-loaded heavy modal dialogs and views (`TokenizerComparisonModal`, `ExportModal`, `CommandPalette`, `ComparisonView`, `SimilarityHeatmap`) via `React.lazy`, reducing main bundle `index.js` from 188.65 kB to 134.76 kB raw (40.15 kB gzip), well below the 185 kB budget limit.
- Split accent tokens into `--accent` (text/icons/rings), `--accent-solid` (#4338CA light / #4F46E5 dark), and `--on-accent` (#FFFFFF) guaranteeing $\ge 4.5:1$ contrast (7.90:1 light, 6.29:1 dark) on primary buttons (3.7).
- Replaced all sub-12px font sizes with strict `text-xs` (12px) minimum text floor (3.7).
- Updated all section labels and headers to real UI sentence-case labels: Algorithm, Separators hierarchy, Measurement unit, Tokenizer encoding, and Size & overlap (3.7).
- Self-hosted Inter and JetBrains Mono woff2 fonts; eliminated Google Fonts (3.1).
- Implemented single-source strict Content Security Policy (`connect-src 'none'`) with zero network egress proof (3.1).
- Reconciled Document vs Ingested token counts with tooltips and unit tests (3.5).
- Replaced live-looking mock API key in `api-reference` sample corpus with placeholder `YOUR_API_KEY` (3.8).
- Playwright E2E suite (`e2e/networkEgress.spec.ts`) is written, not yet run (Playwright runner is not installed in the sandboxed dev environment; zero egress verified live via Chrome DevTools Protocol in `scripts/test-egress.cjs`).

### Fixed
- Resolved detached `ArrayBuffer` crash in PDF parsing (`pdfParser.ts`) by isolating byte copies with `new Uint8Array(source.length)` and ensuring `loadingTask.destroy()` in `finally`.

## [0.2.0] - 2026-11-12
Tagged at commit [`ffb2f16`](https://github.com/drago/chunklens/commit/ffb2f16).

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
