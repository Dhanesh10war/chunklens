import { ChunkingConfig } from '../engine/types';
import { SAMPLE_DOCUMENTS } from '../data/samples';
import { DetectedFormatInfo } from './fileFormatDetector';

export const STORAGE_KEY = 'chunklens_session_v1';
export const MAX_PERSISTED_TEXT_BYTES = 1_048_576; // 1 MB cap

export interface StoredSession {
  selectedSampleId: string | null;
  documentTitle: string;
  rawText?: string;
  config: ChunkingConfig;
  detectedFormat?: DetectedFormatInfo | null;
  rememberDocument?: boolean;
  sidebarCollapsed?: boolean;
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
  rememberDocument: false,
  sidebarCollapsed: false,
  detectedFormat: {
    formatId: 'markdown',
    label: 'Markdown Document',
    badge: 'MD',
    extension: '.md',
    recommendedStrategy: 'markdown',
    confidence: 'high',
    description: 'Hierarchical Markdown text with H1–H6 section structure.',
  },
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
 * Safely loads session from browser localStorage.
 * AUDIT-01 & AUDIT-09 Remediation:
 * Migrates existing sessions: deletes rawText from localStorage unless rememberDocument is explicitly true.
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
    if (parsed && typeof parsed === 'object') {
      const rememberDocument = Boolean(parsed.rememberDocument);

      // Startup Migration: delete rawText from localStorage if opt-in is false
      if (parsed.rawText && !rememberDocument) {
        try {
          delete parsed.rawText;
          storage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        } catch {
          // ignore migration write failure in restricted storage
        }
      }

      // Determine in-memory rawText and documentTitle
      let inMemoryRawText = '';
      let inMemoryTitle = parsed.documentTitle || 'Untitled Document';

      if (parsed.selectedSampleId) {
        const sample = SAMPLE_DOCUMENTS.find((s) => s.id === parsed.selectedSampleId);
        if (sample) {
          inMemoryRawText = sample.content;
          inMemoryTitle = sample.title;
        }
      } else if (rememberDocument && typeof parsed.rawText === 'string') {
        inMemoryRawText = parsed.rawText;
      }

      return {
        selectedSampleId: parsed.selectedSampleId ?? null,
        documentTitle: inMemoryTitle,
        rawText: inMemoryRawText,
        detectedFormat: parsed.detectedFormat ?? null,
        rememberDocument,
        sidebarCollapsed: Boolean(parsed.sidebarCollapsed),
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
 * Saves session state to browser localStorage.
 * Privacy Rule: rawText is NEVER saved unless rememberDocument === true AND size <= 1 MB.
 * Every write is safely wrapped in try/catch.
 */
export function saveStoredSession(session: StoredSession): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    const payload: StoredSession = {
      selectedSampleId: session.selectedSampleId,
      documentTitle: session.documentTitle,
      config: session.config,
      detectedFormat: session.detectedFormat,
      rememberDocument: !!session.rememberDocument,
      sidebarCollapsed: session.sidebarCollapsed,
    };

    if (session.rememberDocument && session.rawText) {
      if (session.rawText.length <= MAX_PERSISTED_TEXT_BYTES) {
        payload.rawText = session.rawText;
      }
    }

    storage.setItem(STORAGE_KEY, JSON.stringify(payload));
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
