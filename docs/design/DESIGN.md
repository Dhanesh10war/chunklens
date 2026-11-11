# ChunkLens Design System & Visual Specification
**Product:** ChunkLens — Visual Document Chunking & Token Optimization Workbench for RAG Pipelines  
**Aesthetic Direction:** Precision Developer Instrument (Linear / Raycast / Grafana Craft)  
**Status:** Living Design Specification (v1.0.0)  

---

## 1. Design Principles

1. **Precision Instrument Over Decorative Showcase:**  
   ChunkLens is a scientific tool for AI engineers optimizing vector embedding distributions and cost. Every pixel must communicate data, boundary structure, or state. Remove all decorative gradients, neon glow blurs, and meaningless sparkle icons.

2. **High Data-Ink Ratio & Scannability:**  
   Display dense token density, offset ranges, and cost metrics with immediate visual distinction. Monospace numerals must always use tabular figures (`tabular-nums`) to prevent jitter during reactive re-chunking.

3. **Tactile & Responsive Direct Manipulation:**  
   In accordance with Emil Kowalski & Apple fluid design standards, every pressable button and toggle must respond instantly on pointer-down with subtle tactile compression (`active:scale-[0.98]`, duration 120ms, ease-out curve).

4. **Crisp Structural Depth (Hairline Borders > Glassmorphism):**  
   Replace fuzzy glassmorphic backdrop blurs and heavy card drop-shadows with razor-sharp 1px structural borders (`border-[#1a2336]`) and subtle inset highlights (`inset 0 1px 0 0 rgba(255,255,255,0.04)`).

5. **Accessibility by Default (WCAG 2.2 AA):**  
   All interactive targets meet or exceed 40–44px hit bounds (via padding or pseudo-elements); all text/background pairs maintain >= 4.5:1 contrast; all interactive elements feature high-visibility `:focus-visible` outline rings.

---

## 2. Color System & Semantic Tokens

### Core Neutral Palette (Obsidian Slate)
| Token | Hex Value | Usage | WCAG Contrast on BG |
| :--- | :--- | :--- | :--- |
| `--bg-canvas` | `#080c14` | Deepest root canvas background | Base |
| `--bg-panel` | `#0d1422` | Toolbar, header, and sidebar panels | Structural tier 1 |
| `--bg-elevated` | `#131c30` | Cards, inputs, and interactive surfaces | Structural tier 2 |
| `--bg-subtle` | `#1a2640` | Hover states and active segment fills | Structural tier 3 |
| `--border-subtle`| `#162034` | Internal grid dividers | Inset borders |
| `--border-default`| `#212f4c`| Standard container and card outlines | Boundary definition |
| `--border-hover` | `#334770` | Focus and hovered element borders | Interactive signal |

### Typography & Foreground Neutrals
| Token | Hex Value | Usage | Contrast on Canvas |
| :--- | :--- | :--- | :--- |
| `--text-primary` | `#f1f5f9` (`slate-100`)| Primary headlines, chunk text, values | **15.2:1** (AAA) |
| `--text-secondary`| `#94a3b8` (`slate-400`)| Field labels, descriptions, units | **6.8:1** (AA) |
| `--text-muted` | `#64748b` (`slate-500`)| Structural metadata, indices, brackets | **4.6:1** (AA) |

### Technical Brand Accent & Semantic Status Colors
| Role | Color Name | Base Hex | Alpha Surface | Contrast Ratio |
| :--- | :--- | :--- | :--- | :--- |
| **Brand Accent** | Precision Cobalt | `#3b82f6` (`blue-500`) | `rgba(59, 130, 246, 0.12)` | **5.4:1** on dark |
| **Success / Safe** | Emerald | `#10b981` (`emerald-500`) | `rgba(16, 185, 129, 0.12)` | **6.1:1** on dark |
| **Warning / Overlap**| Amber | `#f59e0b` (`amber-500`) | `rgba(245, 158, 11, 0.14)` | **7.2:1** on dark |
| **Danger / Orphan** | Crimson | `#ef4444` (`red-500`) | `rgba(239, 68, 68, 0.14)` | **5.1:1** on dark |
| **Tokenizer Model** | Cyan | `#06b6d4` (`cyan-500`) | `rgba(6, 182, 212, 0.12)` | **6.7:1** on dark |

