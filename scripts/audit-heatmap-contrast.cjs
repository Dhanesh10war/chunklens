#!/usr/bin/env node
/**
 * scripts/audit-heatmap-contrast.cjs
 *
 * Audits WCAG 2.2 AA contrast ratios (>= 4.5:1 for body/data cells)
 * across the 0% - 100% similarity ramp for both Light and Dark themes,
 * as well as the Self cell and unified primary action (white on --accent).
 *
 * SINGLE SOURCE OF TRUTH: Parses tokens directly from src/index.css.
 * GAMUT CHECK: Enforces all RGB channels are strictly inside 0-255 before clipping.
 *
 * Zero external dependencies — pure Node.js color science.
 */

const fs = require('fs');
const path = require('path');

// --- Color Science Utilities (OKLCH -> Linear sRGB -> Gamma sRGB) ---

function oklchToRgbRaw(l, c, h) {
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

function srgbGamma(c) {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function oklchToRgb255Unclipped(l, c, h) {
  const [rLin, gLin, bLin] = oklchToRgbRaw(l, c, h);
  return [srgbGamma(rLin) * 255, srgbGamma(gLin) * 255, srgbGamma(bLin) * 255];
}

function oklchToHex(l, c, h) {
  const [r, g, b] = oklchToRgb255Unclipped(l, c, h).map((v) => {
    const clamped = Math.max(0, Math.min(255, Math.round(v)));
    return clamped.toString(16).padStart(2, '0');
  });
  return '#' + r + g + b;
}

function relLuminance(rgbLin) {
  return 0.2126 * rgbLin[0] + 0.7152 * rgbLin[1] + 0.0722 * rgbLin[2];
}

function contrastRatio(y1, y2) {
  const max = Math.max(y1, y2);
  const min = Math.min(y1, y2);
  return (max + 0.05) / (min + 0.05);
}

function mixOklch(c1, c2, p) {
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

function hexToRgbLin(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
}

function hexToOklch(hex) {
  const [rLin, gLin, bLin] = hexToRgbLin(hex);
  const l_ = Math.cbrt(0.4122214708 * rLin + 0.5363325363 * gLin + 0.0514459929 * bLin);
  const m_ = Math.cbrt(0.2119034982 * rLin + 0.6806995451 * gLin + 0.1073969566 * bLin);
  const s_ = Math.cbrt(0.0883024619 * rLin + 0.2817188376 * gLin + 0.6299787005 * bLin);

  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const b = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

  const C = Math.sqrt(a * a + b * b);
  let H = (Math.atan2(b, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return [L, C, H];
}

// --- Parse Tokens from src/index.css ---

function parseOklchToken(block, tokenName) {
  const regex = new RegExp(`${tokenName}:\\s*oklch\\(\\s*([\\d.]+)\\s+([\\d.]+)\\s+([\\d.]+)(?:\\s*\\/\\s*[\\d.]+)?\\s*\\);`);
  const match = block.match(regex);
  if (match) {
    return [parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3])];
  }
  const hexRegex = new RegExp(`${tokenName}:\\s*(#[0-9a-fA-F]{6});`);
  const hexMatch = block.match(hexRegex);
  if (hexMatch) {
    return hexToOklch(hexMatch[1]);
  }
  throw new Error(`Token ${tokenName} not found in css block`);
}

function loadTokensFromCss() {
  const cssPath = path.resolve(__dirname, '../src/index.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  // Split into light (:root) and dark ([data-theme="dark"]) blocks
  const rootBlockMatch = css.match(/(?:^|\n)\s*:root[\s\S]*?\{([\s\S]*?)\n\}/);
  const darkBlockMatch = css.match(/(?:^|\n)\s*\[data-theme="dark"\][\s\S]*?\{([\s\S]*?)\n\}/);

  if (!rootBlockMatch || !darkBlockMatch) {
    throw new Error('Failed to locate :root or [data-theme="dark"] blocks in src/index.css');
  }

  const rootBlock = rootBlockMatch[1];
  const darkBlock = darkBlockMatch[1];

  return {
    Light: {
      low: parseOklchToken(rootBlock, '--heat-low'),
      mid: parseOklchToken(rootBlock, '--heat-mid'),
      high: parseOklchToken(rootBlock, '--heat-high'),
      accent: parseOklchToken(rootBlock, '--accent'),
      textAccent: parseOklchToken(rootBlock, '--text-accent'),
      textLight: parseOklchToken(rootBlock, '--heat-text-on-light'),
      textDark: parseOklchToken(rootBlock, '--heat-text-on-dark'),
      bg: parseOklchToken(rootBlock, '--bg'),
      surface1: parseOklchToken(rootBlock, '--surface-1'),
      surface2: parseOklchToken(rootBlock, '--surface-2'),
      surface3: parseOklchToken(rootBlock, '--surface-3'),
    },
    Dark: {
      low: parseOklchToken(darkBlock, '--heat-low'),
      mid: parseOklchToken(darkBlock, '--heat-mid'),
      high: parseOklchToken(darkBlock, '--heat-high'),
      accent: parseOklchToken(darkBlock, '--accent'),
      textAccent: parseOklchToken(darkBlock, '--text-accent'),
      textLight: parseOklchToken(darkBlock, '--heat-text-on-light'),
      textDark: parseOklchToken(darkBlock, '--heat-text-on-dark'),
      bg: parseOklchToken(darkBlock, '--bg'),
      surface1: parseOklchToken(darkBlock, '--surface-1'),
      surface2: parseOklchToken(darkBlock, '--surface-2'),
      surface3: parseOklchToken(darkBlock, '--surface-3'),
    },
  };
}

// --- Audit Execution ---

function auditTheme(name, tokens) {
  console.log(`\n========================================`);
  console.log(`Theme: ${name} (Parsed from src/index.css)`);
  console.log(`========================================`);
  console.log(`--heat-low:  oklch(${tokens.low.join(' ')}) -> ${oklchToHex(...tokens.low)}`);
  console.log(`--heat-mid:  oklch(${tokens.mid.join(' ')}) -> ${oklchToHex(...tokens.mid)}`);
  console.log(`--heat-high: oklch(${tokens.high.join(' ')}) -> ${oklchToHex(...tokens.high)}`);
  console.log(`--accent:    oklch(${tokens.accent.join(' ')}) -> ${oklchToHex(...tokens.accent)}`);

  const yTextLight = relLuminance(oklchToRgbRaw(...tokens.textLight));
  const yTextDark = relLuminance(oklchToRgbRaw(...tokens.textDark));
  const yWhite = 1.0; // #FFFFFF

  let minRatio = Infinity;
  let minCellInfo = null;
  const contrastFailures = [];
  const gamutClippingFailures = [];

  // Tolerance for float precision at boundaries
  const EPS = 0.01;

  for (let pct = 0; pct <= 100; pct++) {
    const t = pct / 100;
    const te = Math.sqrt(t);
    let cellOklch;
    if (te < 0.5) {
      cellOklch = mixOklch(tokens.low, tokens.mid, te * 2);
    } else {
      cellOklch = mixOklch(tokens.mid, tokens.high, (te - 0.5) * 2);
    }

    // 1. Strict Gamut Check: All channels in [0, 255] before clipping
    const [rRaw, gRaw, bRaw] = oklchToRgb255Unclipped(...cellOklch);
    const isOutOfGamut =
      rRaw < -EPS || rRaw > 255 + EPS ||
      gRaw < -EPS || gRaw > 255 + EPS ||
      bRaw < -EPS || bRaw > 255 + EPS;

    if (isOutOfGamut) {
      gamutClippingFailures.push({
        pct,
        cellOklch: cellOklch.map((v) => Number(v.toFixed(3))),
        rgbRaw: [Number(rRaw.toFixed(2)), Number(gRaw.toFixed(2)), Number(bRaw.toFixed(2))],
      });
    }

    // 2. Contrast Check with higher-contrast text token
    const cellRgbLin = oklchToRgbRaw(...cellOklch);
    const yCell = relLuminance(cellRgbLin);
    const cWithLight = contrastRatio(yCell, yTextLight); // dark text
    const cWithDark = contrastRatio(yCell, yTextDark);   // light text

    const isLightTextHigher = cWithLight >= cWithDark;
    const chosenContrast = Math.max(cWithLight, cWithDark);
    const chosenTextName = isLightTextHigher ? 'text-on-light (dark)' : 'text-on-dark (light)';

    if (chosenContrast < minRatio) {
      minRatio = chosenContrast;
      minCellInfo = {
        pct,
        cellOklch: cellOklch.map((v) => Number(v.toFixed(3))),
        cellHex: oklchToHex(...cellOklch),
        yCell: Number(yCell.toFixed(4)),
        chosenContrast: Number(chosenContrast.toFixed(2)),
        chosenTextName,
      };
    }

    if (chosenContrast < 4.5) {
      contrastFailures.push({
        pct,
        cellOklch: cellOklch.map((v) => Number(v.toFixed(3))),
        cellHex: oklchToHex(...cellOklch),
        chosenContrast: Number(chosenContrast.toFixed(2)),
        chosenTextName,
      });
    }
  }

  // Check Accent Gamut
  const [rAcc, gAcc, bAcc] = oklchToRgb255Unclipped(...tokens.accent);
  const accentInGamut =
    rAcc >= -EPS && rAcc <= 255 + EPS &&
    gAcc >= -EPS && gAcc <= 255 + EPS &&
    bAcc >= -EPS && bAcc <= 255 + EPS;

  console.log(`\n1. In-Gamut sRGB Check (all channels in 0-255 before clipping):`);
  console.log(`   Ramp Gamut: ${gamutClippingFailures.length === 0 ? '[PASS] 0 / 101 cells clipped' : `[FAIL] ${gamutClippingFailures.length} clipped`}`);
  console.log(`   Accent Gamut: ${accentInGamut ? `[PASS] R=${rAcc.toFixed(1)}, G=${gAcc.toFixed(1)}, B=${bAcc.toFixed(1)}` : '[FAIL] Accent clipped'}`);

  console.log(`\n2. Similarity Ramp Contrast (0% - 100% in 1% steps, 101 samples):`);
  console.log(`   Minimum Contrast Ratio: ${minRatio.toFixed(2)}:1`);
  console.log(`   Sample with minimum contrast:`, minCellInfo);
  console.log(`   Status: ${contrastFailures.length === 0 ? '[PASS] 0 / 101 values below 4.5:1. Meets WCAG 2.2 AA!' : `[FAIL] ${contrastFailures.length} below 4.5:1`}`);

  // 3. Unified Primary Action & Self Cell: White text (#FFFFFF) on --accent
  const yAccent = relLuminance(oklchToRgbRaw(...tokens.accent));
  const accentContrast = contrastRatio(yWhite, yAccent);
  console.log(`\n3. Unified Accent Action & Self Cell (white on --accent):`);
  console.log(`   Contrast Ratio: ${accentContrast.toFixed(2)}:1`);
  console.log(`   Hex: ${oklchToHex(...tokens.accent)}`);
  console.log(`   Status: ${accentContrast >= 4.5 ? '[PASS] Meets >= 4.5:1' : '[FAIL] Below 4.5:1'}`);

  // 4. Real Accent Text on Surfaces (Audit for text-accent in UI)
  console.log(`\n4. Accent as Foreground Text on UI Surfaces:`);
  const surfaces = [
    { name: '--bg', oklch: tokens.bg },
    { name: '--surface-1', oklch: tokens.surface1 },
    { name: '--surface-2', oklch: tokens.surface2 },
    { name: '--surface-3', oklch: tokens.surface3 },
  ];

  const yForeground = tokens.textAccent
    ? relLuminance(oklchToRgbRaw(...tokens.textAccent))
    : yAccent;

  let accentTextFailures = 0;
  for (const s of surfaces) {
    if (!s.oklch) continue;
    const ySurface = relLuminance(oklchToRgbRaw(...s.oklch));
    const ratio = contrastRatio(ySurface, yForeground);
    const meetsAA = ratio >= 4.5;
    if (!meetsAA) accentTextFailures++;
    console.log(`   ${s.name.padEnd(14)} (${oklchToHex(...s.oklch)}): ${ratio.toFixed(2)}:1 -> ${meetsAA ? '[PASS]' : '[FAIL - below 4.5:1]'}`);
  }

  const pass = gamutClippingFailures.length === 0 && accentInGamut && contrastFailures.length === 0 && accentContrast >= 4.5;
  return pass;
}

console.log('ChunkLens Similarity Heatmap Contrast & Gamut Audit (WCAG 2.2 AA)');
const THEMES = loadTokensFromCss();
let allPassed = true;

for (const [name, tokens] of Object.entries(THEMES)) {
  const passed = auditTheme(name, tokens);
  if (!passed) allPassed = false;
}

console.log('\n========================================');
console.log(`OVERALL AUDIT RESULT: ${allPassed ? 'ALL PASSED' : 'FAILURES DETECTED'}`);
console.log('========================================\n');

process.exit(allPassed ? 0 : 1);
