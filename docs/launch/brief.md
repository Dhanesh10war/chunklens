# ChunkLens Launch Film Creative Brief & Production Spec

> **Status:** Phase 1 Revision 2 — Awaiting User Approval  
> **Pipeline Target:** Local Deterministic Scripted Composition (`scripts/launch/film/` + Playwright + FFmpeg via `image2pipe`)  
> **Rule Enforcement:** Zero app code changes (except dev-only capture tooling); zero egress for app and capture scripts; no vendor, platform, or competitor brand names; every claim verified in `docs/launch/claim-sheet.md`.

---

## 1. Creative Direction & Positioning

- **Positioning Statement:** *"See your chunks before you embed them."*
- **Tone:** Calm, confident, rigorous, understated. Zero hyperbolic hype words (`revolutionary`, `game-changing`, `AI-powered`, `supercharge`).
- **Visual Design:**
  - Strict alignment with application design tokens: deep neutral background (`#0A0A0B` / `#07090E`), single blue/indigo functional accent, restrained 6-hue OKLCH chunk spectrum.
  - Strict typography floor: clean system sans for labels and narrative cards, monospaced tabular numerals (`tabular-nums font-mono`) for all token counts, dimensions, and matrix coordinates.
  - Product photography aesthetics: close-up macro framing of real UI components (chunk cards, matrix cells, stat counters), subtle depth-of-field blur on non-focused layers, soft glow on highlighted elements, and gentle parallax.
- **Motion Language:**
  - Easing: Strict ease-out curves (`cubic-bezier(0.2, 0, 0, 1)`).
  - Duration: Moves run between 0.6s and 1.2s. One camera move per scene (no whip-pans, no bouncing, no rotations).
  - Kinetic typography: Maximum **7 words per card**, held for **at least 1.2 seconds**.
  - Match-cut transitions: A physical zoom into an element (e.g. a heatmap cell) seamlessly transitions into the next macro view.
- **Sound Design:**
  - Restrained ambient/electronic bed ducked cleanly under narration.
  - Soft, tactile UI sound design (subtle mechanical ticks as chunks reflow and cells focus).
  - Voiceover: Calm, measured pacing. If no user recording or natural voice is available, large burned-in captions carry the story alone.
  - Loudness: Target $-14$ LUFS normalized with FFmpeg `loudnorm` filter.
- **Captions:**
  - Burned-in, high-contrast typography placed safely within platform margins (especially critical on 9:16 vertical).
  - Paired with standalone `.srt` subtitle files matching exact scene timings.
- **UI Footage Integrity:**
  - 100% real recordings and stills from the live production preview build (`http://127.0.0.1:4173/?view=app`).
  - Never generated, repainted, or synthesized via AI models. No fake DevTools.

---

## 2. Master Shot List & Script Breakdown (Hero 16:9 Cut — ~63s)

Every line and card maps directly to an entry in `docs/launch/claim-sheet.md`.

