import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Button } from '../Button';
import { SliderWithInput } from '../SliderWithInput';
import { SegmentedControl } from '../SegmentedControl';
import { Input } from '../Input';
import { Select } from '../Select';

describe('UI Primitives (SSR markup & accessibility)', () => {
  describe('Button', () => {
    it('renders with children and applies variant styles', () => {
      const html = renderToString(<Button variant="primary">Export</Button>);
      expect(html).toContain('Export');
      expect(html).toContain('bg-[var(--accent-solid)]');
      expect(html).toContain('focus-ring');
      expect(html).toContain('active-press');
    });

    it('renders secondary button with hairline border', () => {
      const html = renderToString(<Button variant="secondary">Compare</Button>);
      expect(html).toContain('Compare');
      expect(html).toContain('border-border-default');
    });

    it('supports disabled attribute', () => {
      const html = renderToString(<Button disabled>Disabled Action</Button>);
      expect(html).toContain('disabled');
      expect(html).toContain('disabled:opacity-40');
    });
  });

  describe('Input', () => {
    it('associates label with input using generated id', () => {
      const html = renderToString(<Input label="Custom Delimiters" placeholder="e.g. comma" />);
      expect(html).toContain('for="input-custom-delimiters"');
      expect(html).toContain('id="input-custom-delimiters"');
      expect(html).toContain('placeholder="e.g. comma"');
    });

    it('renders inline error text with status color', () => {
      const html = renderToString(<Input label="API Key" error="Invalid key format" />);
      expect(html).toContain('Invalid key format');
      expect(html).toContain('text-status-error');
    });
  });

  describe('Select', () => {
    it('renders select with accessible label and options', () => {
      const options = [
        { value: 'recursive', label: 'Recursive Character' },
        { value: 'fixed', label: 'Fixed Size' },
      ];
      const html = renderToString(
        <Select label="Algorithm" options={options} defaultValue="recursive" />
      );
      expect(html).toContain('for="select-algorithm"');
      expect(html).toContain('id="select-algorithm"');
      expect(html).toContain('Recursive Character');
      expect(html).toContain('Fixed Size');
    });
  });

  describe('SliderWithInput', () => {
    it('renders slider and number input with accessible labels and tabular numerals', () => {
      const html = renderToString(
        <SliderWithInput
          label="Target Size"
          value={500}
          min={50}
          max={2000}
          unitLabel="tokens"
          onChange={() => {}}
        />
      );

      expect(html).toContain('Target Size');
      expect(html).toContain('id="slider-target-size"');
      expect(html).toContain('id="input-target-size"');
      expect(html).toContain('aria-label="Target Size numeric value"');
      expect(html).toContain('value="500"');
      expect(html).toContain('tokens');
      expect(html).toContain('tabular-nums');
    });
  });

  describe('SegmentedControl', () => {
    it('renders subtle variant with tabs and selected state', () => {
      const options = [
        { value: 'tokens', label: 'Tokens' },
        { value: 'chars', label: 'Characters' },
      ];
      const html = renderToString(
        <SegmentedControl options={options} value="tokens" onChange={() => {}} />
      );

      expect(html).toContain('role="tablist"');
      expect(html).toContain('role="tab"');
      expect(html).toContain('aria-selected="true"');
      expect(html).toContain('Tokens');
      expect(html).toContain('aria-selected="false"');
      expect(html).toContain('Characters');
    });

    it('renders underline variant for view tabs', () => {
      const options = [
        { value: 'chunks', label: 'Chunks' },
        { value: 'heatmap', label: 'Heatmap' },
      ];
      const html = renderToString(
        <SegmentedControl
          variant="underline"
          options={options}
          value="chunks"
          onChange={() => {}}
        />
      );

      expect(html).toContain('border-b-2');
      expect(html).toContain('border-accent');
    });
  });

  describe('WCAG 2.2 AA Contrast & Typography Floor (Item 3.7)', () => {
    function parseHex(hex: string): [number, number, number] {
      const clean = hex.replace('#', '').trim();
      const r = parseInt(clean.substring(0, 2), 16);
      const g = parseInt(clean.substring(2, 4), 16);
      const b = parseInt(clean.substring(4, 6), 16);
      return [r, g, b];
    }

    function sRGBtoLin(val: number): number {
      const c = val / 255;
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }

    function relativeLuminance(r: number, g: number, b: number): number {
      return 0.2126 * sRGBtoLin(r) + 0.7152 * sRGBtoLin(g) + 0.0722 * sRGBtoLin(b);
    }

    function contrastRatio(hex1: string, hex2: string): number {
      const [r1, g1, b1] = parseHex(hex1);
      const [r2, g2, b2] = parseHex(hex2);
      const L1 = relativeLuminance(r1, g1, b1);
      const L2 = relativeLuminance(r2, g2, b2);
      const lighter = Math.max(L1, L2);
      const darker = Math.min(L1, L2);
      return (lighter + 0.05) / (darker + 0.05);
    }

    it('verifies primary button split tokens in index.css satisfy WCAG AA >= 4.5:1 (Amendment A)', () => {
      const fs = require('fs');
      const path = require('path');
      const cssPath = path.resolve(__dirname, '../../../index.css');
      const css = fs.readFileSync(cssPath, 'utf8');

      // Extract --accent-solid and --on-accent for root (light) and .dark
      const lightAccentMatch = css.match(/--accent-solid:\s*(#[0-9A-Fa-f]{6});/);
      const darkAccentMatch = css.match(/\.dark\s*\{[\s\S]*?--accent-solid:\s*(#[0-9A-Fa-f]{6});/);
      const onAccentMatch = css.match(/--on-accent:\s*(#[0-9A-Fa-f]{6});/);

      expect(lightAccentMatch).not.toBeNull();
      expect(darkAccentMatch).not.toBeNull();
      expect(onAccentMatch).not.toBeNull();

      const lightAccent = lightAccentMatch![1];
      const darkAccent = darkAccentMatch![1];
      const onAccent = onAccentMatch![1];

      const lightRatio = contrastRatio(lightAccent, onAccent);
      const darkRatio = contrastRatio(darkAccent, onAccent);

      // Assert exact mathematically verified ratios
      // Light: #4338CA vs #FFFFFF -> 7.90:1 (exceeds WCAG AA 4.5:1)
      expect(lightRatio).toBeGreaterThanOrEqual(4.5);
      expect(lightRatio).toBeCloseTo(7.90, 1);

      // Dark: #4F46E5 vs #FFFFFF -> 6.29:1 (exceeds WCAG AA 4.5:1)
      expect(darkRatio).toBeGreaterThanOrEqual(4.5);
      expect(darkRatio).toBeCloseTo(6.29, 1);
    });

    it('enforces 12px text floor with zero sub-12px Tailwind classes across src/ (Amendment B)', () => {
      const fs = require('fs');
      const path = require('path');

      function walk(dir: string): string[] {
        let results: string[] = [];
        const list = fs.readdirSync(dir);
        list.forEach((file: string) => {
          const full = path.join(dir, file);
          const stat = fs.statSync(full);
          if (stat && stat.isDirectory()) {
            if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
              results = results.concat(walk(full));
            }
          } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(full);
          }
        });
        return results;
      }

      const srcDir = path.resolve(__dirname, '../../../');
      const allFiles = walk(srcDir);
      const violations: string[] = [];

      const sub12Regex = /text-\[(?:[0-9]|1[01])px\]/g;
      allFiles.forEach((file) => {
        // Exclude test assertions checking for regex patterns
        if (file.endsWith('primitives.test.tsx')) return;
        const text = fs.readFileSync(file, 'utf8');
        const matches = text.match(sub12Regex);
        if (matches) {
          violations.push(`${path.relative(srcDir, file)}: ${matches.join(', ')}`);
        }
      });

      expect(violations).toEqual([]);
    });
  });
});
