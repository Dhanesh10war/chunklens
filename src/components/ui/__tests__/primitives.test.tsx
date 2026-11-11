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
      expect(html).toContain('bg-accent');
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
});
