import { describe, it, expect } from 'vitest';
import { executeChunking } from '../../chunkers';
import { ChunkingConfig } from '../../types';
import { ChunkWorkerRequest, ChunkWorkerResponse } from '../chunking.worker';

describe('Chunking Worker Protocol', () => {
  const sampleConfig: ChunkingConfig = {
    strategy: 'fixed',
    chunkSize: 50,
    chunkOverlap: 10,
    unit: 'characters',
    encoding: 'cl100k_base',
  };

  it('correctly processes ChunkWorkerRequest and formats ChunkWorkerResponse', () => {
    const request: ChunkWorkerRequest = {
      id: 42,
      text: 'Worker execution test for offloading tokenization tasks to background thread.',
      config: sampleConfig,
    };

    const start = performance.now();
    const result = executeChunking(request.text, request.config);
    const durationMs = Math.round((performance.now() - start) * 10) / 10;

    const response: ChunkWorkerResponse = {
      id: request.id,
      result: {
        ...result,
        executionTimeMs: durationMs,
      },
      durationMs,
    };

    expect(response.id).toBe(42);
    expect(response.result.chunks.length).toBeGreaterThan(0);
    expect(response.result.executionTimeMs).toBeGreaterThanOrEqual(0);
    expect(response.result.totalTokens).toBeGreaterThan(0);
  });

  it('handles empty text payload gracefully in worker protocol format', () => {
    const request: ChunkWorkerRequest = {
      id: 100,
      text: '',
      config: sampleConfig,
    };

    const result = executeChunking(request.text, request.config);
    expect(result.chunks.length).toBe(0);
    expect(result.totalTokens).toBe(0);
  });
});
