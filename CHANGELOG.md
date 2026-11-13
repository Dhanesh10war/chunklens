# Changelog

All notable changes to ChunkLens will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Reconciled Document vs Ingested token counts with tooltips and unit tests (3.5).
- Replaced live-looking mock API key in `api-reference` sample corpus with placeholder `YOUR_API_KEY` (3.8).

## [0.2.0] - 2026-11-12

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
