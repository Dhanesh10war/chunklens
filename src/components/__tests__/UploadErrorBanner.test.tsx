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
    expect(html).toContain('Dismiss');
  });

  it('remains compact without retry button for non-transient errors', () => {
    const html = renderToString(
      <UploadErrorBanner error={sampleError} onDismiss={vi.fn()} />
    );

    expect(html).not.toContain('Retry');
  });
});
