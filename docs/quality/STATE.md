# Quality State & Continuous Improvement Tracking
**Project:** ChunkLens — Client-side document chunking and token cost workbench for RAG  
**Current Release:** v0.3.0  
**Date:** November 14, 2026  
**Branch:** `agent/release-v0.3`  

---

## 1. Executive Status
- **Health:** Production Grade (v0.3.0 Release)
- **TypeScript:** Strict type-checking passed (`npm run typecheck`, 0 diagnostic errors)
- **Linting:** Defined in `package.json` as `"tsc -b"`; duplicate of typecheck, marked `UNMEASURED` and omitted from CI.
- **Unit & Integration Tests:** 124 tests passing across 20 test suites (`npm test`, 100% pass, 0 flaky)
- **Custom DOM A11y Checks:** 0 violations across loaded, empty, and error states at 1440px and 375px viewports (button names, form labels, duplicate IDs, ARIA roles, tabindex verified).
- **Axe-Core & Playwright E2E Status:** Staged and configured (`e2e/networkEgress.spec.ts`, `e2e/accessibility.spec.ts`); marked written, not yet run locally (runs in GitHub Actions CI via `npx playwright install --with-deps chromium`).
- **Zero Network Egress:** Strict CSP (`connect-src 'none'`) verified live via Chrome DevTools Protocol (`scripts/test-egress.cjs`).
- **Export Button Contrast:** Measured 6.29:1 rendered contrast in Chrome browser (`#FFFFFF` on `#4F46E5`), satisfying WCAG 2.2 AA $\ge 4.5:1$. Split tokens guarantee 7.90:1 in light mode (`#4338CA`) and 6.29:1 in dark mode (`#4F46E5`).
- **Typography Floor & Labels:** Strict 12px text floor verified by automated code grep rule and browser computed-style audit (0 sub-12px elements). Real UI labels verified: Algorithm, Separators hierarchy, Measurement unit, Tokenizer encoding, and Size & overlap.
- **Bundle Architecture:** Code-split with heavy modals (`TokenizerComparisonModal`, `ExportModal`, `CommandPalette`, `ComparisonView`, `SimilarityHeatmap`) lazy-loaded via `React.lazy`, bringing `index.js` down to **132.99 kB raw** (40.33 kB gzip), well below the 185 kB budget limit. CSS is **33.17 kB raw** (7.11 kB gzip), well below the 45 kB budget limit.

---

## 2. Release Ratchet Table

| Metric | v0.2.0 Baseline (`ffb2f16`) | Current v0.3.0 Release | Status |
| :--- | :---: | :---: | :--- |
| **Unit / Integration Tests** | 86 (12 suites) | **124 (20 suites)** | ✅ Ratcheted (+38) |
| **TypeScript Diagnostics** | 0 errors (`tsc -b`) | **0 errors (`tsc -b`)** | ✅ Clean |
| **Linting** | UNMEASURED (`tsc -b` duplicate) | **UNMEASURED (`tsc -b` duplicate)** | ℹ️ Duplicate of typecheck |
| **Custom DOM A11y Violations (1440 & 375)** | 0 | **0 (Loaded, Empty, Error)** | ✅ Zero violations |
| **Axe-Core / Playwright E2E Status** | UNMEASURED | **Written, runs in CI** | 🔄 GitHub Actions gate |
| **External Network Requests** | Google Fonts | **0 (Strict CSP `connect-src 'none'`)** | ✅ Verified zero egress |
| **Main JS Bundle (`index.js` Raw / Gzip)** | 172.06 kB / 48.33 kB | **132.99 kB / 40.33 kB** | ✅ 52.01 kB under budget |
| **React Vendor Bundle (Raw / Gzip)** | 134.67 kB / 43.22 kB | **134.67 kB / 43.22 kB** | ✅ Stable |
| **Lucide Icons Chunk (Raw / Gzip)** | 23.89 kB / 6.10 kB | **27.28 kB / 6.90 kB** | ✅ Compact |
| **PDF Engine (`pdfjs-dist` Raw / Gzip)** | 512.51 kB / 155.91 kB | **512.51 kB / 155.91 kB** | ✅ Isolated chunk |
| **PDF Worker Chunk (Raw)** | 1,298.21 kB | **1,298.21 kB** | ✅ Dedicated worker |
| **Tiktoken Tokenizer Chunk (Raw / Gzip)** | 5,603.11 kB / 2,567.88 kB | **5,603.11 kB / 2,567.88 kB** | ✅ Lazy vendor chunk |
| **Chunking Worker Chunk (Raw)** | 5,613.94 kB | **5,613.94 kB** | ✅ Dedicated worker |
| **CSS Bundle (Raw / Gzip)** | 28.50 kB / 5.80 kB | **33.17 kB / 7.11 kB** | ✅ 11.83 kB under budget |
| **Index HTML (Raw / Gzip)** | 1.20 kB / 0.60 kB | **1.79 kB / 0.86 kB** | ✅ Strict CSP headers |
| **Export Button Contrast (WCAG 2.2 AA)** | UNMEASURED | **6.29:1 (dark) / 7.90:1 (light)** | ✅ $\ge 4.5:1$ passed |
| **Typography Text Floor** | 10px | **12px (0 sub-12px elements)** | ✅ Strict floor enforced |
| **Shield vs Version Bounding Box Gap (375px)** | UNMEASURED | **14.1px** | ✅ $\ge 6$px enforced |
| **Horizontal Page & Strip Overflow** | UNMEASURED | **0 (scrollWidth $\le$ clientWidth across 1440/1024/768/375)** | ✅ Zero overflow |