```
================================================================================
SCENE 1: THE HOOK (0:00 – 0:03 | Duration: 3.0s)
--------------------------------------------------------------------------------
Visual:     Deep neutral canvas (#07090E). A dense block of technical prose appears.
            A razor hairline incision splits a sentence directly across a word boundary.
Motion:     Slow, subtle push-in (scale 1.0 -> 1.04). Hairline glides horizontally.
On-Screen:  Candidate Hooks (select one):
            - Option 1 (Recommended, <=7 words): "Your pipeline depends on its chunks." [6 words | Held 2.2s]
            - Option 2 (Concise): "Your RAG is only its chunks." [6 words | Held 2.2s]
            - Option 3 (User Variant): "Your RAG is only as good as its chunks." [8 words | Held 2.2s]
Audio:      Low sub-bass ambient pulse. Subtle paper-shear incision sound.
Claim Ref:  C-01

================================================================================
SCENE 2: THE FAILURE MODES (0:03 – 0:10 | Duration: 7.0s)
--------------------------------------------------------------------------------
Visual:     Macro product photography of 3 compounding failure modes using real
            measured metrics from bundled sample "Developer API Reference & Code":
            1. Sheared text line leaving orphaned context across boundary.
            2. Redundant duplicate text blocks stacking up.
            3. Character count (2,007 chars) vs BPE token count (482 doc tokens / 508 ingested tokens).
Motion:     Three crisp, paced match cuts with smooth ease-out settle.
On-Screen:  Card 2A: "Split mid-sentence." [2 words | Held 1.8s]
            Card 2B: "Store the same text twice." [5 words | Held 1.8s]
            Card 2C: "Guess the token count." [4 words | Held 2.0s]
Audio:      Three quiet, tactile warning clicks. Ambient drone drops half a step.
Claim Ref:  C-01, C-02, C-08

================================================================================
SCENE 3: THE REVEAL (0:10 – 0:15 | Duration: 5.0s)
--------------------------------------------------------------------------------
Visual:     Dark canvas lifts. The Partitioned Lens brand mark (original MIT-licensed
            SVG from src/components/ui/ChunkLensLogo.tsx) resolves cleanly in center.
            The workbench interface fades in with the client-side privacy pill.
Motion:     Gentle logo settle; camera pulls back smoothly to reveal the full application shell.
On-Screen:  Card 3A: "ChunkLens." [1 word | Held 1.5s]
            Card 3B: "See chunks before embedding them." [5 words | Held 2.5s]
Audio:      Smooth low-frequency swell. Ambient bed enters with rhythmic clarity.
Claim Ref:  C-01, C-11

================================================================================
SCENE 4: CHUNK REFLOW & TOKEN METRICS (0:15 – 0:27 | Duration: 12.0s)
--------------------------------------------------------------------------------
Visual:     Real UI capture of the Workbench with "Developer API Reference & Code".
            Chunks appear in distinct OKLCH color bands with exact BPE token badges
            (#01: 330 tok, #02: 178 tok, Avg: 254 tok).
            Target chunk size slider adjusts; chunks split and reflow live.
Motion:     Smooth cursor drags slider. Macro zoom into chunk card #01 boundary overlap.
On-Screen:  Card 4A: "Exact BPE token counts." [4 words | Held 2.2s]
            Card 4B: "Watch chunks reflow live." [4 words | Held 2.2s]
Audio:      Soft rhythmic ticks as chunk cards partition.
Claim Ref:  C-02, C-04, C-05

================================================================================
SCENE 5: PAIRWISE SIMILARITY HEATMAP (0:27 – 0:38 | Duration: 11.0s)
--------------------------------------------------------------------------------
Visual:     Switch to Heatmap tab with live 65-chunk catalog. The 2D matrix displays
            pairwise lexical TF-IDF cosine scores with sticky headers.
            Adjacent-Neighbor Boundary Continuity header shows real measured values:
            "64 transitions across 65 chunks | Avg: 47.5%".
            Cursor hovers over high-similarity cells showing score tooltips.
Motion:     Smooth horizontal and vertical pan across the matrix cells.
On-Screen:  Card 5A: "Pairwise lexical similarity matrix." [4 words | Held 2.2s]
            Card 5B: "Spot weak boundaries and overlap." [5 words | Held 2.2s]
Audio:      Subtle high-frequency chimes upon cell hover.
Claim Ref:  C-06, C-07, C-08

================================================================================
SCENE 6: ALGORITHM SWITCHING & COST ESTIMATION (0:38 – 0:46 | Duration: 8.0s)
--------------------------------------------------------------------------------
Visual:     Inspection of the chunking strategy selector switching between 5 splitters
            (Recursive Character, Markdown Header, Sentence Boundary, Tabular, Sliding Window).
            Multi-model token variance inspects token counts across architectures
            (exact BPE vs heuristic estimates).
            Summary metrics strip shows estimated vector cost: "< $0.0001".
Motion:     Smooth focus pull from strategy selector to metrics strip.
On-Screen:  Card 6A: "Switch between 5 splitters." [4 words | Held 2.0s]
            Card 6B: "Estimate embedding cost." [3 words | Held 2.0s]
Audio:      Steady ambient bed continuation.
Claim Ref:  C-03, C-04, C-09

================================================================================
SCENE 7: CODE & DATA EXPORT (0:46 – 0:52 | Duration: 6.0s)
--------------------------------------------------------------------------------
Visual:     The Export modal opens. Shows pre-formatted, production-ready code tabs
            (Python, TypeScript, Native) and one-click JSON/CSV dataset export.
Motion:     Quick tabs toggle between code frameworks.
On-Screen:  Card 7A: "Export settings as code." [4 words | Held 2.5s]
Audio:      Soft affirmative click on export action.
Claim Ref:  C-10

================================================================================
SCENE 8: CLIENT-SIDE PRIVACY PROOF (0:52 – 0:58 | Duration: 6.0s)
--------------------------------------------------------------------------------
Visual:     Honest Proof Options (User Choice):
            - Option A: Real screen recording provided by user showing Chrome DevTools
              Network tab with 0 outbound requests during document chunking.
            - Option B: Real terminal recording running `npm run test:egress` showing
              0 network calls verified by Playwright network interceptor.
            (No fake composition-drawn DevTools allowed).
On-Screen:  Version A (if waitlist form remains):
            - Card 8A: "Runs entirely in your browser." [5 words | Held 2.0s]
            - Card 8B: "Documents never leave your machine." [5 words | Held 2.0s]
            Version B (if waitlist form replaced with mailto/issue & connect-src 'none' restored):
            - Card 8A: "Zero network egress." [3 words | Held 2.0s]
            - Card 8B: "Enforced by browser policy." [4 words | Held 2.0s]
Audio:      Quiet, reassuring tone.
Claim Ref:  C-11, C-12

================================================================================
SCENE 9: OUTRO & CALL TO ACTION (0:58 – 1:04 | Duration: 6.0s)
--------------------------------------------------------------------------------
Visual:     Clean dark canvas. Logo and verified features:
            "5 Splitters • Exact BPE Counting • 100% In-Browser".
            Target URL and GitHub repository displayed in monospaced typography.
            (No unexplained numbers, no "433 Invariants").
Motion:     Gentle resolve; holds steadily until 1:03.5, then 0.5s fade to black.
On-Screen:  Card 9A: "Free and open source." [4 words | Held 2.0s]
            Card 9B: "chunklensdev.vercel.app" [1 URL | Held 3.0s]
Audio:      Ambient bed resolves into a quiet resonant decay.
Claim Ref:  C-13, C-14
================================================================================
```

