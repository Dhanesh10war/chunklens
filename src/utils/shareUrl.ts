import { ChunkingConfig, ChunkingStrategy, TokenizerEncoding, ChunkUnit } from '../engine/types';

export interface SharedStatePayload {
  s: ChunkingStrategy;
  sz: number;
  ov: number;
  u: ChunkUnit;
  enc: TokenizerEncoding;
  sid?: string;
  title?: string;
}

const VALID_STRATEGIES: Set<ChunkingStrategy> = new Set([
  'recursive',
  'fixed',
  'markdown',
  'sentence',
  'tabular',
]);

const VALID_ENCODINGS: Set<TokenizerEncoding> = new Set(['o200k_base', 'cl100k_base']);

/**
 * Encodes current chunking configuration into a shareable URL string with zero backend requirements.
 */
export function generateShareableUrl(
  config: ChunkingConfig,
  sampleId?: string | null,
  title?: string
): string {
  const payload: SharedStatePayload = {
    s: config.strategy,
    sz: config.chunkSize,
    ov: config.chunkOverlap,
    u: config.unit,
    enc: config.encoding,
  };
  if (sampleId) payload.sid = sampleId;
  if (title) payload.title = title;

  try {
    const json = JSON.stringify(payload);
    const base64 = typeof window !== 'undefined' && window.btoa
      ? window.btoa(encodeURIComponent(json))
      : Buffer.from(encodeURIComponent(json)).toString('base64');
    
    if (typeof window !== 'undefined' && window.location) {
      const url = new URL(window.location.origin + window.location.pathname);
      url.searchParams.set('view', 'app');
      url.hash = `cfg=${base64}`;
      return url.toString();
    }
    return `/?view=app#cfg=${base64}`;
  } catch {
    return typeof window !== 'undefined' ? window.location.href : '';
  }
}

/**
 * Parses shared configuration from URL hash or query param.
 */
export function parseSharedConfigFromUrl(hashOrSearch?: string): {
  config: Partial<ChunkingConfig>;
  sampleId?: string;
  title?: string;
} | null {
  try {
    let rawEncoded = '';
    const input = hashOrSearch !== undefined 
      ? hashOrSearch 
      : (typeof window !== 'undefined' ? window.location.hash || window.location.search : '');

    if (input.includes('cfg=')) {
      const match = input.match(/cfg=([^&#]+)/);
      if (match && match[1]) {
        rawEncoded = match[1];
      }
    }

    if (!rawEncoded) return null;

    const decoded = typeof window !== 'undefined' && window.atob
      ? window.atob(rawEncoded)
      : Buffer.from(rawEncoded, 'base64').toString('utf-8');
    
    const json = decodeURIComponent(decoded);
    const payload = JSON.parse(json) as Partial<SharedStatePayload>;

    const config: Partial<ChunkingConfig> = {};

    if (payload.s && VALID_STRATEGIES.has(payload.s)) {
      config.strategy = payload.s;
    }
    if (typeof payload.sz === 'number' && payload.sz > 0 && payload.sz <= 10000) {
      config.chunkSize = payload.sz;
    }
    if (typeof payload.ov === 'number' && payload.ov >= 0) {
      config.chunkOverlap = payload.ov;
    }
    if (payload.u === 'tokens' || payload.u === 'characters') {
      config.unit = payload.u;
    }
    if (payload.enc && VALID_ENCODINGS.has(payload.enc)) {
      config.encoding = payload.enc;
    }

    return {
      config,
      sampleId: typeof payload.sid === 'string' ? payload.sid : undefined,
      title: typeof payload.title === 'string' ? payload.title : undefined,
    };
  } catch {
    return null;
  }
}