---

## 3. Issue Backlog (v0.3.0 Releases)

| ID | Severity | Impact | Priority | Effort | Score | Evidence | Proposed Fix | Status |
| :---: | :--- | :---: | :---: | :---: | :---: | :--- | :--- | :---: |
| **ISS-26** | High | 4 | Must (3) | S (1) | 12.0 | Detached ArrayBuffer on re-reading identical PDF bytes. | Isolating byte copies via `new Uint8Array(source.length)` and ensuring `destroy()` in `finally`. | ✅ FIXED (`3.3`) |
| **ISS-27** | High | 4 | Must (3) | S (1) | 12.0 | Google Fonts dependency causes external network egress. | Downloaded and self-hosted WOFF2 fonts with `connect-src 'none'` CSP. | ✅ FIXED (`3.1`) |
| **ISS-28** | Med | 3 | Should (2) | S (1) | 6.0 | Raw `index.js` bundle breached 185 kB threshold (188.65 kB). | Lazy-loaded heavy modal dialogs via `React.lazy`, dropping bundle to 132.99 kB. | ✅ FIXED (`2b`) |
| **ISS-29** | Med | 3 | Should (2) | S (1) | 6.0 | Export button failed WCAG AA contrast (3.63:1). | Split accent tokens into `--accent-solid` and `--on-accent` yielding 6.29:1 / 7.90:1. | ✅ FIXED (`3.7`) |
| **ISS-30** | Med | 2 | Should (2) | S (1) | 4.0 | Multiple sub-12px font definitions in UI. | Replaced with strict `text-xs` (12px) floor and verified via computed style checks. | ✅ FIXED (`3.7`) |
| **ISS-31** | Low | 2 | Should (2) | S (1) | 4.0 | Header shield touched version badge at 375px. | Fixed spacing and layout to ensure $\ge 6$px bounding box gap (14.1px measured). | ✅ FIXED (`V2`) |
| **ISS-32** | Low | 2 | Should (2) | S (1) | 4.0 | Error banner lacked danger color tokens. | Defined `--status-danger` tokens with verified $\ge 3:1$ icon contrast and 5.45:1 text contrast. | ✅ FIXED (`V4`) |
| **ISS-33** | Low | 2 | Could (1) | S (1) | 2.0 | Metrics strip used pipe characters and overflowed horizontally. | Converted to compact wrapped rows with CSS hairline dividers below `xl`. | ✅ FIXED (`V7`) |
| **ISS-34** | Low | 2 | Could (1) | S (1) | 2.0 | Chunk gutter squeezed text reading column at 375px. | Stacked `#01 / token gutter` above chunk text on mobile viewports. | ✅ FIXED (`V8`) |

---

## 4. Decisions Log & "Won't Do" Items

- **DECISION-01:** Strictly client-side execution model. Zero document content transmission over the network; privacy guaranteed.
- **DECISION-02:** Strict Content Security Policy (`connect-src 'none'`) enforced on all production builds and deployment targets.
- **DECISION-03:** Lazy-load modals and comparison views with `React.lazy` to keep the main bundle well below the 185 kB budget.
- **DECISION-04:** Enforce a strict 12px typography floor across all UI components for WCAG 2.2 accessibility.
- **DECISION-05:** Pre-flight verification checklist must be passed prior to production release tags.
- **WON'T DO:** Weakening axe-core rules or skipping accessibility requirements.
- **WON'T DO:** External CDN font dependencies or analytics telemetry services.
- **WON'T DO:** Server-side document parsing or OCR processing.
