import { describe, it, expect, vi, beforeEach } from 'vitest';
import { copyToClipboard } from '../clipboard';

describe('Clipboard Utility', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false for empty input', async () => {
    const result = await copyToClipboard('');
    expect(result).toBe(false);
  });

  it('uses navigator.clipboard.writeText when available', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    const result = await copyToClipboard('test copy text');
    expect(result).toBe(true);
    expect(writeTextMock).toHaveBeenCalledWith('test copy text');
  });

  it('falls back to execCommand when navigator.clipboard fails', async () => {
    const writeTextMock = vi.fn().mockRejectedValue(new Error('Permission denied'));
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    // Mock document
    const execMock = vi.fn().mockReturnValue(true);
    vi.stubGlobal('document', {
      createElement: vi.fn(() => ({
        style: {},
        setAttribute: vi.fn(),
        select: vi.fn(),
      })),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
      execCommand: execMock,
    });

    const result = await copyToClipboard('fallback copy text');
    expect(result).toBe(true);
    expect(execMock).toHaveBeenCalledWith('copy');
  });
});
