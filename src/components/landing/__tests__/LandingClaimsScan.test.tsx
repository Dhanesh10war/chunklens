import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Landing Page Truth & Claims Scan (AUDIT F2 Ratchet)', () => {
  const FORBIDDEN_CLAIMS = [
    'SOC 2',
    'HIPAA',
    'air-gapped',
    'Haystack',
    'p50k',
    'r50k',
    '5 BPE',
    '$29',
    '$99',
    'chunklens.app',
    'local RAM',
    'leading teams',
  ];

  const landingDir = path.resolve(__dirname, '..');
  const landingFiles = fs
    .readdirSync(landingDir)
    .filter((file) => file.endsWith('.tsx') || file.endsWith('.ts'));

  it('scans all landing component source files and asserts zero forbidden marketing or unverified claims', () => {
    const violations: { file: string; forbiddenTerm: string; line: number }[] = [];

    for (const file of landingFiles) {
      const fullPath = path.join(landingDir, file);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((lineText, idx) => {
        for (const term of FORBIDDEN_CLAIMS) {
          // Case-insensitive match for the forbidden strings
          const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
          if (regex.test(lineText)) {
            violations.push({
              file,
              forbiddenTerm: term,
              line: idx + 1,
            });
          }
        }
      });
    }

    if (violations.length > 0) {
      console.error('[LandingClaimsScan FAIL] Detected forbidden unverified claims:', violations);
    }

    expect(violations).toEqual([]);
  });
});
