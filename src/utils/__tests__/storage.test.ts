import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadStoredSession,
  saveStoredSession,
  clearStoredSession,
  DEFAULT_SESSION,
  STORAGE_KEY,
  MAX_PERSISTED_TEXT_BYTES,
} from '../storage';

describe('Session Storage Privacy & Utility', () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, val: string) => {
        store[key] = val;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
    });
  });

  it('returns default session when localStorage is empty', () => {
    const session = loadStoredSession();
    expect(session.selectedSampleId).toBe('api-reference');
    expect(session.config.strategy).toBe('recursive');
    expect(session.config.chunkSize).toBe(400);
    expect(session.rememberDocument).toBe(false);
  });

  it('stops persisting rawText by default (AUDIT-01, AUDIT-09)', () => {
    saveStoredSession({
      selectedSampleId: null,
      documentTitle: 'Confidential Internal Contract.txt',
      rawText: 'SECRET PERSONAL DATA THAT MUST NOT BE PERSISTED',
      rememberDocument: false,
      config: DEFAULT_SESSION.config,
    });

    const storedJson = JSON.parse(store[STORAGE_KEY]);
    expect(storedJson.rawText).toBeUndefined();
    expect(storedJson.documentTitle).toBe('Confidential Internal Contract.txt');
    expect(storedJson.rememberDocument).toBe(false);
  });

  it('migrates legacy stored session by deleting rawText on load when opt-in is absent', () => {
    store[STORAGE_KEY] = JSON.stringify({
      selectedSampleId: null,
      documentTitle: 'Legacy Document.txt',
      rawText: 'Legacy unconsented text in localStorage',
      config: DEFAULT_SESSION.config,
    });

    const loaded = loadStoredSession();
    // In-memory text for custom document without opt-in is empty
    expect(loaded.rawText).toBe('');
    expect(loaded.rememberDocument).toBe(false);

    // Verify localStorage was updated to purge rawText
    const migratedInStorage = JSON.parse(store[STORAGE_KEY]);
    expect(migratedInStorage.rawText).toBeUndefined();
  });

  it('persists rawText when user explicitly opts in to remember document', () => {
    saveStoredSession({
      selectedSampleId: null,
      documentTitle: 'Opted In Notes.txt',
      rawText: 'User permitted local caching',
      rememberDocument: true,
      config: DEFAULT_SESSION.config,
    });

    const storedJson = JSON.parse(store[STORAGE_KEY]);
    expect(storedJson.rawText).toBe('User permitted local caching');
    expect(storedJson.rememberDocument).toBe(true);

    const loaded = loadStoredSession();
    expect(loaded.rawText).toBe('User permitted local caching');
    expect(loaded.rememberDocument).toBe(true);
  });

  it('enforces 1 MB size cap when opt-in is on', () => {
    const oversizedText = 'A'.repeat(MAX_PERSISTED_TEXT_BYTES + 100);
    saveStoredSession({
      selectedSampleId: null,
      documentTitle: 'Large File.txt',
      rawText: oversizedText,
      rememberDocument: true,
      config: DEFAULT_SESSION.config,
    });

    const storedJson = JSON.parse(store[STORAGE_KEY]);
    expect(storedJson.rawText).toBeUndefined(); // Capped: omitted from localStorage
  });

  it('gracefully handles localStorage exceptions (QuotaExceeded)', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => {
        throw new Error('QuotaExceededError');
      }),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });

    expect(() => {
      saveStoredSession({
        selectedSampleId: 'sample-1',
        documentTitle: 'Doc',
        rawText: 'Text',
        rememberDocument: false,
        config: DEFAULT_SESSION.config,
      });
    }).not.toThrow();

    consoleWarnSpy.mockRestore();
  });

  it('clears stored session state on clearStoredSession()', () => {
    saveStoredSession({
      selectedSampleId: null,
      documentTitle: 'Temporary',
      rememberDocument: false,
      config: DEFAULT_SESSION.config,
    });
    expect(store[STORAGE_KEY]).toBeDefined();

    clearStoredSession();
    expect(store[STORAGE_KEY]).toBeUndefined();
  });
});
