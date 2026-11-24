# 🚀 Release Pre-Flight Verification Checklist (v1.0.0)

This checklist defines the rigorous pre-flight verification requirements for ChunkLens releases. Every item must be validated before production deployment.

---

## 1. Zero Document Egress & CSP Audit

ChunkLens is designed with a strict zero-backend, client-side execution model. No user documents, tokens, or document telemetry must ever leave the browser.

- [ ] **Content Security Policy Enforcement:**
  - Build the production bundle: `npm run build`.
  - Preview production build: `npm run preview`.
  - In DevTools (`F12`), open the **Network** tab and inspect initial document response headers or meta tags.
  - Verify CSP contains `connect-src 'self' https://api.web3forms.com`.
- [ ] **Runtime Egress Test:**
  - Clear the Network log.
  - Load sample corpora (API Reference, SaaS Agreement, Financial 10-Q, CSV Catalog).
  - Upload a local plain text file, a markdown file, and a CSV file.
  - Switch chunking algorithms across all 5 strategies.
  - Change tokenizer profiles across all 6 models.
  - Toggle between Stream and Cards views; open Heatmap and Comparison modals.
  - Trigger JSON and CSV data exports.
  - **Pass Criteria:** The Network tab must show **exactly 0** outbound HTTP/HTTPS/WebSocket requests after initial static asset load (excluding optional Pro waitlist form submission).
- [ ] **Offline Capability:**
  - In DevTools Network tab, toggle **Offline** mode.
  - Switch chunking parameters, change algorithms, and navigate chunks.
  - **Pass Criteria:** Application functions completely without interruption.

---

## 2. Multi-Route SPA & View State Preservation

- [ ] **Root Landing Page (`/`):**
  - Verify hero headline, strategy matrix, interactive simulation, and navigation CTA.
  - Verify "Launch Visualizer" transitions instantly to the Workbench (`/?view=app`).
  - Verify "RAG Academy" transitions to the curriculum map (`/?view=learn`).
- [ ] **Session Document Preservation:**
  - In the Workbench, load an in-progress document.
  - Click the logo to return to the Landing page or visit the Learn Track.
  - Click back to the Workbench: verify the document text, chunk configuration, and active tab are preserved.

---

## 3. 2D Similarity Heatmap & Matrix Continuity

- [ ] **Locked Sticky Corner & Pitch Alignment:**
  - Load a document with $\ge 65$ chunks.
  - Switch to the Similarity Heatmap tab.
  - Scroll horizontally: verify top-left corner spacer (`data-testid="heatmap-corner-spacer"`) stays pinned at `z-40`, preventing column headers from obscuring row numbers.
  - Verify column headers (`#16`, `#17`, `#35`...) align exactly with cell buttons below with 0px drift.
  - Verify cells render all the way through column #65 without truncation or empty black void.
  - Verify self-similarity diagonal (100% / accent) is visible along cell `(i, i)`.
- [ ] **Boundary Continuity Sparkline:**
  - Verify adjacent-neighbor continuity score and sparkline bars reflect sequential transitions.

---

## 4. 29-Lesson RAG Academy & Interactive Widgets

- [ ] **Curriculum Map:**
  - Navigate to `/?view=learn`.
  - Verify all 9 modules (M0 through M8) render with accurate lesson titles and duration estimates.
- [ ] **Interactive Widgets:**
  - Open Lesson 0.1: verify `V1PipelineFlowExplorer` renders interactive flow nodes.
  - Open Lesson 3.2: verify `V2ChunkSandbox` allows real-time slider adjustments without lag.
- [ ] **Quizzes & Progress:**
  - Select quiz answers: verify instant feedback and detailed engineering rationales.
  - Reload page: verify module completion checkmarks persist locally in `localStorage`.

---

## 5. Automated Verification Gates

Run the automated verification suite before merging to `main`:
```bash
# 1. Typecheck
npm run typecheck

# 2. Vitest Suite (433 tests)
npm test

# 3. Bundle Budgets
npm run check:bundle

# 4. Compatibility Quick Suite (16 tests)
npm run test:compat:quick

# 5. Heatmap Alignment E2E (2 tests)
npx playwright test e2e/heatmapAlignment.spec.ts
```

---

## 2. Real-World PDF Parsing & Error Resilience

PDF parsing executes in an isolated client-side Web Worker with script evaluation disabled (`isEvalSupported: false`).

- [ ] **Multi-Page Complex Document Validation:**
  - Upload a multi-page PDF with complex technical formatting (e.g. `tests/fixtures/sample.pdf` or real-world technical manual).
  - Verify text extraction completes cleanly and chunk boundaries align with content.
  - Upload the identical PDF a second time in succession.
  - **Pass Criteria:** No `ArrayBuffer is detached` exceptions; memory is reclaimed, and chunks update cleanly.
- [ ] **Error Classification & Safe Reporting:**
  - **Corrupt File:** Upload a non-PDF file renamed with `.pdf` extension.
    - *Pass Criteria:* Error banner displays `Unable to parse PDF: Invalid or corrupted PDF structure` with copyable technical details.
  - **Password-Protected File:** Upload an encrypted PDF.
    - *Pass Criteria:* Error banner displays `Password-protected PDF files cannot be processed client-side`.
  - **Zero-Byte File:** Upload a 0-byte file (`touch empty.pdf`).
    - *Pass Criteria:* Error banner displays `Uploaded file is empty (0 bytes)`.
  - **Fallback State:** On upload failure, verify the previously active document remains loaded and visible.

