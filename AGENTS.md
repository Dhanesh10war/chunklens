# ChunkLens Agent Map

## Golden Commands
- **Install:** `npm ci` (or `npm install`)
- **Lint / Type-Check:** `npm run lint` / `npm run typecheck` (`tsc -b`)
- **Unit Tests:** `npm run test` (`vitest run`)
- **Verbose Tests:** `npm run test:verbose` (`vitest run --reporter=verbose`)
- **Production Build:** `npm run build` (`tsc -b && vite build`)
- **Local Dev Server:** `npm run dev` (`vite`)
- **Visual Capture & Audit:** `node --experimental-websocket scripts/capture-baseline.cjs after`

## Architecture Pointers
- **Engine Core (`src/engine/`):**
  - `chunkers/`: Algorithm implementations (`markdownChunker`, `sentenceChunker`, `recursiveChunker`, `fixedChunker`, `tabularChunker`, `utils.ts`).
  - `tokenizers/`: BPE tokenizer wrapper (`tokenizer.ts`, `multiModelTokenizer.ts` using `js-tiktoken`).
  - `types.ts`: Universal schemas (`ChunkingConfig`, `ChunkMetadata`, `ChunkingResult`).
- **Exporters (`src/exporters/`):**
  - `codeExporters.ts`: Strategy-aware Python/TS code generator.
  - `dataExporters.ts`: RFC 4180 CSV & JSON dataset generator.
- **State & Utilities (`src/utils/`):**
  - `storage.ts`: Isomorphic `localStorage` persistence with schema defaults.
  - `theme.ts`: Dark/Light theme manager with `prefers-color-scheme` support.
  - `pdfParser.ts`: In-browser PDF text extractor using `pdfjs-dist` with resilient worker initialization.
  - `clipboard.ts`: Async clipboard write with `execCommand('copy')` fallback for headless/test environments.
  - `cn.ts`: Class name merger (`clsx` + `tailwind-merge`).
- **Component Primitives (`src/components/ui/`):**
  - `Button.tsx`, `Input.tsx`, `Select.tsx`, `SliderWithInput.tsx`, `SegmentedControl.tsx`, `Tooltip.tsx`, `Toast.tsx`, `Skeleton.tsx`.
- **Application Shell (`src/components/`):**
  - `Header.tsx`: 48px top bar with document title, privacy badge, theme toggle, and ⌘K quick action trigger.
  - `Sidebar.tsx`: 300px collapsible configuration drawer (<1024px responsive overlay).
  - `MetricsBar.tsx`: Slim hairline summary strip with inline metric pairs and tabular numerals.
  - `VisualCanvas.tsx`: Hero continuous reading column with OKLCH chunk color bands and diagonal-hatch overlap ribbons.
  - `ChunkInspector.tsx`: 320px pro inspector (<768px responsive bottom sheet) detailing boundary split reasons and neighbor context.
  - `CommandPalette.tsx`: ⌘K floating quick actions launcher.

## Do-Not-Modify List
- `package-lock.json` (do not hand-edit).
- `dist/`, `tsconfig.tsbuildinfo` (generated build artifacts).
- Zero server-side backends or network tracking: all document parsing and tokenization must remain 100% in-browser.

## Known Traps
- **Node vs Browser Globals in Tests:** Vitest runs in Node. Browser globals (`window`, `localStorage`, `navigator.clipboard`) are undefined unless guarded with `typeof window !== 'undefined'` or isomorphic fallbacks.
- **Strict TypeScript:** `"noUnusedLocals": true` and `"noUnusedParameters": true` cause compile failures on unused imports or args.
- **Large Tokenizer Bundle:** `js-tiktoken` vocab is 5.6 MB. `vite.config.ts` uses `manualChunks` to keep application code under 100 kB. Never remove chunk splitting.
- **Execution Directory:** The repository is located at `/home/drago/projects/Venture/chunklens`. Always run commands inside `chunklens/`.

## UI Conventions & Design System Tokens (Linear / Vercel Benchmark)
- **Palette Tokens:**
  - Dark Mode: `bg-base` (`#0A0A0B` near-black neutral), `bg-surface` (`#111113`), `bg-elevated` (`#17171A`), `border-default` (`rgba(255,255,255,0.10)`), `border-subtle` (`rgba(255,255,255,0.06)`).
  - Text Tokens: `text-primary` (`#EDEDEF`), `text-secondary` (`#A1A1AA`), `text-tertiary` (`#8A8A93` at 5.9:1 contrast).
  - Single Accent: Desaturated Indigo `oklch(0.68 0.14 275)` (reserved for single solid `Export` action and focus rings).
  - Chunk Spectrum: 8-hue OKLCH palette (`var(--chunk-0)` through `var(--chunk-7)`).
  - Overlap Pattern: `repeating-linear-gradient(-45deg, ...)` diagonal hatch.
- **Border Radii:** Strictly 6px controls, 8px panels/cards, 12px modal sheets.
- **Interaction & Feedback:**
  - Active Press: `.active-press` (`active:scale-[0.98] transition-transform duration-100 ease-out`).
  - Focus Ring: `.focus-ring` (2px accent-ring, 2px offset).
- **Typography & Numerals:**
  - All token counts, chunk metrics, and numerical displays must use `tabular-nums font-mono`.
- **Forbidden Patterns (Zero Tolerance):**
  - No purple/indigo gradients or glows (`bg-gradient-to-r`).
  - No decorative shadows or glassmorphic blur on UI chrome.
  - No meaningless sparkle icons (`Sparkles`).
  - No uppercase tracked labels (use sentence case).
  - No emojis in buttons or tabs.
