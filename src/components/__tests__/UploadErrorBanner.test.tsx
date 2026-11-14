import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { UploadErrorBanner } from '../UploadErrorBanner';
import { UploadErrorInfo } from '../../hooks/useDocumentUpload';

describe('UploadErrorBanner', () => {
  const sampleError: UploadErrorInfo = {
    failedFilename: 'corrupt_report.pdf',
    reason: 'Invalid PDF format: File structure is malformed.',
    retainedDocTitle: 'Developer API Reference & Code',
    category: 'invalid',
    technicalDetail: 'InvalidPDFException: FormatError at offset 140',
  };

  it('renders role="alert" with clear error messaging, retained doc, and copyable technical detail', () => {
    const onDismiss = vi.fn();
    const html = renderToString(
      <UploadErrorBanner
        error={sampleError}
        onDismiss={onDismiss}
        onChooseAnotherFile={vi.fn()}
      />
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain('corrupt_report.pdf');
    expect(html).toContain('Invalid PDF format: File structure is malformed.');
    expect(html).toContain('Still displaying:');
    expect(html).toContain('Developer API Reference &amp; Code');
    expect(html).toContain('Technical detail:');
    expect(html).toContain('InvalidPDFException: FormatError at offset 140');
    expect(html).toContain('Choose another file');
    expect(html).toContain('aria-label="Dismiss"');
  });

  it('omits "Still displaying" line when no previous document exists', () => {
    const errorWithoutPrevDoc: UploadErrorInfo = {
      failedFilename: 'corrupt.pdf',
      reason: 'Invalid PDF format: File structure is malformed.',
      retainedDocTitle: undefined,
      category: 'invalid',
    };

    const html = renderToString(
      <UploadErrorBanner error={errorWithoutPrevDoc} onDismiss={vi.fn()} />
    );

    expect(html).toContain('corrupt.pdf');
    expect(html).not.toContain('Still displaying');
    expect(html).not.toContain('current document');
  });

  it('displays real document title without fallback when previous document exists', () => {
    const errorWithRealDoc: UploadErrorInfo = {
      failedFilename: 'corrupt.pdf',
      reason: 'Invalid PDF format: File structure is malformed.',
      retainedDocTitle: 'Quarterly Financial Performance (10-Q)',
      category: 'invalid',
    };

    const html = renderToString(
      <UploadErrorBanner error={errorWithRealDoc} onDismiss={vi.fn()} />
    );

    expect(html).toContain('Still displaying:');
    expect(html).toContain('Quarterly Financial Performance (10-Q)');
    expect(html).not.toContain('current document');
  });

  it('remains compact without retry button for non-transient errors', () => {
    const html = renderToString(
      <UploadErrorBanner error={sampleError} onDismiss={vi.fn()} />
    );

    expect(html).not.toContain('Retry');
  });

  it('renders a 2px danger left edge and danger-colored icon with verified CSS tokens (Item V4)', () => {
    const html = renderToString(
      <UploadErrorBanner error={sampleError} onDismiss={vi.fn()} />
    );

    // Verify structural elements and semantic alert role
    expect(html).toContain('role="alert"');
    expect(html).toContain('border-l-2');
    expect(html).toContain('border-l-status-danger');
    expect(html).toContain('text-status-danger');

    // Verify token definition in src/index.css and tailwind.config.js (not passing on class names alone)
    const fs = require('fs');
    const path = require('path');
    const cssContent = fs.readFileSync(path.resolve(__dirname, '../../index.css'), 'utf8');
    const tailwindConfig = fs.readFileSync(path.resolve(__dirname, '../../../tailwind.config.js'), 'utf8');

    expect(cssContent).toContain('--status-danger: var(--status-error);');
    expect(tailwindConfig).toContain("danger: 'var(--status-danger");
  });
});
