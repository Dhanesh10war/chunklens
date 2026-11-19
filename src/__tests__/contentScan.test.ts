import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Forbidden brand & design language terms (word boundary check)
const FORBIDDEN_BRAND_TERMS = [
  'apple',
  'cupertino',
  'macos',
  'ios',
  'sf pro',
  'hig',
];

// Forbidden hype claims (hard fail)
const FORBIDDEN_HYPE_TERMS = [
  'guarantee',
  'guaranteed',
  'proven',
  'industry-standard',
  'industry benchmark',
];

function getFilesRecursively(dir: string, extensions: string[]): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getFilesRecursively(fullPath, extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('Content Authenticity & Terminology Scan', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const targetDirs = [
    path.join(rootDir, 'docs/learn'),
    path.join(rootDir, 'src/data/learning'),
    path.join(rootDir, 'src/components/learning'),
  ];

  const targetFiles = targetDirs
    .flatMap((dir) => getFilesRecursively(dir, ['.md', '.ts', '.tsx']))
    .filter((file) => !file.includes('.test.') && !file.includes('__tests__'));

  it('scans documentation and learning files for forbidden brand terms', () => {
    const brandViolations: Array<{ file: string; line: number; term: string; content: string }> = [];

    for (const file of targetFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split(/\r?\n/);

      lines.forEach((lineText, idx) => {
        // Strip code comments like "HIG" in random variables if any, but test words
        const lower = lineText.toLowerCase();
        for (const term of FORBIDDEN_BRAND_TERMS) {
          const regex = term === 'sf pro' ? /sf\s+pro/i : new RegExp(`\\b${term}\\b`, 'i');
          if (regex.test(lower)) {
            // Ignore legitimate technical vendor references if any
            brandViolations.push({
              file: path.relative(rootDir, file),
              line: idx + 1,
              term,
              content: lineText.trim(),
            });
          }
        }
      });
    }

    if (brandViolations.length > 0) {
      console.error('Forbidden Brand Term Violations:', brandViolations);
    }
    expect(brandViolations).toEqual([]);
  });

  it('scans documentation and learning files for forbidden hype terms', () => {
    const hypeViolations: Array<{ file: string; line: number; term: string; content: string }> = [];

    for (const file of targetFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split(/\r?\n/);

      lines.forEach((lineText, idx) => {
        const lower = lineText.toLowerCase();
        for (const term of FORBIDDEN_HYPE_TERMS) {
          const regex = new RegExp(`\\b${term}\\b`, 'i');
          if (regex.test(lower)) {
            hypeViolations.push({
              file: path.relative(rootDir, file),
              line: idx + 1,
              term,
              content: lineText.trim(),
            });
          }
        }
      });
    }

    if (hypeViolations.length > 0) {
      console.error('Forbidden Hype Term Violations:', hypeViolations);
    }
    expect(hypeViolations).toEqual([]);
  });

  it('generates warning-only report on always/never occurrences', () => {
    const occurrences: Array<{ file: string; line: number; term: string; snippet: string }> = [];

    for (const file of targetFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split(/\r?\n/);

      lines.forEach((lineText, idx) => {
        const match = lineText.match(/\b(always|never)\b/i);
        if (match) {
          occurrences.push({
            file: path.relative(rootDir, file),
            line: idx + 1,
            term: match[1].toLowerCase(),
            snippet: lineText.trim().slice(0, 100),
          });
        }
      });
    }

    // Warning-only output: does not fail the test
    if (occurrences.length > 0) {
      console.log(`\n[WARNING-ONLY REPORT] Found ${occurrences.length} occurrences of always/never for educational review:`);
      occurrences.slice(0, 10).forEach((o) => {
        console.log(`  - ${o.file}:${o.line} [${o.term}] "${o.snippet}"`);
      });
      if (occurrences.length > 10) {
        console.log(`  ... and ${occurrences.length - 10} more.`);
      }
    }
    expect(true).toBe(true);
  });
});
