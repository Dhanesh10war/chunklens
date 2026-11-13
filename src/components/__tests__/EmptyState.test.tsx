import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { EmptyState } from '../EmptyState';
import { SAMPLE_DOCUMENTS } from '../../data/samples';

describe('EmptyState', () => {
  it('renders accessible dropzone stating 10 MB limit, formats, and client-side privacy guarantee', () => {
    const html = renderToString(
      <EmptyState
        onSelectSample={vi.fn()}
        onFileUpload={vi.fn()}
        onPasteText={vi.fn()}
        uploadError={null}
        onDismissError={vi.fn()}
      />
    );

    // Dropzone accessibility
    expect(html).toContain('role="button"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('Limit: 10 MB');
    expect(html).toContain('.pdf, .md, .csv, .json, .txt, .py, .ts, .js');
    expect(html).toContain('Files never leave your browser');
    expect(html).toContain('100% Client-Side · Zero Network Egress');
  });

  it('renders all bundled sample corpora cards with title, description, and size', () => {
    const html = renderToString(
      <EmptyState
        onSelectSample={vi.fn()}
        onFileUpload={vi.fn()}
        onPasteText={vi.fn()}
        uploadError={null}
        onDismissError={vi.fn()}
      />
    );

    for (const sample of SAMPLE_DOCUMENTS) {
      const escapedTitle = sample.title.replace(/&/g, '&amp;');
      expect(html).toContain(escapedTitle);
    }
    expect(html).toContain('6 bundled benchmarks');
  });

  it('renders paste raw text option', () => {
    const html = renderToString(
      <EmptyState
        onSelectSample={vi.fn()}
        onFileUpload={vi.fn()}
        onPasteText={vi.fn()}
        uploadError={null}
        onDismissError={vi.fn()}
      />
    );

    expect(html).toContain('Paste Raw Text');
  });
});