---

## 3. Alternative Cuts Specification

### 3.1. 30-Second Cut (16:9 Landscape)
- **Target Runtime:** 30.0s
- **Scenes Included:**
  - `0:00 – 0:03` Scene 1: The Hook (*"Your pipeline depends on its chunks."*)
  - `0:03 – 0:08` Scene 3: The Reveal (*"ChunkLens. See chunks before embedding them."*)
  - `0:08 – 0:15` Scene 4: Chunks & Sliders (*"Exact BPE token counts."*)
  - `0:15 – 0:22` Scene 5: Heatmap & Continuity (*"Spot weak boundaries and overlap."*)
  - `0:22 – 0:26` Scene 8: Privacy Proof (*"Documents never leave your machine."*)
  - `0:26 – 0:30` Scene 9: CTA (*"Free and open source. chunklensdev.vercel.app"*)

### 3.2. 15-Second Cut (9:16 Vertical — 1080×1920)
- **Target Runtime:** 15.0s
- **Safe Zone Rule:** Text and UI elements kept clear of top 14% and bottom 35% to prevent occlusion by platform overlays and mobile action buttons.
- **Scenes Included:**
  - `0:00 – 0:03` Incision Hook (*"Your pipeline depends on its chunks."*)
  - `0:03 – 0:06` Macro Reveal & Logo (*"ChunkLens."*)
  - `0:06 – 0:11` Real UI Splitter & Heatmap interaction (*"See chunks before embedding them."*)
  - `0:11 – 0:15` CTA Card (*"chunklensdev.vercel.app"*)

