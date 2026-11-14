# 🚀 Release Pre-Flight Verification Checklist (v0.3.0)

This checklist defines the rigorous pre-flight verification requirements for ChunkLens releases. Every item must be validated before production deployment.

---

## 1. Zero Network Egress & CSP Audit

ChunkLens is designed with a strict zero-backend, client-side execution model. No user documents, tokens, or telemetry must ever leave the browser.

- [ ] **Content Security Policy Enforcement:**
  - Build the production bundle: `npm run build`.
  - Preview production build: `npm run preview`.
  - In DevTools (`F12`), open the **Network** tab and inspect initial document response headers or meta tags.
  - Verify CSP contains `connect-src 'none'`.
- [ ] **Runtime Egress Test:**
  - Clear the Network log.
  - Load sample corpora (Constitution, Tech Spec, State of the Union).
  - Upload a local plain text file, a markdown file, and a CSV file.
  - Switch chunking algorithms across all 5 strategies.
  - Change tokenizer profiles across all 6 models.
  - Toggle between Stream and Cards views; open Heatmap and Comparison modals.
  - Trigger JSON and CSV data exports.
  - **Pass Criteria:** The Network tab must show **exactly 0** outbound HTTP/HTTPS/WebSocket requests after initial static asset load.
- [ ] **Offline Capability:**
  - In DevTools Network tab, toggle **Offline** mode.
  - Switch chunking parameters, change algorithms, and navigate chunks.
  - **Pass Criteria:** Application functions completely without interruption.

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
