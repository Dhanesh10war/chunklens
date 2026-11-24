# ChunkLens Launch Film Asset Credits & Licensing Register

> **Status:** Phase 1 Initialization  
> **Rule Enforcement:** Every font, music track, sound effect, and visual asset utilized in the production of the launch film must be logged here with its verified commercial-use license and source.

---

## 1. Typography

| Asset / Font Family | Usage | License | Source / Verification |
| :--- | :--- | :--- | :--- |
| **System Sans-Serif** | Narrative cards, UI labels, captions | System native font stack | Pre-installed OS system font stack (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `Helvetica Neue`, `sans-serif`). No external egress or license fee. |
| **Monospaced System** | Token numbers, character offsets, matrix coordinates | System native monospace | `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`. |
| **Instrument Serif** | Editorial brand display titles | SIL Open Font License 1.1 (OFL) | Self-hosted WOFF2 in `/public/fonts/`. Free for commercial use. |

---

## 2. Audio & Sound Design

| Asset | Usage | License | Source / Generation Method |
| :--- | :--- | :--- | :--- |
| **Ambient Synth Bed** | Background music track for preview cuts | CC0 / Public Domain / Synthesized | Synthesized locally via deterministic FFmpeg audio evaluation (`aevalsrc`) or user-supplied licensed track. |
| **UI Mechanical Ticks** | Chunk splitting and slider feedback | CC0 / Locally Synthesized | Generated locally via Web Audio API / FFmpeg synthesis. |
| **Incision Sub-Bass Pulse** | Scene 1 hook incision accent | CC0 / Locally Synthesized | Low-frequency sine sweep generated locally. |
| **Voiceover** | Spoken narration | User-owned / Custom recording | Supplied directly by user, or burned-in captions only. |

---

## 3. Visual & Footage Assets

| Asset | Usage | License | Source / Verification |
| :--- | :--- | :--- | :--- |
| **ChunkLens UI Footage** | Scenes 4–8 real product interactions | MIT License (Own Software) | Real UI screen captures recorded locally from production build (`chunklens`). |
| **ChunkLens Brand Icon** | Scene 3 & Scene 9 logo resolves | MIT License (Own Software) | SVG vectors in `src/components/ui/ChunkLensLogo.tsx`. |

---

## 4. Software & Encoding Tooling

| Tool | Purpose | License |
| :--- | :--- | :--- |
| **FFmpeg 6.1.1** | Frame concatenation, H.264 encode, audio mix, loudnorm | LGPL/GPL v2.1+ |
| **Playwright** | Deterministic frame rendering at fixed time intervals | Apache 2.0 |
| **Node.js** | Composition server and build runner | MIT License |