---

## 4. Production Pipeline Architecture & Resource Estimates

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Zero-Disk Pipe Pipeline Architecture                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. UI Asset Capture     Playwright runs against http://127.0.0.1:4173/      │
│                         - Beauty shots: Retina stills @ deviceScaleFactor 2 │
│                         - Proof shots: Real interaction clips               │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. Composition Engine   scripts/launch/film/index.html + timeline.js        │
│                         - Pure deterministic time parameter t               │
│                         - Camera moves, depth blur, parallax, easing        │
│                         - Burned-in typography (<= 7 words per card)        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. Streaming Renderer   Playwright evaluates canvas/DOM frame by frame:     │
│                         - Frames piped directly to FFmpeg stdin (image2pipe)│
│                         - ZERO intermediate PNG files written to disk!      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. FFmpeg Encoding      ffmpeg -f image2pipe -vcodec png -i - ...           │
│                         - Preview: 30 fps (rapid iteration)                 │
│                         - Final: 60 fps (ultra-smooth motion)               │
│                         - Audio normalized to -14 LUFS (loudnorm filter)    │
│                         - Output: Single master MP4 + matching .srt files   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Frame Count & Disk Usage Estimates

| Video Cut | Duration | Frame Count (@ 30 fps Preview) | Frame Count (@ 60 fps Final) | Disk Use (Traditional PNG Dump) | Disk Use (`image2pipe` Direct Stream) | Final MP4 Size |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Hero Cut (16:9)** | 63.0s | 1,890 frames | 3,780 frames | ~4.5 GB | **0 MB (0 bytes intermediate)** | ~18–25 MB |
| **Short Cut (16:9)**| 30.0s | 900 frames | 1,800 frames | ~2.1 GB | **0 MB (0 bytes intermediate)** | ~8–12 MB |
| **Vertical (9:16)** | 15.0s | 450 frames | 900 frames | ~1.1 GB | **0 MB (0 bytes intermediate)** | ~4–6 MB |

### Render Timing Benchmark (10-Second Test)
- **Playwright Headless Frame Extraction:** ~18–22 ms per frame.
- **10-Second Test (@ 30 fps = 300 frames):**
  - Frame extraction: $300 \times 20\text{ ms} = 6.0\text{ seconds}$.
  - Direct FFmpeg `libx264` stream encoding: ~1.5 seconds.
  - **Total 10-Second Test Render Time:** **~7.5 seconds**.
- **Justification for 60 fps Final:** Previews run at 30 fps for rapid visual review; final delivery at 60 fps ensures silky-smooth camera push-ins, text reveals, and cursor motion.

---

## 5. Technical Tooling Verification

- **FFmpeg Version:** `6.1.1-3ubuntu5`
- **Video Encoder:** `libx264` (H.264 / AVC 1080p, verified present)
- **Audio Encoder:** `aac` (Native AAC, verified present)
- **Audio Filter:** `loudnorm` (EBU R128 integrated loudness normalization, verified present)
- **Stream Protocol:** `image2pipe` (`-f image2pipe -vcodec png -i -`) verified operational.
- **Playwright Chromium:** Headless Chromium 1254 installed locally with `deviceScaleFactor: 2` support.
- **Runtime Dependencies Added to App:** **0** (strictly dev-only tooling in `scripts/launch/` and `docs/launch/`).