### Chunk Stratification Cycle (5 Categorical Spectrum Colors)
Designed for visual chunk discrimination in Cards and Stream views with matched luminance:
1. **Index 0:** Indigo (`#818cf8`, bg: `rgba(99, 102, 241, 0.10)`, border: `rgba(99, 102, 241, 0.28)`)
2. **Index 1:** Cyan (`#22d3ee`, bg: `rgba(6, 182, 212, 0.10)`, border: `rgba(6, 182, 212, 0.28)`)
3. **Index 2:** Emerald (`#34d399`, bg: `rgba(16, 185, 129, 0.10)`, border: `rgba(16, 185, 129, 0.28)`)
4. **Index 3:** Amber (`#fbbf24`, bg: `rgba(245, 158, 11, 0.10)`, border: `rgba(245, 158, 11, 0.28)`)
5. **Index 4:** Rose (`#fb7185`, bg: `rgba(244, 63, 94, 0.10)`, border: `rgba(244, 63, 94, 0.28)`)

---

## 3. Typography Scale & Layout Foundations

### Font Families
- **Interface Sans:** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- **Engine Monospace:** `"JetBrains Mono", "SF Mono", "Fira Code", Menlo, Monaco, Consolas, monospace`
- **Rule:** All numeric data, tokens, characters, metrics, and code must declare `font-mono tabular-nums`.

### Scale & Hierarchy
| Level | Font Size | Tracking | Weight | Case | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | 18px (`text-lg`) | `-0.02em` | SemiBold (600) | Title Case | Application Title |
| **Section** | 14px (`text-sm`) | `-0.01em` | SemiBold (600) | Title Case | Modal & Canvas Headers |
| **Body** | 13px (`text-[13px]`)| Normal | Regular (400) | Sentence | Inspector Text, Chunks |
| **Control** | 12px (`text-xs`) | Normal | Medium (500) | Sentence | Buttons, Selects, Inputs |
| **Micro** | 11px (`text-[11px]`)| `+0.04em` | SemiBold (600) | UPPERCASE | Badges, Section Category Labels |

---

## 4. Component Micro-Specifications

### Buttons & Segmented Controls
- **Standard Button Height:** 32px (Desktop compact tool standard, minimum 44px clickable target box).
- **Surface:** Inset 1px subtle top highlight, sharp 1px border.
- **Active State:** `active:scale-[0.98] transition-transform duration-100 ease-out`.
- **Focus Ring:** `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080c14] focus-visible:outline-none`.

### Inputs, Sliders & Selects
- Dark inset background (`#080c14`), hairline border (`#212f4c`), hover state (`border-[#334770]`), active focus state (`border-blue-500 ring-1 ring-blue-500/40`).
- Range sliders: Custom styled 4px track with a 14px circular precision thumb and numeric readout.

### Chunk Cards & Stream Blocks
- Cards feature explicit metadata strip: Chunk `#`, Section Header breadcrumb, Character range `[start:end]`, and BPE Token Count badge.
- Warning banner for mid-word cuts (`isOrphan: true`) rendered in amber/red alert badge.
- Overlap indicator: Clean dotted underline with tooltip explaining character overlap retention.

### Modals & Drawers
- Deep darkened backdrop with 60% opacity (no blur), solid elevation surface with inset top border highlight.
- Smooth origin-aware entrance (`scale(0.98)` to `scale(1)` at 160ms with cubic-bezier easing).

---

## 5. Implementation & Refactoring Plan

- **Batch 1 (Design Tokens & Global Theme Foundations):**
  - Update `tailwind.config.js` and `src/index.css` with exact precision instrument tokens, custom scrollbars, and focus rings.
- **Batch 2 (Header & Controls Toolbar Precision Overhaul):**
  - Refactor `src/components/Header.tsx` (remove purple gradients and glow shadows, replace with crisp monochrome aperture brand mark).
  - Refactor `src/components/ControlsPanel.tsx` (remove Sparkles icon, standardize input heights, accessible tap targets, unified 12px typography).
- **Batch 3 (Metrics Bar & Visual Canvas Card/Stream Polish):**
  - Polish `src/components/MetricsBar.tsx` with `tabular-nums` and consistent icon-badge alignments.
  - Redesign `src/components/VisualCanvas.tsx` with clean card hierarchy, accessible stepper navigation, and refined continuous stream view.
- **Batch 4 (Comparison View & Export Modal Polish):**
  - Refactor `src/components/ComparisonView.tsx` with matching split headers, clear Variant A vs B visual tokens, and seamless promotion.
  - Polish `src/components/ExportModal.tsx` with high-contrast tab controls and clean download triggers.