---

## 3. Responsive Layout & Mobile Viewport Smoke Test

ChunkLens must be fully functional across desktop and mobile screens without horizontal document overflow or truncated critical elements.

- [ ] **375px Viewport (Mobile / iPhone SE):**
  - Set viewport to 375x667 in DevTools device emulation.
  - In console, verify: `document.documentElement.scrollWidth <= document.documentElement.clientWidth`.
  - Open sidebar drawer via hamburger / drawer control; verify it slides in cleanly with overlay and closes on backdrop click or `Esc`.
  - Verify the Continuous Stream / Separated Cards segmented control does not wrap or overflow.
  - Verify the chunk `#01` and token gutter stacks horizontally above chunk text, allowing full-width reading.
  - Verify error banners and sample cards fit without text clipping or horizontal scroll.
  - In header, verify brand title, version badge, and privacy shield maintain >= 6px spacing without collisions.
- [ ] **768px Viewport (Tablet / iPad):**
  - Set viewport to 768x1024.
  - Verify metrics strip wraps cleanly into left-aligned rows with hairline dividers (`border-l border-border-subtle`).
  - Verify Export and Privacy controls remain fully accessible.
- [ ] **1024px Viewport (Small Laptop):**
  - Set viewport to 1024x768.
  - Verify privacy shield docks cleanly beside right-side actions rather than floating mid-header.
  - Verify metrics bar maintains clear visual hierarchy without overflow.

---

## 4. Theme & Accessibility Contrast Verification

All text and essential interactive UI controls must satisfy WCAG 2.2 AA contrast standards.

- [ ] **Dark Theme:**
  - Primary text (`text-text-primary`): contrast ratio $\ge 4.5:1$ against surface background (`bg-surface-base` / `bg-surface-elevated`).
  - Secondary text (`text-text-secondary`): contrast ratio $\ge 4.5:1$ against surface background.
  - Interactive icons and essential borders: contrast ratio $\ge 3:1$ against surface background.
  - Danger banner (`status-danger` / `status-danger-border`): icon and border contrast $\ge 3:1$ against banner background.
- [ ] **Light Theme:**
  - Verify contrast tokens adapt to light theme surfaces, ensuring text $\ge 4.5:1$ and UI borders/icons $\ge 3:1$.
  - Danger banner maintains high contrast and legible error text.
- [ ] **Typography Sizing:**
  - Inspect computed styles across all views; verify no interactive elements or body text render below 12px font size.

---

## 5. Keyboard Navigation & Focus Management

All core flows must be fully operable via keyboard alone.

- [ ] **Global Shortcuts:**
  - `⌘K` / `Ctrl+K`: Opens Command Palette.
  - `[`: Toggles left configuration sidebar.
  - `]`: Toggles right chunk inspector.
  - `J` / `ArrowRight`: Advances selection to next chunk.
  - `K` / `ArrowLeft`: Retreats selection to previous chunk.
  - `C`: Copies selected chunk text to clipboard with toast confirmation.
  - `Esc`: Clears active chunk selection or dismisses open modals.
- [ ] **Modal Focus Trapping & Return:**
  - Open Export Modal (`Export` button). Focus should trap inside dialog.
  - Press `Esc`. Focus must return cleanly to the `Export` button that triggered it.
  - Open Command Palette (`⌘K`). Type search query, navigate with arrow keys, select an item or press `Esc`. Focus must return to previous document target.

---

## 6. Zero External Tracking & Production Supply Chain

- [ ] **Zero Analytics / Telemetry:**
  - Verify `package.json` contains no analytics dependencies (Google Analytics, Segment, PostHog, Sentry, Mixpanel, Datadog).
  - Verify `index.html` contains no external tracking scripts or external font CDN `<link>` tags.
- [ ] **Self-Hosted Local Fonts:**
  - Confirm fonts (`JetBrains Mono`, `Plus Jakarta Sans`) are loaded exclusively from `/fonts/` as self-hosted WOFF2 files.
  - In Network tab, confirm font requests are directed to origin `/fonts/*` and return valid WOFF2 signatures (`wOF2`).
  - Confirm `/fonts/*` caching header is configured to `public, max-age=604800`.
- [ ] **Security Headers:**
  - Verify `public/_headers` and `vercel.json` enforce:
    - `X-Content-Type-Options: nosniff`
    - `X-Frame-Options: DENY`
    - `Referrer-Policy: no-referrer`
    - `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`

---

## 7. Automated Quality Gates

Before tagging a release commit:
- [ ] `npm run typecheck` passes with zero TypeScript diagnostic errors.
- [ ] `npm test` passes all unit and integration test suites.
- [ ] `npm run build` succeeds.
- [ ] `node scripts/check-bundle.cjs` confirms raw bundle sizes within ratchet limits:
  - `dist/assets/index-*.js` $\le 185\text{ kB}$ raw
  - `dist/assets/index-*.css` $\le 45\text{ kB}$ raw
- [ ] `npm audit --omit=dev --audit-level=high` reports zero high or critical vulnerabilities in production dependencies.
