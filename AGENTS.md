# ChunkLens Agent Map

## Golden Commands
- **Install:** `npm ci` (or `npm install`)
- **Lint / Type-Check:** `npm run lint` / `npm run typecheck` (`tsc -b`)
- **Unit Tests:** `npm run test` (`vitest run`)
- **Verbose Tests:** `npm run test:verbose` (`vitest run --reporter=verbose`)
- **Production Build:** `npm run build` (`tsc -b && vite build`)
- **Local Dev Server:** `npm run dev` (`vite`)

## Architecture Pointers
- **Engine Core (`src/engine/`):**
  - `chunkers/`: Algorithm implementations (`markdownChunker`, `sentenceChunker`, `recursiveChunker`, `fixedChunker`, `utils.ts`).
  - `tokenizers/`: BPE tokenizer wrapper (`tokenizer.ts` using `js-tiktoken`).
  - `types.ts`: Universal schemas (`ChunkingConfig`, `ChunkMetadata`, `ChunkingResult`).
- **Exporters (`src/exporters/`):**
  - `codeExporters.ts`: Strategy-aware Python/TS code generator.
  - `dataExporters.ts`: RFC 4180 CSV & JSON dataset generator.
- **State & Utilities (`src/utils/`):**
  - `storage.ts`: Isomorphic `localStorage` persistence with schema defaults.
  - `clipboard.ts`: Async clipboard write with `execCommand('copy')` fallback for headless/test environments.
  - `cn.ts`: Class name merger (`clsx` + `tailwind-merge`).
- **UI Components (`src/components/`):**
  - `ControlsPanel.tsx`, `MetricsBar.tsx`, `VisualCanvas.tsx`, `ComparisonView.tsx`, `ExportModal.tsx`, `Header.tsx`.

## Do-Not-Modify List
- `package-lock.json` (do not hand-edit).
- `dist/`, `tsconfig.tsbuildinfo` (generated build artifacts).
- Zero server-side backends or network tracking: all document parsing and tokenization must remain 100% in-browser.

## Known Traps
- **Node vs Browser Globals in Tests:** Vitest runs in Node. Browser globals (`window`, `localStorage`, `navigator.clipboard`) are undefined unless guarded with `typeof window !== 'undefined'` or isomorphic fallbacks.
- **Strict TypeScript:** `"noUnusedLocals": true` and `"noUnusedParameters": true` cause compile failures on unused imports or args.
- **Large Tokenizer Bundle:** `js-tiktoken` vocab is 5.6 MB. `vite.config.ts` uses `manualChunks` to keep application code under 100 kB. Never remove chunk splitting.
- **Execution Directory:** The repository is located at `/home/drago/projects/Venture/chunklens`. Always run commands inside `chunklens/`.
