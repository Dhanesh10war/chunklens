import { ChunkingConfig } from '../engine/types';
import { SAMPLE_DOCUMENTS } from '../data/samples';

export const STORAGE_KEY = 'chunklens_session_v1';

export interface StoredSession {
  selectedSampleId: string | null;
  documentTitle: string;
  rawText: string;
  config: ChunkingConfig;
}

export const DEFAULT_CONFIG: ChunkingConfig = {
  strategy: 'recursive',
  chunkSize: 400,
  chunkOverlap: 40,
  unit: 'tokens',
  encoding: 'o200k_base',
};

export const DEFAULT_SESSION: StoredSession = {
  selectedSampleId: 'api-reference',
  documentTitle: SAMPLE_DOCUMENTS[0].title,
  rawText: SAMPLE_DOCUMENTS[0].content,
  config: DEFAULT_CONFIG,
};

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
      return (globalThis as any).localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Safely loads session from browser localStorage with fallback to default sample.
 */
export function loadStoredSession(): StoredSession {
  const storage = getStorage();
  if (!storage) {
    return DEFAULT_SESSION;
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SESSION;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.rawText && parsed.config) {
      return {
        selectedSampleId: parsed.selectedSampleId ?? null,
        documentTitle: parsed.documentTitle || 'Untitled Document',
        rawText: parsed.rawText,
        config: {
          ...DEFAULT_CONFIG,
          ...parsed.config,
        },
      };
    }
  } catch (err) {
    console.warn('Failed to parse stored ChunkLens session:', err);
  }

  return DEFAULT_SESSION;
}

/**
 * Saves current session state to browser localStorage.
 */
export function saveStoredSession(session: StoredSession): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (err) {
    console.warn('Failed to save ChunkLens session to localStorage:', err);
  }
}

/**
 * Clears stored session state from browser localStorage.
 */
export function clearStoredSession(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear ChunkLens session:', err);
  }
}
