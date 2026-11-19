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

    // Dropzone accessibility & content
    expect(html).toContain('role="button"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('Limit: 10 MB');
    expect(html).toContain('.pdf, .md, .csv, .json, .txt, .py, .ts, .js');
    expect(html).not.toContain('100% client-side · zero network egress');
    expect(html).toContain('Choose file');
    expect(html).toContain('Tap to choose a file');
    expect(html).toContain('Drop your document here, or click to browse');
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

  it('renders paste text option with concise untruncated prompt', () => {
    const html = renderToString(
      <EmptyState
        onSelectSample={vi.fn()}
        onFileUpload={vi.fn()}
        onPasteText={vi.fn()}
        uploadError={null}
        onDismissError={vi.fn()}
      />
    );

    expect(html).toContain('Paste text');
    expect(html).toContain('Have a snippet?');
  });

  it('renders all production RAG archetype presets with calibration actions', () => {
    const html = renderToString(
      <EmptyState
        onSelectSample={vi.fn()}
        onFileUpload={vi.fn()}
        onPasteText={vi.fn()}
        uploadError={null}
        onDismissError={vi.fn()}
      />
    );

    expect(html).toContain('Production RAG Archetype Presets');
    expect(html).toContain('Developer API &amp; SDK Docs');
    expect(html).toContain('Legal Agreements &amp; Compliance');
    expect(html).toContain('Financial 10-K &amp; Tabular Reports');
    expect(html).toContain('Academic Papers &amp; Deep QA');
    expect(html).toContain('Load Benchmark Corpus');
    expect(html).toContain('Calibrate Upload');
  });
});
