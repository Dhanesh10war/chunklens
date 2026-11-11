import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadStoredSession, saveStoredSession, clearStoredSession, DEFAULT_SESSION } from '../storage';

describe('Session Storage Utility', () => {
  beforeEach(() => {
    // Mock localStorage
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, val: string) => {
        store[key] = val;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach((k) => delete store[k]);
      }),
    });
  });

  it('returns default session when localStorage is empty', () => {
    const session = loadStoredSession();
    expect(session.selectedSampleId).toBe('api-reference');
    expect(session.config.strategy).toBe('recursive');
    expect(session.config.chunkSize).toBe(400);
  });

  it('persists and loads custom session state', () => {
    const customSession = {
      selectedSampleId: null,
      documentTitle: 'My Custom Spec.md',
      rawText: 'Custom content here for testing.',
      config: {
        strategy: 'markdown' as const,
        chunkSize: 600,
        chunkOverlap: 60,
        unit: 'tokens' as const,
        encoding: 'o200k_base' as const,
      },
    };

    saveStoredSession(customSession);
    const loaded = loadStoredSession();

    expect(loaded.documentTitle).toBe('My Custom Spec.md');
    expect(loaded.rawText).toBe('Custom content here for testing.');
    expect(loaded.config.strategy).toBe('markdown');
    expect(loaded.config.chunkSize).toBe(600);
  });

  it('clears stored session properly', () => {
    saveStoredSession({
      selectedSampleId: null,
      documentTitle: 'Temp',
      rawText: 'Temp',
      config: DEFAULT_SESSION.config,
    });
    clearStoredSession();
    const loaded = loadStoredSession();
    expect(loaded.documentTitle).toBe(DEFAULT_SESSION.documentTitle);
  });
});
