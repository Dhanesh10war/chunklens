/**
 * src/utils/heatmapColors.ts
 *
 * Precomputed, in-gamut color lookup tables and utilities for the Similarity Heatmap.
 * Generates 101-entry arrays (0% to 100%) for both Light and Dark themes.
 * Zero runtime color calculations during grid rendering.
 */

export interface HeatmapColorEntry {
  backgroundColor: string; // Exact sRGB hex in-gamut
  color: string;           // CSS variable reference for text color
  boxShadow?: string;      // 1px inset ring for high cells
}

// --- Color Science Utilities (OKLCH -> Linear sRGB -> Gamma sRGB) ---

function oklchToRgbRaw(l: number, c: number, h: number): [number, number, number] {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

  const lLin = l_ * l_ * l_;
  const mLin = m_ * m_ * m_;
  const sLin = s_ * s_ * s_;

  const rLin = +4.0767416621 * lLin - 3.3077115913 * mLin + 0.2309699292 * sLin;
  const gLin = -1.2684380046 * lLin + 2.6097574011 * mLin - 0.3413193965 * sLin;
  const bLin = -0.0041960863 * lLin - 0.7034186147 * mLin + 1.7076147010 * sLin;

  return [rLin, gLin, bLin];
}

function srgbGamma(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function oklchToHex(l: number, c: number, h: number): string {
  const [rLin, gLin, bLin] = oklchToRgbRaw(l, c, h);
  const [r, g, b] = [rLin, gLin, bLin].map((v) => {
    const clamped = Math.max(0, Math.min(1, v));
    return Math.round(srgbGamma(clamped) * 255);
  });
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

function relLuminance(rgbLin: [number, number, number]): number {
  return 0.2126 * rgbLin[0] + 0.7152 * rgbLin[1] + 0.0722 * rgbLin[2];
}

function contrastRatio(y1: number, y2: number): number {
  const max = Math.max(y1, y2);
  const min = Math.min(y1, y2);
  return (max + 0.05) / (min + 0.05);
}

function mixOklch(
  c1: [number, number, number],
  c2: [number, number, number],
  p: number
): [number, number, number] {
  const w = Math.max(0, Math.min(1, p));
  const L = (1 - w) * c1[0] + w * c2[0];
  const C = (1 - w) * c1[1] + w * c2[1];
  let h1 = c1[2];
  let h2 = c2[2];
  let diff = h2 - h1;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  const H = (h1 + w * diff + 360) % 360;
  return [L, C, H];
}

// --- Lookup Table Generator ---

function buildHeatmapLookup(isDark: boolean): readonly HeatmapColorEntry[] {
  // Exact in-gamut token parameters matching index.css
  const low: [number, number, number] = isDark ? [0.24, 0.006, 270] : [0.96, 0.004, 270];
  const mid: [number, number, number] = isDark ? [0.36, 0.06, 165] : [0.82, 0.07, 165];
  const high: [number, number, number] = isDark ? [0.48, 0.085, 165] : [0.64, 0.11, 165];

  const textLightRgb = oklchToRgbRaw(isDark ? 0.18 : 0.25, 0.01, 270);
  const textDarkRgb = oklchToRgbRaw(isDark ? 0.97 : 0.99, 0, 0);

  const yTextLight = relLuminance(textLightRgb);
  const yTextDark = relLuminance(textDarkRgb);

  const entries: HeatmapColorEntry[] = [];

  for (let pct = 0; pct <= 100; pct++) {
    const t = pct / 100;
    const te = Math.sqrt(t);

    const cellOklch =
      te < 0.5 ? mixOklch(low, mid, te * 2) : mixOklch(mid, high, (te - 0.5) * 2);

    const cellRgbLin = oklchToRgbRaw(...cellOklch);
    const yCell = relLuminance(cellRgbLin);
    const hex = oklchToHex(...cellOklch);

    const cWithLight = contrastRatio(yCell, yTextLight); // dark text
    const cWithDark = contrastRatio(yCell, yTextDark);   // light text

    const chosenText =
      cWithLight >= cWithDark ? 'var(--heat-text-on-light)' : 'var(--heat-text-on-dark)';

    const isHigh = pct >= 70;

    // Inset ring: uses chosen text color at ~55% alpha so high cells are visually distinct
    const ringStyle = isHigh
      ? `inset 0 0 0 1px color-mix(in srgb, ${chosenText} 55%, transparent)`
      : undefined;

    entries.push({
      backgroundColor: hex,
      color: chosenText,
      boxShadow: ringStyle,
    });
  }

  return Object.freeze(entries);
}

export const LIGHT_HEATMAP_LOOKUP: readonly HeatmapColorEntry[] = buildHeatmapLookup(false);
export const DARK_HEATMAP_LOOKUP: readonly HeatmapColorEntry[] = buildHeatmapLookup(true);

export function getHeatmapCellEntry(score: number, isDark: boolean): HeatmapColorEntry {
  const pct = Math.min(100, Math.max(0, Math.round(score * 100)));
  const lookup = isDark ? DARK_HEATMAP_LOOKUP : LIGHT_HEATMAP_LOOKUP;
  return lookup[pct];
}
