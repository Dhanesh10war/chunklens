# ChunkLens Compatibility & Responsiveness Specification

This document details the multi-engine, multi-device, input-adaptive, and accessibility standards implemented across ChunkLens (landing page and workbench application).

---

## 1. Multi-Engine & Browser Platform Support

ChunkLens is designed and continuously verified across three major browser rendering engines:
- **`chromium`** (desktop, simulated mobile, high-DPI displays)
- **`firefox`** (desktop, narrow viewports, custom theme styling)
- **`webkit`** (desktop, fluid layout, backdrop filters, safe-area insets)

### Architectural Guardrails
1. **Zero External Egress:** Strict Content Security Policy (`default-src 'self'`) prohibits external fonts, CDNs, analytics, and third-party trackers. All fonts (`Inter`, `JetBrains Mono`) and tokenizers run 100% locally in-browser via WebAssembly and Web Workers.
2. **Standard-Compliant Color Spaces:** Native `oklch()` color tokens provide perceptual lightness uniformity with in-gamut sRGB fallbacks guarded via `@supports not (color: oklch(0% 0 0))`.
3. **Hardware-Accelerated UI Rendering:** Off-canvas drawers, modal bottom sheets, and translucent headers use `transform`, `opacity`, and `contain-intrinsic-size` for 60fps frame rates on low-power devices.

---

## 2. Responsive Viewport Matrix

ChunkLens dynamically adapts across viewports from **320px to 3440px** without horizontal page overflow (`scrollWidth <= clientWidth` holds strictly across all views):

| Form Factor | Viewport Dimensions | Responsive Behavior |
| :--- | :---: | :--- |
| **Ultra-narrow / 400% Zoom** | `320 x 568` | Single-column fluid layout; workbench sidebar converts to full off-canvas drawer with focus trap; metrics bar collapses to wrap grid; modal dialogs convert to bottom sheets. |
| **Short Landscape Phone** | `390 x 340` | Minimal header height; scrollable inspector drawer; clamped modal heights with internal scroll containers (`max-h-modal`). |
| **Standard Mobile** | `390 x 844` | Off-canvas navigation drawer with backdrop scrim; touch-optimized bottom sheets; chunk reading column optimized for single-thumb scroll. |
| **Phablet / Small Tablet** | `600 x 960` | Adaptive grid view; expandable chunk comparison panels; segmented tab controls. |
| **Tablet Portrait** | `768 x 1024` | Sidebar togglable as off-canvas drawer; metrics summary displayed inline; chunk cards wrap with 16px padding. |
| **Tablet Landscape** | `1024 x 768` | Persistent sidebar; compact toolbar action buttons; dual-pane inspector and visual canvas layout. |
| **Standard Laptop** | `1280 x 800` & `1366 x 768` | Full desktop workbench view; icon-labeled toolbar controls; heat map side inspector. |
| **Full HD Desktop** | `1920 x 1080` | High-density similarity heatmap; split-screen tokenizer comparison; sticky reading headers. |
| **QHD & Ultrawide** | `2560 x 1440` & `3440 x 1440` | Max-width content containers (`max-w-4xl` for continuous reading, `max-w-7xl` for landing sections) prevent eye-strain and overstretched line lengths. |

---

## 3. Touch, Pointer, and Input Adaptation

ChunkLens provides first-class support for both high-precision pointers (mouse, trackpad) and coarse pointers (touchscreens):

- **Touch Target Sizes (WCAG 2.2 AA / AAA):**
  - All interactive buttons, checkboxes, segmented controls, and menu triggers meet the minimum requirement of $\ge 24\text{px} \times 24\text{px}$, with primary buttons sized to $36\text{px}$ to $44\text{px}$.
  - Range sliders (`SliderWithInput`) feature a $28\text{px}$ touch-target bounding box with a 6px centered visual track to allow effortless finger drag without misclicks.
- **Mobile Browser Zoom Prevention:**
  - All text inputs (`<input>`, `<select>`, `<textarea>`) feature `text-base sm:text-xs` (16px font size on viewports under 640px) to prevent mobile browsers from triggering unwanted auto-zoom on input focus.
- **2D Spatial Grid Keyboard Navigation:**
  - Similarity Heatmap supports 2D arrow-key spatial navigation (`ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`) to traverse matrix cells with synchronized DOM focus and side inspector updates.
- **Bidirectional Text (BiDi / RTL):**
  - All chunk text containers feature `dir="auto"` to automatically render right-to-left languages (e.g. Arabic, Hebrew) with correct text alignment and reading order.

---

## 4. User Preferences & Operating System Settings

- **Dark & Light Mode:**
  - Full support for both themes with zero contrast regressions.
  - Body text exceeds 7:1 contrast ratio against core surfaces.
  - Accent text uses `--text-accent` providing $\ge 5.3:1$ against dark surfaces and $\ge 5.4:1$ against light surfaces.
- **High Contrast (`prefers-contrast: more`):**
  - High-contrast media query increases separator contrast (`rgba(0,0,0,0.45)` in light, `rgba(255,255,255,0.45)` in dark), raises secondary text contrast to $> 10:1$, and adds prominent `1.5px` element borders.
- **System High Contrast / Forced Colors (`forced-colors: active`):**
  - Maps UI tokens directly to system semantic keywords (`Canvas`, `CanvasText`, `Highlight`, `HighlightText`, `ButtonBorder`), maintaining full readability in system accessibility modes.
- **Reduced Motion (`prefers-reduced-motion: reduce`):**
  - When active, animations and transitions are clamped to `0.01ms` with `scroll-behavior: auto !important`, instantly updating state without disorienting movement.
- **Print Stylesheet (`@media print`):**
  - Hides application navigation, sidebars, toolbar controls, and action buttons.
  - Renders chunk content on a clean `#ffffff` background with `#000000` text, ensuring high-contrast printouts and PDF exports with zero pagination clipping (`break-inside: avoid`).

---

## 5. Performance Benchmarks & Budget Limits

- **CSS Bundle Budget:** $\le 45.00\text{ kB}$ (Production bundle: $44.85\text{ kB}$).
- **JavaScript Bundle Budget:** $\le 185.00\text{ kB}$ (Production bundle: $167.05\text{ kB}$).
- **Virtualization & Layout Throttling:**
  - Chunk cards in Stream View and Grid View use `content-visibility: auto; contain-intrinsic-size: 0 120px;` to skip layout and paint for offscreen cards, maintaining smooth 60fps scrolling on documents with 300+ chunks.
  - Similarity Heatmap rows use `content-visibility: auto; contain-intrinsic-size: 0 36px;` to skip offscreen rows in large matrices up to $150 \times 150$.
