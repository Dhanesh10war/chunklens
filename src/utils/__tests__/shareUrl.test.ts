import { describe, it, expect } from 'vitest';
import { generateShareableUrl, parseSharedConfigFromUrl } from '../shareUrl';
import { ChunkingConfig } from '../../engine/types';

describe('Shareable URL State Utility', () => {
  const sampleConfig: ChunkingConfig = {
    strategy: 'markdown',
    chunkSize: 600,
    chunkOverlap: 60,
    unit: 'tokens',
    encoding: 'o200k_base',
  };

  it('encodes and decodes chunking configuration correctly', () => {
    const url = generateShareableUrl(sampleConfig, 'legal-contract', 'Custom Legal Spec');
    expect(url).toContain('#cfg=');

    const parsed = parseSharedConfigFromUrl(url);
    expect(parsed).not.toBeNull();
    expect(parsed?.config.strategy).toBe('markdown');
    expect(parsed?.config.chunkSize).toBe(600);
    expect(parsed?.config.chunkOverlap).toBe(60);
    expect(parsed?.config.unit).toBe('tokens');
    expect(parsed?.config.encoding).toBe('o200k_base');
    expect(parsed?.sampleId).toBe('legal-contract');
    expect(parsed?.title).toBe('Custom Legal Spec');
  });

  it('handles query param style cfg= parameter', () => {
    const url = generateShareableUrl(sampleConfig);
    const hash = url.split('#')[1];
    const parsed = parseSharedConfigFromUrl(`?${hash}`);

    expect(parsed).not.toBeNull();
    expect(parsed?.config.strategy).toBe('markdown');
    expect(parsed?.config.chunkSize).toBe(600);
  });

  it('safely handles corrupted or malformed hash values', () => {
    expect(parseSharedConfigFromUrl('#cfg=invalid_garbage_base64!!!')).toBeNull();
    expect(parseSharedConfigFromUrl('#cfg=')).toBeNull();
    expect(parseSharedConfigFromUrl('')).toBeNull();
  });

  it('ignores invalid strategies or out-of-range chunk sizes', () => {
    // Manually craft payload with malicious/invalid values
    const payload = {
      s: 'non_existent_strategy',
      sz: -500,
      ov: 99999,
      u: 'invalid_unit',
      enc: 'invalid_encoding',
    };
    const base64 = Buffer.from(encodeURIComponent(JSON.stringify(payload))).toString('base64');
    const parsed = parseSharedConfigFromUrl(`#cfg=${base64}`);

    expect(parsed).not.toBeNull();
    expect(parsed?.config.strategy).toBeUndefined();
    expect(parsed?.config.chunkSize).toBeUndefined();
  });
});
