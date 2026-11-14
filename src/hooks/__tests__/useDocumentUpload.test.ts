import { describe, it, expect, vi } from 'vitest';
import { validateAndProcessDocumentFile, UploadErrorInfo } from '../useDocumentUpload';

describe('validateAndProcessDocumentFile', () => {
  it('rejects 0-byte files with an empty error category and retains document title', async () => {
    const onSuccess = vi.fn();
    let capturedError: UploadErrorInfo | undefined = undefined;
    const onError = vi.fn((err: UploadErrorInfo) => {
      capturedError = err;
    });

    const zeroByteFile = new File([], 'empty.txt', { type: 'text/plain' });

    const ok = await validateAndProcessDocumentFile(zeroByteFile, {
      currentDocumentTitle: 'Current Active Doc',
      onSuccess,
      onError,
    });

    expect(ok).toBe(false);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
    expect(capturedError).toBeDefined();
    if (capturedError) {
      const err: UploadErrorInfo = capturedError;
      expect(err.failedFilename).toBe('empty.txt');
      expect(err.category).toBe('empty');
      expect(err.retainedDocTitle).toBe('Current Active Doc');
      expect(err.reason).toContain('empty (0 bytes)');
    }
  });

  it('rejects files larger than 10 MB with oversize error category', async () => {
    const onSuccess = vi.fn();
    let capturedError: UploadErrorInfo | undefined = undefined;
    const onError = vi.fn((err: UploadErrorInfo) => {
      capturedError = err;
    });

    const largeBlob = new Uint8Array(10.5 * 1024 * 1024);
    const oversizeFile = new File([largeBlob], 'huge.txt', { type: 'text/plain' });

    const ok = await validateAndProcessDocumentFile(oversizeFile, {
      currentDocumentTitle: 'Current Active Doc',
      onSuccess,
      onError,
    });

    expect(ok).toBe(false);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(capturedError).toBeDefined();
    if (capturedError) {
      const err: UploadErrorInfo = capturedError;
      expect(err.category).toBe('oversize');
      expect(err.reason).toContain('10 MB limit');
    }
  });

  it('rejects unsupported file formats like .exe or .png', async () => {
    const onSuccess = vi.fn();
    let capturedError: UploadErrorInfo | undefined = undefined;
    const onError = vi.fn((err: UploadErrorInfo) => {
      capturedError = err;
    });

    const binaryFile = new File(['MZ90000000'], 'program.exe', {
      type: 'application/octet-stream',
    });

    const ok = await validateAndProcessDocumentFile(binaryFile, {
      currentDocumentTitle: 'Current Active Doc',
      onSuccess,
      onError,
    });

    expect(ok).toBe(false);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(capturedError).toBeDefined();
    if (capturedError) {
      const err: UploadErrorInfo = capturedError;
      expect(err.category).toBe('unsupported');
      expect(err.reason).toContain('not supported');
    }
  });

  it('successfully processes valid text documents and extracts format metadata', async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const validFile = new File(['# Title\n\nValid markdown content.'], 'sample.md', {
      type: 'text/markdown',
    });

    const ok = await validateAndProcessDocumentFile(validFile, {
      currentDocumentTitle: 'Current Active Doc',
      onSuccess,
      onError,
    });

    expect(ok).toBe(true);
    expect(onError).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith(
      '# Title\n\nValid markdown content.',
      'sample.md',
      expect.objectContaining({
        formatId: 'markdown',
        recommendedStrategy: 'markdown',
      })
    );
  });

  it('classifies malformed PDF structure as invalid category', async () => {
    const onSuccess = vi.fn();
    let capturedError: UploadErrorInfo | undefined = undefined;
    const onError = vi.fn((err: UploadErrorInfo) => {
      capturedError = err;
    });

    const corruptPdfFile = new File(['%PDF-1.4\ncorrupted junk bytes'], 'bad.pdf', {
      type: 'application/pdf',
    });

    const ok = await validateAndProcessDocumentFile(corruptPdfFile, {
      currentDocumentTitle: 'Retained Doc',
      onSuccess,
      onError,
    });

    expect(ok).toBe(false);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(capturedError).toBeDefined();
    if (capturedError) {
      const err: UploadErrorInfo = capturedError;
      expect(err.failedFilename).toBe('bad.pdf');
      expect(err.category).toBe('invalid');
      expect(err.reason).toContain('Invalid PDF format');
      expect(err.retainedDocTitle).toBe('Retained Doc');
    }
  });

  it('provides copyable technical detail for unknown unexpected errors and never labels them corrupt', async () => {
    const onSuccess = vi.fn();
    let capturedError: UploadErrorInfo | undefined = undefined;
    const onError = vi.fn((err: UploadErrorInfo) => {
      capturedError = err;
    });

    // A file whose arrayBuffer fails
    const badFile = {
      name: 'broken.txt',
      size: 50,
      arrayBuffer: () => Promise.reject(new Error('Hardware I/O fault (sector read failure)')),
    } as unknown as File;

    const ok = await validateAndProcessDocumentFile(badFile, {
      currentDocumentTitle: 'Active Doc',
      onSuccess,
      onError,
    });

    expect(ok).toBe(false);
    expect(capturedError).toBeDefined();
    if (capturedError) {
      const err: UploadErrorInfo = capturedError;
      expect(err.category).toBe('unknown');
      expect(err.reason).toBe('Unexpected error reading "broken.txt".');
      expect(err.technicalDetail).toContain('Hardware I/O fault');
      // Verified: NEVER labeled corrupt!
      expect(err.category).not.toBe('corrupt');
    }
  });

  it('omits retainedDocTitle when no current document exists', async () => {
    let capturedError: UploadErrorInfo | null = null;
    const zeroByteFile = new File([], 'empty.txt', { type: 'text/plain' });

    const ok = await validateAndProcessDocumentFile(zeroByteFile, {
      currentDocumentTitle: undefined,
      onSuccess: vi.fn(),
      onError: (err: UploadErrorInfo) => {
        capturedError = err;
      },
    });

    expect(ok).toBe(false);
    expect(capturedError).not.toBeNull();
    const err = capturedError as unknown as UploadErrorInfo;
    expect(err.retainedDocTitle).toBeUndefined();
  });

  it('preserves exact current document title when one exists', async () => {
    let capturedError: UploadErrorInfo | null = null;
    const zeroByteFile = new File([], 'empty.txt', { type: 'text/plain' });

    const ok = await validateAndProcessDocumentFile(zeroByteFile, {
      currentDocumentTitle: 'Attention & Retrieval in Transformer Models',
      onSuccess: vi.fn(),
      onError: (err: UploadErrorInfo) => {
        capturedError = err;
      },
    });

    expect(ok).toBe(false);
    expect(capturedError).not.toBeNull();
    const err = capturedError as unknown as UploadErrorInfo;
    expect(err.retainedDocTitle).toBe('Attention & Retrieval in Transformer Models');
  });
});
